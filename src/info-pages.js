import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";

const mail = '<a href="mailto:ascencioalexgabriel@gmail.com">ascencioalexgabriel@gmail.com</a>';
const repository = 'https://github.com/Bielicoman/alex-ascencio-portfolio';
const sections = [
  ['documentacao', 'Documentação', `
    <p>Um guia curto para explorar os trabalhos e as experiências de Alex Ascencio.</p>
    <h2>O portfólio</h2><p><a href="/#filmes">Destaques</a> reúne os filmes selecionados. Em <a href="/#arquivo">Projetos</a>, busque por nome, artista ou formato. Toque em uma capa para assistir. <a href="/#lab">Serviços</a> apresenta edição, motion, cor, áudio e IA generativa. <a href="/#metodo">Método</a> demonstra como uma edição é construída.</p>
    <h2>Som e movimento</h2><p>Os efeitos sonoros começam desligados na primeira visita. O controle “Som” liga ou desliga apenas os efeitos pontuais de interface; sua escolha fica salva neste navegador. O site não possui música de fundo. Vídeos têm seus próprios controles de áudio. Os efeitos gráficos ajustam a resolução interna ao aparelho e respeitam a preferência de movimento reduzido do sistema.</p>
    <h2>EDITH</h2><p>A assistente ajuda a encontrar filmes, navegar, conhecer os serviços e organizar um pedido de orçamento. Você pode digitar ou ativar o microfone. A voz depende dos recursos e permissões do navegador. Feche a conversa para interromper a escuta. Respostas de IA podem conter erros; confirme informações importantes.</p>
    <h2>Interação e acessibilidade</h2><p>O portfólio pode ser explorado por toque, mouse ou teclado. O controle por gestos é opcional; a câmera só é solicitada quando ele é ativado e as imagens são processadas no aparelho. Nenhuma câmera ou microfone é necessária para consultar os trabalhos ou os contatos.</p>
    <h2>Contato e código</h2><p>Propostas e dúvidas: ${mail}. O <a href="/curriculo/">currículo digital</a> apresenta a experiência profissional. O código e as instruções técnicas estão no <a href="${repository}" rel="noopener">repositório do projeto</a>. Consulte a <a href="/licenca/">licença</a> antes de reutilizar materiais.</p>`],
  ['privacidade', 'Privacidade', `
    <p>Esta página explica os dados usados pelo portfólio e pelas funções opcionais. Responsável pelo site: Alex Ascencio. Contato para privacidade: ${mail}.</p>
    <h2>Dados e finalidade</h2><p>Ao pedir um orçamento ou enviar um recado, você informa os dados necessários ao atendimento, como nome, e-mail, prazo e mensagem. Eles são usados para responder ao pedido e preparar uma eventual contratação. A navegação básica não exige cadastro.</p>
    <h2>Assistente, microfone e câmera</h2><p>As mensagens para a EDITH podem ser enviadas à Groq para produzir respostas. O histórico da interface fica em memória enquanto a conversa está aberta; o site não mantém um banco próprio de conversas. Textos para síntese de voz podem ser processados pela Microsoft ou por provedores de voz configurados, como Google e ElevenLabs. O reconhecimento de fala pode usar o serviço do seu navegador. Microfone e câmera dependem da sua autorização no navegador. O rastreamento visual de gestos acontece localmente, sem envio das imagens pela aplicação.</p>
    <h2>Serviços externos</h2><p>O site é hospedado na Vercel, que pode registrar dados técnicos de acesso, como endereço IP e informações do navegador. Miniaturas e players do YouTube usam serviços do Google; miniaturas externas podem ser carregadas durante a navegação e players são abertos sob demanda. E-mails de contato podem passar por Resend ou FormSubmit; links para WhatsApp e redes sociais levam a serviços com políticas próprias. Esses provedores podem tratar dados fora do Brasil conforme suas condições.</p>
    <h2>Armazenamento no navegador</h2><p>São guardadas preferências funcionais: efeitos sonoros, voz escolhida e identificação de primeira abertura da assistente. O código do site não inclui ferramentas próprias de publicidade ou rastreamento de marketing. Serviços externos podem usar seus próprios cookies e identificadores. Você pode apagar os dados locais nas configurações do navegador.</p>
    <h2>Conservação e seus direitos</h2><p>Mensagens de contato são conservadas pelo tempo necessário ao atendimento, à relação profissional e às obrigações aplicáveis. Logs e dados dos provedores seguem suas políticas; o site não define um prazo único para todos eles. Você pode solicitar confirmação de tratamento, acesso, correção, informações sobre compartilhamento, revogação de consentimento ou eliminação quando aplicável, pelo e-mail acima. A solicitação será analisada conforme a <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" rel="noopener">Lei Geral de Proteção de Dados Pessoais</a>.</p>`],
  ['termos', 'Termos de uso', `
    <p>O site apresenta o portfólio profissional de Alex Ascencio e disponibiliza demonstrações interativas gratuitas.</p>
    <h2>Uso e conteúdo</h2><p>Você pode consultar, compartilhar links e usar as funcionalidades do site de forma lícita. A exibição de um trabalho no portfólio não autoriza sua cópia, edição, revenda ou uso publicitário. Direitos sobre obras, músicas, imagens, marcas e participações pertencem aos respectivos titulares.</p>
    <h2>Serviços profissionais</h2><p>Informações no site e conversas com a EDITH não constituem proposta final nem contratação automática. Escopo, prazo, preço, direitos de uso e entrega são definidos diretamente entre as partes.</p>
    <h2>Demonstrações e assistente</h2><p>As interfaces de edição são demonstrações visuais e não exportam projetos dos editores representados. A EDITH usa recursos automáticos e pode errar ou ficar indisponível; respostas não substituem confirmação direta com Alex. Recursos opcionais dependem do aparelho, do navegador e dos serviços externos.</p>
    <h2>Código e terceiros</h2><p>O código original é disponibilizado sob a <a href="/licenca/">licença MIT</a>. Dependências e conteúdos de terceiros conservam suas licenças. Links externos são oferecidos como referências; seus conteúdos e políticas são responsabilidade dos respectivos serviços.</p>
    <h2>Contato e atualizações</h2><p>Para relatar falhas, questões de acessibilidade, direitos autorais ou dúvidas sobre estes termos: ${mail}. Esta página pode ser atualizada para refletir mudanças do site.</p>`],
  ['licenca', 'Licença MIT', `
    <p>O código original deste portfólio é gratuito e pode ser usado, adaptado e distribuído, inclusive comercialmente, conforme a licença MIT. Preserve o aviso de autoria e o texto da licença.</p>
    <h2>O que a licença cobre</h2><p>A licença se aplica ao código e à documentação autorais de Alex Ascencio. Não concede direitos sobre vídeos, fotografias, músicas, identidade visual, marcas, fontes ou obras de clientes. Bibliotecas e componentes de terceiros seguem suas próprias condições.</p>
    <h2>Texto da licença</h2><pre>MIT License

Copyright (c) 2026 Alex Ascencio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.</pre>
    <h2>Componentes de terceiros</h2><p>React, Three.js, Lenis, Vite e ws usam licenças MIT; as fontes Geist seguem a SIL Open Font License. MediaPipe e Playwright seguem Apache 2.0; GSAP conserva a sua licença própria. A adaptação do protocolo de voz em <a href="/licencas/edge-gec.js">edge-gec.js</a> deriva de <a href="https://github.com/rany2/edge-tts">edge-tts</a> e permanece sob LGPLv3. O arquivo disponibiliza o código-fonte e o aviso de licença. Essa exceção não é relicenciada como MIT.</p>
    <p>Referências: <a href="https://opensource.org/license/mit">MIT na Open Source Initiative</a> · <a href="${repository}/blob/main/LICENSE">LICENSE no repositório</a>.</p>`],
];
export const INFO_ROUTES = sections.map(([slug]) => `/${slug}/`);
export function infoPage(path) {
  const page = sections.find(([slug]) => path.replace(/index\.html$/, '').replace(/\/$/, '') === `/${slug}`);
  if (!page) return null;
  const [slug, title, content] = page;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Alex Ascencio</title><meta name="description" content="${title} do portfólio de Alex Ascencio."><link rel="icon" href="/favicon.svg"><link rel="canonical" href="https://alex-ascencio-portfolio.vercel.app/${slug}/"><style>
  *{box-sizing:border-box}html{color-scheme:dark;background:#0b0b0d;color:#ededf0;font-family:ui-sans-serif,system-ui,sans-serif}body{max-width:860px;margin:auto;padding:24px clamp(20px,5vw,48px) 48px}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-bottom:24px;border-bottom:1px solid #ffffff18}header a{display:inline-flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-size:13px;min-height:44px}header img{width:28px;height:28px}nav{display:flex;gap:6px 18px;flex-wrap:wrap;margin:22px 0 40px}nav a{min-height:36px;display:inline-flex;align-items:center;font-size:12px;color:#9b9ba6;text-decoration:none}nav a[aria-current]{color:#ff7077}h1{font-size:clamp(32px,7vw,54px);line-height:1.1;letter-spacing:-.045em;margin:0 0 14px}h2{font-size:20px;letter-spacing:-.025em;margin:32px 0 8px}p{font-size:15px;line-height:1.8;color:#bfc0ca;margin:8px 0}a{color:#f4a0a6;text-underline-offset:4px}a:hover{color:#fff}a:focus-visible{outline:2px solid #ff7077;outline-offset:4px;border-radius:3px}.date{font-size:11px;color:#8b8b97;margin-bottom:32px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#151518;border:1px solid #ffffff12;border-radius:14px;padding:20px;font:11px/1.8 ui-monospace,monospace;color:#bfc0ca}footer{font-size:11px;color:#8b8b97;margin-top:48px;border-top:1px solid #ffffff18;padding-top:18px}@media print{html{background:white;color:black}p,pre{color:#333}nav{display:none}}
  </style></head><body><header><a href="/"><img src="/favicon.svg" alt="">Alex Ascencio</a><a href="/">Voltar ao portfólio ↗</a></header><nav aria-label="Informações do site">${sections.map(([s,t])=>`<a href="/${s}/"${s===slug?' aria-current="page"':''}>${t}</a>`).join('')}</nav><main><h1>${title}</h1><p class="date">Atualizado em 26 de outubro de 2026</p>${content}</main><footer>© 2026 Alex Ascencio · Código autoral sob MIT</footer></body></html>`;
}
export function writeInfoPages(out) {
  for (const path of INFO_ROUTES) { const dir = `${out}${path}`; mkdirSync(dir, { recursive: true }); writeFileSync(`${dir}index.html`, infoPage(path)); }
  mkdirSync(`${out}/licencas`, { recursive: true });
  copyFileSync('api/edge-gec.js', `${out}/licencas/edge-gec.js`);
}
