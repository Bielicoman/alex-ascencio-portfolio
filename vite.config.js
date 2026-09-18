import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync } from 'node:fs';
export default defineConfig(({ command }) => ({
  plugins: [react(), {name:'portfolio-public-assets',closeBundle(){if(command==='build'){cpSync('public/media','dist/media',{recursive:true});cpSync('public/Alex_Ascencio_Curriculo.pdf','dist/Alex_Ascencio_Curriculo.pdf');cpSync('public/robots.txt','dist/robots.txt');cpSync('public/sitemap.xml','dist/sitemap.xml');}}}],
  publicDir: command === 'build' ? false : 'public',
}));
