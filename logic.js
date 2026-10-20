// O terminal interpreta atribuições numéricas e a habilidade opcional arma.
// Não executa eval, Function, scripts, rede ou instruções arbitrárias.
export const DEFAULT_CONFIG=Object.freeze({velocidade:5,forcaDoPulo:8,quantidadeDeObstaculos:6,arma:0});
export const LIMITS=Object.freeze({velocidade:[0,Infinity],forcaDoPulo:[1,30],quantidadeDeObstaculos:[0,12],arma:[0,3]});
export const DEFAULT_CODE=`// Ajuste o robô para escapar.
const velocidade = 5;
const forcaDoPulo = 8;
const quantidadeDeObstaculos = 6;

// Edite os números e clique em Executar. `;
export function formatCode(config){return `// Esta é a sua versão do robô.\nconst arma = ${config.arma||0};\nconst velocidade = ${config.velocidade};\nconst forcaDoPulo = ${config.forcaDoPulo};\nconst quantidadeDeObstaculos = ${config.quantidadeDeObstaculos};\n\n// Edite os números e clique em Executar. `;}
export function parseCode(source){
 if(typeof source!=='string'||source.length>5000)return {ok:false,line:1,error:'O terminal aceita até 5.000 caracteres. Mantenha as três instruções do robô.'};
 const values={},lines=source.split('\n');
 for(let i=0;i<lines.length;i++){
  const line=lines[i].split('//')[0].trim();if(!line)continue;
  const match=/^(?:(?:const|let)\s+)?([A-Za-z_]\w*)\s*=\s*(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)\s*;?\s*$/.exec(line);
  if(!match)return {ok:false,line:i+1,error:`Linha ${i+1}: use uma atribuição como const velocidade = 8; com um número por instrução.`};
  const [,name,literal]=match;
  if(!Object.hasOwn(LIMITS,name))return {ok:false,line:i+1,error:`Linha ${i+1}: variável “${name}” não reconhecida. Use velocidade, forcaDoPulo, quantidadeDeObstaculos ou arma.`};
  if(Object.hasOwn(values,name))return {ok:false,line:i+1,error:`Linha ${i+1}: “${name}” aparece duas vezes. Mantenha uma atribuição por variável.`};
  const value=Number(literal),[min,max]=LIMITS[name];
  if(!Number.isFinite(value)||!Number.isFinite(value*60)||value<min||value>max)return {ok:false,line:i+1,error:name==='velocidade'?`Linha ${i+1}: velocidade deve ser zero ou maior e representável como número.`:`Linha ${i+1}: ${name} precisa ficar entre ${min} e ${max}.`};
  if(['quantidadeDeObstaculos','arma'].includes(name)&&!Number.isInteger(value))return {ok:false,line:i+1,error:`Linha ${i+1}: ${name} precisa ser um número inteiro.`};
  values[name]=value;
 }
 const missing=['velocidade','forcaDoPulo','quantidadeDeObstaculos'].filter(k=>!Object.hasOwn(values,k));
 if(missing.length)return {ok:false,line:Math.max(1,lines.length),error:`Falta definir: ${missing.join(', ')}. Nenhuma alteração foi aplicada.`};
 return {ok:true,config:{arma:0,...values}};
}
export const VIEW_W=1120,VIEW_H=640,FLOOR=530,WORLD_W=1560;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const MISSIONS=[
 {title:'Reative a propulsão.',description:'O núcleo está fora de alcance. Descubra como uma variável muda o salto do robô.',room:'01 · OFICINA DE PROPULSÃO',action:'No código, altere forcaDoPulo de 8 para 14.',test:'Execute, aproxime-se da plataforma e salte com Espaço.',hint:'Use const forcaDoPulo = 14; e salte sobre a plataforma para tocar o núcleo.'},
 {title:'Escreva uma nova habilidade.',description:'Drones bloquearam o corredor. Seu robô ainda não tem arma: você vai programar essa habilidade.',room:'02 · CORREDOR DE SEGURANÇA',action:'Adicione uma nova linha: const arma = 1;',test:'Execute. Segure J para atirar, elimine os drones e alcance a saída.',hint:'Digite const arma = 1; em uma nova linha. J ou X dispara na direção em que o robô olha. Pule sobre as caixas para ter linha de tiro.'},
 {title:'Desmonte a rede de defesa.',description:'Lasers, patrulhas e uma torre protegem a transferência. Modifique o cenário e abra caminho.',room:'03 · CENTRAL DE DEFESA',action:'Reduza quantidadeDeObstaculos para 3 ou menos e mantenha a arma.',test:'Destrua os três defensores. Use as caixas como cobertura e alcance o portal.',hint:'Barreiras 0, pulo 14 e arma 2 facilitam o trecho. A torre mira antes de atirar: mova-se quando aparecer a linha vermelha.'},
 {title:'Uma ponte sob ataque.',description:'O vão exige velocidade e altura. Uma sentinela vigia a outra margem: aterrisse e enfrente-a.',room:'04 · PONTE DE CONTENÇÃO',action:'Combine velocidade = 10 e forcaDoPulo = 17.',test:'Pule antes do vão, destrua a sentinela na plataforma e toque o núcleo.',hint:'Pule perto da borda com velocidade 10 e pulo 17. Na plataforma, fique à esquerda da sentinela e segure J.'},
 {title:'Combata. Depois, acelere.',description:'Limpe o primeiro setor para salvar um checkpoint. Depois vença os lasers e uma porta temporizada.',room:'05 · PROTOCOLO DE FUGA',action:'Combine arma, velocidade 12 e até 2 barreiras.',test:'Elimine as patrulhas. No segundo setor, pise no sensor e corra até a porta.',hint:'Use arma 2 ou 3. Após eliminar os dois drones, o checkpoint fica salvo. Use velocidade 12, pulo 17 e barreiras 0 para a corrida.'},
 {title:'O guardião do reator.',description:'Carregue o núcleo no alto para romper o escudo. Depois, enfrente o guardião e abra a saída final.',room:'06 · REATOR CENTRAL',action:'Use pulo 20 para o núcleo. Experimente const arma = 3;',test:'O núcleo salva um checkpoint. Desvie das miras, vença o chefe e deixe até 1 barreira.',hint:'Pulo 20 alcança o núcleo. Depois, velocidade 8 a 10 ajuda a desviar. Arma 3 dispara três projéteis; elimine o guardião antes do portal.'}
];
const drone=(x,y=444,range=110)=>({type:'drone',x,y,w:64,h:58,hp:24,range});
const turret=(x,y=458)=>({type:'turret',x,y,w:66,h:72,hp:40,range:0});
export const LEVELS=[
 {width:1560,platform:{x:560,y:360,w:260,h:170},core:{x:705,y:318}},
 {width:2200,covers:[{x:440,y:478,w:120,h:52},{x:1050,y:460,w:150,h:70}],enemies:[drone(750),drone(1420)],portal:true,exitX:2050},
 {width:2460,covers:[{x:510,y:460,w:150,h:70},{x:1280,y:440,w:170,h:90}],enemies:[drone(870),turret(1610),drone(1970,424)],hazardStart:760,hazardEnd:2000,maxBarriers:3,portal:true,exitX:2300},
 {width:1760,platform:{x:780,y:300,w:710,h:230},gap:[430,780],core:{x:1390,y:258},enemies:[turret(1180,228)]},
 {width:2500,covers:[{x:460,y:470,w:130,h:60}],enemies:[drone(730),drone(970)],gateX:2220,plateX:1190,gateDuration:1.85,maxBarriers:2,hazardStart:1480,hazardEnd:1900,exitX:2310},
 {width:2800,platform:{x:560,y:220,w:260,h:310},core:{x:705,y:178},covers:[{x:1320,y:475,w:120,h:55},{x:2080,y:475,w:120,h:55}],enemies:[{type:'boss',x:1810,y:375,w:150,h:128,hp:160,range:170}],maxBarriers:1,hazardStart:1500,hazardEnd:2000,portal:true,exitX:2620}
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
 constructor(config=DEFAULT_CONFIG){this.config={...DEFAULT_CONFIG,...config};this.stage=1;this.time=0;this.retries=0;this.edits=0;this.events=[];this.particles=[];this.won=false;this.transition=0;this.camera=0;this.gate=0;this.gateTriggered=false;this.gateFailed=false;this.plateInside=false;this.reactorCharged=false;this.player=this.newPlayer();this.walkPhase=0;this.lastJump=false;this.jumpBuffer=0;this.coyote=0;this.shake=0;this.invincible=0;this.health=3;this.score=0;this.checkpointX=110;this.bullets=[];this.cooldown=0;this.weaponWarning=0;this.spawnEnemies();}
 get level(){return LEVELS[this.stage-1];}
 get worldWidth(){return this.level.width;}
 get enemiesLeft(){return this.enemies.filter(e=>e.hp>0).length;}
 spawnEnemies(){this.enemies=(this.level.enemies||[]).map((e,i)=>({...e,id:i,origin:e.x,maxHp:e.hp,phase:i*1.8,attack:1.8+i*.5,charge:0,flash:0}));}
 damage(){if(this.invincible>0)return;this.health--;this.invincible=1.1;this.shake=.25;this.burst(this.player.x+20,this.player.y+35,'#ff8c95',25);this.events.push({type:'damage'});if(this.health<=0){this.restart();this.events.push({type:'hit'});}}
 combat(dt,input){
  const p=this.player;this.cooldown=Math.max(0,this.cooldown-dt);this.weaponWarning=Math.max(0,this.weaponWarning-dt);
  if(input.shoot&&this.cooldown===0){
   if(!this.config.arma){if(!this.weaponWarning){this.events.push({type:'noWeapon'});this.weaponWarning=4;}}
   else {this.cooldown=this.config.arma===1?.27:.14;const spread=this.config.arma===3?[-.14,0,.14]:[0];for(const angle of spread)this.bullets.push({x:p.x+21+p.facing*40,y:p.y+40,w:12,h:5,vx:p.facing*940,vy:Math.sin(angle)*940,life:1.5,enemy:false,damage:8});this.events.push({type:'shoot'});this.burst(p.x+21+p.facing*40,p.y+40,'#bcf46a',3);}
  }
  for(const e of this.enemies){
   if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);e.phase+=dt;
   if(e.type!=='turret'){e.x=e.origin+Math.sin(e.phase*.8)*e.range;e.y+=(Math.sin(e.phase*2)*8-(e.bob||0));e.bob=Math.sin(e.phase*2)*8;}
   if(e.type==='boss'&&!this.reactorCharged)continue;
   const dx=p.x+21-e.x-e.w/2,dy=p.y+40-e.y-e.h/2;
   if(Math.abs(dx)>850)continue;
   if(e.charge>0){e.charge-=dt;if(e.charge<=0){const a=e.aim;const spread=e.type==='boss'?[-.22,0,.22]:[0];for(const angle of spread)this.bullets.push({x:e.x+e.w/2,y:e.y+e.h/2,w:12,h:12,vx:Math.cos(a+angle)*(e.type==='boss'?300:255),vy:Math.sin(a+angle)*(e.type==='boss'?300:255),life:4,enemy:true});e.attack=e.type==='boss'?1.4:2.4;}}
   else {e.attack-=dt;if(e.attack<=0){e.charge=e.type==='boss'?1:.8;e.aim=Math.atan2(dy,dx);}}
  }
  for(const b of this.bullets){const old={...b};b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
   if(this.solids.some(r=>sweptTouches(old,b,r))){b.life=0;this.burst(b.x,b.y,b.enemy?'#ff9d80':'#bcf46a',4);continue;}
   if(b.enemy){if(sweptTouches(old,b,p)){b.life=0;this.damage();}}
   else for(const e of this.enemies){if(e.hp>0&&sweptTouches(old,b,e)){b.life=0;if(e.type==='boss'&&!this.reactorCharged)break;e.hp=Math.max(0,e.hp-b.damage);e.flash=.12;this.burst(b.x,b.y,'#ffb876',8);if(e.hp===0){this.score+=e.type==='boss'?1000:100;this.burst(e.x+e.w/2,e.y+e.h/2,'#ffb876',55);this.events.push({type:'enemyDown'});if(this.enemiesLeft===0){this.health=3;if(this.stage===5){this.checkpointX=1100;this.events.push({type:'checkpoint'});}}}break;}}
  }
  this.bullets=this.bullets.filter(b=>b.life>0);
 }

 get gateAllowed(){return this.enemiesLeft===0&&(this.level.maxBarriers===undefined||this.config.quantidadeDeObstaculos<=this.level.maxBarriers)&&(this.stage!==6||this.reactorCharged);}
 newPlayer(){return {x:this.stage===6&&this.reactorCharged?900:(this.checkpointX||110),y:FLOOR-84,w:42,h:84,vx:0,vy:0,grounded:true,facing:1,land:0};}
 get solids(){
  const l=this.level,out=[{x:-100,y:-200,w:this.worldWidth+200,h:260}];
  if(l.gap){out.push({x:-100,y:FLOOR,w:l.gap[0]+100,h:250},{x:l.gap[1],y:FLOOR,w:this.worldWidth-l.gap[1]+100,h:250});}
  else out.push({x:-100,y:FLOOR,w:this.worldWidth+200,h:250});
  if(l.platform)out.push(l.platform);out.push(...(l.covers||[]));
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
 restart(count=true){if(count)this.retries++;this.health=3;this.bullets=[];this.player=this.newPlayer();this.gate=0;this.gateTriggered=false;this.gateFailed=false;this.plateInside=false;this.sensorWarning=false;this.portalWarning=false;this.jumpBuffer=0;this.coyote=.12;this.lastJump=false;this.camera=0;this.invincible=.25;}
 advance(){this.burst(this.player.x+18,this.player.y+30,'#bcf46a',45);this.stage++;this.checkpointX=110;this.spawnEnemies();this.transition=1.6;this.reactorCharged=false;this.restart(false);this.events.push({type:'stage',stage:this.stage});}
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
  if(Math.abs(nextX-(p.x+p.vx*dt))>.001)p.vx=0;p.x=clamp(nextX,10,this.worldWidth-p.w-10);
  const oldY=p.y,previousFeet=p.y+p.h,wasGrounded=p.grounded;let nextY=p.y+p.vy*dt;p.grounded=false;
  for(const r of this.solids){if(p.x<r.x+r.w&&p.x+p.w>r.x){if(p.vy>=0&&previousFeet<=r.y+.001&&nextY+p.h>r.y){nextY=Math.min(nextY,r.y-p.h);p.grounded=true;}else if(p.vy<0&&oldY>=r.y+r.h-.001&&nextY<r.y+r.h)nextY=Math.max(nextY,r.y+r.h);}}
  if(Math.abs(nextY-(p.y+p.vy*dt))>.001)p.vy=0;p.y=nextY;
  if(p.grounded&&!wasGrounded){p.land=.15;this.burst(p.x+18,p.y+p.h,'#a3ccd2',8);this.events.push({type:'land'});}
  if(p.grounded)this.walkPhase+=Math.abs(p.vx)*dt*.032;
  if(this.stage===1&&p.grounded&&Math.abs(p.y+p.h-360)<2&&p.x>650&&p.x<780){this.advance();return;}
  if(this.stage===4&&this.enemiesLeft===0&&p.grounded&&Math.abs(p.y+p.h-300)<2&&p.x>1340&&p.x<1480){this.advance();return;}
  if(this.stage===6&&!this.reactorCharged&&overlaps(p,{x:660,y:132,w:90,h:100})){
   this.reactorCharged=true;this.burst(705,178,'#bcf46a',50);this.restart(false);this.lastJump=!!input.jump;this.events.push({type:'reactor'});return;
  }
  if(l.gateX){
   const inside=p.x+p.w>l.plateX&&p.x<l.plateX+44&&p.grounded;
   const crossed=p.grounded&&Math.min(before.x,p.x)<l.plateX+44&&Math.max(before.x+before.w,p.x+p.w)>l.plateX;
   if((inside||crossed)&&!this.plateInside&&this.gate===0){if(this.gateAllowed){this.gate=l.gateDuration;this.gateTriggered=true;this.gateFailed=false;this.events.push({type:'gateOpen'});}else if(!this.sensorWarning){this.sensorWarning=true;this.events.push({type:'sensorLocked'});}}
   this.plateInside=inside;
  }
  this.combat(dt,input);if(this.player!==p)return;
  const hit=this.hazards.find(h=>sweptTouches(before,p,h));
  if(hit&&this.invincible===0){this.damage();}
  if(this.stage===5&&p.x>l.exitX&&this.gateTriggered){this.advance();return;}
  if((this.stage===2||this.stage===3)&&p.x>l.exitX){if(this.enemiesLeft===0&&(l.maxBarriers===undefined||this.config.quantidadeDeObstaculos<=l.maxBarriers)){this.advance();return;}else if(!this.portalWarning){this.portalWarning=true;this.events.push({type:'portalLocked'});}}
  if(this.stage===6&&p.x>l.exitX&&this.reactorCharged&&this.gateAllowed){this.won=true;this.events.push({type:'win'});this.burst(p.x,390,'#bcf46a',100);}
  if(p.y>VIEW_H+100){this.restart();this.events.push({type:'fall'});}
  this.camera+=(clamp(p.x-420,0,this.worldWidth-VIEW_W)-this.camera)*(1-Math.exp(-dt*8));
 }
}
