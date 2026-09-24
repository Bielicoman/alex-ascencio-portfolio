import { make2d } from "../canvas2d";
import * as A from "../audio";

// Teremim: mão direita (a mais à direita na tela) define a altura pela posição horizontal
// (4 oitavas, A2–A6) e o volume pela altura da mão. A outra mão: subir = vibrato, pinça = afinação
// presa à escala (lá menor pentatônica). Mouse/toque: segure e mova.
const PENTA = [0, 3, 5, 7, 10];
const NAMES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

export default {
  id: "teremim", name: "Teremim",
  hint: [["point", "Mão direita ↔ altura"], ["drag", "Mão direita ↕ volume"], ["hand", "Mão esquerda alta: vibrato"], ["pinch", "Pinça esquerda: afina na escala"]],
  mount(host) {
    const S = make2d(host), g = S.g;
    let voice = null, snap = false, cur = { f: 220, v: 0, x: 0.5, y: 0.5 }, t = 0;
    const buf = new Float32Array(2048);
    const semis = (x) => x * 48; // 4 oitavas a partir de A2 (110 Hz)
    return {
      frame(dt, hands) {
        t += dt;
        const W = S.W, H = S.H;
        const cams = hands.filter((h) => h.src === "cam").sort((a, b) => a.x - b.x);
        let lead = null, mod = null;
        if (cams.length) { lead = cams[cams.length - 1]; mod = cams.length > 1 ? cams[0] : null; }
        else lead = hands.find((h) => h.pinch) || null;
        snap = !!mod?.pinch;
        if (lead) {
          const p = S.local(lead.x, lead.y);
          const x = Math.min(1, Math.max(0, p.x / W)), y = Math.min(1, Math.max(0, p.y / H));
          let s = semis(x);
          if (snap) { const o = Math.floor(s / 12), r = s - o * 12; let best = 0; for (const q of [...PENTA, 12]) if (Math.abs(q - r) < Math.abs(best - r)) best = q; s = o * 12 + best; }
          cur.x = x; cur.y = y; cur.f = 110 * Math.pow(2, s / 12); cur.v = Math.pow(1 - y, 1.3); cur.s = s;
          if (!voice) { voice = A.theremin(); }
          const vib = mod ? Math.max(0, 1 - S.local(mod.x, mod.y).y / H) : 0;
          voice.set(cur.f, cur.v, vib, 1 - y);
        } else if (voice) { voice.stop(); voice = null; }

        // ── desenho: régua de notas, forma de onda, cursor ──
        g.clearRect(0, 0, W, H);
        g.font = "500 10.5px 'Geist Mono Variable', monospace"; g.textAlign = "center";
        for (let s = 0; s <= 48; s++) {
          const x = (s / 48) * W, n = NAMES[s % 12], inScale = PENTA.includes(s % 12);
          g.fillStyle = inScale ? (snap ? "rgba(255,59,59,.85)" : "rgba(255,255,255,.4)") : "rgba(255,255,255,.1)";
          g.fillRect(x, H - 34, 1, inScale ? 14 : 7);
          if (inScale) g.fillText(n + (Math.floor((s + 9) / 12) + 2), x, H - 42);
        }
        // volume: régua vertical
        g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(28, 80, 2, H - 180);
        g.fillStyle = "#ff3b3b"; g.fillRect(24, 80 + (H - 180) * (1 - cur.v), 10, 3);
        g.save(); g.translate(18, H / 2); g.rotate(-Math.PI / 2); g.fillStyle = "rgba(255,255,255,.4)"; g.fillText("VOLUME", 0, 0); g.restore();
        // forma de onda real (analisador)
        g.lineWidth = 2.2; g.strokeStyle = "#ff3b3b"; g.shadowColor = "#ff3b3b"; g.shadowBlur = 18;
        g.beginPath();
        if (voice) {
          voice.an.getFloatTimeDomainData(buf);
          let z = 0; for (let i = 1; i < 1024; i++) if (buf[i - 1] < 0 && buf[i] >= 0) { z = i; break; } // trava no cruzamento por zero
          for (let i = 0; i < 900; i++) { const x = (i / 900) * W, y = H * 0.45 + buf[z + i] * H * 0.5; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        } else {
          for (let i = 0; i <= 120; i++) { const x = (i / 120) * W, y = H * 0.45 + Math.sin(i * 0.2 + t * 2) * 3; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        }
        g.stroke(); g.shadowBlur = 0;
        // leitura
        if (lead) {
          const px = cur.x * W, py = cur.y * H;
          g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.setLineDash([3, 6]);
          g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke(); g.setLineDash([]);
          g.fillStyle = "#fff"; g.font = "600 28px 'Geist Variable', sans-serif"; g.textAlign = "left";
          const n = NAMES[Math.round(cur.s) % 12] + (Math.floor((Math.round(cur.s) + 9) / 12) + 2);
          g.fillText(n, Math.min(W - 160, px + 16), Math.max(40, py - 16));
          g.font = "500 11px 'Geist Mono Variable', monospace"; g.fillStyle = "rgba(255,255,255,.55)";
          g.fillText(`${cur.f.toFixed(1)} HZ${snap ? " · ESCALA" : ""}`, Math.min(W - 160, px + 16), Math.max(40, py - 16) + 20);
        } else {
          g.fillStyle = "rgba(255,255,255,.55)"; g.font = "500 15px 'Geist Variable', sans-serif"; g.textAlign = "center";
          g.fillText("Levante a mão (ou segure o clique) para tocar", W / 2, H * 0.3);
        }
      },
      resize: S.resize,
      dispose() { voice?.stop(); S.dispose(); },
    };
  },
};
