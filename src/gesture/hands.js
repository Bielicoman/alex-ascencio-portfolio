// Rastreamento de mãos (MediaPipe HandLandmarker, 21 pontos por mão, até 2 mãos) com filtro One Euro.
// Coordenadas já espelhadas (selfie): x = 0 à esquerda da tela. A inferência roda num Web Worker
// (a thread do site não trava); o WASM é servido pelo próprio site numa pasta versionada com cache
// imutável, e o modelo vem do CDN oficial do MediaPipe. Download com progresso e pré-carga no hover.
/* global __HAND_V__ */
export const WASM = `/media/hand/${__HAND_V__}`;
const MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const BYTES = 7819105 + 11756972; // modelo + WASM (tamanhos descomprimidos)
export const EXTRA_MODELS = {
  face: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  pose: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
};

let pre = null, got = 0;
const subs = new Set();
// baixa modelo e WASM em paralelo (o WASM só aquece o cache HTTP; o worker o lê de lá)
export function preloadHands() {
  if (!pre) {
    got = 0;
    const pull = async (url) => {
      const r = await fetch(url);
      if (!r.ok || !r.body) throw new Error(`${r.status} ${url}`);
      const rd = r.body.getReader(), parts = [];
      let n = 0;
      for (;;) {
        const { done, value } = await rd.read();
        if (done) break;
        parts.push(value); n += value.length; got += value.length;
        const p = Math.min(0.99, got / BYTES); subs.forEach((f) => f(p));
      }
      const out = new Uint8Array(n); let o = 0;
      for (const c of parts) { out.set(c, o); o += c.length; }
      return out;
    };
    pre = Promise.all([pull(MODEL), pull(`${WASM}/vision_wasm_module_internal.wasm`).catch(() => null)])
      .then(([model]) => model)
      .catch((e) => { pre = null; throw Object.assign(e, { code: "model" }); });
  }
  return pre;
}
const onProgress = (f) => { subs.add(f); return () => subs.delete(f); };

export const CONNECTIONS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];
export const TIPS = [4, 8, 12, 16, 20];

// One Euro (Casiez 2012): suaviza parado, responde rápido em movimento
class OneEuro {
  constructor(minCutoff = 1.4, beta = 0.9, dCutoff = 1) { Object.assign(this, { minCutoff, beta, dCutoff, x: null, dx: 0, t: 0 }); }
  alpha(cut, dt) { const tau = 1 / (2 * Math.PI * cut); return 1 / (1 + tau / dt); }
  reset() { this.x = null; }
  f(v, t) {
    if (this.x == null) { this.x = v; this.t = t; return v; }
    const dt = Math.max(1e-3, t - this.t); this.t = t;
    const d = (v - this.x) / dt;
    this.dx += this.alpha(this.dCutoff, dt) * (d - this.dx);
    this.x += this.alpha(this.minCutoff + this.beta * Math.abs(this.dx), dt) * (v - this.x);
    return this.x;
  }
}

