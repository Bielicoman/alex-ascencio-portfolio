import { useEffect, useRef, useState } from "react";
import "./ClipPlayer.css";

// Player do YouTube limitado a um trecho [start, end] (segundos). Controles nativos escondidos,
// barra própria só com o intervalo do trecho e trava de posição pela API IFrame.
let apiPromise;
const loadYT = () => apiPromise || (apiPromise = new Promise((resolve) => {
  if (window.YT && window.YT.Player) return resolve(window.YT);
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  s.async = true;
  document.head.appendChild(s);
}));

const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export default function ClipPlayer({ id, start = 0, end, title, autoPlay = true }) {
  const host = useRef(null), player = useRef(null);
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const dur = end - start;

  useEffect(() => {
    let dead = false, timer = 0;
    loadYT().then((YT) => {
      if (dead || !host.current) return;
      const slot = document.createElement("div");
      host.current.appendChild(slot);
      player.current = new YT.Player(slot, {
        host: "https://www.youtube.com",
        videoId: id,
        playerVars: { autoplay: autoPlay ? 1 : 0, controls: 0, start, end, rel: 0, modestbranding: 1, playsinline: 1, disablekb: 1, fs: 0, iv_load_policy: 3, cc_load_policy: 0 },
        events: {
          onReady: (e) => { if (autoPlay) e.target.playVideo(); },
          onStateChange: (e) => {
            const S = YT.PlayerState;
            setPlaying(e.data === S.PLAYING);
            if (e.data === S.ENDED) { setEnded(true); setCur(dur); }
            else if (e.data === S.PLAYING) setEnded(false);
          },
        },
      });
      timer = setInterval(() => {
        const p = player.current;
        if (!p || typeof p.getCurrentTime !== "function") return;
        const t = p.getCurrentTime();
        if (t >= end - 0.2 && p.getPlayerState() === 1) { p.pauseVideo(); setEnded(true); setPlaying(false); setCur(dur); return; }
        if (t < start - 0.5) p.seekTo(start, true);
        setCur(Math.min(dur, Math.max(0, t - start)));
      }, 200);
    });
    return () => { dead = true; clearInterval(timer); try { player.current && player.current.destroy(); } catch (e) { /* já destruído */ } player.current = null; };
  }, [id, start, end]);

  const toggle = () => {
    const p = player.current; if (!p) return;
    if (ended) { setEnded(false); setCur(0); p.seekTo(start, true); p.playVideo(); return; }
    if (playing) p.pauseVideo(); else p.playVideo();
  };
  const seek = (e) => {
    const p = player.current; if (!p) return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setEnded(false); setCur(k * dur);
    p.seekTo(Math.min(end - 0.5, start + k * dur), true);
  };
  const mute = () => { const p = player.current; if (!p) return; if (muted) p.unMute(); else p.mute(); setMuted(!muted); };

  return (
    <div className={`clip${ended ? " is-ended" : ""}`} aria-label={title}>
      <div className="clip-host" ref={host} />
      <button className="clip-hit" onClick={toggle} aria-label={playing ? "Pausar" : "Assistir"} />
      {ended && <div className="clip-end"><button onClick={toggle}>Assistir de novo</button></div>}
      <div className="clip-bar">
        <button className="clip-btn" onClick={toggle} aria-label={playing ? "Pausar" : "Assistir"}>
          {playing
            ? <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            : <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>}
        </button>
        <div className="clip-track" onPointerDown={seek} role="slider" aria-label="Posição" aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(cur)}>
          <i style={{ width: `${Math.min(100, (cur / dur) * 100)}%` }} />
        </div>
        <span className="clip-time mono">{fmt(cur)} / {fmt(dur)}</span>
        <button className="clip-btn clip-mute" onClick={mute} aria-label={muted ? "Ativar som" : "Silenciar"}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" />{muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M16 9a4 4 0 0 1 0 6m2.5-9a8 8 0 0 1 0 12" />}</svg>
        </button>
      </div>
    </div>
  );
}
