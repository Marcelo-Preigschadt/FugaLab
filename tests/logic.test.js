import test from 'node:test';
import assert from 'node:assert/strict';
import {Laboratory,DEFAULT_CONFIG,DEFAULT_CODE,parseCode,formatCode,FLOOR} from '../logic.js';
const ticks=(lab,seconds,input={})=>{for(let i=0;i<Math.round(seconds*120)&&!lab.won;i++)lab.step(1/120,typeof input==='function'?input(lab,i):input);};
test('Terminal lê as três atribuições, comentários e decimais',()=>{
 assert.deepEqual(parseCode(DEFAULT_CODE),{ok:true,config:DEFAULT_CONFIG});
 assert.equal(parseCode(formatCode({...DEFAULT_CONFIG,velocidade:8.5})).config.velocidade,8.5);
});
test('Código incompleto, duplicado, desconhecido e fora de limites é rejeitado',()=>{
 for(const code of ['const velocidade = 8;','const velocidade = 13;\nforcaDoPulo=14;\nquantidadeDeObstaculos=2;','velocidade=8;\nforcaDoPulo=14;\nquantidadeDeObstaculos=2.5;','velocidade=8;\nforcaDoPulo=14;\nquantidadeDeObstaculos=2;\nvelocidade=7;','velocidade=8;\nforcaDoPulo=14;\nobstaculos=2;'])assert.equal(parseCode(code).ok,false,code);
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
test('Portal não permite vitória com seis barreiras e permite com zero',()=>{
 const lab=new Laboratory();lab.stage=3;lab.player.x=1420;lab.step(1/120,{});assert.equal(lab.won,false);
 lab.apply({...lab.config,quantidadeDeObstaculos:0});ticks(lab,5,{right:true});assert.equal(lab.won,true);const time=lab.time;lab.step(1,{});assert.equal(lab.time,time);
});
test('Percurso completo resolvido com programação e entradas físicas',()=>{
 const lab=new Laboratory();lab.apply({...lab.config,forcaDoPulo:14});ticks(lab,1.6,{right:true});ticks(lab,1.6,{right:true,jump:true});assert.equal(lab.stage,2);
 lab.apply({...lab.config,velocidade:8});ticks(lab,3,{right:true});assert.equal(lab.stage,3);
 lab.apply({...lab.config,quantidadeDeObstaculos:3});
 ticks(lab,6,(l,i)=>{
  const p=l.player,next=l.hazards.find(h=>h.x+h.w>p.x);
  const jump=!!next&&p.grounded&&next.x-(p.x+p.w)<150&&next.x>p.x-10;
  return {right:true,jump};
 });
 assert.equal(lab.won,true);assert.equal(lab.edits,3);
});
