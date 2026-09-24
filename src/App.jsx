import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { PROJECTS } from "./projects";
import { MARK_PATH, WM_PATH, WM_W, WM_H } from "./brand";
import { tc, reducedMotion } from "./util";
import ParticleField from "./components/ParticleField";
import LensField from "./components/LensField";
import Floaters from "./components/Floaters";
import Cursor from "./components/Cursor";
import Method from "./components/Method";
import runDemo from "./components/Demo";
import { sfx } from "./components/Sound";
import Speedforce from "./components/Speedforce";
import * as I from "./components/Icons";
import { LOGO_DR, LOGO_HF, LOGO_COMFY } from "./components/logos";

gsap.registerPlugin(ScrollTrigger);

const WHATS = "5515997569880";
const PHONE = "+55 15 99756-9880";
const EMAIL = "ascencioalexgabriel@gmail.com";
const IG = "https://instagram.com/alexascencioai";
const LI = "https://www.linkedin.com/in/ascencioalexgabriel/";
const ORG = { UNoB: "União Noroeste Brasileira" };
const thumb = (p) => `/media/${p.id}.webp`;
const short = (p) => p.title.split(/\||—/)[0].trim();
const artistOf = (p) => { const a = (p.title.split(/\||—/)[1] || p.cat).trim(); return ORG[a] || a; };
const FEATURED = [25, 24, 14, 16, 7, 21].map((id) => PROJECTS.find((p) => p.id === id));
const CATS = ["Todos", ...new Set(PROJECTS.map((p) => p.cat))];
const N4K = PROJECTS.filter((p) => p.q === "4K").length;
// altura em px calculada por área óptica equivalente (ver README)
const CLIENTS = [
  ["Kiger", "kiger", 27.3], ["MAB", "mab", 50], ["UNASP", "unasp", 24.1], ["Novo Tempo", "novotempo", 45],
  ["Prisma Brasil", "prisma", 52], ["Dilson Castro", "dilson", 38.1], ["Via Global", "via-global", 33.6], ["Entre Aspas", "entre-aspas", 27.5],
];
const ARTISTS = ["Quarteto Elo", "Gabriella Stehling", "Communion", "Kati Carvalho", "Califórnia Dreams", "Willian Krusty", "Pedro Valença", "Prisminha", "Dunamis Studio", "Patrícia de Paiva", "CPB"];
const NAV = [["#filmes", "Filmes"], ["#lab", "Lab"], ["#metodo", "Método"], ["#arquivo", "Seleção"], ["#sobre", "Sobre"]];
const SERVICES = [
  [I.Scissors, "Edição & montagem", "Ritmo de cinema, corte pela cena e respiro para a história.", "Premiere Pro · DaVinci Resolve"],
  [I.Layers, "Motion design", "Tipografia, marca e transições em camadas editáveis.", "After Effects"],
  [I.Wave, "Cor & áudio", "Look por cena e mix medida em LUFS antes de nivelar.", "Resolve · Lumetri · LUFS"],
  [I.Aperture, "IA generativa", "Planos gerados que passam como produção real — ou ficam fora do corte.", "ComfyUI · Higgsfield"],
];
const [MARK_R, MARK_L] = MARK_PATH.split(/(?<=Z)\s*/);
const useBrasilia = () => {
  const [time, setTime] = useState("");
  useEffect(() => {
    const f = () => setTime(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(new Date()));
    f(); const id = setInterval(f, 20000); return () => clearInterval(id);
  }, []);
  return time;
};

/* ───────── base ───────── */
function Mark({ className = "" }) {
  return <svg className={className} viewBox="0 0 262 151" aria-hidden="true"><path d={MARK_PATH} fill="currentColor" /></svg>;
}
// Logotipo: marca AA (altura h) + fio + "Alex Ascencio" a 50% da altura da marca
function Lockup({ h = 22, className = "" }) {
  return (
    <span className={`lockup ${className}`} style={{ "--h": `${h}px` }} role="img" aria-label="Alex Ascencio">
      <svg className="lk-mark" viewBox="0 0 262 151" aria-hidden="true"><path className="lk-l" d={MARK_L} /><path className="lk-r" d={MARK_R} /></svg>
      <i className="lk-rule" aria-hidden="true" />
      <svg className="lk-word" viewBox={`0 0 ${WM_W} ${WM_H}`} aria-hidden="true"><path d={WM_PATH} /></svg>
    </span>
  );
}
function Magnetic({ children, strength = 0.22 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(pointer: coarse)").matches) return;
    const inner = el.firstElementChild?.querySelector(".btn-label");
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" }), yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    const ix = inner && gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3" }), iy = inner && gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3" });
    const move = (e) => {
      const r = el.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
      xTo(dx * strength); yTo(dy * strength);
      if (ix) { ix(dx * strength * 0.35); iy(dy * strength * 0.35); }
    };
    const leave = () => { xTo(0); yTo(0); if (ix) { ix(0); iy(0); } };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [strength]);
  return <span ref={ref} className="magnetic">{children}</span>;
}
function Btn({ as = "a", variant = "primary", size = "", className = "", children, icon = <I.Arrow size={15} />, ...props }) {
  const Tag = as;
  return (
    <Magnetic>
      <Tag className={`btn btn-${variant} ${size} ${className}`} {...props}>
        <span className="btn-fill" aria-hidden="true" />
        <span className="btn-label"><span>{children}</span><span aria-hidden="true">{children}</span></span>
        <span className="btn-icon"><span>{icon}</span><span aria-hidden="true">{icon}</span></span>
      </Tag>
    </Magnetic>
  );
}
// botão de play: núcleo de vidro + anel que se desenha no hover
function PlayBtn({ playing = false, className = "" }) {
  return (
    <span className={`pbtn ${className}`} aria-hidden="true">
      <svg className="pbtn-ring" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28.5" pathLength="1" /></svg>
      <span className="pbtn-core">{playing ? <I.Pause size={16} /> : <I.Play size={17} />}</span>
    </span>
  );
}
const yt = (p) => `${p.url.replace("www.youtube.com", "www.youtube-nocookie.com")}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
function Roll({ children }) {
  return <span className="roll"><span>{children}</span><span aria-hidden="true">{children}</span></span>;
}
function RollLink({ children, ...p }) {
  return <a className="rlink" {...p}><Roll>{children}</Roll><I.Arrow size={13} className="rlink-a" /></a>;
}
function Eyebrow({ children, n }) {
  return <span className="eyebrow">{n && <b>{n}</b>}{children}</span>;
}
function Title({ children, className = "" }) {
  return <h2 className={`display js-title ${className}`}><span className="title-inner">{children}</span></h2>;
}
const Line = ({ children }) => <span className="line"><span>{children}</span></span>;

/* ───────── preloader ───────── */
function Preloader() {
  return (
    <div className="preloader" aria-hidden="true">
      <div className="pre-top" /><div className="pre-bot" />
      <i className="pre-slit" />
      <div className="pre-center">
        <div className="pre-lockup"><Lockup h={44} /></div>
        <div className="pre-meta">
          <span className="pre-tc">00:00:00:00</span>
          <span className="pre-bar"><i /></span>
          <span className="pre-lab">SEQ_Portfolio_v05 · 24 fps</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── som ───────── */
function SoundToggle() {
  const [on, setOn] = useState(sfx.enabled);
  useEffect(() => sfx.onChange(setOn), []);
  return (
    <button className={`snd${on ? " on" : ""}`} onClick={() => sfx.set(!on)} aria-pressed={on} aria-label={on ? "Desligar o som" : "Ligar o som"}>
      <span className="snd-bars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ "--i": i }} />)}</span>
      <span className="snd-l mono">Som</span>
    </button>
  );
}

/* ───────── navegação ───────── */
function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const pillRef = useRef(null), hovRef = useRef(null), linksRef = useRef(null);
  useEffect(() => { document.documentElement.classList.toggle("menu-open", open); }, [open]);
  useEffect(() => {
    const sts = NAV.map(([h]) => ScrollTrigger.create({ trigger: h, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && setActive(h), onLeaveBack: () => h === "#filmes" && setActive(null) }));
    return () => sts.forEach((s) => s.kill());
  }, []);
  useEffect(() => {
    const pill = pillRef.current, wrap = linksRef.current;
    const a = active && wrap?.querySelector(`a[href="${active}"]`);
    if (!pill || !wrap) return;
    if (!a) { gsap.to(pill, { opacity: 0, duration: 0.3 }); return; }
    gsap.to(pill, { x: a.offsetLeft, width: a.offsetWidth, opacity: 1, duration: 0.6, ease: "expo.out" });
  }, [active]);
  const hover = (e) => {
    if (matchMedia("(max-width: 860px)").matches) return;
    const a = e.currentTarget;
    gsap.to(hovRef.current, { x: a.offsetLeft, width: a.offsetWidth, opacity: 1, duration: 0.5, ease: "expo.out" });
  };
  const unhover = () => gsap.to(hovRef.current, { opacity: 0, duration: 0.4 });
  return (
    <header className="nav">
      <a href="#top" className="nav-brand" aria-label="Alex Ascencio, início"><Lockup h={22} /></a>
      <nav ref={linksRef} className={`nav-links ${open ? "is-open" : ""}`} aria-label="Principal" onPointerLeave={unhover}>
        <span className="nav-hover" ref={hovRef} aria-hidden="true" />
        <span className="nav-pill" ref={pillRef} aria-hidden="true" />
        {NAV.map(([h, t], i) => (
          <a key={h} href={h} onClick={() => setOpen(false)} onPointerEnter={hover} style={{ "--i": i }} aria-current={active === h ? "true" : undefined}>
            <sup className="nav-n">0{i + 1}</sup><Roll>{t}</Roll>
          </a>
        ))}
        <div className="nav-menu-foot">
          <a href={`mailto:${EMAIL}`}><I.Mail size={16} /> {EMAIL}</a>
          <a href={`https://wa.me/${WHATS}`} target="_blank" rel="noreferrer"><I.Whatsapp size={16} /> {PHONE}</a>
          <a href={IG} target="_blank" rel="noreferrer"><I.Instagram size={16} /> @alexascencioai</a>
        </div>
      </nav>
      <div className="nav-right">
        <SoundToggle />
        <Btn href="#contato" variant="primary" size="sm">Vamos conversar</Btn>
        <button className="nav-menu" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span />
        </button>
      </div>
    </header>
  );
}

