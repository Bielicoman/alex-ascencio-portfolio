import { useEffect, useRef } from "react";

// Ícones animados: cada parte tem classe própria (CSS em index.css, bloco "ícones animados").
// hover do elemento interativo mais próximo dispara o micro-movimento; `loop` repete em idle;
// `draw` desenha o traço quando o ícone entra na tela.
function useDraw(draw) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!draw || !el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("is-in"); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [draw]);
  return ref;
}
function make(name, body) {
  const Icon = ({ size = 20, loop = false, draw = false, className = "", ...p }) => {
    const ref = useDraw(draw);
    return (
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        className={`ai ai-${name}${loop ? " loop" : ""}${draw ? " draw" : ""} ${className}`} {...p}>
        {body}
      </svg>
    );
  };
  Icon.displayName = name;
  return Icon;
}
const d = { pathLength: 1 };

export const Arrow = make("arrow", <g className="p-mv"><path {...d} d="M7 17 17 7M8 7h9v9" /></g>);
export const ArrowDown = make("down", <g className="p-mv"><path {...d} d="M12 5v14M6 13l6 6 6-6" /></g>);
export const Play = make("play", <><circle className="p-ring" cx="12" cy="12" r="10" strokeOpacity=".0" /><path className="p-tri" d="M7.3 6.4c0-.9 1-1.5 1.8-1l8.3 5.1c.75.46.75 1.54 0 2l-8.3 5.1c-.8.5-1.8-.1-1.8-1z" fill="currentColor" stroke="none" /></>);
export const Close = make("close", <g className="p-x"><path {...d} d="M6 6l12 12M18 6 6 18" /></g>);
export const Mail = make("mail", <><rect {...d} x="3" y="5" width="18" height="14" rx="3" /><path className="p-flap" {...d} d="m4 7 8 6 8-6" /></>);
export const Copy = make("copy", <><rect className="p-front" {...d} x="8" y="8" width="12" height="12" rx="3" /><path className="p-back" {...d} d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>);
export const Check = make("check", <path {...d} className="p-check" d="m5 12.5 4.6 4.6L19 7.5" />);
export const Download = make("download", <><g className="p-mv"><path {...d} d="M12 4v11M7 10l5 5 5-5" /></g><path {...d} d="M5 20h14" /></>);
export const Instagram = make("instagram", <><rect {...d} x="3" y="3" width="18" height="18" rx="5.5" /><circle className="p-lens" {...d} cx="12" cy="12" r="4" /><circle className="p-dot" cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" /></>);
export const Linkedin = make("linkedin", <><rect {...d} x="3" y="3" width="18" height="18" rx="4" /><g className="p-in"><path {...d} d="M8 10.5V17M8 7.2v.1M12 17v-6.5M12 13.3c0-3.6 5-3.6 5 0V17" /></g></>);
export const Whatsapp = make("whatsapp", <><path {...d} d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z" /><path className="p-phone" d="M9.2 8.6c.3-.6.7-.6 1-.6.3 0 .5 0 .7.5l.6 1.4c.1.3 0 .5-.2.7l-.4.5c.6 1.1 1.5 2 2.7 2.6l.5-.5c.2-.2.4-.3.7-.2l1.4.6c.4.2.5.4.4.8-.2.9-1 1.5-1.9 1.4-3.2-.4-5.9-3.1-6.2-6.3 0-.4.3-.8.7-1.1z" fill="currentColor" stroke="none" /></>);
export const Clock = make("clock", <><circle {...d} cx="12" cy="12" r="8.5" /><g className="p-hand"><path d="M12 7.5V12l3 2" /></g></>);
export const Pin = make("pin", <g className="p-mv"><path {...d} d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle {...d} cx="12" cy="9.5" r="2.5" /></g>);
export const Spark = make("spark", <><g className="p-rays"><path {...d} d="M12 3v4M12 17v4M3 12h4M17 12h4" /></g><g className="p-diag"><path {...d} d="M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></g></>);
export const Scissors = make("scissors", <>
  <g className="p-bladeA"><circle {...d} cx="6" cy="7" r="3" /><path {...d} d="M8.5 8.5 20 18" /></g>
  <g className="p-bladeB"><circle {...d} cx="6" cy="17" r="3" /><path {...d} d="M8.5 15.5 20 6" /></g>
</>);
export const Layers = make("layers", <><path className="p-top" {...d} d="m12 3 9 5-9 5-9-5z" /><path {...d} d="m3 13 9 5 9-5" /><path className="p-mid" {...d} d="m3 17 9 5 9-5" strokeOpacity=".45" /></>);
export const Aperture = make("aperture", <><circle {...d} cx="12" cy="12" r="9" /><g className="p-blades"><path {...d} d="M14.3 3.3 9 12M20.6 9.6H10.4M18.4 18.3 12.9 9M9.7 20.7 15 12M3.4 14.4h10.2M5.6 5.7l5.5 9.3" /></g></>);
export const Clapper = make("clapper", <><rect {...d} x="3" y="10" width="18" height="9.6" rx="2" /><g className="p-clap"><rect {...d} x="3" y="4.4" width="18" height="3.6" rx="1.2" /><path {...d} d="M8.4 5.3l1 1.8M13.4 5.3l1 1.8M18.2 5.3l.8 1.5" /></g></>);
export const Code = make("code", <><g className="p-l"><path {...d} d="m8 7-5 5 5 5" /></g><g className="p-r"><path {...d} d="m16 7 5 5-5 5" /></g><path className="p-slash" {...d} d="m14 4-4 16" strokeOpacity=".55" /></>);
export const Palette = make("palette", <><path {...d} d="M12 3.2a8.8 8.8 0 0 0 0 17.6c1.1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7h2a4.8 4.8 0 0 0 4.8-4.8c0-3.9-4-7-9.2-7z" /><g className="p-dots"><circle className="d0" cx="7.6" cy="11.4" r="1.3" fill="currentColor" stroke="none" /><circle className="d1" cx="10" cy="7.6" r="1.3" fill="currentColor" stroke="none" /><circle className="d2" cx="14.6" cy="7.8" r="1.3" fill="currentColor" stroke="none" /></g></>);
export const Mic = make("mic", <><rect className="p-cap" {...d} x="9" y="3" width="6" height="11" rx="3" /><path {...d} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" /><g className="p-lvl"><path d="M2.5 8.5v5M21.5 8.5v5" strokeOpacity=".55" /></g></>);
export const Film = make("film", <><rect {...d} x="3" y="4" width="18" height="16" rx="2.5" /><g className="p-strip"><path {...d} d="M7 4v16M17 4v16M3 8.5h4M3 15.5h4M17 8.5h4M17 15.5h4" /></g></>);
export const Pause = make("pause", <><rect className="p-b1" x="7" y="5.3" width="3.6" height="13.4" rx="1.3" fill="currentColor" stroke="none" /><rect className="p-b2" x="13.4" y="5.3" width="3.6" height="13.4" rx="1.3" fill="currentColor" stroke="none" /></>);
export const Prev = make("prev", <g className="p-mv"><path {...d} d="M15 5 8 12l7 7" /></g>);
export const Next = make("next", <g className="p-mv"><path {...d} d="m9 5 7 7-7 7" /></g>);
export const Expand = make("expand", <g className="p-mv"><path {...d} d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></g>);
export const Doc = make("doc", <><path {...d} d="M6 3h8l4 4v14H6z" /><path className="p-fold" {...d} d="M14 3v4h4" /><g className="p-lines"><path className="l1" d="M9 11h6" /><path className="l2" d="M9 14h6" /><path className="l3" d="M9 17h4" /></g></>);

export const Home = make("home", <><path className="p-roof" {...d} d="M3 10.5 12 3l9 7.5" /><path {...d} d="M5 9v10.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V9" /><path className="p-door" {...d} d="M10 21v-5.5h4V21" /></>);

// Projetos: grade de trabalhos (as células acendem em sequência)
export const Grid = make("grid", <>{[[3, 3], [13.5, 3], [3, 13.5], [13.5, 13.5]].map(([x, y], i) => <rect key={i} className={`p-cell c${i}`} {...d} x={x} y={y} width="7.5" height="7.5" rx="2" />)}</>);
// Método: timeline com três trilhas e a agulha (playhead) que percorre
export const Timeline = make("timeline", <><path {...d} d="M3 7h7M13 7h8M3 12h4M10 12h11M3 17h10M16 17h5" /><g className="p-head"><path d="M8.5 3.5v17" /><path d="M7 3.5h3" /></g></>);
// Sobre: pessoa (cabeça acena de leve)
export const User = make("user", <><circle className="p-headc" {...d} cx="12" cy="8" r="3.6" /><path {...d} d="M4.8 20.5c.6-3.7 3.6-6 7.2-6s6.6 2.3 7.2 6" /></>);
// Cor & áudio: faders (servem a cor e a mix); os cursores sobem e descem fora de fase
export const Sliders = make("sliders", <><path {...d} d="M6 4v16M12 4v16M18 4v16" strokeOpacity=".45" /><g className="p-k k1"><circle cx="6" cy="14" r="2.2" fill="currentColor" stroke="none" /></g><g className="p-k k2"><circle cx="12" cy="9" r="2.2" fill="currentColor" stroke="none" /></g><g className="p-k k3"><circle cx="18" cy="15.5" r="2.2" fill="currentColor" stroke="none" /></g></>);
