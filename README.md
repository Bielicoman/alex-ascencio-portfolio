<p align="center">
  <img src="public/brand/mark.svg" width="96" alt="Marca AA">
</p>

<h1 align="center">Alex Ascencio — Portfólio</h1>

<p align="center">
  Editor de vídeo e filmmaker. Edição, cor e motion com acabamento de cinema.<br>
  <a href="https://alex-ascencio-portfolio.vercel.app">alex-ascencio-portfolio.vercel.app</a>
</p>

---

## O site

Escuro, tipográfico e com um único vermelho. A imagem é a protagonista; a interface é vidro fosco por cima dela.

| | |
|---|---|
| Base | React 19 + Vite 7 |
| Movimento | GSAP ScrollTrigger + Lenis (scroll suave) |
| 3D | three.js: campo de partículas, lente em shader, marca AA extrudada |
| Tipo | Geist e Geist Mono, hospedadas no próprio site |
| EDITH | assistente de voz: Groq (`api/edth.js`) + voz neural pt-BR (`api/tts.js`) |
| Deploy | Vercel, automático a cada push na `main` |

## Rodar

```bash
npm ci
npm run dev       # desenvolvimento em http://localhost:5173
npm run build     # gera dist/
npm run preview   # serve dist/ em http://localhost:4173
npm test          # testes da EDITH e da busca bíblica
```

Variáveis em `.env.example` (copie para `.env.local`).

## Pastas

```
api/            funções do Vercel: contato, EDITH (cérebro e voz), busca bíblica
curriculo/      página do currículo digital
dev/            plugin que roda as funções de api/ no npm run dev
docs/capturas/  capturas de tela de referência
marca/          originais da identidade visual (não vão para o site)
  manual/         manual da marca e versões
  logos/          marca e logos em alta (inclui o .af editável, fora do git)
  fotos/          retratos oficiais
  identidade-visual/  peças da identidade atualizada (idv-01 a idv-44)
public/         o que o site publica
  brand/          marca e ícone usados pelo site
  media/          fotos, vídeos, logos de clientes, método e thumbs
    thumbs/2026-10-27_thumbs_v01/  as 31 miniaturas (1280×720, ~110 KB)
src/            código do site
  components/     seções e peças (Método, player, rodapé, ícones, 3D)
  edth/           interface e cérebro local da EDITH
  curriculo/      código do currículo
tests/          testes automatizados
```

Fora do git, só na máquina: `_versoes/` (versões antigas v02–v05 e zips), `_backup/` (cópias antes de cada alteração), `work/` (fontes de thumbs e rascunhos).

## Regras da casa

- Nunca sobrescrever: nova versão sai como `_v02`, `_v03` ao lado. Entregas: `AAAA-MM-DD_projeto_peca_v01`.
- Thumb nova: 1280×720 WebP, alvo 110 KB, qualidade mínima 72, registrada em `src/thumbs.js`.
- Ícones só de `src/components/Icons.jsx` (grade 24, traço 1,7 px). Sem emoji, sem biblioteca de terceiros.
- Marca nunca redesenhada: vetores oficiais em `src/brand.js`.
- `prefers-reduced-motion` respeitado: sem pins, sem scroll suave, sem abertura.

## Contato

WhatsApp +55 15 99756-9880 · ascencioalexgabriel@gmail.com · Instagram [@alexascencioai](https://instagram.com/alexascencioai) · LinkedIn [/in/ascencioalexgabriel](https://linkedin.com/in/ascencioalexgabriel)

© Alex Ascencio. Código sob a licença em `LICENSE`; imagens, vídeos e marca: ver `LICENSING.md`.
