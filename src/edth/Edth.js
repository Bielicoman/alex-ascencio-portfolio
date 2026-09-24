import gsap from "gsap";
import { createBrain, TUTORIAL } from "./brain";
import { PROJECTS } from "../projects";
import { SOCIAL, PDF } from "../profile";
import { sfx } from "../components/Sound";
import "./edth.css";

// EDTH: assistente do site por voz e texto. Escuta (Web Speech API), responde com voz feminina
// (speechSynthesis pt-BR) e age no site: navega, abre vídeos levando um cursor até o card, filtra,
// monta orçamento, abre redes, baixa o currículo e abre os jogos. Perguntas livres → /api/edth (Groq).
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const ICON = {
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  send: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  min: '<path d="M6 12h12"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  link: '<path d="M7 17 17 7M8 7h9v9"/>',
};
const svg = (k, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const SEEN = "edth-seen";
const NAV_IDS = ["top", "filmes", "lab", "metodo", "arquivo", "sobre", "contato"];
const CAT_IDS = [...new Set(PROJECTS.map((p) => p.cat))];
const OPEN_KEYS = { instagram: SOCIAL.instagram, linkedin: SOCIAL.linkedin, whatsapp: SOCIAL.whatsapp, email: SOCIAL.email };

let instance = null;
export default function openEdth(opts = {}) {
  if (instance) { instance.show(); return instance; }
  instance = create(opts);
  return instance;
}

function create({ actions: app = {}, onClose = () => {} }) {
  const brain = createBrain();
  const history = [];
  const root = document.createElement("div");
  root.className = "edth";
  root.innerHTML = `
    <section class="edth-panel" role="dialog" aria-label="EDTH, assistente do site">
      <header class="edth-head">
        <span class="edth-orb" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
        <span class="edth-id"><b>EDTH</b><small class="mono">Assistente do Alex · voz e texto</small></span>
        <button class="edth-min" aria-label="Minimizar">${svg("min")}</button>
        <button class="edth-x" aria-label="Fechar a EDTH">${svg("close")}</button>
      </header>
      <div class="edth-log" aria-live="polite"></div>
      <p class="edth-live mono" hidden></p>
      <form class="edth-bar">
        <button type="button" class="edth-mic" aria-pressed="false" aria-label="Falar com a EDTH">${svg("mic", 20)}<span class="edth-mic-rings"><i></i><i></i></span></button>
        <input class="edth-in" placeholder="${SR ? "Toque no microfone ou digite…" : "Digite sua pergunta…"}" aria-label="Mensagem para a EDTH" maxlength="500" autocomplete="off" />
        <button class="edth-send" aria-label="Enviar">${svg("send")}</button>
      </form>
    </section>
    <button class="edth-fab" hidden aria-label="Abrir a EDTH"><span class="edth-orb sm"><i></i><i></i><i></i><b></b></span><span>EDTH</span></button>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const log = $(".edth-log"), live = $(".edth-live"), input = $(".edth-in"), mic = $(".edth-mic"), panel = $(".edth-panel"), fab = $(".edth-fab");
  const setState = (s) => { root.dataset.state = s; }; // idle | listening | thinking | speaking
  setState("idle");

  // ── mensagens ──
  const add = (who, text, extra = {}) => {
    const el = document.createElement("div");
    el.className = `edth-msg ${who}`;
    if (text) el.innerHTML = `<p>${esc(text)}</p>`;
    if (extra.links?.length) el.insertAdjacentHTML("beforeend", `<div class="edth-links">${extra.links.map(([l, h]) => `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(l)} ${svg("link", 14)}</a>`).join("")}</div>`);
    if (extra.chips?.length) {
      const c = document.createElement("div"); c.className = "edth-chips";
      extra.chips.forEach((t) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; b.onclick = () => handle(t); c.appendChild(b); });
      el.appendChild(c);
    }
    log.appendChild(el);
    log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
    return el;
  };

  // ── voz: fala (feminina pt-BR) ──
  let voice = null;
  const pickVoice = () => {
    const vs = speechSynthesis.getVoices().filter((v) => /^pt[-_]BR/i.test(v.lang) || /portugu[eê]s.*brasil/i.test(v.name));
    const fem = /(francisca|luciana|maria|thalita|leila|vit[oó]ria|camila|fernanda|helena|female|feminin|google portugu)/i;
    voice = vs.find((v) => fem.test(v.name)) || vs.find((v) => !/(antonio|daniel|male|masculin)/i.test(v.name)) || vs[0] || null;
  };
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  let convo = false, speaking = false, afterSpeak = null;
  const speak = (text) => new Promise((res) => {
    if (!text || !("speechSynthesis" in window)) { res(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/EDTH/g, "Édith").replace(/UNoB/g, "U-N-O-B").replace(/@/g, " arroba "));
    u.lang = "pt-BR"; if (voice) u.voice = voice; u.rate = 1.04; u.pitch = 1.08; u.volume = 1;
    speaking = true; setState("speaking"); sfx.musicHold?.(true);
    u.onend = u.onerror = () => { speaking = false; sfx.musicHold?.(false); if (root.dataset.state === "speaking") setState("idle"); res(); afterSpeak?.(); afterSpeak = null; if (convo && !dead) listen(); };
    speechSynthesis.speak(u);
  });

  // ── voz: escuta ──
  let rec = null, empty = 0;
  const listen = () => {
    if (!SR || dead || speaking) return;
    try { rec?.abort(); } catch {}
    rec = new SR(); rec.lang = "pt-BR"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    let got = "";
    rec.onstart = () => { setState("listening"); live.hidden = false; live.textContent = "Ouvindo…"; sfx.musicHold?.(true); };
    rec.onresult = (e) => {
      let txt = ""; for (const r of e.results) txt += r[0].transcript;
      live.textContent = txt; got = txt;
      if (e.results[e.results.length - 1].isFinal) got = txt;
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { convo = false; mic.setAttribute("aria-pressed", "false"); add("bot", "O microfone está bloqueado neste navegador. Libere no cadeado da barra de endereço, ou digite aqui embaixo."); }
    };
    rec.onend = () => {
      live.hidden = true; sfx.musicHold?.(false);
      if (root.dataset.state === "listening") setState("idle");
      if (got.trim()) { empty = 0; handle(got.trim()); }
      else if (convo && ++empty < 2) setTimeout(listen, 200);
      else { convo = false; mic.setAttribute("aria-pressed", "false"); }
    };
    try { rec.start(); } catch {}
  };
  const stopListening = () => { convo = false; mic.setAttribute("aria-pressed", "false"); try { rec?.abort(); } catch {} };
  mic.onclick = () => {
    sfx.unlock?.();
    if (!SR) { add("bot", "Este navegador não reconhece voz (o Firefox, por exemplo). Pode digitar aqui que eu entendo."); input.focus(); return; }
    if (convo) { stopListening(); speechSynthesis.cancel(); setState("idle"); return; }
    convo = true; empty = 0; mic.setAttribute("aria-pressed", "true"); speechSynthesis.cancel(); speaking = false; listen();
  };
  $(".edth-bar").onsubmit = (e) => { e.preventDefault(); const t = input.value.trim(); if (t) { input.value = ""; handle(t); } };

  // ── cursor virtual: vai até o alvo e "clica" ──
  const cursor = document.createElement("div");
  cursor.className = "edth-cursor"; cursor.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 3l16 7-7 2-2 7z" fill="#fff" stroke="#0a0a0b" stroke-width="1.2" stroke-linejoin="round"/></svg><i></i>';
  document.body.appendChild(cursor);
  const point = async (el) => {
    const from = panel.getBoundingClientRect(), r = el.getBoundingClientRect();
    gsap.set(cursor, { x: from.left + 20, y: from.top + 20, opacity: 1 });
    await gsap.to(cursor, { x: r.left + r.width / 2, y: r.top + r.height / 2, duration: 1.05, ease: "power3.inOut" });
    cursor.classList.remove("click"); void cursor.offsetWidth; cursor.classList.add("click");
    sfx.thock?.(r.left + r.width / 2);
    await new Promise((res) => setTimeout(res, 380));
    gsap.to(cursor, { opacity: 0, duration: 0.4, delay: 0.3 });
  };
  const lenis = () => window.__lenis;
  const scrollToEl = (el, off = -innerHeight / 3, dur = 1.3) => new Promise((res) => {
    const L = lenis();
    if (!L) { el.scrollIntoView({ block: "center" }); setTimeout(res, 400); return; }
    L.scrollTo(el, { offset: off, duration: dur, force: true, onComplete: res });
    setTimeout(res, dur * 1000 + 300);
  });
  const nav = (id) => { if (!NAV_IDS.includes(id)) return; const a = document.createElement("a"); a.href = "#" + id; a.style.display = "none"; document.body.appendChild(a); a.click(); a.remove(); };
  const resetArchive = () => {
    const s = document.querySelector("#arquivo input[type=search]");
    if (s && s.value) { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(s, ""); s.dispatchEvent(new Event("input", { bubbles: true })); }
    const all = [...document.querySelectorAll("#arquivo .filters button")].find((b) => /^Todos/.test(b.textContent));
    if (all && all.getAttribute("aria-pressed") !== "true") all.click();
  };

  // ── executor de ações (tudo validado: nada fora da lista roda) ──
  async function exec(a, extra) {
    switch (a.type) {
      case "nav": nav(a.id); break;
      case "play": {
        const p = PROJECTS.find((x) => x.id === +a.id); if (!p) break;
        stopListening();
        resetArchive();
        await new Promise((r) => setTimeout(r, 120));
        const card = document.querySelector(`#arquivo .card[data-id="${p.id}"]`);
        if (card) { await scrollToEl(card); await point(card.querySelector(".card-media") || card); }
        window.dispatchEvent(new CustomEvent("demo:open", { detail: { id: p.id } }));
        break;
      }
      case "filter": {
        if (!CAT_IDS.includes(a.cat)) break;
        resetArchive();
        const grid = document.querySelector("#arquivo .filters");
        if (grid) await scrollToEl(grid, -140);
        const b = [...document.querySelectorAll("#arquivo .filters button")].find((x) => x.textContent.startsWith(a.cat));
        if (b) { await point(b); b.click(); }
        break;
      }
      case "open": {
        const href = OPEN_KEYS[a.href] || Object.values(OPEN_KEYS).find((h) => h === a.href);
        if (!href) break;
        const w = window.open(href, "_blank");
        if (w) w.opener = null; else extra.links.push([`Abrir ${a.label || "link"}`, href]); // bloqueado sem clique: vira botão
        break;
      }
      case "download": {
        const l = document.createElement("a"); l.href = PDF; l.download = ""; document.body.appendChild(l); l.click(); l.remove();
        extra.links.push(["Baixar o currículo (PDF)", PDF]);
        break;
      }
      case "go": {
        const ok = /^\/(curriculo\/|playground\/(#[a-z]+)?)$/.test(a.href);
        if (ok) { const go = () => (location.href = a.href); if (speaking) afterSpeak = go; else setTimeout(go, 900); }
        break;
      }
      case "tour": stopListening(); app.tour?.(); break;
      case "stop": speechSynthesis.cancel(); app.stopTour?.(); lenis()?.scrollTo(lenis().scroll, { immediate: true, force: true }); break;
      case "sound": app.sound?.(!!a.on); break;
      case "scroll": { const L = lenis(); L?.scrollTo(L.targetScroll + innerHeight * 0.8 * (a.dir > 0 ? 1 : -1), { duration: 1, force: true }); break; }
      case "form": window.dispatchEvent(new CustomEvent("edth:form", { detail: a.patch })); break;
      case "send": {
        const ev = new CustomEvent("edth:send", { detail: { via: a.via === "email" ? "email" : "whatsapp", href: null } });
        window.dispatchEvent(ev);
        if (ev.detail.href) {
          const w = window.open(ev.detail.href, "_blank");
          if (w) w.opener = null; else extra.links.push([a.via === "email" ? "Enviar por e-mail" : "Enviar no WhatsApp", ev.detail.href]);
        }
        break;
      }
      case "budget": return handle("quero fazer um orçamento", true);
      case "close": setTimeout(close, 1200); break;
    }
  }

  // ── IA (Groq) para o que o motor local não resolve ──
  async function askAI(text) {
    try {
      const r = await fetch("/api/edth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, history: history.slice(-8) }) });
      if (!r.ok) return null;
      const j = await r.json();
      return j.say ? { say: j.say, actions: (j.actions || []).map((a) => (a.type === "download" ? { type: "download" } : a)) } : null;
    } catch { return null; }
  }

  let busy = false;
  async function handle(text, silentUser = false) {
    if (dead) return;
    if (!silentUser) add("user", text);
    history.push({ role: "user", content: text });
    let r = brain.reply(text);
    if (!r) {
      setState("thinking");
      const typing = add("bot", ""); typing.classList.add("typing"); typing.innerHTML = "<p><i></i><i></i><i></i></p>";
      busy = true; r = await askAI(text); busy = false;
      typing.remove();
      if (!r) r = { say: "Essa eu ainda não sei responder. Posso te mostrar os trabalhos, contar quem é o Alex ou montar um orçamento.", actions: [], chips: ["Quem é o Alex?", "Quais trabalhos ele fez?", "Quero fazer um orçamento"] };
      if (root.dataset.state === "thinking") setState("idle");
    }
    const extra = { links: [...(r.links || [])] };
    const msg = r.say ? add("bot", r.say, { chips: r.chips }) : null;
    history.push({ role: "assistant", content: r.say || "(ação)" });
    const speech = speak(r.say);
    for (const a of r.actions || []) await exec(a, extra);
    if (extra.links.length) { const l = add("bot", "", { links: extra.links }); if (msg) msg.after(l); }
    await speech;
  }

  // ── abrir / minimizar / fechar ──
  let dead = false;
  const show = () => { panel.hidden = false; fab.hidden = true; root.classList.add("open"); setTimeout(() => input.focus({ preventScroll: true }), 300); };
  const minimize = () => { panel.hidden = true; fab.hidden = false; root.classList.remove("open"); stopListening(); };
  function close() {
    dead = true; stopListening(); speechSynthesis.cancel(); sfx.musicHold?.(false);
    root.classList.add("out"); cursor.remove();
    setTimeout(() => root.remove(), 350);
    instance = null; onClose();
  }
  $(".edth-min").onclick = minimize; fab.onclick = show; $(".edth-x").onclick = close;
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden && document.activeElement && root.contains(document.activeElement)) minimize(); });

  // boas-vindas + mini tutorial (completo só na primeira vez)
  let first = true;
  try { first = !localStorage.getItem(SEEN); localStorage.setItem(SEEN, "1"); } catch {}
  const hello = first
    ? "Oi, eu sou a EDTH, assistente do site do Alex. Você controla tudo por voz: toque no microfone e fale, ou digite. Posso abrir qualquer vídeo pelo nome, levar você a qualquer seção, contar quem é o Alex, montar seu orçamento, baixar o currículo e abrir os jogos. Experimente um destes:"
    : "Oi de novo! Toque no microfone e me diga o que quer ver.";
  add("bot", hello, { chips: TUTORIAL });
  show();
  speak(hello);
  return { show, close, minimize, ask: (t) => handle(t) };
}
