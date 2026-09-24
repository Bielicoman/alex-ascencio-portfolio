import { FilesetResolver, HandLandmarker, FaceLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";

// Um worker por tarefa (mãos, rosto, corpo): rodam em paralelo em núcleos diferentes e nunca
// bloqueiam a thread do site. Recebe ImageBitmap (transferido, sem cópia) e devolve só os pontos.
const TASKS = {
  hand: [HandLandmarker, { numHands: 2, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 }],
  face: [FaceLandmarker, { numFaces: 1, outputFaceBlendshapes: true, minFaceDetectionConfidence: 0.5, minTrackingConfidence: 0.5 }],
  pose: [PoseLandmarker, { numPoses: 1, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5 }],
};
// rosto: só os pontos que a página usa (olhos, íris, nariz, contorno) — evita copiar 478 pontos por quadro
const FACE_KEEP = [1, 4, 10, 33, 133, 145, 152, 159, 234, 263, 362, 374, 386, 454, 468, 473];
let lm = null, task = "hand", delegate = "GPU";

self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      task = data.task || "hand";
      const files = await FilesetResolver.forVisionTasks(data.wasm, true);
      const [Cls, extra] = TASKS[task];
      const o = (d) => ({ baseOptions: { modelAssetBuffer: data.model.slice(), delegate: d }, runningMode: "VIDEO", ...extra });
      const want = data.delegate || "GPU";
      try { lm = await Cls.createFromOptions(files, o(want)); delegate = want; }
      catch (e) { if (want === "CPU") throw e; lm = await Cls.createFromOptions(files, o("CPU")); delegate = "CPU"; }
      self.postMessage({ type: "ready", delegate });
    } catch (e) { self.postMessage({ type: "error", message: String(e?.message || e) }); }
    return;
  }
  if (data.type === "frame") {
    const out = { type: "result", task, t: data.t, delegate };
    const t0 = performance.now();
    try {
      const r = lm?.detectForVideo(data.bitmap, data.t);
      if (task === "hand") {
        out.landmarks = r?.landmarks || [];
        out.handedness = (r?.handedness || []).map((h) => [{ categoryName: h[0]?.categoryName }]);
      } else if (task === "face") {
        const f = r?.faceLandmarks?.[0];
        out.face = f ? {
          pts: Object.fromEntries(FACE_KEEP.map((k) => [k, { x: f[k].x, y: f[k].y, z: f[k].z }])),
          bs: Object.fromEntries((r.faceBlendshapes?.[0]?.categories || []).map((c) => [c.categoryName, c.score])),
        } : null;
      } else if (task === "pose") {
        out.pose = r?.landmarks?.[0]?.map((p) => ({ x: p.x, y: p.y, z: p.z, v: p.visibility })) || null;
      }
    } catch {}
    out.ms = performance.now() - t0;
    data.bitmap.close();
    self.postMessage(out);
    return;
  }
  if (data.type === "close") { try { lm?.close(); } catch {} self.close(); }
};
