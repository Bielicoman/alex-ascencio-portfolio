import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./curriculo.css";
import { MARK_PATH } from "../brand";
import { PROJECTS } from "../projects";

// Currículo digital: mesma identidade do site; @media print gera o PDF A4 (2 páginas).
const PDF = "/media/cv/2026-09-24_alexascencio_curriculo_v02.pdf";
const CONTACT = [
  ["Telefone", "+55 15 99756-9880", "https://wa.me/5515997569880"],
  ["E-mail", "ascencioalexgabriel@gmail.com", "mailto:ascencioalexgabriel@gmail.com"],
  ["Portfólio", "alex-ascencio-portfolio.vercel.app", "https://alex-ascencio-portfolio.vercel.app"],
  ["Instagram", "@alexascencioai", "https://instagram.com/alexascencioai"],
  ["LinkedIn", "in/ascencioalexgabriel", "https://www.linkedin.com/in/ascencioalexgabriel/"],
  ["Local", "São Paulo, Brasil · atendimento remoto e global", null],
];
const EXP = [
  ["Editor de mídia e conteúdo", "UNIÃO NOROESTE BRASILEIRA", "Atual", "Edição, finalização e motion de conteúdo institucional. Ex.: Homenagem Dia das Profissões (2026).", true],
  ["Filmmaker & editor", "PRISMA BRASIL", "2024 — 2026", "Filmmaker oficial da turnê de 45 anos nos Estados Unidos: concerto comemorativo ao vivo, videoclipes e making-ofs."],
  ["Filmmaker & editor de vídeo", "Freelancer", "2020 — hoje", "Direção e pós de videoclipes, documentários, cinema e institucionais em 4K, com fluxo de pós integrado a IA generativa."],
  ["Diretor & editor · “Ele Reviveu”", "Communion · TV Novo Tempo", "2024", "Direção e edição de videoclipe para exibição nacional na TV Novo Tempo."],
  ["Câmera broadcast & transmissão ao vivo", "Associação Paulista Sudoeste · multicliente", "2020 — 2023", "Câmeras broadcast, gimbal e grua; direção técnica em vMix. Mais de 200 transmissões."],
];
// [id, autoria, formato] — definidos à mão para não repetir categoria no lugar do artista
const FEATURED = [
  [25, "União Noroeste Brasileira", "Institucional"], [24, "Quarteto Elo", "Videoclipe"], [7, "Prisma Brasil", "Registro ao vivo · 45 anos"], [14, "", "Curta-metragem"],
  [16, "Califórnia Dreams", "Documentário"], [6, "", "Reality show"], [2, "Gabriella Stehling", "Temporada de covers"], [4, "Willian Krusty", "Videoclipe"],
];
const METHOD = [
  ["Corte pela cena", "A imagem estabelece o lugar; a fala entra quando o espectador já sabe onde está."],
  ["Respiro de cinema", "Pausas acima de 0,6 s, cobertura curta em V2 e nunca um corte colado no texto."],
  ["Áudio medido", "LUFS por clipe antes de nivelar; master no loudness de cada destino."],
  ["IA com critério", "Rascunho barato, plano aprovado, resolução final — e só entra se passar como filmado."],
];
const TOOLS = [
  ["Edição", "Premiere Pro · DaVinci Resolve · CapCut"], ["Cor", "DaVinci Resolve · Lumetri"], ["Motion", "After Effects"],
  ["Áudio", "Mix e master medidos em LUFS"], ["Ao vivo", "vMix"], ["Imagem", "Photoshop · Lightroom"],
  ["IA generativa", "ComfyUI · Higgsfield · Runway · ElevenLabs · Topaz · Midjourney · Claude / GPT"], ["Dev", "Plugins CEP/UXP para Premiere e After Effects"],
];
const SKILLS = ["Edição cinematográfica", "Transmissão ao vivo", "Color grading", "Operação de câmera", "Direção e roteiro", "Motion / VFX", "Fluxos com IA generativa"];
const EDU = [
  ["Bacharelado em Rádio e TV", "UNASP · Engenheiro Coelho", "2023 — em curso"],
  ["Editor Pro — edição profissional em Premiere Pro", "Formação técnica", "2022 — 2023"],
  ["Introdução à Tecnologia da Informação", "SENAI · EAD", "2021"],
  ["Fotografia autoral", "Curso com Ale Borges", "2020"],
];
const CLIENTS = ["União Noroeste Brasileira", "Novo Tempo", "Feliz7Play", "Prisma Brasil", "UNASP", "Communion", "Gabriella Stehling", "Quarteto Elo", "Kati Carvalho", "Willian Krusty", "Dilson Castro", "MAB", "Califórnia Dreams"];
const title = (p) => p.title.split(/\||—/)[0].trim();

