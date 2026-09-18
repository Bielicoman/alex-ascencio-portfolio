import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { PROJECTS } from './projects';
const categories = ['Todos', ...new Set(PROJECTS.map(p => p.cat))];
const featured = [24, 14, 16, 7].map(id => PROJECTS.find(p => p.id === id));
const thumb = p => `/media/${p.id}.webp`;
const Arrow = () => <span aria-hidden="true">↗</span>;
function Player({project, close}) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="player" aria-labelledby="player-title" onCancel={close} onClick={e => {if(e.target === e.currentTarget) close();}}>
    <div className="player-top"><span className="eyebrow">SALA DE EXIBIÇÃO</span><button onClick={close} className="close" aria-label="Fechar vídeo">×</button></div>
    <iframe title={project.title} src={`${project.url.replace('www.youtube.com','www.youtube-nocookie.com')}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    <div className="player-info"><div><span className="eyebrow">{project.cat} / {project.date.slice(0,4)}</span><h2 id="player-title">{project.title}</h2><p>{project.desc}</p></div><a href={project.url.replace('/embed/','/watch?v=')} target="_blank" rel="noreferrer">Abrir no YouTube <Arrow/></a></div>
  </dialog>;
}
function Filmstrip({open, reduced}) {
 const ref=useRef(null);
 const {scrollYProgress}=useScroll({target:ref,offset:['start start','end end']});
 const x=useTransform(scrollYProgress,[0,1],['0%','-67%']);
 return <section className={`sequence ${reduced ? 'sequence-static' : ''}`} ref={ref} aria-labelledby="sequence-title">
  <div className="sequence-pin"><div className="section-head"><div><p className="eyebrow">UM OLHAR. DIFERENTES HISTÓRIAS.</p><h2 id="sequence-title">Entre um corte<br/>e uma <em>emoção.</em></h2></div><p className="sequence-instruction">Continue o scroll<br/><span aria-hidden="true">↓</span> Explore a sequência</p></div>
  <motion.div className="filmstrip" style={reduced ? {} : {x}}>{featured.map((p,i)=><button className="film" key={p.id} onClick={()=>open(p)} aria-label={`Assistir ${p.title}`}><div className="film-image"><img src={thumb(p)} alt="" loading="lazy"/><span className="play-ring">▶</span><span className="frame-index">{String(i+1).padStart(2,'0')} / 04</span></div><div className="film-caption"><h3>{p.title.split(/\||—/)[0]}</h3><span>{p.cat} <Arrow/></span></div></button>)}</motion.div>
  <div className="sequence-track" aria-hidden="true"><motion.div style={{scaleX:reduced?1:scrollYProgress}}/></div></div>
 </section>;
}
export default function App(){
 const [project,setProject]=useState(null),[cat,setCat]=useState('Todos'),[search,setSearch]=useState(''),[menu,setMenu]=useState(false);
 const reduced=useReducedMotion();
 const {scrollYProgress}=useScroll();
 const hero=useRef(null);
 const {scrollYProgress:heroProgress}=useScroll({target:hero,offset:['start start','end start']});
 const heroY=useTransform(heroProgress,[0,1],[0,130]);
 const results=useMemo(()=>PROJECTS.filter(p=>(cat==='Todos'||p.cat===cat)&&`${p.title} ${p.cat}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(search.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())),[cat,search]);
 useEffect(()=>{const esc=e=>{if(e.key==='Escape')setMenu(false);};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc);},[]);
 function submit(e){e.preventDefault(); const data=new FormData(e.currentTarget);const text=`Olá, Alex! Sou ${data.get('name')}.\nProjeto: ${data.get('type')}\n\n${data.get('message')}`;window.open(`https://wa.me/5515997569880?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');}
 return <>
  <a className="skip-link" href="#work">Pular para os trabalhos</a>
  <motion.div className="reading-progress" style={{scaleX:scrollYProgress}} aria-hidden="true"/>
  <header className="header"><a href="#top" className="brand" aria-label="Alex Ascencio — início"><img src="/media/mark.png" alt=""/><span>ALEX<br/>ASCENCIO<span className="brand-dot">.</span></span></a><button className="menu-toggle" aria-expanded={menu} aria-controls="navigation" onClick={()=>setMenu(!menu)}>{menu?'Fechar':'Menu'} <span aria-hidden="true">{menu?'−':'+'}</span></button><nav id="navigation" className={menu?'is-open':''} aria-label="Principal">{[['work','Trabalhos'],['expertise','Edição + IA'],['about','Sobre']].map(([id,text])=><a href={`#${id}`} key={id} onClick={()=>setMenu(false)}>{text}</a>)}<a href="#contact" className="nav-contact" onClick={()=>setMenu(false)}>Vamos conversar <Arrow/></a></nav></header>
  <main>
  <section id="top" className="hero" ref={hero}>
   <div className="hero-meta"><span className="eyebrow"><i/> EDITOR DE VÍDEO & PROFISSIONAL DE IA</span><span className="eyebrow">SÃO PAULO, BRASIL · PORTFÓLIO</span></div>
   <div className="hero-stage"><motion.div className="hero-type" style={reduced?{}:{y:heroY}}><h1>CRIAR.<br/><span className="outline">CONTAR.</span><br/><em>IMPACTAR.</em></h1></motion.div><div className="hero-visual"><img src="/media/portrait.webp" alt="Alex Ascencio em retrato com fundo vermelho" fetchPriority="high"/><div className="portrait-shade"/><span className="viewfinder top-left"/><span className="viewfinder bottom-right"/><div className="portrait-caption"><span>ALEX ASCENCIO</span><span>O olhar por trás do frame.</span></div><a className="hero-orbit" href="#work" aria-label="Explorar todos os trabalhos"><span>EXPLORE<br/>OS TRABALHOS</span><span aria-hidden="true">↘</span></a></div></div>
   <div className="hero-bottom"><p>O ritmo certo. A imagem que fica.<br/>Edição, cinema e inteligência artificial<br/>a serviço de uma boa história.</p><button className="featured-link" onClick={()=>setProject(PROJECTS[0])}><img src={thumb(PROJECTS[0])} alt=""/><span><small>ÚLTIMO LANÇAMENTO</small>Em Nome de Jesus <span aria-hidden="true">↗</span></span><span className="small-play" aria-hidden="true">▶</span></button><a href="#sequence-title" className="scroll-cue">SCROLL PARA EXPLORAR <span aria-hidden="true">↓</span></a></div>
  </section>
  <div className="collaborations"><span>HISTÓRIAS COM</span><div>PRISMA BRASIL <b>·</b> QUARTETO ELO <b>·</b> COMMUNION <b>·</b> CALIFÓRNIA DREAMS</div></div>
  <Filmstrip open={setProject} reduced={reduced}/>
  <section id="work" className="archive section-pad"><div className="section-head"><div><p className="eyebrow">O PORTFÓLIO COMPLETO</p><h2>Histórias que<br/>ganharam <em>vida.</em></h2></div><p>Do primeiro corte ao último frame.<br/>{PROJECTS.length} trabalhos, diferentes formas de sentir.</p></div>
   <div className="archive-tools"><div className="filters" role="group" aria-label="Filtrar trabalhos">{categories.map(c=><button key={c} aria-pressed={cat===c} onClick={()=>setCat(c)}>{c}<sup>{c==='Todos'?PROJECTS.length:PROJECTS.filter(p=>p.cat===c).length}</sup></button>)}</div><label className="search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Buscar trabalho ou artista" placeholder="Buscar trabalho ou artista" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
   <p className="results-count" role="status">{results.length} {results.length===1?'trabalho':'trabalhos'} {cat!=='Todos'?`/ ${cat}`:''}</p>
   <div className="project-grid">{results.map(p=><article key={p.id} className="project-card"><button onClick={()=>setProject(p)} aria-label={`Assistir ${p.title}`}><div className="project-image"><img src={thumb(p)} alt="" loading="lazy" width="800" height="450"/><span className="project-tag">{p.cat}</span><span className="project-play" aria-hidden="true">▶</span></div><div className="project-info"><h3>{p.title}</h3><span aria-hidden="true">↗</span></div><p>{p.date.slice(0,4)} <span>FILME / {p.q}</span></p></button></article>)}</div>
   {results.length===0&&<div className="empty"><h3>Nenhum trabalho com essa busca.</h3><p>Tente o nome de outro artista ou explore o catálogo completo.</p><button className="text-link" onClick={()=>{setSearch('');setCat('Todos');}}>Limpar filtros <Arrow/></button></div>}
  </section>
  <section id="expertise" className="expertise section-pad"><div className="expertise-intro"><p className="eyebrow">SENSIBILIDADE HUMANA. NOVAS POSSIBILIDADES.</p><h2>O próximo frame<br/>ainda não <em>existe.</em></h2><p>É aí que eu entro. Conecto linguagem audiovisual e inteligência artificial para transformar ideias em imagens com intenção.</p><a href="#contact" className="text-link">Vamos criar algo novo <Arrow/></a></div><div className="services">{[
   ['Edição & narrativa','Ritmo, montagem e construção de histórias. Videoclipes, documentários, cinema e conteúdo para marcas.','PREMIERE PRO / DAVINCI RESOLVE'],
   ['Inteligência artificial','Criação de imagens e cenas, exploração visual e fluxos de produção que ampliam as possibilidades de cada projeto.','IA GENERATIVA / WORKFLOWS CRIATIVOS'],
   ['Motion & finalização','Movimento, composição e cor trabalhando juntos para dar unidade e personalidade ao filme.','AFTER EFFECTS / COLOR GRADING']
   ].map(([title,desc,tools])=><details key={title} open><summary>{title}<span aria-hidden="true">+</span></summary><p>{desc}</p><span className="eyebrow">{tools}</span></details>)}</div></section>
  <section id="about" className="about section-pad"><div className="about-image"><img src="/media/behind-scenes.webp" alt="Bastidores de produção audiovisual em uma floresta" loading="lazy"/><span className="image-note">ON SET / POR TRÁS DAS CENAS</span></div><div className="about-copy"><p className="eyebrow">MUITO PRAZER, ALEX.</p><h2>Tecnologia nas mãos.<br/><em>Histórias na cabeça.</em></h2><p>Sou Alex Ascencio, editor de vídeo, filmmaker e profissional de IA. Meu trabalho é encontrar o que faz uma história funcionar — no ritmo, no silêncio, na imagem e na emoção.</p><p>De videoclipes e documentários a curtas e shows, levo esse olhar para cada projeto. A inteligência artificial amplia meu processo criativo; a intenção de cada escolha continua sendo humana.</p><div className="about-links"><a href="https://instagram.com/alexascencioai" target="_blank" rel="noreferrer">Instagram <Arrow/></a><a href="https://www.linkedin.com/in/ascencioalexgabriel/" target="_blank" rel="noreferrer">LinkedIn <Arrow/></a><a href="/Alex_Ascencio_Curriculo.pdf" download>Currículo ↓</a></div></div></section>
  <section id="contact" className="contact section-pad"><p className="eyebrow">A PRÓXIMA HISTÓRIA PODE SER A SUA.</p><div className="contact-grid"><div><h2>VAMOS<br/>FAZER<br/><em>ACONTECER.</em></h2><a className="contact-direct" href="https://wa.me/5515997569880" target="_blank" rel="noreferrer">Conversar direto no WhatsApp <Arrow/></a></div><form onSubmit={submit}><p>Me conte o que você está imaginando.<br/>Vamos encontrar a melhor forma de criar.</p><label>Seu nome<input name="name" autoComplete="name" required placeholder="Como posso te chamar?" maxLength={120}/></label><label>O que vamos criar?<select name="type"><option>Edição de vídeo</option><option>Projeto com IA</option><option>Videoclipe</option><option>Documentário ou cinema</option><option>Motion e finalização</option><option>Outro projeto</option></select></label><label>Sua ideia<textarea name="message" required rows={3} placeholder="Conte um pouco sobre o projeto e o prazo." maxLength={2500}/></label><button type="submit">Levar a ideia para o WhatsApp <Arrow/></button><small>Abre uma conversa com sua mensagem pronta para enviar.</small></form></div></section>
  </main><footer><a href="#top" className="brand"><img src="/media/mark.png" alt=""/><span>ALEX ASCENCIO.</span></a><span>© {new Date().getFullYear()} · CRIAR. CONTAR. IMPACTAR.</span><a href="#top">VOLTAR AO TOPO ↑</a></footer>
  {project&&<Player project={project} close={()=>setProject(null)}/>}
 </>;
}
