import { make2d, rr } from "../canvas2d";
import * as A from "../audio";

// 8 pads. Golpe = ponta do dedo descendo rápido para dentro do pad (a força vem da velocidade).
// Mouse/toque: clique. Teclado: 1–8.
const PADS = [["kick", "Bumbo"], ["snare", "Caixa"], ["hat", "Chimbal"], ["open", "Chimbal aberto"], ["clap", "Palma"], ["tom", "Tom"], ["crash", "Prato"], ["bass", "808"]];

export default {
  id: "bateria", name: "Bateria",
  hint: [["drag", "Golpe para baixo no pad"], ["hand", "Mais rápido = mais forte"], ["pinch", "Mouse/toque: clique"], ["keys", "Teclado: 1 a 8"]],
  mount(host) {
    const S = make2d(host), g = S.g;
    const pads = PADS.map(([id, label]) => ({ id, label, hit: 0, ring: [] }));
    const layout = () => {
      const W = S.W, H = S.H, cols = W < 700 ? 2 : 4, rows = Math.ceil(pads.length / cols);
      const gap = 14, size = Math.min((W - 60 - gap * (cols - 1)) / cols, (H * 0.72 - gap * (rows - 1)) / rows, 210);
      const x0 = (W - (size * cols + gap * (cols - 1))) / 2, y0 = H * 0.54 - (size * rows + gap * (rows - 1)) / 2;
      pads.forEach((p, i) => { p.x = x0 + (i % cols) * (size + gap); p.y = y0 + Math.floor(i / cols) * (size + gap); p.s = size; });
    };
    layout();
    const hit = (p, v) => { A.drum(p.id, v, ((p.x + p.s / 2) / S.W - 0.5) * 1.1); p.hit = Math.min(1, 0.4 + v); p.ring.push({ t: 0, v }); };
    const inside = (p, x, y) => x >= p.x && x <= p.x + p.s && y >= p.y && y <= p.y + p.s;
    const cool = new Map();
    const onKey = (e) => { const i = +e.key - 1; if (!e.repeat && i >= 0 && i < 8) { A.unlock(); hit(pads[i], 0.85); } };
    window.addEventListener("keydown", onKey);
    let T = 0;

    return {
      frame(dt, hands) {
        T += dt;
        for (const h of hands) {
          const cam = h.src === "cam";
          if (!cam) { if (h.down) { const q = S.local(h.x, h.y), p = pads.find((p) => inside(p, q.x, q.y)); if (p) hit(p, 0.85); } continue; }
          h.fingers.forEach((f0, i) => {
            if (i > 1) return; // indicador e médio: golpes mais limpos
            const q = S.local(f0.x, f0.y), pr = h.pf[i] ? S.local(h.pf[i].x, h.pf[i].y) : q;
            const vy = (q.y - pr.y) / Math.max(dt, 1e-3), id = h.id + i;
            const p = pads.find((p) => inside(p, q.x, q.y));
            if (p && vy > 650 && T - (cool.get(id) || 0) > 0.14) { hit(p, Math.min(1, 0.25 + vy / 3200)); cool.set(id, T); }
          });
        }
        const W = S.W, H = S.H;
        g.clearRect(0, 0, W, H);
        for (const p of pads) {
          p.hit = Math.max(0, p.hit - dt * 3.5);
          const lift = p.hit * 6;
          rr(g, p.x, p.y + lift * 0.5, p.s, p.s, 22);
          const gr = g.createLinearGradient(p.x, p.y, p.x + p.s, p.y + p.s);
          gr.addColorStop(0, `rgba(${40 + p.hit * 215},${22 + p.hit * 37},${26 + p.hit * 33},1)`); gr.addColorStop(1, "#0d0d10");
          g.fillStyle = gr; g.fill();
          g.lineWidth = 1.2; g.strokeStyle = `rgba(255,${120 - p.hit * 60},${120 - p.hit * 60},${0.18 + p.hit * 0.6})`; g.stroke();
          if (p.hit > 0) { g.save(); g.shadowColor = "#ff3b3b"; g.shadowBlur = 40 * p.hit; g.stroke(); g.restore(); }
          for (let i = p.ring.length - 1; i >= 0; i--) {
            const r = p.ring[i]; r.t += dt; if (r.t > 0.6) { p.ring.splice(i, 1); continue; }
            g.beginPath(); g.arc(p.x + p.s / 2, p.y + p.s / 2, p.s * (0.2 + r.t * 0.9), 0, 7);
            g.strokeStyle = `rgba(255,59,59,${(1 - r.t / 0.6) * r.v})`; g.lineWidth = 2; g.stroke();
          }
          g.fillStyle = "#f3f3f5"; g.font = "600 15px 'Geist Variable', sans-serif"; g.textAlign = "left";
          g.fillText(p.label, p.x + 18, p.y + p.s - 20);
          g.fillStyle = "rgba(255,255,255,.4)"; g.font = "500 10.5px 'Geist Mono Variable', monospace";
          g.fillText(String(pads.indexOf(p) + 1).padStart(2, "0"), p.x + 18, p.y + 26);
        }
        for (const h of hands) if (h.src === "cam") for (const f of h.fingers.slice(0, 2)) {
          const q = S.local(f.x, f.y); g.beginPath(); g.arc(q.x, q.y, 8, 0, 7); g.fillStyle = "#fff"; g.fill(); g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 2; g.stroke();
        }
      },
      resize() { S.resize(); layout(); },
      dispose() { window.removeEventListener("keydown", onKey); S.dispose(); },
    };
  },
};
