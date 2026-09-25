// EDITH · IA para conversa livre (Vercel Serverless Function → Groq, plano gratuito).
// A chave fica só no servidor: Vercel → Environment Variables → GROQ_API_KEY.
// Sem chave responde 501 e o site segue com o motor local (src/edth/brain.js).
import { KNOWLEDGE } from "../src/edth/brain.js";

// modelos em ordem de preferência; a lista real da conta é consultada e cacheada (a Groq aposenta modelos)
const PREF = [process.env.EDTH_MODEL, "openai/gpt-oss-120b", "llama-3.3-70b-versatile", "moonshotai/kimi-k2-instruct", "qwen/qwen3-32b", "meta-llama/llama-4-maverick-17b-128e-instruct", "openai/gpt-oss-20b", "llama-3.1-8b-instant"].filter(Boolean);
let MODELS = null, MODELS_AT = 0, ALL = [];
async function models(key) {
  if (MODELS && Date.now() - MODELS_AT < 6 * 3600e3) return MODELS;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
    if (r.ok) {
      const ids = new Set(((await r.json()).data || []).map((m) => m.id));
      ALL = [...ids];
      const pick = PREF.filter((m) => ids.has(m));
      const extra = [...ids].filter((id) => /llama|gpt-oss|qwen|kimi/i.test(id) && !/guard|whisper|tts|prompt/i.test(id) && !pick.includes(id));
      MODELS = [...pick, ...extra].slice(0, 4); MODELS_AT = Date.now();
      if (MODELS.length) return MODELS;
    } else console.error("[edth] models", r.status, (await r.text()).slice(0, 200));
  } catch (e) { console.error("[edth] models", e.message); }
  return PREF.slice(0, 4);
}

const now = () => new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const SYSTEM = () => `Agora é ${now()} (horário de Brasília).
Você é uma especialista na Bíblia e possui domínio teológico absoluto, capaz de resolver dúvidas bíblicas complexas usando exclusivamente a Bíblia e a filosofia teológica da Igreja Adventista do Sétimo Dia (IASD). Você domina suas doutrinas fundamentais (Sábado, Juízo Investigativo, Santuário, Estado dos Mortos, Grande Conflito), a interpretação profética historicista de Daniel e Apocalipse, a vida e os escritos do Espírito de Profecia (Ellen G. White), bem como a estrutura mundial da Igreja (Conferência Geral, Divisões, Uniões, Associações, Missões) e seus ministérios (Desbravadores, Aventureiros, Ministério Jovem, Escola Sabatina, Ministério Pessoal, Comunicação, ADRA, Rede Novo Tempo, etc).
Sempre que for pertinente ou solicitado, cite, procure e fale os textos completos da Bíblia (na tradução João Ferreira de Almeida ou Nova Versão Internacional) e faça referências cruzadas exatas.
O Alex Ascencio (criador deste site) trabalha diretamente prestando serviços audiovisuais para a União Noroeste Brasileira (UNoB) e outros escritórios adventistas. Se o usuário perguntar sobre a Bíblia, teologia adventista, Ellen White, profecias, notícias da IASD ou sobre a UNoB, você deve demonstrar fluência exegética e institucional completa. 
Sobre o projeto OneVoice27: É uma iniciativa missionária global da IASD com o objetivo de proclamar o evangelho de forma sincronizada, unindo a igreja mundial numa mensagem única: "Jesus faz tudo novo". O ápice será em setembro de 2027 (marcando os 2.000 anos do batismo e início do ministério de Cristo). O foco é que cada membro use seus dons e redes sociais para que milhares de vozes falem a mesma mensagem.
Para atualizações e notícias recentes da Igreja, sinta-se livre para usar sua função de busca na web.

FATOS:
${KNOWLEDGE()}

REGRA DE FORMATAÇÃO: nunca use markdown (nada de **, ##, ```, \n\n, listas numeradas). Escreva como fala natural, com frases corridas. Se precisar separar tópicos, use vírgulas ou ponto e vírgula.
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
- {"type":"message"} (a pessoa quer mandar um recado ou e-mail para o Alex)
- {"type":"close_video"} (fechar o vídeo aberto)
Use no máximo 2 ações e só quando o usuário pedir algo que elas resolvem. Em conversa comum, "actions": [].
Pesquisa na internet: se a resposta depender de informação atual ou que você não sabe com certeza (notícias, clima, jogos, cotações, preços, eventos, pessoas, lugares, qualquer fato fora do site), não chute: responda {"say": "", "search": "<consulta curta em português para a web>", "actions": []}.`;

// busca na web: ferramenta browser_search da Groq nos modelos gpt-oss (ou um sistema "compound", se a conta tiver)
async function webSearch(key, question, query) {
  await models(key);
  const sys = `Agora é ${now()} (horário de Brasília). Pesquise na web e responda em português do Brasil, em no máximo duas frases curtas, só o essencial, como fala natural. Sem markdown, sem links, sem citar fontes.`;
  const tries = [
    ...["openai/gpt-oss-120b", "openai/gpt-oss-20b"].filter((m) => !ALL.length || ALL.includes(m)).map((model) => ({ model, tools: [{ type: "browser_search" }], tool_choice: "required" })),
    ...ALL.filter((m) => /compound/i.test(m)).map((model) => ({ model })),
  ];
  for (const t of tries) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...t, temperature: 0.3, max_completion_tokens: 1200, messages: [
          { role: "system", content: sys },
          { role: "user", content: `${question}\n(consulta sugerida: ${query})` },
        ] }),
      });
      if (!r.ok) { console.error("[edth] search", t.model, r.status, (await r.text()).slice(0, 200)); continue; }
      const txt = ((await r.json()).choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").replace(/【[^】]*】/g, "").replace(/\[(\d+|[^\]]*)\]\([^)]*\)|\[\d+\]|[*_#`]/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
      if (txt) return { say: txt, model: t.model };
    } catch (e) { console.error("[edth] search", t.model, e.message); }
  }
  return null;
}

