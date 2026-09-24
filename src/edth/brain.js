import { PROJECTS } from "../projects.js";
import { SUMMARY, EXP, CLIENTS, TOOLS, EDU, METHOD, SOCIAL, PDF } from "../profile.js";

// Motor local da EDTH: entende pedidos em português (voz ou texto), conduz o orçamento por etapas e
// responde sobre o Alex a partir dos dados do site. Devolve { say, actions, chips, links }.
// O que não reconhece vai para a IA (api/edth.js, Groq) quando disponível.
export const norm = (s) => ` ${String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9/ ]/g, " ").replace(/\s+/g, " ").trim()} `;
const any = (t, list) => list.some((k) => t.includes(" " + k + " "));

const coreTitle = (p) => p.title.split(/\||—/)[0].trim();
const artist = (p) => (p.title.split(/\||—/)[1] || "").trim();
const year = (p) => p.date.slice(0, 4);
const STOP = new Set(["o", "a", "os", "as", "de", "do", "da", "dos", "das", "e", "um", "uma", "no", "na", "em", "pra", "para", "por", "com", "me", "eu", "quero", "queria", "voce", "pode", "assistir", "ver", "abrir", "abre", "tocar", "toca", "coloca", "coloque", "mostra", "mostrar", "play", "video", "clipe", "filme", "musica", "reproduzir", "por", "favor", "o", "ai", "esse", "aquele", "trabalho"]);
const toks = (s) => norm(s).trim().split(" ").filter((w) => w && !STOP.has(w));

// melhor projeto para a frase (título pesa mais que artista); null se fraco
export function findProject(text) {
  const q = toks(text);
  if (!q.length) return null;
  let best = null;
  for (const p of PROJECTS) {
    const tt = toks(coreTitle(p)), at = toks(artist(p) + " " + p.cat);
    const hitT = tt.filter((w) => q.includes(w)).length, hitA = at.filter((w) => q.includes(w)).length;
    const cover = tt.length ? hitT / tt.length : 0;
    const score = cover * 3 + hitA * 0.6 + (hitT ? 0.5 : 0);
    if (!best || score > best.score || (score === best.score && p.date > best.p.date)) best = { p, score, cover };
  }
  return best && (best.cover >= 0.5 || best.score >= 1.2) ? best.p : null;
}
export const latest = () => PROJECTS[0];

const CATS = { clipes: "Clipes", clipe: "Clipes", videoclipes: "Clipes", documentarios: "Documentário", documentario: "Documentário", cinema: "Cinema", curtas: "Cinema", curta: "Cinema", reality: "Reality Show", turne: "Turnê", turnes: "Turnê", bastidores: "Bastidores", "making": "Bastidores", institucional: "Institucional", institucionais: "Institucional" };
const SECTIONS = [["top", ["inicio", "topo", "comeco", "home"]], ["filmes", ["filmes", "destaques", "filmes em destaque"]], ["lab", ["lab", "laboratorio", "servicos"]], ["metodo", ["metodo", "timeline", "processo"]], ["arquivo", ["selecao", "portfolio", "trabalhos", "projetos", "arquivo"]], ["sobre", ["sobre", "sobre ele", "sobre o alex", "sobre mim", "biografia"]], ["contato", ["contato", "falar com ele", "fale com ele"]]];
const GAMES = [["sabre", ["sabre", "beat saber", "sabres", "sabre de luz"]], ["particulas", ["particulas"]], ["objetos", ["objetos", "objetos 3d", "3d"]], ["corpo", ["corpo", "homem de ferro"]], ["piano", ["piano"]], ["bateria", ["bateria"]], ["teremim", ["teremim", "theremin"]], ["corte", ["corte", "jogo do corte", "cortar clipes"]]];
const KINDS = [["Videoclipe", ["clipe", "videoclipe", "musica", "clip"]], ["Documentário", ["documentario", "doc"]], ["Curta / cinema", ["curta", "filme", "cinema", "longa"]], ["Motion design", ["motion", "animacao", "vinheta"]], ["IA generativa", ["ia", "inteligencia artificial", "gerado", "ia generativa"]], ["Evento / ao vivo", ["evento", "ao vivo", "live", "transmissao", "casamento", "culto", "show"]]];

