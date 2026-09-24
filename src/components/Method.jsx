import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { tc, mmss, reducedMotion, useMedia } from "../util";

// Sequência de 60 s usada nas duas simulações (Premiere no desktop, CapCut no celular).
const V1 = [[0, 1, 24], [1, 2, 14], [2, 3, 7], [3, 4, 16], [4, 10, 1], [10, 17, 21], [17, 23, 12], [23, 30, 18], [30, 37, 13], [37, 44, 23], [44, 50, 2], [50, 56, 9]];
const V2 = [[8, 12, 4], [25, 29, 11], [33, 37.5, 5], [46, 50, 17]];
const V3 = [[18, 21, 3], [40, 42.5, 22]];
const FX = [2, 23, 44];
const A1 = [[6, 16], [19, 29], [31.5, 43], [45, 55]];
export const RULES = [
  [0, 4, "Abertura em staccato", "3 a 4 planos de ~1 s, com flash de 2 a 3 frames no meio, antes de assentar em planos de 4 a 7 s."],
  [4, 8, "A imagem vem primeiro", "O plano estabelece o lugar. A fala só entra em A1 aos 6 s, quando o espectador já sabe onde está."],
  [8, 18, "Cobertura curta em V2", "Planos de 2 a 6 s sobre os planos longos. O que foi gravado fora do roteiro vira cobertura."],
  [18, 23, "Insert em V3", "Detalhe com speed ramp a ~130% para marcar o tempo da música."],
  [23, 30, "Transição de bloco", "Glitch/datamosh com RGB split, 2 a 3 frames, e whoosh casado no áudio."],
  [30, 56, "Respiro de cinema", "Pausas acima de 0,6 s. Nunca um corte colado no texto. Áudio medido em LUFS por clipe."],
  [56, 60.1, "Assinatura", "Marca parada por 3 a 4 s. O filme termina quando a imagem assenta."],
];
const DUR = 60;
const pct = (a) => `${(a / DUR) * 100}%`;
const clipName = (id) => `A0${(id % 7) + 1}_C0${String(id).padStart(2, "0")}.mov`;
// nível pseudo-aleatório estável para os medidores (dBFS normalizado 0–1)
const level = (t, ch) => {
  const speech = A1.some(([a, b]) => t >= a && t < b);
  const base = 0.46 + (speech ? 0.22 : 0);
  return Math.min(0.97, base + Math.abs(Math.sin(t * 7.3 + ch * 1.9) * Math.cos(t * 3.1 + ch)) * 0.26);
};

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
  const mobile = useMedia("(max-width: 760px)");
  const [rule, setRule] = useState(0);
  const [shot, setShot] = useState(V1[0][2]);
  const root = useRef(null);

  useEffect(() => {
    const reduced = reducedMotion();
    const el = root.current;
    const q = (s) => el.querySelectorAll(s);
    let clipIdx = -1;
    const st = ScrollTrigger.create({
      trigger: el, start: "top top", end: () => `+=${innerHeight * (reduced ? 1 : 2.6)}`, scrub: true, pin: reduced ? false : el.querySelector(".method-pin"), invalidateOnRefresh: true,
      onUpdate: (s) => {
        const t = s.progress * DUR;
        q(".js-ph").forEach((n) => (n.style.left = `${(t / DUR) * 100}%`));
        q(".js-mtc").forEach((n) => (n.textContent = tc(t)));
        q(".js-mmss").forEach((n) => (n.textContent = mmss(t)));
        q(".js-cctrack").forEach((n) => (n.style.transform = `translate3d(${(-t * +n.dataset.pps).toFixed(1)}px,0,0)`));
        q(".js-meter").forEach((n, i) => n.style.setProperty("--lv", level(t, i % 2).toFixed(3)));
        setRule(Math.max(0, RULES.findIndex(([a, b]) => t >= a && t < b)));
        const ci = V1.findIndex(([a, b]) => t >= a && t < b);
        setShot(t >= 56 ? "end" : (V1[ci] || V1[V1.length - 1])[2]);
        if (ci !== clipIdx) { q(".js-v1 > .is-sel").forEach((n) => n.classList.remove("is-sel")); q(".js-v1").forEach((n) => n.children[ci]?.classList.add("is-sel")); clipIdx = ci; }
        el.classList.toggle("is-glitch", FX.some((f) => Math.abs(t - f) < 0.25));
      },
    });
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => st.kill();
  }, [mobile]);

  const [, , title, text] = RULES[rule];
  const frame = shot === "end"
    ? <div className="monitor-end"><svg viewBox="0 0 262 151" aria-hidden="true"><use href="#aa-mark" /></svg><span>ALEX ASCENCIO</span></div>
    : <img key={shot} src={`/media/${shot}.webp`} alt="" />;

  return (
    <section id="metodo" className="method" ref={root}>
      <div className="method-pin">
        <div className="method-head">
          <span className="eyebrow"><b>04</b>Método</span>
          <h2 className="display js-title"><span className="title-inner">Como eu penso <em>uma timeline.</em></span></h2>
        </div>
        {mobile ? <CapCut frame={frame} rule={rule} title={title} text={text} /> : <Premiere frame={frame} rule={rule} title={title} text={text} />}
      </div>
    </section>
  );
}

