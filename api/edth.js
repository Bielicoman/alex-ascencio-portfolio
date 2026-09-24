// EDTH · IA para perguntas livres (Vercel Serverless Function → Groq, plano gratuito).
// A chave fica só no servidor: Vercel → Settings → Environment Variables → GROQ_API_KEY.
// Sem chave responde 501 e o site segue com o motor local (src/edth/brain.js).
import { KNOWLEDGE } from "../src/edth/brain.js";

const MODEL = process.env.EDTH_MODEL || "llama-3.3-70b-versatile";
const SYSTEM = `Você é a EDTH, assistente do site de portfólio do Alex Ascencio (editor de vídeo e filmmaker).
Fale em português do Brasil, com frases curtas e naturais para serem ditas em voz alta (máx. 3 frases, sem listas, sem emoji, sem markdown).
Responda só com base nos fatos abaixo. Se não souber, diga que não tem essa informação e ofereça falar com o Alex pelo WhatsApp.
Nunca invente preços, datas ou trabalhos. Para valores, ofereça montar um orçamento.

FATOS:
${KNOWLEDGE()}

Você pode acionar o site devolvendo ações. Responda SEMPRE com JSON: {"say": "...", "actions": [...]}.
Ações permitidas:
- {"type":"nav","id":"top|filmes|lab|metodo|arquivo|sobre|contato"}
- {"type":"play","id":<id numérico de um trabalho da lista>}
- {"type":"filter","cat":"Clipes|Documentário|Cinema|Reality Show|Turnê|Bastidores|Institucional"}
- {"type":"open","href":"instagram|linkedin|whatsapp|email"}
- {"type":"download","href":"cv"}  (currículo em PDF)
- {"type":"go","href":"/curriculo/" ou "/playground/#sabre|particulas|objetos|corpo|piano|bateria|teremim|corte"}
- {"type":"tour"} (demonstração automática do site)
- {"type":"budget"} (começar orçamento por voz)
Use no máximo 2 ações e só quando o usuário pedir algo que elas resolvem.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST" });
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(501).json({ error: "sem GROQ_API_KEY" });
  let body = req.body;
  if (typeof body === "string") try { body = JSON.parse(body); } catch { body = {}; }
  const message = String(body?.message || "").slice(0, 600);
  if (!message.trim()) return res.status(400).json({ error: "mensagem vazia" });
  const history = (Array.isArray(body?.history) ? body.history : []).slice(-8)
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role, content: String(m.content || "").slice(0, 600) }));
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 400, response_format: { type: "json_object" }, messages: [{ role: "system", content: SYSTEM }, ...history, { role: "user", content: message }] }),
    });
    if (r.status === 429) return res.status(429).json({ error: "limite do plano gratuito" });
    if (!r.ok) return res.status(502).json({ error: `groq ${r.status}` });
    const j = await r.json();
    let out = {};
    try { out = JSON.parse(j.choices?.[0]?.message?.content || "{}"); } catch { out = { say: j.choices?.[0]?.message?.content || "" }; }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ say: String(out.say || "").slice(0, 700), actions: Array.isArray(out.actions) ? out.actions.slice(0, 2) : [] });
  } catch (e) {
    return res.status(502).json({ error: "falha na IA" });
  }
}
