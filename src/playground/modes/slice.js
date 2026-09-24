import { make2d, rr } from "../canvas2d";
import * as A from "../audio";

// Jogo "Corte": clipes são lançados de baixo; a ponta do indicador (ou o mouse arrastando) é a lâmina.
// Cortar um clipe = +1 (combo em sequência rápida). Tocar no "glitch" = −5 e tela trêmula. 60 s.
const THUMBS = [25, 24, 7, 14, 16, 6, 2, 4].map((id) => `/media/cv/img/${id}.jpg`);
const GRAV = 1300, DUR = 60;
const segCircle = (ax, ay, bx, by, cx, cy, r) => {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
  let u = ((cx - ax) * dx + (cy - ay) * dy) / L; u = Math.max(0, Math.min(1, u));
  return Math.hypot(ax + dx * u - cx, ay + dy * u - cy) < r;
};
const bestKey = "pg-slice-best";
const readBest = () => { try { return +localStorage.getItem(bestKey) || 0; } catch { return 0; } };
const saveBest = (v) => { try { localStorage.setItem(bestKey, v); } catch {} };

export default {
  id: "corte", name: "Jogo: Corte",
  hint: [["point", "Indicador = lâmina"], ["drag", "Movimento rápido corta"], ["grab", "Evite o glitch vermelho"], ["pinch", "Mouse: arraste segurando"]],
  mount(host) {
    const S = make2d(host), g = S.g;
    const imgs = THUMBS.map((src) => { const i = new Image(); i.src = src; return i; });
    let state = "ready", score = 0, time = DUR, best = readBest(), combo = 0, lastCut = 0, T = 0, spawnIn = 0, shake = 0;
    const items = [], halves = [], sparks = [], trails = new Map(), pops = [];
    const target = () => ({ x: S.W / 2, y: S.H * 0.52, vx: 0, vy: 0, r: 70, rot: 0, vr: 0.3, img: imgs[0], start: true });
    let starter = target();

    const spawn = () => {
      const W = S.W, H = S.H, bomb = Math.random() < 0.16 + Math.min(0.12, (DUR - time) * 0.002);
      const x = W * (0.15 + Math.random() * 0.7);
      items.push({ x, y: H + 60, vx: (W / 2 - x) * (0.35 + Math.random() * 0.5), vy: -(Math.sqrt(2 * GRAV * H * (0.55 + Math.random() * 0.3))), r: bomb ? 42 : 52 + Math.random() * 10, rot: 0, vr: (Math.random() - 0.5) * 5, img: imgs[(Math.random() * imgs.length) | 0], bomb });
    };
    const cut = (it, ang) => {
      const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
      for (const s of [-1, 1]) halves.push({ ...it, side: s, ang, vx: it.vx + nx * s * 220, vy: it.vy + ny * s * 220 - 100, vr: it.vr + s * 4, life: 1.4 });
      for (let i = 0; i < 18; i++) { const a = Math.random() * 7, v = 200 + Math.random() * 500; sparks.push({ x: it.x, y: it.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, red: it.bomb || Math.random() < 0.5 }); }
    };
    const startGame = () => { state = "play"; score = 0; time = DUR; combo = 0; items.length = 0; spawnIn = 0.4; A.whoosh(true, 0.3); };

    return {
      frame(dt, hands) {
        T += dt; const W = S.W, H = S.H;
        // lâminas: ponta do indicador (câmera) ou ponteiro com botão (mouse/toque)
        const blades = [];
        for (const h of hands) {
          const on = h.src === "cam" || h.pinch;
          const p0 = h.src === "cam" ? h.fingers[0] : { x: h.x, y: h.y }, p = S.local(p0.x, p0.y);
          let tr = trails.get(h.id); if (!tr) { tr = []; trails.set(h.id, tr); }
          if (!on) { tr.length = 0; continue; }
          tr.push({ x: p.x, y: p.y, t: T });
          while (tr.length && T - tr[0].t > 0.14) tr.shift();
          if (tr.length > 1) {
            const a = tr[tr.length - 2], b = tr[tr.length - 1], sp = Math.hypot(b.x - a.x, b.y - a.y) / Math.max(dt, 1e-3);
            if (sp > 700) blades.push({ a, b, ang: Math.atan2(b.y - a.y, b.x - a.x) });
          }
        }
        for (const id of trails.keys()) if (!hands.some((h) => h.id === id)) trails.delete(id);

        if (state !== "play") {
          starter.rot += dt * 0.6; starter.y = H * 0.52 + Math.sin(T * 1.6) * 8; starter.x = W / 2;
          for (const bl of blades) if (segCircle(bl.a.x, bl.a.y, bl.b.x, bl.b.y, starter.x, starter.y, starter.r)) { cut(starter, bl.ang); A.slice(1, 0); startGame(); starter = target(); break; }
        } else {
          time -= dt;
          if (time <= 0) { time = 0; state = "over"; if (score > best) { best = score; saveBest(best); } A.boom(0.4); }
          spawnIn -= dt;
          if (spawnIn <= 0) { const n = 1 + (Math.random() < 0.35 ? 1 : 0) + (time < 30 && Math.random() < 0.3 ? 1 : 0); for (let i = 0; i < n; i++) spawn(); spawnIn = Math.max(0.55, 1.25 - (DUR - time) * 0.011); }
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.vy += GRAV * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
          if (it.y > H + 120 && it.vy > 0) { items.splice(i, 1); combo = 0; continue; }
          for (const bl of blades) if (segCircle(bl.a.x, bl.a.y, bl.b.x, bl.b.y, it.x, it.y, it.r)) {
            items.splice(i, 1); cut(it, bl.ang);
            const pan = (it.x / W - 0.5) * 1.2;
            if (it.bomb) { score = Math.max(0, score - 5); shake = 0.5; combo = 0; A.glitch(); pops.push({ x: it.x, y: it.y, t: 0, s: "−5", red: true }); }
            else {
              combo = T - lastCut < 0.45 ? combo + 1 : 1; lastCut = T;
              const pts = combo >= 3 ? 2 : 1; score += pts;
              A.slice(1 + Math.min(combo, 6) * 0.08, pan);
              pops.push({ x: it.x, y: it.y, t: 0, s: combo >= 3 ? `COMBO ×${combo}` : "+1" });
            }
            break;
          }
        }

        // ── desenho ──
        shake = Math.max(0, shake - dt);
        g.save(); g.clearRect(0, 0, W, H);
        if (shake > 0) g.translate((Math.random() - 0.5) * 22 * shake, (Math.random() - 0.5) * 22 * shake);
        const clip = (it) => {
          g.save(); g.translate(it.x, it.y); g.rotate(it.rot);
          const w = it.r * 2 * 1.4, h = it.r * 2 * 0.8;
          if (it.bomb) {
            g.beginPath(); g.arc(0, 0, it.r, 0, 7); g.fillStyle = "#1a0306"; g.fill();
            for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(255,${(Math.random() * 60) | 0},${(Math.random() * 60) | 0},${0.4 + Math.random() * 0.5})`; g.fillRect(-it.r + Math.random() * it.r, -it.r * 0.7 + k * it.r * 0.24, it.r * (0.6 + Math.random()), 4 + Math.random() * 6); }
            g.lineWidth = 2; g.strokeStyle = "#ff3b3b"; g.beginPath(); g.arc(0, 0, it.r, 0, 7); g.stroke();
            g.fillStyle = "#fff"; g.font = "600 11px 'Geist Mono Variable', monospace"; g.textAlign = "center"; g.fillText("GLITCH", 0, 4);
          } else {
            rr(g, -w / 2, -h / 2, w, h, 10); g.save(); g.clip();
            if (it.img.complete && it.img.naturalWidth) g.drawImage(it.img, -w / 2, -h / 2, w, h); else { g.fillStyle = "#222"; g.fill(); }
            g.restore();
            g.lineWidth = 2; g.strokeStyle = "rgba(255,255,255,.85)"; rr(g, -w / 2, -h / 2, w, h, 10); g.stroke();
            // perfurações de filme
            g.fillStyle = "rgba(0,0,0,.55)"; for (let k = 0; k < 6; k++) { g.fillRect(-w / 2 + 8 + k * (w - 16) / 5.4, -h / 2 + 4, 7, 5); g.fillRect(-w / 2 + 8 + k * (w - 16) / 5.4, h / 2 - 9, 7, 5); }
          }
          g.restore();
        };
        if (state !== "play") {
          clip(starter);
          g.textAlign = "center"; g.fillStyle = "#fff";
          g.font = `650 ${Math.min(54, Math.max(28, W * 0.05))}px 'Geist Variable', sans-serif`;
          g.fillText(state === "over" ? `${score} cortes` : "Corte o clipe para começar", W / 2, H * 0.22);
          g.font = "500 12px 'Geist Mono Variable', monospace"; g.fillStyle = "rgba(255,255,255,.6)";
          g.fillText(state === "over" ? `RECORDE ${best} · CORTE DE NOVO PARA JOGAR` : `60 SEGUNDOS · RECORDE ${best}`, W / 2, H * 0.22 + 30);
        }
        items.forEach(clip);
        for (let i = halves.length - 1; i >= 0; i--) {
          const hf = halves[i]; hf.life -= dt; if (hf.life <= 0 || hf.y > H + 200) { halves.splice(i, 1); continue; }
          hf.vy += GRAV * dt; hf.x += hf.vx * dt; hf.y += hf.vy * dt; hf.rot += hf.vr * dt;
          g.save(); g.globalAlpha = Math.min(1, hf.life * 2);
          g.translate(hf.x, hf.y); g.rotate(hf.ang); g.beginPath(); g.rect(-400, hf.side < 0 ? -400 : 0, 800, 400); g.clip(); g.rotate(-hf.ang); g.translate(-hf.x, -hf.y);
          clip(hf); g.restore();
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i]; s.life -= dt; if (s.life <= 0) { sparks.splice(i, 1); continue; }
          s.vy += GRAV * 0.5 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
          g.fillStyle = s.red ? `rgba(255,59,59,${s.life * 2})` : `rgba(255,255,255,${s.life * 2})`; g.fillRect(s.x, s.y, 3, 3);
        }
        for (let i = pops.length - 1; i >= 0; i--) {
          const p = pops[i]; p.t += dt; if (p.t > 0.9) { pops.splice(i, 1); continue; }
          g.globalAlpha = 1 - p.t / 0.9; g.fillStyle = p.red ? "#ff3b3b" : "#fff"; g.font = "650 22px 'Geist Variable', sans-serif"; g.textAlign = "center";
          g.fillText(p.s, p.x, p.y - p.t * 70); g.globalAlpha = 1;
        }
        // rastro da lâmina
        for (const tr of trails.values()) {
          if (tr.length < 2) continue;
          for (let i = 1; i < tr.length; i++) {
            const a = tr[i - 1], b = tr[i], k = i / tr.length;
            g.strokeStyle = `rgba(255,${200 - k * 140},${200 - k * 140},${k})`; g.lineWidth = 2 + k * 7; g.lineCap = "round";
            g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
          }
        }
        g.restore();
        // placar
        if (state === "play") {
          g.textAlign = "left"; g.fillStyle = "#fff"; g.font = "650 40px 'Geist Variable', sans-serif"; g.fillText(String(score), 28, 110);
          g.font = "500 11px 'Geist Mono Variable', monospace"; g.fillStyle = "rgba(255,255,255,.55)"; g.fillText("CORTES", 30, 128);
          g.textAlign = "right"; g.fillStyle = time < 10 ? "#ff3b3b" : "#fff"; g.font = "650 40px 'Geist Variable', sans-serif"; g.fillText(Math.ceil(time) + "s", W - 28, 110);
          g.fillStyle = "rgba(255,255,255,.1)"; g.fillRect(28, 140, W - 56, 2); g.fillStyle = "#ff3b3b"; g.fillRect(28, 140, (W - 56) * (time / DUR), 2);
        }
      },
      resize: S.resize,
      dispose: S.dispose,
    };
  },
};
