import * as THREE from "three";
import { MARK_PATH, MARK_W, MARK_H } from "../brand";

// Campo de partículas que reage ao cursor e se reorganiza na marca AA com o scroll.
const vert = /* glsl */ `
  uniform float uTime, uMorph, uPR, uSize, uForce;
  uniform vec2 uMouse, uVel;
  attribute vec3 aHome;
  attribute vec3 aLogo;
  attribute vec4 aRnd;
  varying float vHeat;
  varying float vAlpha;
  varying float vRed;
  void main(){
    float t = uTime * (0.15 + aRnd.x * 0.25);
    vec3 home = aHome + vec3(sin(t + aRnd.y * 6.28) * 0.18, cos(t * 0.8 + aRnd.z * 6.28) * 0.14, sin(t * 0.6) * 0.2);
    vec3 logo = aLogo + vec3(sin(uTime * 1.3 + aRnd.w * 20.0) * 0.012, cos(uTime + aRnd.y * 20.0) * 0.012, 0.0);
    float m = smoothstep(0.0, 1.0, clamp(uMorph * 1.25 - aRnd.x * 0.25, 0.0, 1.0));
    vec3 p = mix(home, logo, m);
    vec2 d = p.xy - uMouse;
    float dist = length(d);
    float f = exp(-dist * dist * 2.2) * uForce;
    p.xy += normalize(d + 1e-4) * f * mix(0.85, 0.35, m);
    p.xy += uVel * f * 0.6;
    p.z += f * 0.9;
    p.z *= mix(1.0, 0.3, m);
    vHeat = clamp(f * 1.4, 0.0, 1.0) * mix(1.0, 0.35, m);
    vRed = step(0.86, aRnd.w) * (1.0 - m) + step(0.93, aRnd.w) * m;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float s = uSize * (0.45 + aRnd.z * 0.9) * mix(1.0, 0.62, m) * (1.0 + vHeat * 1.6);
    gl_PointSize = s * uPR * (10.0 / -mv.z);
    vAlpha = (0.35 + aRnd.y * 0.65) * mix(1.0, 1.6, m);
  }
`;
const frag = /* glsl */ `
  precision highp float;
  uniform vec3 uWhite, uRed;
  uniform float uOpacity;
  varying float vHeat;
  varying float vAlpha;
  varying float vRed;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float core = smoothstep(0.5, 0.0, r);
    float a = pow(core, 1.8) * vAlpha * uOpacity;
    vec3 col = mix(uWhite, uRed, clamp(vHeat + vRed, 0.0, 1.0));
    gl_FragColor = vec4(col, a);
  }
`;

function sampleMark(count, width) {
  const cw = 524, ch = 302;
  const cv = document.createElement("canvas");
  cv.width = cw; cv.height = ch;
  const ctx = cv.getContext("2d");
  ctx.scale(cw / MARK_W, ch / MARK_H);
  ctx.fill(new Path2D(MARK_PATH));
  const data = ctx.getImageData(0, 0, cw, ch).data;
  const pts = [];
  for (let y = 0; y < ch; y += 1) for (let x = 0; x < cw; x += 1) if (data[(y * cw + x) * 4 + 3] > 128) pts.push([x, y]);
  const out = new Float32Array(count * 3);
  const scale = width / cw;
  for (let i = 0; i < count; i++) {
    const [x, y] = pts[(Math.random() * pts.length) | 0];
    out[i * 3] = (x + Math.random() - cw / 2) * scale;
    out[i * 3 + 1] = -(y + Math.random() - ch / 2) * scale + 0.15;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
  }
  return out;
}

export default class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.mobile = matchMedia("(max-width: 760px)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    this.camera.position.z = 10;
    this.mouse = new THREE.Vector2(99, 99);
    this.target = new THREE.Vector2(99, 99);
    this.vel = new THREE.Vector2();
    this.force = 0;
    this.morph = 0;
    this.running = false;
    this.t0 = performance.now();
    this.build();
    this.resize();
    this.onMove = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -((e.clientY - r.top) / r.height) * 2 + 1;
      this.target.set(nx * this.halfW, ny * this.halfH);
      this.forceTarget = 1;
    };
    this.onLeave = () => (this.forceTarget = 0);
    this.onResize = () => this.resize();
    window.addEventListener("pointermove", this.onMove, { passive: true });
    document.addEventListener("pointerleave", this.onLeave);
    window.addEventListener("resize", this.onResize);
    this.forceTarget = 0;
  }
  build() {
    const n = this.mobile ? 3200 : 9000;
    const home = new Float32Array(n * 3);
    const rnd = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      home[i * 3] = (Math.random() - 0.5) * 16;
      home[i * 3 + 1] = (Math.random() - 0.5) * 9;
      home[i * 3 + 2] = (Math.random() - 0.5) * 5 - 0.5;
      for (let k = 0; k < 4; k++) rnd[i * 4 + k] = Math.random();
    }
    const aspect = (this.canvas.clientWidth || innerWidth) / (this.canvas.clientHeight || innerHeight);
    const visW = Math.tan(THREE.MathUtils.degToRad(17.5)) * 20 * aspect;
    const logo = sampleMark(n, Math.min(3.7, visW * 0.6));
    for (let i = 1; i < logo.length; i += 3) logo[i] += this.mobile ? 1.05 : 1.15;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(home.slice(), 3));
    g.setAttribute("aHome", new THREE.BufferAttribute(home, 3));
    g.setAttribute("aLogo", new THREE.BufferAttribute(logo, 3));
    g.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 4));
    this.uniforms = {
      uTime: { value: 0 }, uMorph: { value: 0 }, uPR: { value: 1 }, uSize: { value: this.mobile ? 5 : 4.2 },
      uForce: { value: 0 }, uMouse: { value: this.mouse }, uVel: { value: this.vel }, uOpacity: { value: 1 },
      uWhite: { value: new THREE.Color("#e9e9ee") }, uRed: { value: new THREE.Color("#ff3b3b") },
    };
    this.mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const pr = Math.min(window.devicePixelRatio, 1.75);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.halfH = Math.tan(THREE.MathUtils.degToRad(17.5)) * 10;
    this.halfW = this.halfH * this.camera.aspect;
    this.uniforms.uPR.value = pr;
  }
  setMorph(v) { this.morph = v; }
  setOpacity(v) { this.uniforms.uOpacity.value = v; }
  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      const t = (performance.now() - this.t0) / 1000;
      this.uniforms.uTime.value = t;
      const px = this.mouse.x, py = this.mouse.y;
      this.mouse.lerp(this.target, 0.12);
      this.vel.set(this.mouse.x - px, this.mouse.y - py).multiplyScalar(4);
      this.force += (this.forceTarget - this.force) * 0.06;
      this.uniforms.uForce.value = this.force;
      this.uniforms.uMorph.value += (this.morph - this.uniforms.uMorph.value) * 0.08;
      this.points.rotation.y = Math.sin(t * 0.1) * 0.06 + this.mouse.x * 0.01 * (1 - this.uniforms.uMorph.value);
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  renderOnce() { this.renderer.render(this.scene, this.camera); }
  dispose() {
    this.stop();
    window.removeEventListener("pointermove", this.onMove);
    document.removeEventListener("pointerleave", this.onLeave);
    window.removeEventListener("resize", this.onResize);
    this.points.geometry.dispose(); this.mat.dispose(); this.renderer.dispose();
  }
}