// ── datas faladas → Date ──
const NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, quinze: 15, vinte: 20, trinta: 30 };
const MES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export function parseWhen(text) {
  const t = norm(text), today = new Date(); today.setHours(0, 0, 0, 0);
  const add = (d) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
  if (any(t, ["sem prazo", "sem data", "nao tenho prazo", "nao tem prazo", "nao sei", "tanto faz", "sem pressa", "nenhum"])) return { date: null };
  if (t.includes(" amanha ")) return { date: add(1) };
  if (t.includes(" semana que vem ") || t.includes(" proxima semana ")) return { date: add(7) };
  if (t.includes(" fim do mes ") || t.includes(" final do mes ")) return { date: new Date(today.getFullYear(), today.getMonth() + 1, 0) };
  let m = t.match(/ (\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))? /);
  if (m) { let y = m[3] ? +m[3] : today.getFullYear(); if (y < 100) y += 2000; const d = new Date(y, +m[2] - 1, +m[1]); if (d < today && !m[3]) d.setFullYear(y + 1); return { date: d }; }
  m = t.match(/ (?:dia )?(\d{1,2}|[a-z]+) de (janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/);
  if (m) { const day = +m[1] || NUM[m[1]]; if (day) { const d = new Date(today.getFullYear(), MES.indexOf(m[2]), day); if (d < today) d.setFullYear(d.getFullYear() + 1); return { date: d }; } }
  m = t.match(/ (\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta) (dia|dias|semana|semanas|mes|meses)/);
  if (m) { const n = +m[1] || NUM[m[1]]; const k = m[2].startsWith("dia") ? 1 : m[2].startsWith("sem") ? 7 : 30; return { date: add(n * k) }; }
  if (any(t, ["urgente", "o quanto antes", "rapido", "essa semana"])) return { date: add(7) };
  return null;
}
const fmt = (d) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

