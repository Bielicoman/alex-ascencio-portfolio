import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./mobile.css";
import { MARK_PATH } from "../brand";

const app = document.getElementById("pg");
app.innerHTML = `<header class="mp-top"><a href="/" aria-label="Voltar ao portfólio">← Portfólio</a><svg viewBox="0 0 262 151" width="36" aria-label="Alex Ascencio"><path d="${MARK_PATH}" fill="currentColor"/></svg><span>Touch edition</span></header>
<main class="mp-main"><p class="mp-kicker">PLAYGROUND / ALEX ASCENCIO</p><h1>Seu próximo<br><em>ponto de vista.</em></h1><p class="mp-lead">Toque. Incline. Enquadre.<br>Três experiências feitas para caber na sua mão.</p>
<nav class="mp-tabs" aria-label="Experiências"><button data-mode="foco" aria-pressed="true">01 · Foco</button><button data-mode="memoria" aria-pressed="false">02 · Memória</button><button data-mode="camera" aria-pressed="false">03 · Câmera</button></nav>
<section id="experience" aria-label="Jogo"></section><p class="mp-foot">Uma pausa para experimentar.<br>Imagem, movimento e um pouco de desafio.</p></main>`;
const host = document.getElementById("experience");
let dispose = () => {};
const $ = (s) => host.querySelector(s);
const modes = { foco: focusGame, memoria: memoryGame, camera: cameraGame };
function mount(name) {
  dispose(); host.replaceChildren();
  app.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === name)));
  history.replaceState(null, "", `#${name}`);
  dispose = modes[name]();
}
app.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => mount(b.dataset.mode));
window.addEventListener("pagehide", () => dispose());
mount(modes[location.hash.slice(1)] ? location.hash.slice(1) : "foco");

