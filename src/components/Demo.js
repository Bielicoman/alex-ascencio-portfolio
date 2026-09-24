import gsap from "gsap";

// Tour automático: rola o site em ritmo de apresentação, guia o cursor do site por eventos sintéticos
// (isTrusted = false) e para no contato. Qualquer entrada real do usuário devolve o controle.
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function runDemo({ onEnd }) {
  const lenis = window.__lenis;
  if (!lenis) { onEnd(); return () => {}; }
  const root = document.documentElement;
  const timers = [], tweens = [];
  const cur = { x: innerWidth * 0.5, y: innerHeight * 0.78 };
  let dead = false, last = null;

  const q = (s) => document.querySelector(s);
  const emit = () => {
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: cur.x, clientY: cur.y, pointerType: "mouse", bubbles: true }));
    const t = document.elementFromPoint(cur.x, cur.y);
    if (t && t !== last) { t.dispatchEvent(new PointerEvent("pointerover", { clientX: cur.x, clientY: cur.y, pointerType: "mouse", bubbles: true })); last = t; }
  };
  const alive = () => { if (dead) throw new Error("demo-stop"); };
  const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms))).then(alive);
  const center = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const moveTo = (target, dur = 1.1) => {
    const [x, y] = Array.isArray(target) ? target : center(target);
    return new Promise((r) => tweens.push(gsap.to(cur, { x, y, duration: dur, ease: "power3.inOut", onUpdate: emit, onComplete: r }))).then(alive);
  };
  const click = async () => { // pressiona o cursor (estado "down") por 160 ms
    window.dispatchEvent(new PointerEvent("pointerdown", { clientX: cur.x, clientY: cur.y, pointerType: "mouse" }));
    await wait(160);
    window.dispatchEvent(new PointerEvent("pointerup", { clientX: cur.x, clientY: cur.y, pointerType: "mouse" }));
  };
  const top = (el) => el.getBoundingClientRect().top + lenis.scroll;
  const endOf = (sel) => { const el = q(sel); return top(el) + el.offsetHeight - innerHeight; };
  const scrollTo = (y, dur) => new Promise((r) => {
    lenis.scrollTo(y, { duration: dur, easing: ease, force: true, lock: false, onComplete: r });
    const tick = () => { if (!dead && lenis.isScrolling) { emit(); timers.push(setTimeout(tick, 120)); } };
    timers.push(setTimeout(tick, 120));
  }).then(alive);
  const signal = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

  const stop = () => {
    if (dead) return;
    dead = true;
    timers.forEach(clearTimeout); tweens.forEach((t) => t.kill());
    signal("demo:np", { on: false });
    signal("demo:card", { id: null });
    signal("demo:close");
    document.querySelectorAll(".hover").forEach((el) => el.classList.remove("hover"));
    lenis.scrollTo(lenis.scroll, { immediate: true, force: true });
    root.classList.remove("demo");
    finger.remove();
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => window.removeEventListener(ev, onUser, true));
    window.removeEventListener("pointermove", onMove, true);
    onEnd();
  };
  // entrada real (isTrusted) interrompe; movimentos sintéticos do próprio tour não
  const onUser = (e) => { if (e.isTrusted) stop(); };
  const onMove = (e) => { if (e.isTrusted && Math.abs(e.movementX) + Math.abs(e.movementY) > 3) stop(); };

  // celular: dedo virtual (toque com onda), carrossel deslizado, previews dos 4 primeiros, fim no contato
  const finger = document.createElement("div");
  finger.className = "demo-finger"; finger.setAttribute("aria-hidden", "true");
  const tap = async (el, hold = 0) => {
    const [x, y] = center(el);
    await new Promise((r) => tweens.push(gsap.to(finger, { x, y, opacity: 1, duration: 0.7, ease: "power3.inOut", onComplete: r }))).then(alive);
    finger.classList.remove("tap"); void finger.offsetWidth; finger.classList.add("tap");
    if (hold) await wait(hold);
  };
  const runMobile = async () => {
    root.classList.add("demo");
    document.body.appendChild(finger);
    gsap.set(finger, { x: innerWidth / 2, y: innerHeight * 0.7, opacity: 0 });
    await tap(q(".np"), 900);
    await scrollTo(endOf("#manifesto"), 4.5);
    await scrollTo(top(q("#filmes .featured-track")) - innerHeight * 0.3, 2.2);
    const track = q(".featured-track"), cards = [...track.querySelectorAll(".fcard")].slice(0, 4);
    for (const c of cards.slice(1)) {
      const to = c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2;
      await new Promise((r) => tweens.push(gsap.to(track, { scrollLeft: to, duration: 0.9, ease: "power3.inOut", onComplete: r }))).then(alive);
      await wait(700);
    }
    gsap.to(track, { scrollLeft: 0, duration: 0.8, ease: "power3.inOut" });
    await scrollTo(top(q("#lab")) + innerHeight * 0.2, 2.6);
    await scrollTo(top(q("#metodo")), 2.2);
    await scrollTo(endOf("#metodo"), 7);
    const first = q(".grid .card");
    await scrollTo(top(first) - innerHeight * 0.25, 2.4);
    first.classList.add("hover");
    signal("demo:card", { id: +first.dataset.id });
    await tap(first.querySelector(".card-media"), 1200);
    signal("demo:open", { id: +first.dataset.id });
    await wait(5000);
    signal("demo:close");
    first.classList.remove("hover");
    signal("demo:card", { id: null });
    await wait(600);
    await scrollTo(top(q("#sobre")) - 40, 2.6);
    await wait(2600);
    await scrollTo(top(q("#contato")) + 20, 3.2);
    await wait(1000);
    stop();
  };

  const run = async () => {
    root.classList.add("demo");
    emit();
    // 1. hero: último lançamento em preview
    await moveTo(q(".np-media"), 1.3);
    signal("demo:np", { on: true });
    await wait(3600);
    signal("demo:np", { on: false });
    await moveTo([innerWidth * 0.62, innerHeight * 0.55], 0.9);
    // 2. manifesto e filmes (seções fixadas: rola até o fim do espaçador)
    await scrollTo(endOf("#manifesto"), 5.5);
    await moveTo([innerWidth * 0.55, innerHeight * 0.6], 0.8);
    await scrollTo(endOf("#filmes"), 6.5);
    // 3. lab: a lente responde ao cursor
    await scrollTo(top(q("#lab")) + innerHeight * 0.1, 3);
    await moveTo([innerWidth * 0.3, innerHeight * 0.4], 1.2);
    await moveTo([innerWidth * 0.7, innerHeight * 0.5], 1.6);
    // 4. método: a timeline inteira
    await scrollTo(top(q("#metodo")), 2.6);
    await moveTo([innerWidth * 0.66, innerHeight * 0.45], 0.8);
    await scrollTo(endOf("#metodo"), 8);
    // 5. seleção: o 1º vídeo é aberto no player (assiste ~5 s e fecha); os demais só recebem o hover
    await scrollTo(top(q("#arquivo .grid")) - innerHeight * 0.22, 3.4);
    const cards = [...document.querySelectorAll(".grid .card")].slice(0, 4);
    await moveTo(cards[0].querySelector(".card-media"), 0.9);
    cards[0].classList.add("hover");
    signal("demo:card", { id: +cards[0].dataset.id });
    await wait(1600);
    await click();
    signal("demo:open", { id: +cards[0].dataset.id });
    await wait(5400);
    signal("demo:close");
    cards[0].classList.remove("hover");
    signal("demo:card", { id: null });
    await wait(700);
    for (const card of cards.slice(1)) {
      await moveTo(card.querySelector(".card-media"), 0.75);
      card.classList.add("hover");
      await wait(850);
      card.classList.remove("hover");
    }
    // 6. sobre: a apresentação inteira (seção fixada)
    const sp = q("#sobre").parentElement.classList.contains("pin-spacer") ? q("#sobre").parentElement : q("#sobre");
    await scrollTo(top(sp) - 40, 3);
    await moveTo([innerWidth * 0.28, innerHeight * 0.5], 0.8);
    await scrollTo(top(sp) + sp.offsetHeight - innerHeight, 7);
    // 7. contato: fim do tour
    await scrollTo(top(q("#contato")) + 20, 3.6);
    await moveTo(q(".mark3d canvas"), 1.2);
    await wait(1200);
    stop();
  };

  // o clique que iniciou o tour não pode encerrá-lo
  timers.push(setTimeout(() => {
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => window.addEventListener(ev, onUser, { capture: true, passive: true }));
    window.addEventListener("pointermove", onMove, { capture: true, passive: true });
  }, 250));
  lenis.scrollTo(0, { immediate: true, force: true });
  (matchMedia("(pointer: coarse), (max-width: 760px)").matches ? runMobile : run)().catch(() => {});
  return stop;
}
