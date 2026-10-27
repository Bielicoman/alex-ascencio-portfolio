import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { tc, mmss, reducedMotion, useMedia } from "../util";
import MethodVideo, { METHOD_MEDIA_IDS } from "./MethodVideo";
import "./Method.css";
import REEL_CUTS from "./reel-data.json";
import { PROJECTS } from "../projects";

// Sequência de 60 s usada nas duas simulações (Premiere no desktop, CapCut no celular).
const V1 = REEL_CUTS.map(({start,end,id}) => [start,end,id]);
const V2 = V1.filter((_,i) => i > 3 && i % 5 === 0).map(([a,b,id]) => [a,b,id]);
const V3 = V1.filter((_,i) => i % 9 === 4).map(([a,b,id]) => [a,b,id]);
const shotAt = time => time >= 56 ? "end" : (V3.find(([a,b])=>time>=a&&time<b) || V2.find(([a,b])=>time>=a&&time<b) || V1.find(([a,b])=>time>=a&&time<b) || V1[0])[2];
const BOUNDARIES = [...new Set([...V1,...V2,...V3].flatMap(([a,b])=>[a,b]))].sort((a,b)=>a-b);
const AUDIO_CUTS = BOUNDARIES.slice(0,-1).map((a,i)=>[a,BOUNDARIES[i+1],shotAt(a+.01)]);
const FX = [];
export const RULES = [
  [0, 4, "Abertura em staccato", "Quatro planos de um segundo apresentam cinema, música e animação."],
  [4, 8, "A imagem vem primeiro", "Do gesto ao lugar: imagens que apresentam cada história antes de explicar."],
  [8, 18, "Cinema e performance", "Ficção, palco e videoclipe se encontram pelo movimento e pelo olhar."],
  [18, 23, "Memória e detalhe", "Documentário e planos de cobertura ampliam o que cada cena conta."],
  [23, 30, "Mudança de atmosfera", "Luz, cor e composição conectam produções de linguagens diferentes."],
  [30, 56, "Ritmo de montagem", "Trechos de 12 trabalhos em 32 planos. Cortes diretos e áudio original com entradas e saídas suaves."],
  [56, 60.1, "Assinatura", "Marca parada por 3 a 4 s. O filme termina quando a imagem assenta."],
];
const DUR = 60;
const pct = (a) => `${(a / DUR) * 100}%`;
const clipName = (id) => PROJECTS.find(p => p.id === id)?.title.split(" | ")[0] || `${id}.mp4`;

function Ico({ d, size = 14, fill }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}
const G = {
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  eye: "M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12zM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z",
  mic: "M9 4a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM6 10a6 6 0 0 0 12 0M12 16v4",
  sel: "M5 3l13 8-6 1.5L9 19z",
  track: "M4 4h4v16H4zM11 12h9M16 8l4 4-4 4",
  ripple: "M6 4v16M18 4v16M9 12h6M9 12l2-2M9 12l2 2",
  razor: "M4 20 20 4M8 8a3 3 0 1 1-4-4 3 3 0 0 1 4 4zM20 20l-7-7",
  slip: "M4 8h16M4 16h16M8 4l-4 4 4 4M16 12l4 4-4 4",
  pen: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  hand: "M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7c-2.5 0-4-1.3-5.5-3.5L3 13.5a1.5 1.5 0 0 1 2.5-1.5L8 14",
  type: "M5 6V4h14v2M12 4v16M9 20h6",
  inP: "M6 5v14M6 12h12", outP: "M18 5v14M18 12H6",
  back: "M18 6 10 12l8 6zM6 6v12", fwd: "M6 6l8 6-8 6zM18 6v12",
  play: "M7 4.5v15L19.5 12z",
  lift: "M5 17h14M12 14V5M8 9l4-4 4 4", extract: "M5 17h14M12 5v9M8 10l4 4 4-4",
  cam: "M4 8h3l1.5-2h7L17 8h3v11H4zM12 11a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
  wrench: "M14.5 5.5a4 4 0 0 0 5 5L12 18a2.1 2.1 0 0 1-3-3z",
  plus: "M12 5v14M5 12h14",
  undo: "M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10", redo: "M15 7l5 5-5 5M20 12H9a5 5 0 0 0 0 10",
  full: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  x: "M6 6l12 12M18 6 6 18",
  scissors: "M6 7a3 3 0 1 0 0 .1M6 17a3 3 0 1 0 0 .1M8.5 8.5 20 18M8.5 15.5 20 6",
  note: "M9 18V5l10-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  txt: "M5 6V4h14v2M12 4v16M9 20h6",
  star: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
  overlay: "M4 8h12v12H4zM8 4h12v12",
  cc: "M3 6h18v12H3zM7 11h4M13 11h4M7 14h7",
  filter: "M12 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM8 10a5 5 0 1 0 5 8M16 10a5 5 0 1 1-5 8",
  adjust: "M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4",
};

