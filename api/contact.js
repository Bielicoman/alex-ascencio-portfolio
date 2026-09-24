// EDITH · recados de visitantes para o e-mail do Alex.
// Com RESEND_API_KEY (resend.com, grátis até 3.000/mês) envia daqui; CONTACT_TO troca o destino.
// Sem chave responde 501 e o site envia pelo FormSubmit direto do navegador (sem cadastro:
// o primeiro envio manda um e-mail de ativação para o Alex, que só precisa clicar em "Activate").
const ORIGINS = /^https:\/\/(alex-ascencio-portfolio[\w-]*\.vercel\.app)$|^http:\/\/localhost(:\d+)?$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const origin = req.headers.origin || (req.headers.referer || "").replace(/^(https?:\/\/[^/]+).*$/, "$1");
  if (origin && !ORIGINS.test(origin)) return res.status(403).end();
  let b = req.body;
  if (typeof b === "string") try { b = JSON.parse(b); } catch { b = {}; }
  const name = String(b?.name || "").trim().slice(0, 120), email = String(b?.email || "").trim().slice(0, 200), msg = String(b?.message || "").trim().slice(0, 4000);
  const subject = String(b?.subject || "Recado pelo site").slice(0, 140);
  if (!EMAIL.test(email) || !msg) return res.status(400).json({ error: "dados" });
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(501).json({ error: "sem RESEND_API_KEY" });
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "EDITH <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO || "ascencioalexgabriel@gmail.com"],
      reply_to: email,
      subject: `${subject} · ${name || email}`,
      text: `Nome: ${name || "—"}\nE-mail: ${email}\n\n${msg}\n\n— enviado pela EDITH, no site`,
      html: `<p><b>Nome:</b> ${esc(name || "—")}<br><b>E-mail:</b> ${esc(email)}</p><p style="white-space:pre-line">${esc(msg)}</p><p style="color:#888">— enviado pela EDITH, no site</p>`,
    }),
  });
  if (r.ok) return res.status(200).json({ ok: true });
  console.error("[contact] resend", r.status, (await r.text()).slice(0, 200));
  return res.status(502).json({ error: "falha" });
}
