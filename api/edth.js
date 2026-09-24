// EDTH · IA para perguntas livres (Vercel Serverless Function → Groq, plano gratuito).
// A chave fica só no servidor: Vercel → Environment Variables → GROQ_API_KEY.
// Sem chave responde 501 e o site segue com o motor local (src/edth/brain.js).
import { KNOWLEDGE } from "../src/edth/brain.js";

// modelos em ordem de preferência; a lista real da conta é consultada e cacheada (a Groq aposenta modelos)
const PREF = [process.env.EDTH_MODEL, "openai/gpt-oss-120b", "llama-3.3-70b-versatile", "moonshotai/kimi-k2-instruct", "qwen/qwen3-32b", "meta-llama/llama-4-maverick-17b-128e-instruct", "openai/gpt-oss-20b", "llama-3.1-8b-instant"].filter(Boolean);
let MODELS = null, MODELS_AT = 0;
async function models(key) {
  if (MODELS && Date.now() - MODELS_AT < 6 * 3600e3) return MODELS;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
    if (r.ok) {
      const ids = new Set(((await r.json()).data || []).map((m) => m.id));
      const pick = PREF.filter((m) => ids.has(m));
      const extra = [...ids].filter((id) => /llama|gpt-oss|qwen|kimi/i.test(id) && !/guard|whisper|tts|prompt/i.test(id) && !pick.includes(id));
      MODELS = [...pick, ...extra].slice(0, 4); MODELS_AT = Date.now();
      if (MODELS.length) return MODELS;
    } else console.error("[edth] models", r.status, (await r.text()).slice(0, 200));
  } catch (e) { console.error("[edth] models", e.message); }
  return PREF.slice(0, 4);
}

const SYSTEM = `Você é a EDTH, assistente do site de portfólio do Alex Ascencio (editor de vídeo e filmmaker).
Fale em português do Brasil, com frases curtas e naturais para serem ditas em voz alta (máx. 3 frases, sem listas, sem emoji, sem markdown).
Responda só com base nos fatos abaixo. Se não souber, diga que não tem essa informação e ofereça falar com o Alex pelo WhatsApp.
Nunca invente preços, datas ou trabalhos. Para valores, ofereça montar um orçamento.

FATOS:
${KNOWLEDGE()}

Você pode acionar o site devolvendo ações. Responda SEMPRE e SOMENTE com um objeto JSON: {"say": "...", "actions": [...]}.
Ações permitidas:
- {"type":"nav","id":"top|filmes|lab|metodo|arquivo|sobre|contato"}
- {"type":"play","id":<id numérico de um trabalho da lista>}  (use para "abrir/assistir/ver um vídeo")
- {"type":"filter","cat":"Clipes|Documentário|Cinema|Reality Show|Turnê|Bastidores|Institucional"}
- {"type":"open","href":"instagram|linkedin|whatsapp|email"}
- {"type":"download","href":"cv"}  (currículo em PDF)
- {"type":"go","href":"/curriculo/" ou "/playground/#sabre|particulas|objetos|corpo|piano|bateria|teremim|corte"}
- {"type":"tour"} (demonstração automática do site)
- {"type":"budget"} (começar orçamento por voz)
Use no máximo 2 ações e só quando o usuário pedir algo que elas resolvem.`;

const parse = (txt) => {
  if (!txt) return {};
  const t = txt.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  try { return JSON.parse(t); } catch {}
  const m = t.match(/\{[\s\S]*\}/); // modelo que escreve texto em volta do JSON
  if (m) try { return JSON.parse(m[0]); } catch {}
  return { say: t };
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST" });
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(501).json({ error: "sem GROQ_API_KEY" });
  let body = req.body;
  if (typeof body === "string") try { body = JSON.parse(body); } catch { body = {}; }
  // modo briefing: reescreve a fala do cliente como briefing organizado (sem inventar nada)
  if (body?.mode === "brief") {
    const raw = String(body.raw || "").slice(0, 1500);
    if (!raw.trim()) return res.status(400).json({ error: "vazio" });
    const prompt = `Transforme a fala de um cliente em um briefing de produção audiovisual, em português do Brasil.
Tipo de projeto: ${String(body.kind || "não informado").slice(0, 60)}. Prazo: ${String(body.when || "não informado").slice(0, 60)}.
Fala do cliente: """${raw}"""
Regras: tópicos curtos, um por linha, no formato "Rótulo: conteúdo". Use só o que foi dito; não invente nada; omita tópicos sem informação.
Rótulos possíveis, nesta ordem: Ideia, Estilo / referência, Duração, Formato, Plataforma / entrega, Uso de IA, Público, Observações.
Corrija erros de transcrição óbvios (ex.: "ia" = IA). Máximo 8 linhas.
Responda somente JSON: {"brief": "linha1\nlinha2"}`;
    for (const model of await models(key)) {
      try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, temperature: 0.2, max_tokens: 400, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
        });
        if (!r.ok) { console.error("[edth] brief", model, r.status, (await r.text()).slice(0, 200)); if (r.status === 429) break; continue; }
        const out = parse((await r.json()).choices?.[0]?.message?.content);
        if (out.brief) return res.status(200).json({ brief: String(out.brief).slice(0, 2000) });
      } catch (e) { console.error("[edth] brief", e.message); }
    }
    return res.status(502).json({ error: "falha" });
  }
  const message = String(body?.message || "").slice(0, 600);
  if (!message.trim()) return res.status(400).json({ error: "mensagem vazia" });
  const history = (Array.isArray(body?.history) ? body.history : []).slice(-8)
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role, content: String(m.content || "").slice(0, 600) }));
  const messages = [{ role: "system", content: SYSTEM }, ...history, { role: "user", content: message }];
  for (const model of await models(key)) {
    for (const json of [true, false]) { // se o modo JSON falhar nesse modelo, tenta sem ele e extrai o JSON do texto
      try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, temperature: 0.4, max_tokens: 500, ...(json ? { response_format: { type: "json_object" } } : {}), messages }),
        });
        if (r.status === 429) { console.error("[edth] 429", model); break; }
        if (!r.ok) { console.error("[edth]", model, json ? "json" : "text", r.status, (await r.text()).slice(0, 300)); continue; }
        const j = await r.json();
        const out = parse(j.choices?.[0]?.message?.content);
        if (!out.say) continue;
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({ say: String(out.say).slice(0, 700), actions: Array.isArray(out.actions) ? out.actions.slice(0, 2) : [], model });
      } catch (e) { console.error("[edth]", model, e.message); }
    }
  }
  return res.status(502).json({ error: "falha na IA" });
}
