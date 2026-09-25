const RED = "255,42,16", ORANGE = "255,118,28", GOLD = "255,200,70", HOT = "255,255,255";
const rnd = (a, b) => a + Math.random() * (b - a);

function generateLightning(x1, y1, x2, y2, displace = 80, detail = 5) {
  let segments = [{ x1, y1, x2, y2 }];
  for (let i = 0; i < detail; i++) {
    const next = [];
    for (const s of segments) {
      const mx = (s.x1 + s.x2) / 2;
      const my = (s.y1 + s.y2) / 2;
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const len = Math.hypot(dx, dy);
      if (len < 1) {
        next.push(s);
        continue;
      }
      const nx = -dy / len;
      const ny = dx / len;
      const offset = (Math.random() - 0.5) * displace;
      const cx = mx + nx * offset;
      const cy = my + ny * offset;
      next.push({ x1: s.x1, y1: s.y1, x2: cx, y2: cy });
      next.push({ x1: cx, y1: cy, x2: s.x2, y2: s.y2 });
    }
    segments = next;
    displace *= 0.55;
  }
  const pts = [{ x: segments[0].x1, y: segments[0].y1 }];
  for (const s of segments) pts.push({ x: s.x2, y: s.y2 });
  return pts;
}

class LightningBolt {
  constructor(x1, y1, x2, y2, width, life, displace = 80, branchProb = 0.7) {
    this.pts = generateLightning(x1, y1, x2, y2, displace, 5);
    this.width = width;
    this.life = rnd(life * 0.8, life * 1.2);
    this.age = 0;
    this.branches = [];
    
    if (width > 0.5 && branchProb > 0.1) {
      const branchCount = Math.floor(rnd(0, 4) * branchProb);
      for (let i = 0; i < branchCount; i++) {
        const startIdx = Math.floor(rnd(1, this.pts.length - 2));
        const p1 = this.pts[startIdx];
        const p2 = this.pts[startIdx + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const baseAngle = Math.atan2(dy, dx);
        const angle = baseAngle + (Math.random() < 0.5 ? 1 : -1) * rnd(0.5, 1.2);
        const len = rnd(40, 150) * width;
        const bx = p1.x + Math.cos(angle) * len;
        const by = p1.y + Math.sin(angle) * len;
        
        const branchDetail = this.width < 1 ? 3 : 4;
        const subBolt = new LightningBolt(p1.x, p1.y, bx, by, width * 0.5, life * 0.7, displace * 0.5, branchProb * 0.4);
        subBolt.pts = generateLightning(p1.x, p1.y, bx, by, displace * 0.5, branchDetail);
        this.branches.push(subBolt);
      }
    }
  }
  update(dt) {
    this.age += dt;
    for (const b of this.branches) b.update(dt);
  }
  draw(g, dt) {
    if (this.age > this.life) return;
    const fade = Math.max(0, 1 - this.age / this.life);
    const flicker = 0.5 + Math.random() * 0.5;
    const a = fade * flicker;

    g.beginPath();
    g.moveTo(this.pts[0].x, this.pts[0].y);
    for (let i = 1; i < this.pts.length; i++) g.lineTo(this.pts[i].x, this.pts[i].y);
    
    g.lineCap = "round";
    g.lineJoin = "miter";
    g.miterLimit = 2;

    // Glow layers
    if (this.width > 1.2) {
      g.strokeStyle = `rgba(${ORANGE}, ${(a * 0.25).toFixed(3)})`;
      g.lineWidth = this.width * 8;
      g.stroke();
    }

    if (this.width > 0.6) {
      g.strokeStyle = `rgba(${GOLD}, ${(a * 0.6).toFixed(3)})`;
      g.lineWidth = this.width * 3.5;
      g.stroke();
    }

    g.strokeStyle = `rgba(${HOT}, ${a.toFixed(3)})`;
    g.lineWidth = this.width * 1.5;
    g.stroke();

    for (const b of this.branches) b.draw(g, dt);
  }
}

export default class Speedforce {
  constructor() {
    const c = (this.c = document.createElement("canvas"));
    c.className = "speedforce"; c.setAttribute("aria-hidden", "true");
    c.style.visibility = "hidden";
    document.body.appendChild(c);
    this.g = c.getContext("2d");
    this.bolts = []; this.sparks = []; this.embers = []; this.spawners = [];
    this.flash = 0; this.haze = 0; this.charge = 0;
    this.running = false; this.px = -1; this.py = -1; this.pt = 0; this.lastArc = 0;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.lite = false;
    this.resize = () => {
      const d = Math.max(0.5, Math.min(this.lite ? 1 : 1.25, devicePixelRatio, Math.sqrt(1800000 / (innerWidth * innerHeight))));
      c.width = Math.round(innerWidth * d); c.height = Math.round(innerHeight * d);
      this.g.setTransform(d, 0, 0, d, 0, 0);
    };
    this.resize(); window.addEventListener("resize", this.resize);
    this.onMove = (e) => {
      const now = performance.now(), dt = Math.max(1, now - this.pt), vx = (e.clientX - this.px) / dt, vy = (e.clientY - this.py) / dt, sp = Math.hypot(vx, vy);
      if (this.px >= 0 && !this.reduced) {
        if (this.charge > 0) {
          if (now - this.lastArc > 80) { this.lastArc = now; this.arc(e.clientX, e.clientY); }
          if (this.sparks.length < 50) this.spray(e.clientX, e.clientY, 1, 150, -vx * 100, -vy * 100);
        } else if (sp > 3.2 && this.sparks.length < 30) {
          this.spray(e.clientX, e.clientY, 1, 100, -vx * 50, -vy * 50, 0.6);
        }
      }
      this.px = e.clientX; this.py = e.clientY; this.pt = now;
    };
    window.addEventListener("pointermove", this.onMove, { passive: true });
  }

