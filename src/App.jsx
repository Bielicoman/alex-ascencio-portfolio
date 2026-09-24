import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { PROJECTS } from "./projects";
import { MARK_PATH, WM_PATH, WM_W, WM_H } from "./brand";
import ParticleField from "./components/ParticleField";
import LensField from "./components/LensField";
import * as I from "./components/Icons";

gsap.registerPlugin(ScrollTrigger);

const WHATS = "5515997569880";
const EMAIL = "ascencioalexgabriel@gmail.com";
const IG = "https://instagram.com/alexascencioai";
const LI = "https://www.linkedin.com/in/ascencioalexgabriel/";
const thumb = (p) => `/media/${p.id}.webp`;
const short = (p) => p.title.split(/\||—/)[0].trim();
const artistOf = (p) => (p.title.split(/\||—/)[1] || p.cat).trim();
const FEATURED = [25, 24, 14, 16, 7, 21].map((id) => PROJECTS.find((p) => p.id === id));
const CATS = ["Todos", ...new Set(PROJECTS.map((p) => p.cat))];
// altura em px calculada por área óptica equivalente (ver README)
const CLIENTS = [
  ["Kiger", "kiger", 27.3], ["MAB", "mab", 50], ["UNASP", "unasp", 24.1], ["Novo Tempo", "novotempo", 45],
  ["Prisma Brasil", "prisma", 52], ["Dilson Castro", "dilson", 38.1], ["Via Global", "via-global", 33.6], ["Entre Aspas", "entre-aspas", 27.5],
];
const ARTISTS = ["Quarteto Elo", "Gabriella Stehling", "Communion", "Kati Carvalho", "Califórnia Dreams", "Willian Krusty", "Pedro Valença", "Prisminha", "Dunamis Studio", "Patrícia de Paiva", "CPB"];
const NAV = [["#filmes", "Filmes"], ["#lab", "Lab"], ["#metodo", "Método"], ["#arquivo", "Seleção"], ["#sobre", "Sobre"]];
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const fps = 24;
const tc = (sec) => {
  const f = Math.floor(sec * fps);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(f / (fps * 3600)))}:${p(Math.floor(f / (fps * 60)) % 60)}:${p(Math.floor(f / fps) % 60)}:${p(f % fps)}`;
};

/* ───────── base ───────── */
function Mark({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 262 151" aria-hidden="true">
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  );
}
// Logotipo: marca AA + fio + "Alex Ascencio" (A's derivados da marca)
function Lockup({ height = 28, className = "", mark = "var(--red-hi)" }) {
  const mh = WM_H, mw = (mh * 262) / 151, gap = 400, W = mw + gap * 2 + WM_W;
  return (
    <svg className={`lockup ${className}`} viewBox={`0 0 ${W.toFixed(0)} ${mh}`} style={{ height }} role="img" aria-label="Alex Ascencio">
      <g transform={`scale(${(mh / 151).toFixed(4)})`}><path d={MARK_PATH} fill={mark} /></g>
      <rect x={mw + gap - 18} y={mh * 0.08} width="36" height={mh * 0.92} fill="currentColor" opacity=".3" />
      <path d={WM_PATH} fill="currentColor" transform={`translate(${mw + gap * 2} 0)`} />
    </svg>
  );
}
function Wordmark({ height = 28, className = "" }) {
  return <svg className={`wordmark ${className}`} viewBox={`0 0 ${WM_W} ${WM_H}`} style={{ height }} role="img" aria-label="Alex Ascencio"><path d={WM_PATH} fill="currentColor" /></svg>;
}
function Magnetic({ children, strength = 0.3 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(pointer: coarse)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "elastic.out(1, 0.45)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "elastic.out(1, 0.45)" });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * strength);
      yTo((e.clientY - r.top - r.height / 2) * strength);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [strength]);
  return <span ref={ref} className="magnetic">{children}</span>;
}
function Btn({ as = "a", variant = "primary", children, icon = <I.Arrow size={15} />, ...props }) {
  const Tag = as;
  return (
    <Magnetic>
      <Tag className={`btn btn-${variant}`} {...props}>
        <span className="btn-label"><span>{children}</span><span aria-hidden="true">{children}</span></span>
        <span className="btn-icon"><span>{icon}</span><span aria-hidden="true">{icon}</span></span>
      </Tag>
    </Magnetic>
  );
}
function Eyebrow({ children, n }) {
  return <span className="eyebrow">{n && <b>{n}</b>}{children}</span>;
}
function Title({ children, className = "" }) {
  return <h2 className={`display js-title ${className}`}><span className="title-inner">{children}</span></h2>;
}

/* ───────── cursor: seta 3D arredondada ───────── */
function Cursor() {
  const wrap = useRef(null), tilt = useRef(null), glow = useRef(null), label = useRef(null);
  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");
    const rx = gsap.quickTo(tilt.current, "rotateX", { duration: 0.9, ease: "elastic.out(1, 0.4)" });
    const ry = gsap.quickTo(tilt.current, "rotateY", { duration: 0.9, ease: "elastic.out(1, 0.4)" });
    const rz = gsap.quickTo(tilt.current, "rotateZ", { duration: 0.9, ease: "elastic.out(1, 0.4)" });
    const gx = gsap.quickTo(glow.current, "x", { duration: 0.55, ease: "power3" }), gy = gsap.quickTo(glow.current, "y", { duration: 0.55, ease: "power3" });
    let lx = 0, ly = 0, lt = performance.now(), idle;
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    const move = (e) => {
      const x = e.clientX, y = e.clientY, t = performance.now(), dt = Math.max(8, t - lt);
      const vx = ((x - lx) / dt) * 16, vy = ((y - ly) / dt) * 16;
      wrap.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      gx(x); gy(y);
      ry(clamp(vx * 2.2, 40)); rx(clamp(-vy * 2.2, 40)); rz(clamp(vx * 0.9, 16));
      tilt.current.style.setProperty("--sx", `${50 + clamp(vx * 3, 45)}%`);
      tilt.current.style.setProperty("--sy", `${50 + clamp(vy * 3, 45)}%`);
      lx = x; ly = y; lt = t;
      clearTimeout(idle); idle = setTimeout(() => { rx(0); ry(0); rz(0); }, 90);
      root.classList.add("cursor-live");
    };
    const over = (e) => {
      const t = e.target;
      const media = t.closest("[data-cursor]");
      const text = t.closest("input:not([type=range]), textarea, select");
      const link = t.closest("a, button, label, [role=button]");
      root.classList.toggle("cursor-text", !!text);
      root.classList.toggle("cursor-link", !!link && !media && !text);
      root.classList.toggle("cursor-media", !!media);
      if (media) label.current.textContent = media.getAttribute("data-cursor");
    };
    const down = () => root.classList.add("cursor-down");
    const up = () => root.classList.remove("cursor-down");
    const leave = () => root.classList.remove("cursor-live");
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("pointerleave", leave);
    return () => {
      clearTimeout(idle);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
      root.classList.remove("has-cursor", "cursor-live", "cursor-link", "cursor-media", "cursor-text", "cursor-down");
    };
  }, []);
  return (
    <>
      <div className="cur-glow" ref={glow} aria-hidden="true" />
      <div className="cur" ref={wrap} aria-hidden="true">
        <div className="cur-tilt" ref={tilt}>
          <svg className="cur-arrow" viewBox="0 0 28 28" width="28" height="28">
            <defs>
              <linearGradient id="cur-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--c1)" /><stop offset=".55" stopColor="var(--c2)" /><stop offset="1" stopColor="var(--c3)" />
              </linearGradient>
              <linearGradient id="cur-edge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset=".5" stopColor="#fff" stopOpacity=".15" /><stop offset="1" stopColor="#ff3b3b" stopOpacity=".9" />
              </linearGradient>
            </defs>
            <path className="cur-shape" d="M5.1 3.2c-1.1-.5-2.3.6-1.8 1.7l8.5 20.1c.5 1.2 2.2 1.1 2.6-.1l2.4-7c.2-.4.5-.8 1-1l7-2.4c1.2-.4 1.3-2.1.1-2.6L5.1 3.2z" fill="url(#cur-fill)" stroke="url(#cur-edge)" strokeWidth="1.1" strokeLinejoin="round" />
            <path className="cur-spec" d="M6.2 5.6 12.4 20" stroke="#fff" strokeOpacity=".75" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>
          <span className="cur-shine" />
        </div>
        <div className="cur-label"><I.Play size={10} /><b ref={label}>Assistir</b></div>
      </div>
    </>
  );
}

/* ───────── preloader ───────── */
function Preloader({ onDone: done }) {
  const ref = useRef(null), num = useRef(null), bar = useRef(null);
  const cb = useRef(done);
  useEffect(() => {
    const onDone = () => cb.current();
    if (reducedMotion()) { onDone(); ref.current.style.display = "none"; return; }
    const o = { t: 0 };
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to(o, { t: 1.5, duration: 1.4, ease: "power2.inOut", onUpdate: () => { num.current.textContent = tc(o.t); bar.current.style.transform = `scaleX(${o.t / 1.5})`; } })
      .to(".pre-inner", { y: -30, opacity: 0, duration: 0.5, ease: "power2.in" }, "+=0.05")
      .to(ref.current, { clipPath: "inset(0 0 100% 0 round 0 0 40px 40px)", duration: 1, ease: "expo.inOut" }, "-=0.15")
      .set(ref.current, { display: "none" });
    return () => tl.kill();
  }, []);
  return (
    <div className="preloader" ref={ref} aria-hidden="true">
      <div className="pre-inner">
        <Lockup height={46} className="pre-lockup" />
        <span className="pre-tc" ref={num}>00:00:00:00</span>
        <span className="pre-bar"><i ref={bar} /></span>
      </div>
    </div>
  );
}

/* ───────── navegação ───────── */
function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const pillRef = useRef(null), linksRef = useRef(null);
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
    const r = a.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    gsap.to(pill, { x: r.left - w.left, width: r.width, opacity: 1, duration: 0.6, ease: "expo.out" });
  }, [active]);
  return (
    <header className="nav">
      <a href="#top" className="nav-brand" aria-label="Alex Ascencio, início">
        <Lockup height={22} />
      </a>
      <nav ref={linksRef} className={`nav-links ${open ? "is-open" : ""}`} aria-label="Principal">
        <span className="nav-pill" ref={pillRef} aria-hidden="true" />
        {NAV.map(([h, t], i) => (
          <a key={h} href={h} onClick={() => setOpen(false)} style={{ "--i": i }} aria-current={active === h ? "true" : undefined}>{t}</a>
        ))}
      </nav>
      <div className="nav-right">
        <Btn href="#contato" variant="primary">Vamos conversar</Btn>
        <button className="nav-menu" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span />
        </button>
      </div>
    </header>
  );
}

/* ───────── player ───────── */
function Player({ project, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    const prev = document.activeElement;
    d.showModal();
    window.__lenis?.stop();
    return () => { window.__lenis?.start(); prev?.focus?.({ preventScroll: true }); };
  }, []);
  const watch = project.url?.replace("/embed/", "/watch?v=");
  return (
    <dialog ref={ref} className="player" onCancel={onClose} onClick={(e) => e.target === e.currentTarget && onClose()} aria-labelledby="pl-title">
      <div className="player-card">
        <div className="player-bar">
          <span className="mono">{project.cat} · {project.date.slice(0, 4)} · {project.q}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar"><I.Close size={18} /></button>
        </div>
        <div className="player-frame">
          {project.video ? (
            <video src={project.video} poster={thumb(project)} controls autoPlay playsInline preload="metadata" />
          ) : (
          <iframe
            title={project.title}
            src={`${project.url.replace("www.youtube.com", "www.youtube-nocookie.com")}?autoplay=1&rel=0&modestbranding=1`}
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
function Hero({ open }) {
  const latest = PROJECTS[0];
  const personRef = useRef(null), wordRef = useRef(null);
  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches || reducedMotion()) return;
    const px = gsap.quickTo(personRef.current, "x", { duration: 1.4, ease: "power3" });
    const wx = gsap.quickTo(wordRef.current, "x", { duration: 1.6, ease: "power3" });
    const wy = gsap.quickTo(wordRef.current, "y", { duration: 1.6, ease: "power3" });
    const move = (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      px(nx * 14); wx(nx * -28); wy(ny * -10);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
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
          <img src="/media/alex-cutout.webp" alt="Alex Ascencio, de moletom preto e camiseta branca" width="1086" height="1420" fetchPriority="high" />
        </div>
      </div>

      <div className="hero-chip chip-a hero-fade">
        <span className="chip-icon"><I.Scissors size={16} /></span>
        <div>Editor & filmmaker<small>Clipes · Cinema · Documentário</small></div>
      </div>
      <div className="hero-chip chip-b hero-fade">
        <span className="chip-icon red"><I.Spark size={16} /></span>
        <div>IA com critério<small>Só entra se passar como filmado</small></div>
      </div>

      <div className="hero-bottom">
        <div className="hero-intro hero-fade">
          <p>Edição, cor e motion com acabamento de cinema. <span>A imagem estabelece o lugar; a história entra no tempo certo.</span></p>
          <div className="hero-ctas">
            <Btn href="#filmes" icon={<I.Play size={13} />}>Ver filmes</Btn>
            <Btn href="#contato" variant="glass">Falar comigo</Btn>
          </div>
        </div>
        <button className="now-playing hero-fade" onClick={() => open(latest)} data-cursor="Assistir">
          <span className="np-thumb"><img src={thumb(latest)} alt="" /></span>
          <span className="np-text">
            <small><span className="rec" /> Último lançamento</small>
            <b>{short(latest)}</b>
            <span>{artistOf(latest)} · {latest.q}</span>
          </span>
          <span className="np-play"><I.Play size={12} /></span>
        </button>
      </div>

      <div className="hero-scroll hero-fade" aria-hidden="true">
        <span className="mono js-tc">00:00:00:00</span>
        <span className="scroll-line"><i /></span>
      </div>
      <div className="hero-fadeout" aria-hidden="true" />
    </section>
  );
}

/* ───────── manifesto ───────── */
function Manifesto() {
  const words = "Eu corto pela cena, não pela fala. A imagem estabelece o lugar. A fala entra quando você já sabe onde está.".split(" ");
  const n4k = PROJECTS.filter((p) => p.q === "4K").length;
  const years = PROJECTS.map((p) => +p.date.slice(0, 4));
  const stats = [[PROJECTS.length, "Projetos selecionados"], [n4k, "Entregas em 4K"], [CATS.length - 1, "Formatos"], [`${Math.min(...years)}–${String(Math.max(...years)).slice(2)}`, "Em produção contínua"]];
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
                <div className="fcard-media"><img src={thumb(p)} alt="" loading="lazy" /></div>
                <div className="fcard-shade" />
                <div className="fcard-top"><span className="mono">{String(i + 1).padStart(2, "0")}</span><span className="mono">{p.cat} · {p.date.slice(0, 4)} · {p.q}</span></div>
                <div className="fcard-meta">
                  <h3>{short(p)}</h3>
                  <p>{artistOf(p)}</p>
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
  const services = [
    [I.Scissors, "Edição & montagem", "Ritmo de cinema, corte pela cena e respiro para a história.", "Premiere Pro · DaVinci Resolve"],
    [I.Layers, "Motion design", "Tipografia, marca e transições em camadas editáveis.", "After Effects"],
    [I.Wave, "Cor & áudio", "Look por cena e mix medida em LUFS antes de nivelar.", "Resolve · Lumetri · Pro Tools"],
    [I.Aperture, "IA generativa", "Planos gerados que passam como produção real — ou ficam fora do corte.", "ComfyUI · Higgsfield"],
  ];
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
            {services.map(([Icon, t, d, tools], i) => (
              <article className="service reveal" key={t} style={{ "--d": i }}>
                <div className="service-top"><span className="service-icon"><Icon size={20} /></span><span className="mono">0{i + 1}</span></div>
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

/* ───────── método ───────── */
const V1 = [[0, 1, 24], [1, 2, 14], [2, 3, 7], [3, 4, 16], [4, 10, 1], [10, 17, 21], [17, 23, 12], [23, 30, 18], [30, 37, 13], [37, 44, 23], [44, 50, 2], [50, 56, 9]];
const V2 = [[8, 12], [25, 29], [33, 37.5], [46, 50]];
const V3 = [[18, 21], [40, 42.5]];
const FX = [2, 23, 44];
const RULES = [
  [0, 4, "Abertura em staccato", "3 a 4 planos de ~1 s, com flash de 2 a 3 frames no meio, antes de assentar em planos de 4 a 7 s."],
  [4, 8, "A imagem vem primeiro", "O plano estabelece o lugar. A fala só entra em A1 aos 6 s, quando o espectador já sabe onde está."],
  [8, 18, "Cobertura curta em V2", "Planos de 2 a 6 s sobre os planos longos. O que foi gravado fora do roteiro vira cobertura."],
  [18, 23, "Insert em V3", "Detalhe com speed ramp a ~130% para marcar o tempo da música."],
  [23, 30, "Transição de bloco", "Glitch/datamosh com RGB split, 2 a 3 frames, e whoosh casado no áudio."],
  [30, 56, "Respiro de cinema", "Pausas acima de 0,6 s. Nunca um corte colado no texto. Áudio medido em LUFS por clipe."],
  [56, 60.1, "Assinatura", "Marca parada por 3 a 4 s. O filme termina quando a imagem assenta."],
];
function Method() {
  const [rule, setRule] = useState(0);
  const [shot, setShot] = useState(V1[0][2]);
  useEffect(() => {
    const reduced = reducedMotion();
    const st = ScrollTrigger.create({
      trigger: "#metodo", start: "top top", end: () => `+=${innerHeight * (reduced ? 1 : 2.4)}`, scrub: true, pin: reduced ? false : ".method-pin",
      onUpdate: (s) => {
        const t = s.progress * 60;
        document.querySelector(".ph")?.style.setProperty("left", `${(t / 60) * 100}%`);
        const el = document.querySelector(".js-mtc"); if (el) el.textContent = tc(t);
        setRule(Math.max(0, RULES.findIndex(([a, b]) => t >= a && t < b)));
        const c = V1.find(([a, b]) => t >= a && t < b) || V1[V1.length - 1];
        setShot(t >= 56 ? "end" : c[2]);
        document.querySelector(".monitor")?.classList.toggle("is-glitch", FX.some((f) => Math.abs(t - f) < 0.25));
      },
    });
    return () => st.kill();
  }, []);
  const pct = (a) => `${(a / 60) * 100}%`;
  const [, , title, text] = RULES[rule];
  return (
    <section id="metodo" className="method">
      <div className="method-pin">
        <div className="method-head">
          <Eyebrow n="04">Método</Eyebrow>
          <Title>Como eu penso <em>uma timeline.</em></Title>
        </div>
        <div className="nle">
          <div className="nle-top">
            <div className="monitor">
              {shot === "end" ? (
                <div className="monitor-end"><Lockup height={38} /></div>
              ) : (
                <img key={shot} src={`/media/${shot}.webp`} alt="" />
              )}
              <span className="monitor-tc mono js-mtc">00:00:00:00</span>
              <span className="monitor-label mono">Program · SEQ_Portfolio</span>
            </div>
            <div className="rule" aria-live="polite">
              <div className="rule-steps" aria-hidden="true">{RULES.map((_, i) => <i key={i} className={i <= rule ? "on" : ""} />)}</div>
              <span className="mono rule-count">Regra {String(rule + 1).padStart(2, "0")} / {String(RULES.length).padStart(2, "0")}</span>
              <h3 key={title}>{title}</h3>
              <p key={text}>{text}</p>
            </div>
          </div>
          <div className="tracks" aria-hidden="true">
            <div className="ruler">{Array.from({ length: 13 }, (_, i) => <span key={i} style={{ left: pct(i * 5) }}>{String(i * 5).padStart(2, "0")}</span>)}</div>
            <div className="track"><b>FX</b><div className="lane">{FX.map((f) => <i key={f} className="clip fx" style={{ left: pct(f - 0.2), width: pct(0.4) }} />)}</div></div>
            <div className="track"><b>V3</b><div className="lane">{V3.map(([a, b]) => <i key={a} className="clip v3" style={{ left: pct(a), width: pct(b - a) }}><em>insert 130%</em></i>)}</div></div>
            <div className="track"><b>V2</b><div className="lane">{V2.map(([a, b]) => <i key={a} className="clip v2" style={{ left: pct(a), width: pct(b - a) }}><em>cobertura</em></i>)}</div></div>
            <div className="track"><b>V1</b><div className="lane">
              {V1.map(([a, b, id]) => <i key={a} className="clip v1" style={{ left: pct(a), width: pct(b - a), backgroundImage: `url(/media/${id}.webp)` }} />)}
              <i className="clip sig" style={{ left: pct(56), width: pct(4) }}><em>assinatura</em></i>
            </div></div>
            <div className="track"><b>A1</b><div className="lane">
              {[[6, 16], [19, 29], [31.5, 43], [45, 55]].map(([a, b]) => <i key={a} className="clip a1" style={{ left: pct(a), width: pct(b - a) }}><em>fala</em></i>)}
            </div></div>
            <div className="track"><b>A2</b><div className="lane"><i className="clip a2" style={{ left: 0, width: "100%" }}><em>trilha</em></i></div></div>
            <div className="playhead"><div className="ph"><span /></div></div>
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
function Archive({ open }) {
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const list = useMemo(() => PROJECTS.filter((p) => (cat === "Todos" || p.cat === cat) && norm(`${p.title} ${p.cat}`).includes(norm(q))), [cat, q]);
  const tilt = (e) => {
    if (e.pointerType === "touch") return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -6}deg`);
    el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const reset = (e) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); };
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    ScrollTrigger.refresh();
    if (!reducedMotion()) gsap.fromTo(".grid .card", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.035 });
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
          <button key={p.id} className="card" onClick={() => open(p)} onPointerMove={tilt} onPointerLeave={reset} data-cursor="Assistir" aria-label={`Assistir ${p.title}`}>
            <span className="card-media"><img src={thumb(p)} alt="" loading="lazy" width="640" height="360" /><span className="card-q mono">{p.q}</span></span>
            <span className="card-glare" />
            <span className="card-info">
              <span className="mono">{p.cat} · {p.date.slice(0, 4)}</span>
              <b>{short(p)}</b>
              <span>{artistOf(p)}</span>
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
function About() {
  const card = useRef(null);
  const move = (e) => {
    if (e.pointerType === "touch") return;
    const r = card.current.getBoundingClientRect();
    gsap.to(card.current, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 10, rotateX: ((e.clientY - r.top) / r.height - 0.5) * -10, duration: 0.8, ease: "power3" });
  };
  const leave = () => gsap.to(card.current, { rotateX: 0, rotateY: 0, duration: 1.2, ease: "elastic.out(1,0.5)" });
  const path = [["KIGER", "Fundador · produtora audiovisual"], ["Prisma Brasil", "Edição e captação · desde 2024"], ["UNoB", "Editor de mídia e conteúdo"], ["UNASP", "Comunicação Social · Rádio e TV"]];
  const tools = ["Premiere Pro", "After Effects", "DaVinci Resolve", "Pro Tools", "ComfyUI", "Higgsfield", "Plugins CEP/UXP"];
  return (
    <section id="sobre" className="about section">
      <div className="about-grid">
        <div className="about-photo-wrap" onPointerMove={move} onPointerLeave={leave}>
          <div className="about-photo js-photo" ref={card}>
            <img src="/media/alex-profile.webp" alt="Retrato de Alex Ascencio em fundo vermelho" loading="lazy" />
            <div className="about-tag"><Mark className="about-mark" /><span>Editor & Filmmaker</span></div>
          </div>
        </div>
        <div className="about-copy">
          <Eyebrow n="06">Sobre</Eyebrow>
          <Title>A pessoa por trás <em>da timeline.</em></Title>
          <p className="reveal lead">Sou Alex Ascencio, editor de vídeo e filmmaker. Trabalho entre videoclipes, documentários, cinema e transmissões, do set à finalização.</p>
          <p className="reveal">Uso IA generativa como ferramenta de produção, com o mesmo critério de um plano filmado: se não passa como real, não entra. Também desenvolvo plugins para Premiere e After Effects que aceleram o meu fluxo.</p>
          <ul className="path reveal">{path.map(([a, b]) => <li key={a}><b>{a}</b><span>{b}</span></li>)}</ul>
          <div className="tools reveal">{tools.map((t) => <span key={t}>{t}</span>)}</div>
          <div className="reveal"><Btn href="/Alex_Ascencio_Curriculo.pdf" download variant="glass" icon={<I.Download size={15} />}>Baixar currículo</Btn></div>
        </div>
      </div>
    </section>
  );
}

