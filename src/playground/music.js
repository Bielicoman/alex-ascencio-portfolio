import { bus, DRUMS, mtof } from "./audio";

// Trilhas originais geradas no navegador (sem sample, sem direito autoral de terceiros).
// A mesma partitura gera o áudio e o mapa de blocos do jogo: sincronia exata pelo relógio de áudio.
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// seções: [compassos, bateria, baixo, lead, pad, densidade de blocos 0–3]
export const TRACKS = [
  {
    id: "neon", title: "Neon Corte", style: "Synthwave", bpm: 118, root: 45, seed: 7,
    prog: [[0, "m"], [-4, "M"], [3, "M"], [-2, "M"]], // Am F C G
    sections: [[4, "none", "none", "arp", 1, 0], [8, "four", "oct", "arp", 1, 1], [8, "four", "oct", "lead", 1, 2], [4, "half", "sub", "none", 1, 1], [8, "four", "oct", "lead", 1, 3], [8, "four", "oct", "arp", 1, 2], [4, "none", "sub", "arp", 1, 0]],
    color: 0xff3b3b,
  },
  {
    id: "timeline", title: "Timeline", style: "Boom bap", bpm: 92, root: 50, seed: 21,
    prog: [[0, "m"], [-2, "M"], [-5, "m"], [-4, "M"]], // Dm C Am Bb
    sections: [[2, "none", "none", "pluck", 1, 0], [8, "boom", "sub", "pluck", 1, 1], [8, "boom", "sub", "lead", 1, 2], [4, "half", "sub", "none", 1, 1], [8, "boom", "sub", "lead", 1, 3], [2, "none", "sub", "pluck", 1, 0]],
    color: 0xffb13b,
  },
  {
    id: "hiperdrive", title: "Hiperdrive", style: "Drum & bass", bpm: 172, root: 40, seed: 99,
    prog: [[0, "m"], [-4, "M"], [3, "M"], [-2, "M"]], // Em C G D
    sections: [[8, "none", "none", "arp", 1, 0], [8, "break", "reese", "arp", 1, 1], [16, "break", "reese", "lead", 1, 2], [8, "half", "reese", "none", 1, 1], [16, "break", "reese", "lead", 1, 3], [8, "none", "none", "arp", 1, 0]],
    color: 0x3bd1ff,
  },
];
const chord = ([r, q]) => [r, r + (q === "m" ? 3 : 4), r + 7];
const SCALE_M = [0, 2, 3, 5, 7, 8, 10];

// ── padrões por passo (16 semicolcheias por compasso) ──
const DRUM = {
  four: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], open: [], clap: [12] },
  half: { kick: [0], snare: [8], hat: [0, 4, 8, 12], open: [14], clap: [] },
  boom: { kick: [0, 7, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [], clap: [] },
  break: { kick: [0, 10], snare: [4, 12], hat: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14], open: [7], clap: [] },
  none: { kick: [], snare: [], hat: [], open: [], clap: [] },
};

function plan(track) {
  const R = rng(track.seed), steps = [];
  // motivo melódico do lead: 16 passos, graus da escala menor (null = pausa), repetido com variação
  const motif = Array.from({ length: 16 }, (_, i) => (i % 2 === 0 || R() < 0.3 ? Math.floor(R() * 7) : null));
  let bar = 0;
  for (const [bars, dr, bs, ld, pad, dens] of track.sections) {
    for (let b = 0; b < bars; b++, bar++) {
      const ch = track.prog[bar % track.prog.length];
      for (let s = 0; s < 16; s++) steps.push({ bar, s, ch, dr, bs, ld, pad, dens, motif, first: b === 0 && s === 0 });
    }
  }
  return steps;
}

export function beatmap(track, expert = false) {
  const R = rng(track.seed * 3 + (expert ? 1 : 0)), sd = 60 / track.bpm / 4;
  const steps = plan(track), notes = [];
  const last = [-9, -9], dirs = ["down", "down"];
  const minGap = (expert ? 0.28 : 0.42) * Math.max(1, 120 / track.bpm) ** 0.3;
  steps.forEach((st, i) => {
    const t = i * sd, d = Math.min(3, st.dens + (expert ? 1 : 0));
    if (!d) return;
    const pat = DRUM[st.dr];
    const on = (st.s % 4 === 0 && (d >= 1)) || (d >= 2 && pat.snare.includes(st.s)) || (d >= 3 && st.s % 2 === 0) || (d >= 4 && pat.hat.includes(st.s));
    if (!on) return;
    const both = st.s === 0 && st.bar % 4 === 0 && d >= 2;
    const hands = both ? [0, 1] : [(notes.length + (R() < 0.15 ? 1 : 0)) % 2];
    for (const h of hands) {
      if (t - last[h] < minGap) continue;
      // fluxo: cada mão alterna baixo/cima; às vezes lateral (para fora)
      let dir = dirs[h] === "down" ? "up" : "down";
      if (d >= 2 && R() < 0.18) dir = h === 0 ? "left" : "right";
      if (!expert && R() < 0.12) dir = "any";
      dirs[h] = dir === "up" ? "up" : "down";
      const lane = h === 0 ? (R() < 0.7 ? 1 : 0) : (R() < 0.7 ? 2 : 3);
      const row = dir === "down" ? (R() < 0.7 ? 1 : 2) : dir === "up" ? (R() < 0.7 ? 0 : 1) : 1;
      notes.push({ t, hand: h, lane, row, dir });
      last[h] = t;
    }
  });
  return { notes, duration: steps.length * sd + 1.5, stepDur: sd };
}

