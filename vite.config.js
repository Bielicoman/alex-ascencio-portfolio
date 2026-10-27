import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { localApi } from "./dev/api-plugin.js";
import { cpSync, existsSync, mkdirSync, createReadStream, readFileSync } from "node:fs";
import { infoPage, writeInfoPages } from "./src/info-pages.js";

// WASM do rastreador de mãos: servido do node_modules no dev e copiado para dist no build (sem CDN de terceiros)
const HAND_SRC = "node_modules/@mediapipe/tasks-vision/wasm";
// variante ESM (roda dentro de Web Worker de módulo); pasta versionada → cache imutável no Vercel
const HAND_FILES = ["vision_wasm_module_internal.js", "vision_wasm_module_internal.wasm"];
const HAND_V = JSON.parse(readFileSync("node_modules/@mediapipe/tasks-vision/package.json", "utf8")).version;

// public/ guarda originais pesados de identidade visual; o build publica só o necessário.
const PUBLISH = ["media", "brand", "favicon.svg", "favicon-32.png", "apple-touch-icon.png", "Alex_Ascencio_Curriculo.pdf", "robots.txt", "sitemap.xml"];

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    localApi(),
    {
      name: "portfolio-public-assets",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const page = infoPage(req.url.split("?")[0]);
          if (!page) return next();
          res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(page);
        });
        server.middlewares.use(`/media/hand/${HAND_V}`, (req, res, next) => {
          const f = req.url.split("?")[0].slice(1);
          if (!HAND_FILES.includes(f)) return next();
          res.setHeader("Content-Type", f.endsWith(".wasm") ? "application/wasm" : "text/javascript");
          createReadStream(`${HAND_SRC}/${f}`).pipe(res);
        });
      },
      closeBundle() {
        if (command !== "build") return;
        for (const p of PUBLISH) if (existsSync(`public/${p}`)) cpSync(`public/${p}`, `dist/${p}`, { recursive: true });
        mkdirSync(`dist/media/hand/${HAND_V}`, { recursive: true });
        for (const f of HAND_FILES) cpSync(`${HAND_SRC}/${f}`, `dist/media/hand/${HAND_V}/${f}`);
        writeInfoPages("dist");
      },
    },
  ],
  publicDir: command === "build" ? false : "public",
  define: { __HAND_V__: JSON.stringify(HAND_V) },
  worker: { format: "es" },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // páginas: portfólio e currículo digital; páginas informativas geradas no fechamento.
      input: { main: "index.html", curriculo: "curriculo/index.html" },
      output: { manualChunks: { three: ["three"], motion: ["gsap", "lenis"], react: ["react", "react-dom"] } },
    },
  },
}));