// região útil do quadro da câmera → tela inteira (ninguém alcança a borda do quadro com a mão inteira dentro)
const REGION = { x0: 0.14, x1: 0.86, y0: 0.1, y1: 0.74 };
const map = (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const PINCH_ON = 0.3, PINCH_OFF = 0.46; // distância polegar–indicador / comprimento da palma (histerese)

export class HandTracker {
  constructor({ onFrame, onStatus, region = REGION } = {}) {
    this.onFrame = onFrame; this.onStatus = onStatus || (() => {});
    this.region = region;
    this.state = new Map(); // por lateralidade: filtros e estado de pinça
    this.video = document.createElement("video");
    Object.assign(this.video, { muted: true, playsInline: true, autoplay: true });
    this.running = false;
  }

  async start() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error("insecure"), { code: "insecure" });
    this.onStatus("camera");
    const model = preloadHands(); model.catch(() => {}); // em paralelo com o pedido de permissão
    let camOk = false;
    const off = onProgress((p) => camOk && this.onStatus("model", p));
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 60 }, facingMode: "user" }, audio: false });
    } catch (e) {
      off();
      throw Object.assign(e, { code: e.name === "NotAllowedError" || e.name === "SecurityError" ? "denied" : e.name === "NotFoundError" || e.name === "OverconstrainedError" ? "nocam" : "camera" });
    }
    camOk = true;
    this.video.srcObject = this.stream;
    await this.video.play().catch(() => {});
    this.onStatus("model", 0);
    let buf;
    try { buf = await model; } finally { off(); }
    this.onStatus("init");
    await this.engine(buf);
    if (this.disposed) { this.close(); return; }
    this.running = true;
    this.onStatus("live");
    this.loop();
  }

  // Web Worker: a inferência nunca bloqueia a thread da página. Começa na GPU (≈5–10 ms por quadro numa
  // placa real); se a média passar de 40 ms (GPU fraca/integrada disputando com o WebGL do site), troca
  // sozinho para CPU (XNNPACK). Sem suporte a worker de módulo: thread principal, GPU com recuo para CPU.
  spawn(buf, delegate, task = "hand") {
    return new Promise((res, rej) => {
      const w = new Worker(new URL("./hands.worker.js", import.meta.url), { type: "module" });
      w.onmessage = ({ data }) => (data.type === "ready" ? res(w) : data.type === "error" ? (w.terminate(), rej(new Error(data.message))) : null);
      w.onerror = (e) => { w.terminate(); rej(e); };
      w.postMessage({ type: "init", wasm: new URL(WASM, location.href).href, model: buf, delegate, task });
    });
  }
  // rosto / corpo: modelo baixado sob demanda, worker próprio (roda em paralelo com o das mãos)
  async enable(task) {
    this.aux = this.aux || {};
    if (this.aux[task]) return;
    this.aux[task] = { pending: true };
    try {
      const r = await fetch(EXTRA_MODELS[task]);
      if (!r.ok) throw new Error(r.status);
      const buf = new Uint8Array(await r.arrayBuffer());
      const w = await this.spawn(buf, this.delegate === "CPU" ? "CPU" : "GPU", task);
      if (this.disposed || !this.aux[task]) { w.terminate(); return; }
      const a = (this.aux[task] = { w, busy: false });
      w.onmessage = ({ data }) => { if (data.type !== "result") return; a.busy = false; a.ms = data.ms; if (this.running) this.onAux?.(task, data[task], data.t / 1000); };
    } catch (e) { delete this.aux[task]; throw e; }
  }
  disable(task) { const a = this.aux?.[task]; if (!a) return; a.w?.postMessage({ type: "close" }); delete this.aux[task]; this.onAux?.(task, null, 0); }
  attach(w) {
    const pf = (this.perf = { n: 0, sum: 0, slow: 0 });
    w.onmessage = ({ data }) => {
      if (w !== this.worker || data.type !== "result") return;
      this.busy = false;
      if (data.delegate === "GPU" && !this.switching) {
        pf.n++;
        if (pf.n > 3) { pf.sum += data.ms; pf.slow = data.ms > 120 ? pf.slow + 1 : 0; } // 3 primeiros = compilação de shaders
        if (pf.slow >= 3 || (pf.n === 11 && pf.sum / 8 > 40)) this.toCPU();
      }
      this.ms = data.ms; this.delegate = data.delegate;
      if (this.running) this.onFrame(this.parse(data, data.t / 1000), this.video);
    };
    this.worker = w;
  }
  // GPU lenta: sobe um worker novo na CPU e só troca quando ele estiver pronto (sem interromper o rastreamento)
  async toCPU() {
    this.switching = true;
    try {
      const w = await this.spawn(this.buf, "CPU");
      if (this.disposed) { w.terminate(); return; }
      const old = this.worker; this.attach(w); this.busy = false;
      old?.postMessage({ type: "close" });
    } catch (e) { console.warn("[mãos] troca para CPU falhou", e); }
  }
  async engine(buf) {
    this.buf = buf;
    try {
      this.attach(await this.spawn(buf, "GPU"));
    } catch (err) {
      console.warn("[mãos] worker indisponível, usando a thread principal", err);
      this.worker = null;
      const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
      const files = await FilesetResolver.forVisionTasks(WASM, true);
      const opts = (delegate) => ({ baseOptions: { modelAssetBuffer: buf.slice(), delegate }, runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.6, minHandPresenceConfidence: 0.55, minTrackingConfidence: 0.5 });
      try { this.lm = await HandLandmarker.createFromOptions(files, opts("GPU")); }
      catch { this.lm = await HandLandmarker.createFromOptions(files, opts("CPU")); }
    }
  }

  loop() {
    if (!this.running) return;
    const v = this.video;
    const next = () => (v.requestVideoFrameCallback ? v.requestVideoFrameCallback(() => this.loop()) : requestAnimationFrame(() => this.loop()));
    if (v.readyState >= 2 && !document.hidden) {
      const now = performance.now();
      if (this.worker) {
        // um quadro por vez, sem fila: se o modelo atrasar, descarta quadros (fila = atraso crescente).
        // O limite de 4 s só destrava se uma resposta se perder.
        if (!this.busy || now - this.sent > 4000) {
          this.busy = true; this.sent = now;
          createImageBitmap(v, { resizeWidth: 320, resizeHeight: 240, resizeQuality: "medium" })
            .then((bitmap) => (this.running ? this.worker.postMessage({ type: "frame", bitmap, t: now }, [bitmap]) : bitmap.close()))
            .catch(() => { this.busy = false; });
        }
        for (const a of Object.values(this.aux || {})) {
          if (!a.w || (a.busy && now - a.sent < 4000)) continue;
          a.busy = true; a.sent = now;
          createImageBitmap(v, { resizeWidth: 320, resizeHeight: 240, resizeQuality: "medium" })
            .then((bitmap) => (this.running && a.w ? a.w.postMessage({ type: "frame", bitmap, t: now }, [bitmap]) : bitmap.close()))
            .catch(() => { a.busy = false; });
        }
      } else if (this.lm) {
        let res;
        try { res = this.lm.detectForVideo(v, now); } catch { res = null; }
        if (res) this.onFrame(this.parse(res, now / 1000), v);
      }
    }
    next();
  }

  parse(res, t) {
    const aspect = (this.video.videoWidth || 640) / (this.video.videoHeight || 480);
    const hands = [], seen = new Set();
    res.landmarks.forEach((raw, i) => {
      let key = res.handedness?.[i]?.[0]?.categoryName || "H";
      if (seen.has(key)) key += i; seen.add(key);
      let s = this.state.get(key);
      if (!s) { s = { fx: new OneEuro(1.0, 3.2), fy: new OneEuro(1.0, 3.2), fs: new OneEuro(1, 0.4), pinch: false, t }; this.state.set(key, s); }
      s.t = t;
      const lm = raw.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }));
      const d = (a, b) => Math.hypot((lm[a].x - lm[b].x) * aspect, lm[a].y - lm[b].y);
      const palm = Math.max(1e-4, d(0, 9));
      const pd = d(4, 8) / palm;
      s.pinch = s.pinch ? pd < PINCH_OFF : pd < PINCH_ON;
      // âncora estável: meio da pinça puxado para a base do indicador (a ponta salta quando os dedos fecham)
      const ax = (lm[4].x + lm[8].x) * 0.3 + lm[5].x * 0.4, ay = (lm[4].y + lm[8].y) * 0.3 + lm[5].y * 0.4;
      const r = this.region;
      const x = s.fx.f(map(ax, r.x0, r.x1), t), y = s.fy.f(map(ay, r.y0, r.y1), t);
      // dedos: reto = ângulo pequeno entre (base→meio) e (meio→ponta), em 3D, com histerese
      const v = (a, b) => [(lm[b].x - lm[a].x) * aspect, lm[b].y - lm[a].y, (lm[b].z - lm[a].z) * aspect];
      const cos = (u, w) => (u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / (Math.hypot(...u) * Math.hypot(...w) + 1e-6);
      s.f = s.f || [false, false, false, false, false];
      s.f = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]].map(([m, p, q, tip], k) => {
        const c = k === 0 ? cos(v(p, q), v(q, tip)) : cos(v(m, p), v(p, tip));
        const away = k === 0 ? d(4, 5) / palm > (s.f[0] ? 0.5 : 0.62) : d(0, tip) > d(0, p) * 1.05; // polegar afastado do indicador
        return away && c > (s.f[k] ? 0.55 : 0.72);
      });
      const [th, ix, md, rg, pk] = s.f;
      const four = ix + md + rg + pk;
      let g = "other";
      if (s.pinch) g = "pinch";
      else if (four === 4) g = "open";
      else if (four === 0) g = th ? (lm[4].y < lm[3].y && lm[4].y < lm[5].y - palm * 0.25 ? "thumbs_up" : lm[4].y > lm[3].y && lm[4].y > lm[17].y + palm * 0.25 ? "thumbs_down" : "fist") : "fist";
      else if (ix && !md && !rg && !pk) g = "point";
      else if (ix && md && !rg && !pk) g = "victory";
      else if (ix && pk && !md && !rg) g = "rock";
      // estável só depois de 4 quadros iguais (~130 ms): evita disparo em transição de pose
      if (g === s.cand) s.candN++; else { s.cand = g; s.candN = 1; }
      if (s.candN >= 4 || g === "pinch") s.gesture = g;
      const n = four;
      hands.push({
        key, lm, x, y, pinch: s.pinch, pinchD: pd,
        vx: s.fx.dx, vy: s.fy.dx, t, // velocidade filtrada (tela/s) e instante da captura (s): previsão entre quadros
        scale: s.fs.f(palm, t), // tamanho da palma: cresce quando a mão se aproxima da câmera
        open: n === 4 && !s.pinch, fist: n === 0 && !s.pinch,
        fingers: s.f, gesture: s.gesture || "other",
        tips: TIPS.map((k) => ({ x: map(lm[k].x, r.x0, r.x1), y: map(lm[k].y, r.y0, r.y1) })),
        angle: Math.atan2(lm[9].y - lm[0].y, (lm[9].x - lm[0].x) * aspect),
      });
    });
    // mão que sumiu: zera filtros para não "puxar" da última posição quando voltar
    for (const [k, s] of this.state) if (!seen.has(k) && t - s.t > 0.25) { s.fx.reset(); s.fy.reset(); s.fs.reset(); s.pinch = false; }
    return hands.sort((a, b) => a.x - b.x);
  }

  close() {
    this.worker?.postMessage({ type: "close" }); this.worker = null;
    for (const a of Object.values(this.aux || {})) a.w?.postMessage({ type: "close" });
    this.aux = {};
    try { this.lm?.close(); } catch {}
    this.lm = null;
  }
  stop() {
    this.disposed = true;
    this.running = false;
    this.stream?.getTracks().forEach((tr) => tr.stop());
    this.video.srcObject = null;
    this.close();
  }
}

