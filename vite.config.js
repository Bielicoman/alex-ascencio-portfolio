import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync } from "node:fs";

// public/ guarda originais pesados de identidade visual; o build publica só o necessário.
const PUBLISH = ["media", "brand", "favicon.svg", "favicon-32.png", "apple-touch-icon.png", "Alex_Ascencio_Curriculo.pdf", "robots.txt", "sitemap.xml"];

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: "portfolio-public-assets",
      closeBundle() {
        if (command !== "build") return;
        for (const p of PUBLISH) if (existsSync(`public/${p}`)) cpSync(`public/${p}`, `dist/${p}`, { recursive: true });
      },
    },
  ],
  publicDir: command === "build" ? false : "public",
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // páginas: site, currículo digital e playground de gestos
      input: { main: "index.html", curriculo: "curriculo/index.html" },
      output: { manualChunks: { three: ["three"], motion: ["gsap", "lenis"], react: ["react", "react-dom"] } },
    },
  },
}));
