import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, Group, Points, ShaderMaterial, Vector3 } from "three";
import { makeStage } from "../three-util";
import { MARK_PATH, MARK_W, MARK_H } from "../../brand";
import * as A from "../audio";

// 26 mil partículas que formam a marca AA. Mão aberta empurra (vento), pinça vira buraco negro
// com redemoinho, soltar a pinça explode; duas pinças criam um feixe entre as mãos.
const N = 26000, MARK_SHARE = 0.72;

function sampleMark(n) {
  const s = 3, c = document.createElement("canvas"); c.width = MARK_W * s; c.height = MARK_H * s;
  const g = c.getContext("2d"); g.scale(s, s); g.fill(new Path2D(MARK_PATH));
  const d = g.getImageData(0, 0, c.width, c.height).data, pts = [];
  for (let y = 0; y < c.height; y += 1) for (let x = 0; x < c.width; x += 1) if (d[(y * c.width + x) * 4 + 3] > 128) pts.push(x, y);
  const out = new Float32Array(n * 3), W = 7.4, k = W / c.width;
  for (let i = 0; i < n; i++) {
    const j = (Math.random() * (pts.length / 2)) | 0;
    out[i * 3] = (pts[j * 2] - c.width / 2) * k; out[i * 3 + 1] = -(pts[j * 2 + 1] - c.height / 2) * k; out[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
  return out;
}

export default {
  id: "particulas", name: "Partículas",
  hint: [["pinch", "Pinça: buraco negro"], ["drag", "Solte: explosão"], ["hand", "Mão aberta: vento"], ["zoom", "Duas pinças: feixe"]],
  mount(host) {
    const S = makeStage(host, { fov: 45, z: 11 });
    const { scene, camera, renderer } = S;
    const nm = Math.floor(N * MARK_SHARE), mark = sampleMark(nm);
    const home = new Float32Array(N * 3), pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N);
    home.set(mark);
    for (let i = nm; i < N; i++) { // poeira em casca esférica para dar profundidade
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 6 + Math.random() * 9, q = Math.sqrt(1 - u * u);
      home[i * 3] = r * q * Math.cos(th); home[i * 3 + 1] = r * u * 0.6; home[i * 3 + 2] = r * q * Math.sin(th) - 6;
    }
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30; pos[i * 3 + 1] = (Math.random() - 0.5) * 18; pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      size[i] = i < nm ? 0.6 + Math.random() * 0.9 : 0.4 + Math.random() * 1.4;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(pos, 3).setUsage(DynamicDrawUsage));
    geo.setAttribute("color", new BufferAttribute(col, 3).setUsage(DynamicDrawUsage));
    geo.setAttribute("size", new BufferAttribute(size, 1));
    const mat = new ShaderMaterial({
      uniforms: { uPx: { value: renderer.getPixelRatio() } },
      vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; uniform float uPx;
        void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = size * uPx * 26. / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; void main(){ vec2 d = gl_PointCoord - .5; float r = length(d); if (r > .5) discard; float a = smoothstep(.5, 0., r); gl_FragColor = vec4(vC * a, a); }`,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const pts = new Points(geo, mat);
    const grp = new Group(); grp.add(pts); scene.add(grp);

    const hw = [];
    let t = 0;
    const charge = new Map();

    return {
      frame(dt, hands) {
        t += dt;
        grp.rotation.y = Math.sin(t * 0.15) * 0.18; grp.rotation.x = Math.sin(t * 0.11) * 0.06;
        grp.updateMatrixWorld();
        // mãos em coordenadas locais do grupo
        hw.length = 0;
        for (const h of hands) {
          const w = S.toWorld(h.x, h.y, 0, new Vector3()); grp.worldToLocal(w);
          hw.push({ w, pinch: h.pinch, open: h.src !== "cam" ? !h.pinch : h.open || !h.pinch });
          if (h.down) { charge.set(h.id, t); A.whoosh(false, 0.12); }
          if (h.up) { // explosão proporcional ao tempo carregando
            const held = Math.min(2.5, t - (charge.get(h.id) ?? t)); charge.delete(h.id);
            const R2 = 9 + held * 6, F = 8 + held * 10;
            for (let i = 0; i < N; i++) {
              const dx = pos[i * 3] - w.x, dy = pos[i * 3 + 1] - w.y, dz = pos[i * 3 + 2] - w.z, r2 = dx * dx + dy * dy + dz * dz;
              if (r2 < R2) { const r = Math.sqrt(r2) + 0.05, f = F * (0.4 + Math.random()) / r; vel[i * 3] += dx * f; vel[i * 3 + 1] += dy * f; vel[i * 3 + 2] += dz * f + (Math.random() - 0.5) * F; }
            }
            A.boom(0.25 + held * 0.12);
          }
        }
        const pinching = hw.filter((h) => h.pinch);
        const beam = pinching.length >= 2 ? [pinching[0].w, pinching[1].w] : null;
        const holding = hw.some((h) => h.pinch);
        const kHome = holding ? 0.9 : 2.4, damp = Math.exp(-dt * 2.1);
        for (let i = 0; i < N; i++) {
          const ix = i * 3;
          let px = pos[ix], py = pos[ix + 1], pz = pos[ix + 2];
          let ax = (home[ix] - px) * kHome, ay = (home[ix + 1] - py) * kHome, az = (home[ix + 2] - pz) * kHome;
          if (beam) { // ponto mais próximo no segmento entre as mãos
            const [a, b] = beam, ex = b.x - a.x, ey = b.y - a.y, ez = b.z - a.z, L = ex * ex + ey * ey + ez * ez + 1e-4;
            let u = ((px - a.x) * ex + (py - a.y) * ey + (pz - a.z) * ez) / L; u = u < 0 ? 0 : u > 1 ? 1 : u;
            const dx = px - (a.x + ex * u), dy = py - (a.y + ey * u), dz = pz - (a.z + ez * u), r2 = dx * dx + dy * dy + dz * dz;
            if (i < nm || r2 < 20) { const f = 30 / (r2 + 0.8); ax -= dx * f; ay -= dy * f; az -= dz * f; const s = 14 / (r2 + 0.6); ay += dz * s; az -= dy * s; }
          } else {
            for (const h of hw) {
              const dx = px - h.w.x, dy = py - h.w.y, dz = pz - h.w.z, r2 = dx * dx + dy * dy + dz * dz;
              if (h.pinch) { // gravidade + redemoinho
                const f = 26 / (r2 + 0.7), s = 18 / (r2 + 0.9);
                ax -= dx * f; ay -= dy * f; az -= dz * f * 1.4; ax += -dy * s; ay += dx * s;
              } else if (r2 < 7) { // vento
                const f = 22 * Math.exp(-r2 * 0.55) / (r2 + 0.2);
                ax += dx * f; ay += dy * f; az += dz * f + f * 0.4;
              }
            }
          }
          let vx = (vel[ix] + ax * dt) * damp, vy = (vel[ix + 1] + ay * dt) * damp, vz = (vel[ix + 2] + az * dt) * damp;
          vel[ix] = vx; vel[ix + 1] = vy; vel[ix + 2] = vz;
          pos[ix] = px + vx * dt; pos[ix + 1] = py + vy * dt; pos[ix + 2] = pz + vz * dt;
          // cor pela velocidade: branco frio → vermelho da marca → branco quente
          const sp = Math.min(1, Math.sqrt(vx * vx + vy * vy + vz * vz) * 0.09), base = i < nm ? 1 : 0.35;
          col[ix] = base * (0.72 + sp * 0.28); col[ix + 1] = base * (0.74 - sp * 0.6); col[ix + 2] = base * (0.8 - sp * 0.66);
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
        renderer.render(scene, camera);
      },
      resize: S.resize,
      dispose: S.dispose,
    };
  },
};
