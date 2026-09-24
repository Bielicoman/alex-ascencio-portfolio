// Sound design sintetizado (Web Audio API): nenhum arquivo de áudio, tudo gerado e reativo.
// Cadeia: fontes → [seco + envio de reverb] → master → compressor/limitador → saída.
// O navegador só libera áudio depois de um gesto (clique/tecla/toque): até lá tudo é silencioso.
const PENT = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760]; // dó maior pentatônica
const KEY = "aa-sound";

class Sound {
  constructor() {
    this.ctx = null;
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch { /* sem storage */ }
    this.enabled = saved !== "off";
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
    if (this.mus) this.musicApply();
    this.subs.forEach((f) => f(on));
  }
  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) this.build();
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.unlocked = true;
    if (this.musicWant && !this.mus?.timer) this.music(true);
  }
  ok() { return this.enabled && this.ctx && this.ctx.state === "running"; }
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
    this.beds();
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

  /* ── camadas contínuas: ar do scroll, pad da marca, giro do 3D ── */
  beds() {
    const ctx = this.ctx;
    const mk = (buf, type, f, q) => {
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0;
      s.connect(fl).connect(g); s.start();
      return { fl, g };
    };
    this.air = mk(this.noise, "lowpass", 300, 0.7);
    this.out(this.air.g, { rev: 0.25 });
    this.whirr = mk(this.noise, "bandpass", 400, 4);
    this.out(this.whirr.g, { rev: 0.3 });
    // pad: acorde de lá menor com 9ª (A2 E3 B3 C4) em serras desafinadas, filtrado
    this.pad = { g: ctx.createGain(), fl: ctx.createBiquadFilter() };
    this.pad.g.gain.value = 0; this.pad.fl.type = "lowpass"; this.pad.fl.frequency.value = 500; this.pad.fl.Q.value = 0.8;
    [110, 164.81, 246.94, 261.63].forEach((f, i) => [-7, 7].forEach((det) => { const o = ctx.createOscillator(); o.type = i === 0 ? "triangle" : "sawtooth"; o.frequency.value = f; o.detune.value = det; o.connect(this.pad.fl); o.start(); }));
    this.pad.fl.connect(this.pad.g);
    this.out(this.pad.g, { rev: 0.8 });
  }
  scrollAir(v) { // v = velocidade do Lenis (px/quadro)
    if (!this.ok()) return;
    const a = Math.min(1, Math.abs(v) / 60), t = this.ctx.currentTime;
    this.air.g.gain.setTargetAtTime(a * 0.045, t, 0.12);
    this.air.fl.frequency.setTargetAtTime(260 + a * 2600, t, 0.15);
  }
  padLevel(v) { // 0–1: partículas se organizando na marca
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.pad.g.gain.setTargetAtTime(v * 0.012, t, 0.3); // leito: RMS ~ −32 dB no máximo
    this.pad.fl.frequency.setTargetAtTime(380 + v * 1500, t, 0.3);
    if (v > 0.97 && this.rate("resolve", 4000)) this.shimmer(0.028, 0);
  }
  spin(speed) { // giro da marca 3D (rad/s)
    if (!this.ok()) return;
    const s = Math.min(1, Math.abs(speed) / 6), t = this.ctx.currentTime;
    this.whirr.g.gain.setTargetAtTime(s * 0.09, t, 0.06);
    this.whirr.fl.frequency.setTargetAtTime(220 + s * 1400, t, 0.08);
  }

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
  duck(depth = 0.15, hold = 1.2) { // abaixa os leitos contínuos durante o impacto
    const t = this.ctx.currentTime;
    for (const b of [this.air.g, this.pad.g, this.whirr.g]) { b.gain.cancelScheduledValues(t); b.gain.setTargetAtTime(b.gain.value * depth, t, 0.02); }
    setTimeout(() => this.scrollAir(0), hold * 1000);
  }
  teleport(x) {
    if (!this.ok()) return;
    const ctx = this.ctx, t0 = ctx.currentTime, hit = t0 + 0.36;
    // 1. sucção: ruído subindo + riser tonal + prato ao contrário
    this.whoosh(0.36, true, 0.13, x);
    const r = this.osc("sawtooth", 180, t0); r.frequency.exponentialRampToValueAtTime(1400, hit);
    const rl = ctx.createBiquadFilter(); rl.type = "bandpass"; rl.Q.value = 3; rl.frequency.setValueAtTime(300, t0); rl.frequency.exponentialRampToValueAtTime(3000, hit);
    const rg = ctx.createGain(); rg.gain.setValueAtTime(0.0001, t0); rg.gain.exponentialRampToValueAtTime(0.032, hit - 0.01); rg.gain.linearRampToValueAtTime(0.0001, hit + 0.02);
    r.connect(rl).connect(rg); this.out(rg, { rev: 0.4, pan: this.panX(x) }); r.start(t0); r.stop(hit + 0.05);
    const cy = this.src(this.noise, t0, 0.4), ch = ctx.createBiquadFilter(); ch.type = "highpass"; ch.frequency.value = 5000;
    const cg = ctx.createGain(); cg.gain.setValueAtTime(0.0001, t0); cg.gain.exponentialRampToValueAtTime(0.045, hit - 0.005); cg.gain.linearRampToValueAtTime(0.0001, hit + 0.01);
    cy.connect(ch).connect(cg); this.out(cg, { rev: 0.3 });
    setTimeout(() => this.duck(0.3, 1), 330);
    this.impact(hit, 0.4); // −8 dB: presença sem susto
    // 3. cauda
    setTimeout(() => { this.shimmer(0.018); this.glitch(0.035, 3); this.whoosh(0.6, false, 0.05); }, 360);
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
  // abertura: fenda de luz (sopro + riser) → impacto quando o letterbox abre → um tick por letra
  intro(openAt = 0.9, letters = 9) {
    if (!this.ok()) return;
    const t0 = this.ctx.currentTime, hit = t0 + openAt;
    this.whoosh(openAt, true, 0.14);
    const r = this.osc("sine", 220, t0); r.frequency.exponentialRampToValueAtTime(880, hit);
    const rg = this.ctx.createGain(); rg.gain.setValueAtTime(0.0001, t0); rg.gain.exponentialRampToValueAtTime(0.035, hit - 0.02); rg.gain.linearRampToValueAtTime(0.0001, hit + 0.03);
    r.connect(rg); this.out(rg, { rev: 0.6 }); r.start(t0); r.stop(hit + 0.05);
    this.impact(hit, 0.85);
    setTimeout(() => this.shimmer(0.028), openAt * 1000 + 150);
    for (let i = 0; i < letters; i++) {
      const d = Math.abs(i - (letters - 1) / 2), at = hit + 0.35 + d * 0.055;
      const o = this.osc("sine", PENT[(4 + i) % PENT.length] * 2, at), e = this.env(0.014, 0.002, 0.12, at);
      o.connect(e); this.out(e, { rev: 0.5, pan: (i / (letters - 1)) * 1.2 - 0.6 }); o.start(at); o.stop(at + 0.15);
    }
  }
  reveal() { // título de seção entrando: sopro muito leve
    if (!this.ok() || !this.rate("reveal", 700)) return;
    this.whoosh(0.55, true, 0.025);
  }
}

