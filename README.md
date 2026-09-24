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

## Previews de hover
`preview` em `src/projects.js` é o caminho sem extensão de um loop curto em `public/media/previews/` (.webm VP9 para Chrome/Firefox, .mp4 H.264 para Safari), tocado no hover (grade, Filmes, card da hero) e no tour.
Sem `preview`, o tour cai no embed do YouTube (lento: carrega o player inteiro).
Encode: 6 s, 960×540, 24 fps, sem áudio — `ffmpeg -ss <in> -t 6 -i master.mp4 -an -vf "scale=960:540:flags=lanczos,fps=24" -c:v libx264 -profile:v high -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart AAAA-MM-DD_projeto_preview_v01.mp4` (~300 KB). WebM: `-c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1` (~250 KB).

## Currículo digital
`/curriculo/` (`curriculo/index.html` + `src/curriculo/`): página na identidade do site, abre instantânea (sem depender de visualizador de PDF).
O PDF A4 de 2 páginas é gerado da própria página: com `npm run build && npm run preview`, abrir `/curriculo/` no Chromium e imprimir com
`page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true })`. Salvar como `public/media/cv/AAAA-MM-DD_alexascencio_curriculo_vNN.pdf`
(nunca sobrescrever) e atualizar `PDF` em `src/curriculo/main.jsx`. Imagens do currículo em `public/media/cv/img/` (foto 520 px, miniaturas 400 px).

## Controle por gestos e Playground
- **Hero → "Controlar com as mãos"** (só desktop): liga a webcam e controla a página. Apontar move o cursor; pinça rápida = clique; pinça + arrasto no vazio = rolar (soltar em movimento arremessa); pinça num flutuante = pegar e jogar; duas pinças = zoom na seção. Esc desliga. Tutorial com checagem ao vivo de cada gesto.
- **/playground/**: página independente com Partículas (marca AA em 26 mil pontos), Objetos 3D em gravidade zero, Piano, Bateria, Teremim e o jogo "Corte". Funciona com câmera, mouse ou toque.
- Rastreamento: MediaPipe HandLandmarker (21 pontos, 2 mãos) + filtro One Euro, tudo no navegador. O WASM é copiado de `node_modules/@mediapipe/tasks-vision/wasm` para `dist/media/hand/wasm` no build; o modelo (7,8 MB) vem do CDN oficial do MediaPipe e só baixa quando a câmera é ligada.
- Gestos avançados (5 dedos classificados por ângulo das falanges, pose estável por 4 quadros): punho + arrasto rola; palma aberta deslizando ← → troca de seção; V segurado 0,7 s = tour; joinha = contato; joinha para baixo = topo; chifre = som; duas palmas paradas = pausar/retomar.
- Voz (Web Speech API, pt-BR; Chrome/Edge/Safari): "ver demonstração", "ir para filmes", "descer", "subir", "parar", "contato", "desligar"… Liga sozinha se o microfone já foi autorizado; senão, botão "Voz" no HUD.
- Rosto (FaceLandmarker com blendshapes): paralaxe da hero pela posição da cabeça; piscada longa (0,45–1,8 s) = pausar. Olhar via webcam comum não tem precisão para apontar (erro de 3–5 cm), então não controla o cursor.
- Corpo (PoseLandmarker lite, 33 pontos): modo "Corpo" no Playground — esqueleto em HUD, ângulos, reator e repulsor (palma aberta + braço esticado).
- Jogo "Sabre" (Playground): blocos no ritmo, corte na direção da seta com a mão da cor certa (vermelho = esquerda, branco = direita; com uma mão só ou mouse, corta as duas). Três trilhas originais sintetizadas no navegador (`src/playground/music.js`): Neon Corte (synthwave, 118 BPM), Timeline (boom bap, 92 BPM), Hiperdrive (drum & bass, 172 BPM). A mesma partitura gera áudio e mapa de blocos, no relógio do Web Audio. Normal/Expert, combo ×2/×4/×8, energia, rank S–F e recorde local. Sabres 3D: segurando uma caneta/bastão com a mão fechada, a lâmina aponta do mindinho para o indicador usando os pontos 3D da mão (worldLandmarks); corte calculado em 3D (lâmina varrida contra o bloco, profundidade tolerante). Duas mãos no mesmo objeto = um sabre.
- Cada modelo roda no seu Web Worker (em paralelo); mãos começam na GPU e caem para CPU se a média passar de 40 ms.
- Código: `src/gesture/` (rastreador, worker, voz, controle da home), `src/playground/` (página, áudio sintetizado e modos).

## EDTH · assistente por voz
- Hero → "Controlar por voz · EDTH": painel com microfone (Web Speech API, pt-BR, modo conversa contínua), texto, sugestões e voz feminina (speechSynthesis; escolhe Google português / Francisca / Luciana / Maria quando disponíveis).
- Motor local (`src/edth/brain.js`, sem custo): abre qualquer vídeo pelo nome (o cursor vai até o card e abre o player), vídeo mais recente, filtros por formato, seções, demonstração, som, rolar, currículo (abrir/baixar), redes (Instagram, LinkedIn, WhatsApp, e-mail), jogos do Playground, perguntas sobre o Alex (quem é, experiência, clientes, ferramentas, formação, método, IA, contato) e orçamento por etapas que preenche o formulário de contato e abre o envio.
- Perguntas livres: `api/edth.js` (Vercel Function) → Groq `llama-3.3-70b-versatile`, com os dados do Alex no prompt e ações validadas no cliente. Ativar: criar a chave em console.groq.com → Vercel → Settings → Environment Variables → `GROQ_API_KEY` → Redeploy. Sem chave (ou no limite do plano gratuito) a EDTH segue só com o motor local.
- Dados do Alex (currículo e EDTH): `src/profile.js`.
