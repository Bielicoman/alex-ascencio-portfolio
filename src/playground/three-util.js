import { PerspectiveCamera, Plane, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from "three";

// renderer + câmera em tela cheia e conversão tela → mundo num plano z
export function makeStage(host, { fov = 50, z = 10, alpha = false, bg = 0x060607 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "pg-canvas";
  host.appendChild(canvas);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio));
  if (!alpha) renderer.setClearColor(bg, 1);
  const scene = new Scene();
  const camera = new PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, z);
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  const ray = new Raycaster(), ndc = new Vector2(), plane = new Plane(new Vector3(0, 0, 1), 0), hit = new Vector3();
  const toWorld = (x, y, pz = 0, out = new Vector3()) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    plane.constant = -pz;
    return ray.ray.intersectPlane(plane, hit) ? out.copy(hit) : out.set(0, 0, pz);
  };
  const pick = (x, y, objects) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(objects, true)[0] || null;
  };
  const toScreen = (v) => {
    const p = v.clone().project(camera), r = canvas.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  };
  const dispose = () => {
    scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
    renderer.dispose(); canvas.remove();
  };
  return { canvas, renderer, scene, camera, resize, toWorld, toScreen, pick, dispose };
}