/* ───────── contato ───────── */
function Contact() {
  const [kind, setKind] = useState("Videoclipe");
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ name: "", when: "Sem data definida", msg: "" });
  useEffect(() => {
    const f = () => setTime(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(new Date()));
    f(); const id = setInterval(f, 20000); return () => clearInterval(id);
  }, []);
  const kinds = ["Videoclipe", "Documentário", "Curta / cinema", "Motion design", "IA generativa", "Evento / ao vivo", "Outro"];
  const body = `Olá, Alex! Sou ${form.name || "—"}.\nProjeto: ${kind}\nPrazo: ${form.when}\n\n${form.msg}`;
  const valid = form.name.trim() && form.msg.trim();
  const copy = async () => { try { await navigator.clipboard.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { location.href = `mailto:${EMAIL}`; } };
  const channels = [
    [I.Whatsapp, "WhatsApp", "+55 15 99756-9880", `https://wa.me/${WHATS}`],
    [I.Instagram, "Instagram", "@alexascencioai", IG],
    [I.Linkedin, "LinkedIn", "in/ascencioalexgabriel", LI],
  ];
  return (
    <section id="contato" className="contact section">
      <div className="contact-head">
        <Eyebrow n="07">Contato</Eyebrow>
        <Title>Vamos fazer o <em>próximo filme.</em></Title>
        <p className="reveal">Conte a ideia, o formato e o prazo. Eu respondo com um caminho de produção.</p>
      </div>
      <div className="contact-grid">
        <div className="contact-side">
          <div className="mail-card reveal">
            <span className="mono">E-mail direto</span>
            <a href={`mailto:${EMAIL}`} className="mail-link">{EMAIL}</a>
            <div className="mail-actions">
              <button className="chip-btn" onClick={copy}>{copied ? <><I.Check size={15} /> Copiado</> : <><I.Copy size={15} /> Copiar</>}</button>
              <a className="chip-btn" href={`mailto:${EMAIL}`}><I.Mail size={15} /> Escrever</a>
            </div>
          </div>
          <div className="channels">
            {channels.map(([Icon, n, h, url], i) => (
              <a key={n} href={url} target="_blank" rel="noreferrer" className="channel reveal" style={{ "--d": i }}>
                <span className="ch-icon"><Icon size={20} /></span>
                <span className="ch-text"><b>{n}</b><span>{h}</span></span>
                <span className="ch-arrow"><I.Arrow size={15} /></span>
              </a>
            ))}
          </div>
          <div className="meta-row reveal">
            <span><I.Clock size={15} /> {time} · Brasília</span>
            <span><I.Pin size={15} /> Remoto e presencial</span>
            <span><i className="live" /> Agenda aberta</span>
          </div>
        </div>

        <form className="brief reveal" onSubmit={(e) => { e.preventDefault(); if (valid) window.open(`https://wa.me/${WHATS}?text=${encodeURIComponent(body)}`, "_blank", "noopener"); }}>
          <div className="brief-head">
            <div><b>Briefing rápido</b><span>Um minuto. Você escolhe por onde enviar.</span></div>
            <span className="mono">01 — 03</span>
          </div>
          <fieldset>
            <legend className="mono">Tipo de projeto</legend>
            <div className="kinds">
              {kinds.map((k) => <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}
            </div>
          </fieldset>
          <div className="row">
            <label><span className="mono">Seu nome</span><input required maxLength={120} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Como posso te chamar?" /></label>
            <label><span className="mono">Prazo</span><select value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })}>
              {["Sem data definida", "Até 2 semanas", "Até 1 mês", "1 a 3 meses", "Mais de 3 meses"].map((o) => <option key={o}>{o}</option>)}
            </select></label>
          </div>
          <label><span className="mono">Sobre o projeto</span><textarea required rows={4} maxLength={2500} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="Ideia, referências, formato de entrega (16:9, 9:16), duração…" /></label>
          <div className="brief-actions">
            <Btn as="button" type="submit" icon={<I.Whatsapp size={15} />} disabled={!valid}>Enviar no WhatsApp</Btn>
            <Btn href={valid ? `mailto:${EMAIL}?subject=${encodeURIComponent(`Projeto: ${kind}`)}&body=${encodeURIComponent(body)}` : undefined} variant="glass" icon={<I.Mail size={15} />} aria-disabled={!valid} onClick={(e) => !valid && e.preventDefault()}>Enviar por e-mail</Btn>
          </div>
          <small className="brief-note">Nada é armazenado aqui. O texto abre pronto no seu WhatsApp ou e-mail.</small>
        </form>
      </div>
    </section>
  );
}

