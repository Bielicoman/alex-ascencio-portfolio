import { useEffect, useRef, useState } from "react";

// Perspective-projected particles, with a bounded canvas and no React frame updates.
export function Starfield({ paused = false }) {
  const canvas = useRef(null);
  useEffect(() => {
    const el = canvas.current,
      ctx = el.getContext("2d");
    if (!ctx) return;
    let w = 0,
      h = 0,
      frame = 0,
      last = 0,
      visible = true,
      phase = 0;
    const pointer = { x: 0, y: 0 },
      smooth = { x: 0, y: 0 };
    const stars = Array.from({ length: 125 }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: 0.2 + Math.random() * 0.8,
      r: Math.random() * 0.9 + 0.2,
    }));
    const resize = () => {
      const r = el.getBoundingClientRect();
      w = r.width;
      h = r.height;
      const dpr = Math.min(devicePixelRatio, 1.5);
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    };
    const move = (e) => {
      pointer.x = (e.clientX / innerWidth - 0.5) * 40;
      pointer.y = (e.clientY / innerHeight - 0.5) * 30;
    };
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      smooth.x += (pointer.x - smooth.x) * 0.04;
      smooth.y += (pointer.y - smooth.y) * 0.04;
      for (const s of stars) {
        const x = (s.x * 0.5 + 0.5) * w + smooth.x * s.z,
          y =
            (s.y * 0.5 + 0.5) * h +
            smooth.y * s.z +
            Math.sin(phase * 0.4 + s.x * 5) * 3;
        const a = 0.25 + s.z * 0.45 + Math.sin(phase + s.y * 6) * 0.12;
        ctx.fillStyle = `rgba(230,231,246,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r * s.z + 0.25, 0, Math.PI * 2);
        ctx.fill();
        if (s.z > 0.95) {
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.35})`;
          ctx.beginPath();
          ctx.moveTo(x - 4, y);
          ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4);
          ctx.lineTo(x, y + 4);
          ctx.stroke();
        }
      }
    }
    function loop(t) {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden || paused || t - last < 32) return;
      phase += 0.013;
      last = t;
      draw(t);
    }
    const obs = new ResizeObserver(resize);
    obs.observe(el);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(el);
    if (!paused) {
      window.addEventListener("pointermove", move, { passive: true });
      frame = requestAnimationFrame(loop);
    }
    resize();
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", move);
    };
  }, [paused]);
  return <canvas ref={canvas} className="starfield" aria-hidden="true" />;
}

