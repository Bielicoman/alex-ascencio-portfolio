// Síntese de todos os instrumentos do playground (nenhum sample): piano aditivo, bateria,
// teremim e efeitos. Barramento: voz → (seco + envio de reverb) → compressor → limitador.
let ctx, master, rev, out;

function irBuffer(sec = 2.4, decay = 3) {
  const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
  return b;
}
function noise(sec = 1) {
  const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
let NB, PIANO_WAVE;

export function unlock() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -2; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    master = ctx.createGain(); master.gain.value = 0.8;
    master.connect(comp); comp.connect(lim); lim.connect(ctx.destination);
    rev = ctx.createConvolver(); rev.buffer = irBuffer();
    const rg = ctx.createGain(); rg.gain.value = 0.32; rev.connect(rg); rg.connect(master);
    out = master;
    NB = noise(2);
    // timbre de piano: harmônicos com queda ~1/n^1.3 e leve inarmonicidade compensada no detune
    const N = 12, re = new Float32Array(N + 1), im = new Float32Array(N + 1);
    for (let k = 1; k <= N; k++) im[k] = Math.pow(k, -1.3) * (k === 2 ? 1.25 : 1) * (k > 7 ? 0.5 : 1);
    PIANO_WAVE = ctx.createPeriodicWave(re, im);
  }
  if (ctx.state !== "running") ctx.resume();
  return ctx;
}
export const now = () => ctx.currentTime;
export const analyser = () => { const a = ctx.createAnalyser(); a.fftSize = 2048; return a; };
const send = (node, wet = 0.25) => { node.connect(out); const g = ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(rev); };
const panner = (x = 0) => { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-0.8, Math.min(0.8, x)); return p; };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ── piano: duas cordas levemente desafinadas, filtro que escurece com o tempo, martelo de ruído ──
export function piano(midi, vel = 0.8, pan = 0) {
  if (!ctx) return;
  const t = ctx.currentTime, f = mtof(midi), dur = 3.2 - (midi - 48) * 0.035;
  const p = panner(pan), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.Q.value = 0.4;
  lp.frequency.setValueAtTime(Math.min(16000, f * (6 + vel * 12)), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2.2), t + dur * 0.6);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.28 * vel, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.12 * vel, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  for (const det of [-3.5, 3.5]) {
    const o = ctx.createOscillator(); o.setPeriodicWave(PIANO_WAVE); o.frequency.value = f; o.detune.value = det;
    o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
  }
  const h = ctx.createBufferSource(), hg = ctx.createGain(), hf = ctx.createBiquadFilter();
  h.buffer = NB; hf.type = "bandpass"; hf.frequency.value = Math.min(9000, f * 5); hf.Q.value = 1.2;
  hg.gain.setValueAtTime(0.09 * vel, t); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  h.connect(hf); hf.connect(hg); hg.connect(p); h.start(t, Math.random()); h.stop(t + 0.04);
  lp.connect(g); g.connect(p); send(p, 0.22);
}

// ── bateria ──
function env(g, t, peak, dec) { g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); }
function nz(t, dur, type, freq, q, peak, dec, dest, wet) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = NB; f.type = type; f.frequency.value = freq; f.Q.value = q; env(g, t, peak, dec);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur);
  return g;
}
function tone(t, type, f0, f1, fall, peak, dec, dest) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + fall);
  env(g, t, peak, dec); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dec + 0.02);
}
export const DRUMS = {
  kick: (t, v, d) => { tone(t, "sine", 160, 42, 0.12, 0.95 * v, 0.45, d); nz(t, 0.02, "highpass", 3000, 0.7, 0.12 * v, 0.012, d); },
  snare: (t, v, d) => { tone(t, "triangle", 210, 160, 0.05, 0.35 * v, 0.14, d); nz(t, 0.25, "bandpass", 2400, 0.7, 0.5 * v, 0.2, d); nz(t, 0.25, "highpass", 6000, 0.7, 0.18 * v, 0.12, d); },
  hat: (t, v, d) => nz(t, 0.08, "highpass", 8000, 0.8, 0.28 * v, 0.045, d),
  open: (t, v, d) => nz(t, 0.45, "highpass", 7200, 0.9, 0.24 * v, 0.38, d),
  clap: (t, v, d) => { for (const o of [0, 0.011, 0.023]) nz(t + o, 0.02, "bandpass", 1300, 1.4, 0.55 * v, 0.02, d); nz(t + 0.03, 0.3, "bandpass", 1300, 1.2, 0.35 * v, 0.22, d); },
  tom: (t, v, d) => tone(t, "sine", 190, 105, 0.2, 0.75 * v, 0.42, d),
  crash: (t, v, d) => { nz(t, 1.8, "highpass", 4800, 0.6, 0.3 * v, 1.6, d); for (const f of [540, 800, 1170]) tone(t, "square", f, f * 0.98, 1, 0.012 * v, 0.9, d); },
  bass: (t, v, d) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.setValueAtTime(55 * 1.5, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.05); env(g, t, 0.9 * v, 0.9); o.connect(g); g.connect(d); o.start(t); o.stop(t + 1); },
};
export function drum(name, vel = 0.9, pan = 0) {
  if (!ctx) return;
  const p = panner(pan); send(p, name === "crash" || name === "clap" ? 0.3 : 0.12);
  DRUMS[name](ctx.currentTime, Math.min(1, vel), p);
}

