import { ACESFilmicToneMapping, AmbientLight, CapsuleGeometry, ConeGeometry, DirectionalLight, ExtrudeGeometry, GridHelper, IcosahedronGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PMREMGenerator, PointLight, SphereGeometry, TorusGeometry, TorusKnotGeometry, Vector3 } from "three";
import { makeStage } from "../three-util";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { markShapes } from "../../components/MarkScene";
import { MARK_W } from "../../brand";
import * as A from "../audio";

// Objetos em gravidade zero. Pinça sobre um objeto pega; mover a mão para perto/longe da câmera
// muda a profundidade; girar o pulso gira a peça; soltar em movimento arremessa.
// Duas pinças no mesmo objeto: escala.
export default {
  id: "objetos", name: "Objetos 3D",
  hint: [["pinch", "Pinça no objeto: pegar"], ["drag", "Solte em movimento: arremessar"], ["hand", "Aproxime a mão: traz para frente"], ["zoom", "Duas pinças: escala"]],
  mount(host) {
    const S = makeStage(host, { fov: 40, z: 12 });
    const { scene, camera, renderer } = S;
    renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
    const pm = new PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.8; pm.dispose();
    scene.add(new AmbientLight(0xffffff, 0.12));
    const key = new DirectionalLight(0xffffff, 1.6); key.position.set(-5, 6, 8); scene.add(key);
    const rim = new DirectionalLight(0xff3b3b, 2.4); rim.position.set(6, -3, -6); scene.add(rim);
    const glow = new PointLight(0xff3b3b, 0, 8, 1.6); scene.add(glow);

    // piso de reflexo sutil (grade em perspectiva) para ler profundidade
    const grid = new GridHelper(40, 40, 0x3a0d12, 0x18181c); grid.position.y = -4.6; grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);

    const markGeo = new ExtrudeGeometry(markShapes(), { depth: 30, bevelEnabled: true, bevelThickness: 7, bevelSize: 4.5, bevelSegments: 6, curveSegments: 4 });
    markGeo.center(); markGeo.scale(2.6 / MARK_W, 2.6 / MARK_W, 2.6 / MARK_W);
    const defs = [
      [markGeo, new MeshPhysicalMaterial({ color: 0xb50f1c, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 }), 1.2],
      [new SphereGeometry(0.95, 64, 48), new MeshPhysicalMaterial({ color: 0x0b0b0e, roughness: 0.05, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.6, iridescenceIOR: 1.4 }), 0.95],
      [new TorusKnotGeometry(0.62, 0.22, 180, 24), new MeshStandardMaterial({ color: 0xdadade, metalness: 1, roughness: 0.14 }), 0.95],
      [new RoundedBoxGeometry(1.4, 1.4, 1.4, 5, 0.18), new MeshStandardMaterial({ color: 0x141416, roughness: 0.55, metalness: 0.2 }), 1],
      [new IcosahedronGeometry(0.9, 0), new MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.35, flatShading: true }), 0.9],
      [new TorusGeometry(0.72, 0.26, 32, 96), new MeshStandardMaterial({ color: 0xc9a46a, metalness: 1, roughness: 0.22 }), 0.98],
      [new CapsuleGeometry(0.42, 1.1, 8, 24), new MeshPhysicalMaterial({ color: 0xf3f2ef, roughness: 0.25, clearcoat: 0.6 }), 0.95],
      [new ConeGeometry(0.8, 1.5, 48), new MeshStandardMaterial({ color: 0x811226, roughness: 0.4, metalness: 0.3 }), 0.95],
    ];
    const objs = defs.map(([g, m, r], i) => {
      const mesh = new Mesh(g, m);
      const a = (i / defs.length) * Math.PI * 2;
      mesh.position.set(Math.cos(a) * 4.2, Math.sin(a) * 2.2, (Math.random() - 0.5) * 2);
      mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      mesh.userData = { r, s: 1, v: new Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 0), w: new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.6), grab: null };
      if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
      scene.add(mesh);
      return mesh;
    });
    const meshes = objs;
    const grabs = new Map(); // id da mão → { o, off, z0, s0, a0 }
    const tmp = new Vector3(), tmp2 = new Vector3();
    let hoverO = null;

    const bounds = () => {
      const h = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z, w = h * camera.aspect;
      return { w: w * 0.92, h: h * 0.9 };
    };
    // raio do objeto na tela (px): usado para a área de pega
    const screenR = (o) => {
      const p = S.toScreen(o.position), q = S.toScreen(tmp.copy(o.position).add(tmp2.set(o.userData.r * o.scale.x, 0, 0)));
      return [p, Math.abs(q.x - p.x)];
    };
    // alvo da pega: raio 3D primeiro; senão o objeto cuja silhueta está a menos de 60 px do ponto da pinça
    const nearest = (h) => {
      const hit = S.pick(h.px ?? h.x, h.py ?? h.y, meshes);
      if (hit) { let o = hit.object; while (!objs.includes(o)) o = o.parent; return o; }
      let best = null, bd = Infinity;
      for (const o of objs) {
        if (o.userData.grab) continue;
        const [p, rr] = screenR(o), d = Math.hypot(p.x - (h.px ?? h.x), p.y - (h.py ?? h.y)) - rr;
        if (d < 60 && d < bd) { bd = d; best = o; }
      }
      return best;
    };
    const hover = new Set();
    if (import.meta.env.DEV) window.__obj = { objs, grabs, toScreen: S.toScreen };

    return {
      frame(dt, hands) {
        const B = bounds();
        // pega / solta
        for (const h of hands) {
          if (h.down) {
            const o = nearest(h);
            if (o && ![...grabs.values()].some((g) => g.o === o && g.pair)) {
              const other = [...grabs.values()].find((g) => g.o === o);
              if (other) { // segunda mão no mesmo objeto → escala
                const oh = hands.find((x) => x.id === other.id);
                other.pair = h.id;
                grabs.set(h.id, { id: h.id, o, scaleOf: other.id, d0: Math.hypot(h.x - (oh?.x ?? h.x), h.y - (oh?.y ?? h.y)) + 1, s0: o.userData.s });
              } else {
                const w = S.toWorld(h.px ?? h.x, h.py ?? h.y, o.position.z);
                grabs.set(h.id, { id: h.id, o, off: o.position.clone().sub(w), z0: o.position.z, sc0: h.scale, a0: h.angle, r0: o.rotation.z, hist: [] });
                o.userData.grab = h.id; o.userData.v.set(0, 0, 0);
                A.pop(0.25);
              }
            }
          }
          if (h.up && grabs.has(h.id)) {
            const g = grabs.get(h.id); grabs.delete(h.id);
            if (!g.scaleOf) {
              for (const x of grabs.values()) if (x.scaleOf === h.id) grabs.delete(x.id);
              const u = g.o.userData; u.grab = null;
              // arremesso pela média dos últimos ~120 ms (um quadro ruim não vira tiro)
              const hs = g.hist, a = hs[0], b = hs[hs.length - 1];
              if (a && b && b.t - a.t > 0.02) { u.v.copy(b.p).sub(a.p).divideScalar(b.t - a.t); if (u.v.length() > 14) u.v.setLength(14); }
              const sp = u.v.length();
              u.w.set((Math.random() - 0.5) * sp * 0.15, (Math.random() - 0.5) * sp * 0.15, 0);
              if (sp > 3) A.whoosh(true, Math.min(0.35, sp * 0.03)); else A.blip(520, 0.06);
            } else { const base = grabs.get(g.scaleOf); if (base) base.pair = null; }
          }
        }
        // mãos segurando: o objeto segue o ponto da pinça com mola crítica (sem teleporte, sem tremor)
        let tNow = performance.now() / 1000;
        for (const g of grabs.values()) {
          const h = hands.find((x) => x.id === g.id); if (!h) continue;
          const o = g.o, u = o.userData;
          if (g.scaleOf) {
            const oh = hands.find((x) => x.id === g.scaleOf); if (!oh) continue;
            const d = Math.hypot(h.x - oh.x, h.y - oh.y) + 1;
            u.s = Math.min(2.6, Math.max(0.45, g.s0 * (d / g.d0)));
            continue;
          }
          // profundidade pelo tamanho da palma, com zona morta de 6% (ruído do tamanho não mexe o objeto)
          let ds = h.src === "cam" ? h.scale / g.sc0 - 1 : 0;
          ds = Math.abs(ds) < 0.06 ? 0 : ds - Math.sign(ds) * 0.06;
          const z = Math.max(-6, Math.min(3.5, g.z0 + ds * 6));
          S.toWorld(h.px ?? h.x, h.py ?? h.y, z, tmp).add(tmp2.set(g.off.x, g.off.y, 0));
          tmp.z = z;
          const k = 1 - Math.exp(-dt * 22);
          o.position.lerp(tmp, k);
          g.hist.push({ p: o.position.clone(), t: tNow }); while (g.hist.length > 2 && tNow - g.hist[0].t > 0.12) g.hist.shift();
          if (h.src === "cam") o.rotation.z += ((g.r0 - (h.angle - g.a0)) - o.rotation.z) * k * 0.5;
          u.w.multiplyScalar(Math.exp(-dt * 6)); o.rotation.x += u.w.x * dt; o.rotation.y += u.w.y * dt;
        }
        // destaque: o objeto que vai ser pego acende; o que está preso fica aceso
        hover.clear();
        for (const h of hands) if (!grabs.has(h.id)) { const o = nearest(h); if (o) hover.add(o); }
        for (const o of objs) {
          const m = o.material, target = o.userData.grab ? 0.55 : hover.has(o) ? 0.28 : 0;
          if (m.emissive) { if (!o.userData.em) { o.userData.em = m.emissive.clone(); m.emissive.setHex(0xff3b3b); } m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 12); }
        }
        // física livre: amortecimento, paredes, colisões esféricas
        for (const o of objs) {
          const u = o.userData;
          o.scale.setScalar(o.scale.x + (u.s - o.scale.x) * Math.min(1, dt * 10));
          if (u.grab) continue;
          u.v.multiplyScalar(Math.exp(-dt * 0.55));
          o.position.addScaledVector(u.v, dt);
          o.rotation.x += u.w.x * dt; o.rotation.y += u.w.y * dt; o.rotation.z += u.w.z * dt;
          u.w.multiplyScalar(Math.exp(-dt * 0.25)); if (u.w.length() < 0.15) u.w.multiplyScalar(1.02);
          const r = u.r * o.scale.x, wx = B.w * (1 - o.position.z / camera.position.z) - r, wy = B.h * (1 - o.position.z / camera.position.z) - r;
          for (const [ax, lim0] of [["x", wx], ["y", wy], ["z", 3.5]]) {
            const lim = ax === "y" ? lim0 * 0.74 : lim0, lo = ax === "z" ? -6 : -lim0; // topo livre para a barra de abas
            if (o.position[ax] > lim) { o.position[ax] = lim; if (u.v[ax] > 0) { if (u.v[ax] > 2) A.blip(260 + Math.random() * 80, Math.min(0.12, u.v[ax] * 0.012)); u.v[ax] *= -0.72; } }
            if (o.position[ax] < lo) { o.position[ax] = lo; if (u.v[ax] < 0) { if (u.v[ax] < -2) A.blip(260 + Math.random() * 80, Math.min(0.12, -u.v[ax] * 0.012)); u.v[ax] *= -0.72; } }
          }
        }
        for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) {
          const a = objs[i], b = objs[j], ra = a.userData.r * a.scale.x, rb = b.userData.r * b.scale.x;
          tmp.subVectors(b.position, a.position); const d = tmp.length(), min = ra + rb;
          if (d > 1e-4 && d < min) {
            tmp.divideScalar(d); const push = (min - d) / 2;
            if (!a.userData.grab) a.position.addScaledVector(tmp, -push);
            if (!b.userData.grab) b.position.addScaledVector(tmp, push);
            const rel = tmp2.subVectors(b.userData.v, a.userData.v).dot(tmp);
            if (rel < 0) {
              const imp = -1.7 * rel / 2;
              if (!a.userData.grab) a.userData.v.addScaledVector(tmp, -imp);
              if (!b.userData.grab) b.userData.v.addScaledVector(tmp, imp);
              if (-rel > 1.5) A.blip(400 + Math.random() * 300, Math.min(0.1, -rel * 0.015));
            }
          }
        }
        // destaque do objeto sob a mão principal
        const h0 = hands[0];
        const ho = h0 && !grabs.size ? nearest(h0) : [...grabs.values()][0]?.o || null;
        if (ho !== hoverO) { hoverO = ho; }
        glow.intensity += ((hoverO ? 14 : 0) - glow.intensity) * Math.min(1, dt * 8);
        if (hoverO) glow.position.copy(hoverO.position).add(tmp.set(0, 0, 1.6));
        renderer.render(scene, camera);
      },
      resize: S.resize,
      dispose: () => { scene.environment?.dispose(); S.dispose(); },
    };
  },
};
