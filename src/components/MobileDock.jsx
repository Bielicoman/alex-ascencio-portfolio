import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as I from "./Icons";
import { useMedia } from "../util";
import "./MobileDock.css";

const ITEMS = [["top", "Início", I.Home], ["filmes", "Destaques", I.Film], ["lab", "Serviços", I.Code], ["metodo", "Método", I.Layers], ["arquivo", "Projetos", I.Aperture], ["sobre", "Sobre", I.Hand]];
export default function MobileDock({ onEdth, edthOpen, hidden }) {
  const [active, setActive] = useState("top");
  const mobile = useMedia("(max-width: 760px), (pointer: coarse) and (max-width: 1024px)");
  useEffect(() => {
    if (!mobile) return;
    const triggers = ITEMS.map(([id]) => ScrollTrigger.create({ trigger: `#${id}`, start: "top 55%", end: "bottom 55%", onToggle: s => { if (s.isActive) setActive(id); } }));
    triggers.push(ScrollTrigger.create({ trigger: "#contato", start: "top 55%", end: "max", onToggle: s => { if (s.isActive) setActive("contato"); } }));
    return () => triggers.forEach(t => t.kill());
  }, [mobile]);
  if (hidden) return null;
  return <div className="mobile-dock">
    <nav className="mobile-dock-links" aria-label="Navegação mobile">
      {ITEMS.map(([id, label, Icon]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}><Icon size={19}/><span>{label}</span></a>)}
    </nav>
    <button className="mobile-dock-assistant" aria-label="Falar com a EDITH, assistente por voz" aria-expanded={edthOpen} onClick={() => edthOpen ? document.querySelector(".edth-in")?.focus() : onEdth()}><span className="mobile-dock-orb" aria-hidden="true"/><span>EDITH</span></button>
  </div>;
}
