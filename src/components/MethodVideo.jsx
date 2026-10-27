import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "./Icons";
import "./MethodVideo.css";

// Intervalos reais dos trabalhos de Alex; estes IDs também alimentam a timeline.
export const METHOD_MEDIA_IDS = [34, 35, 1, 7];
export const METHOD_MEDIA = {
  34: { src: "/media/method/34.mp4", title: "Ele É · Gabriella Stehling e Benjamin Montecinos" },
  35: { src: "/media/method/35.mp4", title: "Voltemos ao Início · Gabriella Stehling" },
  1: { src: "/media/method/1.mp4", title: "Meu Respirar · Gabriella Stehling" },
  7: { src: "/media/method/7.mp4", title: "O Nome · Prisma Brasil" },
};

function AudioIcon({ muted }) {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />{muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M16 9a4 4 0 0 1 0 6m2.5-9a8 8 0 0 1 0 12" />}</svg>;
}

export default function MethodVideo({ shot, onLevel, paused = false, hidePlaybackControl = false }) {
  const host = useRef(null), videos = useRef([]), engine = useRef(null);
  const desired = useRef(shot), report = useRef(onLevel);
  desired.current = shot; report.current = onLevel;
  const [muted, setMuted] = useState(true), [playing, setPlaying] = useState(false), [error, setError] = useState(false);

  useEffect(() => {
    const nodes = videos.current.slice(), media = matchMedia("(prefers-reduced-motion: reduce)");
    let alive = true, visible = false, wanted = !paused && !media.matches, audioOn = false;
    let active = 0, current = null, sequence = 0, cancelLoad = null, fadeTimer = 0, audioTimer = 0;
    let context = null, master = null, analyser = null, gains = [], sources = [], meter = 0, lastLevel = -1, lastMeter = 0;
    const samples = new Float32Array(1024);
    const level = value => {
      if (!alive || (value === 0 && lastLevel === 0)) return;
      lastLevel = value;
      report.current?.(value);
      window.dispatchEvent(new CustomEvent("method:level", { detail: value }));
    };
    const stopMeter = () => { cancelAnimationFrame(meter); meter = 0; level(0); };
    const startMeter = () => {
      if (meter || !audioOn || !visible || document.hidden || !analyser || context.state !== "running") return;
      const read = now => {
        if (!alive || !audioOn || !visible || document.hidden || desired.current === "end" || context.state !== "running") { stopMeter(); return; }
        meter = requestAnimationFrame(read);
        if (now - lastMeter < 50) return;
        lastMeter = now;
        analyser.getFloatTimeDomainData(samples);
        let sum = 0; for (const value of samples) sum += value * value;
        level(Math.min(1, Math.sqrt(sum / samples.length)));
      };
      meter = requestAnimationFrame(read);
    };
    const settleGains = () => {
      if (!context) return;
      gains.forEach((gain, i) => { gain.gain.cancelScheduledValues(context.currentTime); gain.gain.setValueAtTime(i === active && current !== null ? 1 : 0, context.currentTime); });
    };
    const cancelPending = () => { sequence++; cancelLoad?.(); cancelLoad = null; clearTimeout(fadeTimer); clearTimeout(audioTimer); };
    const waitForData = video => new Promise(resolve => {
      let finished = false;
      const done = ok => {
        if (finished) return; finished = true; clearTimeout(timer);
        video.removeEventListener("loadeddata", ready); video.removeEventListener("error", fail);
        if (cancelLoad === cancel) cancelLoad = null;
        resolve(ok);
      };
      const ready = () => done(true), fail = () => done(false), cancel = () => { done(false); video.pause(); video.removeAttribute("src"); video.load(); };
      const timer = setTimeout(fail, 12000);
      cancelLoad = cancel;
      video.addEventListener("loadeddata", ready); video.addEventListener("error", fail);
      video.load();
    });
    const choose = async () => {
      if (!alive || !visible || document.hidden || !wanted || desired.current === "end") return;
      const id = METHOD_MEDIA[desired.current] ? Number(desired.current) : METHOD_MEDIA_IDS[0];
      if (id === current && nodes[active].readyState >= 2) {
        try { await nodes[active].play(); if (alive) { setPlaying(true); startMeter(); } }
        catch { if (alive) { setPlaying(false); setError(true); } }
        return;
      }
      cancelPending(); const turn = sequence, previous = active, hadPrevious = current !== null;
      settleGains(); nodes.forEach((video, i) => { video.style.opacity = hadPrevious && i === previous ? "1" : "0"; if (i !== previous) video.pause(); });
      const next = hadPrevious ? 1 - previous : 0, video = nodes[next];
      video.muted = !audioOn; video.preload = "auto"; video.src = METHOD_MEDIA[id].src;
      const ready = await waitForData(video);
      if (!alive || turn !== sequence || !visible || document.hidden || !wanted) return;
      if (!ready) { setError(true); return; }
      try { await video.play(); }
      catch { if (alive && turn === sequence) { setPlaying(false); setError(true); } return; }
      if (!alive || turn !== sequence || !visible || document.hidden || !wanted) { video.pause(); return; }
      active = next; current = id; setError(false); setPlaying(true);
      video.style.zIndex = "2"; nodes[1 - next].style.zIndex = "1";
      // O plano anterior fica opaco até a chegada completar: evita escurecer no meio do dissolve.
      video.style.opacity = "1";
      if (context) {
        const time = context.currentTime;
        gains.forEach(gain => gain.gain.cancelScheduledValues(time));
        if (hadPrevious && !media.matches) {
          const incoming = new Float32Array(65), outgoing = new Float32Array(65);
          for (let i = 0; i < 65; i++) { incoming[i] = Math.sin(i / 64 * Math.PI / 2); outgoing[i] = Math.cos(i / 64 * Math.PI / 2); }
          gains[next].gain.setValueCurveAtTime(incoming, time, .4);
          gains[previous].gain.setValueCurveAtTime(outgoing, time, .4);
        } else settleGains();
      }
      fadeTimer = setTimeout(() => { if (alive && turn === sequence) { nodes[1 - next].pause(); nodes[1 - next].style.opacity = "0"; settleGains(); } }, media.matches ? 0 : 440);
      startMeter();
    };
    const sync = () => {
      if (!alive) return;
      if (desired.current === "end" || !visible || document.hidden || !wanted) {
        cancelPending(); nodes.forEach(video => { video.pause(); video.preload = "none"; }); settleGains(); stopMeter(); setPlaying(false);
        if (desired.current === "end") current = null;
        if (context) context.suspend().catch(() => {});
        return;
      }
      if (context && audioOn) context.resume().then(startMeter).catch(() => {});
      choose();
    };
    const toggleAudio = async () => {
      if (desired.current === "end") return;
      if (audioOn) {
        audioOn = false; setMuted(true); nodes.forEach(video => { video.muted = true; }); stopMeter();
        if (context) { master.gain.cancelScheduledValues(context.currentTime); master.gain.setTargetAtTime(0, context.currentTime, .02); audioTimer = setTimeout(() => { if (!audioOn && alive) context.suspend().catch(() => {}); }, 100); }
        return;
      }
      try {
        if (!context) {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) return;
          context = new Audio({ latencyHint: "interactive" }); master = context.createGain(); master.gain.value = 0;
          analyser = context.createAnalyser(); analyser.fftSize = 1024; analyser.connect(master); master.connect(context.destination);
          nodes.forEach(video => { const source = context.createMediaElementSource(video), gain = context.createGain(); gain.gain.value = 0; source.connect(gain).connect(analyser); sources.push(source); gains.push(gain); });
        }
        await context.resume();
        if (!alive) return;
        clearTimeout(audioTimer); audioOn = true; setMuted(false);
        nodes.forEach(video => { video.muted = false; }); settleGains(); master.gain.setTargetAtTime(1, context.currentTime, .04);
        sync();
      } catch { if (alive) { audioOn = false; setMuted(true); nodes.forEach(video => { video.muted = true; }); stopMeter(); } }
    };
    const visibility = () => sync();
    const motion = () => { if (media.matches) wanted = false; sync(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .01 });
    observer.observe(host.current); document.addEventListener("visibilitychange", visibility); media.addEventListener("change", motion);
    engine.current = { update: sync, setPaused: value => { wanted = !value; sync(); }, toggleAudio, togglePlayback: () => { wanted = nodes[active].paused; sync(); } };
    level(0);
    return () => {
      observer.disconnect(); document.removeEventListener("visibilitychange", visibility); media.removeEventListener("change", motion);
      cancelPending(); stopMeter(); alive = false; engine.current = null;
      nodes.forEach(video => { video.pause(); video.removeAttribute("src"); video.load(); });
      sources.forEach(source => source.disconnect()); gains.forEach(gain => gain.disconnect()); analyser?.disconnect(); master?.disconnect(); context?.close().catch(() => {});
    };
  }, []);
  useEffect(() => { engine.current?.update(); }, [shot]);
  const lastPaused = useRef(paused);
  useEffect(() => {
    if (lastPaused.current !== paused) engine.current?.setPaused(paused);
    lastPaused.current = paused;
  }, [paused]);

  const ending = shot === "end";
  return <div ref={host} className={`method-video${ending ? " is-end" : ""}`} aria-label={ending ? "Assinatura Alex Ascencio" : `Trecho real: ${METHOD_MEDIA[shot]?.title || "trabalho de Alex Ascencio"}`}>
    {[0, 1].map(index => <video key={index} ref={node => { videos.current[index] = node; }} className="method-video-layer" muted playsInline loop preload="none" aria-hidden="true" disablePictureInPicture />)}
    <div className="method-video-signature" aria-hidden={!ending}><svg viewBox="0 0 262 151" aria-hidden="true"><use href="#aa-mark" /></svg><span>ALEX ASCENCIO</span></div>
    {!ending && <div className="method-video-controls">
      {!hidePlaybackControl && <button type="button" onClick={() => engine.current?.togglePlayback()} aria-label={playing ? "Pausar trecho" : "Reproduzir trecho"}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>}
      <button type="button" onClick={() => engine.current?.toggleAudio()} aria-label={muted ? "Ativar áudio do trecho" : "Silenciar áudio do trecho"} aria-pressed={!muted}><AudioIcon muted={muted} /><span>{muted ? "Ouvir trecho" : "Áudio ligado"}</span></button>
    </div>}
    {error && !ending && <span className="method-video-error" role="status">Não foi possível reproduzir. Toque em reproduzir para tentar novamente.</span>}
  </div>;
}
