import { useEffect, useRef, useState } from "react";

// Ativação automática no celular; nenhuma configuração aparece no layout.
export default function MotionControl() {
  const [state, setState] = useState("off");
  const cleanup = useRef(() => {});
  const self = useRef(null);
  useEffect(() => () => cleanup.current(), []);
  // liga sozinho em celular: Android/Chrome não exige permissão → inicia na hora;
  // iOS exige gesto do usuário → o primeiro toque em qualquer ponto da tela dispara a permissão.
  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.isSecureContext || !window.DeviceOrientationEvent) return;
    if (typeof DeviceOrientationEvent.requestPermission !== "function") { self.current?.(); return; }
    const first = (e) => {
      if (e.target.closest?.(".motion-control")) return;
      off(); self.current?.();
    };
    const off = () => { window.removeEventListener("touchend", first); window.removeEventListener("click", first); };
    window.addEventListener("touchend", first, { passive: true });
    window.addEventListener("click", first);
    return off;
  }, []);
  async function toggle() {
    cleanup.current();
    if (state === "on") { setState("off"); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setState("reduced"); return; }
    if (!window.isSecureContext || !window.DeviceOrientationEvent) { setState("unavailable"); return; }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function" && await DeviceOrientationEvent.requestPermission() !== "granted") { setState("denied"); return; }
      let base = null, frame = 0, received = false, visible = true;
      const hero = document.querySelector(".hero");
      const observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      observer.observe(hero);
      const move = (event) => {
        if (event.beta == null || event.gamma == null || document.hidden || !visible) return;
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
      cleanup.current = () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("deviceorientation", move); window.removeEventListener("orientationchange", reset); hero.style.removeProperty("--tilt-x"); hero.style.removeProperty("--tilt-y"); window.dispatchEvent(new CustomEvent("portfolio:tilt", { detail: { x: 0, y: 0 } })); };
    } catch { setState("denied"); }
  }
  self.current = toggle;
  if (state === "unavailable") return null; // sem sensor: não mostra rótulo morto
  return null;
}
