import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./playground.css";
import { Input } from "./input";
import { CONNECTIONS, ERR, preloadHands } from "../gesture/hands";
import { MARK_PATH } from "../brand";
import * as A from "./audio";
import particles from "./modes/particles";
import objects from "./modes/objects";
import piano from "./modes/piano";
import drums from "./modes/drums";
import theremin from "./modes/theremin";
import slice from "./modes/slice";
import body from "./modes/body";

// Playground: laboratório de gestos independente do site. Tutorial de entrada, câmera opcional
// (mouse e toque sempre funcionam), 6 modos trocados por abas ou por #hash.
const MODES = [particles, objects, body, piano, drums, theremin, slice];
const GLYPH = {
  hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12m0-6.8V4.5a1.5 1.5 0 0 1 3 0V12m0-6a1.5 1.5 0 0 1 3 0v6m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.6 15a1.5 1.5 0 0 1 2.3-2L8 15"/>',
  point: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  pinch: '<path d="M6 17c-2-3-1.6-7.5 2-10l3 5"/><path d="M18 17c2-3 1.6-7.5-2-10l-3 5"/><circle cx="12" cy="12.5" r="1.4" fill="currentColor"/>',
  drag: '<path d="M12 3v18M7.5 7.5 12 3l4.5 4.5M7.5 16.5 12 21l4.5-4.5"/>',
  grab: '<rect x="5" y="8" width="11" height="8" rx="2"/><path d="M16 12h5M18.5 9.5 21 12l-2.5 2.5"/>',
  zoom: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><path d="M9 12h6M12 9v6"/>',
  keys: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>',
  cam: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/>',
};
const svg = (k, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[k]}</svg>`;
const mark = (cls) => `<svg class="${cls}" viewBox="0 0 262 151" aria-hidden="true"><path d="${MARK_PATH}" fill="currentColor"/></svg>`;

const app = document.getElementById("pg");
app.innerHTML = `
  <main class="pg-stage" id="stage"></main>
  <canvas class="pg-skel" id="skel"></canvas>
  <header class="pg-top">
    <a class="pg-back" href="/">← Portfólio</a>
    <div class="pg-brand">${mark("pg-mark")}<span>Playground</span></div>
    <button class="pg-cam" id="cam">${svg("cam", 16)}<span>Ativar câmera</span></button>
  </header>
  <nav class="pg-tabs" id="tabs" aria-label="Modos">${MODES.map((m, i) => `<button data-i="${i}"><i>${String(i + 1).padStart(2, "0")}</i>${m.name}</button>`).join("")}</nav>
  <div class="pg-hint" id="hint"></div>
  <aside class="pg-hud" id="hud" hidden><canvas width="200" height="150"></canvas><span class="mono" id="hudS">…</span></aside>
  <section class="pg-intro" id="intro">
    <div class="pg-intro-card">
      <p class="mono pg-kicker"><i></i> Laboratório de gestos</p>
      <h1>Controle tudo<br/>com as <em>mãos.</em></h1>
      <p class="pg-lead">A webcam lê 21 pontos de cada mão em tempo real, direto no navegador. Nenhuma imagem sai do seu computador.</p>
      <ol class="pg-steps">
        <li><span>${svg("hand", 26)}</span><b>Mostre a mão</b><small>Palma para a câmera, a 50–80 cm, com luz no rosto.</small></li>
        <li><span>${svg("point", 26)}</span><b>Aponte</b><small>O anel segue a base do indicador.</small></li>
        <li><span>${svg("pinch", 26)}</span><b>Pinça</b><small>Polegar + indicador: pegar, tocar, puxar.</small></li>
        <li><span>${svg("zoom", 26)}</span><b>Duas mãos</b><small>Em pinça: escala, feixes e acordes.</small></li>
      </ol>
      <div class="pg-intro-ctas">
        <button class="pg-go" id="go">${svg("cam", 18)} Ativar câmera e começar</button>
        <button class="pg-skip" id="skip">Usar mouse ou toque</button>
      </div>
      <p class="pg-err" id="err" hidden></p>
    </div>
  </section>`;

const $ = (id) => document.getElementById(id);
const stage = $("stage"), skel = $("skel"), sg = skel.getContext("2d"), hud = $("hud"), hc = hud.querySelector("canvas").getContext("2d");
const input = new Input(stage);
let cur = null, curI = -1, camOn = false, last = performance.now();

function mount(i) {
  if (i === curI) return;
  cur?.dispose(); stage.innerHTML = "";
  curI = i; cur = MODES[i].mount(stage, { input });
  $("tabs").querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
  $("hint").innerHTML = MODES[i].hint.map(([k, t]) => `<span>${svg(k, 16)}${t}</span>`).join("");
  stage.dataset.mode = MODES[i].id;
  stage.classList.remove("in"); void stage.offsetWidth; stage.classList.add("in");
  history.replaceState(null, "", "#" + MODES[i].id);
}
$("tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { A.unlock(); A.blip(1200, 0.05); mount(+b.dataset.i); } });
window.addEventListener("keydown", (e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") mount((curI + (e.key === "ArrowRight" ? 1 : MODES.length - 1)) % MODES.length); });

async function camera(on) {
  const btn = $("cam");
  if (!on) { input.stopCamera(); camOn = false; hud.hidden = true; btn.classList.remove("on"); btn.querySelector("span").textContent = "Ativar câmera"; return; }
  btn.classList.add("busy"); btn.querySelector("span").textContent = "Ligando…";
  hud.hidden = false;
  try {
    await input.startCamera((s, pct) => {
      const t = s === "model" ? `Baixando modelo · ${Math.round((pct || 0) * 100)}%` : { camera: "Pedindo acesso…", init: "Iniciando…", live: "Mostre a mão" }[s] || s;
      $("hudS").textContent = t;
      const go = $("go");
      if (go && !$("intro").classList.contains("out") && s !== "live") go.lastChild.textContent = " " + t;
    });
    camOn = true; btn.classList.add("on"); btn.querySelector("span").textContent = "Desligar câmera";
    return true;
  } catch (e) {
    hud.hidden = true;
    btn.querySelector("span").textContent = "Ativar câmera";
    throw e;
  } finally { btn.classList.remove("busy"); }
}
$("cam").onclick = () => { A.unlock(); camera(!camOn).catch((e) => toast(ERR[e.code] || ERR.model)); };
const closeIntro = () => { $("intro").classList.add("out"); setTimeout(() => $("intro").remove(), 600); };
$("go").onclick = async () => {
  A.unlock(); $("go").disabled = true; $("go").lastChild.textContent = " Ligando a câmera…";
  try { await camera(true); closeIntro(); }
  catch (e) { const el = $("err"); el.hidden = false; el.textContent = ERR[e.code] || ERR.model; $("go").disabled = false; $("go").lastChild.textContent = " Tentar de novo"; }
};
$("skip").onclick = () => { A.unlock(); closeIntro(); };
// pré-carga ao mirar nos botões de câmera
for (const id of ["go", "cam"]) { $(id).addEventListener("pointerenter", () => preloadHands().catch(() => {}), { once: true }); $(id).addEventListener("focus", () => preloadHands().catch(() => {}), { once: true }); }
function toast(t) { const el = document.createElement("div"); el.className = "pg-toast"; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 4200); }
window.addEventListener("pointerdown", () => A.unlock(), { once: true });

const resize = () => { const d = Math.min(2, devicePixelRatio); skel.width = innerWidth * d; skel.height = innerHeight * d; sg.setTransform(d, 0, 0, d, 0, 0); cur?.resize(); };
window.addEventListener("resize", resize);

// esqueleto das mãos por cima de tudo (mesmo mapeamento de região que move os cursores)
function drawSkel(hands) {
  const W = innerWidth, H = innerHeight, r = input.region;
  sg.clearRect(0, 0, W, H);
  if (!r) return;
  const mx = (x) => ((x - r.x0) / (r.x1 - r.x0)) * W, my = (y) => ((y - r.y0) / (r.y1 - r.y0)) * H;
  for (const h of hands) {
    if (!h.lm) continue;
    sg.lineWidth = 1.5; sg.strokeStyle = h.pinch ? "rgba(255,59,59,.55)" : "rgba(255,255,255,.28)";
    sg.beginPath();
    for (const [a, b] of CONNECTIONS) { sg.moveTo(mx(h.lm[a].x), my(h.lm[a].y)); sg.lineTo(mx(h.lm[b].x), my(h.lm[b].y)); }
    sg.stroke();
    // retícula na âncora de controle
    sg.beginPath(); sg.arc(h.x, h.y, h.pinch ? 12 : 20, 0, 7);
    sg.lineWidth = 2; sg.strokeStyle = h.pinch ? "#ff3b3b" : "rgba(255,255,255,.9)"; sg.stroke();
    if (h.pinch) { sg.fillStyle = "rgba(255,59,59,.3)"; sg.fill(); }
    sg.beginPath(); sg.arc(h.x, h.y, 2.5, 0, 7); sg.fillStyle = "#fff"; sg.fill();
  }
}
function drawHud(hands) {
  const v = input.video; if (!v || v.readyState < 2) return;
  const w = 200, h = 150;
  hc.save(); hc.translate(w, 0); hc.scale(-1, 1); hc.drawImage(v, 0, 0, w, h); hc.restore();
  hc.fillStyle = "rgba(6,6,7,.3)"; hc.fillRect(0, 0, w, h);
  for (const hd of hands) {
    if (!hd.lm) continue;
    hc.strokeStyle = hd.pinch ? "#ff3b3b" : "#fff"; hc.lineWidth = 1.5; hc.beginPath();
    for (const [a, b] of CONNECTIONS) { hc.moveTo(hd.lm[a].x * w, hd.lm[a].y * h); hc.lineTo(hd.lm[b].x * w, hd.lm[b].y * h); }
    hc.stroke();
  }
  const n = hands.filter((x) => x.src === "cam").length;
  $("hudS").textContent = n ? `${n} mão${n > 1 ? "s" : ""}${hands.some((x) => x.src === "cam" && x.pinch) ? " · pinça" : ""}` : "Procurando a mão…";
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const hands = input.frame(dt);
  cur?.frame(dt, hands);
  if (stage.dataset.mode !== "corpo") drawSkel(hands); else sg.clearRect(0, 0, innerWidth, innerHeight);
  if (camOn) drawHud(hands);
  document.documentElement.classList.toggle("pg-hands", hands.some((h) => h.src === "cam"));
  requestAnimationFrame(loop);
}

const start = Math.max(0, MODES.findIndex((m) => "#" + m.id === location.hash));
resize();
mount(start);
requestAnimationFrame(loop);
