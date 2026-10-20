// O terminal interpreta apenas atribuições numéricas destes três parâmetros.
// Não executa eval, Function, scripts, rede ou instruções arbitrárias.
export const DEFAULT_CONFIG=Object.freeze({velocidade:5,forcaDoPulo:8,quantidadeDeObstaculos:6});
export const LIMITS=Object.freeze({velocidade:[0,Infinity],forcaDoPulo:[1,30],quantidadeDeObstaculos:[0,12]});
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
  const match=/^(?:(?:const|let)\s+)?([A-Za-z_]\w*)\s*=\s*(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)\s*;?\s*$/.exec(line);
  if(!match)return {ok:false,line:i+1,error:`Linha ${i+1}: use uma atribuição como const velocidade = 8; com um número por instrução.`};
  const [,name,literal]=match;
  if(!Object.hasOwn(LIMITS,name))return {ok:false,line:i+1,error:`Linha ${i+1}: variável “${name}” não reconhecida. Use velocidade, forcaDoPulo ou quantidadeDeObstaculos.`};
  if(Object.hasOwn(values,name))return {ok:false,line:i+1,error:`Linha ${i+1}: “${name}” aparece duas vezes. Mantenha uma atribuição por variável.`};
  const value=Number(literal),[min,max]=LIMITS[name];
  if(!Number.isFinite(value)||!Number.isFinite(value*60)||value<min||value>max)return {ok:false,line:i+1,error:name==='velocidade'?`Linha ${i+1}: velocidade deve ser zero ou maior e representável como número.`:`Linha ${i+1}: ${name} precisa ficar entre ${min} e ${max}.`};
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
 {title:'Um salto além do padrão.',description:'O robô precisa tocar o núcleo no alto. A força inicial do salto não alcança a plataforma.',room:'SALA 01 · PROPULSÃO',hint:'No bloco PULO, troque 8 por 14. Aplique, aproxime-se da plataforma e pressione Espaço.',variables:['forcaDoPulo'],action:'Aumente o número no bloco PULO.',test:'Aplique os blocos, ande até a plataforma e pule para alcançar o núcleo.'},
 {title:'Uma corrida contra o relógio.',description:'O piso laranja abre a porta por 1,85 segundo. O robô precisa correr mais rápido para atravessar.',room:'SALA 02 · ACELERAÇÃO',hint:'No bloco VELOCIDADE, experimente 8 ou 9. Aplique e corra para a direita, passando pelo sensor laranja.',variables:['velocidade'],action:'Aumente o número no bloco VELOCIDADE.',test:'Aplique e corra sobre o sensor laranja até passar pela porta.'},
 {title:'O percurso também é seu.',description:'O portal de transferência só libera com até 3 barreiras. Você decide quantas permanecem no percurso.',room:'SALA 03 · PERCURSO',hint:'No bloco BARREIRAS, use 3 ou menos. Aplique e salte sobre os feixes até o portal. Zero também é permitido.',variables:['quantidadeDeObstaculos'],action:'Diminua o número no bloco BARREIRAS para 3 ou menos.',test:'Aplique, desvie dos feixes e alcance o portal à direita.'},
 {title:'Altura e distância, juntas.',description:'Há um vão no piso e a outra margem é mais alta. Correr sozinho ou pular baixo não resolve.',room:'SALA 04 · SALTO DE PRECISÃO',hint:'Combine VELOCIDADE 10 com PULO 17. Pule pouco antes do vão e pouse na plataforma elevada. Toque o núcleo.',variables:['velocidade','forcaDoPulo'],action:'Combine os blocos VELOCIDADE e PULO.',test:'Aplique, salte antes do vão e alcance o núcleo na plataforma da outra margem.'},
 {title:'Menos barreiras. Mais velocidade.',description:'A porta abre por apenas 1,30 segundo e exige até 2 barreiras. Prepare o percurso e atravesse a tempo.',room:'SALA 05 · ROTA EXPRESSA',hint:'Experimente VELOCIDADE 12, PULO 17 e BARREIRAS 2 (ou 0). O sensor abre a porta por 1,30 segundo. Pule os feixes após ativá-lo.',variables:['velocidade','quantidadeDeObstaculos'],action:'Aumente VELOCIDADE e reduza BARREIRAS para até 2.',test:'Aplique, pise no sensor e atravesse a rota; use o pulo para superar os feixes.'},
 {title:'O reator exige tudo de você.',description:'Alcance o núcleo mais alto, deixe no máximo 1 barreira e vença a última porta. Combine os três blocos.',room:'SALA 06 · REATOR CENTRAL',hint:'Uma combinação possível: VELOCIDADE 18, PULO 20 e BARREIRAS 1. Toque o núcleo no alto; depois do checkpoint, corra pelo sensor e pule o último feixe.',variables:['velocidade','forcaDoPulo','quantidadeDeObstaculos'],action:'Ajuste VELOCIDADE, PULO e BARREIRAS em conjunto.',test:'Aplique, toque o núcleo no alto e atravesse a porta final. Há um checkpoint depois do núcleo.'}
];
export const LEVELS=[
 {platform:{x:560,y:360,w:260,h:170},core:{x:705,y:318}},
 {gateX:990,plateX:302,gateDuration:1.85,exitX:1050},
 {hazardStart:320,hazardEnd:1300,maxBarriers:3,portal:true},
 {platform:{x:780,y:300,w:330,h:230},gap:[430,780],core:{x:945,y:258}},
 {gateX:990,plateX:302,gateDuration:1.3,maxBarriers:2,hazardStart:500,hazardEnd:800,exitX:1050},
 {platform:{x:560,y:220,w:260,h:310},core:{x:705,y:178},gateX:1320,plateX:900,gateDuration:.55,maxBarriers:1,hazardStart:1080,hazardEnd:1200,portal:true,exitX:1405}
];
// Segmento contra AABB expandida: feixes não são ignorados em velocidades altas.
export function sweptTouches(a,b,r){
 const bounds={left:r.x-a.w+.001,right:r.x+r.w-.001,top:r.y-a.h+.001,bottom:r.y+r.h-.001};
 let enter=0,exit=1;
 for(const [axis,min,max] of [['x','left','right'],['y','top','bottom']]){
  const d=b[axis]-a[axis];
  if(Math.abs(d)<1e-12){if(a[axis]<bounds[min]||a[axis]>bounds[max])return false;}
  else{let t1=(bounds[min]-a[axis])/d,t2=(bounds[max]-a[axis])/d;if(t1>t2)[t1,t2]=[t2,t1];enter=Math.max(enter,t1);exit=Math.min(exit,t2);if(enter>exit)return false;}
 }
 return enter<=1&&exit>=0;
}
export class Laboratory{
 constructor(config=DEFAULT_CONFIG){this.config={...config};this.stage=1;this.time=0;this.retries=0;this.edits=0;this.events=[];this.particles=[];this.won=false;this.transition=0;this.camera=0;this.gate=0;this.gateTriggered=false;this.gateFailed=false;this.plateInside=false;this.reactorCharged=false;this.player=this.newPlayer();this.walkPhase=0;this.lastJump=false;this.jumpBuffer=0;this.coyote=0;this.shake=0;this.invincible=0;}
 get level(){return LEVELS[this.stage-1];}
 get gateAllowed(){return (this.level.maxBarriers===undefined||this.config.quantidadeDeObstaculos<=this.level.maxBarriers)&&(this.stage!==6||this.reactorCharged);}
 newPlayer(){return {x:this.stage===6&&this.reactorCharged?850:110,y:FLOOR-84,w:42,h:84,vx:0,vy:0,grounded:true,facing:1,land:0};}
 get solids(){
  const l=this.level,out=[{x:-100,y:-200,w:WORLD_W+200,h:260}];
  if(l.gap){out.push({x:-100,y:FLOOR,w:l.gap[0]+100,h:250},{x:l.gap[1],y:FLOOR,w:WORLD_W-l.gap[1]+100,h:250});}
  else out.push({x:-100,y:FLOOR,w:WORLD_W+200,h:250});
  if(l.platform)out.push(l.platform);
  if(l.gateX&&this.gate<=0)out.push({x:l.gateX,y:60,w:42,h:FLOOR-60});return out;
 }
 get hazards(){
  const l=this.level;if(l.hazardStart===undefined)return [];const n=this.config.quantidadeDeObstaculos;
  return Array.from({length:n},(_,i)=>({x:l.hazardStart+i*((l.hazardEnd-l.hazardStart)/Math.max(1,n-1)),y:FLOOR-(i%3===1?58:40),w:30,h:i%3===1?58:40}));
 }
 burst(x,y,color='#7ae5e1',count=20){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*150;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-50,life:.4+Math.random()*.55,color});}}
 apply(config){
  const changed=Object.keys(DEFAULT_CONFIG).filter(k=>this.config[k]!==config[k]);this.config={...config};if(changed.length)this.edits++;
  if(changed.length&&this.stage>=2)this.restart(false);
  this.burst(this.player.x+18,this.player.y+30,'#bcf46a',30);return changed;
 }
 restart(count=true){if(count)this.retries++;this.player=this.newPlayer();this.gate=0;this.gateTriggered=false;this.gateFailed=false;this.plateInside=false;this.sensorWarning=false;this.portalWarning=false;this.jumpBuffer=0;this.coyote=.12;this.lastJump=false;this.camera=0;this.invincible=.25;}
 advance(){this.burst(this.player.x+18,this.player.y+30,'#bcf46a',45);this.stage++;this.transition=1.6;this.reactorCharged=false;this.restart(false);this.events.push({type:'stage',stage:this.stage});}
 step(dt,input={}){
  this.events=[];if(this.won)return;
  this.time+=dt;this.transition=Math.max(0,this.transition-dt);this.invincible=Math.max(0,this.invincible-dt);this.shake=Math.max(0,this.shake-dt);
  for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
  const p=this.player,l=this.level,before={x:p.x,y:p.y,w:p.w,h:p.h},move=Number(!!input.right)-Number(!!input.left),speed=this.config.velocidade*60;
  const acceleration=move?4200:6000;p.vx+=clamp(move*speed-p.vx,-acceleration*dt,acceleration*dt);if(move)p.facing=move;
  if(input.jump&&!this.lastJump)this.jumpBuffer=.13;else this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);this.lastJump=!!input.jump;
  this.coyote=p.grounded ? .1 : Math.max(0,this.coyote-dt);p.land=Math.max(0,p.land-dt);
  if(this.jumpBuffer>0&&this.coyote>0){p.vy=-this.config.forcaDoPulo*60;p.grounded=false;this.coyote=0;this.jumpBuffer=0;this.burst(p.x+18,p.y+p.h,'#7ae5e1',12);this.events.push({type:'jump'});}
  p.vy=Math.min(1100,p.vy+1800*dt);
  if(l.gateX){const previous=this.gate;this.gate=Math.max(0,this.gate-dt);if(previous>0&&this.gate===0){if(overlaps(p,{x:l.gateX,y:60,w:42,h:FLOOR-60})){p.x=l.gateX-p.w-.1;p.vx=0;}if(p.x<l.gateX+42){this.gateFailed=true;this.events.push({type:'gateClosed'});}}}
  const oldX=p.x;let nextX=p.x+p.vx*dt;
  for(const r of this.solids){if(p.y<r.y+r.h&&p.y+p.h>r.y){if(p.vx>0&&oldX+p.w<=r.x+.001&&nextX+p.w>r.x)nextX=Math.min(nextX,r.x-p.w);if(p.vx<0&&oldX>=r.x+r.w-.001&&nextX<r.x+r.w)nextX=Math.max(nextX,r.x+r.w);}}
  if(Math.abs(nextX-(p.x+p.vx*dt))>.001)p.vx=0;p.x=clamp(nextX,10,WORLD_W-p.w-10);
  const oldY=p.y,previousFeet=p.y+p.h,wasGrounded=p.grounded;let nextY=p.y+p.vy*dt;p.grounded=false;
  for(const r of this.solids){if(p.x<r.x+r.w&&p.x+p.w>r.x){if(p.vy>=0&&previousFeet<=r.y+.001&&nextY+p.h>r.y){nextY=Math.min(nextY,r.y-p.h);p.grounded=true;}else if(p.vy<0&&oldY>=r.y+r.h-.001&&nextY<r.y+r.h)nextY=Math.max(nextY,r.y+r.h);}}
  if(Math.abs(nextY-(p.y+p.vy*dt))>.001)p.vy=0;p.y=nextY;
  if(p.grounded&&!wasGrounded){p.land=.15;this.burst(p.x+18,p.y+p.h,'#a3ccd2',8);this.events.push({type:'land'});}
  if(p.grounded)this.walkPhase+=Math.abs(p.vx)*dt*.032;
  if(this.stage===1&&p.grounded&&Math.abs(p.y+p.h-360)<2&&p.x>650&&p.x<780){this.advance();return;}
  if(this.stage===4&&p.grounded&&Math.abs(p.y+p.h-300)<2&&p.x>900&&p.x<1090){this.advance();return;}
  if(this.stage===6&&!this.reactorCharged&&overlaps(p,{x:660,y:132,w:90,h:100})){
   this.reactorCharged=true;this.burst(705,178,'#bcf46a',50);this.restart(false);this.lastJump=!!input.jump;this.events.push({type:'reactor'});return;
  }
  if(l.gateX){
   const inside=p.x+p.w>l.plateX&&p.x<l.plateX+44&&p.grounded;
   const crossed=p.grounded&&Math.min(before.x,p.x)<l.plateX+44&&Math.max(before.x+before.w,p.x+p.w)>l.plateX;
   if((inside||crossed)&&!this.plateInside&&this.gate===0){if(this.gateAllowed){this.gate=l.gateDuration;this.gateTriggered=true;this.gateFailed=false;this.events.push({type:'gateOpen'});}else if(!this.sensorWarning){this.sensorWarning=true;this.events.push({type:'sensorLocked'});}}
   this.plateInside=inside;
  }
  const hit=this.hazards.find(h=>sweptTouches(before,p,h));
  if(hit&&this.invincible===0){this.burst(p.x+18,p.y+25,'#ff8c95',35);this.restart();this.shake=.22;this.events.push({type:'hit'});return;}
  if((this.stage===2||this.stage===5)&&p.x>l.exitX&&this.gateTriggered){this.advance();return;}
  if(this.stage===3&&p.x>1410){if(this.config.quantidadeDeObstaculos<=3){this.advance();return;}else if(!this.portalWarning){this.portalWarning=true;this.events.push({type:'portalLocked'});}}
  if(this.stage===6&&p.x>l.exitX&&this.reactorCharged&&this.gateTriggered&&this.gateAllowed){this.won=true;this.events.push({type:'win'});this.burst(1450,390,'#bcf46a',100);}
  if(p.y>VIEW_H+100){this.restart();this.events.push({type:'fall'});}
  this.camera+=(clamp(p.x-420,0,WORLD_W-VIEW_W)-this.camera)*(1-Math.exp(-dt*8));
 }
}
