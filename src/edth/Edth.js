import gsap from "gsap";
import { createBrain, TUTORIAL, norm } from "./brain";
import { PROJECTS } from "../projects";
import { SOCIAL, PDF } from "../profile";
import { sfx } from "../components/Sound";
import "./edth.css";

// EDITH (fala-se "Edíte"): assistente do site por voz e texto, numa barra compacta no canto.
// Microfone contínuo até o usuário pedir para desligar. Com vídeo aberto ou barra recolhida, só reage
// quando ouve "Edith" (palavra de ativação). Responde com voz neural jovem (/api/tts) ou a do navegador,
// age no site (vídeos, seções, tour, orçamento, recado por e-mail, jogos) e conversa livre via /api/edth (Groq).
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const ICON = {
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  send: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  min: '<path d="M6 12h12"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  link: '<path d="M7 17 17 7M8 7h9v9"/>',
  voice: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  kbd: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>',
};
const svg = (k, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const SEEN = "edth-seen";
const NAV_IDS = ["top", "filmes", "lab", "metodo", "arquivo", "sobre", "contato"];
const CAT_IDS = [...new Set(PROJECTS.map((p) => p.cat))];
const OPEN_KEYS = { instagram: SOCIAL.instagram, linkedin: SOCIAL.linkedin, whatsapp: SOCIAL.whatsapp, email: SOCIAL.email };
const MAIL_TO = SOCIAL.email.replace(/^mailto:/, "");
// "Edith" como o reconhecedor costuma escrever: edith, edite, édite, edit, editi, e dite, edy…
const WAKE = / (e ?dit[hie]?|e ?dite|edich|edji|edjit[ei]?|editch|edyth|hedit[he]?) /;
const videoOpen = () => !!document.querySelector("dialog.player[open]");

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
    <section class="edth-panel" role="dialog" aria-label="EDITH, assistente do site">
      <div class="edth-more" hidden>
        <div class="edth-more-head"><span class="mono">Conversa</span><button class="edth-vbtn" aria-label="Escolher a voz da EDITH" aria-expanded="false">${svg("voice", 16)}</button></div>
        <div class="edth-voices" hidden><p class="mono">Voz da EDITH</p><div class="edth-vlist"></div><small class="edth-vhint"></small></div>
        <div class="edth-cmds" aria-label="Comandos"></div>
        <div class="edth-log" aria-live="polite"></div>
      </div>
      <div class="edth-say" aria-live="polite"><p></p><div class="edth-say-x"></div></div>
      <form class="edth-bar">
        <button type="button" class="edth-mic" aria-pressed="false" aria-label="Ligar ou desligar o microfone da EDITH"><span class="edth-orb" aria-hidden="true"><i></i><i></i><i></i><b></b></span></button>
        <input class="edth-in" placeholder="${SR ? "Fale ou digite…" : "Digite…"}" aria-label="Mensagem para a EDITH" maxlength="500" autocomplete="off" enterkeyhint="send" />
        <button class="edth-send" aria-label="Enviar">${svg("send", 16)}</button>
        <button type="button" class="edth-exp" aria-label="Ver conversa" aria-expanded="false">${svg("up", 16)}</button>
        <button type="button" class="edth-x" aria-label="Fechar a EDITH">${svg("close", 16)}</button>
      </form>
    </section>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const log = $(".edth-log"), input = $(".edth-in"), mic = $(".edth-mic"), panel = $(".edth-panel"), more = $(".edth-more"), sayBox = $(".edth-say"), sayP = $(".edth-say p"), sayX = $(".edth-say-x");
  const exp = $(".edth-exp");
  // linha de status/transcrição dentro do campo de texto (sem ocupar espaço extra)
  const live = { set hidden(h) { if (h) input.placeholder = SR ? (micOn ? (awake() ? "Ouvindo… ou digite" : "Diga “Edith” para chamar") : "Fale ou digite…") : "Digite…"; }, set textContent(t) { if (!input.value) input.placeholder = t; } };
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
    if (who === "bot") showSay(text, extra); // bolha curta acima da barra
    return el;
  };
  let sayT = 0;
  function showSay(text, extra = {}) {
    if (!text && !extra.links?.length) return;
    if (text) sayP.textContent = text;
    sayX.innerHTML = "";
    if (extra.links?.length) sayX.insertAdjacentHTML("beforeend", `<div class="edth-links">${extra.links.map(([l, h]) => `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(l)} ${svg("link", 12)}</a>`).join("")}</div>`);
    if (extra.chips?.length) {
      const c = document.createElement("div"); c.className = "edth-chips";
      extra.chips.slice(0, extra.all ? 12 : 5).forEach((t) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; b.onclick = () => handle(t); c.appendChild(b); });
      sayX.appendChild(c);
    }
    sayBox.classList.add("on");
    clearTimeout(sayT);
    sayT = setTimeout(() => sayBox.classList.remove("on"), extra.chips?.length || extra.links?.length ? 16000 : Math.max(6000, (text || "").length * 90));
  }

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
      b.onclick = () => { voice = v; try { localStorage.setItem(VKEY, v.name); } catch {} renderVoices(); speak("Oi, eu sou a EDITH. Essa é a minha voz."); };
      vlist.appendChild(b);
    });
    const hasFem = voices.some((v) => rank(v) < 99);
    if (serverTTS) { vhint.textContent = "Usando a voz neural do site (a mesma em qualquer aparelho). As vozes abaixo só entram se ela ficar indisponível."; return; }
    vhint.textContent = !voices.length ? "Nenhuma voz em português instalada neste aparelho." : hasFem ? "Toque para ouvir e escolher." : "Não há voz feminina em português instalada. No Windows: Configurações → Hora e idioma → Fala → Adicionar vozes → Português (Brasil). No Edge, a voz Francisca (natural) já vem pronta.";
  }
  let micOn = false, speaking = false, afterSpeak = null;
  // acordada = responde a tudo; dormindo (vídeo aberto ou barra recolhida) = só ao ouvir "Edith"
  let wakeUntil = 0, collapsed = false;
  const awake = () => !videoOpen() && !collapsed || Date.now() < wakeUntil;
  // voz: 1º a voz neural do site (/api/tts, sempre igual e realista); sem ela, a voz do navegador
  let audio = null, speakId = 0;
  const ttsCache = new Map();
  let ttsFails = 0;
  const spoken = (t) => t.replace(/\bEDITH\b|\bEdith\b/g, "Edíte").replace(/UNoB/g, "U-N-O-B").replace(/@/g, " arroba ").replace(/\n+/g, ". ");
  const neural = async (text) => {
    if (serverTTS === false) return null;
    if (ttsCache.has(text)) return ttsCache.get(text);
    try {
      const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!r.ok) { if (r.status === 501 || r.status === 404 || ++ttsFails >= 2) serverTTS = false; return null; }
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
    const begin = () => { speaking = true; abortRec(); setState("speaking"); sfx.musicHold?.(true, "edth"); };
    const end = () => { if (id !== speakId) return; speaking = false; sfx.musicHold?.(false, "edth"); if (root.dataset.state === "speaking") setState("idle"); afterSpeak?.(); afterSpeak = null; if (micOn && !dead) setTimeout(listen, 250); };
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
      u.lang = "pt-BR"; if (voice) u.voice = voice; u.rate = 1.08; u.pitch = voice && rank(voice) < 99 ? 1.18 : 1.4; u.volume = 1;
      begin();
      // salvaguarda: alguns navegadores não disparam onend (sem voz instalada, frase longa no Chrome)
      const guard = setTimeout(() => { end(); res(); }, 2500 + t.length * 110);
      u.onend = u.onerror = () => { clearTimeout(guard); end(); res(); };
      speechSynthesis.speak(u);
    });
  };

  // ── voz: escuta contínua ──
  // cada escuta é um objeto próprio; escuta interrompida de propósito (abort) não processa.
  // O navegador encerra a escuta sozinho de tempos em tempos: com o microfone ligado, ela reinicia na hora.
  let rec = null, fails = 0;
  const abortRec = () => { if (rec) { rec.aborted = true; try { rec.abort(); } catch {} rec = null; } };
  const listen = () => {
    if (!SR || dead || speaking || !micOn) return;
    abortRec();
    const r = (rec = new SR()); r.lang = "pt-BR"; r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
    let got = "", idle = 0;
    const flush = () => {
      const text = got.trim(); got = "";
      if (!text) return;
      const t = norm(text), w = t.match(WAKE);
      if (w) { // "Edith, …": acorda e executa o resto da frase
        const words = text.split(/\s+/), i = words.findIndex((x, k) => WAKE.test(norm(x)) || WAKE.test(norm(x + " " + (words[k + 1] || ""))));
        const skip = i >= 0 && !WAKE.test(norm(words[i])) ? 2 : 1;
        const rest = i >= 0 ? words.slice(i + skip).join(" ").replace(/^[,.!?\s]+/, "").trim() : "";
        wakeUntil = Date.now() + 12000;
        if (collapsed) expandSay();
        if (rest.length > 1) handle(rest); else speak("Oi?");
        return;
      }
      if (awake()) { wakeUntil = videoOpen() || collapsed ? Date.now() + 12000 : 0; handle(text); }
    };
    r.onstart = () => { if (r.aborted) return; fails = 0; setState("listening"); live.hidden = true; };
    r.onresult = (e) => {
      let fin = "", tmp = "";
      for (let i = e.resultIndex; i < e.results.length; i++) (e.results[i].isFinal ? (fin += e.results[i][0].transcript) : (tmp += e.results[i][0].transcript));
      if (tmp && awake()) live.textContent = tmp;
      if (fin) { got += " " + fin; clearTimeout(idle); idle = setTimeout(() => { flush(); live.hidden = true; }, 350); }
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { setMic(false); add("bot", "O microfone está bloqueado. Libere no cadeado da barra de endereço, ou digite."); }
    };
    r.onend = () => {
      if (r.aborted || r !== rec) return;
      clearTimeout(idle); flush();
      if (root.dataset.state === "listening") setState("idle");
      rec = null;
      if (micOn && !dead && !speaking) setTimeout(listen, ++fails > 5 ? 1500 : 150); // reinicia sozinho
    };
    try { r.start(); } catch { rec = null; setTimeout(listen, 600); }
  };
  const setMic = (on) => {
    micOn = !!on && !!SR; mic.setAttribute("aria-pressed", String(micOn)); root.classList.toggle("mic-on", micOn);
    if (micOn) { fails = 0; listen(); } else { abortRec(); if (root.dataset.state === "listening") setState("idle"); }
    live.hidden = true;
  };
  const stopListening = () => setMic(false);
  mic.onclick = () => {
    sfx.unlock?.();
    if (!SR) { add("bot", "Este navegador não reconhece voz. Pode digitar."); input.focus(); return; }
    if (micOn) { setMic(false); stopSpeech(); speaking = false; setState("idle"); return; }
    stopSpeech(); speaking = false; wakeUntil = 0; setMic(true);
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
        if (videoOpen()) app.closePlayer?.();
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
      case "tour": app.tour?.(); break;
      case "micoff": setTimeout(() => setMic(false), 50); break;
      case "close_video": app.closePlayer?.(); wakeUntil = 0; break;
      case "message": return handle("quero mandar um recado pro Alex", true);
      case "mail": {
        const data = { name: String(a.name || "").slice(0, 120), email: String(a.email || "").slice(0, 200), message: String(a.message || "").slice(0, 4000), subject: String(a.subject || "Recado pelo site").slice(0, 140) };
        sendMail(data).then((ok) => { if (dead) return; const t = ok ? "Enviado. O Alex responde no seu e-mail." : "Não consegui enviar agora. Tente pelo WhatsApp."; add("bot", t, ok ? {} : { links: [["WhatsApp", SOCIAL.whatsapp]] }); speak(t); });
        break;
      }
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

  // ── recado por e-mail: /api/contact (Resend) ou, sem chave, FormSubmit direto do navegador ──
  async function sendMail(d) {
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      if (r.ok) return true;
      if (r.status !== 501 && r.status !== 404) return false;
    } catch {}
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${MAIL_TO}`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: `${d.subject} · ${d.name || d.email}`, _replyto: d.email, _template: "box", _captcha: "false", Nome: d.name || "—", "E-mail": d.email, Mensagem: d.message, Origem: "EDITH, no site" }),
      });
      const j = await r.json().catch(() => ({}));
      return r.ok && String(j.success) !== "false";
    } catch { return false; }
  }

  // ── IA (Groq) para o que o motor local não resolve ──
  async function askAI(text) {
    try {
      const r = await fetch("/api/edth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, history: history.slice(-20) }) });
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
    let r = null;
    const nt = norm(text);
    if (videoOpen() && nt.split(" ").length <= 8 && / (proximo|seguinte|outro|pula|passa) /.test(nt)) { // próximo vídeo com o player aberto
      const cur = document.querySelector("dialog.player[open] #pl-title")?.textContent?.trim();
      const i = PROJECTS.findIndex((p) => p.title === cur || (cur && p.title.startsWith(cur.split("|")[0].trim())));
      const p = PROJECTS[(i + 1) % PROJECTS.length];
      r = { say: `Abrindo ${p.title.split(/\||—/)[0].trim()}.`, actions: [{ type: "play", id: p.id }] };
    }
    if (!r) r = brain.reply(text);
    if (!r) {
      setState("thinking");
      const typing = document.createElement("div"); typing.className = "edth-msg bot typing"; typing.innerHTML = "<p><i></i><i></i><i></i></p>"; log.appendChild(typing);
      busy = true; r = await askAI(text); busy = false;
      typing.remove();
      if (!r) r = { say: "Não entendi. Pode repetir?", actions: [] };
      if (root.dataset.state === "thinking") setState("idle");
    }
    const extra = { links: [...(r.links || [])] };
    const msg = r.say ? add("bot", r.say, { chips: r.chips, all: r.all }) : null;
    history.push({ role: "assistant", content: r.say || "(ação)" });
    const speech = speak(r.say);
    for (const a of r.actions || []) await exec(a, extra);
    if (extra.links.length) { const l = add("bot", "", { links: extra.links }); if (msg) msg.after(l); }
    await speech;
  }

  // ── abrir / recolher / fechar ──
  let dead = false;
  const expandSay = () => { collapsed = false; root.classList.remove("collapsed"); };
  const show = (listenNow) => {
    expandSay(); panel.hidden = false; root.classList.add("open");
    if (listenNow && SR && !micOn) setMic(true);
  };
  const minimize = () => { collapsed = true; root.classList.add("collapsed"); setExp(false); sayBox.classList.remove("on"); };
  function close() {
    dead = true; setMic(false); stopSpeech(); sfx.musicHold?.(false, "edth");
    root.classList.add("out"); cursor.remove();
    setTimeout(() => root.remove(), 350);
    instance = null; onClose();
  }
  const setExp = (on) => { more.hidden = !on; exp.setAttribute("aria-expanded", String(on)); root.classList.toggle("expanded", on); if (on) log.scrollTop = log.scrollHeight; };
  exp.onclick = () => setExp(more.hidden);
  $(".edth-vbtn").onclick = () => { const v = $(".edth-voices"); v.hidden = !v.hidden; $(".edth-vbtn").setAttribute("aria-expanded", String(!v.hidden)); if (!v.hidden) pickVoice(); };
  $(".edth-x").onclick = close;
  input.addEventListener("focus", () => { if (collapsed) expandSay(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.activeElement && root.contains(document.activeElement)) { if (!more.hidden) setExp(false); else sayBox.classList.remove("on"); } });

  // boas-vindas: curta; sugestões só na primeira vez
  let first = true;
  try { first = !localStorage.getItem(SEEN); localStorage.setItem(SEEN, "1"); } catch {}
  // lista fixa de comandos no topo da conversa completa
  const cmds = $(".edth-cmds");
  TUTORIAL.forEach((t) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; b.onclick = () => handle(t); cmds.appendChild(b); });
  add("bot", SR ? "Oi, eu sou a EDITH. Pode falar." : "Oi, eu sou a EDITH. Pode digitar.", first ? { chips: TUTORIAL } : {});
  show();
  // microfone já ligado ao abrir e fica ligado até o usuário pedir para desligar
  if (SR) { micOn = true; mic.setAttribute("aria-pressed", "true"); root.classList.add("mic-on"); }
  speak(SR ? "Oi, eu sou a Edith. Pode falar." : "Oi, eu sou a Edith.").then(() => { if (micOn && !speaking && !rec) listen(); });
  return { show, close, minimize, ask: (t) => handle(t) };
}
