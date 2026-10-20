import test from 'node:test';
import assert from 'node:assert/strict';
import {Laboratory,DEFAULT_CONFIG,DEFAULT_CODE,parseCode,formatCode,FLOOR} from '../logic.js';
const ticks=(l,n,input={})=>{for(let i=0;i<n*120&&!l.won;i++)l.step(1/120,typeof input==='function'?input(l,i):input);};
function room(stage,config={}){const l=new Laboratory({...DEFAULT_CONFIG,...config});l.stage=stage;l.spawnEnemies();l.restart(false);return l;}
test('Código inicial não declara arma; nova variável cria a habilidade',()=>{
 assert.deepEqual(parseCode(DEFAULT_CODE).config,DEFAULT_CONFIG);
 assert.equal(DEFAULT_CODE.includes('const arma'),false);
 for(const arma of [0,1,2,3])assert.equal(parseCode(DEFAULT_CODE+'\nconst arma = '+arma+';').config.arma,arma);
 assert.equal(parseCode(DEFAULT_CODE+'\nconst arma = 1.5;').ok,false);
 assert.equal(parseCode(DEFAULT_CODE+'\nconst arma = 4;').ok,false);
});
test('Parser rejeita erros, duplicatas, valores não finitos e instruções arbitrárias',()=>{
 for(const extra of ['const arma = alert(1);','const arma = 2;\nconst arma=1;','const armas=1;','const arma=-1;','fetch("/");'])assert.equal(parseCode(DEFAULT_CODE+'\n'+extra).ok,false);
 assert.equal(parseCode('const velocidade=8;').ok,false);
 assert.equal(parseCode(formatCode({...DEFAULT_CONFIG,velocidade:Infinity})).ok,false);
 for(const velocidade of [0,13,50,1000,1e25])assert.equal(parseCode(formatCode({...DEFAULT_CONFIG,velocidade})).ok,true);
});
test('Sem arma não há disparo; três modos têm comportamentos diferentes',()=>{
 const l=room(2);ticks(l,.1,{shoot:true});assert.equal(l.bullets.length,0);
 for(const arma of [1,2,3]){l.config.arma=arma;l.cooldown=0;l.bullets=[];l.step(1/120,{shoot:true});assert.equal(l.bullets.length,arma===3?3:1);assert.equal(l.cooldown,arma===1?.27:.14);}
});
test('Disparo destrói um drone e atribui pontuação',()=>{
 const l=room(2,{arma:1});l.enemies=[{...l.enemies[0],x:300,origin:300,range:0,attack:99}];ticks(l,1,{shoot:true});assert.equal(l.enemiesLeft,0);assert.equal(l.score,100);
});
test('Cobertura sólida bloqueia tiros do robô e dos inimigos',()=>{
 const l=room(2,{arma:3});l.enemies=[{...l.enemies[0],x:600,origin:600,range:0,attack:99}];ticks(l,1,{shoot:true});assert.equal(l.enemies[0].hp,24);
 l.bullets=[{x:600,y:495,w:12,h:12,vx:-500,vy:0,life:4,enemy:true}];ticks(l,1);assert.equal(l.health,3);assert.equal(l.bullets.length,0);
});
test('Ataques inimigos são sinalizados antes do disparo',()=>{
 const l=room(2);l.enemies=[{...l.enemies[0],x:350,origin:350,range:0,attack:0}];l.step(1/120,{});assert.ok(l.enemies[0].charge>0);assert.equal(l.bullets.length,0);ticks(l,.85);assert.ok(l.bullets.some(b=>b.enemy));
});
test('Dano concede proteção temporária, morte recupera energia e preserva progresso',()=>{
 const l=room(5);l.enemies[0].hp=0;l.checkpointX=1100;l.invincible=0;l.damage();assert.equal(l.health,2);l.damage();assert.equal(l.health,2);
 l.invincible=0;l.damage();l.invincible=0;l.damage();assert.equal(l.health,3);assert.equal(l.player.x,1100);assert.equal(l.enemies[0].hp,0);assert.equal(l.retries,1);
});
test('Escudo do chefe bloqueia dano até carregar o núcleo',()=>{
 const l=room(6);const e=l.enemies[0];e.range=0;e.attack=99;
 const fire=()=>{l.bullets=[{x:e.x-15,y:e.y+50,w:12,h:5,vx:900,vy:0,life:1,enemy:false,damage:8}];ticks(l,.04);};fire();assert.equal(e.hp,160);l.reactorCharged=true;fire();assert.equal(e.hp,152);assert.equal(l.gateAllowed,false);
 e.hp=0;l.config.quantidadeDeObstaculos=0;assert.equal(l.gateAllowed,true);l.apply({...l.config,velocidade:9});assert.equal(l.reactorCharged,true);assert.equal(l.player.x,900);
});
test('Piso e paredes continuam sólidos em alta velocidade',()=>{
 const l=new Laboratory();ticks(l,4,{right:true});assert.equal(l.player.x,560-l.player.w);assert.equal(l.player.y+l.player.h,FLOOR);
 const fast=room(5,{velocidade:1000});fast.player.x=2000;fast.player.vx=40000;fast.step(1/120,{right:true});assert.equal(fast.player.x,2220-fast.player.w);
});
test('Portais exigem combate e variáveis, não basta correr até o fim',()=>{
 const l=room(3);l.player.x=l.level.exitX+5;l.step(1/120,{});assert.equal(l.stage,3);l.enemies.forEach(e=>e.hp=0);l.step(1/120,{});assert.equal(l.stage,3);l.config.quantidadeDeObstaculos=0;l.step(1/120,{});assert.equal(l.stage,4);
});
test('Campanha inteira: seis salas, código e controles físicos, incluindo chefe',()=>{
 const lab=new Laboratory();let stage=0,visited=[];
 for(let i=0;i<120*90&&!lab.won;i++){
  if(stage!==lab.stage){stage=lab.stage;visited.push(stage);lab.apply({...lab.config,velocidade:stage===4?10:stage===5?12:7,forcaDoPulo:stage===6?20:stage===4?17:14,quantidadeDeObstaculos:0,arma:stage===1?0:3});}
  const p=lab.player,enemy=lab.enemies.find(e=>e.hp>0);let right=true,left=false,jump=false;
  if(stage===1)jump=p.grounded&&p.x>455&&p.x<560;
  if(stage===4){jump=p.grounded&&p.x>320&&p.x<430;if(p.x>800&&enemy&&enemy.x-p.x<400)right=false;}
  if(stage===6&&!lab.reactorCharged)jump=p.grounded&&p.x>460&&p.x<560;
  else if(stage!==4&&stage!==1){const cover=(lab.level.covers||[]).find(c=>c.x+c.w>p.x&&c.x-p.x<150&&c.x-p.x>-30);if(cover&&p.grounded)jump=true;if(enemy&&enemy.x>p.x&&enemy.x-p.x<350&&p.grounded&&p.y+p.h>520)right=false;}
  if(enemy&&(stage!==6||lab.reactorCharged)&&p.x>enemy.x+enemy.w){left=true;right=false;}
  lab.step(1/120,{right,left,jump,shoot:true});
 }
 assert.deepEqual(visited,[1,2,3,4,5,6]);assert.equal(lab.won,true);assert.ok(lab.score>=1000);assert.equal(lab.retries,0);
 const time=lab.time;lab.step(1,{});assert.equal(lab.time,time);
});