/* ───────── Premiere Pro ───────── */
function Premiere({ frame, rule, title, text }) {
  const tools = ["sel", "track", "ripple", "razor", "slip", "pen", "hand", "type"];
  return (
    <div className="pr" aria-label="Simulação de uma timeline no Adobe Premiere Pro">
      <div className="pr-title">
        <span className="pr-dots"><i /><i /><i /></span>
        <span className="pr-file">Alex_Ascencio_Portfolio.prproj</span>
        <nav className="pr-ws" aria-hidden="true"><span>Montagem</span><b>Edição</b><span>Cor</span><span>Efeitos</span><span>Áudio</span><span>Gráficos</span></nav>
        <span className="pr-av">AA</span>
      </div>
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
          <header className="pr-tabs"><b>Programa: SEQ_Portfolio_v05</b><span className="pr-menu">≡</span></header>
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
            {V1.slice(4, 10).map(([, , id]) => (
              <figure key={id}><img src={`/media/${id}.webp`} alt="" loading="lazy" /><figcaption>{clipName(id)}</figcaption></figure>
            ))}
          </div>
          <footer className="pr-foot"><span>23 itens</span><span className="pr-slider"><i /></span></footer>
        </section>

        <div className="pr-tools" aria-hidden="true">{tools.map((k) => <span key={k} className={k === "razor" ? "on" : ""}><Ico d={G[k]} size={13} /></span>)}</div>

        <section className="pr-panel pr-tl">
          <header className="pr-tabs"><b><span className="pr-x">×</span> SEQ_Portfolio_v05</b><span className="pr-menu">≡</span></header>
          <div className="pr-tl-head">
            <span className="pr-tc big js-mtc">00:00:00:00</span>
            <div className="pr-ruler">
              {Array.from({ length: 7 }, (_, i) => <span key={i} style={{ left: pct(i * 10) }}>{tc(i * 10)}</span>)}
              {RULES.map(([a], i) => <i key={i} className={`pr-mk${i === rule ? " on" : ""}`} style={{ left: pct(a) }} />)}
            </div>
          </div>
          <div className="pr-tracks">
            {[
              ["V3", "v", V3.map(([a, b, id]) => <i key={a} className="clip rose" style={{ left: pct(a), width: pct(b - a) }}><em>{clipName(id)} [130%]</em></i>)],
              ["V2", "v", [...V2.map(([a, b, id]) => <i key={a} className="clip iris" style={{ left: pct(a), width: pct(b - a) }}><em>{clipName(id)}</em></i>), ...FX.map((f) => <i key={`fx${f}`} className="clip mango" style={{ left: pct(f - 0.25), width: pct(0.5) }} />)]],
              ["V1", "v", [...V1.map(([a, b, id]) => <i key={a} className="clip violet" style={{ left: pct(a), width: pct(b - a), "--th": `url(/media/${id}.webp)` }}><em>{clipName(id)}</em></i>), <i key="sig" className="clip sig" style={{ left: pct(56), width: pct(4) }}><em>Assinatura</em></i>]],
              ["A1", "a", A1.map(([a, b]) => <i key={a} className="clip forest wav" style={{ left: pct(a), width: pct(b - a) }}><em>Fala.wav</em></i>)],
              ["A2", "a", [<i key="m" className="clip carib wav" style={{ left: 0, width: "100%" }}><em>Trilha_Master.wav</em></i>]],
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
function CapCut({ frame, rule, title, text }) {
  const bar = [["scissors", "Editar"], ["note", "Áudio"], ["txt", "Texto"], ["star", "Efeitos"], ["overlay", "Sobrepor"], ["cc", "Legendas"], ["filter", "Filtros"], ["adjust", "Ajustar"]];
  const w = (a, b) => ({ left: a * PPS, width: (b - a) * PPS - 2 });
  return (
    <div className="cc" aria-label="Simulação de uma timeline no CapCut">
      <div className="cc-top">
        <span className="cc-ib"><Ico d={G.x} size={18} /></span>
        <span className="cc-res">1080P · 30 ▾</span>
        <span className="cc-exp">Exportar</span>
      </div>
      <div className="cc-preview">
        <div className="cc-frame">{frame}<span className="cc-cap" key={title}>{title}</span></div>
      </div>
      <div className="cc-ctrl">
        <span className="cc-time"><b className="js-mmss">00:00</b> / 01:00</span>
        <span className="cc-play"><Ico d={G.play} size={16} fill /></span>
        <span className="cc-ur"><Ico d={G.undo} size={16} /><Ico d={G.redo} size={16} /><Ico d={G.full} size={15} /></span>
      </div>
      <div className="cc-tl">
        <div className="cc-track js-cctrack" data-pps={PPS}>
          <div className="cc-ruler">{Array.from({ length: 31 }, (_, i) => <span key={i} style={{ left: i * 2 * PPS }}>{mmss(i * 2)}</span>)}</div>
          <div className="cc-row fx">{FX.map((f) => <i key={f} style={w(f - 0.3, f + 0.9)}>Glitch</i>)}</div>
          <div className="cc-row tx">{RULES.map(([a, b, t], i) => <i key={t} className={i === rule ? "on" : ""} style={w(a, Math.min(b, 60))}>T {t}</i>)}</div>
          <div className="cc-row ov">{V2.concat(V3).map(([a, b, id]) => <i key={a} style={{ ...w(a, b), "--th": `url(/media/${id}.webp)` }} />)}</div>
          <div className="cc-row main js-v1">
            {V1.map(([a, b, id]) => <i key={a} style={{ ...w(a, b), "--th": `url(/media/${id}.webp)` }} />)}
            <i className="sig" style={w(56, 60)}>AA</i>
          </div>
          <div className="cc-row au">{A1.map(([a, b]) => <i key={a} style={w(a, b)}>Fala</i>)}</div>
          <div className="cc-row mu"><i style={w(0, 60)}>Trilha</i></div>
        </div>
        <span className="cc-ph" aria-hidden="true" />
      </div>
      <div className="cc-rule" aria-live="polite">
        <span className="mono">Regra {String(rule + 1).padStart(2, "0")} / {String(RULES.length).padStart(2, "0")}</span>
        <p key={text}>{text}</p>
      </div>
      <div className="cc-bar" aria-hidden="true">{bar.map(([k, l]) => <span key={k}><Ico d={G[k]} size={19} /><small>{l}</small></span>)}</div>
    </div>
  );
}
