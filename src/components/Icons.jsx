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
export const Play = make("play", <><circle className="p-ring" cx="12" cy="12" r="10" strokeOpacity=".0" /><path className="p-tri" d="M8.5 5.8v12.4L19 12z" fill="currentColor" stroke="none" /></>);
export const Close = make("close", <g className="p-x"><path {...d} d="M6 6l12 12M18 6 6 18" /></g>);
export const Mail = make("mail", <><rect {...d} x="3" y="5" width="18" height="14" rx="3" /><path className="p-flap" {...d} d="m4 7 8 6 8-6" /></>);
export const Copy = make("copy", <><rect className="p-front" {...d} x="8" y="8" width="12" height="12" rx="3" /><path className="p-back" {...d} d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>);
export const Check = make("check", <path {...d} className="p-check" d="m5 12 5 5 9-10" />);
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
export const Wave = make("wave", <>{[[3, 10, 14], [7, 8, 16], [11, 5, 19], [15, 9, 15], [19, 7, 17]].map(([x, a, b], i) => <path key={x} className={`p-bar b${i}`} {...d} d={`M${x} ${a}V${b}`} />)}</>);
export const Aperture = make("aperture", <><circle {...d} cx="12" cy="12" r="9" /><g className="p-blades"><path {...d} d="M14.3 3.3 9 12M20.6 9.6H10.4M18.4 18.3 12.9 9M9.7 20.7 15 12M3.4 14.4h10.2M5.6 5.7l5.5 9.3" /></g></>);
export const Clapper = make("clapper", <><rect {...d} x="3" y="9" width="18" height="12" rx="2" /><g className="p-clap"><path {...d} d="m3.2 8.6 16.4-4.4.8 3-16.4 4.4zM7.5 7.4l2 2.7M12.2 6.2l2 2.6M16.8 4.9l2 2.7" /></g></>);
export const Code = make("code", <><g className="p-l"><path {...d} d="m8 7-5 5 5 5" /></g><g className="p-r"><path {...d} d="m16 7 5 5-5 5" /></g><path className="p-slash" {...d} d="m14 4-4 16" strokeOpacity=".55" /></>);
export const Globe = make("globe", <><circle {...d} cx="12" cy="12" r="9" /><g className="p-spin"><path {...d} d="M12 3c-3 3.2-3 14.8 0 18M12 3c3 3.2 3 14.8 0 18" /></g><path {...d} d="M3.5 9h17M3.5 15h17" /></>);
export const Phone = make("phone", <g className="p-ring2"><path {...d} d="M5 4h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" /></g>);
export const Palette = make("palette", <><circle {...d} cx="12" cy="12" r="9" /><g className="p-spin"><circle cx="12" cy="7" r="1.6" fill="currentColor" stroke="none" /><circle cx="16.3" cy="14.5" r="1.6" fill="currentColor" stroke="none" opacity=".7" /><circle cx="7.7" cy="14.5" r="1.6" fill="currentColor" stroke="none" opacity=".45" /></g></>);
export const Mic = make("mic", <><rect className="p-cap" {...d} x="9" y="3" width="6" height="11" rx="3" /><path {...d} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>);
export const Film = make("film", <><rect {...d} x="3" y="4" width="18" height="16" rx="2.5" /><g className="p-strip"><path {...d} d="M7 4v16M17 4v16M3 8.5h4M3 15.5h4M17 8.5h4M17 15.5h4" /></g></>);
export const Pause = make("pause", <path d="M8 5.5v13M16 5.5v13" strokeWidth="3" />);
export const Prev = make("prev", <g className="p-mv"><path {...d} d="M15 5 8 12l7 7" /></g>);
export const Next = make("next", <g className="p-mv"><path {...d} d="m9 5 7 7-7 7" /></g>);
export const Expand = make("expand", <g className="p-mv"><path {...d} d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></g>);
export const Hand = make("hand", <g className="p-wave"><path {...d} d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12m0-6.8V4.5a1.5 1.5 0 0 1 3 0V12m0-6a1.5 1.5 0 0 1 3 0v6m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.6 15a1.5 1.5 0 0 1 2.3-2L8 15" /></g>);
export const Doc = make("doc", <><path {...d} d="M6 3h8l4 4v14H6z" /><path className="p-fold" {...d} d="M14 3v4h4" /><g className="p-lines"><path className="l1" d="M9 11h6" /><path className="l2" d="M9 14h6" /><path className="l3" d="M9 17h4" /></g></>);
