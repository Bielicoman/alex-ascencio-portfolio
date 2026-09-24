import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// Inferência fora da thread principal: o site continua desenhando a 60 Hz enquanto o modelo roda.
// Recebe ImageBitmap (transferido, sem cópia) e devolve só os pontos.
let lm = null, files = null, model = null, delegate = "GPU";
const opts = (d) => ({ baseOptions: { modelAssetBuffer: model.slice(), delegate: d }, runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.6, minHandPresenceConfidence: 0.55, minTrackingConfidence: 0.5 });
async function make(d) {
  try { lm = await HandLandmarker.createFromOptions(files, opts(d)); delegate = d; }
  catch (e) { if (d === "CPU") throw e; lm = await HandLandmarker.createFromOptions(files, opts("CPU")); delegate = "CPU"; }
}
self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      files = await FilesetResolver.forVisionTasks(data.wasm, true);
      model = data.model;
      await make(data.delegate || "GPU");
      self.postMessage({ type: "ready", delegate });
    } catch (e) { self.postMessage({ type: "error", message: String(e?.message || e) }); }
    return;
  }
  if (data.type === "frame") {
    let res = null;
    const t0 = performance.now();
    try { res = lm?.detectForVideo(data.bitmap, data.t); } catch {}
    const ms = performance.now() - t0;
    data.bitmap.close();
    self.postMessage({ type: "result", t: data.t, ms, delegate, landmarks: res?.landmarks || [], handedness: (res?.handedness || []).map((h) => [{ categoryName: h[0]?.categoryName }]) });
    return;
  }
  if (data.type === "close") { try { lm?.close(); } catch {} self.close(); }
};