// ── síntese ──
function voice(ctx, dest, t, { type = "sawtooth", f, dur, a = 0.005, peak = 0.2, cut = 2400, cutEnd = 400, q = 1, det = 0, n = 1 }) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.Q.value = q;
  lp.frequency.setValueAtTime(cut, t); lp.frequency.exponentialRampToValueAtTime(Math.max(60, cutEnd), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  for (let k = 0; k < n; k++) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = n > 1 ? (k - (n - 1) / 2) * det : 0;
    o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
  }
  lp.connect(g); g.connect(dest);
}

export function playTrack(track, { onEnd } = {}) {
  const { ctx, out, rev } = bus();
  const mix = ctx.createGain(); mix.gain.value = 0.62; mix.connect(out);
  const wet = ctx.createGain(); wet.gain.value = 0.18; mix.connect(wet); wet.connect(rev);
  const dl = ctx.createDelay(1), fb = ctx.createGain(), dw = ctx.createGain();
  dl.delayTime.value = (60 / track.bpm) * 0.75; fb.gain.value = 0.32; dw.gain.value = 0.22;
  dl.connect(fb); fb.connect(dl); dl.connect(dw); dw.connect(mix);
  const lead = ctx.createGain(); lead.gain.value = 1; lead.connect(mix); lead.connect(dl);
  const steps = plan(track), sd = 60 / track.bpm / 4;
  const start = ctx.currentTime + 0.6;
  let i = 0, dead = false;
  const tick = () => {
    if (dead) return;
    while (i < steps.length && start + i * sd < ctx.currentTime + 0.2) {
      const st = steps[i], t = start + i * sd, pat = DRUM[st.dr], ch = chord(st.ch), root = track.root;
      for (const [name, v] of [["kick", 0.95], ["snare", 0.7], ["hat", 0.35], ["open", 0.3], ["clap", 0.5]]) if (pat[name].includes(st.s)) DRUMS[name](t, v * (name === "hat" && st.s % 4 ? 0.7 : 1), mix);
      // baixo
      if (st.bs === "oct" && st.s % 2 === 0) voice(ctx, mix, t, { f: mtof(root + ch[0] - 12 + (st.s % 4 ? 12 : 0)), dur: sd * 1.8, peak: 0.22, cut: 900, cutEnd: 180, q: 4 });
      if (st.bs === "sub" && (st.s === 0 || st.s === 7 || st.s === 10)) voice(ctx, mix, t, { type: "sine", f: mtof(root + ch[0] - 12), dur: sd * 5, peak: 0.42, cut: 400, cutEnd: 200, a: 0.01 });
      if (st.bs === "reese" && st.s % 8 === 0) voice(ctx, mix, t, { f: mtof(root + ch[0] - 12), dur: sd * 7.5, peak: 0.2, cut: 700, cutEnd: 220, q: 2, det: 18, n: 2, a: 0.02 });
      // pad no início do compasso
      if (st.pad && st.s === 0) for (const n of ch) voice(ctx, mix, t, { f: mtof(root + 12 + n), dur: sd * 16, peak: 0.035, cut: 1400, cutEnd: 600, a: 0.4, det: 12, n: 3 });
      // arpejo / pluck / lead
      if (st.ld === "arp" && st.s % 2 === 0) voice(ctx, lead, t, { type: "square", f: mtof(root + 24 + ch[(st.s / 2) % 3] + (st.s >= 8 ? 12 : 0)), dur: sd * 1.5, peak: 0.05, cut: 3200, cutEnd: 500 });
      if (st.ld === "pluck" && [0, 3, 6, 10, 12].includes(st.s)) voice(ctx, lead, t, { type: "triangle", f: mtof(root + 24 + ch[st.s % 3]), dur: sd * 3, peak: 0.12, cut: 2600, cutEnd: 400 });
      if (st.ld === "lead" && st.motif[st.s] != null) voice(ctx, lead, t, { f: mtof(root + 24 + SCALE_M[st.motif[st.s]]), dur: sd * 1.9, peak: 0.07, cut: 4200, cutEnd: 900, det: 8, n: 2 });
      // crash no começo de cada seção
      if (st.first && st.dr !== "none") DRUMS.crash(t, 0.5, mix);
      i++;
    }
    if (i >= steps.length && ctx.currentTime > start + steps.length * sd + 1) { stop(); onEnd?.(); }
  };
  const id = setInterval(tick, 25); tick();
  function stop() { if (dead) return; dead = true; clearInterval(id); const n = ctx.currentTime; mix.gain.setTargetAtTime(0, n, 0.08); setTimeout(() => mix.disconnect(), 800); }
  return { start, stop, now: () => ctx.currentTime - start };
}
