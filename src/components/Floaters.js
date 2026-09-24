// Gravidade zero para os elementos da hero: flutuação idle, inclinação 3D que olha para o cursor,
// arrasto com inércia e retorno lento por mola (k 5, c 3,1 — levemente subamortecido).
const K = 5, C = 3.1;

export default class Floaters {
  constructor(root) {
    this.root = root;
    this.items = [...root.querySelectorAll("[data-float]")].map((el, i) => ({
      el,
      depth: +el.dataset.depth || 1,
      amp: +el.dataset.amp || 10,
      speed: +el.dataset.speed || 0.5,
      phase: i * 1.7,
      x: 0, y: 0, vx: 0, vy: 0, rx: 0, ry: 0, rz: 0,
      drag: null, moved: false,
    }));
    this.mouse = { x: innerWidth / 2, y: innerHeight / 2, on: false };
    this.enabled = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.last = performance.now();
    this.t = 0;
    this.running = false;

    this.onMove = (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.on = e.pointerType !== "touch"; };
    window.addEventListener("pointermove", this.onMove, { passive: true });
    this.items.forEach((it) => this.bind(it));
  }

  bind(it) {
    const el = it.el;
    it.down = (e) => {
      if (e.button !== 0) return;
      const r = el.getBoundingClientRect();
      it.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, lx: e.clientX, ly: e.clientY, lt: performance.now(), cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      it.moved = false;
      // sem setPointerCapture: a captura redireciona o click para o contêiner e o botão interno não abre
      window.addEventListener("pointermove", it.move);
      window.addEventListener("pointerup", it.up);
      window.addEventListener("pointercancel", it.up);
    };
    it.move = (e) => {
      const g = it.drag;
      if (!g || g.id !== e.pointerId) return;
      const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
      if (!it.moved && Math.hypot(dx, dy) > 6) { it.moved = true; el.classList.add("is-drag"); this.root.classList.add("has-drag"); }
      if (!it.moved) return;
      e.preventDefault();
      const t = performance.now(), dt = Math.max(1, t - g.lt) / 1000;
      it.vx = (e.clientX - g.lx) / dt; it.vy = (e.clientY - g.ly) / dt;
      g.lx = e.clientX; g.ly = e.clientY; g.lt = t;
      it.x = g.ox + dx; it.y = g.oy + dy;
    };
    it.up = (e) => {
      const g = it.drag;
      if (!g || g.id !== e.pointerId) return;
      it.drag = null;
      window.removeEventListener("pointermove", it.move);
      window.removeEventListener("pointerup", it.up);
      window.removeEventListener("pointercancel", it.up);
      // arremesso limitado: flutua um pouco antes de voltar
      const sp = Math.hypot(it.vx, it.vy), max = 1400;
      if (sp > max) { it.vx *= max / sp; it.vy *= max / sp; }
      el.classList.remove("is-drag");
      this.root.classList.remove("has-drag");
    };
    // clique só se não houve arrasto
    it.click = (e) => { if (it.moved) { e.preventDefault(); e.stopPropagation(); it.moved = false; } };
    el.addEventListener("pointerdown", it.down);
    el.addEventListener("click", it.click, true);
    el.addEventListener("dragstart", (e) => e.preventDefault());
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.033, (now - this.last) / 1000);
      this.last = now; this.t += dt;
      this.step(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  step(dt) {
    const mx = this.mouse.x / innerWidth - 0.5, my = this.mouse.y / innerHeight - 0.5;
    const rects = this.items.map((it) => it.el.getBoundingClientRect()); // lê tudo antes de escrever
    this.items.forEach((it, i) => {
      const f = this.enabled ? 1 : 0;
      // alvo = flutuação + paralaxe de profundidade
      const fx = f * (Math.sin(this.t * it.speed + it.phase) * it.amp * 0.6 + (this.mouse.on ? mx * -26 * it.depth : 0));
      const fy = f * (Math.cos(this.t * it.speed * 0.8 + it.phase) * it.amp + (this.mouse.on ? my * -18 * it.depth : 0));
      if (!it.drag) {
        const ax = K * (fx - it.x) - C * it.vx, ay = K * (fy - it.y) - C * it.vy;
        it.vx += ax * dt; it.vy += ay * dt;
        it.x += it.vx * dt; it.y += it.vy * dt;
      }
      // inclinação: olha para o cursor quando perto, segue a velocidade quando arrastado/solto
      const r = rects[i];
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = this.mouse.x - cx, dy = this.mouse.y - cy, dist = Math.hypot(dx, dy);
      const near = this.mouse.on ? Math.max(0, 1 - dist / 520) : 0;
      let trx = (-dy / 520) * 16 * near + Math.sin(this.t * it.speed * 1.3 + it.phase) * 3 * f;
      let try_ = (dx / 520) * 20 * near + Math.cos(this.t * it.speed + it.phase) * 4 * f;
      let trz = Math.max(-14, Math.min(14, it.vx * 0.012));
      trx += Math.max(-18, Math.min(18, -it.vy * 0.015));
      try_ += Math.max(-18, Math.min(18, it.vx * 0.015));
      const e = 1 - Math.exp(-dt * 7);
      it.rx += (trx - it.rx) * e; it.ry += (try_ - it.ry) * e; it.rz += (trz - it.rz) * e;
      it.el.style.transform = `translate3d(${it.x.toFixed(2)}px, ${it.y.toFixed(2)}px, 0) rotateX(${it.rx.toFixed(2)}deg) rotateY(${it.ry.toFixed(2)}deg) rotateZ(${it.rz.toFixed(2)}deg)`;
      it.el.style.setProperty("--gx", `${(50 + it.ry * 2.4).toFixed(1)}%`);
      it.el.style.setProperty("--gy", `${(50 - it.rx * 2.4).toFixed(1)}%`);
    });
  }

  dispose() {
    this.stop();
    window.removeEventListener("pointermove", this.onMove);
    for (const it of this.items) {
      it.el.removeEventListener("pointerdown", it.down);
      window.removeEventListener("pointermove", it.move);
      window.removeEventListener("pointerup", it.up);
      window.removeEventListener("pointercancel", it.up);
      it.el.removeEventListener("click", it.click, true);
    }
  }
}