// ── briefing: transforma a fala solta em tópicos (a IA refina depois, se disponível) ──
const PLATS = [["netflix", "Netflix"], ["youtube", "YouTube"], ["instagram", "Instagram"], ["reels", "Instagram Reels"], ["tiktok", "TikTok"], ["tv", "TV"], ["televisao", "TV"], ["cinema", "Cinema"], ["festival", "Festivais"], ["spotify", "Spotify"], ["globoplay", "Globoplay"], ["prime", "Prime Video"], ["telao", "Telão / evento"], ["igreja", "Igreja"], ["site", "Site"]];
const UNITS = { segundo: "segundos", segundos: "segundos", s: "segundos", minuto: "minutos", minutos: "minutos", min: "minutos", hora: "horas", horas: "horas", h: "horas", episodio: "episódios", episodios: "episódios" };
export function organizeBrief(raw) {
  const text = String(raw).replace(/\s+/g, " ").trim();
  const t = norm(text), lines = [];
  // ideia: frase sem muletas de fala
  let idea = text.replace(/^(entao|então|bom|olha|tipo|é|e)\b[,\s]*/i, "").replace(/^(a )?minha ideia (e|é)( de)? /i, "").replace(/^(eu )?(quero|queria|gostaria de|preciso( de)?) /i, "").replace(/\b(né|tipo assim|sabe)\b,?/gi, "").trim();
  idea = idea.charAt(0).toUpperCase() + idea.slice(1);
  const dur = t.match(/ (\d+(?:[.,]\d+)?|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta) (segundos?|minutos?|min|horas?|h|episodios?) /);
  const style = text.match(/\b(?:estilo|no estilo( de)?|tipo|inspirad[oa] (?:em|no|na)|refer[eê]ncia(?: de| é)?)\s+([A-ZÀ-Ú0-9][\w\s&.-]*?)(?=\s+(?:com|de|para|pra|em|,|\.|e\s)|$)/);
  const plats = [...new Set(PLATS.filter(([k]) => t.includes(" " + k + " ")).map(([, v]) => v))];
  const fmt = [t.includes(" vertical ") || t.includes(" 9 16 ") || t.includes(" 9:16 ") ? "Vertical 9:16" : null, t.includes(" horizontal ") || t.includes(" 16 9 ") || t.includes(" 16:9 ") ? "Horizontal 16:9" : null, t.includes(" quadrado ") ? "Quadrado 1:1" : null, t.includes(" 4k ") ? "4K" : null].filter(Boolean);
  const ai = any(t, ["ia", "inteligencia artificial", "ia generativa"]);
  // tira da ideia o que já virou tópico (duração, estilo, plataforma, formato)
  idea = idea
    .replace(/\b(?:de |com )?(?:\d+(?:[.,]\d+)?|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta) (?:segundos?|minutos?|min|horas?|epis[oó]dios?)\b/gi, "")
    .replace(/,?\s*\b(?:no estilo(?: de)?|estilo|tipo|inspirad[oa] (?:em|no|na))\s+[A-ZÀ-Ú0-9][\w&.-]*(?:\s+[A-ZÀ-Ú][\w&.-]*)*/g, "")
    .replace(new RegExp(`\\b(?:para|pra|pro|no|na|em)\\s+(?:a |o |os |as )?(?:${PLATS.map(([k]) => k).join("|")})(?:\\s*(?:,|e)\\s*(?:${PLATS.map(([k]) => k).join("|")}))*\\b`, "gi"), "")
    .replace(/\b(?:vertical|horizontal|quadrado|em 4k|4k)(?:\s+e\s+(?:vertical|horizontal))?\b/gi, "")
    .replace(/^(?:fazer|criar|produzir|gravar)\s+(?:um|uma)\s+/i, "").replace(/^(?:um|uma|é um|é uma)\s+/i, "")
    .replace(/\bcom ia\b/gi, "com IA").replace(/\s+,/g, ",").replace(/\s{2,}/g, " ").replace(/[\s,]+$/, "").trim();
  idea = idea.charAt(0).toUpperCase() + idea.slice(1);
  lines.push(`Ideia: ${idea.replace(/[.]$/, "")}`);
  if (style?.[2]) lines.push(`Estilo / referência: ${style[2].trim()}`);
  if (dur) lines.push(`Duração: ${dur[1].replace(/^(um|uma)$/, "1")} ${UNITS[dur[2]] || dur[2]}`);
  if (fmt.length) lines.push(`Formato: ${fmt.join(" + ")}`);
  if (plats.length) lines.push(`Plataforma / entrega: ${plats.join(", ")}`);
  if (ai) lines.push("Uso de IA generativa: sim");
  return lines.join("\n");
}

