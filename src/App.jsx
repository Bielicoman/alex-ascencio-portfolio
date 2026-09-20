import { useState, useRef, useEffect, useMemo, lazy, Suspense } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
  MotionConfig,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  X,
  Menu,
  Film,
  Clapperboard,
  Layers3,
  Sparkles,
  Aperture,
  MessageCircle,
  Search,
  LayoutGrid,
  List,
  MoveUpRight,
  Download,
  SlidersHorizontal,
  Rotate3D,
  MousePointer2,
  VolumeX,
} from "lucide-react";
import { PROJECTS } from "./projects";
import LensScene, { Starfield } from "./components/Scene";
const Instagram = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" />
  </svg>
);
const Linkedin = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 10v7m4 0v-7m0 3c0-4 6-4 6 0v4" />
    <circle cx="7" cy="7" r=".6" fill="currentColor" />
  </svg>
);

const selected = [24, 14, 16, 7, 21].map((id) =>
  PROJECTS.find((p) => p.id === id),
);
const categories = ["Todos", ...new Set(PROJECTS.map((p) => p.cat))];
const thumb = (p) => `/media/${p.id}.webp`;
const shortTitle = (p) => p.title.split(/\||—/)[0].trim();
const clients = [
  { name: "Kiger", logo: "kiger" },
  { name: "Prisma Brasil", logo: "prisma" },
  { name: "Dilson Castro", logo: "dilson" },
  { name: "Via Global", logo: "via-global" },
  { name: "Entre Aspas", logo: "entre-aspas" },
];
const artists = [
  "Quarteto Elo",
  "Communion",
  "Gabriella Stehling",
  "Kati Carvalho",
  "Califórnia Dreams",
  "Willian Krusty",
  "CPB",
  "Pedro Valença",
  "Prisminha",
  "Dunamis Studio",
  "Patrícia de Paiva",
];
function Brand() {
  return (
    <a href="#top" className="brand" aria-label="Alex Ascencio — início">
      <img src="/media/mark.png" alt="" />
      <span>
        alex ascencio<span className="brand-period">.</span>
        <small>VIDEO EDITOR & AI CREATIVE</small>
      </span>
    </a>
  );
}
function Reveal({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
function Tilt({ children, className = "" }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  function move(e) {
    if (reduced || e.pointerType === "touch") return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty(
      "--rx",
      `${(-(e.clientY - r.top - r.height / 2) / r.height) * 8}deg`,
    );
    ref.current.style.setProperty(
      "--ry",
      `${((e.clientX - r.left - r.width / 2) / r.width) * 8}deg`,
    );
    ref.current.style.setProperty(
      "--mx",
      `${((e.clientX - r.left) / r.width) * 100}%`,
    );
    ref.current.style.setProperty(
      "--my",
      `${((e.clientY - r.top) / r.height) * 100}%`,
    );
  }
  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={move}
      onPointerLeave={() => {
        ref.current.style.setProperty("--rx", "0deg");
        ref.current.style.setProperty("--ry", "0deg");
      }}
    >
      {children}
    </div>
  );
}
function Player({ project, close }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="player"
      aria-labelledby="player-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="player-top">
        <span className="eyebrow">
          <Film size={14} /> SALA DE EXIBIÇÃO
        </span>
        <button
          onClick={close}
          className="icon-button"
          aria-label="Fechar vídeo"
        >
          <X />
        </button>
      </div>
      <iframe
        title={project.title}
        src={`${project.url.replace("www.youtube.com", "www.youtube-nocookie.com")}?autoplay=1&rel=0`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <div className="player-info">
        <div>
          <span className="eyebrow">
            {project.cat} / {project.date.slice(0, 4)}
          </span>
          <h2 id="player-title">{project.title}</h2>
          <p>{project.desc}</p>
        </div>
        <a
          className="pill secondary"
          href={project.url.replace("/embed/", "/watch?v=")}
          target="_blank"
          rel="noreferrer"
        >
          Ver no YouTube <ArrowUpRight size={16} />
        </a>
      </div>
      <p className="player-help">
        Se a reprodução estiver indisponível aqui, assista diretamente no
        YouTube.
      </p>
    </dialog>
  );
}
function Cinema({ open, reduced }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!reduced && innerWidth > 700)
      setActive(Math.min(selected.length - 1, Math.floor(v * selected.length)));
  });
  const current = selected[active];
  return (
    <section
      id="cinema"
      className={`cinema ${reduced ? "cinema-static" : ""}`}
      ref={ref}
    >
      <div className="cinema-pin">
        <div className="section-heading center">
          <span className="eyebrow">
            <Clapperboard size={14} /> FILMES EM DESTAQUE
          </span>
          <h2>
            Cada história,
            <br />
            um novo <span className="soft-type">universo.</span>
          </h2>
          <p>Entre na cena. Sinta o ritmo. Conheça meu olhar.</p>
        </div>
        <div
          className="cinema-stage"
          role="region"
          aria-label="Carrossel de filmes em destaque"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, selected.length - 1));
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            }
          }}
        >
          {selected.map((p, i) => {
            const d = i - active;
            return (
              <motion.button
                className={`cinema-card ${d === 0 ? "is-current" : ""}`}
                key={p.id}
                animate={{
                  x: `${d * 79}%`,
                  rotateY: reduced ? 0 : d === 0 ? 0 : d > 0 ? -33 : 33,
                  scale: d === 0 ? 1 : 0.84,
                  opacity: Math.abs(d) > 1 ? 0 : d === 0 ? 1 : 0.42,
                  z: d === 0 ? 0 : -110,
                }}
                transition={{
                  duration: reduced ? 0 : 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ zIndex: 10 - Math.abs(d) }}
                tabIndex={d === 0 ? 0 : -1}
                aria-hidden={d !== 0}
                aria-label={`Assistir ${p.title}`}
                onClick={() => (d === 0 ? open(p) : setActive(i))}
              >
                <img src={thumb(p)} alt="" loading="lazy" />
                <div className="cinema-card-shade" />
                <span className="tag">
                  <Film size={12} />
                  {p.cat}
                </span>
                <span className="play-orb">
                  <Play size={22} fill="currentColor" />
                </span>
                <div className="cinema-caption">
                  <span className="eyebrow">
                    {p.date.slice(0, 4)} / {p.q}
                  </span>
                  <h3>{shortTitle(p)}</h3>
                  <ArrowUpRight size={26} />
                </div>
              </motion.button>
            );
          })}
        </div>
        <div className="cinema-controls">
          <button
            className="icon-button"
            aria-label="Filme anterior"
            disabled={active === 0}
            onClick={() => setActive((i) => i - 1)}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="cinema-dots">
            {selected.map((p, i) => (
              <button
                key={p.id}
                className={i === active ? "active" : ""}
                aria-label={`Selecionar ${shortTitle(p)}`}
                aria-pressed={i === active}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
          <button
            className="icon-button"
            aria-label="Próximo filme"
            disabled={active === selected.length - 1}
            onClick={() => setActive((i) => i + 1)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="cinema-foot">
          <span aria-live="polite">
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(selected.length).padStart(2, "0")} — {current.cat}
          </span>
          <a href="#work">
            Explorar todos os trabalhos <ArrowDown size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
function MotionVideo({ paused }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !paused) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [paused]);
  return (
    <video
      ref={ref}
      src="/media/aperture-motion.mp4"
      poster="/media/aperture-poster.webp"
      muted
      playsInline
      loop
      preload="none"
      aria-label="Motion autoral criado com IA: lente cromada em movimento"
    />
  );
}
export default function App() {
  const systemReduced = useReducedMotion();
  const [manualPause, setManualPause] = useState(false),
    [menu, setMenu] = useState(false),
    [project, setProject] = useState(null),
    [category, setCategory] = useState("Todos"),
    [query, setQuery] = useState(""),
    [view, setView] = useState("grid"),
    [hue, setHue] = useState(350),
    [aperture, setAperture] = useState(55);
  const paused = !!systemReduced || manualPause;
  const hero = useRef(null);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: hp } = useScroll({
    target: hero,
    offset: ["start start", "end start"],
  });
  const portraitY = useTransform(hp, [0, 1], [0, 95]),
    titleY = useTransform(hp, [0, 1], [0, -90]);
  const normalize = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const results = useMemo(
    () =>
      PROJECTS.filter(
        (p) =>
          (category === "Todos" || p.cat === category) &&
          normalize(`${p.title} ${p.cat}`).includes(normalize(query)),
      ),
    [category, query],
  );
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    window.open(
      `https://wa.me/5515997569880?text=${encodeURIComponent(`Olá, Alex! Sou ${f.get("name")}.\nProjeto: ${f.get("type")}\n\n${f.get("message")}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  return (
    <MotionConfig reducedMotion={paused ? "always" : "user"}>
      <div className={paused ? "site is-paused" : "site"}>
        <a className="skip-link" href="#work">
          Pular para os trabalhos
        </a>
        <motion.div
          className="reading-progress"
          style={{ scaleX: scrollYProgress }}
          aria-hidden="true"
        />
        <header className="header glass">
          <Brand />
          <nav
            className={menu ? "is-open" : ""}
            id="navigation"
            aria-label="Principal"
          >
            {[
              ["cinema", "Filmes"],
              ["work", "Trabalhos"],
              ["lab", "Universo criativo"],
              ["about", "Sobre"],
            ].map(([id, text]) => (
              <a href={`#${id}`} key={id} onClick={() => setMenu(false)}>
                {text}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <a className="pill header-cta" href="#contact">
              Vamos criar <ArrowUpRight size={15} />
            </a>
            <button
              className="icon-button motion-toggle"
              aria-label={
                manualPause ? "Retomar animações" : "Pausar animações"
              }
              aria-pressed={manualPause}
              onClick={() => setManualPause(!manualPause)}
            >
              {manualPause ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button
              className="icon-button menu-toggle"
              aria-label={menu ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menu}
              aria-controls="navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
        <main>
          <section id="top" className="hero" ref={hero}>
            <Starfield paused={paused} />
            <div className="hero-halo" aria-hidden="true" />
            <div className="hero-topline">
              <span className="tiny-label">
                ALEX ASCENCIO / ESTÚDIO CRIATIVO
              </span>
              <span className="tiny-label">
                EDIÇÃO · MOTION · INTELIGÊNCIA ARTIFICIAL
              </span>
            </div>
            <motion.h1 style={paused ? {} : { y: titleY }}>
              PORTFOLIO
              <span className="title-star" aria-hidden="true">
                ✳
              </span>
            </motion.h1>
            <div className="hero-composition">
              <div className="hero-intro">
                <span className="hero-greeting">Olá, eu sou Alex.</span>
                <p>
                  Transformo ideias
                  <br />
                  em imagens que
                  <br />
                  <span>fazem sentir.</span>
                </p>
                <a className="pill primary" href="#cinema">
                  Explore meu universo <ArrowDown size={16} />
                </a>
                <div className="hero-socials">
                  <a
                    href="https://instagram.com/alexascencioai"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram de Alex"
                  >
                    <Instagram size={17} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/ascencioalexgabriel/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn de Alex"
                  >
                    <Linkedin size={17} />
                  </a>
                  <a
                    href="https://wa.me/5515997569880"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp de Alex"
                  >
                    <MessageCircle size={17} />
                  </a>
                </div>
              </div>
              <motion.div
                className="hero-person"
                style={paused ? {} : { y: portraitY }}
              >
                <img
                  src="/media/portrait-v2.webp"
                  alt="Alex Ascencio em retrato editorial com camisa preta"
                  fetchPriority="high"
                />
                <div className="person-fade" />
              </motion.div>
              <div className="hero-right">
                <div className="creative-stamp">
                  <Aperture size={32} />
                  <span>
                    UM OLHAR HUMANO.
                    <br />
                    INFINITAS POSSIBILIDADES.
                  </span>
                </div>
                <Tilt className="floating-project glass">
                  <button
                    onClick={() => setProject(PROJECTS[0])}
                    aria-label="Assistir Em Nome de Jesus, Quarteto Elo"
                  >
                    <div className="mini-window">
                      <span />
                      <span />
                      <span />
                      <small>ÚLTIMO LANÇAMENTO</small>
                    </div>
                    <div className="floating-thumb">
                      <img src={thumb(PROJECTS[0])} alt="" />
                      <span>
                        <Play size={14} fill="currentColor" />
                      </span>
                    </div>
                    <div className="floating-caption">
                      Em Nome de Jesus <ArrowUpRight size={14} />
                    </div>
                  </button>
                </Tilt>
              </div>
              <div className="floating-skill glass">
                <span className="skill-icon">
                  <Layers3 size={22} />
                </span>
                <div>
                  Histórias em movimento
                  <small>VIDEO EDITING & MOTION DESIGN</small>
                </div>
                <Sparkles size={14} />
              </div>
              <div className="signature glass">
                <img src="/media/mark.png" alt="Marca Alex Ascencio" />
                <span>
                  CRIAR. CONTAR.
                  <br />
                  <b>IMPACTAR.</b>
                </span>
              </div>
            </div>
            <div className="hero-footer">
              <span>
                <span className="status-dot" /> BASEADO NO BRASIL. CRIANDO SEM
                FRONTEIRAS.
              </span>
              <a href="#cinema">
                <span className="mouse-shape" /> SCROLL PARA DESCOBRIR{" "}
                <ArrowDown size={13} />
              </a>
              <span>PORTFÓLIO / 2026</span>
            </div>
          </section>
          <section
            className="client-strip"
            aria-label="Clientes e colaborações"
          >
            <p className="eyebrow">BOAS HISTÓRIAS SE CONSTROEM JUNTOS</p>
            <div className="client-logos">
              {clients.map((c) => (
                <div key={c.name}>
                  <img
                    src={`/media/clients/${c.logo}.webp`}
                    alt={c.name}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <div className="artist-names">
              {artists.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </section>
          <Cinema open={setProject} reduced={paused} />
          <section id="work" className="archive section-pad">
            <Reveal className="section-heading split">
              <div>
                <span className="eyebrow">
                  <Film size={14} /> FEITO PARA SER VISTO. E SENTIDO.
                </span>
                <h2>
                  O trabalho fala.
                  <br />
                  <span className="soft-type">Dê o play.</span>
                </h2>
              </div>
              <p>
                Videoclipes, cinema, documentários e bastidores.
                <br />
                Todas as histórias, em um só lugar.
              </p>
            </Reveal>
            <div className="archive-toolbar glass">
              <div
                className="filters"
                role="group"
                aria-label="Filtrar trabalhos"
              >
                {categories.map((c) => (
                  <button
                    key={c}
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                    <sup>
                      {c === "Todos"
                        ? PROJECTS.length
                        : PROJECTS.filter((p) => p.cat === c).length}
                    </sup>
                  </button>
                ))}
              </div>
              <div className="view-controls">
                <button
                  className="icon-button"
                  aria-label="Visualizar em grade"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Visualizar em lista"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={17} />
                </button>
              </div>
            </div>
            <div className="archive-subbar">
              <p role="status">
                {results.length}{" "}
                {results.length === 1 ? "trabalho" : "trabalhos"} encontrados
              </p>
              <label className="search">
                <Search size={15} />
                <input
                  type="search"
                  aria-label="Buscar trabalho ou artista"
                  placeholder="Busque um filme ou artista"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            <div
              className={`project-grid ${view === "list" ? "list-view" : ""}`}
            >
              {results.map((p) => (
                <Tilt className="project-card" key={p.id}>
                  <button
                    onClick={() => setProject(p)}
                    aria-label={`Assistir ${p.title}`}
                  >
                    <div className="project-image">
                      <img
                        src={thumb(p)}
                        alt=""
                        loading="lazy"
                        width="1000"
                        height="563"
                      />
                      <div className="project-image-shade" />
                      <span className="project-category">{p.cat}</span>
                      <span className="project-play">
                        <Play size={16} fill="currentColor" />
                      </span>
                    </div>
                    <div className="project-info">
                      <div>
                        <small>
                          {p.date.slice(0, 4)} <span>/ {p.q}</span>
                        </small>
                        <h3>{p.title}</h3>
                      </div>
                      <span className="project-arrow">
                        <ArrowUpRight size={18} />
                      </span>
                    </div>
                  </button>
                </Tilt>
              ))}
            </div>
            {results.length === 0 && (
              <div className="empty">
                <Search size={32} />
                <h3>Nenhum filme por aqui.</h3>
                <p>Tente outro nome ou volte ao catálogo completo.</p>
                <button
                  className="pill primary"
                  onClick={() => {
                    setQuery("");
                    setCategory("Todos");
                  }}
                >
                  Limpar filtros <X size={14} />
                </button>
              </div>
            )}
          </section>
          <section id="lab" className="lab section-pad">
            <Reveal className="section-heading center">
              <span className="eyebrow">
                <Sparkles size={14} /> ALÉM DO QUE JÁ EXISTE
              </span>
              <h2>
                Imaginação humana.
                <br />
                <span className="soft-type">Possibilidades expandidas.</span>
              </h2>
              <p>Tecnologia é ferramenta. O olhar é o que transforma.</p>
            </Reveal>
            <div className="lab-grid">
              <div className="lens-panel glass">
                <div className="panel-top">
                  <span className="tiny-label">
                    <Aperture size={13} /> LAB / LUZ & MOVIMENTO
                  </span>
                  <span className="tag subtle">
                    <Rotate3D size={12} /> INTERATIVO
                  </span>
                </div>
                <Suspense
                  fallback={
                    <img
                      className="lens-fallback"
                      src="/media/aperture-poster.webp"
                      alt="Lente cinematográfica"
                    />
                  }
                >
                  <LensScene paused={paused} hue={hue} aperture={aperture} />
                </Suspense>
                <div className="lens-hint">
                  <MousePointer2 size={13} /> Arraste a lente. Mude a luz.
                  Explore.
                </div>
                <div className="lens-controls">
                  <label>
                    Abertura
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={aperture}
                      onChange={(e) => setAperture(Number(e.target.value))}
                    />
                  </label>
                  <div>
                    <span>Luz</span>
                    <div className="swatches">
                      {[
                        { h: 350, n: "Vermelha" },
                        { h: 210, n: "Azul" },
                        { h: 35, n: "Âmbar" },
                      ].map((c) => (
                        <button
                          key={c.h}
                          aria-label={`Luz ${c.n}`}
                          aria-pressed={hue === c.h}
                          style={{ "--swatch": `hsl(${c.h} 75% 60%)` }}
                          onClick={() => setHue(c.h)}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="Restaurar lente"
                    onClick={() => {
                      setHue(350);
                      setAperture(55);
                    }}
                  >
                    <Rotate3D size={17} />
                  </button>
                </div>
              </div>
              <div className="lab-copy">
                <div className="service glass">
                  <span className="service-icon">
                    <Clapperboard />
                  </span>
                  <div>
                    <h3>Edição com intenção.</h3>
                    <p>
                      Ritmo, narrativa e emoção. Cada corte existe para contar
                      melhor uma história.
                    </p>
                    <small>PREMIERE PRO · DAVINCI RESOLVE</small>
                  </div>
                </div>
                <div className="service glass">
                  <span className="service-icon">
                    <Layers3 />
                  </span>
                  <div>
                    <h3>Ideias que se movem.</h3>
                    <p>
                      Motion design, composição e cor. Movimento que acrescenta
                      significado à imagem.
                    </p>
                    <small>AFTER EFFECTS · COLOR GRADING</small>
                  </div>
                </div>
                <div className="service glass">
                  <span className="service-icon">
                    <Sparkles />
                  </span>
                  <div>
                    <h3>O impossível, em produção.</h3>
                    <p>
                      Imagens, cenas e fluxos criativos com IA. Novas
                      ferramentas para ir além do óbvio.
                    </p>
                    <small>IA GENERATIVA · DIREÇÃO CRIATIVA</small>
                  </div>
                </div>
              </div>
            </div>
            <Reveal className="motion-showcase">
              <div className="motion-video">
                <MotionVideo paused={paused} />
                <span className="tag">
                  <VolumeX size={12} /> MOTION EXPLORATION
                </span>
                <button
                  className="icon-button video-pause"
                  aria-label={
                    manualPause ? "Reproduzir motion" : "Pausar motion"
                  }
                  onClick={() => setManualPause(!manualPause)}
                >
                  {manualPause ? <Play size={16} /> : <Pause size={16} />}
                </button>
              </div>
              <div>
                <span className="eyebrow">DO CONCEITO AO MOVIMENTO</span>
                <h3>
                  Um frame é uma ideia.
                  <br />
                  Em movimento, <span>é um universo.</span>
                </h3>
                <p>
                  Exploração visual criada com inteligência artificial para este
                  portfólio. Direção, luz e textura no mesmo processo criativo.
                </p>
                <a href="#contact" className="pill secondary">
                  Vamos imaginar o próximo? <ArrowUpRight size={16} />
                </a>
              </div>
            </Reveal>
          </section>
          <section id="about" className="about section-pad">
            <Reveal className="about-layout">
              <div className="about-image">
                <img
                  src="/media/studio-v2.webp"
                  alt="Retrato criativo de Alex Ascencio em um estúdio de edição, produzido com IA"
                  loading="lazy"
                />
                <div className="about-name glass">
                  <img src="/media/mark.png" alt="" />
                  <div>
                    Alex Ascencio<small>O OLHAR POR TRÁS DAS HISTÓRIAS</small>
                  </div>
                  <ArrowUpRight size={22} />
                </div>
                <span className="ai-caption">RETRATO CRIATIVO COM IA</span>
              </div>
              <div className="about-copy">
                <span className="eyebrow">
                  PESSOA REAL. CURIOSIDADE INFINITA.
                </span>
                <h2>
                  Mais do que
                  <br />
                  uma <span className="soft-type">timeline.</span>
                </h2>
                <p>
                  Sou Alex. Editor de vídeo, filmmaker e profissional de
                  inteligência artificial. Gosto de histórias que ficam na
                  cabeça — e de descobrir novas maneiras de contá-las.
                </p>
                <p>
                  Do set à finalização, transito entre videoclipes,
                  documentários, cinema e motion. Combino técnica, sensibilidade
                  e experimentação para dar personalidade a cada projeto.
                </p>
                <div className="about-tags">
                  <span>
                    <Film size={13} /> Cinema
                  </span>
                  <span>
                    <Layers3 size={13} /> Motion
                  </span>
                  <span>
                    <Sparkles size={13} /> IA
                  </span>
                </div>
                <a
                  className="pill secondary"
                  href="/Alex_Ascencio_Curriculo.pdf"
                  download
                >
                  Conheça minha trajetória <Download size={16} />
                </a>
              </div>
            </Reveal>
          </section>
          <section id="contact" className="contact section-pad">
            <div className="contact-halo" />
            <Reveal className="contact-grid">
              <div className="contact-copy">
                <span className="eyebrow">
                  <MessageCircle size={14} /> TODO GRANDE PROJETO COMEÇA COM UMA
                  CONVERSA.
                </span>
                <h2>
                  Sua ideia.
                  <br />
                  Meu olhar.
                  <br />
                  <span className="soft-type">Nosso próximo filme.</span>
                </h2>
                <p>
                  Tem um projeto em mente?
                  <br />
                  Vamos dar forma, ritmo e vida a ele.
                </p>
                <div className="contact-socials">
                  {[
                    [MessageCircle, "WhatsApp", "https://wa.me/5515997569880"],
                    [
                      Instagram,
                      "Instagram",
                      "https://instagram.com/alexascencioai",
                    ],
                    [
                      Linkedin,
                      "LinkedIn",
                      "https://www.linkedin.com/in/ascencioalexgabriel/",
                    ],
                  ].map(([Icon, name, url]) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="glass"
                    >
                      <Icon size={20} />
                      <span>{name}</span>
                      <ArrowUpRight size={14} />
                    </a>
                  ))}
                </div>
              </div>
              <form onSubmit={submit} className="contact-form glass">
                <div className="form-title">
                  <span className="form-icon">
                    <MoveUpRight size={25} />
                  </span>
                  <div>
                    Vamos criar algo bom.
                    <small>ME CONTE UM POUCO DA SUA IDEIA</small>
                  </div>
                </div>
                <label>
                  Como posso te chamar?
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    placeholder="Seu nome"
                  />
                </label>
                <label>
                  O que você tem em mente?
                  <select name="type">
                    <option>Edição de vídeo</option>
                    <option>Motion design</option>
                    <option>Projeto com IA</option>
                    <option>Videoclipe</option>
                    <option>Documentário ou cinema</option>
                    <option>Outro projeto</option>
                  </select>
                </label>
                <label>
                  Me conta os detalhes
                  <textarea
                    name="message"
                    required
                    rows={3}
                    maxLength={2500}
                    placeholder="Sua ideia, referências e o prazo que você imagina..."
                  />
                </label>
                <button className="pill primary" type="submit">
                  Iniciar conversa <ArrowUpRight size={18} />
                </button>
                <small>
                  Abre o WhatsApp com sua mensagem pronta para enviar.
                </small>
              </form>
            </Reveal>
          </section>
        </main>
        <footer>
          <Brand />
          <span>
            © {new Date().getFullYear()} ALEX ASCENCIO
            <br />
            CRIAR. CONTAR. IMPACTAR.
          </span>
          <a className="back-top glass" href="#top" aria-label="Voltar ao topo">
            <ArrowUpRight size={20} />
          </a>
        </footer>
        {project && <Player project={project} close={() => setProject(null)} />}
      </div>
    </MotionConfig>
  );
}
