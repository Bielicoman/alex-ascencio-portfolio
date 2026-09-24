import { make2d, rr } from "../canvas2d";
import * as A from "../audio";

// Piano de 2 oitavas (C4–C6). Com a câmera, cada ponta de dedo (indicador ao mínimo) toca ao
// "afundar" abaixo da linha de toque; a velocidade da descida vira dinâmica. Mouse, toque e
// teclado do computador (A W S E D F T G Y H U J K) também tocam.
const LO = 60, HI = 84;
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEYMAP = "awsedftgyhujkolp;'".split(""); // C4 → F5
const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);

export default {
  id: "piano", name: "Piano",
  hint: [["point", "Dedos acima da linha vermelha"], ["drag", "Desça o dedo: nota"], ["hand", "Mais rápido = mais forte"], ["keys", "Teclado: A W S E D F…"]],
  mount(host) {
    const S = make2d(host), g = S.g;
    const keys = []; let whites = 0;
    for (let m = LO; m <= HI; m++) keys.push({ m, black: isBlack(m), wi: isBlack(m) ? whites - 1 : whites++, glow: 0, down: 0 });
    let geo;
    const layout = () => {
      const W = S.W, H = S.H, kw = Math.min(92, (W - 40) / whites), x0 = (W - kw * whites) / 2, top = H * 0.46, kh = Math.min(H * 0.44, kw * 4.2);
      geo = { kw, x0, top, kh, line: top + kh * 0.2 };
      for (const k of keys) {
        if (k.black) { k.x = x0 + (k.wi + 1) * kw - kw * 0.31; k.w = kw * 0.62; k.y = top; k.h = kh * 0.62; }
        else { k.x = x0 + k.wi * kw; k.w = kw; k.y = top; k.h = kh; }
      }
    };
    layout();
    const keyAt = (x, y) => {
      for (const k of keys) if (k.black && x >= k.x && x <= k.x + k.w && y >= k.y - 40 && y <= k.y + k.h) return k;
      for (const k of keys) if (!k.black && x >= k.x && x <= k.x + k.w && y >= k.y - 40 && y <= k.y + k.h) return k;
      return null;
    };
    const notes = []; // nomes que sobem ao tocar
    const play = (k, vel) => {
      A.piano(k.m, vel, ((k.x + k.w / 2) / S.W - 0.5) * 1.2);
      k.glow = 1; k.down++;
      notes.push({ x: k.x + k.w / 2, y: k.y - 18, t: 0, n: NAMES[k.m % 12] + Math.floor(k.m / 12 - 1), v: vel });
    };
    const fing = new Map(); // id:dedo → { key, down }
    const kb = new Map();
    const onKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey) return;
      const i = KEYMAP.indexOf(e.key.toLowerCase()); if (i < 0) return;
      const k = keys[i]; if (!k) return;
      if (e.type === "keydown" && !kb.has(e.key)) { A.unlock(); play(k, 0.8); kb.set(e.key, k); }
      if (e.type === "keyup" && kb.has(e.key)) { kb.get(e.key).down--; kb.delete(e.key); }
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);

    return {
      frame(dt, hands) {
        const W = S.W, H = S.H;
        const alive = new Set();
        for (const h of hands) {
          const cam = h.src === "cam";
          h.fingers.forEach((p0, i) => {
            const p = S.local(p0.x, p0.y), prev = h.pf[i] ? S.local(h.pf[i].x, h.pf[i].y) : p;
            const id = h.id + ":" + i; alive.add(id);
            let f = fing.get(id); if (!f) { f = { key: null, down: false }; fing.set(id, f); }
            // câmera: abaixo da linha = pressionado (histerese 14 px); mouse/toque: pinça = pressionado
            const pressed = cam ? (f.down ? p.y > geo.line - 14 : p.y > geo.line) : h.pinch;
            const k = pressed ? keyAt(p.x, Math.max(p.y, geo.top + 1)) : null;
            if (pressed && k && k !== f.key) {
              const vy = Math.max(0, (p.y - prev.y) / Math.max(dt, 1e-3));
              const vel = cam ? Math.min(1, 0.35 + vy / 1600) : 0.78;
              if (f.key) f.key.down--;
              play(k, vel); f.key = k;
            }
            if (!pressed && f.key) { f.key.down--; f.key = null; }
            f.down = pressed; f.p = p; f.cam = cam;
          });
        }
        for (const [id, f] of fing) if (!alive.has(id)) { if (f.key) f.key.down--; fing.delete(id); }

        // ── desenho ──
        g.clearRect(0, 0, W, H);
        const bg = g.createRadialGradient(W / 2, geo.top, 0, W / 2, geo.top, W * 0.7);
        bg.addColorStop(0, "rgba(227,34,44,.10)"); bg.addColorStop(1, "rgba(6,6,7,0)");
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        // linha de toque
        g.strokeStyle = "rgba(255,59,59,.55)"; g.setLineDash([6, 8]); g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(geo.x0 - 20, geo.line); g.lineTo(geo.x0 + geo.kw * whites + 20, geo.line); g.stroke(); g.setLineDash([]);
        g.font = "500 10.5px 'Geist Mono Variable', monospace"; g.fillStyle = "rgba(255,59,59,.8)"; g.textAlign = "left";
        g.fillText("LINHA DE TOQUE", geo.x0 - 10, geo.line - 10);
        for (const pass of [false, true]) for (const k of keys) {
          if (k.black !== pass) continue;
          k.glow = Math.max(k.down > 0 ? 0.65 : 0, k.glow - dt * 2.2);
          const dy = k.down > 0 ? 4 : 0;
          if (!k.black) {
            const gr = g.createLinearGradient(0, k.y, 0, k.y + k.h);
            gr.addColorStop(0, "#e9e8e4"); gr.addColorStop(1, "#f7f6f3");
            rr(g, k.x + 2, k.y + dy, k.w - 4, k.h - dy, [0, 0, 10, 10]); g.fillStyle = gr; g.fill();
            if (k.glow > 0) { g.fillStyle = `rgba(255,59,59,${k.glow * 0.8})`; g.fill(); }
            if (k.m % 12 === 0) { g.fillStyle = k.glow > 0.3 ? "#fff" : "rgba(0,0,0,.45)"; g.textAlign = "center"; g.fillText("C" + (k.m / 12 - 1), k.x + k.w / 2, k.y + k.h - 14); }
          } else {
            const gr = g.createLinearGradient(0, k.y, 0, k.y + k.h);
            gr.addColorStop(0, "#1c1c20"); gr.addColorStop(1, "#0b0b0d");
            rr(g, k.x, k.y + dy, k.w, k.h - dy, [0, 0, 6, 6]); g.fillStyle = gr; g.fill();
            g.strokeStyle = "rgba(255,255,255,.08)"; g.stroke();
            if (k.glow > 0) { g.fillStyle = `rgba(255,59,59,${k.glow})`; g.fill(); }
          }
        }
        // notas subindo
        g.textAlign = "center";
        for (let i = notes.length - 1; i >= 0; i--) {
          const n = notes[i]; n.t += dt; if (n.t > 1.4) { notes.splice(i, 1); continue; }
          g.globalAlpha = 1 - n.t / 1.4; g.fillStyle = "#fff"; g.font = `600 ${14 + n.v * 10}px 'Geist Variable', sans-serif`;
          g.fillText(n.n, n.x, n.y - n.t * 90); g.globalAlpha = 1;
        }
        // pontas dos dedos
        for (const f of fing.values()) {
          if (!f.cam || !f.p) continue;
          g.beginPath(); g.arc(f.p.x, f.p.y, f.down ? 9 : 7, 0, 7);
          g.fillStyle = f.down ? "#ff3b3b" : "rgba(255,255,255,.9)"; g.fill();
          g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 2; g.stroke();
        }
      },
      resize() { S.resize(); layout(); },
      dispose() { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); S.dispose(); },
    };
  },
};
