import { PROJECTS } from "../projects.js";
import { SUMMARY, EXP, CLIENTS, TOOLS, EDU, METHOD, SOCIAL, PDF } from "../profile.js";

// Motor local da EDITH: entende pedidos em português (voz ou texto), conduz o orçamento por etapas e
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
    const tt = toks(coreTitle(p)), at = toks(artist(p));
    const hitT = tt.filter((w) => q.includes(w)).length, hitA = at.filter((w) => q.includes(w)).length;
    const cover = tt.length ? hitT / tt.length : 0;
    const score = cover * 3 + hitA * 0.6 + (hitT ? 0.5 : 0);
    const qcover = hitT / q.length;
    if (!best || score > best.score || (score === best.score && p.date > best.p.date)) best = { p, score, cover, hitA, qcover };
  }
  // precisa cobrir boa parte do título, ou citar o artista (evita "que dia é hoje" → "Dia das Profissões")
  return best && (best.cover >= 0.6 || best.hitA >= 1 || (best.qcover >= 1 && q.length <= 3 && q[0].length > 4)) ? best.p : null;
}
export const latest = () => PROJECTS[0];

const CATS = { clipes: "Clipes", clipe: "Clipes", videoclipes: "Clipes", documentarios: "Documentário", documentario: "Documentário", cinema: "Cinema", curtas: "Cinema", curta: "Cinema", reality: "Reality Show", turne: "Turnê", turnes: "Turnê", bastidores: "Bastidores", "making": "Bastidores", institucional: "Institucional", institucionais: "Institucional" };
const SECTIONS = [["top", ["inicio", "topo", "comeco", "home"]], ["filmes", ["filmes", "destaques", "filmes em destaque"]], ["lab", ["lab", "laboratorio", "servicos"]], ["metodo", ["metodo", "timeline", "processo"]], ["arquivo", ["selecao", "portfolio", "trabalhos", "projetos", "arquivo"]], ["sobre", ["sobre", "sobre ele", "sobre o alex", "sobre mim", "biografia"]], ["contato", ["contato", "falar com ele", "fale com ele"]]];
const TOUR = ["assistir o site", "assistir site", "ver site", "ver o site", "ver demonstracao", "ver a demonstracao", "demonstracao", "demo", "modo assistir", "tour", "comecar tour", "comecar o tour", "iniciar tour", "iniciar o tour", "inicia o tour", "faz um tour", "fazer um tour", "tour guiado", "visita guiada", "passeio", "me mostra o site", "mostra o site", "mostrar o site", "apresenta o site", "apresentar o site", "apresentacao", "me mostra tudo", "mostra tudo", "navega sozinha", "piloto automatico", "modo automatico", "conhecer o site"];
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

// e-mail ditado ("joao ponto silva arroba gmail ponto com") → joao.silva@gmail.com; null se não fechar
export function parseEmail(raw) {
  let t = String(raw).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  t = t.replace(/^(o )?(meu )?(e-?mail|email) (e|eh)\s+/, "");
  t = t.replace(/\s*(arroba|arrouba)\s*/g, "@").replace(/\s*(ponto|dot)\s*/g, ".").replace(/\s*(underline|underscore|sublinhado)\s*/g, "_")
    .replace(/\s*(traco|hifen|menos)\s*/g, "-").replace(/\s+/g, "").replace(/[,;]+$/, "").replace(/\.$/, "");
  const m = t.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
  return m ? m[0] : null;
}

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
  who: () => SUMMARY.split(/(?<=\.)\s+/).slice(0, 2).join(" "),
  exp: () => `${EXP.slice(0, 2).map(([r, org, y]) => `${r} em ${org.split("·")[0].trim()} (${y})`).join("; ")}.`,
  clients: () => `Ele já trabalhou para ${CLIENTS.slice(0, -1).join(", ")} e ${CLIENTS.at(-1)}.`,
  tools: () => "Premiere, DaVinci Resolve e After Effects. Na IA, ComfyUI, Higgsfield e Runway.",
  edu: () => `Formação: ${EDU.map(([t, o, y]) => `${t}, ${o.split("·")[0].trim()} (${y})`).join("; ")}.`,
  method: () => `Como ele trabalha: ${METHOD.map(([t, d]) => `${t.toLowerCase()}: ${d}`).join(" ")}`,
  works: () => `São ${PROJECTS.length} trabalhos: ${catsLine()}. Destaques: ${highlights().slice(0, 3).map((p) => coreTitle(p)).join(", ")}.`,
  contact: () => "Pelo WhatsApp, e-mail, Instagram ou LinkedIn. Se quiser, eu mesma mando um recado seu pra ele.",
  ai: () => "Ele usa ComfyUI, Higgsfield, Runway, ElevenLabs e Topaz. Só entra no filme o que passa como filmado de verdade.",
  price: () => "Depende de formato, duração e prazo. Eu monto o orçamento com você agora.",
  local: () => "Ele é de São Paulo e atende no Brasil todo, também remoto.",
  me: () => "Sou a EDITH, assistente do Alex. Abro vídeos, navego pelo site, monto orçamento, mando recado pro Alex e converso com você.",
};

