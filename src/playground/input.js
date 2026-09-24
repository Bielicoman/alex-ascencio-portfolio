import { HandTracker } from "../gesture/hands";

// Entrada unificada: mãos da câmera, mouse e toques viram a mesma lista de "mãos" em px de tela.
// Cada mão: { id, x, y, pinch, down, up, fingers:[{x,y}], scale, angle, vx, vy, src, lm? }
export class Input {
  constructor(stage) {
    this.stage = stage;
    this.ptrs = new Map();
    this.cam = null; this.camHands = []; this.view = new Map(); this.prev = new Map();
    const upd = (e) => {
      if (e.pointerType === "mouse") {
        if (e.type === "pointerdown") this.mdown = e.currentTarget === stage;
        const prev = this.ptrs.get("mouse");
        this.ptrs.set("mouse", { x: e.clientX, y: e.clientY, pinch: this.mdown && (e.buttons & 1) === 1, touch: false, path: [...(prev?.path || []), { x: e.clientX, y: e.clientY }].slice(-24) });
      }
      else if (e.type !== "pointerup" && e.type !== "pointercancel") { if (e.type === "pointerdown" || this.ptrs.has("t" + e.pointerId)) { const prev = this.ptrs.get("t" + e.pointerId); this.ptrs.set("t" + e.pointerId, { x: e.clientX, y: e.clientY, pinch: true, touch: true, path: [...(prev?.path || []), { x: e.clientX, y: e.clientY }].slice(-24) }); } }
      else this.ptrs.delete("t" + e.pointerId);
    };
    this.onDown = (e) => { upd(e); if (e.pointerType !== "mouse") e.preventDefault(); };
    this.onLeave = () => this.ptrs.delete("mouse");
    stage.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", upd, { passive: true });
    window.addEventListener("pointerup", upd);
    window.addEventListener("pointercancel", upd);
    document.addEventListener("mouseleave", this.onLeave);
    this.upd = upd;
  }

  async startCamera(onStatus) {
    this.cam = new HandTracker({ onFrame: (hs) => { this.camHands = hs; this.camT = performance.now(); }, onStatus });
    this.cam.onAux = (task, d) => { this[task] = d; };
    const want = [...(this.want || [])];
    try { await this.cam.start(); }
    catch (e) { this.cam.stop(); this.cam = null; throw e; }
    want.forEach((t) => this.cam.enable(t).catch((e) => console.warn("[" + t + "]", e)));
  }
  // corpo/rosto sob demanda (o modo pede; se a câmera ainda não ligou, liga junto com ela)
  enable(task) { this.want = new Set([...(this.want || []), task]); return this.cam ? this.cam.enable(task) : Promise.resolve(); }
  disable(task) { this.want?.delete(task); this[task] = null; this.cam?.disable(task); }
  stopCamera() { this.cam?.stop(); this.cam = null; this.camHands = []; }
  get video() { return this.cam?.video; }
  get region() { return this.cam?.region; }

  // chamado a cada quadro de tela; câmera (~30 Hz) é interpolada para não "degrau"
  frame(dt) {
    const W = innerWidth, H = innerHeight, k = 1 - Math.exp(-dt * 38), now = performance.now();
    const out = [];
    const seen = new Set();
    for (const hd of this.camHands) {
      const id = "cam:" + hd.key; seen.add(id);
      // previsão entre quadros da câmera (velocidade filtrada × tempo desde a captura, até 80 ms)
      const ahead = hd.pinch ? 0 : Math.min(0.08, Math.max(0, (now - (hd.t || 0) * 1000) / 1000));
      const tx = (hd.x + (hd.vx || 0) * ahead) * W, ty = (hd.y + (hd.vy || 0) * ahead) * H;
      const fingers = hd.tips.slice(1).map((p) => ({ x: p.x * W, y: p.y * H }));
      let v = this.view.get(id);
      if (!v) { v = { x: tx, y: ty, f: fingers.map((p) => ({ ...p })) }; this.view.set(id, v); }
      v.x += (tx - v.x) * k; v.y += (ty - v.y) * k;
      fingers.forEach((p, i) => { v.f[i].x += (p.x - v.f[i].x) * k; v.f[i].y += (p.y - v.f[i].y) * k; });
      out.push({ id, x: v.x, y: v.y, px: hd.pinchPt ? hd.pinchPt.x * W : v.x, py: hd.pinchPt ? hd.pinchPt.y * H : v.y, ghost: hd.ghost, world: hd.world, gx: hd.grip ? hd.grip.x * W : v.x, gy: hd.grip ? hd.grip.y * H : v.y, pinch: hd.pinch, fingers: v.f.map((p) => ({ ...p })), scale: hd.scale, angle: hd.angle, open: hd.open, fist: hd.fist, src: "cam", lm: hd.lm });
    }
    for (const id of this.view.keys()) if (!seen.has(id)) this.view.delete(id);
    // caminho do ponteiro desde o último quadro (movimento rápido não "pula" alvos entre quadros)
    for (const [id, p] of this.ptrs) { out.push({ id, x: p.x, y: p.y, pinch: p.pinch, path: p.path || [], fingers: [{ x: p.x, y: p.y }], scale: 0.2, angle: -Math.PI / 2, src: p.touch ? "touch" : "mouse" }); p.path = []; }
    // bordas de pinça e velocidade por id
    const next = new Map();
    for (const h of out) {
      const pr = this.prev.get(h.id);
      h.down = h.pinch && !pr?.pinch; h.up = false;
      const vx = pr ? (h.x - pr.x) / Math.max(dt, 1e-3) : 0, vy = pr ? (h.y - pr.y) / Math.max(dt, 1e-3) : 0;
      h.vx = pr ? pr.vx * 0.5 + vx * 0.5 : 0; h.vy = pr ? pr.vy * 0.5 + vy * 0.5 : 0;
      h.pf = pr?.fingers || h.fingers; // dedos no quadro anterior (golpes de bateria, lâmina)
      next.set(h.id, h);
    }
    // mão que sumiu em pinça gera "up" sintético
    for (const [id, pr] of this.prev) if (!next.has(id) && pr.pinch) out.push({ ...pr, pinch: false, down: false, up: true, gone: true });
    for (const h of out) { const pr = this.prev.get(h.id); if (!h.gone && pr?.pinch && !h.pinch) h.up = true; }
    this.prev = next;
    return out;
  }

  dispose() {
    this.stopCamera();
    this.stage.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.upd);
    window.removeEventListener("pointerup", this.upd);
    window.removeEventListener("pointercancel", this.upd);
    document.removeEventListener("mouseleave", this.onLeave);
  }
}
