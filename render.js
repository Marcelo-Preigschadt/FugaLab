import {VIEW_W,VIEW_H,FLOOR,WORLD_W,clamp} from './logic.js';
const TAU=Math.PI*2;
export class LabRenderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.background=new Image();this.atlas=new Image();this.frames=[];this.ready=false;this.motes=Array.from({length:45},()=>({x:Math.random()*VIEW_W,y:Math.random()*FLOOR,r:Math.random()*1.2+.4,s:Math.random()*8+3}));}
 async load(){
  this.background.src=new URL('./assets/laboratorio.png',import.meta.url).href;this.atlas.src=new URL('./assets/nit-atlas.png',import.meta.url).href;
  await Promise.all([this.background.decode(),this.atlas.decode()]);
  const c=document.createElement('canvas');c.width=this.atlas.width;c.height=this.atlas.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(this.atlas,0,0);
  const cw=this.atlas.width/4,ch=this.atlas.height/2;
  for(let frame=0;frame<8;frame++){
   const sx=Math.round(frame%4*cw),sy=Math.round(Math.floor(frame/4)*ch),w=Math.floor(cw),h=Math.floor(ch),pixels=g.getImageData(sx,sy,w,h).data;
   let left=w,right=0,top=h,bottom=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   this.frames.push({sx:sx+left,sy:sy+top,w:Math.max(1,right-left+1),h:Math.max(1,bottom-top+1)});
  }
  this.spriteScale=96/this.frames[4].h;this.ready=true;
 }
 resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);}
 rect(x,y,w,h,r=6,fill,stroke){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
 label(text,x,y,color='#b1d8df',size=13,align='center'){const c=this.ctx;c.fillStyle=color;c.font=`600 ${size}px "Segoe UI",sans-serif`;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(text,x,y);}
 glow(color,blur=15){this.ctx.shadowColor=color;this.ctx.shadowBlur=blur;}
 platform(r){
  const c=this.ctx;this.rect(r.x-7,r.y+8,r.w+14,r.h-8,5,'#07121ddd');
  const face=c.createLinearGradient(r.x,r.y,r.x+r.w,r.y+r.h);face.addColorStop(0,'#46606a');face.addColorStop(.15,'#243d48');face.addColorStop(.9,'#122b38');face.addColorStop(1,'#091e29');
  this.rect(r.x,r.y,r.w,r.h,4,face,'#587c88');
  this.rect(r.x+6,r.y+7,r.w-12,7,2,'#91bec7');c.fillStyle='#668c96';c.fillRect(r.x+2,r.y, r.w-4,3);
  for(const x of [r.x+17,r.x+r.w-35]){this.rect(x,r.y+24,18,r.h-36,4,'#0d2634','#3c6271');this.rect(x+6,r.y+30,5,r.h-49,2,'#1a6975');}
  this.rect(r.x+53,r.y+31,r.w-106,r.h-54,9,'#0b202e','#415c68');
  for(let y=r.y+43;y<r.y+r.h-29;y+=13){c.fillStyle='#284855';c.fillRect(r.x+64,y,r.w-128,3);}
  c.strokeStyle='#8ddfdf';c.lineWidth=2;this.glow('#7ae5e1',10);c.beginPath();c.moveTo(r.x+5,r.y+15);c.lineTo(r.x+r.w-5,r.y+15);c.stroke();c.shadowBlur=0;
  for(const [x,y] of [[r.x+8,r.y+8],[r.x+r.w-8,r.y+8],[r.x+8,r.y+r.h-8],[r.x+r.w-8,r.y+r.h-8]]){c.fillStyle='#90aab2';c.beginPath();c.arc(x,y,2,0,TAU);c.fill();}
  this.label('PROPULSOR · ACESSO SUPERIOR',r.x+r.w/2,r.y+r.h-12,'#6a9eae',8);
 }
 core(x,y,time){
  const c=this.ctx;c.save();c.translate(x,y+Math.sin(time*2)*5);const aura=c.createRadialGradient(0,0,2,0,0,70);aura.addColorStop(0,'#bcf46a55');aura.addColorStop(1,'#bcf46a00');c.fillStyle=aura;c.fillRect(-70,-70,140,140);
  c.rotate(time*.65);c.strokeStyle='#bcf46a';c.lineWidth=2;this.glow('#bcf46a',15);c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6;i?c.lineTo(Math.cos(a)*19,Math.sin(a)*19):c.moveTo(Math.cos(a)*19,Math.sin(a)*19);}c.closePath();c.fillStyle='#314c39';c.fill();c.stroke();c.rotate(-time*1.3);c.strokeRect(-9,-9,18,18);c.restore();this.label('ATIVE O NÚCLEO',x,y-44,'#d5f9a8',11);
 }
 portal(x,y,time,locked=false){
  const c=this.ctx,color=locked?'#ffb876':'#7ae5e1';c.save();c.translate(x,y);this.rect(-58,-102,116,176,24,'#142936','#456874');
  c.fillStyle='#061721';c.beginPath();c.ellipse(0,-18,43,74,0,0,TAU);c.fill();
  const aura=c.createRadialGradient(0,-18,5,0,-18,75);aura.addColorStop(0,locked?'#ffb87622':'#7ae5e155');aura.addColorStop(1,'#7ae5e100');c.fillStyle=aura;c.fillRect(-90,-110,180,190);
  for(let i=0;i<5;i++){c.strokeStyle=color;c.globalAlpha=.25+i*.12;c.lineWidth=i===4?3:1;c.beginPath();c.ellipse(0,-18,12+i*7,25+i*11,Math.sin(time+i)*.1,time*(i%2?1:-1)+i,time*(i%2?1:-1)+i+4.5);this.glow(color,14);c.stroke();}c.globalAlpha=1;c.shadowBlur=0;
  this.rect(-64,68,128,13,3,'#49636c','#85a0a8');this.rect(-50,-97,100,5,3,color);c.restore();this.label(locked?'ACESSO RESTRITO':'PORTAL DE SAÍDA',x,y-121,color,12);
 }
 gate(lab,time){
  const c=this.ctx,x=990,open=lab.gate>0;
  this.rect(x-25,106,92,425,7,'#172d39','#536975');this.rect(x-8,127,58,404,3,'#08131a');
  this.rect(x-20,120,8,404,2,'#5d777b');this.rect(x+55,120,8,404,2,'#5d777b');
  if(!open){
   const metal=c.createLinearGradient(x,0,x+42,0);metal.addColorStop(0,'#7c8f91');metal.addColorStop(.5,'#405b64');metal.addColorStop(1,'#213947');this.rect(x,135,42,FLOOR-135,2,metal,'#7d9c9f');
   for(let y=150;y<FLOOR;y+=24){c.fillStyle='#132e3b';c.fillRect(x+4,y,34,3);}this.glow('#ffb876',10);c.fillStyle='#ffb876';c.fillRect(x+17,165,7,320);c.shadowBlur=0;
  }else{this.glow('#7ae5e1',12);c.fillStyle='#7ae5e1';c.fillRect(x-10,130,3,390);c.fillRect(x+50,130,3,390);c.shadowBlur=0;}
  this.rect(x-95,45,232,51,7,'#0d2433','#426374');this.label(open?`${lab.gate.toFixed(2)} s`:'PORTA TEMPORIZADA',x+21,76,open?'#bcf46a':'#ffb876',open?25:13);
  this.rect(302,FLOOR-5,44,5,2,open?'#bcf46a':'#ffb876');this.glow(open?'#bcf46a':'#ffb876',12);this.rect(306,FLOOR-8,36,4,2,open?'#bcf46a':'#ffb876');c.shadowBlur=0;
  this.label('PISE PARA ABRIR',324,FLOOR+36,'#e9c894',10);
  c.save();c.setLineDash([9,18]);c.strokeStyle=open?'#bcf46a80':'#72909f55';c.lineWidth=2;c.beginPath();c.moveTo(363,FLOOR-5);c.lineTo(x-35,FLOOR-5);c.stroke();c.restore();
  if(open)for(let i=0;i<8;i++){const bx=370+(time*240+i*75)%570;this.label('›',bx,FLOOR-20,'#bcf46a66',24);}
 }
 hazard(h,time,i){
  const c=this.ctx;this.rect(h.x-9,FLOOR-9,h.w+18,12,4,'#334553','#6e7e89');this.rect(h.x-5,h.y-10,h.w+10,10,4,'#455c67','#8494a0');
  const pulse=.65+.25*Math.sin(time*11+i);this.glow('#ff617f',19);c.fillStyle=`rgba(255,80,114,${pulse*.3})`;c.fillRect(h.x-3,h.y,h.w+6,h.h);
  c.strokeStyle='#ff6685';c.lineWidth=3;c.beginPath();c.moveTo(h.x+h.w/2,h.y);for(let y=h.y+5;y<FLOOR-8;y+=7)c.lineTo(h.x+h.w/2+Math.sin(y+time*40+i)*7,y);c.stroke();c.shadowBlur=0;
  c.fillStyle='#ffbdce';c.fillRect(h.x+h.w/2-2,h.y,4,h.h-5);
 }
 robot(lab,time,intro=false,viewportWidth=VIEW_W){
  const c=this.ctx,p=lab.player;let x=p.x+p.w/2,y=p.y+p.h,frame=4;
  if(intro){x=viewportWidth*.79;y=FLOOR;frame=4;}
  else if(lab.won)frame=7;
  else if(!p.grounded)frame=p.vy<0?5:6;
  else if(Math.abs(p.vx)>15)frame=Math.floor(lab.walkPhase)%4;
  const sprite=this.frames[frame];if(!sprite)return;
  c.save();c.translate(x,y);c.scale(intro?1.9:1,intro?1.9:1);
  c.save();c.globalAlpha=.25;c.scale(1,.18);c.fillStyle='#000';c.beginPath();c.ellipse(0,0,30,19,0,0,TAU);c.fill();c.restore();
  const bob=frame===4?Math.sin(time*2.8)*1.2:0;
  c.scale(intro?1:p.facing,1);const w=sprite.w*this.spriteScale,h=sprite.h*this.spriteScale;
  if(lab.invincible>0&&!intro)c.globalAlpha=.65+.25*Math.sin(time*30);
  c.drawImage(this.atlas,sprite.sx,sprite.sy,sprite.w,sprite.h,-w/2,-h+bob,w,h);c.restore();
 }
 draw(lab,now,{intro=false,editing=false}={}){
  const c=this.ctx,cw=this.canvas.width,ch=this.canvas.height;if(!cw||!ch)return;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#091623';c.fillRect(0,0,cw,ch);
  const scale=Math.max(cw/VIEW_W,ch/VIEW_H),viewportWidth=cw/scale,ox=0,oy=(ch-VIEW_H*scale)/2;c.setTransform(scale,0,0,scale,ox,oy);c.save();c.beginPath();c.rect(0,0,VIEW_W,VIEW_H);c.clip();
  const time=now/1000,dt=Math.min(.05,Math.max(0,(now-(this.lastTime||now))/1000));this.lastTime=now;if(this.lastStage!==lab.stage){this.camera=0;this.lastStage=lab.stage;}const wanted=clamp(lab.player.x-viewportWidth*.35,0,WORLD_W-viewportWidth);this.camera=(this.camera||0)+(wanted-(this.camera||0))*(1-Math.exp(-dt*8));const camera=intro?0:this.camera;
  if(this.ready)c.drawImage(this.background,-20-camera*.12,0,1280,720);
  else{c.fillStyle='#132c3b';c.fillRect(0,0,VIEW_W,VIEW_H);}
  const tint=c.createLinearGradient(0,0,0,VIEW_H);tint.addColorStop(0,'#08162566');tint.addColorStop(.65,'#07162211');tint.addColorStop(1,'#07162244');c.fillStyle=tint;c.fillRect(0,0,VIEW_W,VIEW_H);
  for(const m of this.motes){c.fillStyle=`rgba(123,229,225,${.15+.15*Math.sin(time+m.x)})`;c.beginPath();c.arc((m.x+Math.sin(time*.1+m.y)*15),((m.y-time*m.s)%FLOOR+FLOOR)%FLOOR,m.r,0,TAU);c.fill();}
  c.save();c.translate(-camera,0);if(lab.shake>0)c.translate(Math.sin(time*90)*lab.shake*15,Math.cos(time*77)*lab.shake*12);
  // A borda do piso coincide com o plano de colisão em todas as salas.
  const floor=c.createLinearGradient(0,FLOOR,0,VIEW_H);floor.addColorStop(0,'#122b3ecc');floor.addColorStop(1,'#071420ee');c.fillStyle=floor;c.fillRect(0,FLOOR,WORLD_W,VIEW_H-FLOOR);
  c.fillStyle='#8cbdc7';c.fillRect(0,FLOOR,WORLD_W,2);c.fillStyle='#32525e';c.fillRect(0,FLOOR+4,WORLD_W,5);
  for(let x=0;x<WORLD_W;x+=90){this.rect(x+14,FLOOR+20,62,11,3,'#173443','#416471');this.glow('#7ae5e1',10);this.rect(x+31,FLOOR+23,28,3,1,'#7ae5e1');c.shadowBlur=0;}
  if(lab.stage===1&&!intro){this.platform({x:560,y:360,w:260,h:170});this.core(705,318,time);this.label('PLATAFORMA ELEVADA',690,290,'#a8c9ce',10);this.label('↑',545,437,'#ffb876',28);this.label('170',533,465,'#b79f82',11);}
  if(lab.stage===2&&!intro){this.gate(lab,time);this.label('SENSOR DE VELOCIDADE',600,438,'#8ab4c4',11);}
  if(lab.stage===3&&!intro){for(const [i,h] of lab.hazards.entries())this.hazard(h,time,i);this.portal(1460,FLOOR-72,time,lab.config.quantidadeDeObstaculos>3);this.label(`${lab.config.quantidadeDeObstaculos} BARREIRAS ATIVAS`,790,165,'#ffb4bf',16);}
  if(lab.stage<3&&!intro){this.rect(120,345,210,65,8,'#0d2936cc','#3d7180');this.label(lab.stage===1?'TESTE DE PROPULSÃO':'TESTE DE ACELERAÇÃO',225,369,'#94bdca',10);this.label(lab.stage===1?`PULO: ${lab.config.forcaDoPulo}`:`VELOCIDADE: ${lab.config.velocidade}`,225,395,'#bcf46a',19);}
  for(const p of lab.particles){c.globalAlpha=clamp(p.life,0,1);c.fillStyle=p.color;c.fillRect(p.x,p.y,3,3);}c.globalAlpha=1;
  if(this.ready)this.robot(lab,time,intro,viewportWidth);
  if(editing){const p=lab.player;this.glow('#bcf46a',14);c.strokeStyle='#bcf46a99';c.lineWidth=1;c.beginPath();c.ellipse(p.x+p.w/2,p.y+p.h+2,37,8,0,0,TAU);c.stroke();c.shadowBlur=0;}
  c.restore();
  const vignette=c.createRadialGradient(viewportWidth*.5,VIEW_H*.5,VIEW_H*.3,viewportWidth*.5,VIEW_H*.5,viewportWidth*.9);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#03101c99');c.fillStyle=vignette;c.fillRect(0,0,VIEW_W,VIEW_H);
  if(lab.won){for(let i=0;i<65;i++){const x=(i*149.7+Math.sin(time+i)*20)%VIEW_W,y=(time*65+i*37)%VIEW_H;c.fillStyle=['#bcf46a','#7ae5e1','#ffb876'][i%3];c.save();c.translate(x,y);c.rotate(time+i);c.fillRect(-2,-5,4,10);c.restore();}}
  c.restore();
 }
}