// orçamento por etapas
const Q = {
  name: "Vamos lá. Qual é o seu nome?",
  kind: (n) => `Prazer, ${n}. Que tipo de projeto?`,
  when: "Tem prazo?",
  msg: "Me conta a ideia: referências, formato e duração.",
  more: "Anotei. Quer acrescentar algo, ou envio pelo WhatsApp ou por e-mail?",
};

function cleanName(raw) {
  // tira "meu nome é / me chamo / sou o…" comparando sem acento e removendo o mesmo número de palavras
  const words = raw.replace(/[.,!?]/g, " ").trim().split(/\s+/);
  const pre = ["meu nome e", "me chamo", "pode me chamar de", "eu sou o", "eu sou a", "eu sou", "sou o", "sou a", "sou", "e o", "e a"].find((p) => norm(words.slice(0, p.split(" ").length).join(" ")).trim() === p);
  return words.slice(pre ? pre.split(" ").length : 0).slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function createBrain() {
  let flow = null; // { step, data }
  let pickN = 0; // rodízio de "um vídeo qualquer"
  const say = (s, actions = [], extra = {}) => ({ say: s, actions, ...extra });

  function budget(t, raw) {
    const d = flow.data;
    if (any(t, ["cancelar", "cancela", "deixa pra la", "esquece"])) { flow = null; return say("Tudo bem, cancelei o orçamento."); }
    if (flow.step === "name") {
      const n = cleanName(raw);
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
    if (flow.step === "bemail") {
      const e = parseEmail(raw);
      if (!e) return say("Não peguei o e-mail. Pode digitar aqui embaixo?");
      const brief = `Orçamento · ${d.kind || "projeto"}\nPrazo: ${d.when ? fmt(d.when) : "sem prazo"}\n\n${d.msg || d.raw || ""}`;
      flow = null;
      return say("Enviando pro Alex.", [{ type: "mail", name: d.name, email: e, message: brief, subject: `Orçamento: ${d.kind || "projeto"}` }]);
    }
    if (flow.step === "msg" || flow.step === "more") {
      if (flow.step === "more" && any(t, ["whatsapp", "zap", "enviar", "manda", "mandar", "email", "e mail"])) {
        if (any(t, ["email", "e mail"])) { flow.step = "bemail"; return say("Qual é o seu e-mail? Pode falar ou digitar."); }
        flow = null;
        return say("Abrindo o WhatsApp com tudo preenchido.", [{ type: "send", via: "whatsapp" }]);
      }
      if (flow.step === "more" && any(t, ["nao", "so isso", "e isso", "nada", "pronto"])) { flow.step = "more"; return say("Então é só dizer: enviar pelo WhatsApp, ou enviar por e-mail.", [], { chips: ["Enviar pelo WhatsApp", "Enviar por e-mail"] }); }
      d.raw = (d.raw ? d.raw + " " : "") + raw.trim();
      d.msg = organizeBrief(d.raw);
      flow.step = "more";
      return say(`Organizei o briefing. ${Q.more}`, [{ type: "form", patch: { msg: d.msg } }, { type: "refine", raw: d.raw, kind: d.kind, when: d.when ? fmt(d.when) : "sem prazo" }], { chips: ["Enviar pelo WhatsApp", "Enviar por e-mail", "Cancelar"] });
    }
  }

  // recado por e-mail: nome → e-mail → mensagem → confirma e envia
  function note(t, raw) {
    const d = flow.data;
    if (any(t, ["cancelar", "cancela", "deixa pra la", "esquece"])) { flow = null; return say("Cancelado."); }
    if (flow.step === "nname") { d.name = cleanName(raw); flow.step = "nemail"; return say(`Oi, ${d.name.split(" ")[0]}. Qual é o seu e-mail?`); }
    if (flow.step === "nemail") {
      const e = parseEmail(raw);
      if (!e) return say("Não peguei o e-mail. Pode digitar aqui embaixo?");
      d.email = e; flow.step = "ntext"; return say("Pode falar o recado.");
    }
    if (flow.step === "ntext") { d.message = raw.trim(); flow.step = "nok"; return say("Envio assim?", [], { chips: ["Enviar", "Cancelar"] }); }
    if (flow.step === "nok") {
      if (any(t, ["sim", "pode", "envia", "enviar", "manda", "mandar", "isso", "ok", "pode mandar", "confirmo"])) { flow = null; return say("Enviando.", [{ type: "mail", name: d.name, email: d.email, message: d.message, subject: "Recado pelo site" }]); }
      d.message += "\n" + raw.trim(); return say("Acrescentei. Envio?", [], { chips: ["Enviar", "Cancelar"] });
    }
  }

  function reply(raw) {
    const t = norm(raw), n = toks(raw).length, words = t.trim().split(" ").length;
    // pergunta aberta ("que dia é hoje", "como está o tempo") não vira comando: vai para a IA
    const isQ = /^ (que|qual|quais|quando|como|onde|quem|por que|porque|pq|quanto|quantos|quantas|sera|voce sabe|me diz|me fala|o que|e se) /.test(t) || /\?\s*$/.test(raw);
    const cmd = words <= 7; // comandos de controle só em frases curtas (conversa longa não dispara ação por acaso)
    if (flow?.step?.startsWith("n")) { const r = note(t, raw); if (r) return r; }
    else if (flow) { const r = budget(t, raw); if (r) return r; }

    // ajuda / lista de comandos
    if (any(t, ["comandos", "lista de comandos", "o que eu posso falar", "o que posso falar", "o que eu posso pedir", "quem e voce", "o que voce faz", "o que voce pode", "como funciona", "ajuda", "tutorial", "seu nome"])) return say(K.me(), [], { chips: TUTORIAL, all: true });
    // microfone e vídeo
    if (cmd && any(t, ["desligar microfone", "desliga o microfone", "desligar o microfone", "desliga microfone", "para de ouvir", "parar de ouvir", "pode desligar", "desligar mic", "fecha o microfone", "sem microfone"])) return say("Microfone desligado.", [{ type: "micoff" }]);
    if (cmd && any(t, ["fechar video", "fecha o video", "fechar o video", "fecha video", "sair do video", "tira o video", "fecha o player", "voltar pro site", "volta pro site"])) return say("", [{ type: "close_video" }]);
    // recado para o Alex
    if (any(t, ["mandar mensagem", "mandar uma mensagem", "mandar recado", "mandar um recado", "deixar recado", "deixar um recado", "mandar email", "mandar um email", "mandar e mail", "mandar um e mail", "enviar email", "enviar um email", "enviar e mail", "enviar mensagem", "enviar uma mensagem", "escrever para o alex", "escrever pro alex", "recado para o alex", "recado pro alex", "falar com o alex por email", "mensagem para o alex", "mensagem pro alex"])) {
      flow = { step: "nname", data: {} }; return say("Mando sim. Qual é o seu nome?");
    }

    // controle
    if (cmd && any(t, ["parar", "pare", "para", "para tudo", "chega", "stop", "silencio", "cala a boca", "parar tour", "para o tour", "sair do tour"])) return say("Parei.", [{ type: "stop" }]);
    if (cmd && any(t, TOUR)) return say("Começando. Mexa o mouse ou role pra assumir.", [{ type: "tour" }]);
    if (cmd && any(t, ["ligar som", "ligar o som", "liga o som", "ligar musica", "liga a musica", "com som", "tocar musica", "som ligado"])) return say("Som ligado.", [{ type: "sound", on: true }]);
    if (cmd && any(t, ["desligar som", "desligar o som", "desliga o som", "desliga a musica", "desligar musica", "sem som", "mudo", "tirar o som"])) return say("Som desligado.", [{ type: "sound", on: false }]);
    if (cmd && any(t, ["descer", "desce", "rolar", "rola", "rolar para baixo", "pra baixo", "para baixo", "continua", "proxima secao"])) return say("", [{ type: "scroll", dir: 1 }]);
    if (cmd && any(t, ["subir", "sobe", "rolar para cima", "pra cima", "para cima", "secao anterior"])) return say("", [{ type: "scroll", dir: -1 }]);

    // currículo
    if (any(t, ["curriculo", "cv"])) {
      if (any(t, ["baixar", "baixa", "download", "pdf", "salvar"])) return say("Baixando o currículo.", [{ type: "download", href: PDF }]);
      return say("Abrindo o currículo.", [{ type: "go", href: "/curriculo/" }]);
    }
    // redes
    for (const [k, words, label] of [["instagram", ["instagram", "insta"], "Instagram"], ["linkedin", ["linkedin", "linked in"], "LinkedIn"], ["whatsapp", ["whatsapp", "zap", "whats"], "WhatsApp"], ["email", ["email", "e mail"], "e-mail"]]) {
      if (cmd && any(t, words) && !any(t, ["enviar", "manda", "mandar", "meu"])) return say(`Abrindo o ${label}.`, [{ type: "open", href: SOCIAL[k], label }]);
    }
    // jogos
    if (cmd && !isQ && (any(t, ["jogos", "jogar", "playground", "brincar", "abre o jogo", "abrir o jogo", "abrir jogo", "quero jogar"]) || GAMES.some(([, ws]) => any(t, ws.filter((w) => w.length > 5))))) {
      const g = GAMES.find(([, ws]) => any(t, ws));
      return say(g ? `Abrindo o ${g[0] === "sabre" ? "Sabre" : g[0]}.` : "Abrindo o Playground.", [{ type: "go", href: `/playground/${g ? "#" + g[0] : ""}` }]);
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
      return say(`Abrindo ${coreTitle(p)}, o mais recente.`, [{ type: "play", id: p.id }]);
    }
    const cat = Object.entries(CATS).find(([k]) => t.includes(" " + k + " "));
    const proj = findProject(raw);
    if (proj && !isQ && ((wantsVideo && cmd) || n <= 4)) return say(`Abrindo ${coreTitle(proj)}.`, [{ type: "play", id: proj.id }]);
    // pedido genérico ("abre um vídeo dele", "um vídeo do YouTube", "outro"): alterna entre os destaques
    const generic = any(t, ["video", "videos", "clipe", "trabalho", "trabalhos", "filme", "algo", "alguma coisa", "youtube", "exemplo"]);
    if ((wantsVideo && generic && !cat && cmd && !isQ) || (pickN > 0 && any(t, ["outro", "outro video", "mais um", "proximo video", "proximo", "outra"]))) {
      const yt = t.includes(" youtube ");
      const pool = (yt ? PROJECTS.filter((p) => p.url) : [...highlights(), ...PROJECTS.filter((p) => p.q === "4K" && !highlights().includes(p))]);
      const p = pool[pickN++ % pool.length];
      return say(`Abrindo ${coreTitle(p)}.`, [{ type: "play", id: p.id }], { chips: ["Outro", "Vídeo mais recente"] });
    }
    if (cat && cmd && !isQ && (wantsVideo || any(t, ["quais", "tem", "lista", "filtrar", "so"]))) {
      const list = PROJECTS.filter((p) => p.cat === cat[1]);
      const plural = { Clipes: "clipes", "Documentário": "documentários", Cinema: "filmes de cinema", "Reality Show": "reality show", "Turnê": "registros de turnê", Bastidores: "making ofs", Institucional: "institucionais" }[cat[1]] || cat[1].toLowerCase();
      return say(`${list.length} ${plural}. Mostrando na seleção.`, [{ type: "filter", cat: cat[1] }]);
    }
    // seções
    if (cmd && !isQ && (any(t, ["ir para", "vai para", "va para", "leva", "mostra", "abrir", "abre", "secao", "pagina", "ver", "quero ver"]) || n <= 3)) {
      const s = SECTIONS.find(([, ws]) => any(t, ws));
      if (s) return say("", [{ type: "nav", id: s[0] }]);
    }
    // conhecimento: só quando a frase é curta ou fala do Alex (conversa pessoal longa vai para a IA)
    const about = n <= 4 || any(t, ["alex", "ele", "dele", "o editor", "seu chefe", "voce"]);
    if (!about) return null;

    if (any(t, ["quem e", "quem e ele", "resume", "resumir", "resumo", "sobre ele", "me fala do alex", "fale sobre", "conta sobre", "apresenta", "quem e o alex", "alex ascencio"])) return say(K.who(), [{ type: "nav", id: "sobre", silent: true }], { chips: ["Quais trabalhos ele fez?", "Com quem ele trabalhou?", "Quero um orçamento"] });
    if (any(t, ["experiencia", "trabalhou onde", "onde ele trabalha", "empresa", "carreira", "trajetoria", "emprego"])) return say(K.exp());
    if (any(t, ["clientes", "cliente", "com quem", "marcas", "parceiros", "trabalhou para", "trabalhou com"])) return say(K.clients());
    if (any(t, ["ferramentas", "programas", "software", "softwares", "edita em", "usa qual", "premiere", "davinci", "after effects"])) return say(K.tools());
    if (any(t, ["formacao", "faculdade", "estudou", "curso", "cursos", "graduacao"])) return say(K.edu());
    if (any(t, ["como ele trabalha", "metodo", "processo", "estilo", "jeito de editar"])) return say(K.method());
    if (any(t, ["trabalhos", "portfolio", "projetos", "o que ele ja fez", "quais videos", "ja fez"])) return say(K.works(), [{ type: "nav", id: "arquivo", silent: true }]);
    if (any(t, ["inteligencia artificial", "ia generativa", "usa ia", "com ia", "sobre ia", "e ia", "de ia"])) return say(K.ai());
    if (any(t, ["contato", "falar com ele", "telefone", "numero"])) return say(K.contact(), [{ type: "nav", id: "contato", silent: true }], { links: [["WhatsApp", SOCIAL.whatsapp], ["Instagram", SOCIAL.instagram], ["LinkedIn", SOCIAL.linkedin]] });
    if (any(t, ["onde ele mora", "de onde", "cidade", "mora onde", "atende onde"])) return say(K.local());
    if (n <= 3 && any(t, ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai", "hey", "opa"])) return say("Oi! O que você quer ver?");
    if (n <= 3 && any(t, ["obrigado", "obrigada", "valeu", "brigado"])) return say("Por nada!");
    if (cmd && any(t, ["tchau", "ate mais", "fechar", "sair", "fecha", "fechar edith", "fecha a edith"])) return say("Até mais!", [{ type: "close" }]);
    return null; // desconhecido → IA
  }
  return { reply, get flow() { return flow; }, reset() { flow = null; } };
}

export const TUTORIAL = ["Assistir o site", "Assistir Tu És", "Vídeo mais recente", "Quem é o Alex?", "Quero um orçamento", "Mandar recado pro Alex", "Abrir o jogo Sabre", "Baixar currículo", "Instagram do Alex"];
// resumo para a IA (api/edth.js envia no prompt de sistema)
export const KNOWLEDGE = () => [SUMMARY,
  `Experiência: ${EXP.map(([r, org, y]) => `${r} em ${org.replace("·", "e")} (${y})`).join("; ")}.`, K.clients(),
  `Ferramentas: ${TOOLS.map(([k, v]) => `${k.toLowerCase()} com ${v.replace(/ · /g, ", ")}`).join("; ")}.`, K.edu(), K.method(),
  "Contato: WhatsApp, e-mail ascencioalexgabriel@gmail.com, Instagram @alexascencioai, LinkedIn. Atende remoto e no Brasil todo.", K.local(),
  "Trabalhos (id · título · categoria · ano): " + PROJECTS.map((p) => `${p.id} · ${p.title} · ${p.cat} · ${year(p)}`).join(" | ")].join("\n");
