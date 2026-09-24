import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MARK_PATH, MARK_W, MARK_H } from "../brand";

// Marca AA extrudada em laca vermelha sobre fundo claro. Luz pontual segue o cursor,
// arrasto gira com inércia e a peça volta a flutuar sozinha.
function markShapes() {
  const shapes = [];
  let cur = null;
  for (const [, cmd, args] of MARK_PATH.matchAll(/([MLZ])\s*([^MLZ]*)/g)) {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === "M") { cur = new THREE.Shape(); cur.moveTo(n[0], -n[1]); }
    else if (cmd === "L") cur.lineTo(n[0], -n[1]);
    else if (cmd === "Z" && cur) { shapes.push(cur); cur = null; }
  }
  return shapes;
}

export default class MarkScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.env;
    this.scene.environmentIntensity = 0.55;
    pm.dispose();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    this.camera.position.set(0, 0, 11);

    const geo = new THREE.ExtrudeGeometry(markShapes(), { depth: 30, bevelEnabled: true, bevelThickness: 7, bevelSize: 4.5, bevelSegments: 8, curveSegments: 4 });
    geo.center();
    this.mat = new THREE.MeshPhysicalMaterial({ color: 0xb50f1c, roughness: 0.34, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.scale.setScalar(4.3 / MARK_W);
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.scene.add(this.group);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-4, 5, 6); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffd2c8, 1.2); rim.position.set(5, -2, -4); this.scene.add(rim);
    this.spot = new THREE.PointLight(0xfff3ee, 18, 14, 1.6); this.spot.position.set(0, 0, 4); this.scene.add(this.spot);

    this.aim = new THREE.Vector2();
    this.rot = { x: 0, y: -0.35, vx: 0, vy: 0.0 };
    this.drag = null;
    this.running = false;
    this.t0 = performance.now();
    this.last = this.t0;
    this.h = MARK_H;

    this.onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      this.aim.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      if (this.drag) {
        const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
        this.rot.vy = dx * 0.35; this.rot.vx = dy * 0.25;
        this.rot.y += dx * 0.008; this.rot.x += dy * 0.006;
        this.drag.x = e.clientX; this.drag.y = e.clientY;
      }
    };
    this.onDown = (e) => { this.drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.classList.add("is-drag"); };
    this.onUp = () => { this.drag = null; canvas.classList.remove("is-drag"); };
    this.onResize = () => this.resize();
    window.addEventListener("pointermove", this.onMove, { passive: true });
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onUp);
    window.addEventListener("resize", this.onResize);
    this.resize();
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // enquadra a largura da marca em telas estreitas
    this.camera.position.z = w / h < 1 ? 11 / (w / h) * 0.9 : 11;
    this.camera.updateProjectionMatrix();
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.033, (now - this.last) / 1000); this.last = now;
      const t = (now - this.t0) / 1000;
      if (!this.drag) {
        // inércia do arrasto decai; mola traz de volta para a pose idle olhando o cursor
        const ty = Math.sin(t * 0.45) * 0.38 + this.aim.x * 0.35, tx = Math.cos(t * 0.35) * 0.1 - this.aim.y * 0.22;
        this.rot.vy += ((ty - this.rot.y) * 3.2 - this.rot.vy * 2.2) * dt;
        this.rot.vx += ((tx - this.rot.x) * 3.2 - this.rot.vx * 2.2) * dt;
        this.rot.y += this.rot.vy * dt; this.rot.x += this.rot.vx * dt;
      }
      this.group.rotation.set(this.rot.x, this.rot.y, Math.sin(t * 0.3) * 0.03);
      this.group.position.y = Math.sin(t * 0.8) * 0.08;
      this.spot.position.x += (this.aim.x * 4.2 - this.spot.position.x) * 0.12;
      this.spot.position.y += (this.aim.y * 2.6 - this.spot.position.y) * 0.12;
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  dispose() {
    this.stop();
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("resize", this.onResize);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onUp);
    this.mesh.geometry.dispose(); this.mat.dispose(); this.env.dispose(); this.renderer.dispose();
  }
}
