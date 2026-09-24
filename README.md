# Alex Ascencio — Portfólio v05

Reconstrução completa do site. React 19 + Vite 7, three.js (partículas e lente em shader), GSAP ScrollTrigger + Lenis (scroll suave), fontes Geist / Geist Mono hospedadas localmente.

## Rodar
    npm ci
    npm run dev       # desenvolvimento
    npm run build     # gera dist/
    npm run preview   # serve dist/ em http://localhost:4173

## Estrutura
- `src/App.jsx` — seções (hero, manifesto, filmes, lab, arquivo, sobre, contato, rodapé) e a abertura.
- `src/components/Method.jsx` — seção Método: simulação do Premiere Pro (desktop) e do CapCut (≤ 760 px), dirigida pelo scroll.
- `src/components/Floaters.js` — elementos da hero em gravidade zero (flutuação, tilt 3D, arrasto com inércia, retorno por mola).
- `src/components/Cursor.jsx` — seta 3D + luz sem interpolação; entra no `<dialog>` do player via portal (top layer).
- `src/components/MarkScene.js` — marca AA extrudada em three.js no contato (tema claro).
- `src/components/Icons.jsx` — ícones animados (hover e loop).
- `src/components/Demo.js` — tour "Assistir o site": rola o site, guia o cursor por eventos sintéticos, toca o preview do último lançamento e dos 4 primeiros projetos e para no contato. Qualquer entrada real (`isTrusted`) devolve o controle.
- `src/projects.js` — trabalhos (mesmo arquivo da v01; miniaturas em `public/media/{id}.webp`).
- `src/components/ParticleField.js` — campo de partículas que reage ao cursor e vira a marca AA no scroll.
- `src/components/LensField.js` — vídeo da lente como fundo reativo (bulge, aberração cromática, spot).
- `src/brand.js` — marca AA vetorizada a partir do PNG oficial (3000 px).
- `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` — marca no círculo vermelho.

## Removido da v01
Retratos gerados por IA (`portrait-v2`, `studio-v2`) e a cena 3D da lente do rodapé. A foto do hero é o recorte oficial; a do Sobre é o retrato de estúdio oficial.

## Contato
WhatsApp +55 15 99756-9880, e-mail ascencioalexgabriel@gmail.com, Instagram @alexascencioai, LinkedIn /in/ascencioalexgabriel — constantes no topo de `src/App.jsx`.

Movimento reduzido respeitado (sem pins, sem Lenis, sem abertura, poster estático no Lab).

## Abertura
Letterbox que abre a partir de uma fenda de luz. A hero recebe o estado inicial antes do primeiro paint e só anima uma vez. A cortina espera fontes + decode do recorte + 0,9 s mínimo. `gsap.ticker.lagSmoothing(500, 33)`: com `0`, uma travada no carregamento pulava a abertura inteira.

## Logos de clientes
`public/media/logos/*.png` — silhuetas brancas sem fundo geradas a partir dos arquivos oficiais. Altura de exibição por área óptica equivalente: `h = 58 / sqrt(aspecto) × (0,45 / densidade)^0,35`, limitada a 54 px (valores em `CLIENTS`, `src/App.jsx`).

## Build
`public/` guarda originais pesados de identidade (não publicados). `vite.config.js` copia para `dist/` só: media, brand, favicons, currículo, robots e sitemap.

## Vídeos hospedados no site
Projetos sem YouTube usam `video: "/media/videos/arquivo.mp4"` em `src/projects.js` e a miniatura em `public/media/{id}.webp`. Encode: H.264 High, CRF 22, maxrate 3 Mb/s, AAC 160k, `-movflags +faststart` (~20 MB por minuto de 1080p).

## Logotipo
`Lockup` e `Wordmark` em `src/App.jsx` usam `WM_PATH` (src/brand.js): "Alex Ascencio" em Geist 640 com os dois A substituídos pelo A triangular da marca (86% de largura). Arquivos finais em `G:\Meu Drive\01 PESSOAL\IDENTIDADE VISUAL\LOGOTIPO`.

## Desempenho
Partículas: 6000 pontos (2600 no celular), DPR máx. 1,25. Lente: DPR 1. Marca 3D: DPR 1,5, só renderiza visível.
Grão estático; flutuantes com `backdrop-filter` de 10 px; nenhum `filter` animado por scroll.
Medido no Chromium sem GPU (8 s de scroll + mouse): 2,8–4,1 → 4,8 fps em relação à primeira v05.
