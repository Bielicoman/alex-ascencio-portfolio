import { Mesh, MeshStandardMaterial, MeshBasicMaterial, BoxGeometry, PlaneGeometry, CylinderGeometry, CanvasTexture, Group, Vector3, Quaternion, Fog, LineSegments, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, AmbientLight, DirectionalLight, PointLight, AdditiveBlending } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { makeStage } from "../three-util";
import { TRACKS, beatmap, playTrack } from "../music";
import * as A from "../audio";

// Jogo de sabres no ritmo: blocos vêm pelo corredor no tempo da música; corte na direção da seta,
// com a mão da cor certa (vermelho = esquerda, branco = direita). Mãos pela câmera (sabre sai da mão
// na direção dos dedos) ou mouse/toque (um sabre que corta as duas cores).
const SPEED = 16, LEAD = 2.0; // unidades/s e segundos de antecedência (bloco nasce a 32 unidades)
const LANES = [-1.65, -0.55, 0.55, 1.65], ROWS = [0.35, 1.25, 2.15];
const COLORS = [0xff3b3b, 0xf3f3f5];
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0], any: null };
const bestKey = (id, x) => `pg-saber-${id}-${x ? "x" : "n"}`;
const readBest = (k) => { try { return +localStorage.getItem(k) || 0; } catch { return 0; } };
const saveBest = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

function arrowTex(dir) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); g.fillStyle = "#fff";
  if (dir === "any") { g.beginPath(); g.arc(64, 64, 18, 0, 7); g.fill(); }
  else {
    g.translate(64, 64); g.rotate({ down: 0, up: Math.PI, left: Math.PI / 2, right: -Math.PI / 2 }[dir]);
    g.beginPath(); g.moveTo(-40, -14); g.lineTo(0, 26); g.lineTo(40, -14); g.lineTo(28, -26); g.lineTo(0, 2); g.lineTo(-28, -26); g.closePath(); g.fill();
  }
  const t = new CanvasTexture(c); t.anisotropy = 4; return t;
}
const segRect = (ax, ay, bx, by, r) => { // segmento cruza o retângulo projetado do bloco?
  if (Math.max(ax, bx) < r.x0 || Math.min(ax, bx) > r.x1 || Math.max(ay, by) < r.y0 || Math.min(ay, by) > r.y1) return false;
  const inside = (x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  if (inside(ax, ay) || inside(bx, by)) return true;
  const cross = (p, q, r2, s) => { const d = (q[0] - p[0]) * (s[1] - r2[1]) - (q[1] - p[1]) * (s[0] - r2[0]); if (!d) return false; const u = ((r2[0] - p[0]) * (s[1] - r2[1]) - (r2[1] - p[1]) * (s[0] - r2[0])) / d, v = ((r2[0] - p[0]) * (q[1] - p[1]) - (r2[1] - p[1]) * (q[0] - p[0])) / d; return u >= 0 && u <= 1 && v >= 0 && v <= 1; };
  const P = [ax, ay], Q = [bx, by], c = [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]];
  return c.some((p, i) => cross(P, Q, p, c[(i + 1) % 4]));
};