  arc(x, y) {
    const angle = rnd(0, Math.PI * 2);
    const len = rnd(40, 100);
    this.bolts.push(new LightningBolt(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len, rnd(0.5, 1.2), 0.2, 40, 0.4));
    this.start();
  }

  bolt(x1, y1, x2, y2, w = 1.5, life = 0.3) {
    this.bolts.push(new LightningBolt(x1, y1, x2, y2, w, life, Math.hypot(x2 - x1, y2 - y1) * 0.15, 1.0));
    this.start();
  }

  spray(x, y, n, speed, bx = 0, by = 0, life = 1) {
    for (let i = 0; i < n; i++) {
      // If x,y is center, scatter them across the screen instead for a global effect
      const isCenter = (Math.abs(x - innerWidth/2) < 50 && Math.abs(y - innerHeight/2) < 50);
      const px = isCenter ? rnd(0, innerWidth) : x;
      const py = isCenter ? rnd(0, innerHeight * 0.8) : y;
      
      const a = rnd(0, Math.PI * 2), v = speed * (0.3 + Math.random());
      const vx = isCenter ? rnd(-speed, speed) * 0.6 : Math.cos(a) * v + bx;
      const vy = isCenter ? rnd(-speed * 0.8, speed * 0.2) : Math.sin(a) * v + by;
      
      this.sparks.push({ x: px, y: py, vx, vy, age: 0, life: rnd(0.5, 1.8) * life, hot: Math.random() < 0.3 });
    }
    this.start();
  }

  embersAt(n) { /* Disabled: User wants sharp falling sparks, no blurry bokeh */ }

  edge() {
    const w = innerWidth, h = innerHeight, s = Math.floor(Math.random() * 4), m = 60;
    return s === 0 ? [rnd(0, w), -m] : s === 1 ? [w + m, rnd(0, h)] : s === 2 ? [rnd(0, w), h + m] : [-m, rnd(0, h)];
  }

