# Alex Ascencio — Portfólio v04

Reconstrução completa do site. React 19 + Vite 7, three.js (partículas e lente em shader), GSAP ScrollTrigger + Lenis (scroll suave), fontes Geist / Geist Mono hospedadas localmente.

## Rodar
    npm ci
    npm run dev       # desenvolvimento
    npm run build     # gera dist/
    npm run preview   # serve dist/ em http://localhost:4173

## Estrutura
- `src/App.jsx` — todas as seções (hero, manifesto, filmes, lab, método, arquivo, sobre, contato).
- `src/projects.js` — trabalhos (mesmo arquivo da v01; miniaturas em `public/media/{id}.webp`).
- `src/components/ParticleField.js` — campo de partículas que reage ao cursor e vira a marca AA no scroll.
- `src/components/LensField.js` — vídeo da lente como fundo reativo (bulge, aberração cromática, spot).
- `src/brand.js` — marca AA vetorizada a partir do PNG oficial (3000 px).
- `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` — marca no círculo vermelho.

## Removido da v01
Retratos gerados por IA (`portrait-v2`, `studio-v2`) e a cena 3D da lente do rodapé. A foto do hero é o recorte oficial; a do Sobre é o retrato de estúdio oficial.

## Contato
WhatsApp +55 15 99756-9880, e-mail ascencioalexgabriel@gmail.com, Instagram @alexascencioai, LinkedIn /in/ascencioalexgabriel — constantes no topo de `src/App.jsx`.

Movimento reduzido respeitado (sem pins, sem Lenis, poster estático no Lab).

## Logos de clientes
`public/media/logos/*.png` — silhuetas brancas sem fundo geradas a partir dos arquivos oficiais. Altura de exibição por área óptica equivalente: `h = 58 / sqrt(aspecto) × (0,45 / densidade)^0,35`, limitada a 54 px (valores em `CLIENTS`, `src/App.jsx`).

## Build
`public/` guarda originais pesados de identidade (não publicados). `vite.config.js` copia para `dist/` só: media, brand, favicons, currículo, robots e sitemap.

## Vídeos hospedados no site
Projetos sem YouTube usam `video: "/media/videos/arquivo.mp4"` em `src/projects.js` e a miniatura em `public/media/{id}.webp`. Encode: H.264 High, CRF 22, maxrate 3 Mb/s, AAC 160k, `-movflags +faststart` (~20 MB por minuto de 1080p).

## Logotipo
`Lockup` e `Wordmark` em `src/App.jsx` usam `WM_PATH` (src/brand.js): "Alex Ascencio" em Geist 640 com os dois A substituídos pelo A triangular da marca (86% de largura). Arquivos finais em `G:\Meu Drive\01 PESSOAL\IDENTIDADE VISUAL\LOGOTIPO`.
