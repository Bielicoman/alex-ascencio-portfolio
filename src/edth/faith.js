// Curated summaries, not quotations. Reviewed against these official sources on 2026-09-25.
// The links are shared by the server and browser; never accept arbitrary model-generated URLs.
export const FAITH_SOURCES = {
  beliefs: ["Crenças fundamentais · IASD", "https://institucional.adventistas.org/pt/nossas-crencas/"],
  faq: ["Perguntas frequentes · IASD", "https://www.adventistas.org/pt/faq/"],
  bible: ["Estudo da Bíblia · IASD", "https://institucional.adventistas.org/pt/quem-somos/missao-e-servico/estudo-da-biblia/"],
  white: ["Acervo de Ellen G. White", "https://egwwritings.org/"],
  cpb: ["Casa Publicadora Brasileira", "https://www.cpb.com.br/"],
  hope: ["Esperança · Novo Tempo", "https://www.novotempo.com/olam/"],
};
export const HOPE_LINK = "https://wa.me/5512982000062?text=Oi%2C%20Esperan%C3%A7a!";
export const FAITH_TOPICS = [
  { id:"study", keys:["estudo biblico","estudar a biblia","esperanca","curso biblico","estudos biblicos"], source:"hope", text:"A Esperança é a instrutora bíblica virtual da Novo Tempo. Você pode conversar com ela pelo WhatsApp +55 (12) 98200-0062 para conhecer os estudos bíblicos. O botão abre a conversa; você escolhe se quer enviar a mensagem." },
  { id:"bible", keys:["biblia","escritura","versiculo","traducao","biblico"], source:"bible", text:"Na fé adventista, a Bíblia é a regra de fé e prática. Para estudar uma passagem, leia o contexto, considere seu gênero literário e compare textos sobre o mesmo assunto. Referências úteis: 2 Timóteo 3:16–17 e Lucas 24:27. Posso ajudar a organizar o estudo; uma citação literal precisa ser conferida na tradução escolhida." },
  { id:"beliefs", keys:["crencas","doutrina","28","adventista","iasd"], source:"beliefs", text:"As 28 crenças fundamentais adventistas abrangem Deus, a humanidade, a salvação, a igreja, a vida cristã e os acontecimentos finais. A Bíblia é sua base. Jesus Cristo, Sua vida, morte, ressurreição e ministério ocupam o centro dessa compreensão. O documento oficial apresenta cada crença e suas referências bíblicas." },
  { id:"sabbath", keys:["sabado","descanso","setimo dia"], source:"beliefs", text:"Os adventistas guardam o sábado, do pôr do sol de sexta ao pôr do sol de sábado, como tempo de descanso, adoração e serviço. Entendem essa prática como resposta à graça de Deus. Textos para estudar: Gênesis 2:1–3, Êxodo 20:8–11 e Marcos 2:27–28." },
  { id:"salvation", keys:["salvacao","graca","jesus","trindade","batismo"], source:"beliefs", text:"Na compreensão adventista, a salvação é um dom da graça de Deus recebido pela fé em Jesus Cristo; a obediência é fruto dessa relação. A igreja confessa um só Deus: Pai, Filho e Espírito Santo. Referências: Efésios 2:8–10, João 3:16 e Mateus 28:19. O batismo por imersão expressa publicamente a fé e o compromisso com Cristo." },
  { id:"prophecy", keys:["profecia","daniel","apocalipse","2300","1844","santuario","juizo","historicista"], source:"beliefs", text:"A interpretação adventista de Daniel e Apocalipse é historicista: relaciona as profecias ao desenvolvimento da história. Daniel 8:14 e Hebreus 8–9 são importantes para sua compreensão do santuário e do ministério de Cristo. A doutrina adventista relaciona 1844 a uma fase desse ministério celestial. Isso é uma interpretação confessional; não autoriza marcar a data da volta de Jesus (Mateus 24:36). Uma análise cuidadosa deve distinguir texto bíblico, símbolo e interpretação." },
  { id:"death", keys:["morte","mortos","inferno","ressurreicao","alma"], source:"beliefs", text:"Os adventistas compreendem a morte como um estado de inconsciência até a ressurreição. Sua esperança está na volta de Jesus e na ressurreição dos que confiam nEle. Leia João 11:11–14, Eclesiastes 9:5 e 1 Tessalonicenses 4:13–18. Essa é a interpretação adventista; outras tradições cristãs interpretam esses textos de modo diferente." },
  { id:"white", keys:["ellen","white","espirito de profecia","grande conflito","desejado","caminho a cristo","patriarcas","profetas"], source:"white", text:"Ellen G. White participou da formação do movimento adventista. A igreja reconhece em seu ministério o dom de profecia e afirma a Bíblia como norma para avaliar todo ensino. Entre seus livros estão Caminho a Cristo, O Desejado de Todas as Nações e O Grande Conflito. Para uma frase específica, é necessário conferir obra, capítulo, contexto e edição no acervo; não é correto inventar páginas ou atribuir a ela uma paráfrase como se fosse citação." },
  { id:"institution", keys:["instituicao","associacao","missao","uniao","divisao","conferencia","organizacao","unob"], source:"faq", text:"A organização adventista articula igrejas locais, associações ou missões, uniões e a Associação Geral, com suas divisões. A União Noroeste Brasileira é uma dessas uniões. Nomes de dirigentes, territórios e estatísticas podem mudar e precisam ser consultados nos canais institucionais atuais." },
  { id:"ministries", keys:["desbravadores","aventureiros","adra","escola sabatina","ministerios","novo tempo"], source:"faq", text:"A Igreja Adventista atua em educação, saúde, ação humanitária, comunicação e formação bíblica. Desbravadores e Aventureiros atendem diferentes faixas etárias; a Escola Sabatina promove estudo bíblico; a ADRA atua em ajuda humanitária; e a Novo Tempo oferece conteúdo e estudos bíblicos. Cada iniciativa possui canais oficiais para informações e participação." },
  { id:"cpb", keys:["cpb","publicadora","livro","licao","literatura","revista"], source:"cpb", text:"A Casa Publicadora Brasileira publica literatura adventista, incluindo materiais de estudo bíblico, livros, revistas e lições da Escola Sabatina. Edições, preços e disponibilidade devem ser conferidos no catálogo oficial. Posso indicar o caminho para pesquisar um título, sem afirmar estoque ou preço que não tenha sido verificado." },
  { id:"health", keys:["saude","alimentacao","mordomia","dizimo","familia"], source:"beliefs", text:"Na perspectiva adventista, cuidar da saúde, dos relacionamentos, do tempo e dos recursos faz parte da vida cristã. A mordomia expressa responsabilidade e gratidão a Deus. Orientações espirituais não substituem atendimento médico ou acompanhamento profissional quando necessário." },
];
const normalize = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function faithContext(message) {
  const t=normalize(message);
  return FAITH_TOPICS.map(topic=>({ ...topic, score:topic.keys.reduce((n,k)=>n+(t.includes(k)?k.length:0),0) })).filter(t=>t.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
}
export function studyInvite(message) {
  const t=normalize(message);
  if (!/estudar a biblia|estudo[s]? biblico[s]?|curso[s]? biblico[s]?|falar com.{0,15}esperanca|contato.{0,15}esperanca|whats.{0,25}esperanca/.test(t)) return null;
  return {say:FAITH_TOPICS[0].text, actions:[], links:[["Conversar com a Esperança no WhatsApp", HOPE_LINK]], sources:["hope"], mode:"curated"};
}
export function faithFallback(message) {
  const invite=studyInvite(message); if(invite)return invite;
  const topics=faithContext(message); if(!topics.length)return null;
  const t=topics[0];
  return {say:`${t.text}\n\nEsta é uma orientação da base de referência. A conversa com IA não está disponível agora para aprofundar a sua pergunta.`,actions:[],sources:[t.source],links:[FAITH_SOURCES[t.source]],mode:"curated"};
}
