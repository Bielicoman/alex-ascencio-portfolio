import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./curriculo.css";
import { MARK_PATH } from "../brand";
import { PROJECTS } from "../projects";

// Currículo digital: mesma identidade do site; @media print gera o PDF A4 (2 páginas).
import { PDF, CONTACT, EXP, FEATURED, METHOD, TOOLS, SKILLS, EDU, CLIENTS } from "../profile";

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
