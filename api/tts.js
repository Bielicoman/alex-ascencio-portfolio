// EDITH · voz neural (sempre a mesma, em qualquer aparelho). Ordem dos provedores:
//   ELEVENLABS_API_KEY (+ ELEVENLABS_VOICE_ID)  → pago, mais realista
//   GOOGLE_TTS_API_KEY (+ GOOGLE_TTS_VOICE)      → Google Cloud Chirp 3 HD pt-BR (Leda: timbre jovem)
//   sem chave → voz neural do Microsoft Edge (Thalita, pt-BR, jovem), gratuita e sem cadastro.
//     <lang xml:lang='pt-BR'> trava o sotaque: a voz multilíngue não troca para inglês no meio da frase.
//     Não é API oficial: se a Microsoft mudar o protocolo, cai para a voz do navegador. EDGE_TTS_VOICE troca a voz.
// GET /api/tts?probe=1 testa a síntese e devolve só o diagnóstico (provedor, bytes, erro).
import crypto from "node:crypto";
import WebSocket from "ws";

const ORIGINS = /^https:\/\/(alex-ascencio-portfolio[\w-]*\.vercel\.app)$|^http:\/\/localhost(:\d+)?$/;
const TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const EDGE_V = "143.0.3650.75";
const xml = (s) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

// token Sec-MS-GEC: SHA-256 de (ticks do Windows arredondados a 5 min + token do leitor do Edge)
function gec() {
  let s = BigInt(Math.floor(Date.now() / 1000)) + 11644473600n;
  s -= s % 300n;
  return crypto.createHash("sha256").update(`${s * 10000000n}${TOKEN}`).digest("hex").toUpperCase();
}

function edge(text, voice) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID().replace(/-/g, "");
    const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TOKEN}&Sec-MS-GEC=${gec()}&Sec-MS-GEC-Version=1-${EDGE_V}&ConnectionId=${id}`;
    const ws = new WebSocket(url, {
      headers: {
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${EDGE_V.split(".")[0]}.0.0.0 Safari/537.36 Edg/${EDGE_V}`,
        Pragma: "no-cache", "Cache-Control": "no-cache", "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    const chunks = [];
    let finished = false;
    const timer = setTimeout(() => done(new Error("timeout")), 9000);
    function done(err) {
      if (finished) return; finished = true;
      clearTimeout(timer); try { ws.terminate(); } catch {}
      err ? reject(err) : resolve(Buffer.concat(chunks));
    }
    ws.on("open", () => {
      const ts = new Date().toString();
      ws.send(`X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`);
      ws.send(`X-RequestId:${id}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='pt-BR'><voice name='${voice}'>${voice.includes("Multilingual") ? "<lang xml:lang='pt-BR'>" : ""}<prosody pitch='+4Hz' rate='+6%' volume='+0%'>${xml(text)}</prosody>${voice.includes("Multilingual") ? "</lang>" : ""}</voice></speak>`);
    });
    ws.on("message", (data, isBinary) => {
      if (isBinary) {
        const len = data.readUInt16BE(0), head = data.subarray(2, 2 + len).toString();
        if (head.includes("Path:audio")) chunks.push(data.subarray(2 + len));
      } else if (String(data).includes("Path:turn.end")) done(chunks.length ? null : new Error("sem áudio"));
    });
    ws.on("unexpected-response", (_q, r) => done(new Error("http " + r.statusCode)));
    ws.on("error", (e) => done(e));
    ws.on("close", () => done(chunks.length ? null : new Error("fechou sem áudio")));
  });
}

async function synth(text) {
  const el = process.env.ELEVENLABS_API_KEY, g = process.env.GOOGLE_TTS_API_KEY, errs = [];
  if (el) {
    const voice = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": el, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5", language_code: "pt", voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true } }),
    });
    if (r.ok) return { buf: Buffer.from(await r.arrayBuffer()), via: "elevenlabs" };
    errs.push("elevenlabs " + r.status); console.error("[tts] elevenlabs", r.status, (await r.text()).slice(0, 200));
  }
  if (g) {
    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${g}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { text }, voice: { languageCode: "pt-BR", name: process.env.GOOGLE_TTS_VOICE || "pt-BR-Chirp3-HD-Leda" }, audioConfig: { audioEncoding: "MP3", speakingRate: 1.03 } }),
    });
    if (r.ok) return { buf: Buffer.from((await r.json()).audioContent, "base64"), via: "google" };
    errs.push("google " + r.status); console.error("[tts] google", r.status, (await r.text()).slice(0, 200));
  }
  for (const v of [process.env.EDGE_TTS_VOICE, "pt-BR-ThalitaMultilingualNeural", "pt-BR-FranciscaNeural"].filter(Boolean)) {
    try { return { buf: await edge(text, v), via: "edge:" + v }; }
    catch (e) { errs.push(`edge ${v}: ${e.message}`); console.error("[tts] edge", v, e.message); }
  }
  return { errs };
}

export default async function handler(req, res) {
  if (req.method === "GET" && req.query?.probe) {
    const t0 = Date.now(), out = await synth("Oi, eu sou a Edíte.").catch((e) => ({ errs: [e.message] }));
    return res.status(200).json({ ok: !!out.buf, via: out.via, bytes: out.buf?.length || 0, ms: Date.now() - t0, errs: out.errs });
  }
  if (req.method !== "POST") return res.status(405).end();
  // só o próprio site usa a voz (evita que terceiros gastem a cota)
  const origin = req.headers.origin || (req.headers.referer || "").replace(/^(https?:\/\/[^/]+).*$/, "$1");
  if (origin && !ORIGINS.test(origin)) return res.status(403).end();
  let body = req.body;
  if (typeof body === "string") try { body = JSON.parse(body); } catch { body = {}; }
  const text = String(body?.text || "").replace(/\s+/g, " ").trim().slice(0, 600);
  if (!text) return res.status(400).end();
  try {
    const out = await synth(text);
    if (out.buf) {
      res.setHeader("Content-Type", "audio/mpeg"); res.setHeader("Cache-Control", "public, max-age=86400"); res.setHeader("X-TTS", out.via);
      return res.status(200).send(out.buf);
    }
  } catch (e) { console.error("[tts]", e.message); }
  return res.status(502).end();
}
