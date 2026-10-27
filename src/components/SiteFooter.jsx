import { useEffect, useRef } from "react";
import "./SiteFooter.css";
export default function SiteFooter({ logo }) {
  const top = useRef(null);
  const footer = useRef(null);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const clearance = Math.max(20, innerHeight - footer.current.getBoundingClientRect().top + 12);
      document.documentElement.style.setProperty("--footer-clearance", `${clearance}px`);
    };
    const update = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const io = new IntersectionObserver(([entry]) => {
      window.removeEventListener("scroll", update);
      if (entry.isIntersecting) window.addEventListener("scroll", update, { passive: true });
      update();
    });
    io.observe(footer.current); window.addEventListener("resize", update); update();
    return () => { io.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); document.documentElement.style.removeProperty("--footer-clearance"); };
  }, []);
  useEffect(() => { const io = new IntersectionObserver(([e]) => top.current?.classList.toggle("is-visible", e.isIntersecting)); io.observe(top.current); return () => io.disconnect(); }, []);
  return <footer className="footer site-footer" ref={footer}>
    <div className="site-footer-head"><a href="#top" aria-label="Alex Ascencio, início">{logo}</a></div>
    <nav className="site-footer-sections" aria-label="Seções do site"><a href="#filmes">Destaques</a><a href="#lab">Serviços</a><a href="#metodo">Método</a><a href="#arquivo">Projetos</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav>
    <div className="footer-return" ref={top}><a href="#top" className="top-btn" aria-label="Voltar ao topo"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></a></div>
    <div className="site-footer-bottom"><span>© {new Date().getFullYear()} Alex Ascencio</span><nav aria-label="Documentação e políticas"><a href="/documentacao/">Documentação</a><a href="/privacidade/">Privacidade</a><a href="/termos/">Termos</a><a href="/licenca/">Licença MIT</a></nav></div>
  </footer>;
}
