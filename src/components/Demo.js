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
    document.querySelectorAll(".hover").forEach((el) => el.classList.remove("hover"));
    lenis.scrollTo(lenis.scroll, { immediate: true, force: true });
    root.classList.remove("demo");
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => window.removeEventListener(ev, onUser, true));
    window.removeEventListener("pointermove", onMove, true);
    onEnd();
  };
  // entrada real (isTrusted) interrompe; movimentos sintéticos do próprio tour não
  const onUser = (e) => { if (e.isTrusted) stop(); };
  const onMove = (e) => { if (e.isTrusted && Math.abs(e.movementX) + Math.abs(e.movementY) > 3) stop(); };

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
    // 5. seleção: preview dos 4 primeiros projetos
    await scrollTo(top(q("#arquivo .grid")) - innerHeight * 0.22, 3.4);
    const cards = [...document.querySelectorAll(".grid .card")].slice(0, 4);
    for (const card of cards) {
      await moveTo(card.querySelector(".card-media"), 0.9);
      card.classList.add("hover");
      signal("demo:card", { id: +card.dataset.id });
      await wait(3400);
      card.classList.remove("hover");
    }
    signal("demo:card", { id: null });
    // 6. sobre
    await scrollTo(top(q("#sobre")) - 40, 3.2);
    const photo = q(".about-photo");
    await moveTo(photo, 1);
    photo.classList.add("hover");
    await wait(2200);
    photo.classList.remove("hover");
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
  run().catch(() => {});
  return stop;
}