const parse = (txt) => {
  if (!txt) return {};
  const t = txt.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  try { return JSON.parse(t); } catch {}
  const m = t.match(/\{[\s\S]*\}/); // modelo que escreve texto em volta do JSON
  if (m) try { return JSON.parse(m[0]); } catch {}
  return { say: t };
};

export default async function handler(req, res) {
  const key = process.env.GROQ_API_KEY;
  // diagnóstico fixo (não aceita pergunta livre): GET /api/edth?probe=1
  if (req.method === "GET" && req.query?.probe) {
    if (!key) return res.status(501).json({ error: "sem GROQ_API_KEY" });
    const t0 = Date.now(), w = await webSearch(key, "Quanto está o dólar hoje em reais?", "cotação dólar hoje");
    return res.status(200).json({ ok: !!w, model: w?.model, say: w?.say, ms: Date.now() - t0, now: now() });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "POST" });
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
  const history = (Array.isArray(body?.history) ? body.history : []).slice(-20)
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role, content: String(m.content || "").slice(0, 600) }));
  const messages = [{ role: "system", content: SYSTEM() }, ...history, { role: "user", content: message }];
  for (const model of await models(key)) {
    for (const json of [true, false]) { // se o modo JSON falhar nesse modelo, tenta sem ele e extrai o JSON do texto
      try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, temperature: 0.6, max_tokens: 800, ...(json ? { response_format: { type: "json_object" } } : {}), messages }),
        });
        if (r.status === 429) { console.error("[edth] 429", model); break; }
        if (!r.ok) { console.error("[edth]", model, json ? "json" : "text", r.status, (await r.text()).slice(0, 300)); continue; }
        const j = await r.json();
        const out = parse(j.choices?.[0]?.message?.content);
        res.setHeader("Cache-Control", "no-store");
        if (out.search) {
          const w = await webSearch(key, message, String(out.search).slice(0, 200));
          return res.status(200).json({ say: (w?.say || "Não consegui pesquisar agora. Tenta de novo daqui a pouco?").slice(0, 400), actions: [], model: w?.model || model, searched: !!w });
        }
        if (!out.say) continue;
        return res.status(200).json({ say: String(out.say).slice(0, 1200), actions: Array.isArray(out.actions) ? out.actions.slice(0, 2) : [], model });
      } catch (e) { console.error("[edth]", model, e.message); }
    }
  }
  return res.status(502).json({ error: "falha na IA" });
}