// ── respostas de conhecimento ──
const count = (cat) => PROJECTS.filter((p) => p.cat === cat).length;
const catsLine = () => [...new Set(PROJECTS.map((p) => p.cat))].map((c) => `${count(c)} ${c.toLowerCase()}`).join(", ");
const highlights = () => [25, 24, 7, 14, 16].map((id) => PROJECTS.find((p) => p.id === id)).filter(Boolean);
const K = {
  who: () => SUMMARY,
  exp: () => `Experiência: ${EXP.map(([r, org, y]) => `${r} em ${org.replace("·", "e")} (${y})`).join("; ")}.`,
  clients: () => `Ele já trabalhou para ${CLIENTS.slice(0, -1).join(", ")} e ${CLIENTS.at(-1)}.`,
  tools: () => `Ferramentas: ${TOOLS.map(([k, v]) => `${k.toLowerCase()} com ${v.replace(/ · /g, ", ")}`).join("; ")}.`,
  edu: () => `Formação: ${EDU.map(([t, o, y]) => `${t}, ${o.split("·")[0].trim()} (${y})`).join("; ")}.`,
  method: () => `Como ele trabalha: ${METHOD.map(([t, d]) => `${t.toLowerCase()}: ${d}`).join(" ")}`,
  works: () => `São ${PROJECTS.length} trabalhos no portfólio: ${catsLine()}. Destaques: ${highlights().map((p) => `${coreTitle(p)}${artist(p) ? " com " + artist(p) : ""}, de ${year(p)}`).join("; ")}. Quer que eu abra algum?`,
  contact: () => "Você pode falar com o Alex pelo WhatsApp, pelo e-mail ascencioalexgabriel@gmail.com, pelo Instagram arroba alexascencioai ou pelo LinkedIn. Ele atende remoto e no Brasil todo.",
  ai: () => "O Alex usa IA generativa como ferramenta de produção: ComfyUI, Higgsfield, Runway, ElevenLabs e Topaz. A regra dele é simples: rascunho barato, plano aprovado e resolução final só no que passa como filmado de verdade.",
  price: () => "O valor depende de formato, duração e prazo. O melhor caminho é um orçamento rápido: eu anoto seus dados aqui mesmo, por voz, e mando pro Alex. Vamos?",
  local: () => "Ele é de São Paulo, no Brasil, e atende projetos remotos e no país todo.",
  me: () => "Eu sou a EDTH, a assistente do site do Alex. Posso abrir qualquer vídeo, navegar pelas seções, montar seu orçamento por voz, baixar o currículo, abrir os jogos do Playground e contar tudo sobre o trabalho dele.",
};

// orçamento por etapas
const Q = {
  name: "Vamos montar seu orçamento. Qual é o seu nome?",
  kind: (n) => `Prazer, ${n}. Que tipo de projeto? Videoclipe, documentário, curta, motion design, IA generativa ou evento ao vivo?`,
  when: "Tem prazo? Pode dizer uma data, como dia 20 de outubro, ou em duas semanas, ou sem prazo.",
  msg: "Agora me conta sobre o projeto: a ideia, referências, formato e duração.",
  more: "Anotei. Quer acrescentar algo? Ou diga: enviar pelo WhatsApp, ou enviar por e-mail.",
};