/* ───────── rodapé ───────── */
function Footer() {
  return (
    <footer className="footer">
      <Mark className="footer-watermark" />
      <div className="footer-cta">
        <div>
          <span className="mono">Próximo projeto</span>
          <p>Tem uma história para contar?</p>
        </div>
        <Btn href="#contato">Vamos conversar</Btn>
      </div>
      <div className="footer-cols">
        <div className="footer-brand">
          <Lockup height={34} />
          <p><span>Editor & Filmmaker · Criar. Contar. Impactar.</span></p>
        </div>
        <div><span className="mono">Navegação</span>{NAV.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</div>
        <div><span className="mono">Contato</span><a href={`mailto:${EMAIL}`}>E-mail</a><a href={`https://wa.me/${WHATS}`} target="_blank" rel="noreferrer">WhatsApp</a><a href="/Alex_Ascencio_Curriculo.pdf" download>Currículo</a></div>
        <div><span className="mono">Redes</span><a href={IG} target="_blank" rel="noreferrer">Instagram</a><a href={LI} target="_blank" rel="noreferrer">LinkedIn</a></div>
      </div>
      <div className="footer-row">
        <span className="mono">© {new Date().getFullYear()} Alex Ascencio</span>
        <Magnetic><a href="#top" className="top-btn" aria-label="Voltar ao topo"><I.Arrow size={16} style={{ transform: "rotate(-45deg)" }} /></a></Magnetic>
      </div>
    </footer>
  );
}

/* ───────── app ───────── */
export default function App() {
  const [project, setProject] = useState(null);
  const [ready, setReady] = useState(false);
  const fieldCanvas = useRef(null);
  const root = useRef(null);

  useLayoutEffect(() => {
    const reduced = reducedMotion();
    let lenis, tick;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      lenis.on("scroll", ({ direction, scroll }) => document.documentElement.classList.toggle("nav-hidden", direction === 1 && scroll > innerHeight * 0.9));
      tick = (t) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }
    const onAnchor = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(el, { offset: 0, duration: 1.6 }) : el.scrollIntoView();
    };
    document.addEventListener("click", onAnchor);

    let field;
    try {
      field = new ParticleField(fieldCanvas.current);
      reduced ? field.renderOnce() : field.start();
    } catch { /* sem WebGL */ }

    const ctx = gsap.context(() => {
      if (reduced) return;
      const mm = gsap.matchMedia();
      // hero: saída cinematográfica (dolly out + desfoque + fade para o preto)
      gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
        .to(".hero-word-inner", { yPercent: -28, scale: 0.92, filter: "blur(10px)", opacity: 0, ease: "none" }, 0)
        .to(".hero-person img", { scale: 0.9, yPercent: 6, filter: "blur(6px) brightness(0.5)", ease: "none" }, 0)
        .to(".hero-haze", { opacity: 0, ease: "none" }, 0)
        .to(".hero-fade", { opacity: 0, y: -50, ease: "none" }, 0);
      ScrollTrigger.create({ trigger: ".hero", start: "top top", end: "bottom top", onUpdate: (s) => { const el = document.querySelector(".js-tc"); if (el) el.textContent = tc(s.progress * 12); } });
      // manifesto (pin primeiro para as posições seguintes considerarem o espaçador)
      gsap.timeline({ scrollTrigger: { trigger: "#manifesto", start: "top top", end: () => `+=${innerHeight * 1.6}`, scrub: true, pin: ".manifesto-pin" } })
        .fromTo(".manifesto .w", { opacity: 0.1, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0px)", stagger: 0.08, ease: "none" })
        .from(".stats > div", { y: 30, opacity: 0, stagger: 0.1 }, ">-0.3");
      ScrollTrigger.create({
        trigger: ".stats", start: "top 85%", once: true,
        onEnter: () => document.querySelectorAll(".stats dd[data-count]").forEach((dd) => {
          const o = { v: 0 }, n = +dd.dataset.count;
          gsap.to(o, { v: n, duration: 1.6, ease: "power3.out", onUpdate: () => (dd.textContent = Math.round(o.v)) });
        }),
      });
      // partículas → marca → somem
      ScrollTrigger.create({ trigger: "#manifesto", start: "top 90%", end: "top top", scrub: true, onUpdate: (s) => field?.setMorph(s.progress) });
      ScrollTrigger.create({
        trigger: "#manifesto", start: "bottom bottom", end: "bottom 35%", scrub: true,
        onUpdate: (s) => { gsap.set(fieldCanvas.current, { opacity: 1 - s.progress }); (s.progress >= 0.999 ? field?.stop() : field?.start()); },
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
          const img = card.querySelector(".fcard-media img");
          if (img) gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
          gsap.fromTo(card, { scale: 0.92, opacity: 0.55 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 95%", end: "left 45%", scrub: true } });
        });
      });
      // entrada dos filmes: cards sobem por baixo do título
      gsap.from(".featured-track", { yPercent: 18, opacity: 0, ease: "none", scrollTrigger: { trigger: "#filmes", start: "top 95%", end: "top 25%", scrub: true } });
      // lab: moldura arredondada que se expande até sangrar a tela
      gsap.fromTo(".lab-frame", { clipPath: "inset(7% 5% 7% 5% round 44px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: ".lab", start: "top 90%", end: "top 5%", scrub: true } });
      gsap.fromTo(".lab-canvas", { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".lab", start: "top bottom", end: "top top", scrub: true } });
      // títulos: máscara por linha
      gsap.utils.toArray(".js-title .title-inner").forEach((el) => {
        gsap.fromTo(el, { yPercent: 105, rotate: 2.5 }, { yPercent: 0, rotate: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el.parentElement, start: "top 90%", once: true } });
      });
      gsap.utils.toArray(".eyebrow").forEach((el) => {
        gsap.from(el, { opacity: 0, x: -16, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
      });
      // reveals
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", delay: (+getComputedStyle(el).getPropertyValue("--d") || 0) * 0.08, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });
      // grade do arquivo em cascata
      ScrollTrigger.batch(".grid .card", { start: "top 92%", once: true, onEnter: (els) => gsap.from(els, { y: 50, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.06 }) });
      // foto do sobre: revelação por cortina
      gsap.fromTo(".js-photo", { clipPath: "inset(100% 0 0 0 round 32px)" }, { clipPath: "inset(0% 0 0 0 round 32px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".about", start: "top 70%", once: true } });
      gsap.fromTo(".js-photo img", { scale: 1.25 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: { trigger: ".about", start: "top 70%", once: true } });
      // rodapé
      gsap.fromTo(".footer-watermark", { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });
    }, root);

    return () => {
      ctx.revert();
      document.removeEventListener("click", onAnchor);
      field?.dispose();
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.__lenis?.start();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    if (reducedMotion()) return;
    gsap.timeline()
      .from(".hero-word .ch", { yPercent: 110, opacity: 0, duration: 1.4, ease: "expo.out", stagger: 0.04 })
      .from(".hero-person img", { yPercent: 10, opacity: 0, duration: 1.8, ease: "expo.out" }, 0.15)
      .from(".nav > *", { y: -24, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08 }, 0.4)
      .from(".hero-fade", { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, clearProps: "transform" }, 0.6);
  }, [ready]);

  return (
    <div ref={root}>
      <Preloader onDone={() => setReady(true)} />
      <Cursor />
      <canvas ref={fieldCanvas} className="field" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <a className="skip" href="#filmes">Pular para os filmes</a>
      <Nav />
      <main>
        <Hero open={setProject} />
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
      {project && <Player project={project} onClose={() => setProject(null)} />}
    </div>
  );
}