export default function Method() {
  const mobile = useMedia("(max-width: 760px), (pointer: coarse) and (max-width: 1024px)");
  const [rule, setRule] = useState(0);
  const root = useRef(null);
  useEffect(() => {
    const meters = root.current.querySelectorAll(".js-meter");
    const update = e => meters.forEach(n => n.style.setProperty("--lv", Math.max(0,Math.min(1,Number(e.detail)||0))));
    window.addEventListener("method:level", update);
    return () => window.removeEventListener("method:level", update);
  }, [mobile]);

  useEffect(() => {
    if (mobile) return;
    const reduced = reducedMotion();
    const el = root.current;
    const q = (s) => el.querySelectorAll(s);
    let clipIdx = -1;
    const st = ScrollTrigger.create({
      trigger: el, start: "top top", end: () => mobile ? "bottom 35%" : `+=${innerHeight * (reduced ? 1 : 2.6)}`, scrub: true, pin: false, invalidateOnRefresh: true, // sem pin: a seção rola normal; o vídeo da timeline toca sozinho
    });
    const update = (event) => {
        const t = Math.min(DUR, event.detail);
        q(".js-ph").forEach((n) => (n.style.left = `${(t / DUR) * 100}%`));
        q(".js-mtc").forEach((n) => (n.textContent = tc(t)));
        q(".js-mmss").forEach((n) => (n.textContent = mmss(t)));
        q(".js-cctrack").forEach((n) => (n.style.transform = `translate3d(${(-t * +n.dataset.pps).toFixed(1)}px,0,0)`));
        setRule(Math.max(0, RULES.findIndex(([a, b]) => t >= a && t < b)));
        const ci = V1.findIndex(([a, b]) => t >= a && t < b);
        if (ci !== clipIdx) { q(".js-v1 > .is-sel").forEach((n) => n.classList.remove("is-sel")); q(".js-v1").forEach((n) => n.children[ci]?.classList.add("is-sel")); clipIdx = ci; }
    };
    window.addEventListener("method:time", update);
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => { st.kill(); window.removeEventListener("method:time", update); };
  }, [mobile]);

  const [, , title, text] = RULES[rule];
  const frame = <MethodVideo/>;

  return (
    <section id="metodo" className="method" ref={root}>
      <div className="method-pin">
        <div className="method-head">
          <span className="eyebrow"><b>04</b>Método</span>
          <h2 className="display js-title"><span className="title-inner">Como eu penso <em>uma timeline.</em></span></h2>
        </div>
        {mobile ? <MobileMethod /> : <Premiere frame={frame} rule={rule} title={title} text={text} />}
      </div>
    </section>
  );
}

function MobileMethod() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(() => !reducedMotion());
  const [seek, setSeek] = useState(null);
  const host = useRef(null);
  const active = time >= 60 ? RULES.length - 1 : Math.max(0, RULES.findIndex(([a,b]) => time >= a && time < b));
  const frame = <MethodVideo paused={!playing} hidePlaybackControl seek={seek} onTime={t => { setTime(t); if (t >= 60) setPlaying(false); }}/>;
  return <div className="mobile-method-host" ref={host}><CapCut frame={frame} rule={active} title={RULES[active][2]} text={RULES[active][3]} time={time} playing={playing} onToggle={() => setPlaying(!playing)} onSeek={t => { setTime(t); setSeek({time:t}); }}/></div>;
}