export function createBrain() {
  let flow = null; // { step, data }
  let pickN = 0; // rodízio de "um vídeo qualquer"
  const say = (s, actions = [], extra = {}) => ({ say: s, actions, ...extra });

  function budget(t, raw) {
    const d = flow.data;
    if (any(t, ["cancelar", "cancela", "deixa pra la", "esquece"])) { flow = null; return say("Tudo bem, cancelei o orçamento."); }
    if (flow.step === "name") {
      // tira "meu nome é / me chamo / sou o…" comparando sem acento e removendo o mesmo número de palavras
      const words = raw.replace(/[.,!?]/g, " ").trim().split(/\s+/);
      const pre = ["meu nome e", "me chamo", "pode me chamar de", "eu sou o", "eu sou a", "eu sou", "sou o", "sou a", "sou", "e o", "e a"].find((p) => norm(words.slice(0, p.split(" ").length).join(" ")).trim() === p);
      let n = words.slice(pre ? pre.split(" ").length : 0).join(" ");
      n = n.split(" ").slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      d.name = n; flow.step = "kind";
      return say(Q.kind(n.split(" ")[0]), [{ type: "form", patch: { name: n } }], { chips: ["Videoclipe", "Documentário", "Curta", "Motion design", "IA generativa", "Evento ao vivo"] });
    }
    if (flow.step === "kind") {
      const k = KINDS.find(([, ks]) => any(t, ks))?.[0] || "Outro";
      d.kind = k; flow.step = "when";
      return say(`${k}, anotado. ${Q.when}`, [{ type: "form", patch: { kind: k } }], { chips: ["Em duas semanas", "Em um mês", "Sem prazo"] });
    }
    if (flow.step === "when") {
      const w = parseWhen(raw);
      if (!w) return say("Não entendi a data. Pode dizer, por exemplo: dia 15 de novembro, em três semanas, ou sem prazo.");
      d.when = w.date; flow.step = "msg";
      return say(`${w.date ? `Prazo até ${fmt(w.date)}.` : "Sem prazo definido."} ${Q.msg}`, [{ type: "form", patch: { when: w.date } }]);
    }
    if (flow.step === "msg" || flow.step === "more") {
      if (flow.step === "more" && any(t, ["whatsapp", "zap", "enviar", "manda", "mandar", "email", "e mail"])) {
        const via = any(t, ["email", "e mail"]) ? "email" : "whatsapp";
        flow = null;
        return say(`Pronto. Vou abrir o ${via === "email" ? "e-mail" : "WhatsApp"} com tudo preenchido. Se não abrir sozinho, é só tocar no botão de envio.`, [{ type: "send", via }]);
      }
      if (flow.step === "more" && any(t, ["nao", "so isso", "e isso", "nada", "pronto"])) { flow.step = "more"; return say("Então é só dizer: enviar pelo WhatsApp, ou enviar por e-mail.", [], { chips: ["Enviar pelo WhatsApp", "Enviar por e-mail"] }); }
      d.raw = (d.raw ? d.raw + " " : "") + raw.trim();
      d.msg = organizeBrief(d.raw);
      flow.step = "more";
      return say(`Organizei o briefing no formulário. ${Q.more}`, [{ type: "form", patch: { msg: d.msg } }, { type: "refine", raw: d.raw, kind: d.kind, when: d.when ? fmt(d.when) : "sem prazo" }], { chips: ["Enviar pelo WhatsApp", "Enviar por e-mail", "Cancelar"] });
    }
  }

  function reply(raw) {
    const t = norm(raw);
    if (flow) { const r = budget(t, raw); if (r) return r; }

    // controle
    if (any(t, ["parar", "pare", "para tudo", "chega", "stop", "silencio", "cala a boca"])) return say("Parei.", [{ type: "stop" }]);
    if (any(t, ["assistir o site", "ver demonstracao", "demonstracao", "ver a demonstracao", "modo assistir", "tour", "me mostra o site", "apresenta o site"])) return say("Começando a demonstração do site. Mexa o mouse ou role a página quando quiser assumir.", [{ type: "tour" }]);
    if (any(t, ["ligar som", "ligar o som", "liga o som", "ligar musica", "com som"])) return say("Som ligado.", [{ type: "sound", on: true }]);
    if (any(t, ["desligar som", "desligar o som", "desliga o som", "sem som", "mudo"])) return say("Som desligado.", [{ type: "sound", on: false }]);
    if (any(t, ["descer", "desce", "rolar para baixo", "pra baixo", "para baixo"])) return say("", [{ type: "scroll", dir: 1 }]);
    if (any(t, ["subir", "sobe", "rolar para cima", "pra cima", "para cima"])) return say("", [{ type: "scroll", dir: -1 }]);

    // currículo
    if (any(t, ["curriculo", "cv"])) {
      if (any(t, ["baixar", "baixa", "download", "pdf", "salvar"])) return say("Baixando o currículo do Alex em PDF.", [{ type: "download", href: PDF }]);
      return say("Abrindo o currículo digital do Alex.", [{ type: "go", href: "/curriculo/" }]);
    }
    // redes
    for (const [k, words, label] of [["instagram", ["instagram", "insta"], "Instagram"], ["linkedin", ["linkedin", "linked in"], "LinkedIn"], ["whatsapp", ["whatsapp", "zap", "whats"], "WhatsApp"], ["email", ["email", "e mail"], "e-mail"]]) {
      if (any(t, words) && !any(t, ["enviar", "manda"])) return say(`Abrindo o ${label} do Alex.`, [{ type: "open", href: SOCIAL[k], label }]);
    }
    // jogos
    if (any(t, ["jogo", "jogos", "jogar", "playground", "brincar"]) || GAMES.some(([, ws]) => any(t, ws.filter((w) => w.length > 5)))) {
      const g = GAMES.find(([, ws]) => any(t, ws));
      return say(g ? `Abrindo o ${g[0] === "sabre" ? "jogo Sabre" : g[0]} no Playground.` : "Abrindo o Playground, com os jogos e instrumentos.", [{ type: "go", href: `/playground/${g ? "#" + g[0] : ""}` }]);
    }
    // orçamento
    if (any(t, ["orcamento", "orcar", "contratar", "quanto custa", "quanto cobra", "preco", "valor", "proposta", "fazer um video", "fazer um clipe", "quero um video", "fechar um projeto"])) {
      if (any(t, ["quanto custa", "quanto cobra", "preco", "valor"]) && !any(t, ["orcamento"])) { flow = { step: "name", data: {} }; return say(`${K.price()} ${Q.name}`, [{ type: "nav", id: "contato" }]); }
      flow = { step: "name", data: {} };
      return say(Q.name, [{ type: "nav", id: "contato" }]);
    }
    // vídeos
    const wantsVideo = any(t, ["assistir", "ver", "abrir", "abre", "tocar", "toca", "toque", "coloca", "coloque", "mostra", "mostrar", "play", "reproduzir", "passa"]);
    if (any(t, ["mais recente", "ultimo lancamento", "ultimo video", "lancamento", "video novo", "mais novo", "ultimo trabalho"])) {
      const p = latest();
      return say(`O mais recente é ${coreTitle(p)}${artist(p) ? ", " + artist(p) : ""}. Abrindo agora.`, [{ type: "play", id: p.id }]);
    }
    const cat = Object.entries(CATS).find(([k]) => t.includes(" " + k + " "));
    const proj = findProject(raw);
    if (proj && (wantsVideo || toks(raw).length <= 4)) return say(`Abrindo ${coreTitle(proj)}${artist(proj) ? ", " + artist(proj) : ""}, de ${year(proj)}.`, [{ type: "play", id: proj.id }]);
    // pedido genérico ("abre um vídeo dele", "um vídeo do YouTube", "outro"): alterna entre os destaques
    const generic = any(t, ["video", "videos", "clipe", "trabalho", "trabalhos", "filme", "algo", "alguma coisa", "youtube", "exemplo"]);
    if ((wantsVideo && generic && !cat) || (pickN > 0 && any(t, ["outro", "outro video", "mais um", "proximo video", "proximo", "outra"]))) {
      const yt = t.includes(" youtube ");
      const pool = (yt ? PROJECTS.filter((p) => p.url) : [...highlights(), ...PROJECTS.filter((p) => p.q === "4K" && !highlights().includes(p))]);
      const p = pool[pickN++ % pool.length];
      return say(`Vou abrir ${coreTitle(p)}${artist(p) ? ", " + artist(p) : ""}, de ${year(p)}${yt ? ", que está no YouTube" : ""}. Se quiser outro, é só dizer: outro.`, [{ type: "play", id: p.id }], { chips: ["Outro", "Vídeo mais recente", "Quais trabalhos ele fez?"] });
    }
    if (cat && (wantsVideo || any(t, ["quais", "tem", "lista", "filtrar", "so"]))) {
      const list = PROJECTS.filter((p) => p.cat === cat[1]);
      const plural = { Clipes: "clipes", "Documentário": "documentários", Cinema: "filmes de cinema", "Reality Show": "reality show", "Turnê": "registros de turnê", Bastidores: "making ofs", Institucional: "institucionais" }[cat[1]] || cat[1].toLowerCase();
      return say(`${list.length} ${plural}: ${list.slice(0, 5).map((p) => coreTitle(p)).join(", ")}${list.length > 5 ? " e outros" : ""}. Mostrando na seleção.`, [{ type: "filter", cat: cat[1] }]);
    }
    // seções
    if (any(t, ["ir para", "vai para", "va para", "leva", "mostra", "abrir", "abre", "secao", "pagina"]) || toks(raw).length <= 3) {
      const s = SECTIONS.find(([, ws]) => any(t, ws));
      if (s) return say("", [{ type: "nav", id: s[0] }]);
    }
    // conhecimento
    if (any(t, ["quem e voce", "o que voce faz", "o que voce pode", "como funciona", "ajuda", "tutorial", "seu nome"])) return say(K.me(), [], { chips: TUTORIAL });
    if (any(t, ["quem e", "quem e ele", "resume", "resumir", "resumo", "sobre ele", "me fala do alex", "fale sobre", "conta sobre", "apresenta", "quem e o alex", "alex ascencio"])) return say(K.who(), [{ type: "nav", id: "sobre", silent: true }], { chips: ["Quais trabalhos ele fez?", "Com quem ele trabalhou?", "Quero um orçamento"] });
    if (any(t, ["experiencia", "trabalhou onde", "onde ele trabalha", "empresa", "carreira", "trajetoria", "emprego"])) return say(K.exp());
    if (any(t, ["clientes", "cliente", "com quem", "marcas", "parceiros", "trabalhou para", "trabalhou com"])) return say(K.clients());
    if (any(t, ["ferramentas", "programas", "software", "softwares", "edita em", "usa qual", "premiere", "davinci", "after effects"])) return say(K.tools());
    if (any(t, ["formacao", "faculdade", "estudou", "curso", "cursos", "graduacao"])) return say(K.edu());
    if (any(t, ["como ele trabalha", "metodo", "processo", "estilo", "jeito de editar"])) return say(K.method());
    if (any(t, ["trabalhos", "portfolio", "projetos", "o que ele ja fez", "quais videos", "ja fez"])) return say(K.works(), [{ type: "nav", id: "arquivo", silent: true }]);
    if (any(t, ["ia", "inteligencia artificial", "ia generativa"])) return say(K.ai());
    if (any(t, ["contato", "falar com ele", "telefone", "numero"])) return say(K.contact(), [{ type: "nav", id: "contato", silent: true }], { links: [["WhatsApp", SOCIAL.whatsapp], ["Instagram", SOCIAL.instagram], ["LinkedIn", SOCIAL.linkedin]] });
    if (any(t, ["onde ele mora", "de onde", "cidade", "mora onde", "atende onde"])) return say(K.local());
    if (any(t, ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai", "hey"])) return say("Oi! Eu sou a EDTH, assistente do Alex. Posso abrir vídeos, contar sobre o trabalho dele ou montar seu orçamento. O que você quer ver?", [], { chips: TUTORIAL });
    if (any(t, ["obrigado", "obrigada", "valeu", "brigado"])) return say("Por nada! Se precisar, é só chamar.");
    if (any(t, ["tchau", "ate mais", "fechar", "sair"])) return say("Até mais!", [{ type: "close" }]);
    return null; // desconhecido → IA
  }
  return { reply, get flow() { return flow; }, reset() { flow = null; } };
}

export const TUTORIAL = ["Quem é o Alex?", "Assistir Tu És", "Vídeo mais recente", "Quero fazer um orçamento", "Abrir o jogo Sabre", "Baixar currículo", "Instagram do Alex", "Assistir o site"];
// resumo para a IA (api/edth.js envia no prompt de sistema)
export const KNOWLEDGE = () => [SUMMARY, K.exp(), K.clients(), K.tools(), K.edu(), K.method(), K.contact(),
  "Trabalhos (id · título · categoria · ano): " + PROJECTS.map((p) => `${p.id} · ${p.title} · ${p.cat} · ${year(p)}`).join(" | ")].join("\n");