// esqueleto no preview da câmera (coordenadas espelhadas, iguais ao vídeo com scaleX(-1))
export function drawHands(ctx, hands, w, h, clear = true) {
  if (clear) ctx.clearRect(0, 0, w, h);
  for (const hd of hands) {
    ctx.lineWidth = 2; ctx.strokeStyle = hd.pinch ? "#ff3b3b" : "rgba(255,255,255,.85)";
    ctx.beginPath();
    for (const [a, b] of CONNECTIONS) { ctx.moveTo(hd.lm[a].x * w, hd.lm[a].y * h); ctx.lineTo(hd.lm[b].x * w, hd.lm[b].y * h); }
    ctx.stroke();
    for (let i = 0; i < 21; i++) {
      ctx.fillStyle = i === 4 || i === 8 ? "#ff3b3b" : "#fff";
      ctx.beginPath(); ctx.arc(hd.lm[i].x * w, hd.lm[i].y * h, i === 4 || i === 8 ? 3.2 : 2, 0, 7); ctx.fill();
    }
  }
}

export const ERR = {
  denied: "Permissão da câmera negada. Libere no cadeado da barra de endereço e tente de novo.",
  nocam: "Nenhuma câmera encontrada. Conecte uma webcam e tente de novo.",
  insecure: "A câmera só funciona em HTTPS.",
  camera: "A câmera está em uso por outro app ou não respondeu.",
  model: "Não consegui carregar o modelo de mãos. Verifique a conexão.",
};
