import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Play } from "./Icons";

// Seta 3D + luz: posição aplicada no mesmo evento do ponteiro (sem interpolação = sem atraso).
// Só a inclinação da seta tem mola. `host` recebe o <dialog> aberto: o top layer do showModal()
// fica acima de qualquer z-index, então o cursor precisa morar dentro dele.
export default function Cursor({ host }) {
  const wrap = useRef(null), tilt = useRef(null), glow = useRef(null), label = useRef(null);
  const pos = useRef({ x: -200, y: -200 });

  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");
    const s = { rx: 0, ry: 0, rz: 0, vrx: 0, vry: 0, vrz: 0, tx: 0, ty: 0, tz: 0 };
    let lx = 0, ly = 0, lt = performance.now(), idle, raf, last = performance.now();
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    const place = () => {
      const t = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      if (wrap.current) wrap.current.style.transform = t;
      if (glow.current) glow.current.style.transform = t;
    };
    const move = (e) => {
      const x = e.clientX, y = e.clientY, t = performance.now(), dt = Math.max(8, t - lt);
      pos.current.x = x; pos.current.y = y;
      place();
      const vx = ((x - lx) / dt) * 16, vy = ((y - ly) / dt) * 16;
      s.ty = clamp(vx * 2.2, 38); s.tx = clamp(-vy * 2.2, 38); s.tz = clamp(vx * 0.9, 14);
      if (tilt.current) {
        tilt.current.style.setProperty("--sx", `${50 + clamp(vx * 3, 45)}%`);
        tilt.current.style.setProperty("--sy", `${50 + clamp(vy * 3, 45)}%`);
      }
      lx = x; ly = y; lt = t;
      clearTimeout(idle); idle = setTimeout(() => { s.tx = s.ty = s.tz = 0; }, 80);
      root.classList.add("cursor-live");
    };
    // mola da inclinação (rigidez 260, amortecimento 16)
    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      for (const k of ["x", "y", "z"]) {
        const a = 260 * (s["t" + k] - s["r" + k]) - 16 * s["vr" + k];
        s["vr" + k] += a * dt; s["r" + k] += s["vr" + k] * dt;
      }
      if (tilt.current) tilt.current.style.transform = `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg) rotateZ(${s.rz.toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const over = (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const media = t.closest("[data-cursor]");
      const text = t.closest("input:not([type=range]), textarea, select");
      const link = t.closest("a, button, label, [role=button], .floater");
      root.classList.toggle("cursor-frame", t.tagName === "IFRAME");
      root.classList.toggle("cursor-text", !!text);
      root.classList.toggle("cursor-link", !!link && !media && !text);
      root.classList.toggle("cursor-media", !!media);
      root.classList.toggle("cursor-light", !!t.closest("[data-theme=light]"));
      if (media && label.current) label.current.textContent = media.getAttribute("data-cursor");
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
      clearTimeout(idle); cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
      root.classList.remove("has-cursor", "cursor-live", "cursor-link", "cursor-media", "cursor-text", "cursor-down", "cursor-frame", "cursor-light");
    };
  }, []);

  // reposiciona na troca de host (o portal recria os nós)
  useEffect(() => {
    const t = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
    if (wrap.current) wrap.current.style.transform = t;
    if (glow.current) glow.current.style.transform = t;
  }, [host]);

  return createPortal(
    <>
      <div className="cur-glow" ref={glow} aria-hidden="true"><i /></div>
      <div className="cur" ref={wrap} aria-hidden="true">
        <div className="cur-tilt" ref={tilt}>
          <svg className="cur-arrow" viewBox="0 0 28 28" width="28" height="28">
            <defs>
              <linearGradient id="cur-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--c1)" /><stop offset=".55" stopColor="var(--c2)" /><stop offset="1" stopColor="var(--c3)" />
              </linearGradient>
              <linearGradient id="cur-edge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--e1)" stopOpacity=".95" /><stop offset=".5" stopColor="var(--e1)" stopOpacity=".15" /><stop offset="1" stopColor="#ff3b3b" stopOpacity=".9" />
              </linearGradient>
            </defs>
            <path className="cur-shape" d="M5.1 3.2c-1.1-.5-2.3.6-1.8 1.7l8.5 20.1c.5 1.2 2.2 1.1 2.6-.1l2.4-7c.2-.4.5-.8 1-1l7-2.4c1.2-.4 1.3-2.1.1-2.6L5.1 3.2z" fill="url(#cur-fill)" stroke="url(#cur-edge)" strokeWidth="1.1" strokeLinejoin="round" />
            <path className="cur-spec" d="M6.2 5.6 12.4 20" stroke="var(--e1)" strokeOpacity=".75" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>
          <span className="cur-shine" />
        </div>
        <div className="cur-label"><Play size={10} /><b ref={label}>Assistir</b></div>
      </div>
    </>,
    host || document.body,
  );
}
