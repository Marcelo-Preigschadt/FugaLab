import test from 'node:test';
import assert from 'node:assert/strict';
import {Laboratory,DEFAULT_CONFIG,DEFAULT_CODE,parseCode,formatCode,FLOOR} from '../logic.js';
const ticks=(lab,seconds,input={})=>{for(let i=0;i<Math.round(seconds*120)&&!lab.won;i++)lab.step(1/120,typeof input==='function'?input(lab,i):input);};
test('Terminal lê as três atribuições, comentários e decimais',()=>{
 assert.deepEqual(parseCode(DEFAULT_CODE),{ok:true,config:DEFAULT_CONFIG});
 assert.equal(parseCode(formatCode({...DEFAULT_CONFIG,velocidade:8.5})).config.velocidade,8.5);
});
test('Código incompleto, duplicado, desconhecido e fora de limites é rejeitado',()=>{
 for(const code of ['const velocidade = 8;','const velocidade = -1;\nforcaDoPulo=14;\nquantidadeDeObstaculos=2;','velocidade=8;\nforcaDoPulo=14;\nquantidadeDeObstaculos=2.5;','velocidade=8;\nforcaDoPulo=14;\nquantidadeDeObstaculos=2;\nvelocidade=7;','velocidade=8;\nforcaDoPulo=14;\nobstaculos=2;'])assert.equal(parseCode(code).ok,false,code);
});
test('Instruções arbitrárias nunca são executadas nem aceitas pelo terminal',()=>{
 globalThis.fugaInjected=false;
 assert.equal(parseCode('globalThis.fugaInjected = true;').ok,false);
 assert.equal(parseCode('velocidade = (globalThis.fugaInjected = true);').ok,false);
 assert.equal(globalThis.fugaInjected,false);delete globalThis.fugaInjected;
});
test('O robô permanece no piso e não atravessa a plataforma',()=>{
 const lab=new Laboratory();ticks(lab,4,{right:true});assert.equal(lab.stage,1);assert.equal(lab.player.x,560-lab.player.w);assert.equal(lab.player.y+lab.player.h,FLOOR);
});
test('Pulo original não resolve a sala 1; alterar o pulo permite progredir',()=>{
 const lab=new Laboratory();ticks(lab,1.6,{right:true});ticks(lab,1.5,{right:true,jump:true});assert.equal(lab.stage,1);
 lab.apply({...lab.config,forcaDoPulo:14});lab.restart(false);ticks(lab,1.6,{right:true});ticks(lab,1.6,{right:true,jump:true});assert.equal(lab.stage,2);
});
test('A porta fecha com velocidade 5; velocidade 8 atravessa a sala',()=>{
 const lab=new Laboratory({...DEFAULT_CONFIG,forcaDoPulo:14});lab.stage=2;lab.restart(false);ticks(lab,4,{right:true});assert.equal(lab.stage,2);assert.equal(lab.gateFailed,true);
 lab.apply({...lab.config,velocidade:8});assert.equal(lab.player.x,110);ticks(lab,3,{right:true});assert.equal(lab.stage,3);
});
test('Obstáculos mudam de verdade e a colisão reinicia no checkpoint',()=>{
 const lab=new Laboratory();lab.stage=3;lab.restart(false);assert.equal(lab.hazards.length,6);lab.apply({...lab.config,quantidadeDeObstaculos:3});assert.equal(lab.hazards.length,3);
 ticks(lab,1,{right:true});assert.ok(lab.retries>0);assert.equal(lab.stage,3);
});
test('Portal de transferência exige até três barreiras e leva à sala 4',()=>{
 const lab=new Laboratory();lab.stage=3;lab.player.x=1420;lab.step(1/120,{});assert.equal(lab.stage,3);
 lab.apply({...lab.config,quantidadeDeObstaculos:0});ticks(lab,5,{right:true});assert.equal(lab.stage,4);assert.equal(lab.won,false);
});
test('Velocidade não tem teto de 12; valores 50 e 1000 são aceitos',()=>{
 for(const velocidade of [0,13,50,1000,1e25])assert.equal(parseCode(formatCode({...DEFAULT_CONFIG,velocidade})).ok,true);
 assert.equal(parseCode(formatCode({...DEFAULT_CONFIG,velocidade:Infinity})).ok,false);
});
test('Colisões de portas e feixes não são puladas em alta velocidade',()=>{
 const lab=new Laboratory({...DEFAULT_CONFIG,velocidade:1000});lab.stage=2;lab.player.x=800;lab.player.vx=20000;lab.step(1/120,{right:true});assert.equal(lab.player.x,990-lab.player.w);assert.equal(lab.gateTriggered,false);
 lab.stage=3;lab.restart(false);lab.invincible=0;lab.player.x=250;lab.player.vx=20000;lab.step(1/120,{right:true});assert.equal(lab.retries,1);assert.equal(lab.player.x,110);
});
test('Vão com margem elevada não é superado apenas correndo com pulo baixo',()=>{
 const lab=new Laboratory({...DEFAULT_CONFIG,velocidade:10,forcaDoPulo:8});lab.stage=4;lab.restart(false);ticks(lab,6,l=>({right:true,jump:l.player.grounded&&l.player.x>330&&l.player.x<430}));assert.equal(lab.stage,4);assert.ok(lab.retries>0);
});
test('Sala 5 exige reduzir barreiras para liberar o sensor',()=>{
 const lab=new Laboratory({...DEFAULT_CONFIG,velocidade:12});lab.stage=5;lab.restart(false);ticks(lab,.5,{right:true});assert.equal(lab.gateAllowed,false);assert.equal(lab.gateTriggered,false);lab.apply({...lab.config,quantidadeDeObstaculos:2});assert.equal(lab.gateAllowed,true);
});
test('Checkpoint final conserva núcleo carregado ao editar os blocos',()=>{
 const lab=new Laboratory();lab.stage=6;lab.reactorCharged=true;lab.restart(false);assert.equal(lab.player.x,850);lab.apply({...lab.config,velocidade:18,forcaDoPulo:20,quantidadeDeObstaculos:1});assert.equal(lab.reactorCharged,true);assert.equal(lab.player.x,850);
});
test('As seis salas são concluídas por ajustes e entradas físicas, sem teletransportar o jogador',()=>{
 const configs={1:{velocidade:5,forcaDoPulo:14,quantidadeDeObstaculos:6},2:{velocidade:8,forcaDoPulo:14,quantidadeDeObstaculos:6},3:{velocidade:8,forcaDoPulo:14,quantidadeDeObstaculos:3},4:{velocidade:10,forcaDoPulo:17,quantidadeDeObstaculos:3},5:{velocidade:12,forcaDoPulo:17,quantidadeDeObstaculos:2},6:{velocidade:18,forcaDoPulo:20,quantidadeDeObstaculos:1}};
 const lab=new Laboratory();let stage=0;
 for(let i=0;i<120*60&&!lab.won;i++){
  if(lab.stage!==stage){stage=lab.stage;lab.apply(configs[stage]);}
  const p=lab.player;let jump=false;
  if(stage===1)jump=p.grounded&&p.x>470&&p.x<560;
  if(stage===3){const next=lab.hazards.find(h=>h.x+h.w>p.x);jump=!!next&&p.grounded&&next.x-(p.x+p.w)<150&&next.x>p.x-10;}
  if(stage===4)jump=p.grounded&&p.x>330&&p.x<430;
  if(stage===5)jump=p.grounded&&p.x>370&&p.x<450;
  if(stage===6)jump=!lab.reactorCharged?p.grounded&&p.x>480&&p.x<560:p.grounded&&p.x>935&&p.x<1030;
  lab.step(1/120,{right:true,jump});
 }
 assert.equal(lab.won,true);assert.equal(lab.stage,6);assert.equal(lab.edits,6);assert.equal(lab.retries,0);
 const time=lab.time;lab.step(1,{});assert.equal(lab.time,time);
});