/* ───────── trilha: groove cinematográfico gerado ao vivo (lá menor, 96 BPM, Am–F–C–G) ───────── */
const BPM = 96, STEP = 60 / BPM / 4;
const CHORDS = [
  { root: 110, pad: [220, 261.63, 329.63] },   // Am
  { root: 87.31, pad: [174.61, 220, 261.63] }, // F
  { root: 130.81, pad: [196, 261.63, 329.63] }, // C
  { root: 98, pad: [196, 246.94, 293.66] },    // G
];
const KICK = [0, 7, 8, 10], CLAP = [4, 12], BASS = [0, 3, 6, 8, 11, 14];
Object.assign(Sound.prototype, {
  musicBus() {
    if (this.mus) return this.mus;
    const ctx = this.ctx, g = ctx.createGain(); g.gain.value = 0.0001;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 30;
    g.connect(hp).connect(this.master);
    const rv = ctx.createGain(); rv.gain.value = 0.18; g.connect(rv).connect(this.revIn);
    this.mus = { g, on: false, want: false, step: 0, next: 0, timer: null, level: 0.25, hold: 1 }; // ~ −29 dB RMS: fundo
    return this.mus;
  },
  // "want": zona da trilha (scroll); "hold": 0 enquanto um vídeo está aberto
  music(want) { this.musicWant = want; if (!this.ctx) return; const m = this.musicBus(); m.want = want; this.musicApply(); },
  musicHold(h) { if (!this.ctx) return; const m = this.musicBus(); m.hold = h ? 0 : 1; this.musicApply(); },
  musicApply() {
    const m = this.mus, t = this.ctx.currentTime, on = this.enabled && m.want && m.hold;
    if (on) {
      if (!m.timer) { m.next = t + 0.06; m.timer = setInterval(() => this.musicTick(), 25); }
      m.g.gain.cancelScheduledValues(t); m.g.gain.setTargetAtTime(m.level, t, 0.9); // fade-in ~2,5 s
    } else if (m.timer) {
      m.g.gain.cancelScheduledValues(t); m.g.gain.setTargetAtTime(0.0001, t, 0.55); // fade-out ~1,8 s
      clearTimeout(m.stopT); m.stopT = setTimeout(() => { if (!(this.enabled && m.want && m.hold)) { clearInterval(m.timer); m.timer = null; } }, 2600);
    }
  },
  musicTick() { // agendador com antecipação de 120 ms
    const m = this.mus;
    while (m.next < this.ctx.currentTime + 0.12) { this.musicStep(m.step, m.next); m.next += STEP; m.step++; }
  },
  musicStep(n, t) {
    const s = n % 16, bar = Math.floor(n / 16), ch = CHORDS[bar % 4], full = bar % 16 >= 4, g = this.mus.g;
    const tone = (type, f, at, peak, dec, dest = g, fl) => {
      const o = this.osc(type, f, at), e = this.env(peak, 0.004, dec, at);
      if (fl) { o.connect(fl); fl.connect(e); } else o.connect(e);
      e.connect(dest); o.start(at); o.stop(at + dec + 0.05);
    };
    if (KICK.includes(s)) {
      const o = this.osc("sine", 150, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
      const e = this.env(0.9, 0.002, 0.34, t); o.connect(e).connect(g); o.start(t); o.stop(t + 0.4);
    }
    if (full && CLAP.includes(s)) {
      const nz = this.src(this.noise, t, 0.2), b = this.ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = 1800; b.Q.value = 0.9;
      const e = this.env(0.32, 0.002, 0.16, t); nz.connect(b).connect(e).connect(g);
      tone("triangle", 190, t, 0.12, 0.08);
    }
    { // hats: 16 avos com acento no contratempo; aberto no passo 14
      const open = s === 14, nz = this.src(this.noise, t, open ? 0.3 : 0.05), h = this.ctx.createBiquadFilter(); h.type = "highpass"; h.frequency.value = 7500;
      const e = this.env((s % 4 === 2 ? 0.1 : 0.045) * (open ? 1.4 : 1), 0.001, open ? 0.24 : 0.035, t); nz.connect(h).connect(e).connect(g);
    }
    if (BASS.includes(s)) {
      const f = ch.root * (s === 6 || s === 14 ? 2 : 1), lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 6;
      lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(160, t + 0.2);
      tone("sawtooth", f, t, 0.22, 0.24, g, lp);
      tone("sine", f / 2, t, 0.3, 0.26);
    }
    if (s === 0) { // pad do compasso, com respiração no kick (sidechain)
      const dur = STEP * 16, lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.6;
      const e = this.ctx.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.07, t + 0.5);
      KICK.forEach((k) => { const kt = t + k * STEP; e.gain.setValueAtTime(0.02, kt + 0.001); e.gain.linearRampToValueAtTime(0.07, kt + 0.28); });
      e.gain.setTargetAtTime(0.0001, t + dur - 0.2, 0.08);
      ch.pad.forEach((f) => [-9, 9].forEach((d) => { const o = this.osc("sawtooth", f, t); o.detune.value = d; o.connect(lp); o.start(t); o.stop(t + dur + 0.3); }));
      lp.connect(e).connect(g);
      const sp = this.ctx.createGain(); sp.gain.value = 0.5; e.connect(sp).connect(this.revIn);
    }
    if (full && s % 2 === 0) { // arpejo de pluck, duas oitavas acima
      const f = ch.pad[(s / 2) % 3] * (s % 8 === 6 ? 4 : 2), e = this.env(0.05, 0.002, 0.18, t), o = this.osc("triangle", f, t);
      const p = this.ctx.createStereoPanner(); p.pan.value = ((s / 2) % 3 - 1) * 0.5;
      o.connect(e).connect(p).connect(g); const sp = this.ctx.createGain(); sp.gain.value = 0.6; p.connect(sp).connect(this.revIn);
      o.start(t); o.stop(t + 0.22);
    }
  },
});

export const sfx = new Sound();
if (typeof window !== "undefined") window.__sfx = sfx; // medição de nível nos testes
