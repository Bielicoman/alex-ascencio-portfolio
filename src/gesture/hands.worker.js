import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// Inferência fora da thread principal: o site continua desenhando a 60 Hz enquanto o modelo roda.
// Recebe ImageBitmap (transferido, sem cópia) e devolve só os pontos.
let lm = null;
self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      const files = await FilesetResolver.forVisionTasks(data.wasm, true);
      const opts = (delegate) => ({ baseOptions: { modelAssetBuffer: new Uint8Array(data.model), delegate }, runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.6, minHandPresenceConfidence: 0.55, minTrackingConfidence: 0.5 });
      lm = await HandLandmarker.createFromOptions(files, opts(data.delegate || "CPU"));
      self.postMessage({ type: "ready" });
    } catch (e) { self.postMessage({ type: "error", message: String(e?.message || e) }); }
    return;
  }
  if (data.type === "frame") {
    let res = null;
    try { res = lm?.detectForVideo(data.bitmap, data.t); } catch {}
    data.bitmap.close();
    self.postMessage({ type: "result", t: data.t, landmarks: res?.landmarks || [], handedness: (res?.handedness || []).map((h) => [{ categoryName: h[0]?.categoryName }]) });
    return;
  }
  if (data.type === "close") { try { lm?.close(); } catch {} self.close(); }
};
