// Efeitos pontuais opcionais (Web Audio API), sem trilha ou leitos de fundo.
// Cadeia: fontes → [seco + envio de reverb] → master → compressor/limitador → saída.
// O navegador só libera áudio depois de um gesto (clique/tecla/toque): até lá tudo é silencioso.
const PENT = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760]; // dó maior pentatônica
const KEY = "aa-sound";

class Sound {
  constructor() {
    this.ctx = null;
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch { /* sem storage */ }
    this.enabled = saved === "on";
    this.subs = new Set();
    this.last = {};
    this.unlocked = false;
  }

  /* ── estado ── */
  onChange(f) { this.subs.add(f); return () => this.subs.delete(f); }
  set(on) {
    this.enabled = on;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* sem storage */ }
    if (this.ctx) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.08);
    if (on) { this.unlock(); this.chime(); }
    this.hint?.();
    this.subs.forEach((f) => f(on));
  }
  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) this.build();
    if (this.ctx.state === "suspended") this.ctx.resume().then(() => this.hint());
    this.unlocked = true;
    this.hint();
  }
  ok() { return this.enabled && this.ctx && this.ctx.state === "running"; }
  // tenta começar sem gesto: o navegador libera quando o site tem permissão de som
  // (Chrome "Som: Permitir"/alto engajamento de mídia, Firefox "Permitir áudio e vídeo"); senão fica suspenso até o 1º clique
  tryAutoplay() {
    if (!this.enabled) return Promise.resolve(false);
    if (!this.ctx) this.build();
    const done = () => { const on = this.ctx.state === "running"; if (on) this.unlocked = true; this.hint(); return on; };
    return Promise.race([this.ctx.resume().then(done, done), new Promise((r) => setTimeout(() => r(done()), 400))]);
  }
  // limita a taxa de disparo por tipo (ms)
  rate(k, ms) { const n = performance.now(); if (n - (this.last[k] || 0) < ms) return false; this.last[k] = n; return true; }

  build() {
    const C = window.AudioContext || window.webkitAudioContext;
    const ctx = (this.ctx = new C({ latencyHint: "interactive" }));
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -20; this.comp.knee.value = 12; this.comp.ratio.value = 6; this.comp.attack.value = 0.004; this.comp.release.value = 0.2;
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? 0.9 : 0;
    this.master.connect(this.comp).connect(ctx.destination);
    // reverb: resposta ao impulso gerada (ruído com decaimento exponencial, 3,2 s, estéreo)
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.rev = ctx.createConvolver(); this.rev.buffer = ir;
    this.revIn = ctx.createGain(); this.revIn.gain.value = 0.55;
    this.revIn.connect(this.rev).connect(this.master);
    // ruído branco e ruído "sample & hold" (digital) reutilizáveis
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    const gb = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate), gd = gb.getChannelData(0);
    for (let i = 0, v = 0; i < gd.length; i++) { if (i % 37 === 0) v = Math.random() * 2 - 1; gd[i] = v; }
    this.crush = gb;
    document.addEventListener("visibilitychange", () => { if (!this.ctx) return; document.hidden ? this.ctx.suspend() : this.enabled && this.ctx.resume(); });
  }

  /* ── utilitários ── */
  out(node, { rev = 0.2, pan = 0 } = {}) {
    const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
    node.connect(p); p.connect(this.master);
    if (rev) { const s = this.ctx.createGain(); s.gain.value = rev; p.connect(s).connect(this.revIn); }
    return p;
  }
  env(peak, a, d, t = this.ctx.currentTime) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    return g;
  }
  osc(type, f, t) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; }
  src(buf, t, dur) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(t, Math.random()); s.stop(t + dur); return s; }
  panX(x) { return x == null ? 0 : (x / innerWidth) * 1.4 - 0.7; }

  // Compatibilidade com interações visuais: nenhum gerador contínuo é criado.
  scrollAir() {}
  padLevel() {}
  spin() {}
  music() {}
  musicHold() {}
  hint() { window.dispatchEvent(new CustomEvent("sfx:hint", { detail: false })); }

  /* ── eventos ── */
  tick(f = 2200, x, g = 0.03) {
    if (!this.ok() || !this.rate("tick", 45)) return;
    const t = this.ctx.currentTime, o = this.osc("sine", f, t), e = this.env(g, 0.002, 0.07, t);
    o.connect(e); this.out(e, { rev: 0.18, pan: this.panX(x) }); o.start(t); o.stop(t + 0.1);
  }
  navTick(i, x) { this.tick(PENT[(i + 4) % PENT.length], x, 0.035); }
  glass(x) { // hover nos chips de vidro
    if (!this.ok() || !this.rate("glass", 120)) return;
    const t = this.ctx.currentTime;
    [1760, 2637, 3520].forEach((f, i) => { const o = this.osc("sine", f, t), e = this.env([0.022, 0.01, 0.005][i], 0.003, 0.5 - i * 0.1, t); o.connect(e); this.out(e, { rev: 0.55, pan: this.panX(x) }); o.start(t); o.stop(t + 0.6); });
  }
  projector(x) { // hover em vídeo: dois cliques de mecanismo
    if (!this.ok() || !this.rate("proj", 160)) return;
    const t = this.ctx.currentTime;
    [0, 0.045].forEach((d) => { const s = this.src(this.noise, t + d, 0.02), h = this.ctx.createBiquadFilter(); h.type = "bandpass"; h.frequency.value = 2400; h.Q.value = 3; const e = this.env(0.05, 0.001, 0.018, t + d); s.connect(h).connect(e); this.out(e, { rev: 0.1, pan: this.panX(x) }); });
    const o = this.osc("sine", 1200, t), e = this.env(0.012, 0.004, 0.12, t); o.connect(e); this.out(e, { rev: 0.3 }); o.start(t); o.stop(t + 0.15);
  }
  thock(x) { // clique: corpo grave + transiente
    if (!this.ok() || !this.rate("thock", 60)) return;
    const t = this.ctx.currentTime, o = this.osc("sine", 190, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.09);
    const e = this.env(0.06, 0.002, 0.11, t); o.connect(e); this.out(e, { rev: 0.12, pan: this.panX(x) }); o.start(t); o.stop(t + 0.15);
    const s = this.src(this.noise, t, 0.03), b = this.ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = 1500; b.Q.value = 1.2;
    const en = this.env(0.03, 0.001, 0.025, t); s.connect(b).connect(en); this.out(en, { rev: 0.1 });
  }
  whoosh(dur = 0.5, up = true, g = 0.12, x) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, s = this.src(this.noise, t, dur + 0.1), b = this.ctx.createBiquadFilter();
    b.type = "bandpass"; b.Q.value = 0.9;
    b.frequency.setValueAtTime(up ? 280 : 3200, t); b.frequency.exponentialRampToValueAtTime(up ? 3600 : 240, t + dur);
    const e = this.ctx.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(g, t + dur * (up ? 0.75 : 0.25)); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = this.ctx.createStereoPanner(); const p0 = x == null ? (up ? -0.6 : 0.6) : this.panX(x);
    p.pan.setValueAtTime(p0, t); p.pan.linearRampToValueAtTime(-p0 * 0.8, t + dur);
    s.connect(b).connect(e).connect(p); p.connect(this.master);
    const sd = this.ctx.createGain(); sd.gain.value = 0.35; p.connect(sd).connect(this.revIn);
  }
  boom(g = 0.32) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, o = this.osc("sine", 78, t); o.frequency.exponentialRampToValueAtTime(31, t + 0.9);
    const e = this.env(g, 0.006, 1.3, t); o.connect(e); this.out(e, { rev: 0.25 }); o.start(t); o.stop(t + 1.4);
    const s = this.src(this.noise, t, 0.5), l = this.ctx.createBiquadFilter(); l.type = "lowpass"; l.frequency.value = 180;
    const en = this.env(g * 0.5, 0.002, 0.4, t); s.connect(l).connect(en); this.out(en, { rev: 0.3 });
  }
  shimmer(g = 0.02, delay = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime + delay;
    [1318.51, 1567.98, 1975.53, 2637.02].forEach((f, i) => [-6, 6].forEach((det) => {
      const o = this.osc("sine", f, t); o.detune.value = det;
      const e = this.env(g / 2, 0.02 + i * 0.03, 1.8, t); o.connect(e); this.out(e, { rev: 0.9, pan: (i - 1.5) * 0.35 }); o.start(t); o.stop(t + 2.1);
    }));
  }
  glitch(g = 0.05, reps = 3) {
    if (!this.ok() || !this.rate("glitch", 180)) return;
    const t = this.ctx.currentTime;
    for (let k = 0; k < reps; k++) {
      const s = this.src(this.crush, t + k * 0.034, 0.028), b = this.ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = 900 + Math.random() * 3000; b.Q.value = 2;
      const e = this.env(g, 0.001, 0.026, t + k * 0.034); s.connect(b).connect(e); this.out(e, { rev: 0.15, pan: Math.random() - 0.5 });
    }
  }
  splice(x) { // corte na timeline: fita cortada
    if (!this.ok() || !this.rate("splice", 70)) return;
    const t = this.ctx.currentTime, s = this.src(this.noise, t, 0.012), h = this.ctx.createBiquadFilter(); h.type = "highpass"; h.frequency.value = 3200;
    const e = this.env(0.045, 0.001, 0.01, t); s.connect(h).connect(e); this.out(e, { rev: 0.12, pan: this.panX(x) });
    const o = this.osc("triangle", 880, t), eo = this.env(0.012, 0.001, 0.03, t); o.connect(eo); this.out(eo, { rev: 0.2 }); o.start(t); o.stop(t + 0.05);
  }
  sparkle(x, y) { // partículas sob o cursor
    if (!this.ok() || !this.rate("sparkle", 85)) return;
    const t = this.ctx.currentTime, f = PENT[5 + Math.floor((1 - y / innerHeight) * 5) % 5] * (Math.random() < 0.3 ? 2 : 1);
    const o = this.osc("sine", f, t), e = this.env(0.009 + Math.random() * 0.008, 0.004, 0.35, t); o.connect(e); this.out(e, { rev: 0.75, pan: this.panX(x) }); o.start(t); o.stop(t + 0.45);
  }
  pickup(x) { // agarrar um flutuante
    if (!this.ok()) return;
    const t = this.ctx.currentTime, o = this.osc("sine", 320, t); o.frequency.exponentialRampToValueAtTime(760, t + 0.14);
    const e = this.env(0.05, 0.01, 0.16, t); o.connect(e); this.out(e, { rev: 0.4, pan: this.panX(x) }); o.start(t); o.stop(t + 0.2);
  }
  release(speed, x) { // soltar: sopro proporcional ao arremesso
    const a = Math.min(1, speed / 1400);
    this.whoosh(0.3 + a * 0.35, true, 0.03 + a * 0.08, x);
  }
  bell(g = 0.05) { // FM: sino metálico quando a marca 3D assenta
    if (!this.ok() || !this.rate("bell", 600)) return;
    const t = this.ctx.currentTime, car = this.osc("sine", 659.25, t), mod = this.osc("sine", 659.25 * 1.41, t), mg = this.ctx.createGain();
    mg.gain.setValueAtTime(900, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.4);
    mod.connect(mg).connect(car.frequency);
    const e = this.env(g, 0.003, 1.8, t); car.connect(e); this.out(e, { rev: 0.7 }); car.start(t); mod.start(t); car.stop(t + 2); mod.stop(t + 2);
  }
  chime() { // confirmação (copiar e-mail, ligar o som)
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    [[1318.51, 0], [1975.53, 0.09]].forEach(([f, d]) => { const o = this.osc("sine", f, t + d), e = this.env(0.03, 0.004, 0.6, t + d); o.connect(e); this.out(e, { rev: 0.6 }); o.start(t + d); o.stop(t + d + 0.7); });
  }
  riser(dur = 1.2) { // início do tour
    if (!this.ok()) return;
    this.whoosh(dur, true, 0.1);
    const t = this.ctx.currentTime, o = this.osc("sawtooth", 110, t), l = this.ctx.createBiquadFilter(); l.type = "lowpass"; l.frequency.setValueAtTime(200, t); l.frequency.exponentialRampToValueAtTime(2400, t + dur);
    o.frequency.exponentialRampToValueAtTime(220, t + dur);
    const e = this.ctx.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.035, t + dur); e.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
    o.connect(l).connect(e); this.out(e, { rev: 0.6 }); o.start(t); o.stop(t + dur + 0.5);
    setTimeout(() => this.shimmer(0.02), dur * 1000);
  }
  // curva de saturação (tanh) para gerar harmônicos audíveis em caixas pequenas
  drive(k = 3) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
    const w = this.ctx.createWaveShaper(); w.curve = c; w.oversample = "4x"; return w;
  }
  // estalo elétrico: micro-rajadas de ruído agudo com ganhos e filtros aleatórios
  crackle(dur = 0.6, g = 0.08, x, at = this.ctx.currentTime, density = 70) {
    const n = Math.round(dur * density);
    for (let i = 0; i < n; i++) {
      const t = at + Math.random() * dur, fade = 1 - (t - at) / dur;
      const s = this.src(this.noise, t, 0.012), b = this.ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = 2500 + Math.random() * 6000; b.Q.value = 1.5;
      const e = this.env(g * (0.3 + Math.random() * 0.7) * fade + 0.0002, 0.0005, 0.004 + Math.random() * 0.01, t);
      s.connect(b).connect(e); this.out(e, { rev: 0.2, pan: x == null ? Math.random() * 1.6 - 0.8 : this.panX(x) + (Math.random() - 0.5) * 0.6 });
    }
  }
  zap(at = this.ctx.currentTime, g = 0.07, x) { // descarga: serra despencando de 2,6 kHz
    const o = this.osc("sawtooth", 2400 + Math.random() * 800, at); o.frequency.exponentialRampToValueAtTime(160 + Math.random() * 120, at + 0.09);
    const b = this.ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = 1800; b.Q.value = 0.8;
    const e = this.env(g, 0.001, 0.1, at); o.connect(b).connect(e); this.out(e, { rev: 0.3, pan: x == null ? Math.random() - 0.5 : this.panX(x) }); o.start(at); o.stop(at + 0.13);
  }
  teleport(x) { // "speed force": carga elétrica → estrondo sônico no salto → passagem com Doppler → estalos morrendo
    if (!this.ok()) return;
    const ctx = this.ctx, t0 = ctx.currentTime, hit = t0 + 0.28;
    // carga: zumbido de campo (60/120 Hz com tremolo de 28 Hz) + estalos + zaps
    const hum = ctx.createGain(); hum.gain.setValueAtTime(0.0001, t0); hum.gain.exponentialRampToValueAtTime(0.09, hit); hum.gain.exponentialRampToValueAtTime(0.0001, hit + 0.7);
    // tremolo num estágio próprio (0–1), antes do envelope — modular o envelope direto somava ±0,5 ao ganho
    const vca = ctx.createGain(); vca.gain.value = 0.5; vca.connect(hum);
    const trem = this.osc("sine", 28, t0), tg = ctx.createGain(); tg.gain.value = 0.5; trem.connect(tg).connect(vca.gain);
    [[60, "sawtooth"], [120, "square"]].forEach(([f, ty]) => { const o = this.osc(ty, f, t0), l = ctx.createBiquadFilter(); l.type = "lowpass"; l.frequency.value = 900; o.connect(l).connect(vca); o.start(t0); o.stop(hit + 0.8); });
    trem.start(t0); trem.stop(hit + 0.8); this.out(hum, { rev: 0.2 });
    this.crackle(0.3, 0.075, x, t0, 90);
    [0, 0.08, 0.17, 0.24].forEach((d) => this.zap(t0 + d, 0.055, x));
    this.whoosh(0.28, true, 0.13, x);
    // salto: estrondo sônico (impacto mais contido) + estalo largo
    this.impact(hit, 0.3);
    const cr = this.src(this.noise, hit, 0.1), ch = ctx.createBiquadFilter(); ch.type = "highpass"; ch.frequency.value = 1500;
    const ce = this.env(0.22, 0.001, 0.09, hit); cr.connect(ch).connect(ce); this.out(ce, { rev: 0.5 });
    // passagem Doppler: faixa brilhante varrendo de 6 kHz a 300 Hz, esquerda → direita
    const dp = this.src(this.noise, hit, 0.6), db = ctx.createBiquadFilter(); db.type = "bandpass"; db.Q.value = 2.2;
    db.frequency.setValueAtTime(6000, hit); db.frequency.exponentialRampToValueAtTime(300, hit + 0.5);
    const de = this.env(0.1, 0.01, 0.48, hit), pan = ctx.createStereoPanner(); pan.pan.setValueAtTime(-0.9, hit); pan.pan.linearRampToValueAtTime(0.9, hit + 0.5);
    dp.connect(db).connect(de).connect(pan); pan.connect(this.master); const sd = ctx.createGain(); sd.gain.value = 0.3; pan.connect(sd).connect(this.revIn);
    // rescaldo: raios na tela inteira = estalos espalhados + zaps rarefeitos
    this.crackle(0.75, 0.05, null, hit + 0.02, 60);
    [0.06, 0.18, 0.33, 0.5].forEach((d) => this.zap(hit + d, 0.038));
  }
  // impacto de trailer: estalo + soco saturado + sub + braam (serras desafinadas com filtro fechando)
  impact(hit = this.ctx.currentTime, g = 1) {
    const ctx = this.ctx;
    const crack = this.src(this.noise, hit, 0.06), cb = ctx.createBiquadFilter(); cb.type = "bandpass"; cb.frequency.value = 3200; cb.Q.value = 0.7;
    const ce = this.env(0.35 * g, 0.001, 0.05, hit); crack.connect(cb).connect(ce); this.out(ce, { rev: 0.35 });
    const punch = this.osc("triangle", 115, hit); punch.frequency.exponentialRampToValueAtTime(42, hit + 0.35);
    const pd = this.drive(4), pl = ctx.createBiquadFilter(); pl.type = "lowpass"; pl.frequency.value = 1800;
    const pe = this.env(0.42 * g, 0.002, 0.55, hit); punch.connect(pd).connect(pl).connect(pe); this.out(pe, { rev: 0.3 }); punch.start(hit); punch.stop(hit + 0.7);
    const sub = this.osc("sine", 72, hit); sub.frequency.exponentialRampToValueAtTime(28, hit + 1.6);
    const se = this.env(0.4 * g, 0.004, 1.9, hit); sub.connect(se); this.out(se, { rev: 0.15 }); sub.start(hit); sub.stop(hit + 2.1);
    const braam = ctx.createBiquadFilter(); braam.type = "lowpass"; braam.Q.value = 2.5;
    braam.frequency.setValueAtTime(2600, hit); braam.frequency.exponentialRampToValueAtTime(160, hit + 1.8);
    const bd = this.drive(2.2), be = this.env(0.16 * g, 0.012, 2.2, hit);
    [55, 82.41, 110, 164.81].forEach((f, i) => [-14, 9].forEach((det) => { const o = this.osc("sawtooth", f, hit); o.detune.value = det + i * 3; o.connect(braam); o.start(hit); o.stop(hit + 2.4); }));
    braam.connect(bd).connect(be); this.out(be, { rev: 0.85 });
  }
  // ── abertura: efeitos pontuais sincronizados, sem acompanhamento musical ──
  // fase 1 — logo em wipe + timecode contando
  introPre(dur = 1.4) {
    if (!this.ok()) return;
    const t0 = this.ctx.currentTime;
    this.whoosh(0.8, true, 0.035);
    const o = this.osc("sine", 42, t0); o.frequency.exponentialRampToValueAtTime(64, t0 + dur); // "fita ganhando velocidade"
    const e = this.ctx.createGain(); e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(0.05, t0 + 0.6); e.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.4);
    o.connect(e); this.out(e, { rev: 0.2 }); o.start(t0); o.stop(t0 + dur + 0.5);
    for (let k = 0; k < Math.floor(dur * 8); k++) { // ticks do timecode
      const t = t0 + 0.35 + k / 8, c = this.osc("square", 3200, t), ce = this.env(0.0035 + (k % 4 === 0 ? 0.003 : 0), 0.0008, 0.012, t);
      const h = this.ctx.createBiquadFilter(); h.type = "highpass"; h.frequency.value = 2500; c.connect(h).connect(ce); this.out(ce, { rev: 0.1 }); c.start(t); c.stop(t + 0.02);
    }
  }
  // fase 2 — fenda de luz → letterbox abre → letras do centro para fora → foto → chips
  introOpen(openAt = 0.9, letters = 9) {
    if (!this.ok()) return;
    const ctx = this.ctx, t0 = ctx.currentTime, open = t0 + openAt;
    // fenda: glissando agudo fino, como luz acendendo
    const sl = this.osc("sine", 1760, t0 + openAt - 0.55); sl.frequency.exponentialRampToValueAtTime(3520, open);
    const se = ctx.createGain(); se.gain.setValueAtTime(0.0001, t0 + openAt - 0.55); se.gain.exponentialRampToValueAtTime(0.014, open - 0.05); se.gain.exponentialRampToValueAtTime(0.0001, open + 0.4);
    sl.connect(se); this.out(se, { rev: 0.8 }); sl.start(t0 + openAt - 0.55); sl.stop(open + 0.5);
    // letterbox: "whoomp" grave e macio + ar descendo (sem transiente duro)
    const w = this.osc("sine", 70, open); w.frequency.exponentialRampToValueAtTime(44, open + 1);
    const we = ctx.createGain(); we.gain.setValueAtTime(0.0001, open); we.gain.exponentialRampToValueAtTime(0.14, open + 0.18); we.gain.exponentialRampToValueAtTime(0.0001, open + 1.4);
    w.connect(we); this.out(we, { rev: 0.35 }); w.start(open); w.stop(open + 1.5);
    setTimeout(() => this.whoosh(1.1, false, 0.04), openAt * 1000);
    // chips surgindo: pings de vidro bem leves, em cascata
    [0, 0.09, 0.18, 0.27, 0.36].forEach((d, i) => {
      const at = open + 0.85 + d, o = this.osc("sine", 2637 + i * 220, at), e = this.env(0.006, 0.003, 0.4, at);
      o.connect(e); this.out(e, { rev: 0.7, pan: i % 2 ? 0.5 : -0.5 }); o.start(at); o.stop(at + 0.45);
    });
  }
  reveal() { // título de seção entrando: sopro muito leve
    if (!this.ok() || !this.rate("reveal", 700)) return;
    this.whoosh(0.55, true, 0.025);
  }
}

export const sfx = new Sound();
if (typeof window !== "undefined") window.__sfx = sfx; // medição de nível nos testes
