import { useEffect, useRef, useState } from "react";

// Sensor is opt-in; an idle/hidden hero never runs a second animation loop.
export default function MotionControl() {
  const [state, setState] = useState("off");
  const cleanup = useRef(() => {});
  useEffect(() => () => cleanup.current(), []);
  async function toggle() {
    cleanup.current();
    if (state === "on") { setState("off"); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setState("reduced"); return; }
    if (!window.isSecureContext || !window.DeviceOrientationEvent) { setState("unavailable"); return; }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function" && await DeviceOrientationEvent.requestPermission() !== "granted") { setState("denied"); return; }
      let base = null, frame = 0, received = false;
      const hero = document.querySelector(".hero");
      const move = (event) => {
        if (event.beta == null || event.gamma == null || document.hidden || hero.getBoundingClientRect().bottom < 0) return;
        if (!received) { received = true; setState("on"); }
        base ||= { beta: event.beta, gamma: event.gamma };
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          hero.style.setProperty("--tilt-x", `${Math.max(-12, Math.min(12, (event.gamma - base.gamma) * .5))}px`);
          hero.style.setProperty("--tilt-y", `${Math.max(-10, Math.min(10, (event.beta - base.beta) * .4))}px`);
          window.dispatchEvent(new CustomEvent("portfolio:tilt", { detail: { x: Math.max(-1, Math.min(1, (event.gamma - base.gamma) / 24)), y: Math.max(-1, Math.min(1, (event.beta - base.beta) / 24)) } }));
        });
      };
      const reset = () => { base = null; };
      window.addEventListener("deviceorientation", move, { passive: true });
      window.addEventListener("orientationchange", reset);
      setState("waiting");
      const timeout = setTimeout(() => { if (!received) { cleanup.current(); setState("unavailable"); } }, 3500);
      cleanup.current = () => { clearTimeout(timeout); cancelAnimationFrame(frame); window.removeEventListener("deviceorientation", move); window.removeEventListener("orientationchange", reset); hero.style.removeProperty("--tilt-x"); hero.style.removeProperty("--tilt-y"); window.dispatchEvent(new CustomEvent("portfolio:tilt", { detail: { x: 0, y: 0 } })); };
    } catch { setState("denied"); }
  }
  const label = { off: "Ativar movimento 3D", on: "Movimento 3D ligado", waiting: "Incline o celular…", denied: "Sensor não autorizado · tentar", unavailable: "Sensor indisponível", reduced: "Movimento reduzido ativado" }[state];
  return <button className="motion-control" onClick={toggle} aria-label={label} aria-pressed={state === "on"}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="3"/><path d="M3 8 1 12l2 4M21 8l2 4-2 4M11 18h2"/></svg><span role="status">{label}</span></button>;
}
