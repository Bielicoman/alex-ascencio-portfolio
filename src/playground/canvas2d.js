// canvas 2D em tela cheia com DPR
export function make2d(host) {
  const c = document.createElement("canvas"); c.className = "pg-canvas"; host.appendChild(c);
  const g = c.getContext("2d");
  const s = { c, g, W: 0, H: 0, dpr: 1 };
  s.resize = () => {
    s.dpr = Math.min(2, devicePixelRatio); s.W = host.clientWidth; s.H = host.clientHeight;
    c.width = s.W * s.dpr; c.height = s.H * s.dpr; g.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
  };
  s.resize();
  s.local = (x, y) => { const r = c.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
  s.dispose = () => c.remove();
  return s;
}
export const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
