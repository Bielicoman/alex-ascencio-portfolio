import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

// Vite serves the same handlers as production, with secrets restricted to Node.
export function localApi() {
  return { name:"local-portfolio-api", configureServer(server) {
    const env=loadEnv(server.config.mode,process.cwd(),"");
    for(const name of ["GROQ_API_KEY","EDTH_MODEL","RESEND_API_KEY","ELEVENLABS_API_KEY","ELEVENLABS_VOICE_ID","ELEVENLABS_MODEL","GOOGLE_TTS_API_KEY","GOOGLE_TTS_VOICE","EDGE_TTS_VOICE"]) if(env[name] && env[name] !== "[SENSITIVE]" && !process.env[name])process.env[name]=env[name];
    server.middlewares.use("/api",async(req,res,next)=>{
      const path=req.url.split("?")[0];
      const files={"/edth":"../api/edth.js","/tts":"../api/tts.js","/contact":"../api/contact.js"};
      if(!files[path])return next();
      try {
        let raw="";for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>24000){res.statusCode=413;res.end('{"error":"request too large"}');return;}}
        req.body=raw?JSON.parse(raw):{};req.query=Object.fromEntries(new URL(req.url,"http://localhost").searchParams);
        res.send=data=>{res.end(data);return res;};
        res.status=code=>{res.statusCode=code;return res;};res.json=data=>{res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify(data));return res;};
        const {default:handler}=await server.ssrLoadModule(fileURLToPath(new URL(files[path],import.meta.url)));
        await handler(req,res);
      }catch(error){res.statusCode=error instanceof SyntaxError?400:500;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({error:"Não foi possível processar a solicitação."}));console.error("[local-api]",error.message);}
    });
  }};
}