function Mark({ className }) { return <svg className={className} viewBox="0 0 262 151" aria-hidden="true"><path d={MARK_PATH} fill="currentColor" /></svg>; }
function H({ n, children }) { return <h2 className="cv-h"><b>{n}</b>{children}</h2>; }

function Curriculo() {
  return (
    <>
      <nav className="cv-bar">
        <a href="/" className="cv-back"><span>←</span> Portfólio</a>
        <div className="cv-actions">
          <button onClick={() => window.print()}>Imprimir</button>
          <a className="cv-dl" href={PDF} download>Baixar PDF <span>↓</span></a>
        </div>
      </nav>
      <main className="cv">
        {/* ── página 1 ── */}
        <section className="cv-page">
          <aside className="cv-side">
            <div className="cv-photo"><span className="cv-glow" /><img src="/media/cv/img/foto.jpg" alt="Alex Ascencio" /></div>
            <h1>Alex Ascencio</h1>
            <p className="cv-role">Editor de vídeo · Filmmaker</p>
            <div className="cv-block">
              <H n="01">Contato</H>
              <dl className="cv-contact">
                {CONTACT.map(([k, v, href]) => <div key={k}><dt>{k}</dt><dd>{href ? <a href={href} target="_blank" rel="noreferrer">{v}</a> : v}</dd></div>)}
              </dl>
            </div>
            <div className="cv-block">
              <H n="02">Ferramentas</H>
              <dl className="cv-tools">{TOOLS.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            </div>
            <div className="cv-block">
              <H n="03">Idiomas</H>
              <p className="cv-lang">Português — nativo<br />Espanhol — intermediário</p>
            </div>
            <Mark className="cv-watermark" />
          </aside>
          <div className="cv-main">
            <p className="cv-kicker">Transformando ideias em <em>cinema.</em></p>
            <p className="cv-lead">Editor de vídeo e filmmaker há mais de 5 anos, entre videoclipes, documentários, cinema, turnês internacionais e transmissões ao vivo. Trabalhos exibidos em redes nacionais (Novo Tempo, Feliz7Play) e na turnê internacional do Prisma Brasil. Corto pela cena, não pela fala; uso IA generativa como ferramenta de produção — se não passa como filmado, não entra.</p>
            <div className="cv-block">
              <H n="04">Experiência</H>
              <ol className="cv-exp">
                {EXP.map(([r, org, y, d, now]) => (
                  <li key={r} className={now ? "now" : ""}>
                    <div className="cv-exp-top"><b>{r}</b><span className="cv-y">{now && <i className="rec" />}{y}</span></div>
                    <span className="cv-org">{org}</span>
                    <p>{d}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="cv-block">
              <H n="05">Competências</H>
              <div className="cv-chips">{SKILLS.map((s) => <span key={s}>{s}</span>)}</div>
            </div>
          </div>
        </section>
        {/* ── página 2 ── */}
        <section className="cv-page cv-page-2">
          <div className="cv-block">
            <H n="06">Projetos em destaque</H>
            <div className="cv-proj">
              {FEATURED.map(([id, by, kind]) => {
                const p = PROJECTS.find((x) => x.id === id);
                return (
                  <a key={id} className="cv-card" href={p.url ? p.url.replace("/embed/", "/watch?v=") : "https://alex-ascencio-portfolio.vercel.app/#arquivo"} target="_blank" rel="noreferrer">
                    <span className="cv-thumb"><img src={`/media/cv/img/${id}.jpg`} alt="" /><i>{p.q}</i></span>
                    <span className="cv-card-t"><b>{title(p)}</b><small>{[by, kind, p.date.slice(0, 4)].filter(Boolean).join(" · ")}</small></span>
                  </a>
                );
              })}
            </div>
          </div>
          <div className="cv-cols">
            <div className="cv-block">
              <H n="07">Formação</H>
              <ol className="cv-edu">{EDU.map(([t, o, y]) => <li key={t}><div><b>{t}</b><span>{o}</span></div><span className="cv-y">{y}</span></li>)}</ol>
            </div>
            <div className="cv-block">
              <H n="08">Clientes & parceiros</H>
              <div className="cv-clients">{CLIENTS.map((c) => <span key={c}>{c}</span>)}</div>
            </div>
          </div>
          <div className="cv-block">
            <H n="09">Como eu trabalho</H>
            <div className="cv-method">{METHOD.map(([t, d], i) => <div key={t}><span>0{i + 1}</span><b>{t}</b><p>{d}</p></div>)}</div>
          </div>
          <footer className="cv-foot">
            <Mark className="cv-foot-mark" />
            <span>Portfólio completo, vídeos e contato: <b>alex-ascencio-portfolio.vercel.app</b></span>
          </footer>
        </section>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(<Curriculo />);
