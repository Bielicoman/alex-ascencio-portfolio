import { HandTracker, drawHands, ERR } from "./hands";
import { startVoice, voiceSupported } from "./voice";
import { sfx } from "../components/Sound";
import "./gesture.css";

// Controle da página pelas mãos, voz e rosto (webcam + microfone). Princípios (Vision Pro / Ultraleap):
// ação só com gesto intencional; poses "seguradas" (0,7 s, anel de progresso) para comandos; uma
// "embreagem" explícita para pausar; nada dispara com a mão em repouso.
// Uma mão: aponta (cursor) · pinça rápida (clique) · pinça ou punho + arrasto (rola com inércia) ·
// pinça num objeto (pega e arremessa) · palma aberta deslizando ← → (próxima / anterior seção) ·
// V segurado (assistir o site) · joinha (contato) · chifre (som) · joinha para baixo (topo).
// Duas mãos: pinças = zoom na seção; duas palmas paradas = pausar/retomar.
// Voz: "ver demonstração", "ir para filmes", "descer", "parar"… Rosto: paralaxe pela cabeça, piscada longa = pausar.
const PID = 77; // pointerId sintético: os flutuantes checam o id entre down/move/up
const CLICK_MS = 380, CLICK_PX = 26;

const GLYPH = {
  hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12m0-6.8V4.5a1.5 1.5 0 0 1 3 0V12m0-6a1.5 1.5 0 0 1 3 0v6m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.6 15a1.5 1.5 0 0 1 2.3-2L8 15"/>',
  point: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  pinch: '<path d="M6 17c-2-3-1.6-7.5 2-10l3 5"/><path d="M18 17c2-3 1.6-7.5-2-10l-3 5"/><circle cx="12" cy="12.5" r="1.4" fill="currentColor"/>',
  drag: '<path d="M12 3v18M7.5 7.5 12 3l4.5 4.5M7.5 16.5 12 21l4.5-4.5"/>',
  grab: '<rect x="5" y="8" width="11" height="8" rx="2"/><path d="M16 12h5M18.5 9.5 21 12l-2.5 2.5"/>',
  zoom: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><path d="M9 12h6M12 9v6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  fist: '<path d="M7 11V9a2 2 0 0 1 4 0v1m0 0V8.5a2 2 0 0 1 4 0V10m0 0a2 2 0 0 1 4 0v4a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-3a2 2 0 0 1 2-2h3"/>',
  swipe: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
  victory: '<path d="M9 13 6.5 4.5a1.5 1.5 0 0 1 2.9-.8L12 11m0 0 1.6-7.3a1.5 1.5 0 0 1 2.9.6L15 12"/><path d="M8 13.5V17a5 5 0 0 0 10 0v-4a1.5 1.5 0 0 0-3 0"/>',
  thumb: '<path d="M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 3 2l-1 4h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7"/>',
  rock: '<path d="M8 12V5a1.5 1.5 0 0 1 3 0v7m5 0V5a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2h7a2 2 0 0 1 0 4h-2"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  face: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8.5 15a4.5 4.5 0 0 0 7 0"/>',
};
// comandos segurados (pose estável por HOLD s com anel de progresso)
const HOLD = 0.7;
const MORE = [
  ["fist", "Punho fechado + mover", "Agarra a página e rola; abra a mão em movimento para arremessar."],
  ["swipe", "Palma aberta deslizando ← →", "Movimento rápido: próxima / anterior seção."],
  ["victory", "V segurado", "Assistir o site (tour guiado)."],
  ["thumb", "Joinha segurado", "Vai para o contato. Para baixo: volta ao topo."],
  ["rock", "Chifre segurado", "Liga ou desliga o som."],
  ["pause", "Duas palmas paradas", "Pausa ou retoma os gestos (ou piscada longa, com o rosto ligado)."],
  ["mic", "Voz", "\u201cVer demonstração\u201d, \u201cir para filmes\u201d, \u201cdescer\u201d, \u201csubir\u201d, \u201cparar\u201d, \u201ccontato\u201d, \u201cdesligar\u201d."],
];
const STEPS = [
  ["hand", "Mostre a mão", "Palma para a câmera, a uns 50–80 cm."],
  ["point", "Aponte", "O anel segue a base do indicador. Varra a tela."],
  ["pinch", "Pinça rápida = clique", "Encoste polegar e indicador e solte."],
  ["drag", "Pinça e arraste = rolar", "Pinça no vazio e puxe a página. Solte em movimento para arremessar."],
  ["grab", "Pinça num objeto = pegar", "Os cards flutuantes da hero podem ser agarrados e jogados."],
  ["zoom", "Duas pinças = zoom", "Afaste as mãos para ampliar, aproxime para voltar."],
];

