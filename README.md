# Alex Ascencio — Portfólio

Portfólio em React/Vite com 22 trabalhos, filtros, busca, grade/lista, player acessível, galeria com profundidade no scroll, estrelas interativas e laboratório WebGL.

## Desenvolvimento

`npm ci`, `npm run dev` e `npm run build`. A branch `main` publica automaticamente no projeto Vercel existente.

Os trabalhos ficam em `src/projects.js`; as miniaturas em `public/media/{id}.webp`. Mantenha os IDs estáveis. Os links de contato estão em `src/App.jsx`.

## Direção visual e assets

Marca original de Alex preservada. Paleta grafite, prata, branco e vinho; tipografia Manrope e Space Grotesk hospedada localmente. Vidro, composição editorial e referências cinematográficas. Logotipos oficiais localizados de Kiger, Prisma, Dilson Castro, Via Global e Entre Aspas; demais colaborações apresentadas nominalmente. Estúdios citados como referência estética não foram apresentados como clientes.

Retratos criativos gerados no Higgsfield com GPT Image 2.5 a partir da fotografia de Alex já publicada. Arquivos `portrait-v2.webp` e `studio-v2.webp`. Motion de lente criado com Seedance 2.5, cinco segundos, sem áudio, otimizado em H.264. Os retratos e o motion são explorações autorais para o site, não registros de trabalhos de clientes.

Gerações: retrato `68d9f982-62aa-4cd5-ac18-7ea678e0df20`; estúdio `95a8c5da-8691-4d3a-a8c4-b53a74ad36a1`; motion `e19474e6-1171-4949-8eb1-2523068ae79d`.

Referências de composição: [Jason Bergh](https://www.behance.net/gallery/250090175/Jason-Bergh-Portfolio-Website), [Immersive portfolio](https://www.behance.net/gallery/238189427/Immersive-website-portfolio-for-developer), [EP133](https://www.behance.net/gallery/250351415/EP133-KO-II), [Zirka](https://www.behance.net/gallery/255433591/Zirka-Interceptor-Website-Production) e demais referências enviadas no briefing. Implementação própria, sem copiar assets desses projetos.

## Comportamento

Movimento reduzido respeitado; controle global de pausa; animações e vídeo suspensos fora da tela. WebGL carrega perto da seção e possui fallback visual. Modal nativo com Escape e restauração de foco. Filtros e busca combináveis, incluindo pesquisa sem acentos. Formulário prepara uma mensagem no WhatsApp; não envia automaticamente nem armazena dados.

Vídeos dependem da disponibilidade e das permissões de incorporação dos canais de origem. Cada player oferece link direto para o YouTube.

Originais e materiais de produção foram preservados. O build publica somente os assets necessários, currículo, robots e sitemap; a pasta MUSICAL PRODUCTION não integra o deploy.
