import * as THREE from "three";
import { renderPixelRatio } from "../util";

// Vídeo da lente como fundo: bulge óptico, aberração cromática e spot de luz seguindo o cursor.
const frag = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uRes, uVid, uMouse;
  uniform float uTime, uHover;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  vec2 cover(vec2 uv){
    float rs = uRes.x / uRes.y, ri = uVid.x / uVid.y;
    vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
    return (uv - 0.5) * s + 0.5;
  }
  void main(){
    vec2 asp = vec2(uRes.x / uRes.y, 1.0);
    vec2 d = (vUv - uMouse) * asp;
    float dist = length(d);
    float lens = exp(-dist * dist * 7.0) * uHover;
    vec2 uv = vUv - d / asp * lens * 0.16;
    uv += vec2(sin(uv.y * 14.0 + uTime) , cos(uv.x * 12.0 + uTime * 0.8)) * 0.0025 * lens;
    vec2 ca = d / asp * (0.006 + lens * 0.02);
    vec2 cu = cover(uv);
    vec3 col = vec3(texture2D(uTex, cover(uv + ca)).r, texture2D(uTex, cu).g, texture2D(uTex, cover(uv - ca)).b);
    float spot = 0.32 + lens * 1.05 + exp(-dist * dist * 1.5) * 0.25 * uHover;
    col *= spot;
    col = mix(col, col * vec3(1.25, 0.72, 0.72), 0.35);
    float vig = smoothstep(1.25, 0.25, length((vUv - 0.5) * asp));
    col *= vig;
    col += (hash(vUv * uRes + uTime) - 0.5) * 0.05;
    gl_FragColor = vec4(col, 1.0);
  }
`;
const vert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export default class LensField {
  constructor(canvas, video) {
    this.canvas = canvas;
    this.video = video;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.tex = new THREE.VideoTexture(video);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mouse = new THREE.Vector2(0.5, 0.45);
    this.target = new THREE.Vector2(0.5, 0.45);
    this.hover = 0.55;
    this.hoverTarget = 0.55;
    this.u = {
      uTex: { value: this.tex }, uRes: { value: new THREE.Vector2(1, 1) }, uVid: { value: new THREE.Vector2(1280, 720) },
      uMouse: { value: this.mouse }, uTime: { value: 0 }, uHover: { value: this.hover },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: this.u });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    this.mat = mat;
    this.t0 = performance.now();
    this.resize();
    this.onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      this.target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      this.hoverTarget = 1;
    };
    this.onResize = () => this.resize();
    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("resize", this.onResize);
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.renderer.setPixelRatio(renderPixelRatio(w, h, 2200000, 1));
    this.renderer.setSize(w, h, false);
    this.u.uRes.value.set(w, h);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.video.play().catch(() => {});
    const loop = () => {
      if (!this.running) return;
      const t = (performance.now() - this.t0) / 1000;
      this.u.uTime.value = t;
      if (this.hoverTarget < 1) this.target.set(0.5 + Math.sin(t * 0.4) * 0.22, 0.5 + Math.cos(t * 0.3) * 0.15);
      this.mouse.lerp(this.target, 0.07);
      this.hover += (this.hoverTarget - this.hover) * 0.05;
      this.u.uHover.value = this.hover;
      if (this.video.readyState >= 2) {
        this.renderer.render(this.scene, this.camera);
        this.canvas.classList.add("is-ready");
      }
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); this.video.pause(); }
  dispose() {
    this.stop();
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("resize", this.onResize);
    this.tex.dispose(); this.mat.dispose(); this.renderer.dispose();
  }
}
