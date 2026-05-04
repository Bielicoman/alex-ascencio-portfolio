import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useScroll, useTransform } from 'framer-motion';

// ═══════════════════════════════════════
// DATA
// ═══════════════════════════════════════
const PROJECTS = [
  // ── Dates verified directly from YouTube publish dates ──
  // Sort is automatic — just add new videos anywhere with the correct date field
  // IDs are stable unique identifiers (do not change them)
  { id: 23, date: "2026-05-02", title: "Entrego a Ti | Gabriella Stehling",           cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/1YKP5mdZxoM/maxresdefault.jpg", url: "https://www.youtube.com/embed/1YKP5mdZxoM", desc: "Interpretação visual íntima e minimalista, explorando a iluminação suave e enquadramentos sensíveis que ressaltam a entrega emocional da performance." },
  { id: 1,  date: "2026-04-10", title: "Meu Respirar | Gabriella Stehling",          cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/WeBx8Ewkm4I/maxresdefault.jpg", url: "https://www.youtube.com/embed/WeBx8Ewkm4I", desc: "Produção cinematográfica com foco em texturas de luz e color grading dramático, elevando a adoração a um novo patamar visual." },
  { id: 2,  date: "2026-04-03", title: "Jeová Jireh | Gabriella Stehling",           cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/rQlMRuub6vo/maxresdefault.jpg", url: "https://www.youtube.com/embed/rQlMRuub6vo", desc: "Narrativa visual focada em minimalismo e elegância, destacando o protagonismo vocal com fotografia limpa e cortes sutis." },
  { id: 3,  date: "2026-03-27", title: "Tu És | Gabriella Stehling",                 cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/yrkck9BhKqo/maxresdefault.jpg", url: "https://www.youtube.com/embed/yrkck9BhKqo", desc: "Exploração de ângulos e profundidade de campo para criar uma experiência imersiva e espiritual de alta fidelidade visual." },
  { id: 4,  date: "2026-03-20", title: "Foi em Meu Lugar — Willian Krusty",          cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/MqIsul0I_to/maxresdefault.jpg",  url: "https://www.youtube.com/embed/MqIsul0I_to", desc: "Direção de arte e edição rítmica que traduzem a intensidade do sacrifício em imagens poderosas e cinematográficas." },
  { id: 5,  date: "2025-12-24", title: "Não Me Envergonho do Evangelho",             cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/ijf0p0naTcg/maxresdefault.jpg",  url: "https://www.youtube.com/embed/ijf0p0naTcg", desc: "Documentação visual de fé com estética editorial, equilibrando luz natural e composições de forte impacto emocional." },
  { id: 6,  date: "2025-12-03", title: "O Oráculo | Reality Show",                   cat: "Reality Show", q: "4K", img: "https://img.youtube.com/vi/efa_PSKMHLk/maxresdefault.jpg",  url: "https://www.youtube.com/embed/efa_PSKMHLk", desc: "Edição dinâmica para reality show, dominando o ritmo e o suspense para manter o engajamento do público cena a cena." },
  { id: 7,  date: "2025-10-31", title: "O Nome | Prisma Reunion – 45 Anos",          cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/bWVmk45mSl8/maxresdefault.jpg",  url: "https://www.youtube.com/embed/bWVmk45mSl8", desc: "Registro histórico e grandioso de um evento de legado, com multicâmera e tratamento de cor de altíssima gama." },
  { id: 8,  date: "2025-09-06", title: "Making Of | O Melhor de Mim",                cat: "Bastidores",   q: "HD", img: "https://img.youtube.com/vi/TD3uPps-RQ4/maxresdefault.jpg",  url: "https://www.youtube.com/embed/TD3uPps-RQ4", desc: "Captura de processos criativos e bastidores técnicos com olhar documental e narrativa orgânica de produção." },
  { id: 9,  date: "2025-08-22", title: "Gratidão — Dilson Castro",                   cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/0xftXOdbiDU/maxresdefault.jpg",  url: "https://www.youtube.com/embed/0xftXOdbiDU", desc: "Videoclipe com foco em storytelling visual e iluminação controlada, reforçando a mensagem lírica com excelência técnica." },
  { id: 11, date: "2025-08-20", title: "Continue em Frente (Ao Vivo) — Turnê 2025", cat: "Turnê",        q: "4K", img: "https://img.youtube.com/vi/g2MK7F0Adqc/maxresdefault.jpg",  url: "https://www.youtube.com/embed/g2MK7F0Adqc", desc: "Edição de show ao vivo com energia cinematográfica, sincronizando palco e atmosfera para uma experiência VIP." },
  { id: 12, date: "2025-08-08", title: "Lembra — Kati Carvalho feat. Communion",     cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/DAglqbQTK4c/maxresdefault.jpg",  url: "https://www.youtube.com/embed/DAglqbQTK4c", desc: "Parceria visual rica em detalhes e fotografia de alta performance, focada na harmonia entre artistas e ambiente." },
  { id: 13, date: "2025-08-08", title: "Hospedando Anjos Sem Saber (Ao Vivo 2025)",  cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/htIKc_vVDt0/maxresdefault.jpg",  url: "https://www.youtube.com/embed/htIKc_vVDt0", desc: "Experiência live session em 4K com foco em proximidade emocional e cortes que valorizam a performance instrumental e vocal." },
  { id: 14, date: "2025-06-27", title: "O Peso das Palavras | Curta Metragem",       cat: "Cinema",       q: "4K", img: "https://img.youtube.com/vi/h5vbvGte3oM/maxresdefault.jpg",  url: "https://www.youtube.com/embed/h5vbvGte3oM", desc: "Direção de fotografia e edição para cinema, explorando o silêncio e o subtexto através de uma narrativa visual densa." },
  { id: 15, date: "2024-12-03", title: "Making Of | Cicatrizes — Califórnia Dreams", cat: "Bastidores",   q: "4K", img: "https://img.youtube.com/vi/lJT58HZHD7g/maxresdefault.jpg",  url: "https://www.youtube.com/embed/lJT58HZHD7g", desc: "Documentário técnico de bastidores revelando a complexidade da produção e o cuidado de cada frame no set." },
  { id: 16, date: "2024-12-02", title: "Cicatrizes | Documentário — Califórnia Dreams", cat: "Documentário", q: "4K", img: "https://img.youtube.com/vi/NwesZCYbSx0/maxresdefault.jpg", url: "https://www.youtube.com/embed/NwesZCYbSx0", desc: "Narrativa documental profunda com estética cinematográfica, mesclando entrevistas e imagens B-roll de alto nível." },
  { id: 17, date: "2024-11-30", title: "Óh Quão Lindo Esse Nome É — Prisminha",     cat: "Clipes",       q: "4K", img: "https://img.youtube.com/vi/GWZWbLaovLY/maxresdefault.jpg",  url: "https://www.youtube.com/embed/GWZWbLaovLY", desc: "Produção delicada e lúdica focada em público infantil, mantendo o padrão 4K e a excelência editorial." },
  { id: 18, date: "2024-06-10", title: "Bárbara | Curta Metragem",                   cat: "Cinema",       q: "4K", img: "https://img.youtube.com/vi/p6SIYQ2c2Bw/maxresdefault.jpg",  url: "https://www.youtube.com/embed/p6SIYQ2c2Bw", desc: "Cinema independente com foco em atmosfera psicológica, usando luz e cor para construir a tensão narrativa." },
  { id: 20, date: "2024-05-04", title: "Patrícia de Paiva #1",                       cat: "Documentário", q: "4K", img: "https://img.youtube.com/vi/R8s2cjlf98k/maxresdefault.jpg",  url: "https://www.youtube.com/embed/R8s2cjlf98k", desc: "Perfis biográficos com olhar artístico, transformando histórias reais em experiências visuais memoráveis e inspiradoras." },
  { id: 21, date: "2023-12-07", title: "Saudade — Pedro Valença | Califórnia Dreams", cat: "Clipes",      q: "4K", img: "https://img.youtube.com/vi/Mul19Lfeo7Y/maxresdefault.jpg",  url: "https://www.youtube.com/embed/Mul19Lfeo7Y", desc: "Estética California Dreams com cores quentes e nostalgia visual, dominando a composição em cenários externos desafiadores." },
  { id: 22, date: "2023-06-15", title: "Nosso Jeito de Amar — Dunamis Studio",       cat: "Documentário", q: "HD", img: "https://img.youtube.com/vi/RRfgyZBCGn4/maxresdefault.jpg",  url: "https://www.youtube.com/embed/RRfgyZBCGn4", desc: "Documentação de estúdio focada em processos criativos, capturando a essência da música com proximidade e realismo." },
].sort((a, b) => new Date(b.date) - new Date(a.date));

const CATS = ['all', 'Documentário', 'Clipes', 'Cinema', 'Bastidores'];
const CAT_LABELS = { all: 'Todos', Documentário: 'Documentários', Clipes: 'Clipes', Cinema: 'Cinema', Bastidores: 'Bastidores' };
const CLIENTS = ["COMMUNION", "DILSON CASTRO", "KATI CARVALHO", "GABRIELLA STEHLING", "Prisma Brasil", "Kiger", "California Dreams", "WILLIAM KRUSTY", "CPB"];

const SOCIALS = [
  { href: "https://wa.me/5515997569880", label: "WhatsApp", color: "#25D366", d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" },
  { href: "https://instagram.com/alexascencioai", label: "Instagram", color: "#E1306C", d: "M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" },
  { href: "https://www.linkedin.com/in/ascencioalexgabriel/", label: "LinkedIn", color: "#0A66C2", d: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" },
];

const NAV = [
  { l: 'Trabalhos', id: 'work' },
  { l: 'Sobre', id: 'about' },
  { l: 'Contato', id: 'contact' },
];

// ═══════════════════════════════════════
// ═══════════════════════════════════════
// REVEAL ANIMATION
// ═══════════════════════════════════════
const Reveal = memo(({ children, delay = 0, y = 24, style }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.8, delay, ease: [0.25, 1, 0.5, 1] }}
    style={style}
  >{children}</motion.div>
));

// ═══════════════════════════════════════
// APP
// ═══════════════════════════════════════
export default function App() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const [hover, setHover] = useState(false);
  const [video, setVideo] = useState(null);
  const [cat, setCat] = useState('all');
  const [scrolled, setScrolled] = useState(false);
  const [showDock, setShowDock] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', msg: '' });
  const [mob, setMob] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  // Top 6 projects for hero rotation
  const heroItems = useMemo(() => PROJECTS.slice(0, 6), []);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 800], [0, 200]);
  const heroOp = useTransform(scrollY, [0, 600], [1, 0]);

  const filtered = useMemo(() => cat === 'all' ? PROJECTS : PROJECTS.filter(p => p.cat === cat), [cat]);

  useEffect(() => {
    const r = () => setMob(window.innerWidth < 769);
    r(); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r);
  }, []);

  useEffect(() => {
    const m = e => { mx.set(e.clientX); my.set(e.clientY); };
    const s = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y > lastY && y > 100) setShowDock(false);
      else setShowDock(true);
      setLastY(y);
    };
    if (!mob) window.addEventListener('mousemove', m);
    window.addEventListener('scroll', s, { passive: true });
    return () => { 
      window.removeEventListener('mousemove', m); 
      window.removeEventListener('scroll', s); 
    };
  }, [mx, my, lastY, mob]);

  // Hero auto-rotate
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroItems.length), 8000);
    return () => clearInterval(t);
  }, [heroItems.length]);

  const ptr = useCallback(() => setHover(true), []);
  const def = useCallback(() => setHover(false), []);
  const go = useCallback(id => { setMenuOpen(false); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80); }, []);

  const submit = e => {
    e.preventDefault();
    const t = `Olá, Alex! Sou *${form.name}* (${form.email}).%0A%0A${form.msg}`;
    window.open(`https://wa.me/5515997569880?text=${t}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fafafa' }}>

      {/* ── GLASS CURSOR ── */}
      {!mob && !video && (
        <motion.div
          className={`glass-cursor ${hover ? 'hover' : ''}`}
          style={{ x: mx, y: my, translateX: '-50%', translateY: '-50%', top: 0, left: 0 }}
          animate={{ width: hover ? 56 : 20, height: hover ? 56 : 20 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* ── NAV — Netflix Style ── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', width: '100%', padding: '0 var(--pad)', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Logo + primary links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <motion.div
              whileHover={{ opacity: 0.85 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              onMouseEnter={ptr} onMouseLeave={def}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }}
            >
              <span style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22, fontWeight: 700, fontStyle: 'italic',
                letterSpacing: '-0.01em', color: '#fff'
              }}>Alex <span style={{ color: 'var(--accent)' }}>Ascencio</span></span>
            </motion.div>

            {/* Desktop nav links */}
            <ul className="nav-links hide-mobile">
              {NAV.map(n => (
                <li key={n.id}>
                  <a href={`#${n.id}`} onClick={e => { e.preventDefault(); go(n.id); }} onMouseEnter={ptr} onMouseLeave={def}>{n.l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: CTA */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button
              onClick={() => go('contact')}
              onMouseEnter={ptr} onMouseLeave={def}
              style={{
                padding: '9px 24px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em',
                textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(196, 18, 48, 0.25)'
              }}
            >
              Contato
            </button>
          </div>

          {/* Mobile burger */}
          <button className="hide-desktop" onClick={() => setMenuOpen(!menuOpen)}
            style={{ width: 40, height: 40, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /></>}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile nav dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
            style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99, padding: 16, background: 'rgba(10,10,10,0.7)', backdropFilter: 'var(--blur)', borderBottom: '1px solid var(--glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => go(n.id)}
                style={{ display: 'block', width: '100%', padding: '16px 8px', textAlign: 'left', fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', borderBottom: '0.5px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em' }}>
                {n.l}
              </button>
            ))}
            <button onClick={() => go('contact')}
              style={{ display: 'block', width: '100%', marginTop: 16, padding: '14px 8px', textAlign: 'left', fontSize: 16, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Contato
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━━ HERO — Netflix Style ━━━━ */}
      <section style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
        {/* Rotating background image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <motion.div style={{ y: heroY, position: 'absolute', inset: 0, willChange: 'transform' }}>
              <motion.img
                src={heroItems[heroIdx]?.img}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: 'linear' }}
                style={{ width: '100%', height: '120%', objectFit: 'cover' }}
                decoding="async"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Vignette overlays — stronger left pull like Netflix */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 55%, #000 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(90deg, #000 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />

        {/* Watermark title — faded behind content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`wm-${heroIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: mob ? 20 : 60, pointerEvents: 'none',
            }}
          >
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: mob ? '10vw' : '13vw',
              fontWeight: 900,
              fontStyle: 'italic',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(255,255,255,0.07)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              textAlign: mob ? 'center' : 'right',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              maxWidth: mob ? '100%' : '65%',
              textOverflow: 'clip',
              userSelect: 'none',
            }}>
              {heroItems[heroIdx]?.title.split('|')[0].split('—')[0].trim()}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Hero content — Centered in max-width container for Ultrawide */}
        <motion.div style={{ opacity: heroOp, position: 'absolute', inset: 0, zIndex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: mob ? '150px' : '10vh' }}>
          <div style={{ maxWidth: 'var(--max-w)', width: '100%', padding: `0 var(--pad)` }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIdx}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: mob ? '100%' : 640, alignItems: mob ? 'center' : 'flex-start' }}
              >
                {/* Netflix-style big title */}
                <h1 className="hero-display-title" style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: mob ? '22px' : 'clamp(3.8rem,5.5vw,5.5rem)',
                  fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.05,
                  color: '#fff', marginBottom: 16, textAlign: mob ? 'center' : 'left'
                }}>
                  {heroItems[heroIdx]?.title.split('|')[0].split('—')[0].trim()}
                </h1>

                {/* Metadata dots row — Consistent Marsala */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap', justifyContent: mob ? 'center' : 'flex-start' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0, boxShadow: '0 0 10px var(--accent)' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Alex Ascencio</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>•</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>{heroItems[heroIdx]?.cat}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>•</span>
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#fff', background: 'rgba(196, 18, 48, 0.4)', border: '1px solid rgba(196, 18, 48, 0.6)', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.05em' }}>{heroItems[heroIdx]?.q}</span>
                </div>

                {/* Description */}
                {!mob && (
                  <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', maxWidth: 520, marginBottom: 32, fontWeight: 400 }}>
                    {heroItems[heroIdx]?.desc}
                  </p>
                )}
                {mob && <div style={{ height: 20 }} />}

                {/* Buttons — Netflix style */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: mob ? 'center' : 'flex-start' }}>
                  <button
                    className="hero-btn-play"
                    onClick={() => setVideo(heroItems[heroIdx])}
                    onMouseEnter={ptr} onMouseLeave={def}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: mob ? '8px 18px' : '15px 36px',
                      background: '#fff', color: '#000',
                      border: 'none', borderRadius: 6,
                      fontSize: mob ? 13 : 18, fontWeight: 800,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width={mob ? 18 : 24} height={mob ? 18 : 24}>
                      <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28a1 1 0 00-1.5.86z" />
                    </svg>
                    Assistir
                  </button>

                  <button
                    onClick={() => go('work')}
                    onMouseEnter={ptr} onMouseLeave={def}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: mob ? '8px 18px' : '15px 36px',
                      background: 'rgba(109,109,110,0.5)',
                      backdropFilter: 'blur(30px)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                      fontSize: mob ? 13 : 18, fontWeight: 800,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.2s',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width={mob ? 18 : 22} height={mob ? 18 : 22}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                    </svg>
                    Mais Info
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* ━━━━ CLIENTS MARQUEE — Seamless Loop ━━━━ */}
      <div style={{ padding: '34px 0', overflow: 'hidden', background: 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(20,20,20,0) 15%, rgba(20,20,20,0) 85%, rgba(0,0,0,1) 100%)' }}>
        <div className="marquee-inner">
          {[0, 1].map(i => (
            <div key={i} className="marquee-track" aria-hidden={i === 1}>
              {/* Multiplying clients to fill any extra space on ultrawide */}
              {[...CLIENTS, ...CLIENTS].map((c, idx) => (
                <span key={`${i}-${idx}`} className="marquee-item">
                  <span className="marquee-dot" />
                  {c}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ━━━━ WORK — Netflix Style ━━━━ */}
      <section id="work" className="section">
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', width: '100%' }}>
          <Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: mob ? 32 : 48 }}>
              <div>
                <h2 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: mob ? '28px' : 'clamp(3.5rem,5.5vw,5.5rem)',
                  fontWeight: 900, fontStyle: 'italic',
                  letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.05,
                }}>Trabalhos <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Selecionados.</em></h2>
              </div>
              <div className="pills-container" style={{ width: '100%' }}>
                <div className="pills-row no-sb" style={{ 
                  display: 'flex', 
                  gap: 8, 
                  overflowX: 'auto', 
                  paddingBottom: 4,
                  margin: mob ? '0 -16px' : '0',
                  paddingLeft: mob ? '16px' : '0'
                }}>
                  {CATS.map(c => (
                    <button key={c} className={`pill ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)} onMouseEnter={ptr} onMouseLeave={def}>
                      {CAT_LABELS[c] || c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <motion.div layout className={`grid ${mob ? 'grid-2' : 'grid-3'}`}>
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: i % 3 * 0.04 }}>
                  <div className="card" onClick={() => setVideo(p)} onMouseEnter={ptr} onMouseLeave={def}>
                    <div className="card-img-wrap">
                      <img src={p.img} loading="lazy" decoding="async" alt={p.title} />
                      <div className="card-overlay" />
                      <div className="card-play">
                        <svg viewBox="0 0 24 24" fill="#fff" width={18} height={18}><path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28a1 1 0 00-1.5.86z" /></svg>
                      </div>
                    </div>
                    <div className="card-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{p.cat}</span>
                        <span style={{ color: 'var(--fg-dim)' }}>•</span>
                        <span className="q-badge">{p.q}</span>
                      </div>
                      <div style={{ fontSize: mob ? 14 : 16, fontWeight: 700, color: 'var(--fg)', lineHeight: 1.3 }}>{p.title}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>



      <section id="about" className="section" style={{ minHeight: mob ? 'auto' : '85vh', display: 'flex', alignItems: 'center' }}>
        <div className="about-container">
          <div className="about-flex">
            
            <Reveal>
              <div className="about-foto-wrap">
                <div className="about-img" onMouseEnter={ptr} onMouseLeave={def} style={{ position: 'relative' }}>
                  <img src="/alex.jpg" alt="Alex Ascencio" loading="lazy" decoding="async" />
                  <motion.a
                    href="https://instagram.com/alexascencioai"
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05, background: '#fff', color: '#000' }}
                    style={{
                      position: 'absolute', bottom: 20, left: 20,
                      padding: '10px 18px', background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(20px) saturate(180%)', color: '#fff',
                      borderRadius: 30, fontSize: 13, fontWeight: 700,
                      textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
                      border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.3s'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    @alexascencioai
                  </motion.a>
                </div>
              </div>
            </Reveal>

            <div className="about-info">
              <Reveal delay={0.2}>
                <h2 className="about-name">Alex <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Ascencio.</em></h2>
                <p className="about-bio">
                  Filmmaker e editor de vídeo com mais de <strong style={{color:'var(--accent)'}}>6 anos de atuação</strong> em produções audiovisuais de alto padrão. Especialista em traduzir grandes histórias em narrativas visuais cinematográficas.
                </p>

                <div className="about-content-grid">
                  <div className="about-exp-content">
                    <p className="section-tag">Experiência</p>
                    {[
                      { t: 'Filmmaker & Editor — PRISMA BRASIL', y: '2024 — Pres.', d: 'Tour internacional (EUA). Produção e edição.' },
                      { t: 'Diretor & Editor — COMMUNION', y: '2024', d: 'Videoclipes TV Novo Tempo.' },
                      { t: 'Filmmaker Freelancer', y: '2020 — Pres.', d: '+18 produções em 4K.' },
                      { t: 'Câmera Broadcast & Streaming', y: '2020 — 2023', d: '+200 transmissões ao vivo.' },
                    ].map((e, idx) => (
                      <div key={idx} className="exp-item">
                        <div className="exp-header">
                          <h4>{e.t}</h4>
                          <span>{e.y}</span>
                        </div>
                        <p>{e.d}</p>
                      </div>
                    ))}
                    {/* Stats moved here */}
                    <div className="stat-grid-mini" style={{ marginTop: 24, justifyContent: mob ? 'space-between' : 'flex-start', display: 'flex', gap: 8 }}>
                      {[{ v: '22+', l: 'PROJETOS' }, { v: '4K', l: 'QUALIDADE' }, { v: '6+', l: 'ANOS EXP.' }].map(s => (
                        <div key={s.l} className="stat-pill" style={{ flex: 1, padding: '8px 12px', justifyContent: 'center' }} onMouseEnter={ptr} onMouseLeave={def}>
                          <span className="stat-v" style={{ fontSize: 16 }}>{s.v}</span>
                          <span className="stat-l" style={{ fontSize: 7 }}>{s.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="about-skills-content">
                    <p className="section-tag">Especialidades</p>
                    {[
                      { l: 'Edição Cinematográfica', v: 95 },
                      { l: 'Direção & Roteiro', v: 75 },
                      { l: 'Color Grading', v: 90 },
                      { l: 'Motion / VFX', v: 65 },
                      { l: 'AI Workflows', v: 80 },
                    ].map((s, idx) => (
                      <div key={s.l} className="skill-row">
                        <div className="skill-header">
                          <span>{s.l}</span>
                          <span style={{color: 'var(--accent)'}}>{s.v}%</span>
                        </div>
                        <div className="skill-track">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${s.v}%` }}
                            transition={{ duration: 1.5, delay: idx * 0.1, ease: "circOut" }}
                            viewport={{ once: true }}
                            className="skill-fill"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <p className="section-tag" style={{ marginTop: 32, marginBottom: 16 }}>Ferramentas</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {["Premiere", "After Eff.", "DaVinci", "vMix", "Runway", "Midjourney"].map(t => (
                        <span key={t} style={{ 
                          fontSize: 9, 
                          fontWeight: 700, 
                          padding: '8px 4px', 
                          border: '1px solid rgba(255,255,255,0.08)', 
                          borderRadius: 6, 
                          color: 'rgba(255,255,255,0.5)', 
                          background: 'rgba(255,255,255,0.02)',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.3s'
                        }}
                        className="tool-badge"
                        onMouseEnter={ptr} onMouseLeave={def}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>


              </Reveal>
            </div>

          </div>
        </div>
      </section>



      {/* ━━━━ CONTACT — Netflix Style ━━━━ */}
      <section id="contact" className="section" style={{ paddingBottom: mob ? 120 : undefined }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', width: '100%' }}>
          <Reveal>
            <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>Contato</p>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: mob ? 'clamp(2.5rem,8.5vw,4.5rem)' : 'clamp(3.5rem,5.5vw,5.5rem)',
              fontWeight: 900, fontStyle: 'italic',
              letterSpacing: '-0.02em', color: 'var(--fg)',
              marginBottom: mob ? 32 : 56, lineHeight: 1.1,
            }}>Vamos {mob && <br />}<em style={{ color: 'var(--accent)', fontStyle: 'italic' }}> Trabalhar Juntos?</em></h2>
          </Reveal>

          <div className="contact-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SOCIALS.map(s => (
                <Reveal key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="social-link" onMouseEnter={ptr} onMouseLeave={def}>
                    <div className="social-icon-wrap" style={{ background: `${s.color}15` }}>
                      <svg viewBox="0 0 24 24" fill={s.color} width={16} height={16}><path d={s.d} /></svg>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{s.label}</span>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="var(--fg-dim)" strokeWidth="2" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6" /></svg>
                  </a>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <input name="name" className="form-input" placeholder="Nome" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onMouseEnter={ptr} onMouseLeave={def} />
                <input name="email" className="form-input" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} onMouseEnter={ptr} onMouseLeave={def} />
                <textarea name="msg" className="form-input" placeholder="Sua mensagem" rows={4} required value={form.msg} onChange={e => setForm({ ...form, msg: e.target.value })} onMouseEnter={ptr} onMouseLeave={def} />
                <a
                  href="/Alex_Ascencio_Curriculo.pdf"
                  download="Alex_Ascencio_Curriculo.pdf"
                  className="btn btn-outline"
                  onMouseEnter={ptr}
                  onMouseLeave={def}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={18} height={18}>
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                  Baixar currículo
                </a>
                <motion.button whileHover={{ scale: 1.01, background: '#128C7E' }} whileTap={{ scale: 0.99 }} type="submit" className="btn btn-filled" onMouseEnter={ptr} onMouseLeave={def}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8, background: '#25D366', color: '#000', border: 'none', boxShadow: '0 4px 20px rgba(37, 211, 102, 0.2)' }}>
                  <svg viewBox="0 0 24 24" fill="#000" width={18} height={18} style={{ marginRight: 10 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  Enviar via WhatsApp
                </motion.button>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ━━━━ FOOTER — Cinematic & Centered ━━━━ */}
      <footer className="footer" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '120px 0 80px', borderTop: '1px solid rgba(255,255,255,0.03)', gap: 40,
        background: 'linear-gradient(to bottom, transparent, rgba(196, 18, 48, 0.02))'
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 28, fontWeight: 900, fontStyle: 'italic', color: '#fff',
            letterSpacing: '-0.02em', display: 'block', marginBottom: 8
          }}>Alex <span style={{ color: 'var(--accent)' }}>Ascencio.</span></span>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.4em' }}>Video Editor & Filmmaker</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mob ? 24 : 48, flexWrap: 'wrap' }}>
          {NAV.map(n => (
            <a key={n.id} href={`#${n.id}`} onClick={e => { e.preventDefault(); go(n.id); }}
              className="footer-link"
              onMouseEnter={ptr} onMouseLeave={def}
              style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'all 0.3s' }}
            >{n.l}</a>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>© 2024 • SÃO PAULO, BRASIL</span>
        </div>
      </footer>

      {/* ━━━━ MOBILE DOCK ━━━━ */}
      <AnimatePresence>
        {mob && showDock && (
          <motion.div 
            initial={{ y: 80, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 80, x: '-50%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="dock"
          >
            {[
              { id: 'work', l: 'WORK', d: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z' },
              { id: 'about', l: 'SOBRE', d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' },
              { id: 'contact', l: 'JOBS', d: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z' }
            ].map(n => (
              <motion.button 
                key={n.id} 
                onClick={() => go(n.id)} 
                whileTap={{ scale: 0.8 }}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', padding: '4px 12px',
                  color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800, 
                  letterSpacing: '0.05em', cursor: 'pointer' 
                }}
              >
                <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} style={{ opacity: 0.9 }}><path d={n.d} /></svg>
                </div>
                {n.l}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━━ VIDEO MODAL ━━━━ */}
      <AnimatePresence>
        {video && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setVideo(null)}
            className="modal-open"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: mob ? 16 : 48 }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 960, aspectRatio: '16/9', borderRadius: mob ? 12 : 20, overflow: 'hidden', background: '#000', border: '0.5px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>
              <iframe src={`${video.url}?autoplay=1&rel=0&modestbranding=1`} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen" allowFullScreen />
            </motion.div>
            <button onClick={() => setVideo(null)}
              style={{ position: 'absolute', top: mob ? 12 : 28, right: mob ? 12 : 28, width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