/* ───────── Premiere Pro ───────── */
function Premiere({ frame, rule, title, text }) {
  const tools = ["sel", "track", "ripple", "razor", "slip", "pen", "hand", "type"];
  return (
    <div className="pr" aria-label="Simulação de uma timeline no Adobe Premiere Pro">
      <div className="pr-title">
        <span className="pr-app-icon" aria-hidden="true">Pr</span>
        <span className="pr-file">Alex_Ascencio_DemoReel_v01.prproj</span>
        <nav className="pr-ws" aria-hidden="true"><span>Montagem</span><b>Edição</b><span>Cor</span><span>Efeitos</span><span>Áudio</span><span>Gráficos</span></nav>
        <span className="pr-av">AA</span>
      </div>
      <div className="pr-menubar" aria-hidden="true">Arquivo <span>Editar</span><span>Clipe</span><span>Sequência</span><span>Marcadores</span><span>Gráficos</span><span>Janela</span><span>Ajuda</span></div>
      <div className="pr-grid">
        <section className="pr-panel pr-rules">
          <header className="pr-tabs"><span>Controles de efeito</span><b>Método</b><span>Metadados</span></header>
          <div className="pr-rules-body" aria-live="polite">
            <ol className="pr-props">
              {RULES.map(([a, , t], i) => (
                <li key={t} className={i === rule ? "on" : i < rule ? "done" : ""}>
                  <span className="pr-kf" aria-hidden="true" />
                  <span className="pr-pn">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pr-pt">{t}</span>
                  <span className="pr-pv">{tc(a).slice(3)}</span>
                </li>
              ))}
            </ol>
            <div className="pr-rule">
              <h3 key={title}>{title}</h3>
              <p key={text}>{text}</p>
            </div>
          </div>
        </section>

        <section className="pr-panel pr-program">
          <header className="pr-tabs"><b>Programa: SEQ_DemoReel_v01</b><span className="pr-menu">≡</span></header>
          <div className="pr-screen">{frame}</div>
          <div className="pr-pbar">
            <span className="pr-tc js-mtc">00:00:00:00</span>
            <span className="pr-sel">Ajustar</span>
            <span className="pr-sel">Completo</span>
            <span className="pr-dur">00:01:00:00</span>
          </div>
          <div className="pr-mini"><i className="js-ph" /></div>
          <div className="pr-transport" aria-hidden="true">
            {["inP", "outP", "back", "play", "fwd", "lift", "extract", "cam"].map((k) => <span key={k} className={k === "play" ? "is-play" : ""}><Ico d={G[k]} fill={k === "play"} /></span>)}
          </div>
        </section>

        <section className="pr-panel pr-project">
          <header className="pr-tabs"><b>Projeto: Alex_Ascencio</b><span>Navegador de mídia</span></header>
          <div className="pr-bins">
            {METHOD_MEDIA_IDS.map((id) => (
              <figure key={id}><img src={`/media/method/${id}.webp`} alt="" loading="lazy" /><figcaption>{clipName(id)}</figcaption></figure>
            ))}
          </div>
          <footer className="pr-foot"><span>{METHOD_MEDIA_IDS.length} clipes</span><span className="pr-slider"><i /></span></footer>
        </section>

        <div className="pr-tools" aria-hidden="true">{tools.map((k) => <span key={k} className={k === "razor" ? "on" : ""}><Ico d={G[k]} size={13} /></span>)}</div>

        <section className="pr-panel pr-tl">
          <header className="pr-tabs"><b><span className="pr-x">×</span> SEQ_DemoReel_v01</b><span className="pr-menu">≡</span></header>
          <div className="pr-tl-head">
            <span className="pr-tc big js-mtc">00:00:00:00</span>
            <div className="pr-ruler">
              {Array.from({ length: 7 }, (_, i) => <span key={i} style={{ left: pct(i * 10) }}>{tc(i * 10)}</span>)}
              {RULES.map(([a], i) => <i key={i} className={`pr-mk${i === rule ? " on" : ""}`} style={{ left: pct(a) }} />)}
            </div>
          </div>
          <div className="pr-tracks">
            {[
              ["V3", "v", V3.map(([a, b, id]) => <i key={a} className="clip rose" style={{ left: pct(a), width: pct(b - a) }}><em>{clipName(id)}</em></i>)],
              ["V2", "v", [...V2.map(([a, b, id]) => <i key={a} className="clip iris" style={{ left: pct(a), width: pct(b - a) }}><em>{clipName(id)}</em></i>), ...FX.map((f) => <i key={`fx${f}`} className="clip mango" style={{ left: pct(f - 0.25), width: pct(0.5) }} />)]],
              ["V1", "v", [...V1.map(([a, b, id]) => <i key={a} className="clip violet" style={{ left: pct(a), width: pct(b - a), "--th": `url(/media/method/${id}.webp)` }}><em>{clipName(id)}</em></i>), <i key="sig" className="clip sig" style={{ left: pct(56), width: pct(4) }}><em>Assinatura</em></i>]],
              ["A1", "a", AUDIO_CUTS.map(([a,b,id]) => <i key={a} className="clip forest real-wave" style={{ left: pct(a), width: pct(b-a), "--wave": `url(/media/method/${id}-wave.webp)` }}><em>{id}.mp4 · áudio</em></i>)],
              ["A2", "a", BOUNDARIES.slice(1,-1).map(a=><i key={a} className="clip carib" style={{left:pct(a-.2),width:pct(.4)}} title="Fades de áudio"/>)],
            ].map(([n, k, clips]) => (
              <div className={`pr-trk ${k}`} key={n}>
                <div className="pr-th">
                  <span className="pr-tg"><Ico d={G.lock} size={11} /></span>
                  <b className={n === "V1" || n === "A1" ? "on" : ""}>{n}</b>
                  {k === "v" ? <span className="pr-tg"><Ico d={G.eye} size={12} /></span> : <><span className="pr-ms">M</span><span className="pr-ms">S</span><span className="pr-tg"><Ico d={G.mic} size={11} /></span></>}
                </div>
                <div className="pr-lane">{clips}</div>
              </div>
            ))}
            <div className="pr-phwrap" aria-hidden="true"><div className="pr-ph js-ph"><span /></div></div>
          </div>
          <div className="pr-zoom"><i /></div>
        </section>

        <div className="pr-meters" aria-hidden="true">
          <i className="js-meter" /><i className="js-meter" />
        </div>
      </div>
    </div>
  );
}

