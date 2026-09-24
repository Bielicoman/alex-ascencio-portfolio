// "Speed force" no padrão da abertura de The Flash: filamentos orgânicos (curvas longas com 2–3 fios
// que se torcem e tremem), que viajam com cabeça quente e cauda que apaga; halo vermelho, corpo laranja,
// núcleo branco-dourado; brasas com bokeh e névoa vermelha. Canvas 2D que só roda enquanto há algo vivo.
const RED = "255,42,16", ORANGE = "255,118,28", GOLD = "255,200,70", HOT = "255,246,222";
const rnd = (a, b) => a + Math.random() * (b - a);

// curva suave (Catmull-Rom) por pontos de controle com desvio perpendicular aleatório
function flowPath(x1, y1, x2, y2, bend = 0.35, ctrl = 6, samples = 90) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const cp = [];
  for (let i = 0; i <= ctrl; i++) {
    const t = i / ctrl, off = (i === 0 || i === ctrl) ? 0 : (Math.random() - 0.5) * L * bend * Math.sin(Math.PI * t) * 1.6;
    cp.push([x1 + dx * t + nx * off, y1 + dy * t + ny * off]);
  }
  const P = (i) => cp[Math.max(0, Math.min(cp.length - 1, i))], pts = [];
  for (let s = 0; s < samples; s++) {
    const u = (s / (samples - 1)) * ctrl, i = Math.floor(Math.min(u, ctrl - 1e-6)), t = u - i;
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)], t2 = t * t, t3 = t2 * t;
    const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
  const nor = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; });
  return { pts, nor, L };
}

export default class Speedforce {
  constructor() {
    const c = (this.c = document.createElement("canvas"));
    c.className = "speedforce"; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    this.g = c.getContext("2d");
    this.tendrils = []; this.embers = []; this.sparks = []; this.lines = []; this.spawners = [];
    this.flash = 0; this.haze = 0; this.charge = 0; this.t = 0;
    this.running = false; this.px = -1; this.py = -1; this.pt = 0; this.lastArc = 0;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.fine = matchMedia("(pointer: fine)").matches;
    // modo leve (celular/tablet): metade dos filamentos, DPR 1, brasas sem gradiente, menos faíscas
    this.lite = matchMedia("(pointer: coarse), (max-width: 760px)").matches;
    this.resize = () => { const d = this.lite ? 1 : Math.min(devicePixelRatio, 1.5); c.width = innerWidth * d; c.height = innerHeight * d; this.g.setTransform(d, 0, 0, d, 0, 0); };
    this.resize(); window.addEventListener("resize", this.resize);
    this.onMove = (e) => {
      const now = performance.now(), dt = Math.max(1, now - this.pt), vx = (e.clientX - this.px) / dt, vy = (e.clientY - this.py) / dt, sp = Math.hypot(vx, vy);
      if (this.px >= 0 && this.fine && !this.reduced) {
        if (this.charge > 0) { // cursor carregado: filamentos curtos enroscando + faíscas no rastro
          if (now - this.lastArc > 45) { this.lastArc = now; this.coil(e.clientX, e.clientY); }
          this.spray(e.clientX, e.clientY, 3, 240, -vx * 110, -vy * 110);
        } else if (sp > 3.2) this.spray(e.clientX, e.clientY, 2, 150, -vx * 60, -vy * 60, 0.6);
      }
      this.px = e.clientX; this.py = e.clientY; this.pt = now;
    };
    window.addEventListener("pointermove", this.onMove, { passive: true });
  }