const svg = (k, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${GLYPH[k]}</svg>`;
const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export default function startGestures({ onEnd = () => {}, tutorial = true, actions = {} } = {}) {
  const lenis = window.__lenis;
  const root = h(`<div class="gx" role="region" aria-label="Controle por gestos">
    <div class="gx-ret" data-i="0"><i class="gx-hold"></i><i class="gx-ring"><b></b></i><span class="gx-lab mono"></span></div>
    <div class="gx-ret" data-i="1"><i class="gx-hold"></i><i class="gx-ring"><b></b></i><span class="gx-lab mono"></span></div>
    <div class="gx-flash mono" aria-live="polite"></div>
    <div class="gx-said" hidden><span class="mono">Voz</span><b></b></div>
    <div class="gx-hud">
      <div class="gx-cam"><canvas width="240" height="180"></canvas><span class="gx-load"><i></i></span></div>
      <div class="gx-hud-b">
        <span class="gx-status mono"><i class="gx-dot"></i><span>Ligando a câmera…</span></span>
        <span class="gx-mods">
          <button class="gx-mod gx-voice" aria-pressed="false" ${voiceSupported() ? "" : "hidden"}>${svg("mic", 14)}<span>Voz</span></button>
          <button class="gx-mod gx-face" aria-pressed="false">${svg("face", 14)}<span>Rosto</span></button>
        </span>
        <span class="gx-btns">
          <a class="gx-pg" href="/playground/">Playground ↗</a>
          <button class="gx-help" aria-label="Tutorial">?</button>
          <button class="gx-x" aria-label="Desligar controle por gestos">${svg("close", 14)}</button>
        </span>
      </div>
    </div>
    <div class="gx-tut" hidden>
      <div class="gx-tut-h"><span class="mono">Controle por gestos · tutorial</span><button class="gx-skip">Pular</button></div>
      <ol>${STEPS.map(([k, t, d], i) => `<li data-k="${k}"><span class="gx-g">${svg(k)}</span><span><b>${t}</b><small>${d}</small></span><i class="gx-ok">✓</i></li>`).join("")}</ol>
      <details class="gx-more"><summary class="mono">Gestos avançados e voz</summary>
        <ul>${MORE.map(([k, t, d]) => `<li><span class="gx-g">${svg(k, 18)}</span><span><b>${t}</b><small>${d}</small></span></li>`).join("")}</ul>
      </details>
      <p class="gx-tut-f mono">Esc desliga · o vídeo não sai do seu computador</p>
    </div>
  </div>`);
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const rets = [...root.querySelectorAll(".gx-ret")].map((el) => ({ el, lab: el.querySelector(".gx-lab"), x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, mx: -1, my: -1, on: false }));
  const cam = $(".gx-cam"), cv = $(".gx-cam canvas"), cx = cv.getContext("2d");
  const status = $(".gx-status span"), tut = $(".gx-tut");
  const say = (t) => { status.textContent = t; };

  // ── tutorial com verificação ao vivo ──
  const done = new Set();
  const stepEl = (k) => tut.querySelector(`li[data-k="${k}"]`);
  const focusNext = () => {
    tut.querySelectorAll("li").forEach((li) => li.classList.remove("on"));
    const next = STEPS.find(([k]) => !done.has(k));
    if (next) stepEl(next[0]).classList.add("on");
    else { tut.classList.add("is-done"); tut.querySelector(".gx-more").open = true; }
  };
  const mark = (k) => {
    if (done.has(k) || tut.hidden) return;
    done.add(k); stepEl(k).classList.add("ok"); sfx.chime?.();
    focusNext();
  };
  const openTut = () => { tut.hidden = false; tut.classList.remove("is-done"); focusNext(); };
  const closeTut = () => { tut.hidden = true; };
  $(".gx-skip").onclick = closeTut;
  $(".gx-help").onclick = () => (tut.hidden ? openTut() : closeTut());

  // ── estado de interação ──
  let dead = false, raf, last = performance.now(), hands = [], primaryKey = null, travel = 0, lastSeen = 0;
  const act = { mode: null, t0: 0, x0: 0, y0: 0, target: null, s0: 0, vy: 0, ly: 0, lt: 0 };
  const zoom = { on: false, el: null, d0: 1, s0: 1, s: 1 };
  const zoomed = new Map();
  let hoverEl = null, hoverCard = null;
  let paused = false, hold = { g: null, t0: 0, fired: false }, swipeAt = 0, clutch = 0, lastT = performance.now();
  const flashEl = $(".gx-flash");
  let flashT;
  const flash = (t, icon) => { flashEl.innerHTML = (icon ? svg(icon, 18) : "") + `<span>${t}</span>`; flashEl.classList.remove("on"); void flashEl.offsetWidth; flashEl.classList.add("on"); clearTimeout(flashT); flashT = setTimeout(() => flashEl.classList.remove("on"), 1600); };

  // ── navegação por seções (usa o teletransporte do site: âncora #id) ──
  const SECTIONS = ["top", "manifesto", "filmes", "lab", "metodo", "arquivo", "sobre", "contato"];
  const secTop = (id) => { const el = document.getElementById(id); if (!el) return 0; const sp = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el; return sp.getBoundingClientRect().top; };
  const current = () => { let i = 0; SECTIONS.forEach((id, k) => { if (secTop(id) <= innerHeight * 0.35) i = k; }); return i; };
  const goTo = (id) => {
    if (!document.getElementById(id)) return;
    if (document.querySelector("dialog[open]")) actions.closePlayer?.();
    const a = document.createElement("a"); a.href = "#" + id; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
  };
  const step = (d) => { const i = Math.max(0, Math.min(SECTIONS.length - 1, current() + d)); goTo(SECTIONS[i]); };
  const setPaused = (v) => {
    paused = v; root.classList.toggle("is-paused", v);
    if (act.mode) pinchEnd(act.x0, act.y0);
    flash(v ? "Gestos pausados" : "Gestos ativos", "pause"); sfx.tick?.(v ? 900 : 1800);
  };

  const host = () => document.querySelector("dialog[open]") || document.body;
  const pe = (type, x, y, extra = {}) => new PointerEvent(type, { clientX: x, clientY: y, pointerId: PID, pointerType: "mouse", isPrimary: true, button: 0, buttons: type === "pointerup" ? 0 : act.mode === "grab" || type === "pointerdown" ? 1 : 0, bubbles: true, cancelable: true, composed: true, ...extra });
  // sem esconder a camada para testar (isso forçava recálculo de estilo a cada quadro);
  // e os painéis (HUD/tutorial) só capturam a mão quando ela mira um botão deles
  const under = (x, y) => {
    const els = document.elementsFromPoint(x, y);
    if (els[0] && root.contains(els[0]) && els[0].closest("button, a")) return els[0];
    return els.find((e) => !root.contains(e)) || null;
  };
  let hx = -99, hy = -99;
  const scrollable = () => lenis && !document.querySelector("dialog[open]");

  const hover = (x, y) => {
    const el = under(x, y);
    if (el && el !== hoverEl) { el.dispatchEvent(pe("pointerover", x, y)); hoverEl = el; }
    const card = el?.closest(".card, .about-photo, .fcard") || null;
    if (card !== hoverCard) { hoverCard?.classList.remove("hover"); card?.classList.add("hover"); hoverCard = card; }
  };

  const fistStart = (x, y) => {
    act.t0 = performance.now(); act.frames = 0; act.x0 = x; act.y0 = y; act.target = null; act.ly = y; act.lt = act.t0; act.vy = 0;
    act.mode = "scroll"; act.fist = true; act.s0 = lenis ? lenis.scroll : scrollY;
    sfx.pickup?.(x);
  };
  const pinchStart = (hd, x, y) => {
    const el = under(x, y);
    act.t0 = performance.now(); act.frames = 0; act.x0 = x; act.y0 = y; act.target = el; act.ly = y; act.lt = act.t0; act.vy = 0;
    sfx.tick?.(2600, x, 0.03);
    if (el && el.closest("[data-float], [data-grab]")) {
      act.mode = "grab";
      el.dispatchEvent(pe("pointerdown", x, y));
    } else {
      act.mode = "press"; // vira "scroll" se mexer, "click" se soltar rápido
      act.s0 = lenis ? lenis.scroll : scrollY;
    }
  };
  const pinchMove = (x, y) => {
    const now = performance.now();
    act.frames++;
    if (act.mode === "grab") { window.dispatchEvent(pe("pointermove", x, y)); if (Math.hypot(x - act.x0, y - act.y0) > 60) mark("grab"); return; }
    if (act.mode === "press" && Math.hypot(x - act.x0, y - act.y0) > CLICK_PX) act.mode = "scroll";
    if (act.mode === "scroll" && scrollable()) {
      const dt = Math.max(8, now - act.lt) / 1000;
      act.vy = act.vy * 0.6 + ((act.ly - y) / dt) * 0.4; act.ly = y; act.lt = now;
      const to = act.s0 - (y - act.y0) * 1.7;
      lenis.scrollTo(to, { lerp: 0.3, force: true });
      if (Math.abs(y - act.y0) > 140) mark("drag");
    }
  };
  const pinchEnd = (x, y) => {
    // rápido = pouco tempo OU poucos quadros (máquina lenta entrega quadros espaçados)
    const quick = (performance.now() - act.t0 < CLICK_MS || act.frames <= 6) && Math.hypot(x - act.x0, y - act.y0) < CLICK_PX;
    if (act.mode === "grab") {
      act.target.dispatchEvent(pe("pointerup", x, y));
      if (quick) click(act.target);
    } else if (act.mode === "press" && quick) click(act.target);
    else if (act.mode === "scroll" && scrollable() && Math.abs(act.vy) > 280) {
      // arremesso: continua na direção do gesto (1,7× o ganho do arrasto)
      const v = Math.max(-5000, Math.min(5000, act.vy * 1.7));
      lenis.scrollTo(lenis.targetScroll + v * 0.42, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4), force: true });
      sfx.whoosh?.(0.4, v > 0, 0.05, x);
    }
    act.mode = null; act.target = null; act.fist = false;
  };
  const click = (el) => {
    if (!el) return;
    const t = el.closest("a, button, [role=button], label, summary, .card, .fcard, input, select") || el;
    t.dispatchEvent(pe("pointerdown", act.x0, act.y0)); t.dispatchEvent(pe("pointerup", act.x0, act.y0));
    t.click?.();
    t.focus?.({ preventScroll: true });
    mark("pinch");
  };

  // zoom na seção sob o ponto médio das duas mãos (CSS `scale`, independente do transform do GSAP)
  const zoomStart = (a, b) => {
    if (act.mode) { if (act.mode === "grab") act.target?.dispatchEvent(pe("pointerup", act.x0, act.y0)); act.mode = null; }
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const hit = under(mx, my);
    let el = hit?.closest("dialog[open] .player-box, footer");
    if (!el) for (let n = hit; n; n = n.parentElement) if (n.tagName === "SECTION") el = n; // a mais externa
    if (!el) return;
    const s = zoomed.get(el) || 1;
    if (s === 1) {
      el.style.scale = "1"; // mede sem escala
      const r = el.getBoundingClientRect();
      el.style.transformOrigin = `${mx - r.left}px ${my - r.top}px`;
      el.style.clipPath = "inset(0)";
      el.classList.add("gx-zoomed");
    }
    Object.assign(zoom, { on: true, el, d0: Math.max(40, Math.hypot(a.x - b.x, a.y - b.y)), s0: s, s });
  };
  const zoomMove = (a, b) => {
    if (!zoom.el) return;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    zoom.s = Math.min(2.6, Math.max(1, zoom.s0 * (d / zoom.d0)));
    zoom.el.style.scale = zoom.s.toFixed(3);
    zoomed.set(zoom.el, zoom.s);
    if (Math.abs(zoom.s - zoom.s0) > 0.15) mark("zoom");
  };
  const zoomEnd = () => {
    if (zoom.el && zoom.s < 1.06) resetZoom(zoom.el);
    zoom.on = false; zoom.el = null;
  };
  const resetZoom = (el) => {
    zoomed.delete(el);
    el.animate([{ scale: el.style.scale || 1 }, { scale: 1 }], { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" });
    el.style.scale = ""; el.style.clipPath = ""; el.style.transformOrigin = ""; el.classList.remove("gx-zoomed");
  };

  // ── quadro da câmera (≈30 Hz): decide gestos ──
  const onFrame = (hs, video) => {
    hands = hs;
    const now = performance.now();
    if (tracker.delegate) root.dataset.engine = `${tracker.delegate} ${Math.round(tracker.ms)}ms`;
    if (hs.length) { lastSeen = now; if (!done.has("hand")) mark("hand"); }
    // preview
    cx.save(); cx.translate(cv.width, 0); cx.scale(-1, 1); cx.drawImage(video, 0, 0, cv.width, cv.height); cx.restore();
    cx.fillStyle = "rgba(6,6,7,.35)"; cx.fillRect(0, 0, cv.width, cv.height);
    drawHands(cx, hs, cv.width, cv.height, false);
    if (head.on && head.face) {
      const P = head.face.pts, W2 = cv.width, H2 = cv.height;
      cx.fillStyle = "#ff3b3b";
      for (const k of [468, 473]) { cx.beginPath(); cx.arc((1 - P[k].x) * W2, P[k].y * H2, 2.6, 0, 7); cx.fill(); }
      cx.strokeStyle = "rgba(255,255,255,.6)"; cx.lineWidth = 1;
      for (const [a, b] of [[33, 133], [362, 263], [159, 145], [386, 374], [10, 152], [234, 454]]) { cx.beginPath(); cx.moveTo((1 - P[a].x) * W2, P[a].y * H2); cx.lineTo((1 - P[b].x) * W2, P[b].y * H2); cx.stroke(); }
    }

    const W = innerWidth, H = innerHeight;
    const pts = hs.filter((hd) => Number.isFinite(hd.x) && Number.isFinite(hd.y)).map((hd) => ({ hd, x: hd.x * W, y: hd.y * H }));
    rets.forEach((r, i) => { const p = pts[i]; r.on = !!p; if (p) { r.tx = p.x; r.ty = p.y; r.vx = (p.hd.vx || 0) * W; r.vy = (p.hd.vy || 0) * H; r.t = (p.hd.t || 0) * 1000; r.pinch = p.hd.pinch; } });

    const pinching = pts.filter((p) => p.hd.pinch);
    if (pinching.length === 2) {
      if (!zoom.on) zoomStart(pinching[0], pinching[1]);
      else zoomMove(pinching[0], pinching[1]);
      say(`Zoom ${zoom.s.toFixed(2)}×`);
      return;
    }
    if (zoom.on) zoomEnd();

    const dtf = Math.min(0.2, (now - lastT) / 1000); lastT = now;
    // embreagem: duas palmas abertas e paradas por 0,9 s
    const still = (q) => Math.hypot(q.hd.vx || 0, q.hd.vy || 0) < 0.3;
    if (pts.length === 2 && pts.every((q) => q.hd.gesture === "open" && still(q))) {
      clutch += dtf; rets.forEach((r) => (r.hold = Math.min(1, clutch / 0.9)));
      if (clutch >= 0.9 && clutch - dtf < 0.9) setPaused(!paused);
      say(`Duas palmas · ${paused ? "retomar" : "pausar"}`);
      return;
    }
    clutch = 0;
    if (paused) { rets.forEach((r) => (r.hold = 0)); say("Pausado · duas palmas para voltar"); return; }

    // mão principal: a que está em pinça; senão a mesma de antes; senão a mais à direita
    let p = pts.find((q) => q.hd.key === primaryKey && (act.mode || !pinching.length)) || pinching[0] || pts[pts.length - 1];
    if (!p) { if (act.mode) pinchEnd(act.x0, act.y0); hold.g = null; say(now - lastSeen > 1500 ? "Procurando a mão…" : "…"); return; }
    if (p.hd.key === primaryKey && act.lp) { travel += Math.hypot(p.x - act.lp.x, p.y - act.lp.y); if (travel > W * 0.8) mark("point"); }
    act.lp = { x: p.x, y: p.y };
    primaryKey = p.hd.key;
    const g = p.hd.gesture;

    // pinça: clique / pegar / rolar · punho: agarrar a página
    if (act.mode && act.fist) { if (g === "fist") pinchMove(p.x, p.y); else pinchEnd(p.x, p.y); }
    else if (p.hd.pinch && !act.mode) pinchStart(p.hd, p.x, p.y);
    else if (p.hd.pinch && act.mode) pinchMove(p.x, p.y);
    else if (!p.hd.pinch && act.mode) pinchEnd(p.x, p.y);
    else if (g === "fist" && !act.mode) fistStart(p.x, p.y);

    // deslizar a palma aberta: próxima / anterior seção
    const vx = p.hd.vx || 0, vy = p.hd.vy || 0;
    if (!act.mode && g === "open" && Math.abs(vx) > 2.4 && Math.abs(vx) > Math.abs(vy) * 2 && now - swipeAt > 1000) {
      swipeAt = now; const d = vx < 0 ? 1 : -1;
      step(d); flash(d > 0 ? "Próxima seção" : "Seção anterior", "swipe"); sfx.whoosh?.(0.5, d > 0, 0.08, p.x);
    }

    // poses seguradas: V (tour), joinha (contato), joinha para baixo (topo), chifre (som)
    const CMD = {
      victory: ["Assistir o site", "victory", () => actions.tour?.()],
      thumbs_up: ["Contato", "thumb", () => goTo("contato")],
      thumbs_down: ["Topo", "thumb", () => goTo("top")],
      rock: [null, "rock", () => { const on = !sfx.enabled; actions.sound ? actions.sound(on) : sfx.set(on); flash(on ? "Som ligado" : "Som desligado", "rock"); }],
    };
    const r0 = rets[pts.indexOf(p)];
    if (!act.mode && CMD[g] && still(p)) {
      if (hold.g !== g || hold.key !== p.hd.key) Object.assign(hold, { g, key: p.hd.key, t0: now, fired: false });
      const k = Math.min(1, (now - hold.t0) / 1000 / HOLD);
      rets.forEach((r) => (r.hold = r === r0 ? k : 0));
      if (k >= 1 && !hold.fired) { hold.fired = true; const [label, icon, run] = CMD[g]; if (label) flash(label, icon); sfx.chime?.(); run(); }
    } else { hold.g = null; rets.forEach((r) => (r.hold = 0)); }

    const NAMES = { open: "Mão aberta", fist: "Punho", point: "Apontando", victory: "V", thumbs_up: "Joinha", thumbs_down: "Joinha ↓", rock: "Chifre", pinch: "Pinça" };
    say(act.mode === "grab" ? "Segurando" : act.mode === "scroll" ? (act.fist ? "Agarrando a página" : "Rolando") : act.mode === "press" ? "Pinça" : hs.length === 2 ? "Duas mãos" : NAMES[g] || "Apontando");
  };

  // ── laço de exibição (taxa da tela): interpola retículas e emite o cursor ──
  const frame = (now) => {
    if (dead) return;
    raf = requestAnimationFrame(frame); // agendado antes: um quadro com erro não derruba o laço
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * 38);
    const hostEl = host();
    if (root.parentNode !== hostEl) hostEl.appendChild(root);
    rets.forEach((r, i) => {
      if (!r.on) { r.el.classList.remove("on"); return; }
      const jump = !r.el.classList.contains("on");
      // previsão: entre dois quadros da câmera o anel segue a velocidade da mão (compensa captura + inferência)
      const ahead = r.pinch ? 0 : Math.min(0.08, Math.max(0, (now - r.t) / 1000));
      const px = r.tx + (r.vx || 0) * ahead, py = r.ty + (r.vy || 0) * ahead;
      r.x = jump ? r.tx : r.x + (px - r.x) * k; r.y = jump ? r.ty : r.y + (py - r.y) * k;
      r.el.classList.add("on");
      r.el.classList.toggle("pinch", !!r.pinch);
      r.el.style.setProperty("--hold", (r.hold || 0).toFixed(3));
      r.el.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
      const isP = hands[i]?.key === primaryKey;
      r.lab.textContent = zoom.on ? `${zoom.s.toFixed(1)}×` : isP ? ({ grab: "pegar", scroll: "rolar", press: "" }[act.mode] ?? "") : "";
      if (isP && !zoom.on) {
        if ((!act.mode || act.mode === "press") && Math.abs(r.x - r.mx) + Math.abs(r.y - r.my) > 0.6) { r.mx = r.x; r.my = r.y; window.dispatchEvent(pe("pointermove", r.x, r.y, { buttons: 0 })); if (Math.abs(r.x - hx) + Math.abs(r.y - hy) > 6) { hx = r.x; hy = r.y; hover(r.x, r.y); } }
      }
    });
    if (head.on) {
      const kk = 1 - Math.exp(-dt * 6);
      head.x += (head.tx - head.x) * kk; head.y += (head.ty - head.y) * kk;
      par.forEach(([e, ax, ay]) => (e.style.translate = `${(-head.x * ax).toFixed(1)}px ${(-head.y * ay).toFixed(1)}px`));
    }
    // seção ampliada que saiu da tela volta ao normal
    for (const el of zoomed.keys()) { const b = el.getBoundingClientRect(); if (b.bottom < 0 || b.top > innerHeight) resetZoom(el); }
  };

  // ── voz ──
  let stopVoice = null;
  const said = $(".gx-said"), saidB = said.querySelector("b");
  let saidT;
  const heard = (t, fin, cmd) => {
    said.hidden = false; saidB.textContent = `\u201c${t.trim()}\u201d`; said.classList.toggle("hit", !!cmd); said.classList.toggle("final", !!fin);
    clearTimeout(saidT); saidT = setTimeout(() => (said.hidden = true), cmd ? 2200 : 3200);
  };
  const scrollBy = (f) => lenis?.scrollTo(lenis.targetScroll + innerHeight * f, { duration: 1.1, force: true });
  const COMMANDS = [
    { say: ["ver demonstracao", "ver a demonstracao", "ver demo", "assistir o site", "modo assistir", "iniciar demonstracao", "demonstracao", "fazer o tour", "tour"], run: () => actions.tour?.() },
    { say: ["parar", "pare", "para tudo", "parar demonstracao", "chega", "stop"], run: () => { actions.stopTour?.(); lenis?.scrollTo(lenis.scroll, { immediate: true, force: true }); flash("Parado", "pause"); } },
    { say: ["filmes", "ir para filmes", "ver filmes", "destaques"], run: () => goTo("filmes") },
    { say: ["lab", "laboratorio", "ir para o lab"], run: () => goTo("lab") },
    { say: ["metodo", "ir para o metodo", "timeline"], run: () => goTo("metodo") },
    { say: ["selecao", "trabalhos", "portfolio", "projetos"], run: () => goTo("arquivo") },
    { say: ["sobre", "sobre mim", "sobre voce", "quem e voce", "quem e o alex"], run: () => goTo("sobre") },
    { say: ["contato", "falar com voce", "vamos conversar", "orcamento", "quero contratar"], run: () => goTo("contato") },
    { say: ["inicio", "topo", "voltar ao inicio", "voltar ao topo", "comeco"], run: () => goTo("top") },
    { say: ["descer", "rolar para baixo", "para baixo", "pra baixo", "desce"], run: () => scrollBy(0.8) },
    { say: ["subir", "rolar para cima", "para cima", "pra cima", "sobe"], run: () => scrollBy(-0.8) },
    { say: ["proxima", "proxima secao", "avancar", "proximo"], run: () => step(1) },
    { say: ["anterior", "secao anterior", "voltar"], run: () => step(-1) },
    { say: ["ligar som", "ligar o som", "ligar musica", "com som"], run: () => (actions.sound ? actions.sound(true) : sfx.set(true)) },
    { say: ["desligar som", "desligar o som", "sem som", "mudo", "silencio"], run: () => (actions.sound ? actions.sound(false) : sfx.set(false)) },
    { say: ["pausar gestos", "pausar", "pausa"], run: () => setPaused(true) },
    { say: ["continuar", "retomar", "voltar gestos"], run: () => setPaused(false) },
    { say: ["curriculo", "abrir curriculo"], run: () => (location.href = "/curriculo/") },
    { say: ["playground", "abrir playground"], run: () => (location.href = "/playground/") },
    { say: ["tutorial", "ajuda", "como funciona"], run: () => openTut() },
    { say: ["desligar", "desligar camera", "sair", "encerrar"], run: () => stop() },
  ];
  const voiceBtn = $(".gx-voice");
  const toggleVoice = (on = !stopVoice) => {
    if (!on) { stopVoice?.(); stopVoice = null; voiceBtn.setAttribute("aria-pressed", "false"); return; }
    stopVoice = startVoice({
      commands: COMMANDS, onHeard: heard,
      onState: (st) => {
        voiceBtn.dataset.state = st;
        if (st === "on") voiceBtn.setAttribute("aria-pressed", "true");
        if (st === "denied") { flash("Microfone bloqueado no navegador", "mic"); stopVoice = null; voiceBtn.setAttribute("aria-pressed", "false"); }
      },
    });
  };
  voiceBtn.onclick = () => toggleVoice();

  // ── rosto: paralaxe pela posição da cabeça, piscada longa = pausar ──
  const faceBtn = $(".gx-face");
  const par = [[".hero-stage", 46, 26], [".hero-floats", 90, 44], [".hero-bottom", 28, 14]].map(([q, ax, ay]) => [document.querySelector(q), ax, ay]).filter(([e]) => e);
  const head = { x: 0, y: 0, tx: 0, ty: 0, on: false, closed: 0, face: null };
  const onFace = (f) => {
    head.face = f;
    if (!f) { head.tx = head.ty = 0; return; }
    const n = f.pts[1];
    head.tx = (1 - n.x - 0.5) * 2; head.ty = (n.y - 0.48) * 2; // -1…1
    const bl = ((f.bs.eyeBlinkLeft || 0) + (f.bs.eyeBlinkRight || 0)) / 2, t = performance.now();
    if (bl > 0.55) { if (!head.closed) head.closed = t; }
    else if (head.closed) { const d = (t - head.closed) / 1000; head.closed = 0; if (d > 0.45 && d < 1.8) setPaused(!paused); }
  };
  const toggleFace = async (on = !head.on) => {
    head.on = on; faceBtn.setAttribute("aria-pressed", String(on));
    if (!on) { tracker.disable("face"); par.forEach(([e]) => (e.style.translate = "")); return; }
    faceBtn.dataset.state = "loading";
    try { await tracker.enable("face"); faceBtn.dataset.state = "on"; flash("Rosto ligado · mexa a cabeça", "face"); }
    catch (e) { console.warn("[rosto]", e); head.on = false; faceBtn.setAttribute("aria-pressed", "false"); faceBtn.dataset.state = "error"; flash("Não consegui carregar o modelo do rosto", "face"); }
  };
  faceBtn.onclick = () => toggleFace();

  let fake = false;
  const tracker = new HandTracker({
    onFrame: (hs, v) => { if (!fake) onFrame(hs, v); },
    onStatus: (s, pct) => {
      root.dataset.phase = s;
      if (s === "camera") say("Pedindo acesso à câmera…");
      if (s === "model") say(`Baixando o modelo · ${Math.round((pct || 0) * 100)}%`);
      if (s === "init") say("Iniciando o rastreador…");
      if (s === "live") { say("Mostre a mão"); cam.classList.add("is-live"); sfx.chime?.(); if (tutorial) openTut(); }
    },
  });
  tracker.onAux = (task, data) => { if (task === "face") onFace(data); };
  tracker.start().then(() => {
    // voz liga sozinha se o microfone já foi autorizado antes (sem pedir permissão de surpresa)
    navigator.permissions?.query({ name: "microphone" }).then((p) => { if (p.state === "granted" && voiceSupported() && !dead) toggleVoice(true); }).catch(() => {});
  }).catch((e) => {
    console.warn("[gestos]", e);
    root.dataset.phase = "error";
    say(ERR[e.code] || ERR.model);
    root.classList.add("is-error");
  });
  raf = requestAnimationFrame(frame);
  if (import.meta.env.DEV) { window.__gxFeed = (hs) => { fake = true; onFrame(hs, tracker.video); }; window.__gxAct = act; window.__gxT = tracker; window.__gxHead = head; } // testes: injeta mãos sintéticas

  const onKey = (e) => { if (e.key === "Escape") stop(); };
  window.addEventListener("keydown", onKey);
  $(".gx-x").onclick = () => stop();

  function stop() {
    if (dead) return;
    dead = true;
    cancelAnimationFrame(raf);
    if (act.mode === "grab") act.target?.dispatchEvent(pe("pointerup", act.x0, act.y0));
    hoverCard?.classList.remove("hover");
    [...zoomed.keys()].forEach(resetZoom);
    tracker.stop();
    stopVoice?.();
    par.forEach(([e]) => (e.style.translate = ""));
    window.removeEventListener("keydown", onKey);
    root.classList.add("out");
    setTimeout(() => root.remove(), 380);
    onEnd();
  }
  return stop;
}