// ── teremim: onda quase senoidal, vibrato, eco de fita ──
export function theremin() {
  unlock();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain(), lp = ctx.createBiquadFilter();
  o.type = "sine"; o2.type = "triangle"; o2.detune.value = 1200;
  const g2 = ctx.createGain(); g2.gain.value = 0.18;
  lfo.frequency.value = 5.6; lg.gain.value = 0;
  lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  lp.type = "lowpass"; lp.frequency.value = 3200;
  g.gain.value = 0;
  o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
  const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain();
  dl.delayTime.value = 0.32; fb.gain.value = 0.36; wet.gain.value = 0.28;
  g.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); send(wet, 0.4);
  send(g, 0.3);
  const an = analyser(); g.connect(an);
  [o, o2, lfo].forEach((x) => x.start(t));
  return {
    an,
    set(freq, vol, vib = 0, bright = 0.5) {
      const n = ctx.currentTime;
      o.frequency.setTargetAtTime(freq, n, 0.025); o2.frequency.setTargetAtTime(freq, n, 0.025);
      g.gain.setTargetAtTime(vol * 0.42, n, 0.04);
      lg.gain.setTargetAtTime(vib * freq * 0.03, n, 0.08);
      lp.frequency.setTargetAtTime(700 + bright * 5200, n, 0.06);
    },
    stop() { const n = ctx.currentTime; g.gain.setTargetAtTime(0, n, 0.05); [o, o2, lfo].forEach((x) => x.stop(n + 0.4)); },
  };
}

// ── efeitos ──
export function whoosh(up = true, v = 0.3) {
  if (!ctx) return;
  const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = NB; f.type = "bandpass"; f.Q.value = 1.1;
  f.frequency.setValueAtTime(up ? 400 : 3000, t); f.frequency.exponentialRampToValueAtTime(up ? 3200 : 380, t + 0.35);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  s.connect(f); f.connect(g); send(g, 0.2); s.start(t, Math.random()); s.stop(t + 0.45);
}
export function slice(pitch = 1, pan = 0) {
  if (!ctx) return;
  const t = ctx.currentTime, p = panner(pan); send(p, 0.2);
  nz(t, 0.12, "highpass", 3800 * pitch, 1, 0.35, 0.09, p);
  tone(t, "triangle", 1800 * pitch, 600 * pitch, 0.09, 0.12, 0.1, p);
}
export function glitch() {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 6; i++) { const g = ctx.createGain(); g.connect(out); tone(t + i * 0.035, "square", 80 + Math.random() * 900, 60, 0.03, 0.12, 0.04, g); }
  tone(t, "sawtooth", 120, 40, 0.4, 0.25, 0.5, out);
}
export function blip(f = 880, v = 0.12) {
  if (!ctx) return;
  const t = ctx.currentTime, g = ctx.createGain(); send(g, 0.25);
  tone(t, "sine", f, f, 0.01, v, 0.18, g);
}
export function pop(v = 0.4) {
  if (!ctx) return;
  const t = ctx.currentTime, g = ctx.createGain(); send(g, 0.3);
  tone(t, "sine", 900, 120, 0.08, v, 0.12, g); nz(t, 0.05, "highpass", 2500, 0.7, 0.2 * v, 0.04, g);
}
export function boom(v = 0.5) {
  if (!ctx) return;
  const t = ctx.currentTime, g = ctx.createGain(); send(g, 0.35);
  tone(t, "sine", 110, 32, 0.5, v, 1.1, g); nz(t, 0.8, "lowpass", 900, 0.6, 0.25 * v, 0.7, g);
}
export { mtof };