export default {
  id: "sabre", name: "Sabre",
  hint: [["hand", "Segure 2 canetas com a mão fechada"], ["swipe", "Corte na direção da seta"], ["point", "Vermelho = esquerda · branco = direita"], ["keys", "Sem câmera: mouse ou dedo"]],
  mount(host, { input }) {
    const S = makeStage(host, { fov: 62, z: 4.2 });
    const { scene, camera, renderer } = S;
    camera.position.set(0, 1.45, 4.2); camera.lookAt(0, 1.1, -10);
    scene.fog = new Fog(0x060607, 12, 34);
    scene.add(new AmbientLight(0xffffff, 0.35));
    const key = new DirectionalLight(0xffffff, 1.2); key.position.set(2, 5, 4); scene.add(key);
    const glow = new PointLight(0xff3b3b, 6, 12, 1.5); glow.position.set(0, 2, 1); scene.add(glow);

    // corredor: trilhos de luz e linhas de chão que correm no tempo
    const floorLines = [];
    const lineMat = new LineBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.5 });
    const rails = new BufferGeometry();
    rails.setAttribute("position", new Float32BufferAttribute([-2.4, -0.2, 0, -2.4, -0.2, -40, 2.4, -0.2, 0, 2.4, -0.2, -40, -2.4, 3.2, -1, -2.4, 3.2, -40, 2.4, 3.2, -1, 2.4, 3.2, -40], 3));
    scene.add(new LineSegments(rails, lineMat));
    const cross = new BufferGeometry(); cross.setAttribute("position", new Float32BufferAttribute([-2.4, -0.2, 0, 2.4, -0.2, 0], 3));
    const crossMat = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
    for (let i = 0; i < 16; i++) { const l = new LineSegments(cross, crossMat); l.position.z = -i * 2.5; scene.add(l); floorLines.push(l); }
    // plano de corte (onde o bloco deve ser atingido)
    const hitPlane = new Mesh(new PlaneGeometry(4.8, 0.02), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }));
    hitPlane.position.set(0, -0.19, 0); hitPlane.rotation.x = -Math.PI / 2; scene.add(hitPlane);

    const boxGeo = new RoundedBoxGeometry(0.78, 0.78, 0.78, 4, 0.1);
    const mats = COLORS.map((c) => new MeshStandardMaterial({ color: 0x141416, roughness: 0.35, metalness: 0.4, emissive: c, emissiveIntensity: 0.55 }));
    const tex = Object.fromEntries(Object.keys(DIRV).map((d) => [d, arrowTex(d)]));
    const faceGeo = new PlaneGeometry(0.62, 0.62);
    const faceMats = Object.fromEntries(Object.keys(DIRV).map((d) => [d, new MeshBasicMaterial({ map: tex[d], transparent: true })]));
    const makeBlock = (hand, dir) => {
      const g = new Group(); g.add(new Mesh(boxGeo, mats[hand]));
      const f = new Mesh(faceGeo, faceMats[dir]); f.position.z = 0.4; g.add(f);
      scene.add(g); return g;
    };

    // overlay 2D: sabres, rastros, textos (por cima do WebGL)
    const ov = document.createElement("canvas"); ov.className = "pg-canvas"; ov.style.pointerEvents = "none"; host.appendChild(ov);
    const og = ov.getContext("2d");
    const hud = document.createElement("div"); hud.className = "sb-hud"; host.appendChild(hud);
    const resize = () => { S.resize(); const d = Math.min(2, devicePixelRatio); ov.width = host.clientWidth * d; ov.height = host.clientHeight * d; og.setTransform(d, 0, 0, d, 0, 0); };
    resize();

    const log = [];
    let state = "menu", expert = false, track = null, map = null, music = null, idx = 0, live = [], debris = [], sparks = [];
    let score = 0, combo = 0, maxCombo = 0, hits = 0, energy = 0.5, mult = 1, T = 0, total = 0;
    const sabers = new Map(); // id → { tip, base, ptip, color } (sabre 2D: mouse/toque)
    // sabres 3D (câmera): a caneta/bastão segurado com a mão fechada passa pela linha dos nós dos dedos;
    // a lâmina aponta do mindinho (17) para o indicador (5), em 3D real (worldLandmarks, metros)
    const BLADE = 1.35, HILT = 0.26, GRIP_Z = 0.9;
    const hiltGeo = new CylinderGeometry(0.038, 0.044, HILT, 18), coreGeo = new CylinderGeometry(0.017, 0.017, BLADE, 12), glowGeo = new CylinderGeometry(0.06, 0.045, BLADE, 18);
    const hiltMat = new MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.9, roughness: 0.25 });
    const coreMat = new MeshBasicMaterial({ color: 0xffffff });
    const glowMats = COLORS.concat([0xff9a9a]).map((c) => new MeshBasicMaterial({ color: c, transparent: true, opacity: 0.38, blending: AdditiveBlending, depthWrite: false }));
    const sab3 = new Map(); // id → { g, glow, hilt:Vector3, tip:Vector3, philt, ptip, dir, color }
    const UP = new Vector3(0, 1, 0);
    const make3 = () => {
      const g = new Group();
      const hilt = new Mesh(hiltGeo, hiltMat); hilt.position.y = HILT / 2; g.add(hilt);
      const core = new Mesh(coreGeo, coreMat); core.position.y = HILT + BLADE / 2; g.add(core);
      const glow = new Mesh(glowGeo, glowMats[2]); glow.position.y = HILT + BLADE / 2; g.add(glow);
      const light = new PointLight(0xff3b3b, 0, 3, 2); light.position.y = HILT + BLADE * 0.6; g.add(light);
      scene.add(g);
      return { g, glow, light, dir: new Vector3(0, 1, 0), hilt: new Vector3(), tip: new Vector3(), philt: null, ptip: null, v: { x: 0, y: 0 }, sp3: 0 };
    };
    const segDist = (c, a, b) => { // distância ponto–segmento com profundidade tolerante (webcam estima z mal)
      const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, L = abx * abx + aby * aby + abz * abz || 1;
      let t = ((c.x - a.x) * abx + (c.y - a.y) * aby + (c.z - a.z) * abz) / L; t = Math.max(0, Math.min(1, t));
      const dx = c.x - (a.x + abx * t), dy = c.y - (a.y + aby * t), dz = (c.z - (a.z + abz * t)) * 0.35;
      return Math.hypot(dx, dy, dz);
    };
    const va = new Vector3(), vb = new Vector3();

    // menu: três blocos-capa (um por faixa) — corte um para jogar
    let menu = [];
    const buildMenu = () => {
      menu.forEach((m) => scene.remove(m.g)); menu = [];
      TRACKS.forEach((tr, i) => {
        const g = new Group();
        const m = new Mesh(new RoundedBoxGeometry(1.1, 1.1, 1.1, 4, 0.14), new MeshStandardMaterial({ color: 0x141416, roughness: 0.3, metalness: 0.5, emissive: tr.color, emissiveIntensity: 0.6 }));
        g.add(m); g.position.set((i - 1) * 1.9, 1.35, -1.2); scene.add(g);
        menu.push({ g, tr });
      });
      renderMenuHud();
    };
    const renderMenuHud = () => {
      hud.innerHTML = `<div class="sb-menu">
        <p class="mono">Jogo de ritmo · trilhas originais</p>
        <div class="sb-tracks">${TRACKS.map((t, i) => `<span data-i="${i}"><b>${t.title}</b><small>${t.style} · ${t.bpm} BPM</small><small>recorde ${readBest(bestKey(t.id, expert)).toLocaleString("pt-BR")}</small></span>`).join("")}</div>
        <div class="sb-diff"><button data-d="0" aria-pressed="${!expert}">Normal</button><button data-d="1" aria-pressed="${expert}">Expert</button></div>
        <p class="sb-tip">Corte um bloco para começar${input.cam ? "" : " · sem câmera: arraste o mouse ou o dedo"}</p>
      </div>`;
      hud.querySelectorAll(".sb-diff button").forEach((b) => (b.onclick = () => { expert = b.dataset.d === "1"; A.blip(1200, 0.05); renderMenuHud(); }));
    };
    const start = (tr) => {
      A.unlock();
      menu.forEach((m) => scene.remove(m.g)); menu = [];
      track = tr; map = beatmap(tr, expert); idx = 0; live = [];
      score = 0; combo = 0; maxCombo = 0; hits = 0; energy = 0.6; mult = 1; total = map.notes.length;
      glow.color.setHex(tr.color);
      music = playTrack(tr, { onEnd: () => finish(true) });
      state = "play";
      hud.innerHTML = `<div class="sb-top"><div><b class="sb-score">0</b><small class="mono">pontos</small></div><div class="sb-mid"><span class="mono sb-title">${tr.title}</span><i class="sb-prog"><b></b></i><i class="sb-energy"><b></b></i></div><div class="sb-right"><b class="sb-combo">0</b><small class="mono sb-mult">combo · ×1</small></div></div>`;
    };
    const finish = (cleared) => {
      if (state !== "play") return;
      state = "end"; music?.stop();
      live.forEach((b) => scene.remove(b.g)); live = [];
      const k = bestKey(track.id, expert), best = Math.max(readBest(k), score); saveBest(k, best);
      const acc = total ? hits / total : 0, rank = !cleared ? "F" : acc > 0.95 ? "S" : acc > 0.85 ? "A" : acc > 0.7 ? "B" : "C";
      A.boom(0.4);
      hud.innerHTML = `<div class="sb-end"><span class="sb-rank ${rank === "F" ? "f" : ""}">${rank}</span><b>${score.toLocaleString("pt-BR")} pontos</b>
        <small class="mono">${cleared ? "Faixa completa" : "Energia zerada"} · acerto ${Math.round(acc * 100)}% · combo máx. ${maxCombo} · recorde ${best.toLocaleString("pt-BR")}</small>
        <p class="sb-tip">Corte um bloco para jogar de novo</p></div>`;
      setTimeout(buildMenu, 400);
    };

    // projeção do bloco na tela (retângulo da face da frente, com folga)
    const tmp = new Vector3();
    const rectOf = (g, pad = 18) => {
      const r = S.canvas.getBoundingClientRect();
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [dx, dy] of [[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45]]) {
        tmp.set(g.position.x + dx * g.scale.x, g.position.y + dy * g.scale.y, g.position.z + 0.4).project(camera);
        const x = r.left + ((tmp.x + 1) / 2) * r.width, y = r.top + ((1 - tmp.y) / 2) * r.height;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad };
    };
    const burst = (g, color, vx, vy) => {
      // duas metades voando + faíscas
      for (const s of [-1, 1]) {
        const half = new Mesh(new BoxGeometry(0.78, 0.39, 0.78), mats[color === COLORS[0] ? 0 : 1]);
        half.position.copy(g.position).add(new Vector3(0, s * 0.2, 0));
        const ang = Math.atan2(vy, vx);
        half.rotation.z = -ang;
        scene.add(half);
        debris.push({ m: half, v: new Vector3(-Math.sin(ang) * s * 2.5 + vx * 0.002, Math.cos(ang) * s * 2.5 - vy * 0.002, 2), w: new Vector3(Math.random() * 8, Math.random() * 8, s * 6), t: 0 });
      }
      const p = S.toScreen(g.position);
      for (let i = 0; i < 26; i++) { const a = Math.random() * 7, v = 200 + Math.random() * 700; sparks.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.3, c: color }); }
    };
    const setHud = () => {
      const q = (s) => hud.querySelector(s);
      if (!q(".sb-score")) return;
      q(".sb-score").textContent = score.toLocaleString("pt-BR");
      q(".sb-combo").textContent = combo; q(".sb-mult").textContent = `combo · ×${mult}`;
      q(".sb-prog b").style.width = `${Math.min(100, (music.now() / map.duration) * 100)}%`;
      q(".sb-energy b").style.width = `${energy * 100}%`;
      q(".sb-energy").classList.toggle("low", energy < 0.25);
    };
    buildMenu();
    if (import.meta.env.DEV) window.__Vec = Vector3;
    if (import.meta.env.DEV) window.__sb = { get live() { return live; }, rectOf, toScreen: S.toScreen, sab3, get now() { return music?.now(); }, get state() { return state; }, get score() { return score; }, get hits() { return hits; }, get total() { return total; }, log };

    return {
      frame(dt, hands) {
        T += dt;
        const W = host.clientWidth, H = host.clientHeight, r = input.region;
        // ── sabres: base na mão, lâmina na direção punho → dedos ──
        const seen = new Set();
        const cams = hands.filter((h) => h.src === "cam").sort((a, b) => a.x - b.x);
        // câmera com pontos 3D → sabres 3D na cena (duas mãos juntas no mesmo objeto = um sabre só)
        const cam3 = cams.filter((h) => h.world);
        const seen3 = new Set();
        const two = cam3.length === 2 && Math.hypot(cam3[0].gx - cam3[1].gx, cam3[0].gy - cam3[1].gy) < Math.min(W, H) * 0.16;
        const k3 = 1 - Math.exp(-dt * 22);
        const upd3 = (id, grip, dirWorld, color) => {
          seen3.add(id);
          let sb = sab3.get(id); if (!sb) { sb = make3(); sab3.set(id, sb); }
          S.toWorld(grip.x, grip.y, GRIP_Z, va);
          sb.philt = sb.philt ? sb.philt.copy(sb.hilt) : va.clone(); sb.ptip = sb.ptip ? sb.ptip.copy(sb.tip) : null;
          sb.hilt.lerp(va, sb.ptip ? k3 : 1);
          sb.dir.lerp(dirWorld, sb.ptip ? k3 : 1).normalize();
          sb.tip.copy(sb.hilt).addScaledVector(sb.dir, HILT + BLADE);
          if (!sb.ptip) sb.ptip = sb.tip.clone();
          sb.g.position.copy(sb.hilt); sb.g.quaternion.setFromUnitVectors(UP, sb.dir);
          sb.color = color; sb.glow.material = glowMats[color === -1 ? 2 : color]; sb.light.color.setHex(color === 1 ? 0xffffff : 0xff3b3b);
          // velocidade da ponta: em 3D (unidades/s) e projetada na tela (px/s) para a regra de direção das setas
          sb.sp3 = sb.tip.distanceTo(sb.ptip) / Math.max(dt, 1e-3);
          const p0 = S.toScreen(sb.ptip), p1 = S.toScreen(sb.tip);
          sb.v = { x: (p1.x - p0.x) / Math.max(dt, 1e-3), y: (p1.y - p0.y) / Math.max(dt, 1e-3) };
          sb.light.intensity += (Math.min(6, sb.sp3 * 0.8) - sb.light.intensity) * k3;
        };
        const wdir = (h) => { const w = h.world; return va.set(w[5].x - w[17].x, w[5].y - w[17].y, w[5].z - w[17].z).normalize().clone(); };
        if (two) {
          const [a, b] = cam3[0].gy > cam3[1].gy ? cam3 : [cam3[1], cam3[0]]; // a = mão de baixo
          S.toWorld(a.gx, a.gy, GRIP_Z, va); S.toWorld(b.gx, b.gy, GRIP_Z, vb);
          const d = vb.clone().sub(va); d.z += (wdir(a).z + wdir(b).z) * 0.5 * d.length();
          upd3("both", { x: a.gx, y: a.gy }, d.normalize(), -1);
        } else cam3.forEach((h) => upd3(h.id, { x: h.gx, y: h.gy }, wdir(h), cam3.length === 2 ? (h === cam3[0] ? 0 : 1) : -1));
        for (const [id, sb] of sab3) if (!seen3.has(id)) { scene.remove(sb.g); sab3.delete(id); }

        hands.forEach((h) => {
          if (h.src === "cam" && h.world) return; // já é sabre 3D
          if (cam3.length && h.src === "mouse" && !(h.path || []).length) return; // com câmera, mouse parado não vira sabre
          seen.add(h.id);
          let base, dir, color;
          if (h.src === "cam" && h.lm && r) {
            const mx = (x) => ((x - r.x0) / (r.x1 - r.x0)) * W, my = (y) => ((y - r.y0) / (r.y1 - r.y0)) * H;
            base = { x: h.x, y: h.y };
            const dx = mx(h.lm[9].x) - mx(h.lm[0].x), dy = my(h.lm[9].y) - my(h.lm[0].y), L = Math.hypot(dx, dy) || 1;
            dir = { x: dx / L, y: dy / L };
            color = cams.length === 2 ? (h === cams[0] ? 0 : 1) : -1; // uma mão só: corta as duas cores
          } else {
            base = { x: h.x, y: h.y + 60 }; dir = { x: -0.25, y: -0.97 }; color = -1;
          }
          const len = Math.min(W, H) * 0.24;
          const tip = { x: base.x + dir.x * len, y: base.y + dir.y * len };
          let s = sabers.get(h.id);
          if (!s) { s = { tip, base, trail: [] }; sabers.set(h.id, s); }
          s.ptip = s.tip; s.pbase = s.base; s.tip = tip; s.base = base; s.color = color;
          // pontos intermediários da ponta (mouse/toque): todo o caminho do golpe entra no teste de corte
          const off = { x: tip.x - h.x, y: tip.y - h.y };
          s.path = [s.ptip, ...(h.path || []).map((q) => ({ x: q.x + off.x, y: q.y + off.y })), tip];
          s.v = { x: (tip.x - s.ptip.x) / Math.max(dt, 1e-3), y: (tip.y - s.ptip.y) / Math.max(dt, 1e-3) };
          s.trail.push(...s.path.slice(1).map((q) => ({ ...q, t: T }))); while (s.trail.length && T - s.trail[0].t > 0.12) s.trail.shift();
        });
        for (const id of sabers.keys()) if (!seen.has(id)) sabers.delete(id);
        const swings = [...sabers.values()].filter((s) => Math.hypot(s.v.x, s.v.y) > 650);
        // corte = algum trecho do caminho da ponta (ou a lâmina) cruza o bloco. A direção avaliada é a do
        // trecho que cruzou, não a do quadro inteiro (senão o reposicionamento da mão conta como golpe).
        const cuts = (rect, want, g) => {
          let best = null;
          if (g) for (const sb of sab3.values()) { // 3D: lâmina varrida entre o quadro anterior e o atual contra o centro do bloco
            if (sb.sp3 < 2.2 || !sb.ptip) continue;
            let dmin = Infinity;
            for (let k = 0; k <= 4; k++) { const f = k / 4; va.lerpVectors(sb.philt, sb.hilt, f); vb.lerpVectors(sb.ptip, sb.tip, f); dmin = Math.min(dmin, segDist(g.position, va, vb)); }
            if (dmin < 0.55 * g.scale.x + 0.05) {
              const sp = Math.hypot(sb.v.x, sb.v.y) || 1, sc = want ? (sb.v.x * want[0] + sb.v.y * want[1]) / sp : sp;
              if (!best || sc > best.sc) best = { s: { color: sb.color, path: [] }, sc, v: sb.v };
            }
          }
          for (const s of swings) {
            const segs = [];
            s.path.forEach((q, i) => { if (i && segRect(s.path[i - 1].x, s.path[i - 1].y, q.x, q.y, rect)) segs.push([q.x - s.path[i - 1].x, q.y - s.path[i - 1].y]); });
            if (!segs.length && (segRect(s.base.x, s.base.y, s.tip.x, s.tip.y, rect) || segRect((s.pbase.x + s.ptip.x) / 2, (s.pbase.y + s.ptip.y) / 2, (s.base.x + s.tip.x) / 2, (s.base.y + s.tip.y) / 2, rect))) segs.push([s.v.x, s.v.y]);
            for (const g of segs) {
              const L = Math.hypot(g[0], g[1]) || 1, sc = want ? (g[0] * want[0] + g[1] * want[1]) / L : L;
              if (!best || sc > best.sc) best = { s, sc, v: { x: (g[0] / L) * Math.hypot(s.v.x, s.v.y), y: (g[1] / L) * Math.hypot(s.v.x, s.v.y) } };
            }
          }
          return best && { ...best.s, v: best.v };
        };

        // ── menu / fim: cortar um bloco-capa escolhe a faixa ──
        if (state !== "play") {
          menu.forEach((m, i) => {
            m.g.rotation.y += dt * 0.6; m.g.rotation.x = Math.sin(T + i) * 0.2; m.g.position.y = 1.35 + Math.sin(T * 1.4 + i) * 0.08;
            const rc = rectOf(m.g, 4);
            // rótulo HTML acompanha o bloco
            const lab = hud.querySelector(`.sb-tracks span[data-i="${i}"]`);
            if (lab) { lab.style.left = `${(rc.x0 + rc.x1) / 2}px`; lab.style.top = `${rc.y1 + 14}px`; }
            const s = cuts(rc, null, m.g);
            const clicked = hands.find((h) => h.down && h.x > rc.x0 && h.x < rc.x1 && h.y > rc.y0 && h.y < rc.y1);
            if ((s || clicked) && state !== "play") { burst(m.g, m.tr.color, s?.v.x || 0, s?.v.y || 900); A.slice(1, 0); start(m.tr); }
          });
        } else {
          const now = music.now();
          // nascimento
          while (idx < map.notes.length && map.notes[idx].t - now < LEAD) {
            const n = map.notes[idx++]; const g = makeBlock(n.hand, n.dir);
            g.position.set(LANES[n.lane], ROWS[n.row], -SPEED * LEAD);
            live.push({ n, g, done: false });
          }
          // movimento e acerto (janela: de 0,22 s antes a 0,12 s depois do tempo)
          for (let i = live.length - 1; i >= 0; i--) {
            const b = live[i], dtN = b.n.t - now;
            b.g.position.z = -dtN * SPEED;
            if (dtN < 0.22 && dtN > -0.14 && !b.done) {
              const s = cuts(rectOf(b.g), DIRV[b.n.dir], b.g);
              if (s) {
                const want = DIRV[b.n.dir], sp = Math.hypot(s.v.x, s.v.y);
                const dirOk = !want || (s.v.x * want[0] + s.v.y * want[1]) / sp > 0.42; // até ~65°
                const colorOk = s.color === -1 || s.color === b.n.hand;
                // movimento de aproximação na direção errada antes da hora não "gasta" o bloco
                if (!(dirOk && colorOk) && dtN > 0.03) continue;
                b.done = true; scene.remove(b.g); live.splice(i, 1);
                if (import.meta.env.DEV) log.push({ r: dirOk && colorOk ? "hit" : dirOk ? "cor" : "dir", want: b.n.dir, v: [Math.round(s.v.x), Math.round(s.v.y)], dtN: +dtN.toFixed(2), path: (s.path || []).map((q) => [Math.round(q.x), Math.round(q.y)]), rect: Object.values(rectOf(b.g, 0)).map(Math.round) });
                if (dirOk && colorOk) {
                  combo++; hits++; maxCombo = Math.max(maxCombo, combo);
                  mult = combo >= 24 ? 8 : combo >= 12 ? 4 : combo >= 4 ? 2 : 1;
                  const pts = Math.round((70 + Math.min(45, sp / 60) + (1 - Math.min(1, Math.abs(dtN) / 0.2)) * 20) * mult);
                  score += pts; energy = Math.min(1, energy + 0.03);
                  burst(b.g, COLORS[b.n.hand], s.v.x, s.v.y); A.slice(1 + Math.min(combo, 20) * 0.02, (b.g.position.x / 3));
                } else { combo = 0; mult = 1; energy -= 0.05; A.glitch(); }
                continue;
              }
            }
            if (dtN < -0.2 && !b.done) { if (import.meta.env.DEV) log.push({ r: "passou", want: b.n.dir }); b.done = true; combo = 0; mult = 1; energy -= 0.06; }
            if (b.g.position.z > 3) { scene.remove(b.g); live.splice(i, 1); }
          }
          if (energy <= 0) finish(false);
          if (state === "play") setHud();
          // chão corre no tempo
          floorLines.forEach((l, k) => { l.position.z = ((now * SPEED) % 2.5) - k * 2.5; });
          lineMat.opacity = 0.35 + 0.35 * Math.max(0, 1 - ((now * music_bpm(track)) / 60 % 1) * 3);
        }
        // detritos
        for (let i = debris.length - 1; i >= 0; i--) {
          const d = debris[i]; d.t += dt; if (d.t > 1) { scene.remove(d.m); d.m.geometry.dispose(); debris.splice(i, 1); continue; }
          d.v.y -= 9 * dt; d.m.position.addScaledVector(d.v, dt); d.m.rotation.x += d.w.x * dt; d.m.rotation.y += d.w.y * dt;
        }
        renderer.render(scene, camera);

        // ── overlay: sabres com brilho + faíscas ──
        og.clearRect(0, 0, W, H);
        og.lineCap = "round";
        for (const s of sabers.values()) {
          const col = s.color === 0 ? "255,59,59" : s.color === 1 ? "243,243,245" : "255,150,150";
          if (s.trail.length > 1) { og.beginPath(); og.moveTo(s.trail[0].x, s.trail[0].y); for (const p of s.trail) og.lineTo(p.x, p.y); og.strokeStyle = `rgba(${col},.35)`; og.lineWidth = 14; og.stroke(); }
          for (const [w, a] of [[16, 0.18], [8, 0.45], [3, 1]]) { og.strokeStyle = w === 3 ? "#fff" : `rgba(${col},${a})`; og.lineWidth = w; og.beginPath(); og.moveTo(s.base.x, s.base.y); og.lineTo(s.tip.x, s.tip.y); og.stroke(); }
          og.fillStyle = "#222"; og.beginPath(); og.arc(s.base.x, s.base.y, 7, 0, 7); og.fill(); og.strokeStyle = `rgba(${col},1)`; og.lineWidth = 2; og.stroke();
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const p = sparks[i]; p.life -= dt; if (p.life <= 0) { sparks.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt;
          const c = p.c === COLORS[0] || p.c === 0xff3b3b ? "255,80,80" : "255,255,255";
          og.fillStyle = `rgba(${c},${p.life * 1.8})`; og.fillRect(p.x, p.y, 3, 3);
        }
      },
      resize,
      dispose() { music?.stop(); hud.remove(); ov.remove(); Object.values(tex).forEach((t) => t.dispose()); S.dispose(); },
    };
  },
};
const music_bpm = (t) => t?.bpm || 120;
