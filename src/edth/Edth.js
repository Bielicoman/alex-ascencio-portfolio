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
  voice: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>',
};
const svg = (k, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const SEEN = "edth-seen";
const NAV_IDS = ["top", "filmes", "lab", "metodo", "arquivo", "sobre", "contato"];
const CAT_IDS = [...new Set(PROJECTS.map((p) => p.cat))];
const OPEN_KEYS = { instagram: SOCIAL.instagram, linkedin: SOCIAL.linkedin, whatsapp: SOCIAL.whatsapp, email: SOCIAL.email };

let instance = null;
export default function openEdth(opts = {}) {
  if (instance) { instance.show(true); return instance; }
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
        <button class="edth-vbtn" aria-label="Escolher a voz da EDTH" aria-expanded="false">${svg("voice")}</button>
        <button class="edth-min" aria-label="Minimizar">${svg("min")}</button>
        <button class="edth-x" aria-label="Fechar a EDTH">${svg("close")}</button>
      </header>
      <div class="edth-voices" hidden><p class="mono">Voz da EDTH</p><div class="edth-vlist"></div><small class="edth-vhint"></small></div>
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
  // voz feminina pt-BR: ranking por nome, masculinas fora; escolha manual fica salva
  // ordem = timbre mais jovem primeiro; "Maria" (Windows) e "Luciana" (Apple) soam maduras e ficam por último
  const FEM = ["francisca", "thalita", "google portugu", "brenda", "giovanna", "leticia", "yara", "manuela", "camila", "fernanda", "vitoria", "vitória", "leila", "raquel", "helena", "elza", "female", "feminin", "luciana", "maria"];
  const MALE = /(daniel|ant[oô]nio|felipe|ricardo|heitor|donato|fabio|f[aá]bio|humberto|julio|j[uú]lio|nicolau|valerio|val[eé]rio|male\b|masculin)/i;
  const VKEY = "edth-voice-v2"; // v2: descarta escolha antiga salva com timbre maduro
  let serverTTS = null; // voz neural do site: null = ainda não testada
  const vbox = root.querySelector(".edth-voices"), vlist = root.querySelector(".edth-vlist"), vhint = root.querySelector(".edth-vhint");
  let voice = null, voices = [];
  const ptVoices = () => speechSynthesis.getVoices().filter((v) => /^pt[-_](BR)/i.test(v.lang) || /portugu[eê]s.*brasil|brazil/i.test(v.name));
  const rank = (v) => { const n = v.name.toLowerCase(); if (MALE.test(n) && !/female/.test(n)) return 99; const i = FEM.findIndex((f) => n.includes(f)); return (i < 0 ? 50 : i) - (/natural|online|neural/i.test(n) ? 0.5 : 0); };
  const pickVoice = () => {
    voices = ptVoices().sort((a, b) => rank(a) - rank(b));
    let saved = null; try { saved = localStorage.getItem(VKEY); } catch {}
    voice = voices.find((v) => v.name === saved) || voices.find((v) => rank(v) < 50) || voices.find((v) => rank(v) < 99) || null;
    renderVoices();
  };
  const voicesReady = new Promise((res) => {
    if (!("speechSynthesis" in window)) { res(); return; }
    const done = () => { pickVoice(); if (voices.length) res(); };
    done(); speechSynthesis.onvoiceschanged = () => { done(); res(); };
    setTimeout(res, 1500); // alguns navegadores nunca disparam o evento
  });
  function renderVoices() {
    if (!vlist) return;
    vlist.innerHTML = "";
    voices.forEach((v) => {
      const b = document.createElement("button"); b.type = "button";
      b.textContent = v.name.replace(/Microsoft |Google |\(.*?\)| - Portuguese.*$/g, "").trim() || v.name;
      b.title = v.name; b.setAttribute("aria-pressed", String(voice === v));
      if (rank(v) === 99) b.classList.add("male");
      b.onclick = () => { voice = v; try { localStorage.setItem(VKEY, v.name); } catch {} renderVoices(); speak("Oi, eu sou a EDTH. Essa é a minha voz."); };
      vlist.appendChild(b);
    });
    const hasFem = voices.some((v) => rank(v) < 99);
    if (serverTTS) { vhint.textContent = "Usando a voz neural do site (a mesma em qualquer aparelho). As vozes abaixo só entram se ela ficar indisponível."; return; }
    vhint.textContent = !voices.length ? "Nenhuma voz em português instalada neste aparelho." : hasFem ? "Toque para ouvir e escolher." : "Não há voz feminina em português instalada. No Windows: Configurações → Hora e idioma → Fala → Adicionar vozes → Português (Brasil). No Edge, a voz Francisca (natural) já vem pronta.";
  }
  let convo = false, speaking = false, afterSpeak = null;
  // voz: 1º a voz neural do site (/api/tts, sempre igual e realista); sem ela, a voz do navegador
  let audio = null, speakId = 0;
  const ttsCache = new Map();
  const spoken = (t) => t.replace(/EDTH/g, "Édith").replace(/UNoB/g, "U-N-O-B").replace(/@/g, " arroba ");
  const neural = async (text) => {
    if (serverTTS === false) return null;
    if (ttsCache.has(text)) return ttsCache.get(text);
    try {
      const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!r.ok) { if (r.status === 501 || r.status === 404) serverTTS = false; return null; }
      const url = URL.createObjectURL(await r.blob());
      serverTTS = true; ttsCache.set(text, url); renderVoices();
      return url;
    } catch { return null; }
  };
  const stopSpeech = () => { speakId++; try { audio?.pause(); } catch {} if ("speechSynthesis" in window) speechSynthesis.cancel(); };
  const speak = async (text) => {
    if (!text) return;
    stopSpeech();
    const id = ++speakId, t = spoken(text);
    const begin = () => { speaking = true; setState("speaking"); sfx.musicHold?.(true, "edth"); };
    const end = () => { if (id !== speakId) return; speaking = false; sfx.musicHold?.(false, "edth"); if (root.dataset.state === "speaking") setState("idle"); afterSpeak?.(); afterSpeak = null; if (convo && !dead) listen(); };
    setState("thinking");
    const url = await neural(t);
    if (id !== speakId) return;
    if (url) {
      await new Promise((res) => {
        audio = new Audio(url); audio.volume = 1;
        audio.onplay = begin;
        audio.onended = audio.onerror = () => { end(); res(); };
        audio.play().catch(() => { end(); res(); });
      });
      return;
    }
    await voicesReady;
    if (!("speechSynthesis" in window) || id !== speakId) { end(); return; }
    await new Promise((res) => {
      const u = new SpeechSynthesisUtterance(t);
      // timbre jovem: tom e andamento um pouco acima do padrão; sem voz feminina, sobe mais (paliativo)
      u.lang = "pt-BR"; if (voice) u.voice = voice; u.rate = 1.07; u.pitch = voice && rank(voice) < 99 ? 1.18 : 1.4; u.volume = 1;
      begin();
      u.onend = u.onerror = () => { end(); res(); };
      speechSynthesis.speak(u);
    });
  };

  // ── voz: escuta ──
  let rec = null, empty = 0;
  // cada escuta é um objeto próprio; escuta interrompida de propósito (abort) não processa nem conta silêncio
  const abortRec = () => { if (rec) { rec.aborted = true; try { rec.abort(); } catch {} } };
  const listen = () => {
    if (!SR || dead || speaking) return;
    abortRec();
    const r = (rec = new SR()); r.lang = "pt-BR"; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    let got = "";
    r.onstart = () => { if (r.aborted) return; setState("listening"); live.hidden = false; live.textContent = "Ouvindo…"; sfx.musicHold?.(true, "edth"); };
    r.onresult = (e) => { let txt = ""; for (const x of e.results) txt += x[0].transcript; live.textContent = txt; got = txt; };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { convo = false; mic.setAttribute("aria-pressed", "false"); add("bot", "O microfone está bloqueado neste navegador. Libere no cadeado da barra de endereço, ou digite aqui embaixo."); }
    };
    r.onend = () => {
      if (r.aborted || r !== rec) return;
      live.hidden = true; sfx.musicHold?.(false, "edth");
      if (root.dataset.state === "listening") setState("idle");
      const text = got.trim(); got = "";
      if (text) { empty = 0; handle(text); }
      else if (convo && ++empty < 3) setTimeout(listen, 200);
      else { convo = false; mic.setAttribute("aria-pressed", "false"); }
    };
    try { r.start(); } catch {}
  };
  const stopListening = () => { convo = false; mic.setAttribute("aria-pressed", "false"); abortRec(); if (root.dataset.state === "listening") setState("idle"); live.hidden = true; };
  mic.onclick = () => {
    sfx.unlock?.();
    if (!SR) { add("bot", "Este navegador não reconhece voz (o Firefox, por exemplo). Pode digitar aqui que eu entendo."); input.focus(); return; }
    if (convo) { stopListening(); stopSpeech(); speaking = false; setState("idle"); return; }
    convo = true; empty = 0; mic.setAttribute("aria-pressed", "true"); stopSpeech(); speaking = false; listen();
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
      case "stop": stopSpeech(); speaking = false; app.stopTour?.(); lenis()?.scrollTo(lenis().scroll, { immediate: true, force: true }); break;
      case "sound": app.sound?.(!!a.on); break;
      case "scroll": { const L = lenis(); L?.scrollTo(L.targetScroll + innerHeight * 0.8 * (a.dir > 0 ? 1 : -1), { duration: 1, force: true }); break; }
      case "form":
        window.dispatchEvent(new CustomEvent("edth:form", { detail: a.patch }));
        if (a.patch?.msg && a.patch.msg.includes("\n")) add("bot", a.patch.msg).classList.add("brief"); // mostra o briefing organizado
        break;
      case "send": {
        const ev = new CustomEvent("edth:send", { detail: { via: a.via === "email" ? "email" : "whatsapp", href: null } });
        window.dispatchEvent(ev);
        if (ev.detail.href) {
          const w = window.open(ev.detail.href, "_blank");
          if (w) w.opener = null; else extra.links.push([a.via === "email" ? "Enviar por e-mail" : "Enviar no WhatsApp", ev.detail.href]);
        }
        break;
      }
      case "refine": { // IA reorganiza o briefing em segundo plano e atualiza o formulário
        fetch("/api/edth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "brief", raw: a.raw, kind: a.kind, when: a.when }) })
          .then((r) => (r.ok ? r.json() : null)).then((j) => { if (j?.brief && !dead) { window.dispatchEvent(new CustomEvent("edth:form", { detail: { msg: j.brief } })); add("bot", "Refinei o briefing com IA:\n" + j.brief).classList.add("brief"); } }).catch(() => {});
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
  const show = (listenNow) => {
    panel.hidden = false; fab.hidden = true; root.classList.add("open");
    if (listenNow && SR && !convo) { convo = true; empty = 0; mic.setAttribute("aria-pressed", "true"); listen(); }
    else setTimeout(() => input.focus({ preventScroll: true }), 300);
  };
  const minimize = () => { panel.hidden = true; fab.hidden = false; root.classList.remove("open"); stopListening(); };
  function close() {
    dead = true; stopListening(); stopSpeech(); sfx.musicHold?.(false, "edth");
    root.classList.add("out"); cursor.remove();
    setTimeout(() => root.remove(), 350);
    instance = null; onClose();
  }
  $(".edth-vbtn").onclick = () => { vbox.hidden = !vbox.hidden; $(".edth-vbtn").setAttribute("aria-expanded", String(!vbox.hidden)); if (!vbox.hidden) pickVoice(); };
  $(".edth-min").onclick = minimize; fab.onclick = () => show(true); $(".edth-x").onclick = close;
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden && document.activeElement && root.contains(document.activeElement)) minimize(); });

  // boas-vindas + mini tutorial (completo só na primeira vez)
  let first = true;
  try { first = !localStorage.getItem(SEEN); localStorage.setItem(SEEN, "1"); } catch {}
  const hello = first
    ? "Oi, eu sou a EDTH, assistente do site do Alex. Você controla tudo por voz: toque no microfone e fale, ou digite. Posso abrir qualquer vídeo pelo nome, levar você a qualquer seção, contar quem é o Alex, montar seu orçamento, baixar o currículo e abrir os jogos. Experimente um destes:"
    : "Oi de novo! Toque no microfone e me diga o que quer ver.";
  add("bot", hello, { chips: TUTORIAL });
  show();
  // microfone já ligado ao abrir: fala uma saudação curta e começa a ouvir (o texto completo fica no painel)
  if (SR) { convo = true; empty = 0; mic.setAttribute("aria-pressed", "true"); }
  speak(SR ? "Oi, eu sou a EDTH. Pode falar." : hello).then(() => { if (convo && !speaking && root.dataset.state !== "listening") listen(); }); // sem voz disponível: ouve direto
  return { show, close, minimize, ask: (t) => handle(t) };
}
