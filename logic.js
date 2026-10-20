// O terminal interpreta apenas atribuições numéricas destes três parâmetros.
// Não executa eval, Function, scripts, rede ou instruções arbitrárias.
export const DEFAULT_CONFIG=Object.freeze({velocidade:5,forcaDoPulo:8,quantidadeDeObstaculos:6});
export const LIMITS=Object.freeze({velocidade:[3,12],forcaDoPulo:[6,20],quantidadeDeObstaculos:[0,10]});
export const DEFAULT_CODE=`// Ajuste o robô para escapar.
const velocidade = 5;
const forcaDoPulo = 8;
const quantidadeDeObstaculos = 6;

// Mude os números e execute. `;
export function formatCode(config){return `// Esta é a sua versão do robô.\nconst velocidade = ${config.velocidade};\nconst forcaDoPulo = ${config.forcaDoPulo};\nconst quantidadeDeObstaculos = ${config.quantidadeDeObstaculos};\n\n// Mude os números e execute. `;}
export function parseCode(source){
 if(typeof source!=='string'||source.length>5000)return {ok:false,line:1,error:'O terminal aceita até 5.000 caracteres. Mantenha as três instruções do robô.'};
 const values={},lines=source.split('\n');
 for(let i=0;i<lines.length;i++){
  const line=lines[i].split('//')[0].trim();if(!line)continue;
  const match=/^(?:(?:const|let)\s+)?([A-Za-z_]\w*)\s*=\s*(-?(?:\d+(?:\.\d+)?|\.\d+))\s*;?\s*$/.exec(line);
  if(!match)return {ok:false,line:i+1,error:`Linha ${i+1}: use uma atribuição como const velocidade = 8; com um número por instrução.`};
  const [,name,literal]=match;
  if(!Object.hasOwn(LIMITS,name))return {ok:false,line:i+1,error:`Linha ${i+1}: variável “${name}” não reconhecida. Use velocidade, forcaDoPulo ou quantidadeDeObstaculos.`};
  if(Object.hasOwn(values,name))return {ok:false,line:i+1,error:`Linha ${i+1}: “${name}” aparece duas vezes. Mantenha uma atribuição por variável.`};
  const value=Number(literal),[min,max]=LIMITS[name];
  if(!Number.isFinite(value)||value<min||value>max)return {ok:false,line:i+1,error:`Linha ${i+1}: ${name} precisa ficar entre ${min} e ${max}.`};
  if(name==='quantidadeDeObstaculos'&&!Number.isInteger(value))return {ok:false,line:i+1,error:`Linha ${i+1}: a quantidade de obstáculos precisa ser um número inteiro.`};
  values[name]=value;
 }
 const missing=Object.keys(LIMITS).filter(k=>!Object.hasOwn(values,k));
 if(missing.length)return {ok:false,line:Math.max(1,lines.length),error:`Falta definir: ${missing.join(', ')}. Nenhuma alteração foi aplicada.`};
 return {ok:true,config:values};
}
export const VIEW_W=1120,VIEW_H=640,FLOOR=530,WORLD_W=1560;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const MISSIONS=[
 {title:'Um salto além do padrão.',description:'O robô não alcança a plataforma. Altere a força do pulo e ative o núcleo no alto.',room:'SALA 01 · PROPULSÃO',hint:'A força inicial é 8. Experimente um valor entre 14 e 16 e pule perto da plataforma.',variable:'forcaDoPulo'},
 {title:'Uma corrida contra o relógio.',description:'Pise no sensor e atravesse a porta antes que ela feche. Ajuste a velocidade.',room:'SALA 02 · ACELERAÇÃO',hint:'A porta fica aberta por 1,85 segundo. Experimente velocidade 8 ou 9 e reinicie o trecho.',variable:'velocidade'},
 {title:'O percurso também é seu.',description:'Reduza as barreiras para no máximo 3. Desvie dos feixes e alcance o portal de saída.',room:'SALA 03 · CONTROLE DO PERCURSO',hint:'Defina quantidadeDeObstaculos entre 0 e 3. Execute e pule sobre as barreiras que restarem.',variable:'quantidadeDeObstaculos'}
];
export class Laboratory{
 constructor(config=DEFAULT_CONFIG){this.config={...config};this.stage=1;this.time=0;this.retries=0;this.edits=0;this.events=[];this.particles=[];this.won=false;this.transition=0;this.camera=0;this.gate=0;this.gateTriggered=false;this.gateFailed=false;this.plateInside=false;this.player=this.newPlayer();this.walkPhase=0;this.lastJump=false;this.jumpBuffer=0;this.coyote=0;this.shake=0;this.invincible=0;}
 newPlayer(){return {x:110,y:FLOOR-84,w:42,h:84,vx:0,vy:0,grounded:true,facing:1,land:0};}
 get solids(){const out=[{x:-100,y:FLOOR,w:WORLD_W+200,h:200}];if(this.stage===1)out.push({x:560,y:360,w:260,h:170});if(this.stage===2&&this.gate<=0)out.push({x:990,y:135,w:42,h:FLOOR-135});return out;}
 get hazards(){if(this.stage!==3)return [];const n=this.config.quantidadeDeObstaculos;return Array.from({length:n},(_,i)=>({x:320+i*(980/Math.max(1,n-1)),y:FLOOR-(i%3===1?58:40),w:30,h:i%3===1?58:40}));}
 burst(x,y,color='#7ae5e1',count=20){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*150;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-50,life:.4+Math.random()*.55,color});}}
 apply(config){
  const changed=Object.keys(DEFAULT_CONFIG).filter(k=>this.config[k]!==config[k]);
  this.config={...config};if(changed.length)this.edits++;
  // Recomeça desafios cronometrados e barreiras novas em um estado coerente.
  if((this.stage===2&&changed.includes('velocidade'))||(this.stage===3&&changed.includes('quantidadeDeObstaculos')))this.restart(false);
  this.burst(this.player.x+18,this.player.y+30,'#bcf46a',30);return changed;
 }
 restart(count=true){if(count)this.retries++;this.player=this.newPlayer();this.gate=0;this.gateTriggered=false;this.gateFailed=false;this.plateInside=false;this.jumpBuffer=0;this.coyote=.12;this.lastJump=false;this.camera=0;this.invincible=.6;}
 advance(){
  this.burst(this.player.x+18,this.player.y+30,'#bcf46a',45);this.stage++;this.transition=1.6;this.restart(false);this.events.push({type:'stage',stage:this.stage});
 }
 step(dt,input={}){
  this.events=[];if(this.won)return;
  this.time+=dt;this.transition=Math.max(0,this.transition-dt);this.invincible=Math.max(0,this.invincible-dt);this.shake=Math.max(0,this.shake-dt);
  for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
  const p=this.player,move=Number(!!input.right)-Number(!!input.left),speed=this.config.velocidade*60;
  const acceleration=move?4200:6000;p.vx+=clamp(move*speed-p.vx,-acceleration*dt,acceleration*dt);if(move)p.facing=move;
  if(input.jump&&!this.lastJump)this.jumpBuffer=.13;else this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);this.lastJump=!!input.jump;
  this.coyote=p.grounded?.1:Math.max(0,this.coyote-dt);p.land=Math.max(0,p.land-dt);
  if(this.jumpBuffer>0&&this.coyote>0){p.vy=-this.config.forcaDoPulo*60;p.grounded=false;this.coyote=0;this.jumpBuffer=0;this.burst(p.x+18,p.y+p.h,'#7ae5e1',12);this.events.push({type:'jump'});}
  // Gravidade em unidades por segundo, com passo fixo.
  p.vy=Math.min(1100,p.vy+1800*dt);
  if(this.stage===2){
   const previous=this.gate;this.gate=Math.max(0,this.gate-dt);
   if(previous>0&&this.gate===0){if(overlaps(p,{x:990,y:135,w:42,h:FLOOR-135})){p.x=990-p.w-.1;p.vx=0;}this.gateFailed=true;this.events.push({type:'gateClosed'});}
  }
  p.x+=p.vx*dt;
  for(const r of this.solids)if(overlaps(p,r)){if(p.vx>0)p.x=r.x-p.w;else if(p.vx<0)p.x=r.x+r.w;p.vx=0;}
  p.x=clamp(p.x,10,WORLD_W-p.w-10);
  const previousFeet=p.y+p.h,wasGrounded=p.grounded;p.y+=p.vy*dt;p.grounded=false;
  for(const r of this.solids)if(overlaps(p,r)){
   if(p.vy>=0&&previousFeet<=r.y+2){p.y=r.y-p.h;p.vy=0;p.grounded=true;}
   else if(p.vy<0){p.y=r.y+r.h;p.vy=0;}
  }
  if(p.grounded&&!wasGrounded){p.land=.15;this.burst(p.x+18,p.y+p.h,'#a3ccd2',8);this.events.push({type:'land'});}
  if(p.grounded)this.walkPhase+=Math.abs(p.vx)*dt*.032;
  if(this.stage===1&&p.grounded&&Math.abs(p.y+p.h-360)<2&&p.x>650&&p.x<780){this.advance();return;}
  if(this.stage===2){
   const inside=p.x+p.w>302&&p.x<346&&p.grounded;
   if(inside&&!this.plateInside&&this.gate===0){this.gate=1.85;this.gateTriggered=true;this.gateFailed=false;this.events.push({type:'gateOpen'});}
   this.plateInside=inside;
   if(p.x>1050&&this.gateTriggered){this.advance();return;}
  }
  if(this.stage===3){
   const hit=this.hazards.find(h=>overlaps(p,h));
   if(hit&&this.invincible===0){this.burst(p.x+18,p.y+25,'#ff8c95',35);this.restart();this.shake=.22;this.events.push({type:'hit'});return;}
   if(p.x>1410){
    if(this.config.quantidadeDeObstaculos<=3){this.won=true;this.events.push({type:'win'});this.burst(1450,390,'#bcf46a',100);}
    else if(!this.portalWarning){this.portalWarning=true;this.events.push({type:'portalLocked'});}
   }else this.portalWarning=false;
  }
  if(p.y>VIEW_H+100){this.restart();this.events.push({type:'hit'});}
  this.camera+=(clamp(p.x-420,0,WORLD_W-VIEW_W)-this.camera)*(1-Math.exp(-dt*8));
 }
}
