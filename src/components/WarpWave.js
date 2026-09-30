// Mapa de deslocamento do portal: onda em anel + fatias horizontais (glitch de linha).
// As fatias re-sorteiam a ~24 fps (stutter de 2-3 frames), como o glitch/datamosh da edicao.
// O tamanho do mapa e independente do DPR; o navegador interpola.
export function createWarpWave(image, x, y, width, height) {
  const filter = image.parentElement;
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  filter.setAttribute("x", "-100"); filter.setAttribute("y", "-100");
  filter.setAttribute("width", String(width + 200)); filter.setAttribute("height", String(height + 200));
  image.setAttribute("width", String(width)); image.setAttribute("height", String(height));
  const W = 240, H = Math.max(96, Math.round(W * height / width));
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d"), frame = ctx.createImageData(W, H);
  const reach = Math.max(Math.hypot(x, y), Math.hypot(width - x, y), Math.hypot(x, height - y), Math.hypot(width - x, height - y));
  const points = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const dx = i / W * width - x, dy = j / H * height - y, d = Math.hypot(dx, dy);
    points.push([d, dx / (d || 1), dy / (d || 1)]);
  }
  const sx = new Float32Array(H), sy = new Float32Array(H);
  // fatias de 1 a 8 linhas; ~40% ficam paradas, o resto desloca em X; 1 a cada 8 e um rasgo forte
  const rebuild = () => {
    for (let j = 0; j < H;) {
      const h = 1 + Math.floor(Math.random() * 8);
      const still = Math.random() < 0.4;
      const tear = Math.random() < 0.125 ? 1.7 : 1;
      const v = still ? 0 : (Math.random() * 2 - 1) * tear;
      const w = Math.random() < 0.1 ? (Math.random() * 2 - 1) * 0.35 : 0;
      for (let k = 0; k < h && j < H; k++, j++) { sx[j] = v; sy[j] = w; }
    }
  };
  let last = "";
  return (progress, amp = 0) => {
    const step = Math.round(progress * 40), on = amp > 0.02;
    const key = step + ":" + (on ? Math.floor(performance.now() / 42) : 0);
    if (key === last) return;
    last = key;
    if (on) rebuild();
    const radius = progress * reach * 1.15, band = Math.max(65, Math.min(width, height) * 0.18);
    for (let j = 0; j < H; j++) {
      const gx = on ? sx[j] * amp * 127 : 0, gy = on ? sy[j] * amp * 127 : 0;
      for (let i = 0; i < W; i++) {
        const [d, nx, ny] = points[j * W + i], phase = (d - radius) / band;
        const wave = Math.sin(phase * Math.PI * 2) * Math.exp(-phase * phase * 2);
        const k = (j * W + i) * 4;
        frame.data[k] = 128 + wave * nx * 124 + gx;
        frame.data[k + 1] = 128 + wave * ny * 124 + gy;
        frame.data[k + 2] = 128; frame.data[k + 3] = 255;
      }
    }
    ctx.putImageData(frame, 0, 0);
    image.setAttribute("href", canvas.toDataURL());
  };
}
