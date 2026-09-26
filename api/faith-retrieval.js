import { FAITH_SOURCES } from "../src/edth/faith.js";

const cache = new Map();
const normalize = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
async function sourceText(id) {
  const existing=cache.get(id);
  if(existing && existing.expires>Date.now())return existing.text;
  const url=FAITH_SOURCES[id]?.[1];
  if(!url)return "";
  try {
    const response=await fetch(url,{signal:AbortSignal.timeout(3500),redirect:"error",headers:{Accept:"text/html"}});
    if(!response.ok || !response.headers.get("content-type")?.includes("text/html"))return "";
    const reader=response.body.getReader(),decoder=new TextDecoder();let size=0,html="";
    try { while(size<350000){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;html+=decoder.decode(value,{stream:true});} } finally { await reader.cancel(); }
    const text=html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,"")
      .replace(/<\/(p|div|h[1-6]|li|section)>/gi,"\n").replace(/<[^>]+>/g," ")
      .replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"')
      .split("\n").map(s=>s.replace(/\s+/g," ").trim()).filter(s=>s.length>70).join("\n");
    cache.set(id,{text,expires:Date.now()+15*60e3});return text;
  }catch{return "";}
}

export async function retrieveFaith(message, topics) {
  const keys=normalize(message).split(/\W+/).filter(w=>w.length>3);
  const ids=[...new Set(topics.map(t=>t.source))].slice(0,2);
  const results=await Promise.all(ids.map(async id=>{
    const text=await sourceText(id);
    const paragraphs=text.split("\n").map(p=>({p,score:keys.reduce((sum,k)=>sum+(normalize(p).includes(k)?1:0),0)}))
      .filter(p=>p.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(p=>p.p).join("\n").slice(0,4500);
    return paragraphs?{id,content:paragraphs,url:FAITH_SOURCES[id][1]}:null;
  }));
  return results.filter(Boolean);
}
