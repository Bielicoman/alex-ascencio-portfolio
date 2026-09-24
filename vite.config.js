import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync, mkdirSync, createReadStream } from "node:fs";

// WASM do rastreador de mãos: servido do node_modules no dev e copiado para dist no build (sem CDN de terceiros)
const HAND_SRC = "node_modules/@mediapipe/tasks-vision/wasm";
const HAND_FILES = ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"];

// public/ guarda originais pesados de identidade visual; o build publica só o necessário.
const PUBLISH = ["media", "brand", "favicon.svg", "favicon-32.png", "apple-touch-icon.png", "Alex_Ascencio_Curriculo.pdf", "robots.txt", "sitemap.xml"];

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: "portfolio-public-assets",
      configureServer(server) {
        server.middlewares.use("/media/hand/wasm", (req, res, next) => {
          const f = req.url.split("?")[0].slice(1);
          if (!HAND_FILES.includes(f)) return next();
          res.setHeader("Content-Type", f.endsWith(".wasm") ? "application/wasm" : "text/javascript");
          createReadStream(`${HAND_SRC}/${f}`).pipe(res);
        });
      },
      closeBundle() {
        if (command !== "build") return;
        for (const p of PUBLISH) if (existsSync(`public/${p}`)) cpSync(`public/${p}`, `dist/${p}`, { recursive: true });
        mkdirSync("dist/media/hand/wasm", { recursive: true });
        for (const f of HAND_FILES) cpSync(`${HAND_SRC}/${f}`, `dist/media/hand/wasm/${f}`);
      },
    },
  ],
  publicDir: command === "build" ? false : "public",
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // páginas: site, currículo digital e playground de gestos
      input: { main: "index.html", curriculo: "curriculo/index.html", playground: "playground/index.html" },
      output: { manualChunks: { three: ["three"], motion: ["gsap", "lenis"], react: ["react", "react-dom"] } },
    },
  },
}));