/* ───────── CapCut (celular) ───────── */
const PPS = 34; // px por segundo na timeline do CapCut
function CapCut({ frame, rule, title, text, time, playing, onToggle, onSeek }) {
  const bar = [["scissors", "Editar"], ["note", "Áudio"], ["txt", "Texto"], ["star", "Efeitos"], ["overlay", "Sobrepor"], ["cc", "Legendas"], ["filter", "Filtros"], ["adjust", "Ajustar"]];
  const w = (a, b) => ({ left: a * PPS, width: (b - a) * PPS - 2 });
  return (
    <div className="cc" aria-label="Simulação de uma timeline no CapCut">
      <div className="cc-top">
        <span className="cc-ib" aria-hidden="true"><Ico d={G.x} size={18} /></span>
        <span className="cc-demo">Demonstração</span>
        <span className="cc-res">540p · 24 fps</span>
        <a className="cc-exp" href="/media/method/2026-10-27_alex-ascencio_demo-reel_v01.mp4" download="Alex_Ascencio_DemoReel.v1.mp4">Baixar reel</a>
      </div>
      <div className="cc-preview">
        <div className="cc-frame">{frame}</div>
      </div>
      <div className="cc-ctrl">
        <span className="cc-time"><b>{mmss(time)}</b> / 01:00</span>
        <button className="cc-play" aria-label={playing ? "Pausar demonstração" : "Reproduzir demonstração"} onClick={onToggle}><Ico d={playing ? "M8 5v14M16 5v14" : G.play} size={18} fill={!playing} /></button>
        <span className="cc-ur"><Ico d={G.undo} size={16} /><Ico d={G.redo} size={16} /><Ico d={G.full} size={15} /></span>
      </div>
      <div className="cc-tl">
        <div className="cc-track" style={{ width: 60 * PPS, transform: `translate3d(${-time * PPS}px,0,0)` }}>
          <div className="cc-ruler">{Array.from({ length: 31 }, (_, i) => <span key={i} style={{ left: i * 2 * PPS }}>{mmss(i * 2)}</span>)}</div>
          <div className="cc-row fx">{FX.map((f) => <i key={f} style={w(f - 0.3, f + 0.9)}>Glitch</i>)}</div>
          <div className="cc-row tx">{RULES.map(([a, b, t], i) => <i key={t} className={i === rule ? "on" : ""} style={w(a, Math.min(b, 60))}>T {t}</i>)}</div>
          <div className="cc-row ov">{V2.concat(V3).map(([a, b, id]) => <i key={a} style={{ ...w(a, b), "--th": `url(/media/method/${id}.webp)` }} />)}</div>
          <div className="cc-row main js-v1">
            {V1.map(([a, b, id]) => <i key={a} style={{ ...w(a, b), "--th": `url(/media/method/${id}.webp)` }} />)}
            <i className="sig" style={w(56, 60)}>AA</i>
          </div>
          <div className="cc-row au">{AUDIO_CUTS.map(([a,b,id]) => <i key={a} className="real-wave" style={{...w(a,b),"--wave":`url(/media/method/${id}-wave.webp)`}}>{id}.mp4</i>)}</div>
          <div className="cc-row mu">{BOUNDARIES.slice(1,-1).map(a=><i key={a} style={w(a-.2,a+.2)}>Mix</i>)}</div>
        </div>
        <span className="cc-ph" aria-hidden="true" />
        <input className="cc-seek" type="range" min="0" max="60" step=".1" value={time} aria-label="Explorar os 60 segundos da edição" onChange={e => onSeek(+e.target.value)} />
      </div>
      <div className="cc-rule" aria-live="polite">
        <span className="mono">Regra {String(rule + 1).padStart(2, "0")} / {String(RULES.length).padStart(2, "0")}</span>
        <strong>{title}</strong><p key={text}>{text}</p>
      </div>
      <div className="cc-bar" aria-hidden="true">{bar.map(([k, l]) => <span key={k}><Ico d={G[k]} size={19} /><small>{l}</small></span>)}</div>
    </div>
  );
}