export default function LensScene({ paused = false, hue = 0, aperture = 55 }) {
  const host = useRef(null),
    controls = useRef({ hue, aperture, paused });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    controls.current = { hue, aperture, paused };
  }, [hue, aperture, paused]);
  useEffect(() => {
    let disposed = false,
      cleanup = () => {};
    async function setup() {
      try {
        const T = await import("three");
        const { RoomEnvironment } =
          await import("three/addons/environments/RoomEnvironment.js");
        if (disposed) return;
        const el = host.current,
          scene = new T.Scene(),
          camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.z = 9;
        const renderer = new T.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        el.appendChild(renderer.domElement);
        const pmrem = new T.PMREMGenerator(renderer),
          room = new RoomEnvironment(),
          env = pmrem.fromScene(room, 0.04);
        scene.environment = env.texture;
        room.dispose();
        pmrem.dispose();
        const group = new T.Group();
        scene.add(group);
        const silver = new T.MeshStandardMaterial({
          color: 0xa6a6b4,
          metalness: 1,
          roughness: 0.21,
        });
        const black = new T.MeshStandardMaterial({
          color: 0x171720,
          metalness: 0.88,
          roughness: 0.25,
        });
        const red = new T.MeshPhysicalMaterial({
          color: 0xc4122f,
          metalness: 0.65,
          roughness: 0.15,
          clearcoat: 1,
        });
        const rings = [];
        for (let i = 0; i < 4; i++) {
          const ring = new T.Mesh(
            new T.TorusGeometry(1.52 - i * 0.12, 0.07, 16, 96),
            i % 2 ? silver : black,
          );
          ring.position.z = -i * 0.14;
          group.add(ring);
          rings.push(ring);
        }
        const barrel = new T.Mesh(
          new T.CylinderGeometry(1.58, 1.48, 0.6, 80, 1, true),
          black,
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.4;
        group.add(barrel);
        const iris = new T.Group();
        iris.position.z = 0.08;
        group.add(iris);
        for (let i = 0; i < 8; i++) {
          const pivot = new T.Group();
          pivot.rotation.z = (i * Math.PI) / 4;
          const blade = new T.Mesh(
            new T.BoxGeometry(0.95, 0.62, 0.035),
            silver,
          );
          blade.position.x = 0.7;
          blade.rotation.z = 0.6;
          pivot.add(blade);
          iris.add(pivot);
        }
        const core = new T.Mesh(new T.SphereGeometry(0.72, 48, 32), red);
        core.scale.z = 0.2;
        core.position.z = -0.12;
        group.add(core);
        const orbit = new T.Mesh(
          new T.TorusGeometry(2.1, 0.013, 8, 120),
          silver,
        );
        orbit.rotation.x = 0.65;
        orbit.rotation.y = 0.4;
        group.add(orbit);
        const pin = new T.Mesh(new T.SphereGeometry(0.055, 16, 16), red);
        pin.position.x = 2.1;
        orbit.add(pin);
        scene.add(new T.AmbientLight(0xffffff, 0.7));
        const key = new T.DirectionalLight(0xffffff, 3);
        key.position.set(3, 3, 5);
        scene.add(key);
        const rim = new T.PointLight(0xff244e, 35);
        rim.position.set(-3, -1, 3);
        scene.add(rim);
        let visible = true,
          raf = 0,
          last = 0,
          t = 0,
          drag = false,
          px = 0,
          py = 0,
          rx = -0.1,
          ry = -0.3;
        const resize = () => {
          const { width, height } = el.getBoundingClientRect();
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const move = (e) => {
          const r = el.getBoundingClientRect();
          if (drag) {
            ry += (e.clientX - px) * 0.008;
            rx += (e.clientY - py) * 0.006;
          } else {
            ry = ((e.clientX - r.left - r.width / 2) / r.width) * 0.7;
            rx = ((e.clientY - r.top - r.height / 2) / r.height) * 0.45;
          }
          px = e.clientX;
          py = e.clientY;
        };
        const down = (e) => {
          drag = true;
          px = e.clientX;
          py = e.clientY;
          el.setPointerCapture(e.pointerId);
        };
        const up = () => {
          drag = false;
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerdown", down);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
        function render(now) {
          raf = requestAnimationFrame(render);
          if (!visible || document.hidden || now - last < 32) return;
          last = now;
          const c = controls.current;
          if (!c.paused) t += 0.013;
          group.rotation.y += (ry - group.rotation.y) * 0.07;
          group.rotation.x += (rx - group.rotation.x) * 0.07;
          group.rotation.z = c.paused ? 0 : Math.sin(t * 0.5) * 0.07;
          iris.rotation.z = c.aperture * 0.009;
          iris.children.forEach((p) => {
            p.children[0].position.x = 0.42 + c.aperture * 0.006;
          });
          red.color.setHSL(c.hue / 360, 0.75, 0.43);
          rim.color.copy(red.color);
          orbit.rotation.z = t * 0.12;
          renderer.render(scene, camera);
        }
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        const io = new IntersectionObserver(
          ([entry]) => (visible = entry.isIntersecting),
        );
        io.observe(el);
        resize();
        raf = requestAnimationFrame(render);
        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerdown", down);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
          scene.traverse((o) => {
            o.geometry?.dispose();
          });
          silver.dispose();
          black.dispose();
          red.dispose();
          env.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!disposed) setFailed(true);
      }
    }
    const loader = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loader.disconnect();
          setup();
        }
      },
      { rootMargin: "300px" },
    );
    loader.observe(host.current);
    return () => {
      disposed = true;
      loader.disconnect();
      cleanup();
    };
  }, []);
  return (
    <div
      className="lens-canvas"
      ref={host}
      role="img"
      aria-label="Lente cinematográfica 3D. Arraste para girar ou use os controles de abertura e cor abaixo."
    >
      {failed && (
        <img src="/media/aperture-poster.webp" alt="Lente cinematográfica" />
      )}
    </div>
  );
}