  /* ── emissores ── */
  // filamento principal: viaja de A a B em `travel` s, com 2–3 fios torcidos
  tendril(x1, y1, x2, y2, { w = 1, travel = rnd(0.14, 0.28), life = rnd(0.45, 0.8), bend = rnd(0.12, 0.3), strands = 3, tail = rnd(0.45, 0.8), blur = false } = {}) {
    const p = flowPath(x1, y1, x2, y2, bend);
    const st = Array.from({ length: strands }, (_, i) => ({ amp: i === 0 ? 0 : rnd(3, 9) * w, freq: rnd(0.012, 0.03), ph: rnd(0, 6.28), sp: rnd(6, 14) }));
    // ramificações: filamentos finos nascendo ao longo do caminho
    const branches = [];
    for (let k = 0; k < Math.round(p.L / 260); k++) {
      const at = rnd(0.15, 0.85), i = Math.floor(at * (p.pts.length - 1)), [bx, by] = p.pts[i], [nx, ny] = p.nor[i], s = Math.random() < 0.5 ? 1 : -1, len = rnd(40, 150);
      branches.push({ at, path: flowPath(bx, by, bx + nx * s * len + rnd(-40, 40), by + ny * s * len + rnd(-40, 40), 0.6, 3, 24) });
    }
    this.tendrils.push({ ...p, st, branches, w, travel, life, tail, blur, age: 0 });
    this.start();
  }
  coil(x, y) { // filamento curto em volta do cursor
    const a = rnd(0, 6.28), r = rnd(22, 48), b = a + rnd(1.2, 2.6);
    this.tendril(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4, x + Math.cos(b) * r, y + Math.sin(b) * r, { w: 0.55, travel: 0.06, life: 0.2, bend: 0.9, strands: 2, tail: 1 });
  }
  spray(x, y, n, speed, bx = 0, by = 0, life = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random());
      this.sparks.push({ x, y, vx: Math.cos(a) * v + bx, vy: Math.sin(a) * v + by, age: 0, life: (0.25 + Math.random() * 0.45) * life, hot: Math.random() < 0.35 });
    }
    this.start();
  }
  embersAt(n) { // brasas flutuando; algumas grandes e desfocadas (bokeh)
    for (let i = 0; i < n; i++) {
      const big = !this.lite && Math.random() < 0.18;
      this.embers.push({ x: rnd(0, innerWidth), y: rnd(0, innerHeight), vx: rnd(-40, 40), vy: rnd(-90, -15), r: big ? rnd(6, 16) : rnd(0.8, 2.2), big, age: 0, life: rnd(0.8, 1.8), ph: rnd(0, 6.28) });
    }
    this.start();
  }
  tunnel(cx, cy, n = 110) {
    const R = Math.hypot(innerWidth, innerHeight);
    for (let i = 0; i < n; i++) this.lines.push({ cx, cy, a: Math.random() * Math.PI * 2, r: 30 + Math.random() * R * 0.2, v: R * (1.4 + Math.random() * 2.2), len: 10, age: 0, life: 0.3 + Math.random() * 0.3, w: 0.5 + Math.random() * 1.2 });
    this.start();
  }
  edge() {
    const w = innerWidth, h = innerHeight, s = Math.floor(Math.random() * 4), m = 60;
    return s === 0 ? [rnd(0, w), -m] : s === 1 ? [w + m, rnd(0, h)] : s === 2 ? [rnd(0, w), h + m] : [-m, rnd(0, h)];
  }
  // teleporte: carga no clique → salto (clarão + filamentos cruzando a tela) → rescaldo com brasas
  burst(x, y, jumpAt = 0.28) {
    if (this.reduced) return;
    const L = this.lite;
    this.haze = 0.6;
    this.spray(x, y, L ? 18 : 50, 800);
    for (let i = 0; i < (L ? 1 : 2); i++) { const [ex, ey] = this.edge(); this.tendril(x, y, ex, ey, { w: 1.1, travel: 0.14 }); }
    if (!L) this.every(0.1, jumpAt, () => { const [ex, ey] = this.edge(); this.tendril(x, y, ex, ey, { w: rnd(0.6, 1), strands: 2 }); this.coil(x, y); });
    this.after(jumpAt, () => {
      this.flash = 1; this.haze = 1;
      const cx = innerWidth / 2, cy = innerHeight / 2;
      this.tunnel(cx, cy, L ? 50 : 130);
      for (let i = 0; i < (L ? 2 : 4); i++) { const [ax, ay] = this.edge(), [bx, by] = this.edge(); this.tendril(ax, ay, bx, by, { w: rnd(1, 1.6), life: rnd(0.6, 1), strands: L ? 2 : 3 }); }
      if (!L) for (let i = 0; i < 2; i++) { const [ax, ay] = this.edge(), [bx, by] = this.edge(); this.tendril(ax, ay, bx, by, { w: 3, blur: true, strands: 1, life: 1.1, travel: 0.3 }); } // desfocados, em primeiro plano
      this.spray(cx, cy, L ? 36 : 90, 1200);
      this.embersAt(L ? 24 : 70);
      if (!L) this.every(0.15, 0.55, () => { const [ax, ay] = this.edge(), [bx, by] = this.edge(); if (Math.random() < 0.7) this.tendril(ax, ay, bx, by, { w: rnd(0.5, 1.1), strands: 2 }); });
      this.charge = 1.4;
    });
  }
  every(step, dur, fn) { this.spawners.push({ step, dur, fn, t: 0, acc: 0 }); this.start(); }
  after(t, fn) { this.spawners.push({ step: Infinity, dur: t, fn: null, done: fn, t: 0, acc: 0 }); this.start(); }

  /* ── laço ── */
  start() {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.04, (now - this.last) / 1000); this.last = now; this.t += dt;
      this.step(dt);
      if (this.alive()) this.raf = requestAnimationFrame(loop);
      else { this.running = false; this.g.clearRect(0, 0, innerWidth, innerHeight); }
    };
    this.raf = requestAnimationFrame(loop);
  }
  alive() { return this.tendrils.length || this.sparks.length || this.embers.length || this.lines.length || this.spawners.length || this.flash > 0.01 || this.haze > 0.01 || this.charge > 0; }

  drawPath(g, pts, nor, from, to, st, jitter) {
    g.beginPath();
    for (let i = from; i <= to; i++) {
      const [x, y] = pts[i], [nx, ny] = nor[i];
      const off = st.amp * Math.sin(i * st.freq * 60 + st.ph + this.t * st.sp) + (Math.random() - 0.5) * jitter;
      i === from ? g.moveTo(x + nx * off, y + ny * off) : g.lineTo(x + nx * off, y + ny * off);
    }
    g.stroke();
  }
  step(dt) {
    const g = this.g, W = innerWidth, H = innerHeight;
    g.clearRect(0, 0, W, H);
    this.charge = Math.max(0, this.charge - dt);
    for (const s of this.spawners) {
      s.t += dt; s.acc += dt;
      if (s.fn) while (s.acc >= s.step) { s.acc -= s.step; s.fn(); }
      if (s.t >= s.dur) { s.dead = true; s.done?.(); }
    }
    this.spawners = this.spawners.filter((s) => !s.dead);
    // névoa vermelha atmosférica (normal, por baixo dos brilhos)
    if (this.haze > 0.01) {
      const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.1, W / 2, H / 2, Math.hypot(W, H) * 0.6);
      gr.addColorStop(0, `rgba(120,10,4,${(0.10 * this.haze).toFixed(3)})`); gr.addColorStop(1, `rgba(60,0,0,${(0.42 * this.haze).toFixed(3)})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      this.haze *= Math.pow(0.08, dt);
    }
    g.globalCompositeOperation = "lighter";
    g.lineCap = "round"; g.lineJoin = "round";
    // linhas de hipervelocidade (laranja/vermelho)
    for (const l of this.lines) {
      l.age += dt; l.r += l.v * dt; l.len = Math.min(380, l.len + l.v * dt * 0.9);
      const k = 1 - l.age / l.life, ca = Math.cos(l.a), sa = Math.sin(l.a);
      g.strokeStyle = `rgba(${Math.random() < 0.4 ? GOLD : ORANGE},${(0.45 * k).toFixed(3)})`; g.lineWidth = l.w;
      g.beginPath(); g.moveTo(l.cx + ca * l.r, l.cy + sa * l.r); g.lineTo(l.cx + ca * (l.r + l.len), l.cy + sa * (l.r + l.len)); g.stroke();
    }
    this.lines = this.lines.filter((l) => l.age < l.life);
    // filamentos
    for (const T of this.tendrils) {
      T.age += dt;
      const n = T.pts.length - 1, head = Math.min(1, T.age / T.travel), fade = Math.max(0, 1 - Math.max(0, T.age - T.travel) / (T.life - T.travel));
      const to = Math.round(head * n), from = Math.max(0, Math.round((head - T.tail) * n) - (head >= 1 ? Math.round(((T.age - T.travel) / (T.life - T.travel)) * n * 0.6) : 0));
      if (to - from < 2 || fade <= 0) continue;
      const flick = 0.75 + Math.random() * 0.25, a = fade * flick;
      const layers = T.blur
        ? [[16 * T.w, RED, 0.05], [7 * T.w, ORANGE, 0.08]]
        : [[11 * T.w, RED, 0.08], [4.2 * T.w, ORANGE, 0.28], [1.7 * T.w, GOLD, 0.7], [0.7 * T.w, HOT, 1]];
      for (const s of T.st) {
        for (const [w, col, al] of layers) {
          g.strokeStyle = `rgba(${col},${(al * a * (s.amp ? 0.7 : 1)).toFixed(3)})`; g.lineWidth = s.amp ? w * 0.6 : w;
          this.drawPath(g, T.pts, T.nor, from, to, s, T.blur ? 0 : 2.4 * T.w);
        }
      }
      // cabeça quente
      if (head < 1 && !T.blur) {
        const [hx, hy] = T.pts[to], rg = g.createRadialGradient(hx, hy, 0, hx, hy, 26 * T.w);
        rg.addColorStop(0, `rgba(${HOT},${(0.9 * a).toFixed(3)})`); rg.addColorStop(0.3, `rgba(${GOLD},${(0.35 * a).toFixed(3)})`); rg.addColorStop(1, `rgba(${RED},0)`);
        g.fillStyle = rg; g.fillRect(hx - 30 * T.w, hy - 30 * T.w, 60 * T.w, 60 * T.w);
      }
      // ramificações aparecem quando a cabeça passa por elas
      for (const b of T.branches) {
        if (head < b.at) continue;
        for (const [w, col, al] of [[3.2, ORANGE, 0.22], [0.8, GOLD, 0.8]]) {
          g.strokeStyle = `rgba(${col},${(al * a).toFixed(3)})`; g.lineWidth = w * T.w;
          this.drawPath(g, b.path.pts, b.path.nor, 0, b.path.pts.length - 1, { amp: 0, freq: 0, ph: 0, sp: 0 }, 3);
        }
      }
    }
    this.tendrils = this.tendrils.filter((T) => T.age < T.life);
    // faíscas
    for (const p of this.sparks) {
      p.age += dt; p.vx *= 1 - 2.2 * dt; p.vy = p.vy * (1 - 2.2 * dt) + 900 * dt;
      const x0 = p.x, y0 = p.y; p.x += p.vx * dt; p.y += p.vy * dt;
      const k = 1 - p.age / p.life;
      g.strokeStyle = `rgba(${p.hot ? HOT : Math.random() < 0.5 ? GOLD : ORANGE},${(0.95 * k).toFixed(3)})`; g.lineWidth = p.hot ? 1.5 : 1;
      g.beginPath(); g.moveTo(x0 - p.vx * dt * 1.5, y0 - p.vy * dt * 1.5); g.lineTo(p.x, p.y); g.stroke();
    }
    this.sparks = this.sparks.filter((p) => p.age < p.life);
    // brasas e bokeh
    for (const e of this.embers) {
      e.age += dt; e.x += e.vx * dt; e.y += e.vy * dt;
      const k = Math.sin(Math.PI * Math.min(1, e.age / e.life)) * (0.7 + 0.3 * Math.sin(this.t * 14 + e.ph));
      if (e.big) { const rg = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r); rg.addColorStop(0, `rgba(${ORANGE},${(0.16 * k).toFixed(3)})`); rg.addColorStop(1, `rgba(${RED},0)`); g.fillStyle = rg; g.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2); }
      else { g.fillStyle = `rgba(${Math.random() < 0.5 ? GOLD : ORANGE},${(0.85 * k).toFixed(3)})`; g.fillRect(e.x - e.r / 2, e.y - e.r / 2, e.r, e.r * 2.2); }
    }
    this.embers = this.embers.filter((e) => e.age < e.life);
    // clarão do salto: núcleo quente → laranja → vermelho
    if (this.flash > 0.01) {
      const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
      gr.addColorStop(0, `rgba(${HOT},${(0.5 * this.flash).toFixed(3)})`); gr.addColorStop(0.45, `rgba(${ORANGE},${(0.26 * this.flash).toFixed(3)})`); gr.addColorStop(1, `rgba(${RED},${(0.18 * this.flash).toFixed(3)})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      this.flash *= Math.pow(0.015, dt);
    }
    g.globalCompositeOperation = "source-over";
  }
  dispose() { cancelAnimationFrame(this.raf); window.removeEventListener("resize", this.resize); window.removeEventListener("pointermove", this.onMove); this.c.remove(); }
}
