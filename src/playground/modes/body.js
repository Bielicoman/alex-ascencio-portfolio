import { make2d } from "../canvas2d";
import * as A from "../audio";

// Corpo inteiro (PoseLandmarker, 33 pontos) em HUD: esqueleto com leitura de ângulos, reator no peito
// e repulsor: palma aberta com o braço esticado carrega (0,5 s) e dispara na direção do antebraço.
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [15, 19], [16, 20]];
const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

export default {
  id: "corpo", name: "Corpo",
  needsCamera: true,
  hint: [["hand", "Afaste-se: corpo inteiro no quadro"], ["point", "Braço esticado + palma aberta"], ["drag", "Segure 0,5 s: repulsor"], ["zoom", "Ângulos ao vivo nos cotovelos"]],
  mount(host, { input }) {
    const S = make2d(host), g = S.g;
    input.enable("pose").catch((e) => console.warn("[pose]", e));
    const charge = new Map(), beams = [], sparks = [];
    let T = 0, reactor = 0;

    // coordenadas da câmera → tela com "cover" (mesmo enquadramento do vídeo de fundo, espelhado)
    const view = () => {
      const v = input.video, vw = v?.videoWidth || 640, vh = v?.videoHeight || 480;
      const k = Math.max(S.W / vw, S.H / vh);
      return { k, vw, vh, ox: (S.W - vw * k) / 2, oy: (S.H - vh * k) / 2 };
    };
    const P = (p, m) => ({ x: m.ox + (1 - p.x) * m.vw * m.k, y: m.oy + p.y * m.vh * m.k });
    const Pm = (p, m) => ({ x: m.ox + p.x * m.vw * m.k, y: m.oy + p.y * m.vh * m.k }); // mãos já vêm espelhadas
    const ang = (a, b, c) => { const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y]; return Math.round((Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) + 1e-6)))) * 180) / Math.PI); };

    return {
      frame(dt, hands) {
        T += dt;
        const W = S.W, H = S.H, m = view(), v = input.video;
        g.clearRect(0, 0, W, H);
        if (!v || v.readyState < 2) {
          g.fillStyle = "rgba(255,255,255,.6)"; g.font = "500 16px 'Geist Variable', sans-serif"; g.textAlign = "center";
          g.fillText("Ative a câmera (botão no topo) para o modo Corpo", W / 2, H * 0.45);
          return;
        }
        // vídeo de fundo escurecido e dessaturado (lê o corpo sem competir com o HUD)
        g.save(); g.globalAlpha = 0.28; g.filter = "grayscale(1) contrast(1.2)";
        g.translate(W, 0); g.scale(-1, 1); g.drawImage(v, W - m.ox - m.vw * m.k, m.oy, m.vw * m.k, m.vh * m.k); g.restore();
        g.fillStyle = "rgba(6,6,7,.35)"; g.fillRect(0, 0, W, H);

        const pose = input.pose;
        if (!pose) {
          g.fillStyle = "rgba(255,255,255,.7)"; g.font = "500 16px 'Geist Variable', sans-serif"; g.textAlign = "center";
          g.fillText(input.cam?.aux?.pose?.w ? "Afaste-se até o tronco inteiro aparecer" : "Carregando o modelo do corpo…", W / 2, H * 0.2);
        } else {
          const pt = pose.map((p) => ({ ...P(p, m), v: p.v }));
          const ok = (i) => pt[i] && pt[i].v > 0.5;
          // ossos com brilho
          g.lineCap = "round";
          for (const pass of [[10, "rgba(255,59,59,.18)"], [2.5, "rgba(255,255,255,.9)"]]) {
            g.lineWidth = pass[0]; g.strokeStyle = pass[1]; g.beginPath();
            for (const [a, b] of BONES) if (ok(a) && ok(b)) { g.moveTo(pt[a].x, pt[a].y); g.lineTo(pt[b].x, pt[b].y); }
            g.stroke();
          }
          for (const j of JOINTS) if (ok(j)) {
            g.beginPath(); g.arc(pt[j].x, pt[j].y, j === 0 ? 10 : 6, 0, 7); g.strokeStyle = "#ff3b3b"; g.lineWidth = 2; g.stroke();
            g.beginPath(); g.arc(pt[j].x, pt[j].y, 2, 0, 7); g.fillStyle = "#fff"; g.fill();
          }
          // ângulos dos cotovelos e joelhos
          g.font = "500 11px 'Geist Mono Variable', monospace"; g.textAlign = "left"; g.fillStyle = "#fff";
          for (const [a, b, c, lab] of [[11, 13, 15, "COT E"], [12, 14, 16, "COT D"], [23, 25, 27, "JOE E"], [24, 26, 28, "JOE D"]]) {
            if (ok(a) && ok(b) && ok(c)) { const t = `${lab} ${ang(pt[a], pt[b], pt[c])}°`; g.fillStyle = "rgba(6,6,7,.6)"; g.fillRect(pt[b].x + 12, pt[b].y - 16, g.measureText(t).width + 12, 20); g.fillStyle = "#fff"; g.fillText(t, pt[b].x + 18, pt[b].y - 2); }
          }
          // reator no peito
          if (ok(11) && ok(12)) {
            const cx = (pt[11].x + pt[12].x) / 2, sw = Math.hypot(pt[11].x - pt[12].x, pt[11].y - pt[12].y);
            const cy = (pt[11].y + pt[12].y) / 2 + (ok(23) ? (pt[23].y - pt[11].y) * 0.22 : sw * 0.3);
            reactor += (1 - reactor) * dt * 2;
            const r = sw * 0.11 * (1 + Math.sin(T * 4) * 0.06);
            const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
            gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(0.3, "rgba(255,120,120,.6)"); gr.addColorStop(1, "rgba(255,59,59,0)");
            g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r * 3, 0, 7); g.fill();
            g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, r * 1.4, 0, 7); g.stroke();
            for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + T; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r * 1.6); g.lineTo(cx + Math.cos(a) * r * 2, cy + Math.sin(a) * r * 2); g.stroke(); }
          }
          // repulsor: mão aberta (rastreador de mãos) perto de um pulso da pose, braço esticado (cotovelo > 140°)
          for (const [sh, el, wr] of [[11, 13, 15], [12, 14, 16]]) {
            if (!(ok(sh) && ok(el) && ok(wr))) continue;
            const hand = hands.find((h) => h.src === "cam" && h.lm && Math.hypot(Pm(h.lm[0], m).x - pt[wr].x, Pm(h.lm[0], m).y - pt[wr].y) < 140);
            const straight = ang(pt[sh], pt[el], pt[wr]) > 140;
            const key = "w" + wr;
            if (hand && hand.open && straight) {
              const c = Math.min(1, (charge.get(key) || 0) + dt / 0.5); charge.set(key, c);
              const pc = Pm(hand.lm[9], m);
              g.beginPath(); g.arc(pc.x, pc.y, 12 + c * 26, 0, 7); g.fillStyle = `rgba(255,255,255,${0.15 + c * 0.5})`; g.fill();
              g.beginPath(); g.arc(pc.x, pc.y, 34, -Math.PI / 2, -Math.PI / 2 + c * Math.PI * 2); g.strokeStyle = "#ff3b3b"; g.lineWidth = 3; g.stroke();
              if (c >= 1) {
                charge.set(key, -0.8); // recarga
                const dx = pt[wr].x - pt[el].x, dy = pt[wr].y - pt[el].y, L = Math.hypot(dx, dy) || 1;
                beams.push({ x: pc.x, y: pc.y, dx: dx / L, dy: dy / L, t: 0 });
                for (let i = 0; i < 40; i++) { const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2, sp = 300 + Math.random() * 900; sparks.push({ x: pc.x, y: pc.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6 + Math.random() * 0.4 }); }
                A.boom(0.35); A.whoosh(true, 0.3);
              }
            } else charge.set(key, Math.min(0, (charge.get(key) || 0) + dt)); // negativo = recarregando
          }
        }
        // feixes e faíscas
        for (let i = beams.length - 1; i >= 0; i--) {
          const b = beams[i]; b.t += dt; if (b.t > 0.45) { beams.splice(i, 1); continue; }
          const L = Math.hypot(W, H), a = 1 - b.t / 0.45;
          for (const [w, c] of [[40 * a, `rgba(255,59,59,${0.35 * a})`], [14 * a, `rgba(255,200,200,${0.8 * a})`], [4 * a, `rgba(255,255,255,${a})`]]) {
            g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + b.dx * L, b.y + b.dy * L); g.stroke();
          }
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const p = sparks[i]; p.life -= dt; if (p.life <= 0) { sparks.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96;
          g.fillStyle = `rgba(255,${150 + Math.random() * 100},${150 + Math.random() * 100},${p.life})`; g.fillRect(p.x, p.y, 3, 3);
        }
        // moldura HUD
        g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1.5;
        for (const [x, y, sx, sy] of [[24, 140, 1, 1], [W - 24, 140, -1, 1], [24, H - 70, 1, -1], [W - 24, H - 70, -1, -1]]) { g.beginPath(); g.moveTo(x, y + 30 * sy); g.lineTo(x, y); g.lineTo(x + 30 * sx, y); g.stroke(); }
        g.font = "500 10.5px 'Geist Mono Variable', monospace"; g.fillStyle = "rgba(255,255,255,.55)"; g.textAlign = "left";
        g.fillText(`POSE ${pose ? pose.filter((p) => p.v > 0.5).length : 0}/33 · MÃOS ${hands.filter((h) => h.src === "cam").length}`, 34, 162);
      },
      resize: S.resize,
      dispose() { input.disable("pose"); S.dispose(); },
    };
  },
};
