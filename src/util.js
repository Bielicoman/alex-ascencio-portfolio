import { useEffect, useState } from "react";

export const FPS = 24;
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const p2 = (n) => String(n).padStart(2, "0");
// timecode SMPTE a 24 fps
export const tc = (sec) => {
  const f = Math.floor(sec * FPS);
  return `${p2(Math.floor(f / (FPS * 3600)))}:${p2(Math.floor(f / (FPS * 60)) % 60)}:${p2(Math.floor(f / FPS) % 60)}:${p2(f % FPS)}`;
};
export const mmss = (sec) => `${p2(Math.floor(sec / 60))}:${p2(Math.floor(sec) % 60)}`;

export function useMedia(q) {
  const [m, setM] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q), f = () => setM(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}