/* ───────── player ───────── */
function Player({ project, onClose, onHost, onNav }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    const prev = document.activeElement;
    d.showModal();
    d.querySelector(".player-card")?.focus({ preventScroll: true }); // foco no cartão: sem anel no primeiro botão
    onHost(d);
    sfx.whoosh(0.45, true, 0.09); setTimeout(() => sfx.boom(0.12), 280);
    sfx.musicHold(true);
    window.__lenis?.stop();
    return () => { sfx.whoosh(0.35, false, 0.06); sfx.musicHold(false); onHost(null); window.__lenis?.start(); prev?.focus?.({ preventScroll: true }); };
  }, [onHost]);
  const watch = project.url?.replace("/embed/", "/watch?v=");
  return (
    <dialog ref={ref} className="player" onCancel={onClose} onClick={(e) => e.target === e.currentTarget && onClose()} aria-labelledby="pl-title">
      <div className="player-card" tabIndex={-1}>
        <div className="player-bar">
          <span className="mono">{project.cat} · {project.date.slice(0, 4)} · {project.q}</span>
          <div className="player-ctl">
            <div className="player-nav">
              <button onClick={() => onNav(-1)} aria-label="Vídeo anterior"><I.Prev size={16} /></button>
              <span className="mono"><b>{String(PROJECTS.indexOf(project) + 1).padStart(2, "0")}</b> / {PROJECTS.length}</span>
              <button onClick={() => onNav(1)} aria-label="Próximo vídeo"><I.Next size={16} /></button>
            </div>
            <button className="icon-btn player-x" onClick={onClose} aria-label="Fechar"><I.Close size={18} /></button>
          </div>
        </div>
        <div className="player-frame">
          {project.video ? (
            <video key={project.id} src={project.video} poster={thumb(project)} controls autoPlay playsInline preload="metadata" />
          ) : (
            <iframe
              key={project.id}
              title={project.title}
              src={yt(project)}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
        </div>
        <div className="player-info">
          <div>
            <h2 id="pl-title">{short(project)}</h2>
            <p>{artistOf(project)} — {project.desc}</p>
          </div>
          {!project.video && <Btn href={watch} target="_blank" rel="noreferrer" variant="glass">YouTube</Btn>}
        </div>
      </div>
    </dialog>
  );
}

/* ───────── hero ───────── */
function Chip({ cls, icon: Icon, red, title, sub, depth, amp, speed }) {
  return (
    <div className={`floater ${cls}`} data-float data-depth={depth} data-amp={amp} data-speed={speed}>
      <div className="fl-in">
        <div className="chip">
          <span className={`chip-icon ${red ? "red" : ""}`}><Icon size={20} loop /></span>
          <span className="chip-text">{title}<small>{sub}</small></span>
          <span className="fl-glare" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
// mini-player do card da hero: toca ali mesmo (vídeo do site ou YouTube), anterior/próximo e tela cheia
function NowPlaying({ open }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vid = useRef(null), prev = useRef(null);
  const cur = PROJECTS[idx];
  const coarse = () => matchMedia("(pointer: coarse), (max-width: 760px)").matches;
  const go = (d) => { setPlaying(false); setIdx((i) => (i + d + PROJECTS.length) % PROJECTS.length); };
  const toggle = () => {
    if (coarse()) { open(cur); return; } // no celular o card é pequeno demais: abre o player
    if (playing && cur.video && vid.current) { vid.current.paused ? vid.current.play() : vid.current.pause(); return; }
    setPlaying(!playing);
  };
  const [paused, setPaused] = useState(false);
  const preview = (on) => {
    const v = prev.current;
    if (!v || playing || coarse()) return;
    if (on) { v.play().catch(() => {}); v.parentElement.classList.add("is-preview"); } else { v.pause(); v.parentElement.classList.remove("is-preview"); }
  };
  useEffect(() => {
    const f = (e) => { if (e.detail.on) setIdx(0); requestAnimationFrame(() => preview(e.detail.on)); };
    window.addEventListener("demo:np", f);
    return () => window.removeEventListener("demo:np", f);
  });
  const label = idx === 0 ? "Último lançamento" : "Lançamentos";
  const n = `${String(idx + 1).padStart(2, "0")} / ${PROJECTS.length}`;
  return (
    <div className={`np${playing ? " is-playing" : ""}`}>
      <div className="np-media" onPointerEnter={() => preview(true)} onPointerLeave={() => preview(false)}>
        <img key={cur.id} src={thumb(cur)} alt="" draggable="false" />
        {!playing && (cur.preview || cur.video) && (
          <video ref={prev} key={`p${cur.id}`} muted loop playsInline preload="none" aria-hidden="true">
            {cur.preview ? <><source src={`${cur.preview}.webm`} type="video/webm" /><source src={`${cur.preview}.mp4`} type="video/mp4" /></> : <source src={cur.video} type="video/mp4" />}
          </video>
        )}
        {playing && (cur.video
          ? <video ref={vid} key={`v${cur.id}`} src={cur.video} autoPlay playsInline onPlay={() => setPaused(false)} onPause={() => setPaused(true)} onEnded={() => go(1)} />
          : <iframe key={`y${cur.id}`} title={cur.title} src={yt(cur)} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />)}
        {!playing && <button className="np-hit" onClick={toggle} data-cursor="Assistir" aria-label={`Assistir ${cur.title} aqui`} />}
        <span className="np-live mono"><span className="rec" /> {label}</span>
        <span className="np-q mono">{cur.q}</span>
        <button className="np-arrow l" onClick={() => go(-1)} aria-label="Vídeo anterior"><I.Prev size={16} /></button>
        <button className="np-arrow r" onClick={() => go(1)} aria-label="Próximo vídeo"><I.Next size={16} /></button>
      </div>
      <div className="np-body">
        <span className="np-text" key={cur.id}>
          <small className="mono">{cur.cat} · {cur.date.slice(0, 4)}<span className="np-idx"> · {n}</span></small>
          <b>{short(cur)}</b>
          <span>{artistOf(cur)}</span>
        </span>
        <span className="np-ctrl">
          <button className="np-exp" onClick={() => { setPlaying(false); open(cur); }} aria-label="Abrir em tela cheia"><I.Expand size={15} /></button>
          <button className="np-main" onClick={toggle} aria-label={playing && !paused ? "Pausar" : "Assistir aqui"}><PlayBtn playing={playing && !paused && !!cur.video} /></button>
        </span>
      </div>
      <span className="fl-glare" aria-hidden="true" />
    </div>
  );
}
// passar o mouse no botão de gestos já começa a baixar modelo e WASM (≈19 MB) antes do clique
const preloadGest = () => import("./gesture/hands").then((m) => m.preloadHands().catch(() => {}));
function Hero({ open, onDemo, demo, onGest, gest }) {
  const personRef = useRef(null), wordRef = useRef(null), floatRef = useRef(null);
  useEffect(() => {
    const fl = new Floaters(floatRef.current);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? fl.start() : fl.stop()));
    io.observe(floatRef.current.closest(".hero"));
    if (matchMedia("(pointer: coarse)").matches || reducedMotion()) return () => { io.disconnect(); fl.dispose(); };
    const px = gsap.quickTo(personRef.current, "x", { duration: 1.4, ease: "power3" });
    const wx = gsap.quickTo(wordRef.current, "x", { duration: 1.6, ease: "power3" });
    const wy = gsap.quickTo(wordRef.current, "y", { duration: 1.6, ease: "power3" });
    const move = (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      px(nx * 14); wx(nx * -28); wy(ny * -10);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { io.disconnect(); fl.dispose(); window.removeEventListener("pointermove", move); };
  }, []);
  return (
    <section id="top" className="hero">
      <div className="hero-haze" aria-hidden="true" />
      <div className="hero-stage">
        <h1 className="hero-word" ref={wordRef}>
          <span className="sr-only">Alex Ascencio — portfólio de edição e cinema</span>
          <span className="hero-word-inner" aria-hidden="true">
            {"PORTFOLIO".split("").map((c, i) => <span key={i} className="ch">{c}</span>)}
          </span>
        </h1>
        <div className="hero-person" ref={personRef}>
          <div className="hero-person-scroll"><div className="hero-person-in">
            <img src="/media/alex-cutout.webp" alt="Alex Ascencio, de moletom preto e camiseta branca" width="1086" height="1420" fetchPriority="high" />
          </div></div>
        </div>
      </div>

      <div className="hero-floats" ref={floatRef}>
        <Chip cls="fl-a" icon={I.Scissors} title="Editor & filmmaker" sub="Clipes · Cinema · Documentário" depth={1.3} amp={11} speed={0.55} />
        <Chip cls="fl-c" icon={I.Wave} title="Cor & som medidos" sub="Look por cena · LUFS por clipe" depth={0.8} amp={9} speed={0.45} />
        <Chip cls="fl-b" icon={I.Spark} red title="IA com critério" sub="Só entra se passar como filmado" depth={1.1} amp={12} speed={0.5} />
        <Chip cls="fl-d" icon={I.Film} title={`${N4K} entregas em 4K`} sub="Da captação ao master" depth={0.7} amp={8} speed={0.62} />
        <div className="floater fl-tour" data-float data-depth="0.5" data-amp="7" data-speed="0.6">
          <div className="fl-in">
            <button className="tour" onClick={onDemo} aria-pressed={demo} aria-label="Assistir o site: tour guiado automático">
              <PlayBtn playing={demo} />
              <span className="tour-t">{demo ? "Tour em andamento" : "Assistir o site"}<small>{demo ? "Mexa o mouse para assumir" : "Tour guiado · 1 min"}</small></span>
              <span className="fl-glare" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="floater fl-np" data-float data-depth="0.9" data-amp="9" data-speed="0.42">
          <div className="fl-in"><NowPlaying open={open} /></div>
        </div>
      </div>

      <div className="hero-bottom">
        <div className="hero-intro">
          <p className="hero-kicker mono"><Line><i className="live" /> Agenda aberta · Edição, cor, motion e IA</Line></p>
          <p className="hero-lead"><Line>Edição, cor e motion</Line><Line>com acabamento <em>de cinema.</em></Line></p>
          <p className="hero-sub"><Line>A imagem estabelece o lugar; a história entra no tempo certo.</Line></p>
          <div className="hero-ctas">
            <Btn href="#filmes" size="lg" icon={<I.Play size={14} />}>Ver filmes</Btn>
            <Btn href="#contato" size="lg" variant="glass">Falar comigo</Btn>
            <Btn as="button" type="button" size="lg" variant="glass" className="btn-gest" onClick={onGest} onPointerEnter={preloadGest} onFocus={preloadGest} aria-pressed={gest} icon={<I.Hand size={15} />}>{gest ? "Desligar gestos" : "Controlar com as mãos"}</Btn>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <span className="mono js-tc">00:00:00:00</span>
          <span className="scroll-line"><i /></span>
          <span className="mono hero-scroll-l">Role</span>
        </div>
      </div>
    </section>
  );
}

/* ───────── manifesto ───────── */
function Manifesto() {
  const words = "Eu corto pela cena, não pela fala. A imagem estabelece o lugar. A fala entra quando você já sabe onde está.".split(" ");
  const years = PROJECTS.map((p) => +p.date.slice(0, 4));
  const stats = [[PROJECTS.length, "Projetos selecionados"], [N4K, "Entregas em 4K"], [CATS.length - 1, "Formatos"], [`${Math.min(...years)}–${String(Math.max(...years)).slice(2)}`, "Em produção contínua"]];
  return (
    <section id="manifesto" className="manifesto">
      <div className="manifesto-pin">
        <div className="manifesto-inner">
          <Eyebrow n="01">Manifesto</Eyebrow>
          <p className="manifesto-text">{words.map((w, i) => <span className="w" key={i}>{w} </span>)}</p>
          <dl className="stats">
            {stats.map(([n, l]) => (
              <div key={l}><dt className="mono">{l}</dt><dd data-count={typeof n === "number" ? n : undefined}>{n}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ───────── filmes ───────── */
function Featured({ open }) {
  const [hov, setHov] = useState(null);
  return (
    <section id="filmes" className="featured">
      <div className="featured-pin">
        <div className="featured-head">
          <div>
            <Eyebrow n="02">Filmes em destaque</Eyebrow>
            <Title>Cada corte, <em>uma decisão.</em></Title>
          </div>
          <div className="featured-progress" aria-hidden="true"><span className="mono js-fcount">01 / 0{FEATURED.length}</span><i><b className="js-fbar" /></i></div>
        </div>
        <div className="featured-track">
          {FEATURED.map((p, i) => (
            <article className="fcard" key={p.id}>
              <button onClick={() => open(p)} data-cursor="Assistir" aria-label={`Assistir ${p.title}`}>
                <div className="fcard-media" onPointerEnter={() => canHover() && setHov(p.id)} onPointerLeave={() => setHov(null)}><img src={thumb(p)} alt="" loading="lazy" /><HoverPreview src={p.preview} on={hov === p.id} /></div>
                <div className="fcard-shade" />
                <div className="fcard-top"><span className="mono">{String(i + 1).padStart(2, "0")}</span><span className="mono">{p.cat} · {p.date.slice(0, 4)} · {p.q}</span></div>
                <div className="fcard-meta">
                  <div><h3>{short(p)}</h3><p>{artistOf(p)}</p></div>
                  <PlayBtn className="fcard-play" />
                </div>
              </button>
            </article>
          ))}
          <a className="fcard fcard-more" href="#arquivo">
            <span className="more-n">{PROJECTS.length}</span>
            <span className="more-l">projetos selecionados</span>
            <span className="more-a"><I.ArrowDown size={18} /></span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ───────── lab ───────── */
function Lab() {
  const canvas = useRef(null), video = useRef(null);
  useEffect(() => {
    let field;
    try { field = new LensField(canvas.current, video.current); } catch { canvas.current.classList.add("is-fallback"); return; }
    if (reducedMotion()) { canvas.current.classList.add("is-fallback"); field.dispose(); return; }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? field.start() : field.stop()), { rootMargin: "100px" });
    io.observe(canvas.current);
    return () => { io.disconnect(); field.dispose(); };
  }, []);
  return (
    <section id="lab" className="lab">
      <div className="lab-frame">
        <video ref={video} muted loop playsInline preload="auto" crossOrigin="anonymous" className="lab-video-src" aria-hidden="true" onError={() => canvas.current?.classList.add("is-fallback")}>
          <source src="/media/aperture-motion.webm" type="video/webm" />
          <source src="/media/aperture-motion.mp4" type="video/mp4" />
        </video>
        <canvas ref={canvas} className="lab-canvas" aria-hidden="true" />
        <img src="/media/aperture-poster.webp" alt="" className="lab-poster" aria-hidden="true" />
        <div className="lab-content">
          <div className="lab-head">
            <Eyebrow n="03">Lab · Serviços</Eyebrow>
            <Title>Luz, lente <em>e movimento.</em></Title>
            <p className="reveal">Passe o cursor sobre a imagem: ela responde como uma objetiva.</p>
          </div>
          <div className="services">
            {SERVICES.map(([Icon, t, d, tools], i) => (
              <article className="service reveal" key={t} style={{ "--d": i }}>
                <div className="service-top"><span className="service-icon"><Icon size={22} /></span><span className="mono">0{i + 1}</span></div>
                <h3>{t}</h3>
                <p>{d}</p>
                <small className="mono">{tools}</small>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── clientes ───────── */
function Clients() {
  return (
    <section className="clients" aria-label="Clientes e artistas">
      <div className="clients-head">
        <span className="mono">Clientes e parceiros</span>
        <span className="rule-line" />
      </div>
      <div className="marquee"><div className="marquee-track">
        {[...CLIENTS, ...CLIENTS].map(([n, f, h], i) => (
          <span className="logo" key={i} aria-hidden={i >= CLIENTS.length}>
            <img src={`/media/logos/${f}.png`} alt={n} style={{ height: h }} loading="lazy" />
          </span>
        ))}
      </div></div>
      <div className="marquee artists reverse"><div className="marquee-track">
        {[...ARTISTS, ...ARTISTS].map((n, i) => (
          <span className="artist" key={i} aria-hidden={i >= ARTISTS.length}>{n}<i /></span>
        ))}
      </div></div>
    </section>
  );
}

/* ───────── arquivo ───────── */
// loop curto hospedado: monta no primeiro hover, entra com fade só depois do 1º quadro (sem piscar preto)
function HoverPreview({ src, on }) {
  const ref = useRef(null), [mounted, setMounted] = useState(false), [ready, setReady] = useState(false);
  useEffect(() => { if (on) setMounted(true); }, [on]);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (on) { v.currentTime = 0; v.play().catch(() => {}); } else v.pause();
  }, [on, mounted]);
  if (!src || !mounted) return null;
  return (
    <video ref={ref} className={`hprev${on && ready ? " on" : ""}`} muted loop playsInline preload="auto" onPlaying={() => setReady(true)} aria-hidden="true">
      <source src={`${src}.webm`} type="video/webm" /><source src={`${src}.mp4`} type="video/mp4" />
    </video>
  );
}
const canHover = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
function Archive({ open }) {
  const [cat, setCat] = useState("Todos");
  const [prev, setPrev] = useState(null);
  const [hovId, setHovId] = useState(null);
  useEffect(() => {
    const f = (e) => setPrev(e.detail.id);
    window.addEventListener("demo:card", f);
    return () => window.removeEventListener("demo:card", f);
  }, []);
  const [q, setQ] = useState("");
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const list = useMemo(() => PROJECTS.filter((p) => (cat === "Todos" || p.cat === cat) && norm(`${p.title} ${p.cat} ${artistOf(p)}`).includes(norm(q))), [cat, q]);
  const tilt = (e) => {
    if (e.pointerType === "touch") return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(y - 0.5) * -7}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const reset = (e) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); };
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    gsap.set(".grid .card-media", { clearProps: "clipPath" }); gsap.set(".grid .card-media img", { clearProps: "transform" }); gsap.set(".grid .card-info", { clearProps: "transform,opacity" });
    ScrollTrigger.refresh();
    if (!reducedMotion()) gsap.fromTo(".grid .card-media", { clipPath: "inset(100% 0% 0% 0% round 16px)" }, { clipPath: "inset(0% 0% 0% 0% round 16px)", duration: 0.9, ease: "expo.inOut", stagger: 0.04, clearProps: "clipPath" });
  }, [cat, q]);
  return (
    <section id="arquivo" className="archive section">
      <div className="section-head">
        <div>
          <Eyebrow n="05">Seleção</Eyebrow>
          <Title>Trabalhos <em>selecionados.</em></Title>
        </div>
        <label className="search reveal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input type="search" placeholder="Filme, artista ou formato" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar trabalhos" />
        </label>
      </div>
      <div className="archive-bar reveal">
        <div className="filters" role="group" aria-label="Filtrar por formato">
          {CATS.map((c) => (
            <button key={c} aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c}<sup>{c === "Todos" ? PROJECTS.length : PROJECTS.filter((p) => p.cat === c).length}</sup>
            </button>
          ))}
        </div>
        <p className="mono archive-count" role="status">{String(list.length).padStart(2, "0")} resultados</p>
      </div>
      <div className="grid">
        {list.map((p) => (
          <button key={p.id} data-id={p.id} className="card" onClick={() => open(p)} data-cursor="Assistir" aria-label={`Assistir ${p.title}`}>
            <span className="card-media" onPointerMove={tilt} onPointerEnter={() => canHover() && setHovId(p.id)} onPointerLeave={(e) => { reset(e); setHovId(null); }}>
              <img src={thumb(p)} alt="" loading="lazy" width="640" height="360" />
              <HoverPreview src={p.preview} on={hovId === p.id || prev === p.id} />
              <span className="card-glare" />
              <span className="card-q mono">{p.q}</span>
              <PlayBtn className="card-play" />
            </span>
            <span className="card-info">
              <span className="card-t"><b>{short(p)}</b><span>{artistOf(p)}</span></span>
              <span className="card-m mono">{p.cat}<br />{p.date.slice(0, 4)}</span>
            </span>
          </button>
        ))}
      </div>
      {list.length === 0 && (
        <div className="empty">
          <p>Nada com esse nome no arquivo.</p>
          <Btn as="button" variant="glass" onClick={() => { setQ(""); setCat("Todos"); }} icon={<I.Close size={14} />}>Limpar busca</Btn>
        </div>
      )}
    </section>
  );
}

/* ───────── sobre ───────── */
const PATH_BEFORE = [
  ["PRISMA BRASIL", "Edição e captação", "2024–2026"],
  ["UNASP", "Comunicação Social · Rádio e TV", "Rádio e TV"],
];
// trajetória como timeline: o cargo atual é o take gravando (REC + timecode correndo), o resto são clipes na trilha
function Trajectory() {
  const tcRef = useRef(null);
  useEffect(() => {
    let raf, t0 = performance.now();
    const f = (now) => { if (tcRef.current) tcRef.current.textContent = tc((now - t0) / 1000); raf = requestAnimationFrame(f); };
    const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting && !reducedMotion()) raf = requestAnimationFrame(f); });
    io.observe(tcRef.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="traj">
      <article className="traj-now">
        <span className="traj-scan" aria-hidden="true" />
        <div className="traj-top">
          <span className="traj-rec mono"><span className="rec" /> REC · Atual</span>
          <span className="traj-tc mono" ref={tcRef}>00:00:00:00</span>
        </div>
        <b className="traj-name">UNIÃO NOROESTE BRASILEIRA</b>
        <div className="traj-foot">
          <span>Editor de mídia e conteúdo</span>
          <span className="traj-eq" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--i": i }} />)}</span>
        </div>
        <span className="traj-corner tl" /><span className="traj-corner tr" /><span className="traj-corner bl" /><span className="traj-corner br" />
      </article>
      <div className="traj-track" aria-label="Antes">
        <span className="traj-lab mono">Antes</span>
        <div className="traj-clips">
          {PATH_BEFORE.map(([a, b, c], i) => (
            <div className="traj-clip" key={a} style={{ "--d": i }}>
              <small className="mono">{c}</small>
              <b>{a}</b>
              <span>{b}</span>
            </div>
          ))}
          <span className="traj-ph" aria-hidden="true"><i /></span>
        </div>
      </div>
    </div>
  );
}
const TOOL_CATS = [["ed", "Edição", I.Scissors], ["cor", "Cor", I.Palette], ["mo", "Motion", I.Layers], ["ia", "IA", I.Spark], ["dev", "Dev", I.Code]];
const TOOLS = [
  ["Pr", "Premiere Pro", "ed", "pr"], ["DR", "DaVinci Resolve", "cor", "dr"], ["Ae", "After Effects", "mo", "ae"],
  ["Cf", "ComfyUI", "ia", "cf"], ["Hf", "Higgsfield", "ia", "hf"], ["</>", "Plugins CEP/UXP", "dev", "dev"],
];
// ícone de cada software: logos oficiais onde há fonte pública; Adobe pela especificação oficial (#00005B / #9999FF)
function ToolIcon({ cls, m }) {
  // DaVinci: moldura do desenho oficial recortada (o próprio bloco é o quadrado) e cada pétala na sua cor
  if (cls === "dr") return (
    <span className="tool-m tm-dr"><svg viewBox="0 0 24 24">
      <defs>
        <clipPath id="dr-in"><rect x="1.7" y="1.7" width="20.6" height="20.6" rx="4" /></clipPath>
        <clipPath id="dr-t"><rect width="24" height="11.75" /></clipPath><clipPath id="dr-l"><rect y="11.75" width="12" height="13" /></clipPath><clipPath id="dr-r"><rect x="12" y="11.75" width="12" height="13" /></clipPath>
      </defs>
      <g clipPath="url(#dr-in)">
        <path clipPath="url(#dr-t)" d={LOGO_DR.path} fill="#e9ff61" /><path clipPath="url(#dr-l)" d={LOGO_DR.path} fill="#00d1f8" /><path clipPath="url(#dr-r)" d={LOGO_DR.path} fill="#ff4b4b" />
      </g>
    </svg></span>
  );
  if (cls === "hf") return <span className="tool-m tm-hf"><svg viewBox="0 0 512 512"><path d={LOGO_HF.path} /></svg></span>;
  if (cls === "cf") return <span className="tool-m tm-cf"><svg viewBox="0 0 520 520"><path d={LOGO_COMFY.path} /></svg></span>;
  return <span className={`tool-m tm-${cls}`}><b>{m}</b></span>;
}
// "Sobre" como apresentação: no desktop a seção fica fixa e o scroll conduz uma cena em capítulos;
// no celular a mesma coreografia roda por tempo quando a seção entra. Som em cada marcação.
const CHAPTERS = [["01", "Quem sou"], ["02", "Trajetória"], ["03", "Ferramentas"]];
function About() {
  const root = useRef(null), card = useRef(null), tlRef = useRef(null), stRef = useRef(null);
  const [hl, setHl] = useState(null);
  const [ch, setCh] = useState(0);
  const move = (e) => {
    if (e.pointerType === "touch") return;
    const r = card.current.getBoundingClientRect();
    gsap.to(card.current, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 8, rotateX: ((e.clientY - r.top) / r.height - 0.5) * -8, duration: 0.8, ease: "power3" });
    card.current.style.setProperty("--px", `${((e.clientX - r.left) / r.width) * 100}%`);
    card.current.style.setProperty("--py", `${((e.clientY - r.top) / r.height) * 100}%`);
    const gx = ((e.clientX - r.left) / r.width - 0.5), gy = ((e.clientY - r.top) / r.height - 0.5);
    gsap.to(".ab-glow", { x: gx * 60, y: gy * 60, scale: 1.12, opacity: 0.95, duration: 0.9, ease: "power3" });
  };
  const leave = () => { gsap.to(card.current, { rotateX: 0, rotateY: 0, duration: 1.2, ease: "elastic.out(1,0.5)" }); gsap.to(".ab-glow", { x: 0, y: 0, scale: 1.04, opacity: 0.7, duration: 1.2, ease: "power3" }); };

  useEffect(() => {
    const el = root.current;
    if (reducedMotion()) { el.classList.add("is-static"); return; }
    const q = (sel) => el.querySelectorAll(sel);
    const cue = (fn) => () => { if (tlRef.current?.__live) fn(); };
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const build = (desk) => {
        const photo = el.querySelector(".ab-photo"), words = q(".ab-title .w"), cats = q(".tcat"), tools = q(".tool");
        const center = () => { const r = photo.getBoundingClientRect(); return innerWidth / 2 - (r.left + r.width / 2) - gsap.getProperty(photo, "x"); };
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tlRef.current = tl;
        // ── 1. íris: foto nasce no centro, nome gigante atravessa por trás
        tl.set(".ab-kin", { xPercent: 12, opacity: 0 })
          .set(photo, { x: desk ? center : 0, scale: desk ? 1.14 : 1, clipPath: "circle(0% at 50% 45%)" })
          .set(".ab-photo img", { scale: 1.35 })
          .set(".ab-head, .ab-chapters", { opacity: 0 })
          .set(words, { yPercent: 115, opacity: 0 })
          .set(".ab-slide", { autoAlpha: 0, y: 40 })
          .set(".ab-light", { xPercent: -120 })
          .to(".ab-kin", { opacity: 1, xPercent: -8, duration: 2.4, ease: "none" }, 0)
          .fromTo(".ab-kin", { letterSpacing: "0.02em" }, { letterSpacing: "-0.06em", duration: 2.4, ease: "power2.out" }, 0)
          .call(cue(() => { sfx.whoosh(0.9, true, 0.07); }), null, 0.05)
          .to(photo, { clipPath: "circle(75% at 50% 45%)", duration: 1.3, ease: "expo.inOut" }, 0.2)
          .to(".ab-photo img", { scale: 1.12, duration: 1.6, ease: "power2.out" }, 0.2)
          .call(cue(() => { if (!sfx.ok()) return; sfx.impact(sfx.ctx.currentTime, 0.25); sfx.shimmer(0.014); }), null, 0.75)
          .to(".ab-light", { xPercent: 120, duration: 1.2, ease: "power2.inOut" }, 0.9)
        // ── 2. assenta: foto vai para a coluna, título palavra por palavra
          .to(photo, { x: 0, scale: 1, duration: 1.2, ease: "expo.inOut" }, 2)
          .to(".ab-photo img", { scale: 1, duration: 1.4, ease: "expo.inOut" }, 2)
          .to(".ab-kin", { opacity: 0, xPercent: -20, duration: 1, ease: "power2.in" }, 2)
          .call(cue(() => sfx.whoosh(0.7, false, 0.06, innerWidth * 0.25)), null, 2)
          .to(".ab-head", { opacity: 1, duration: 0.5 }, 2.7)
          .to(words, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.09 }, 2.8);
        words.forEach((_, i) => tl.call(cue(() => sfx.tick(1318 + i * 110, innerWidth * 0.7, 0.02)), null, 2.8 + i * 0.09));
        tl.to(".ab-chapters", { opacity: 1, duration: 0.6 }, 3.3);
        // capítulos: no desktop trocam como slides; no celular empilham
        const slide = (i, at) => {
          const sel = `.ab-slide[data-i="${i}"]`;
          if (!desk) tl.call(() => setCh(i), null, at - 0.01);
          tl.call(cue(() => sfx.reveal()), null, at);
          if (desk && i > 0) tl.to(`.ab-slide[data-i="${i - 1}"]`, { autoAlpha: 0, y: -30, filter: "blur(6px)", duration: 0.6, ease: "power2.in" }, at - 0.1);
          tl.fromTo(sel, { autoAlpha: 0, y: 40, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.9 }, at + (desk && i > 0 ? 0.45 : 0));
          return at + (desk && i > 0 ? 0.45 : 0);
        };
        // ── 3. Quem sou
        let t = slide(0, 3.5);
        tl.fromTo(".ab-slide[data-i='0'] .ab-line", { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.12 }, t + 0.1);
        // ── 4. Trajetória: REC abre, clipes entram, agulha varre até o presente
        t = slide(1, desk ? 5.4 : 5.2);
        tl.fromTo(".traj-now", { clipPath: "inset(0 100% 0 0 round 22px)" }, { clipPath: "inset(0 0% 0 0 round 22px)", duration: 1, ease: "expo.inOut" }, t + 0.15)
          .call(cue(() => { sfx.tick(1000, innerWidth * 0.7, 0.04); setTimeout(() => sfx.tick(1000, innerWidth * 0.7, 0.04), 140); }), null, t + 0.55)
          .fromTo(".traj-corner", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.06, ease: "back.out(3)" }, t + 0.8)
          .fromTo(".traj-clip", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, stagger: 0.18 }, t + 0.9)
          .call(cue(() => sfx.splice(innerWidth * 0.6)), null, t + 0.95).call(cue(() => sfx.splice(innerWidth * 0.75)), null, t + 1.13)
          .fromTo(".traj-ph", { left: 0, right: "auto" }, { left: "calc(100% - 2px)", duration: 1.4, ease: "power2.inOut" }, t + 1.1)
          .call(cue(() => sfx.glitch(0.03, 2)), null, t + 2.4);
        // ── 5. Ferramentas: categorias acendem, cartões viram em 3D, varredura por categoria
        t = slide(2, desk ? 8.4 : 8);
        tl.fromTo(cats, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.07 }, t + 0.1)
          .fromTo(tools, { rotateX: -95, opacity: 0, y: 20, transformOrigin: "50% 0%" }, { rotateX: 0, opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "back.out(1.4)" }, t + 0.4);
        tools.forEach((_, i) => tl.call(cue(() => sfx.glass(innerWidth * (0.55 + (i % 3) * 0.12))), null, t + 0.45 + i * 0.08));
        TOOL_CATS.forEach(([k], i) => tl.call(() => setHl(k), null, t + 1.3 + i * 0.32).call(cue(() => sfx.navTick(i, innerWidth * 0.7)), null, t + 1.3 + i * 0.32));
        tl.call(() => setHl(null), null, t + 1.3 + TOOL_CATS.length * 0.32)
          .fromTo(".ab-cv", { y: 24, opacity: 0, clipPath: "inset(0 100% 0 0 round 22px)" }, { y: 0, opacity: 1, clipPath: "inset(0 0% 0 0 round 22px)", duration: 1, ease: "expo.inOut" }, t + 1.5 + TOOL_CATS.length * 0.32)
          .call(cue(() => { sfx.shimmer(0.02); sfx.chime(); }), null, t + 1.6 + TOOL_CATS.length * 0.32)
          .to({}, { duration: 0.8 });
        if (desk) {
          stRef.current = ScrollTrigger.create({
            trigger: el, start: "top top", end: () => `+=${innerHeight * 2.6}`, pin: true, scrub: 0.5, animation: tl, refreshPriority: -1, invalidateOnRefresh: true,
            onToggle: (st) => { tl.__live = st.isActive; },
            onUpdate: (st) => { const tt = tl.time(); setCh(tt >= 8.7 ? 2 : tt >= 5.7 ? 1 : 0); },
          });
        } else {
          tl.pause();
          ScrollTrigger.create({ trigger: el, start: "top 70%", once: true, onEnter: () => { tl.__live = true; tl.timeScale(1.9).play(); } });
        }
        return () => { tl.kill(); stRef.current = null; };
      };
      mm.add("(min-width: 900px)", () => build(true));
      mm.add("(max-width: 899px)", () => build(false));
    }, el);
    return () => ctx.revert();
  }, []);

  const jump = (i) => { // capítulos clicáveis: rola até o ponto da cena
    const st = stRef.current, tl = tlRef.current;
    if (!st || !tl) return;
    const at = [3.6, 5.6, 8.9][i] / tl.duration();
    window.__lenis?.scrollTo(st.start + (st.end - st.start) * at, { duration: 1.4 });
  };
  const title = "A pessoa por trás da timeline.".split(" ");
  return (
    <section id="sobre" className="about" ref={root}>
      <div className="ab-kin" aria-hidden="true">ALEX ASCENCIO · EDITOR · FILMMAKER ·</div>
      <div className="ab-grid">
        <div className="ab-photo-wrap" onPointerMove={move} onPointerLeave={leave}>
          <div className="ab-photo">
            <img className="ab-glow" src="/media/alex-profile.webp" alt="" aria-hidden="true" />
            <a className="about-photo" ref={card} href={IG} target="_blank" rel="noreferrer" aria-label="Abrir o Instagram de Alex Ascencio (@alexascencioai)">
              <img src="/media/alex-profile.webp" alt="Retrato de Alex Ascencio em fundo vermelho" loading="lazy" />
              <span className="ab-light" aria-hidden="true" />
              <span className="ig-light" aria-hidden="true" />
              <span className="ig-cta" aria-hidden="true">
                <span className="ig-badge"><svg className="ig-ring" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28.5" pathLength="1" /></svg><I.Instagram size={24} /></span>
                <span className="ig-text"><b>@alexascencioai</b><small>Ver no Instagram</small></span>
                <span className="ig-arrow"><I.Arrow size={16} /></span>
              </span>
              <span className="about-tag"><Mark className="about-mark" /><span>Editor & Filmmaker</span></span>
            </a>
          </div>
        </div>
        <div className="ab-copy">
          <div className="ab-head">
            <Eyebrow n="06">Sobre</Eyebrow>
            <h2 className="display ab-title">{title.map((w, i) => <span key={i} className="wm"><span className={`w${i >= 3 ? " em" : ""}`}>{w}</span></span>)}</h2>
          </div>
          <div className="ab-chapters" role="tablist" aria-label="Capítulos">
            {CHAPTERS.map(([n, l], i) => (
              <button key={n} role="tab" aria-selected={ch === i} className={ch === i ? "on" : ch > i ? "done" : ""} onClick={() => jump(i)}>
                <span className="mono">{n}</span>{l}<i><b /></i>
              </button>
            ))}
            <span className="ab-tc mono" aria-hidden="true">SEQ_Sobre · <span>{tc(ch * 20 + 4.5)}</span></span>
          </div>
          <div className="ab-stage">
            <div className="ab-slide" data-i="0">
              <p className="lead ab-line">Sou Alex Ascencio, editor de vídeo e filmmaker. Trabalho entre videoclipes, documentários, cinema e transmissões, do set à finalização.</p>
              <p className="ab-line">Uso IA generativa como ferramenta de produção, com o mesmo critério de um plano filmado: se não passa como real, não entra.</p>
              <p className="ab-line">Também desenvolvo plugins para Premiere e After Effects que aceleram o meu fluxo.</p>
            </div>
            <div className="ab-slide" data-i="1">
              <Trajectory />
            </div>
            <div className="ab-slide" data-i="2">
              <div className="tcats" role="list" onPointerLeave={() => setHl(null)}>
                {TOOL_CATS.map(([k, n, Icon]) => (
                  <span role="listitem" key={k} className={`tcat${hl === k ? " on" : ""}`} onPointerEnter={() => setHl(k)}>
                    <Icon size={16} loop={hl === k} />{n}
                  </span>
                ))}
              </div>
              <div className={`tools${hl ? " has-hl" : ""}`} onPointerLeave={() => setHl(null)}>
                {TOOLS.map(([m, n, c, cls], i) => (
                  <span key={n} className={`tool${hl === c ? " on" : ""}`} style={{ "--d": i }} onPointerEnter={() => setHl(c)}>
                    <ToolIcon cls={cls} m={m} />
                    <span className="tool-t">{n}<small className="mono">{TOOL_CATS.find(([k]) => k === c)[1]}</small></span>
                  </span>
                ))}
              </div>
              <a className="ab-cv" href="/curriculo/" aria-label="Currículo digital de Alex Ascencio">
                <span className="cv-doc"><I.Doc size={26} /></span>
                <span className="cv-t"><b>CURRÍCULO DIGITAL</b><small className="mono">Página instantânea · PDF para baixar</small></span>
                <span className="cv-go"><I.Arrow size={18} /></span>
                <span className="cv-sheen" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── contato (tema claro) ───────── */
// Prazo em calendário: atalhos (2 semanas, 1 mês, 3 meses) + mês navegável; dias passados desabilitados.
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmtDate = (d) => `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
const daysTo = (d) => Math.round((day0(d) - day0(new Date())) / 864e5);
const whenText = (d) => (d ? `até ${d.toLocaleDateString("pt-BR")} (${daysTo(d) === 0 ? "hoje" : `em ${daysTo(d)} dias`})` : "Sem data definida");
function DatePick({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const today = day0(new Date());
  const [view, setView] = useState(() => new Date((value || today).getFullYear(), (value || today).getMonth(), 1));
  const wrap = useRef(null);
  useEffect(() => {
    if (!open) return;
    const out = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", out); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", out); document.removeEventListener("keydown", key); };
  }, [open]);
  const pick = (d) => { onChange(d); setOpen(false); sfx.tick?.(2400); if (d) setView(new Date(d.getFullYear(), d.getMonth(), 1)); };
  const first = view.getDay(), n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const canPrev = view > new Date(today.getFullYear(), today.getMonth(), 1);
  const quick = [["2 semanas", 14], ["1 mês", 30], ["3 meses", 90]];
  return (
    <div className="dp" ref={wrap}>
      <button type="button" className={`dp-btn${value ? " has" : ""}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <I.Clock size={16} />
        <span>{value ? <>{fmtDate(value)}<small>{daysTo(value) === 0 ? "hoje" : `em ${daysTo(value)} dias`}</small></> : "Sem data definida"}</span>
      </button>
      {open && (
        <div className="dp-pop" role="dialog" aria-label="Escolher prazo">
          <div className="dp-quick">
            <button type="button" aria-pressed={!value} onClick={() => pick(null)}>Sem data</button>
            {quick.map(([t, d]) => <button type="button" key={t} aria-pressed={!!value && daysTo(value) === d} onClick={() => pick(addDays(today, d))}>{t}</button>)}
          </div>
          <div className="dp-head">
            <button type="button" aria-label="Mês anterior" disabled={!canPrev} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}><I.Prev size={16} /></button>
            <b>{MESES[view.getMonth()]} <span>{view.getFullYear()}</span></b>
            <button type="button" aria-label="Próximo mês" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}><I.Next size={16} /></button>
          </div>
          <div className="dp-grid" role="grid">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((w, i) => <span key={"w" + i} className="dp-w">{w}</span>)}
            {cells.map((d, i) => d ? (
              <button type="button" key={i} disabled={d < today} aria-label={d.toLocaleDateString("pt-BR")}
                className={`${+d === +today ? "today" : ""} ${value && +d === +day0(value) ? "sel" : ""}`} onClick={() => pick(d)}>{d.getDate()}</button>
            ) : <span key={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
function Contact() {
  const [kind, setKind] = useState("Videoclipe");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", when: null, msg: "" });
  const time = useBrasilia();
  const sheet = useRef(null), canvas = useRef(null);
  useEffect(() => {
    let scene, io, alive = true;
    import("./components/MarkScene").then(({ default: MarkScene }) => {
      if (!alive || !canvas.current) return;
      try { scene = new MarkScene(canvas.current); } catch { canvas.current.classList.add("is-fallback"); return; }
      if (reducedMotion()) { scene.start(); requestAnimationFrame(() => scene.stop()); return; }
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? scene.start() : scene.stop()), { rootMargin: "120px" });
      io.observe(canvas.current);
    });
    const el = sheet.current;
    const light = (e) => { const r = el.getBoundingClientRect(); el.style.setProperty("--lx", `${e.clientX - r.left}px`); el.style.setProperty("--ly", `${e.clientY - r.top}px`); };
    el.addEventListener("pointermove", light);
    return () => { alive = false; io?.disconnect(); scene?.dispose(); el.removeEventListener("pointermove", light); };
  }, []);
  const kinds = ["Videoclipe", "Documentário", "Curta / cinema", "Motion design", "IA generativa", "Evento / ao vivo", "Outro"];
  const body = `Olá, Alex! Sou ${form.name || "—"}.\nProjeto: ${kind}\nPrazo: ${whenText(form.when)}\n\n${form.msg}`;
  const valid = form.name.trim() && form.msg.trim();
  const copy = async () => { try { await navigator.clipboard.writeText(EMAIL); setCopied(true); sfx.chime(); setTimeout(() => setCopied(false), 1800); } catch { location.href = `mailto:${EMAIL}`; } };
  const channels = [
    [I.Whatsapp, "WhatsApp", PHONE, `https://wa.me/${WHATS}`],
    [I.Instagram, "Instagram", "@alexascencioai", IG],
    [I.Linkedin, "LinkedIn", "in/ascencioalexgabriel", LI],
  ];
  return (
    <section id="contato" className="contact" data-theme="light">
      <div className="contact-sheet" ref={sheet}>
        <div className="contact-top">
          <div className="contact-head">
            <Eyebrow n="07">Contato</Eyebrow>
            <Title>Vamos fazer o <em>próximo filme.</em></Title>
            <p className="reveal">Conte a ideia, o formato e o prazo. Eu respondo com um caminho de produção.</p>
            <div className="status reveal">
              <span><i className="live" /> Agenda aberta</span>
              <span><I.Clock size={15} /> {time} · Brasília</span>
              <span><I.Pin size={15} /> Remoto e presencial</span>
            </div>
          </div>
          <div className="mark3d">
            <span className="mark3d-floor" aria-hidden="true" />
            <canvas ref={canvas} data-grab aria-label="Marca Alex Ascencio em 3D. Arraste para girar." role="img" />
            <span className="mark3d-hint mono" aria-hidden="true"><span className="mark3d-dot" /> Arraste para girar</span>
          </div>
        </div>

        <div className="contact-grid">
          <div className="contact-side">
            <div className="channel is-mail reveal">
              <a className="ch-main" href={`mailto:${EMAIL}`}>
                <span className="ch-icon"><I.Mail size={19} /></span>
                <span className="ch-text"><b>E-mail</b><span>{EMAIL}</span></span>
              </a>
              <button type="button" className="ch-copy" onClick={copy} aria-label="Copiar e-mail">{copied ? <I.Check size={15} /> : <I.Copy size={15} />}<span>{copied ? "Copiado" : "Copiar"}</span></button>
            </div>
            {channels.map(([Icon, n, h, url], i) => (
              <a key={n} href={url} target="_blank" rel="noreferrer" className="channel reveal" style={{ "--d": i + 1 }}>
                <span className="ch-icon"><Icon size={19} /></span>
                <span className="ch-text"><b>{n}</b><span>{h}</span></span>
                <span className="ch-arrow"><I.Arrow size={14} /></span>
              </a>
            ))}
            <div className="process reveal" style={{ "--d": 4 }}>
              <div className="process-head"><span className="mono">Como o projeto anda</span><I.Film size={17} loop /></div>
              <ol>
                {[["Briefing", "Você conta a ideia, o formato e o prazo."], ["Caminho de produção", "Eu devolvo etapas, entregas e cronograma."], ["Rascunho aprovado", "O corte é validado antes do render final e do 4K."], ["Master", "Entrega por destino: 16:9, 9:16 e áudio no LUFS certo."]].map(([t, d], i) => (
                  <li key={t} style={{ "--i": i }}><span className="process-n mono">0{i + 1}</span><span><b>{t}</b><small>{d}</small></span></li>
                ))}
              </ol>
            </div>
          </div>

          <form className="brief reveal" onSubmit={(e) => { e.preventDefault(); if (valid) window.open(`https://wa.me/${WHATS}?text=${encodeURIComponent(body)}`, "_blank", "noopener"); }}>
            <div className="brief-head">
              <div><b>Briefing rápido</b><span>Um minuto. Você escolhe por onde enviar.</span></div>
              <span className="brief-ic"><I.Clapper size={20} loop /></span>
            </div>
            <fieldset>
              <legend className="mono">Tipo de projeto</legend>
              <div className="kinds">
                {kinds.map((k) => <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}
              </div>
            </fieldset>
            <div className="row">
              <label><span className="mono">Seu nome</span><input required maxLength={120} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Como posso te chamar?" /></label>
              <div className="dp-field"><span className="mono">Prazo</span><DatePick value={form.when} onChange={(d) => setForm({ ...form, when: d })} /></div>
            </div>
            <label><span className="mono">Sobre o projeto</span><textarea required rows={3} maxLength={2500} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="Ideia, referências, formato de entrega (16:9, 9:16), duração…" /></label>
            <div className="brief-actions">
              <Btn as="button" type="submit" icon={<I.Whatsapp size={15} />} disabled={!valid}>Enviar no WhatsApp</Btn>
              <Btn href={valid ? `mailto:${EMAIL}?subject=${encodeURIComponent(`Projeto: ${kind}`)}&body=${encodeURIComponent(body)}` : undefined} variant="ghost" icon={<I.Mail size={15} />} aria-disabled={!valid} onClick={(e) => !valid && e.preventDefault()}>Enviar por e-mail</Btn>
            </div>
            <small className="brief-note">Nada é armazenado aqui. O texto abre pronto no seu WhatsApp ou e-mail.</small>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ───────── rodapé ───────── */
function Footer() {
  const time = useBrasilia();
  return (
    <footer className="footer">
      <Mark className="footer-watermark" />
      <div className="footer-cta">
        <div>
          <span className="mono">Próximo projeto</span>
          <p>Tem uma história <em>para contar?</em></p>
        </div>
        <div className="footer-cta-r">
          <Btn href="#contato" size="lg">Vamos conversar</Btn>
          <span className="mono footer-av"><i className="live" /> Agenda aberta · {time} em Brasília</span>
        </div>
      </div>
      <div className="footer-cols">
        <div className="footer-brand">
          <Lockup h={30} />
          <p>Editor de vídeo e filmmaker. Edição, cor, motion e IA generativa com acabamento de cinema.</p>
          <div className="footer-social">
            <a href={IG} target="_blank" rel="noreferrer" aria-label="Instagram"><I.Instagram size={18} /></a>
            <a href={LI} target="_blank" rel="noreferrer" aria-label="LinkedIn"><I.Linkedin size={18} /></a>
            <a href={`https://wa.me/${WHATS}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><I.Whatsapp size={18} /></a>
            <a href={`mailto:${EMAIL}`} aria-label="E-mail"><I.Mail size={18} /></a>
          </div>
        </div>
        <nav aria-label="Rodapé"><span className="mono">Navegação</span>{NAV.map(([h, t]) => <RollLink key={h} href={h}>{t}</RollLink>)}<RollLink href="#contato">Contato</RollLink></nav>
        <div><span className="mono">Serviços</span>{SERVICES.map(([, t]) => <RollLink key={t} href="#lab">{t}</RollLink>)}</div>
        <div>
          <span className="mono">Contato</span>
          <RollLink href={`mailto:${EMAIL}`}>E-mail</RollLink>
          <RollLink href={`https://wa.me/${WHATS}`} target="_blank" rel="noreferrer">{PHONE}</RollLink>
          <RollLink href={IG} target="_blank" rel="noreferrer">Instagram</RollLink>
          <RollLink href={LI} target="_blank" rel="noreferrer">LinkedIn</RollLink>
          <RollLink href="/curriculo/">Currículo digital</RollLink>
        </div>
        <div className="footer-info">
          <span className="mono">Atendimento</span>
          <p><I.Pin size={15} /> Brasil · remoto e presencial</p>
          <p><I.Clock size={15} /> Horário de Brasília (UTC−3)</p>
        </div>
      </div>
      <div className="footer-row">
        <span>© {new Date().getFullYear()} Alex Ascencio. Todos os direitos reservados.</span>
        <span className="footer-made mono">Editor & Filmmaker · Criar. Contar. Impactar.</span>
        <Magnetic><a href="#top" className="top-btn" aria-label="Voltar ao topo"><I.Arrow size={16} style={{ transform: "rotate(-45deg)" }} /></a></Magnetic>
      </div>
    </footer>
  );
}

/* ───────── app ───────── */
export default function App() {
  const [project, setProject] = useState(null);
  const [host, setHost] = useState(null);
  const [demo, setDemo] = useState(false);
  const [hint, setHint] = useState(false);
  useEffect(() => { const f = (e) => setHint(e.detail); window.addEventListener("sfx:hint", f); return () => window.removeEventListener("sfx:hint", f); }, []);
  useEffect(() => { // o tour abre e fecha o player de verdade
    const o = (e) => setProject(PROJECTS.find((p) => p.id === e.detail.id) || null), c = () => setProject(null);
    window.addEventListener("demo:open", o); window.addEventListener("demo:close", c);
    return () => { window.removeEventListener("demo:open", o); window.removeEventListener("demo:close", c); };
  }, []);
  const stopDemo = useRef(null);
  const toggleDemo = () => {
    if (stopDemo.current) { stopDemo.current(); return; }
    setDemo(true);
    sfx.unlock(); sfx.riser(1.1);
    stopDemo.current = runDemo({ onEnd: () => { stopDemo.current = null; setDemo(false); } });
  };
  // controle por gestos: MediaPipe só carrega no clique (chunk separado)
  const [gest, setGest] = useState(false);
  const stopGest = useRef(null);
  const toggleGest = async () => {
    if (stopGest.current) { stopGest.current(); return; }
    setGest(true); sfx.unlock();
    stopGest.current = () => {};
    const { default: start } = await import("./gesture/GestureControl");
    stopGest.current = start({
      onEnd: () => { stopGest.current = null; setGest(false); },
      // o que os gestos e a voz podem acionar no site
      actions: {
        tour: () => { if (!stopDemo.current) toggleDemo(); },
        stopTour: () => stopDemo.current?.(),
        sound: (on) => sfx.set(on),
        closePlayer: () => setProject(null),
      },
    });
  };
  const fieldCanvas = useRef(null);
  const root = useRef(null);

  useLayoutEffect(() => {
    const reduced = reducedMotion();
    let lenis, tick;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1 });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      lenis.on("scroll", ({ direction, scroll }) => document.documentElement.classList.toggle("nav-hidden", direction === 1 && scroll > innerHeight * 0.9));
      let calm;
      lenis.on("scroll", ({ velocity }) => { sfx.scrollAir(velocity); clearTimeout(calm); calm = setTimeout(() => sfx.scrollAir(0), 140); });
      tick = (t) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      // lagSmoothing padrão (500 ms / 33 ms): com 0, uma travada no carregamento (shader, decode)
      // faz o GSAP pular a abertura inteira de uma vez
      gsap.ticker.lagSmoothing(500, 33);
      lenis.stop();
    }
    // teletransporte: a tela ondula (turbulência + deslocamento + RGB split), salta no pico e se recompõe no destino
    const chromium = !!navigator.userAgentData?.brands?.some((b) => /Chrom/.test(b.brand));
    const lite = matchMedia("(pointer: coarse), (max-width: 760px)").matches; // celular: sem filtro SVG em tela cheia
    let warping = false;
    const speed = new Speedforce();
    const teleport = (el, x, y) => {
      if (!lenis || reduced) { el.scrollIntoView(); return; }
      if (warping) return;
      warping = true;
      sfx.teleport(x);
      speed.burst(x, y, 0.28);
      const veil = document.querySelector(".warp"), ring = veil.querySelector(".warp-ring");
      const turb = document.querySelector("#warp feTurbulence"), maps = document.querySelectorAll("#warp feDisplacementMap");
      const o = { s: 0, t: 0 };
      const paint = () => {
        turb.setAttribute("baseFrequency", `${(0.02 + o.s * 0.0004).toFixed(5)} ${(0.0008 + o.s * 0.000004).toFixed(5)}`); // faixas verticais: borrão de hipervelocidade
        turb.setAttribute("seed", String(1 + Math.round(o.t * 40)));
        maps[0].setAttribute("scale", (o.s * 0.7).toFixed(1));
        maps[1].setAttribute("scale", (o.s * 1.35).toFixed(1));
        if (!chromium && !lite) veil.style.backdropFilter = `blur(${(o.s / 14).toFixed(1)}px)`;
      };
      veil.style.setProperty("--x", `${x}px`); veil.style.setProperty("--y", `${y}px`);
      veil.classList.add("on", lite ? "is-lite" : chromium ? "is-svg" : "is-blur");
      gsap.timeline({ onComplete: () => { veil.classList.remove("on", "is-svg", "is-blur", "is-lite"); veil.style.backdropFilter = ""; warping = false; } })
        .to(o, { s: 130, t: 0.5, duration: 0.28, ease: "power3.in", onUpdate: paint })
        .fromTo(ring, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 1, ease: "expo.out" }, 0)
        .fromTo(veil, { "--flash": 0 }, { "--flash": 1, duration: 0.28, ease: "power2.in" }, 0)
        .add(() => { lenis.scrollTo(el, { immediate: true, force: true }); ScrollTrigger.update(); }, 0.28)
        .to(o, { s: 0, t: 1, duration: 0.55, ease: "expo.out", onUpdate: paint }, 0.28)
        .to(veil, { "--flash": 0, duration: 0.55, ease: "power3.out" }, 0.28);
    };
    const onAnchor = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      teleport(el, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
    };
    document.addEventListener("click", onAnchor);

    /* ── som: desbloqueio no primeiro gesto, hover/clique delegados, faíscas nas partículas ── */
    const unlock = () => sfx.unlock();
    ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));
    let hov = null, px = 0, py = 0, pt = 0;
    const onOver = (e) => {
      const t = e.target instanceof Element ? e.target : null;
      const el = t?.closest("a, button, [data-cursor], .floater, .tcat, .tool, .traj-clip, .traj-now, .process li");
      if (el === hov) return;
      hov = el;
      if (!el) return;
      const x = e.clientX;
      if (el.closest(".nav-links")) sfx.navTick([...el.parentElement.querySelectorAll("a")].indexOf(el), x);
      else if (el.hasAttribute("data-cursor")) sfx.projector(x);
      else if (el.closest(".floater") && !el.closest("button")) sfx.glass(x);
      else sfx.tick(el.matches(".tcat, .tool, .traj-clip, .process li") ? 1760 : 2350, x, 0.022);
    };
    const onDown = (e) => { const a = e.target instanceof Element && e.target.closest("a, button"); if (a && !a.matches('a[href^="#"]')) sfx.thock(e.clientX); };
    const onPMove = (e) => {
      const now = performance.now(), sp = Math.hypot(e.clientX - px, e.clientY - py) / Math.max(1, now - pt);
      px = e.clientX; py = e.clientY; pt = now;
      if (sp > 1.1 && (window.__lenis?.scroll ?? scrollY) < innerHeight * 0.9 && Math.random() < 0.55) sfx.sparkle(e.clientX, e.clientY);
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onPMove, { passive: true });

    let field, live = reduced, morph = 0, fade = 1;
    try {
      field = new ParticleField(fieldCanvas.current);
      if (reduced) field.renderOnce(); // sem movimento: um quadro; com movimento, liga quando a cortina abre
    } catch { /* sem WebGL */ }

    const ctx = gsap.context(() => {
      if (reduced) { gsap.set(".preloader", { display: "none" }); return; }

      /* ── abertura: estado inicial antes do primeiro paint (a hero nunca aparece antes da hora) ── */
      gsap.set(".hero-word-inner", { perspective: 900 });
      gsap.set(".hero-word .ch", { yPercent: 118, rotateX: -75, opacity: 0, transformOrigin: "50% 100%" });
      gsap.set(".hero-person-in", { yPercent: 9, scale: 1.08, opacity: 0 });
      gsap.set(".hero-haze", { opacity: 0 });
      gsap.set(".fl-in", { opacity: 0, scale: 0.72, y: 40 });
      gsap.set(".nav > *", { y: -26, opacity: 0 });
      gsap.set(".hero-intro .line > span", { yPercent: 115 });
      gsap.set(".hero-ctas .magnetic, .hero-scroll", { y: 24, opacity: 0 });
      gsap.set(".pre-lockup", { clipPath: "inset(0 100% 0 0)" });
      gsap.set(".pre-meta", { opacity: 0, y: 10 });

      const o = { p: 0 };
      const paint = () => {
        const t = document.querySelector(".pre-tc"), b = document.querySelector(".pre-bar i");
        if (t) t.textContent = tc(o.p * 2);
        if (b) b.style.transform = `scaleX(${o.p})`;
      };
      sfx.tryAutoplay(); // com permissão de som no site, abertura e trilha tocam sem clique
      const intro = gsap.timeline({ onStart: () => setTimeout(() => sfx.introPre(1.4), 60) });
      intro.to(".pre-lockup", { clipPath: "inset(0 0% 0 0)", duration: 0.75, ease: "expo.inOut" })
        .to(".pre-meta", { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, "-=0.35")
        .to(o, { p: 0.82, duration: 0.8, ease: "power2.out", onUpdate: paint }, "<");

      const img = document.querySelector(".hero-person img");
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const loaded = Promise.all([
        document.fonts?.ready,
        img?.decode ? img.decode().catch(() => {}) : null,
        new Promise((r) => intro.eventCallback("onComplete", r)),
        wait(700),
      ]);
      const reveal = () => {
        gsap.timeline()
          .to(o, { p: 1, duration: 0.35, ease: "power1.inOut", onUpdate: paint })
          .to(".pre-center", { opacity: 0, y: -14, filter: "blur(6px)", duration: 0.5, ease: "power2.in" }, "+=0.08")
          .fromTo(".pre-slit", { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.55, ease: "expo.inOut" }, "-=0.2")
          .addLabel("open")
          .to(".pre-top", { yPercent: -100, duration: 1.3, ease: "expo.inOut" }, "open")
          .to(".pre-bot", { yPercent: 100, duration: 1.3, ease: "expo.inOut" }, "open")
          .to(".pre-slit", { scaleY: 60, opacity: 0, duration: 0.9, ease: "expo.out" }, "open+=0.1")
          .add(() => { live = true; field?.start(); }, "open")
          .add(() => { window.__lenis?.start(); ScrollTrigger.sort(); ScrollTrigger.refresh(); }, "open+=0.6")
          .to(".hero-haze", { opacity: 1, duration: 2, ease: "power2.out" }, "open+=0.25")
          .to(".hero-person-in", { yPercent: 0, scale: 1, opacity: 1, duration: 2, ease: "expo.out" }, "open+=0.3")
          .to(".hero-word .ch", { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.6, ease: "expo.out", stagger: { each: 0.055, from: "center" } }, "open+=0.35")
          .to(".nav > *", { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.08, clearProps: "transform" }, "open+=0.7")
          .to(".hero-intro .line > span", { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.08 }, "open+=0.75")
          .to(".fl-in", { opacity: 1, scale: 1, y: 0, duration: 1.6, ease: "elastic.out(1, 0.75)", stagger: 0.09, clearProps: "transform" }, "open+=0.85")
          .to(".hero-ctas .magnetic, .hero-scroll", { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.08, clearProps: "transform" }, "open+=1")
          .set(".preloader", { display: "none" });
      };
      // sem portão: a abertura roda sozinha. O navegador só libera áudio após um gesto,
      // então a trilha da abertura só toca se o áudio já estiver liberado.
      loaded.then(() => { sfx.introOpen(0.93); reveal(); });

      /* ── hero: saída por scroll (só transform/opacity: nada de filter na foto) ── */
      const mm = gsap.matchMedia();
      gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
        .to(".hero-word-inner", { yPercent: -30, scale: 0.94, opacity: 0, ease: "none", duration: 1 }, 0)
        .to(".hero-person-scroll", { yPercent: 7, scale: 0.92, opacity: 0.15, ease: "none", duration: 1 }, 0)
        .to(".hero-haze", { opacity: 0.2, ease: "none", duration: 1 }, 0)
        .to(".hero-floats", { y: -90, opacity: 0, ease: "none", duration: 0.4 }, 0)
        .to(".hero-bottom", { y: -50, opacity: 0, ease: "none", duration: 0.5 }, 0);
      ScrollTrigger.create({ trigger: ".hero", start: "top top", end: "bottom top", onUpdate: (s) => { const el = document.querySelector(".js-tc"); if (el) el.textContent = tc(s.progress * 12); } });
      // manifesto (pin primeiro para as posições seguintes considerarem o espaçador)
      gsap.timeline({ scrollTrigger: { trigger: "#manifesto", start: "top top", end: () => `+=${innerHeight * 1.6}`, scrub: true, pin: ".manifesto-pin" } })
        .fromTo(".manifesto .w", { opacity: 0.1 }, { opacity: 1, stagger: 0.08, ease: "none" })
        .from(".stats > div", { y: 30, opacity: 0, stagger: 0.1 }, ">-0.3");
      ScrollTrigger.create({
        trigger: ".stats", start: "top 85%", once: true,
        onEnter: () => document.querySelectorAll(".stats dd[data-count]").forEach((dd) => {
          const c = { v: 0 }, n = +dd.dataset.count;
          gsap.to(c, { v: n, duration: 1.6, ease: "power3.out", onUpdate: () => (dd.textContent = Math.round(c.v)) });
        }),
      });
      // partículas → marca → somem
      ScrollTrigger.create({ trigger: "#manifesto", start: "top 90%", end: "top top", scrub: true, onUpdate: (s) => { field?.setMorph(s.progress); morph = s.progress; sfx.padLevel(morph * fade); } });
      ScrollTrigger.create({
        trigger: "#manifesto", start: "bottom bottom", end: "bottom 35%", scrub: true,
        onUpdate: (s) => { gsap.set(fieldCanvas.current, { opacity: 1 - s.progress }); fade = 1 - s.progress; sfx.padLevel(morph * fade); if (live) (s.progress >= 0.999 ? field?.stop() : field?.start()); },
      });
      // filmes: horizontal
      mm.add("(min-width: 900px)", () => {
        const track = document.querySelector(".featured-track");
        const dist = () => { const last = track.lastElementChild; return Math.max(0, last.offsetLeft + last.offsetWidth + parseFloat(getComputedStyle(track).paddingLeft) - innerWidth); };
        const tween = gsap.to(track, {
          x: () => -dist(), ease: "none",
          scrollTrigger: {
            trigger: "#filmes", start: "top top", end: () => `+=${dist()}`, scrub: 0.8, pin: ".featured-pin", invalidateOnRefresh: true,
            onUpdate: (s) => {
              const i = Math.min(FEATURED.length, Math.floor(s.progress * FEATURED.length) + 1);
              const c = document.querySelector(".js-fcount"); if (c) c.textContent = `0${i} / 0${FEATURED.length}`;
              gsap.set(".js-fbar", { scaleX: s.progress });
            },
          },
        });
        gsap.utils.toArray(".fcard").forEach((card) => {
          const im = card.querySelector(".fcard-media img");
          if (im) gsap.fromTo(im, { xPercent: -7 }, { xPercent: 7, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
          gsap.fromTo(card, { scale: 0.92, opacity: 0.55 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 95%", end: "left 45%", scrub: true } });
        });
      });
      gsap.from(".featured-track", { yPercent: 18, opacity: 0, ease: "none", scrollTrigger: { trigger: "#filmes", start: "top 95%", end: "top 25%", scrub: true } });
      // lab: moldura arredondada que se expande até sangrar a tela
      gsap.fromTo(".lab-frame", { clipPath: "inset(7% 5% 7% 5% round 44px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: ".lab", start: "top 90%", end: "top 5%", scrub: true } });
      gsap.fromTo(".lab-canvas", { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".lab", start: "top bottom", end: "top top", scrub: true } });
      // títulos: máscara por linha
      gsap.utils.toArray(".js-title .title-inner").forEach((el) => {
        gsap.fromTo(el, { yPercent: 105, rotate: 2.5 }, { yPercent: 0, rotate: 0, duration: 0.95, ease: "expo.out", onStart: () => sfx.reveal(), scrollTrigger: { trigger: el.parentElement, start: "top 95%", once: true } });
      });
      gsap.utils.toArray(".eyebrow").filter((el) => !el.closest(".about")).forEach((el) => {
        gsap.from(el, { opacity: 0, x: -16, duration: 0.7, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 96%", once: true } });
      });
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el, { y: 28, opacity: 0, duration: 0.75, ease: "expo.out", delay: (+getComputedStyle(el).getPropertyValue("--d") || 0) * 0.05, scrollTrigger: { trigger: el, start: "top 96%", once: true } });
      });
      // grade: cascata por linha (o tilt mora em .card-media, então não há briga de transform)
      // grade: reveal cinematográfico por linha — máscara abre de baixo, imagem assenta do zoom, texto entra depois
      gsap.set(".grid .card-media", { clipPath: "inset(100% 0% 0% 0% round 16px)" });
      gsap.set(".grid .card-media img", { scale: 1.3 });
      gsap.set(".grid .card-info", { y: 22, opacity: 0 });
      ScrollTrigger.batch(".grid .card", {
        start: "top 94%", once: true,
        onEnter: (els) => {
          const m = els.map((e) => e.querySelector(".card-media")), im = els.map((e) => e.querySelector(".card-media img")), inf = els.map((e) => e.querySelector(".card-info"));
          gsap.to(m, { clipPath: "inset(0% 0% 0% 0% round 16px)", duration: 1.25, ease: "expo.inOut", stagger: 0.09, clearProps: "clipPath" });
          gsap.to(im, { scale: 1, duration: 1.8, ease: "expo.out", stagger: 0.09, delay: 0.15, clearProps: "transform" });
          gsap.to(inf, { y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.09, delay: 0.45, clearProps: "transform,opacity" });
          sfx.whoosh(0.9, true, 0.03);
        },
      });
      // trilha: entra em "Filmes em destaque" e segue até o fim; some ao voltar para cima
      ScrollTrigger.create({ trigger: "#filmes", start: "top 65%", end: "max", onEnter: () => sfx.music(true), onLeaveBack: () => sfx.music(false) });
      // contato: folha clara sobe e arredonda
      gsap.fromTo(".contact-sheet", { scale: 0.94, borderRadius: 64 }, { scale: 1, borderRadius: 40, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "top 20%", scrub: true } });
      ScrollTrigger.create({ trigger: ".contact-sheet", start: "top 44px", end: "bottom 44px", toggleClass: { targets: document.documentElement, className: "nav-light" } });
      // rodapé
      gsap.fromTo(".footer-watermark", { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });
    }, root);

    return () => {
      ctx.revert();
      document.removeEventListener("click", onAnchor);
      speed.dispose();
      ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.removeEventListener(ev, unlock, true));
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onPMove);
      field?.dispose();
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);

  return (
    <div ref={root}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="aa-mark" viewBox="0 0 262 151"><path d={MARK_PATH} fill="currentColor" /></symbol>
        <filter id="warp" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.018" numOctaves="2" seed="1" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" result="d2" />
          <feColorMatrix in="d1" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feColorMatrix in="d2" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
          <feBlend in="r" in2="gb" mode="screen" />
        </filter>
      </svg>
      <div className="warp" aria-hidden="true"><i className="warp-ring" /></div>
      <Preloader />
      <Cursor host={host} />
      <canvas ref={fieldCanvas} className="field" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <a className="skip" href="#filmes">Pular para os filmes</a>
      <Nav />
      <main>
        <Hero open={setProject} onDemo={toggleDemo} demo={demo} onGest={toggleGest} gest={gest} />
        <Manifesto />
        <Featured open={setProject} />
        <Lab />
        <Method />
        <Clients />
        <Archive open={setProject} />
        <About />
        <Contact />
      </main>
      <Footer />
      <button className={`snd-hint${hint ? " on" : ""}`} onClick={() => sfx.unlock()} aria-hidden={!hint} tabIndex={hint ? 0 : -1}>
        <span className="snd-bars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ "--i": i }} />)}</span>
        Toque para ouvir a trilha
      </button>
      {demo && <div className="demo-hud" role="status"><span className="rec" /> Tour do site · mexa o mouse ou role para assumir</div>}
      {project && <Player project={project} onClose={() => setProject(null)} onHost={setHost} onNav={(d) => setProject((c) => PROJECTS[(PROJECTS.indexOf(c) + d + PROJECTS.length) % PROJECTS.length])} />}
    </div>
  );
}
