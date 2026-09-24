// Rastreamento de mãos (MediaPipe HandLandmarker, 21 pontos por mão, até 2 mãos) com filtro One Euro.
// Coordenadas já espelhadas (selfie): x = 0 à esquerda da tela. O WASM é servido pelo próprio site
// (/media/hand/wasm, copiado de node_modules no build); o modelo vem do CDN oficial do MediaPipe.
const WASM = "/media/hand/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

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
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 }, facingMode: "user" }, audio: false });
    } catch (e) {
      throw Object.assign(e, { code: e.name === "NotAllowedError" || e.name === "SecurityError" ? "denied" : e.name === "NotFoundError" || e.name === "OverconstrainedError" ? "nocam" : "camera" });
    }
    this.video.srcObject = this.stream;
    await this.video.play().catch(() => {});
    this.onStatus("model");
    const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
    const files = await FilesetResolver.forVisionTasks(WASM);
    const opts = (delegate) => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.6, minHandPresenceConfidence: 0.55, minTrackingConfidence: 0.5 });
    try { this.lm = await HandLandmarker.createFromOptions(files, opts("GPU")); }
    catch { this.lm = await HandLandmarker.createFromOptions(files, opts("CPU")); }
    if (this.disposed) { this.lm.close(); return; }
    this.running = true;
    this.onStatus("live");
    this.loop();
  }

  loop() {
    if (!this.running) return;
    const v = this.video;
    const next = () => (v.requestVideoFrameCallback ? v.requestVideoFrameCallback(() => this.loop()) : requestAnimationFrame(() => this.loop()));
    if (v.readyState >= 2 && !document.hidden) {
      const now = performance.now();
      let res;
      try { res = this.lm.detectForVideo(v, now); } catch { res = null; }
      if (res) this.onFrame(this.parse(res, now / 1000), v);
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
      if (!s) { s = { fx: new OneEuro(), fy: new OneEuro(), fs: new OneEuro(1, 0.4), pinch: false, t }; this.state.set(key, s); }
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
      const ext = [8, 12, 16, 20].map((tip) => d(0, tip) > d(0, tip - 2) * 1.08);
      const n = ext.filter(Boolean).length;
      hands.push({
        key, lm, x, y, pinch: s.pinch, pinchD: pd,
        scale: s.fs.f(palm, t), // tamanho da palma: cresce quando a mão se aproxima da câmera
        open: n === 4 && !s.pinch, fist: n === 0 && !s.pinch,
        tips: TIPS.map((k) => ({ x: map(lm[k].x, r.x0, r.x1), y: map(lm[k].y, r.y0, r.y1) })),
        angle: Math.atan2(lm[9].y - lm[0].y, (lm[9].x - lm[0].x) * aspect),
      });
    });
    // mão que sumiu: zera filtros para não "puxar" da última posição quando voltar
    for (const [k, s] of this.state) if (!seen.has(k) && t - s.t > 0.25) { s.fx.reset(); s.fy.reset(); s.fs.reset(); s.pinch = false; }
    return hands.sort((a, b) => a.x - b.x);
  }

  stop() {
    this.disposed = true;
    this.running = false;
    this.stream?.getTracks().forEach((tr) => tr.stop());
    this.video.srcObject = null;
    try { this.lm?.close(); } catch {}
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