  burst(x, y, jumpAt = 0.28) {
    if (this.reduced) return;
    const L = this.lite;
    this.haze = 0.4;
    this.spray(x, y, L ? 30 : 100, 900);
    
    // Initial striking bolts
    for (let i = 0; i < (L ? 2 : 4); i++) {
      const [ex, ey] = this.edge();
      this.bolt(x, y, ex, ey, rnd(1.0, 1.8), 0.25);
    }
    
    this.after(jumpAt, () => {
      this.flash = 1.5; this.haze = 1.2;
      
      // Explosion of cinematic lightning
      for (let i = 0; i < (L ? 3 : 7); i++) {
        const [ax, ay] = this.edge(), [bx, by] = this.edge();
        this.bolt(ax, ay, bx, by, rnd(1.5, 3.5), rnd(0.3, 0.6));
      }
      
      this.spray(innerWidth / 2, innerHeight / 2, L ? 40 : 150, 1800);
      
      this.charge = 1.0;
    });
  }

  after(t, fn) { this.spawners.push({ step: Infinity, dur: t, fn: null, done: fn, t: 0, acc: 0 }); this.start(); }

  start() {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    this.c.style.visibility = "visible";
    const loop = (now) => {
      const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
      this.step(dt);
      if (this.bolts.length || this.sparks.length || this.embers.length || this.spawners.length || this.flash > 0.01 || this.haze > 0.01 || this.charge > 0) {
        this.raf = requestAnimationFrame(loop);
      } else {
        this.running = false; this.g.clearRect(0, 0, innerWidth, innerHeight); this.c.style.visibility = "hidden";
      }
    };
    this.raf = requestAnimationFrame(loop);
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

    if (this.haze > 0.01) {
      const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.1, W / 2, H / 2, Math.hypot(W, H) * 0.6);
      gr.addColorStop(0, `rgba(120,10,4,${(0.15 * this.haze).toFixed(3)})`); gr.addColorStop(1, `rgba(60,0,0,0)`);
      g.globalCompositeOperation = "source-over";
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      this.haze *= Math.pow(0.05, dt);
    }
    
    g.globalCompositeOperation = "lighter";
    
    // Bolts
    for (const B of this.bolts) {
      B.update(dt);
      B.draw(g, dt);
    }
    this.bolts = this.bolts.filter((B) => B.age < B.life);

    // Sparks
    for (const p of this.sparks) {
      p.age += dt; 
      p.vx *= 1 - 0.5 * dt; // less drag
      p.vy = p.vy * (1 - 0.5 * dt) + 1800 * dt; // Strong gravity (1800px/s^2)
      
      const x0 = p.x, y0 = p.y; 
      p.x += p.vx * dt; 
      p.y += p.vy * dt;
      
      const k = 1 - p.age / p.life;
      // Sharp, crisp sparks (not blurry)
      g.strokeStyle = `rgba(${p.hot ? HOT : (Math.random() < 0.5 ? GOLD : ORANGE)},${(k).toFixed(3)})`; 
      g.lineWidth = p.hot ? 2 : 1;
      
      // Draw as a stretched line based on velocity (motion blur style)
      g.beginPath(); 
      g.moveTo(x0 - p.vx * dt * 0.8, y0 - p.vy * dt * 0.8); 
      g.lineTo(p.x, p.y); 
      g.stroke();
    }
    this.sparks = this.sparks.filter((p) => p.age < p.life);

    // Embers removed

    // Flash
    if (this.flash > 0.01) {
      g.globalCompositeOperation = "lighter";
      const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
      gr.addColorStop(0, `rgba(${HOT},${(0.4 * this.flash).toFixed(3)})`); gr.addColorStop(0.3, `rgba(${ORANGE},${(0.2 * this.flash).toFixed(3)})`); gr.addColorStop(1, `rgba(${RED},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      this.flash *= Math.pow(0.01, dt);
    }
  }
  dispose() { cancelAnimationFrame(this.raf); window.removeEventListener("resize", this.resize); window.removeEventListener("pointermove", this.onMove); this.c.remove(); }
}
