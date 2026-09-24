// Comandos de voz (Web Speech API, pt-BR). Reconhecimento contínuo; cada frase final é comparada
// com a lista de comandos por palavras-chave (sem acento, sem caixa). Chrome/Edge/Safari; Firefox não tem.
// Obs.: no Chrome o áudio é processado pelo serviço de voz do Google.
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export const voiceSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// commands: [{ say: ["ver demonstracao", "assistir o site"], run: () => {}, label: "Tour" }]
export function startVoice({ commands, onHeard, onState }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onState?.("unsupported"); return () => {}; }
  const rec = new SR();
  rec.lang = "pt-BR"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 3;
  let alive = true, lastRun = 0;
  const list = commands.map((c) => ({ ...c, keys: c.say.map(norm) }));
  const match = (text) => {
    const t = " " + norm(text) + " ";
    let best = null;
    for (const c of list) for (const k of c.keys) if (t.includes(" " + k + " ") && (!best || k.length > best.k.length)) best = { c, k };
    return best?.c || null;
  };
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const alts = [...r].map((a) => a.transcript);
      onHeard?.(alts[0], r.isFinal);
      // comando curto dispara já no resultado parcial (latência menor); frase longa espera o final
      let cmd = null;
      for (const a of alts) { cmd = match(a); if (cmd) break; }
      if (cmd && performance.now() - lastRun > 1200) { lastRun = performance.now(); onHeard?.(alts[0], true, cmd); cmd.run(); }
    }
  };
  rec.onstart = () => onState?.("on");
  rec.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") { alive = false; onState?.("denied"); }
    else if (e.error !== "no-speech" && e.error !== "aborted") onState?.("error:" + e.error);
  };
  rec.onend = () => { if (alive) try { rec.start(); } catch {} else onState?.("off"); }; // o Chrome encerra sozinho após silêncio
  try { rec.start(); } catch { onState?.("error"); }
  return () => { alive = false; try { rec.abort(); } catch {} onState?.("off"); };
}