function focusGame() {
  host.innerHTML = `<div class="mp-heading"><div><span class="mp-kicker">CONTROLE & PRECISÃO</span><h2>Encontre o foco.</h2></div><span class="mp-tag">01 / 03</span></div><p class="mp-description">Leve a luz até os anéis. Mantenha o toque para guiar, ou ative o movimento do celular. Acerte 8 alvos em 30 segundos.</p><div class="mp-score"><span id="points">0 / 8 alvos</span><span id="timer">30.0 s</span></div><canvas class="mp-field" aria-label="Área do jogo de precisão. Arraste o dedo até os anéis." tabindex="0"></canvas><p class="mp-status" role="status">Tudo começa com um toque.</p><div class="mp-actions"><button class="mp-primary" id="start">Começar</button><button id="sensor">Usar giroscópio</button></div>`;
  const canvas = $("canvas"), ctx = canvas.getContext("2d");
  let w=0,h=0,raf=0,active=false,score=0,time=30,last=0,dead=false,mode="touch",base=null,sensorTimer=0;
  const ball={x:.5,y:.5,vx:0,vy:0}, target={x:.25,y:.3}, touch={x:.5,y:.5,on:false}, tilt={x:0,y:0};
  const resize=()=>{const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw();};
  const observer=new ResizeObserver(resize); observer.observe(canvas);
  function draw(){
    ctx.clearRect(0,0,w,h);ctx.fillStyle="#0d0d10";ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="#ffffff09";ctx.lineWidth=1;for(let x=24;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=24;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    const tx=target.x*w,ty=target.y*h;
    ctx.strokeStyle="#ff626d";ctx.lineWidth=2;ctx.beginPath();ctx.arc(tx,ty,24,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#ff626d44";ctx.beginPath();ctx.arc(tx,ty,32,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#ffb0b5";ctx.font="12px 'Geist Mono Variable',monospace";ctx.textAlign="center";ctx.fillText(String(score+1).padStart(2,"0"),tx,ty+4);
    const bx=ball.x*w,by=ball.y*h;const g=ctx.createRadialGradient(bx,by,0,bx,by,32);g.addColorStop(0,"#fff8");g.addColorStop(1,"#fff0");ctx.fillStyle=g;ctx.fillRect(bx-32,by-32,64,64);ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(bx,by,9,0,Math.PI*2);ctx.fill();
  }
  function tick(now){
    if(dead||!active||document.hidden)return;
    const dt=Math.min(.04,(now-last)/1000);last=now;time=Math.max(0,time-dt);
    if(mode==="gyro"){ball.vx=(ball.vx+tilt.x*dt*.8)*.96;ball.vy=(ball.vy+tilt.y*dt*.8)*.96;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;}
    else if(touch.on){ball.x+=(touch.x-ball.x)*Math.min(1,dt*8);ball.y+=(touch.y-ball.y)*Math.min(1,dt*8);}
    ball.x=Math.max(.04,Math.min(.96,ball.x));ball.y=Math.max(.04,Math.min(.96,ball.y));
    if(Math.hypot((ball.x-target.x)*w,(ball.y-target.y)*h)<22){score++;$("#points").textContent=`${score} / 8 alvos`;target.x=.13+Math.random()*.74;target.y=.15+Math.random()*.7;}
    $("#timer").textContent=`${time.toFixed(1)} s`;draw();
    if(time===0||score===8){active=false;$(".mp-status").textContent=score===8?`Foco perfeito. 8 alvos em ${(30-time).toFixed(1)} segundos.`:`Você encontrou ${score} alvos. Tente um movimento mais suave.`;$("#start").textContent="Jogar novamente";return;}
    raf=requestAnimationFrame(tick);
  }
  $("#start").onclick=()=>{cancelAnimationFrame(raf);score=0;time=30;ball.x=.5;ball.y=.5;ball.vx=ball.vy=0;base=null;active=true;touch.on=false;$("#points").textContent="0 / 8 alvos";$(".mp-status").textContent=mode==="gyro"?"Incline suavemente para guiar a luz.":"Arraste para guiar a luz até os anéis.";$("#start").textContent="Recomeçar";last=performance.now();raf=requestAnimationFrame(tick);};
  function pointer(e){const r=canvas.getBoundingClientRect();touch.x=(e.clientX-r.left)/r.width;touch.y=(e.clientY-r.top)/r.height;}
  canvas.onpointerdown=e=>{touch.on=true;pointer(e);canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(touch.on)pointer(e);};canvas.onpointerup=canvas.onpointercancel=()=>touch.on=false;
  canvas.onkeydown=e=>{const dirs={ArrowLeft:[-.08,0],ArrowRight:[.08,0],ArrowUp:[0,-.08],ArrowDown:[0,.08]};if(dirs[e.key]){e.preventDefault();touch.on=true;touch.x=ball.x+dirs[e.key][0];touch.y=ball.y+dirs[e.key][1];}};
  function sensor(e){if(e.gamma==null||e.beta==null)return;clearTimeout(sensorTimer);base||={x:e.gamma,y:e.beta};tilt.x=Math.max(-1,Math.min(1,(e.gamma-base.x)/20));tilt.y=Math.max(-1,Math.min(1,(e.beta-base.y)/20));mode="gyro";$("#sensor").textContent="Usar toque";}
  $("#sensor").onclick=async()=>{
    if(mode==="gyro"){window.removeEventListener("deviceorientation",sensor);mode="touch";$("#sensor").textContent="Usar giroscópio";return;}
    try{if(!isSecureContext||!window.DeviceOrientationEvent)throw Error();if(typeof DeviceOrientationEvent.requestPermission==="function"&&await DeviceOrientationEvent.requestPermission()!=="granted")throw Error();if(dead)return;window.addEventListener("deviceorientation",sensor,{passive:true});$(".mp-status").textContent="Segure confortavelmente e incline o celular.";sensorTimer=setTimeout(()=>{window.removeEventListener("deviceorientation",sensor);if(!dead)$(".mp-status").textContent="Sensor indisponível neste navegador. Você pode jogar com o toque.";},3000);}catch{if(!dead)$(".mp-status").textContent="Movimento não disponível. O jogo continua pelo toque.";}
  };
  const visibility=()=>{cancelAnimationFrame(raf);if(!document.hidden&&active){last=performance.now();raf=requestAnimationFrame(tick);}};document.addEventListener("visibilitychange",visibility);
  return()=>{dead=true;active=false;clearTimeout(sensorTimer);cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener("deviceorientation",sensor);document.removeEventListener("visibilitychange",visibility);};
}

function memoryGame(){
  const symbols=[['01','COR'],['02','LUZ'],['03','SOM'],['04','CENA'],['05','CORTE'],['06','RITMO']];
  let timers=[],dead=false,first=null,locked=false,moves=0,pairs=0;
  host.innerHTML=`<div class="mp-heading"><div><span class="mp-kicker">OLHAR & MEMÓRIA</span><h2>Monte os pares.</h2></div><span class="mp-tag">02 / 03</span></div><p class="mp-description">Encontre os seis elementos de um filme. Memorize as posições e tente fechar a montagem com menos movimentos.</p><div class="mp-score"><span id="pairs">0 / 6 pares</span><span id="moves">0 movimentos</span></div><div class="mp-memory"></div><p class="mp-status" role="status">Toque em duas cartas para revelar.</p><button class="mp-primary" id="restart">Nova montagem</button>`;
  function start(){timers.forEach(clearTimeout);timers=[];first=null;locked=false;moves=0;pairs=0;$("#pairs").textContent="0 / 6 pares";$("#moves").textContent="0 movimentos";$(".mp-status").textContent="Toque em duas cartas para revelar.";const cards=[...symbols,...symbols];for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}$(".mp-memory").replaceChildren();cards.forEach(([id,label],index)=>{const b=document.createElement("button");b.className="mp-memory-card";b.setAttribute("aria-label",`Revelar carta ${index+1}`);b.innerHTML=`<span class="mp-back" aria-hidden="true">AA<span>FRAME ${String(index+1).padStart(2,'0')}</span></span><span class="mp-front" aria-hidden="true"><i>${id}</i><b>${label}</b></span>`;b.onclick=()=>{if(locked||b.disabled||b===first?.button)return;b.classList.add("revealed");b.setAttribute("aria-label",label);if(!first){first={button:b,id};return;}moves++;$("#moves").textContent=`${moves} movimentos`;const a=first.button;if(first.id===id){pairs++;a.disabled=b.disabled=true;a.classList.add("matched");b.classList.add("matched");first=null;$("#pairs").textContent=`${pairs} / 6 pares`;if(pairs===6)$(".mp-status").textContent=`Montagem concluída em ${moves} movimentos. ${moves<=9?'Um olhar afiado.':'Cada revisão treina o olhar.'}`;}else{locked=true;timers.push(setTimeout(()=>{if(dead)return;a.classList.remove("revealed");b.classList.remove("revealed");a.setAttribute("aria-label","Revelar carta");b.setAttribute("aria-label",`Revelar carta ${index+1}`);first=null;locked=false;},850));}};$(".mp-memory").append(b);});}
  $("#restart").onclick=start;start();return()=>{dead=true;timers.forEach(clearTimeout);};
}

function cameraGame(){
  let stream=null,dead=false,url=null,challenge=0;
  const prompts=["Posicione o assunto no encontro das linhas à esquerda.","Encontre uma moldura natural: uma porta, janela ou arco.","Procure linhas que conduzam o olhar até o assunto."];
  host.innerHTML=`<div class="mp-heading"><div><span class="mp-kicker">COMPOSIÇÃO & CÂMERA</span><h2>Seu olhar, em cena.</h2></div><span class="mp-tag">03 / 03</span></div><p class="mp-description">Um exercício de composição com câmera e guia de terços. As imagens ficam no seu aparelho, sem envio ao site.</p><div class="mp-viewfinder"><video muted playsinline autoplay></video><div class="mp-thirds" aria-hidden="true"></div><span class="mp-view-label">ENQUADRAMENTO / 16:9</span></div><p class="mp-status" role="status">${prompts[0]}</p><div class="mp-actions"><button class="mp-primary" id="camera">Ativar câmera</button><button id="challenge">Próximo desafio</button><button id="capture" disabled>Capturar quadro</button><button id="stop" hidden>Desligar câmera</button></div><div class="mp-capture" hidden><img alt="Seu enquadramento capturado"/><a download="meu-enquadramento.jpg">Salvar no aparelho ↓</a></div>`;
  function stop(){stream?.getTracks().forEach(t=>t.stop());stream=null;$("video").srcObject=null;$("#capture").disabled=true;$("#camera").disabled=false;$("#camera").textContent="Ativar câmera";$("#stop").hidden=true;}
  $("#challenge").onclick=()=>{$(".mp-status").textContent=prompts[++challenge%prompts.length];};
  $("#stop").onclick=stop;
  $("#camera").onclick=async()=>{
    $("#camera").disabled=true;$(".mp-status").textContent="Aguardando sua permissão para a câmera…";
    try{if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('secure');const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}},audio:false});if(dead){media.getTracks().forEach(t=>t.stop());return;}stream=media;$("video").srcObject=media;await $("video").play();if(dead)return;$("#capture").disabled=false;$("#stop").hidden=false;$("#camera").textContent="Câmera ligada";$(".mp-status").textContent=prompts[challenge%prompts.length];}catch(e){if(dead)return;stop();$(".mp-status").textContent=e.name==="NotAllowedError"?"A câmera não foi autorizada. Você pode permitir o acesso no navegador e tentar novamente.":"Câmera indisponível. No celular, este recurso precisa de uma conexão HTTPS segura.";}
  };
  $("#capture").onclick=()=>{const v=$("video");if(!v.videoWidth)return;const c=document.createElement("canvas");c.width=v.videoWidth;c.height=Math.round(c.width*9/16);const ctx=c.getContext("2d"),sh=Math.min(v.videoHeight,c.height),sw=sh*16/9;ctx.drawImage(v,(v.videoWidth-sw)/2,(v.videoHeight-sh)/2,sw,sh,0,0,c.width,c.height);c.toBlob(blob=>{if(dead||!blob)return;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);$(".mp-capture img").src=url;$(".mp-capture a").href=url;$(".mp-capture").hidden=false;$(".mp-status").textContent="Quadro capturado. Você decide se quer salvá-lo.";},"image/jpeg",.92);};
  const visibility=()=>{if(document.hidden)stop();};document.addEventListener("visibilitychange",visibility);
  return()=>{dead=true;stream?.getTracks().forEach(t=>t.stop());if(url)URL.revokeObjectURL(url);document.removeEventListener("visibilitychange",visibility);};
}
