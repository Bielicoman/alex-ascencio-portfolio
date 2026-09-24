// EDTH · voz neural (sempre a mesma, em qualquer aparelho). Provedores por variável de ambiente no Vercel:
//   ELEVENLABS_API_KEY (+ ELEVENLABS_VOICE_ID opcional)  → mais realista (eleven_flash_v2_5, multilíngue)
//   GOOGLE_TTS_API_KEY (+ GOOGLE_TTS_VOICE opcional)      → Google Cloud Chirp 3 HD pt-BR (Leda: timbre jovem)
// Sem nenhuma chave responde 501 e o site usa a voz do navegador.
const ORIGINS = /^https:\/\/(alex-ascencio-portfolio[\w-]*\.vercel\.app)$|^http:\/\/localhost(:\d+)?$/;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  // só o próprio site usa a voz (evita que terceiros gastem a cota)
  const origin = req.headers.origin || (req.headers.referer || "").replace(/^(https?:\/\/[^/]+).*$/, "$1");
  if (origin && !ORIGINS.test(origin)) return res.status(403).end();
  let body = req.body;
  if (typeof body === "string") try { body = JSON.parse(body); } catch { body = {}; }
  const text = String(body?.text || "").replace(/\s+/g, " ").trim().slice(0, 600);
  if (!text) return res.status(400).end();

  const el = process.env.ELEVENLABS_API_KEY, g = process.env.GOOGLE_TTS_API_KEY;
  try {
    if (el) {
      const voice = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // "Sarah" (feminina, multilíngue) até escolher uma brasileira
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
        method: "POST",
        headers: { "xi-api-key": el, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5", language_code: "pt", voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true } }),
      });
      if (r.ok) { res.setHeader("Content-Type", "audio/mpeg"); res.setHeader("Cache-Control", "public, max-age=86400"); return res.status(200).send(Buffer.from(await r.arrayBuffer())); }
      console.error("[tts] elevenlabs", r.status, (await r.text()).slice(0, 200));
    }
    if (g) {
      const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${g}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: { text }, voice: { languageCode: "pt-BR", name: process.env.GOOGLE_TTS_VOICE || "pt-BR-Chirp3-HD-Leda" }, audioConfig: { audioEncoding: "MP3", speakingRate: 1.03 } }),
      });
      if (r.ok) { const j = await r.json(); res.setHeader("Content-Type", "audio/mpeg"); res.setHeader("Cache-Control", "public, max-age=86400"); return res.status(200).send(Buffer.from(j.audioContent, "base64")); }
      console.error("[tts] google", r.status, (await r.text()).slice(0, 200));
    }
  } catch (e) { console.error("[tts]", e.message); }
  return res.status(el || g ? 502 : 501).end();
}
