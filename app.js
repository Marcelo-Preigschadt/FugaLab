import {Laboratory,DEFAULT_CONFIG,MISSIONS,parseCode,formatCode,LIMITS} from './logic.js?v=2';
import {LabRenderer} from './render.js?v=2';
const $=id=>document.getElementById(id),canvas=$('game'),renderer=new LabRenderer(canvas);
const fields={velocidade:'speedInput',forcaDoPulo:'jumpInput',quantidadeDeObstaculos:'obstacleInput'};
const cards={velocidade:'blockSpeed',forcaDoPulo:'blockJump',quantidadeDeObstaculos:'blockObstacles'};
const applied={velocidade:'speedApplied',forcaDoPulo:'jumpApplied',quantidadeDeObstaculos:'obstacleApplied'};
const tags={velocidade:'speedTag',forcaDoPulo:'jumpTag',quantidadeDeObstaculos:'obstacleTag'};
const labels={velocidade:'Velocidade',forcaDoPulo:'Pulo',quantidadeDeObstaculos:'Barreiras'};
let lab=new Laboratory(),mode='intro',loaded=false,keys={left:false,right:false,jump:false},lastTime=performance.now(),accumulator=0,toastTime=0,stageTime=0,sound=false,audio=null;
const held=new Set();
function show(id,on){$(id).hidden=!on;}
function notify(text,seconds=4){$('toast').textContent=text;toastTime=seconds;show('toast',true);}
function feedback(text,type=''){$('feedbackText').textContent=text;$('feedback').className='feedback'+(type?' '+type:'');}
function setMode(next){mode=next;held.clear();keys={left:false,right:false,jump:false};accumulator=0;show('intro',next==='intro');show('pause',next==='paused');show('victory',next==='won');show('editingBadge',next==='editing');document.body.classList.toggle('editor-focused',next==='editing');document.body.classList.toggle('game-paused',next==='paused');$('pauseButton').textContent=next==='paused'||next==='editing'?'▶':'Ⅱ';}
function blockValues(){return Object.fromEntries(Object.entries(fields).map(([key,id])=>[key,$(id).value.trim()===''?NaN:Number($(id).value)]));}
function hasPending(){const config=blockValues();return Object.keys(fields).some(k=>config[k]!==lab.config[k]);}
function syncBlocks(){
 const config=blockValues(),pending=hasPending(),info=MISSIONS[lab.stage-1];
 for(const key of Object.keys(fields)){
  const changed=config[key]!==lab.config[key],relevant=info.variables.includes(key);
  $(cards[key]).classList.toggle('pending',changed);$(cards[key]).classList.toggle('relevant',relevant);
  $(applied[key]).textContent=`Em uso: ${lab.config[key]}${changed?' · alteração pendente':''}`;
  $(tags[key]).textContent=relevant?'USE NESTA SALA':'TESTE LIVRE';
 }
 $('editorState').textContent=pending?'AJUSTES AINDA NÃO APLICADOS':'BLOCOS EM EXECUÇÃO';$('editorState').style.color=pending?'#ffb876':'';
 $('generatedCode').textContent=Object.values(config).every(Number.isFinite)?formatCode(config):'Preencha os três números para criar seu código.';
}
function fillBlocks(config){for(const [key,id] of Object.entries(fields))$(id).value=config[key];syncBlocks();}
function mission(){
 const info=MISSIONS[lab.stage-1];$('stageNumber').textContent=`0${lab.stage} / 0${MISSIONS.length}`;$('missionTitle').textContent=info.title;$('missionText').textContent=lab.stage===6&&lab.reactorCharged?'Núcleo carregado e checkpoint salvo. Reduza para até 1 barreira e atravesse a porta em 0,55 segundo.':info.description;$('roomName').textContent=info.room;
 $('guideAction').textContent=lab.stage===6&&lab.reactorCharged?'Ajuste a velocidade e a quantidade de barreiras para a corrida final.':info.action;
 $('guideTest').textContent=lab.stage===6&&lab.reactorCharged?'Aplique, pise no sensor laranja e pule o último feixe. Se errar, o núcleo permanece carregado.':info.test;
 const names=info.variables.map(k=>labels[k].toUpperCase());$('blockFocusText').textContent=names.length===1?`Esta sala usa o bloco ${names[0]}.`:`Esta sala combina ${names.join(' + ')}.`;
 for(let i=1;i<=MISSIONS.length;i++){$('step'+i).className=i<lab.stage?'done':i===lab.stage?'active':'';$('step'+i).textContent=i<lab.stage?'✓':'0'+i;}
 $('checkpoint').textContent=lab.reactorCharged?'◈ NÚCLEO CARREGADO · CHECKPOINT SALVO':`◈ SALA 0${lab.stage} · CHECKPOINT ATIVO`;syncBlocks();
}
async function unlockSound(){try{audio ||= new (window.AudioContext||window.webkitAudioContext)();await audio.resume();}catch{sound=false;}}
function tone(type){if(!sound||!audio||audio.state!=='running')return;const table={jump:[280,540,.11,.035],land:[90,55,.055,.025],apply:[430,980,.22,.055],hit:[155,50,.2,.055],fall:[155,50,.2,.055],gateOpen:[320,760,.2,.045],gateClosed:[230,120,.15,.04],stage:[520,1150,.32,.05],reactor:[600,1300,.4,.05],win:[650,1300,.5,.055]};const [a,b,duration,volume]=table[type]||table.apply,now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.type=type==='hit'?'sawtooth':'triangle';osc.frequency.setValueAtTime(a,now);osc.frequency.exponentialRampToValueAtTime(b,now+duration);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(now+duration+.02);}
function resetCamera(){renderer.camera=lab.reactorCharged?430:0;}
function begin(){if(!loaded)return;setMode('playing');canvas.focus();feedback('Ande com as setas e tente pular na plataforma com Espaço. Para mudar o salto, ajuste o bloco PULO e clique em Aplicar blocos e testar.');}
function applyBlocks(){
 if(!loaded)return;const config=blockValues();
 const missing=Object.keys(fields).find(k=>!Number.isFinite(config[k]));if(missing){feedback(`Preencha um número válido no bloco ${labels[missing].toUpperCase()}. Nenhuma alteração foi aplicada.`,'error');$(fields[missing]).focus();return;}
 const result=parseCode(formatCode(config));if(!result.ok){feedback(result.error.replace(/Linha \d+: /,'')+' Nenhum bloco foi aplicado.','error');if(mode==='playing')setMode('editing');tone('hit');return;}
 if(lab.won){lab=new Laboratory(lab.config);mission();}
 const before={...lab.config},changed=lab.apply(config);resetCamera();syncBlocks();
 const detail=changed.map(k=>`${labels[k]}: ${before[k]} → ${config[k]}`).join(' · ');
 feedback(changed.length?`Blocos aplicados. ${detail}. Agora teste o robô com as setas e Espaço.`:'Os blocos já estavam aplicados. Volte ao jogo e teste.','success');tone('apply');setMode('playing');canvas.focus();notify(detail||'Blocos aplicados. Assuma o controle do robô.');
}
function restart(){if(mode==='intro'||mode==='won')return;lab.restart();resetCamera();setMode('playing');canvas.focus();notify(lab.reactorCharged?'Trecho final reiniciado. O núcleo está salvo.':'Trecho reiniciado. Seus blocos foram mantidos.');}
function togglePause(){if(mode==='playing')setMode('paused');else if(mode==='paused'||mode==='editing'){if(hasPending()){notify('Há ajustes pendentes. Clique em Aplicar blocos e testar.');return;}setMode('playing');canvas.focus();}}
function fresh(){lab=new Laboratory();renderer.camera=0;fillBlocks(DEFAULT_CONFIG);toastTime=0;stageTime=0;show('toast',false);show('stageToast',false);mission();setMode('intro');feedback('Novo visitante: jogue, observe o problema e use os blocos destacados para resolvê-lo.');}
function replay(){const config={...lab.config},edits=lab.edits;lab=new Laboratory(config);lab.edits=edits;renderer.camera=0;fillBlocks(config);mission();begin();notify('Sua versão está em execução nas seis salas.');}
function victory(){setMode('won');$('receipt').replaceChildren();for(const [key,label] of [['velocidade','VELOCIDADE'],['forcaDoPulo','PULO'],['quantidadeDeObstaculos','BARREIRAS']]){const card=document.createElement('div'),name=document.createElement('span'),value=document.createElement('strong');name.textContent=label;value.textContent=lab.config[key];card.append(name,value);$('receipt').append(card);}$('runSummary').textContent=`6 salas concluídas · ${lab.edits} alterações aplicadas · ${Math.floor(lab.time)}s de simulação · ${lab.retries} reinícios`;for(let i=1;i<=MISSIONS.length;i++){$('step'+i).className='done';$('step'+i).textContent='✓';}tone('win');}
function processEvents(){
 for(const event of lab.events){
  tone(event.type);
  if(event.type==='stage'){resetCamera();mission();stageTime=2.5;$('stageToastText').textContent=`Sala ${event.stage-1} concluída. ${MISSIONS[event.stage-1].title}`;show('stageToast',true);feedback(MISSIONS[lab.stage-1].action+' Depois aplique os blocos e teste.','success');}
  if(event.type==='reactor'){resetCamera();mission();notify('Núcleo carregado! Checkpoint salvo. Agora corra pelo sensor e supere o último feixe.',6);feedback('Núcleo salvo. Prepare até 1 barreira, aumente a velocidade e aplique os blocos para a corrida final.','success');}
  if(event.type==='gateOpen')notify(`Porta aberta por ${lab.level.gateDuration.toFixed(2).replace('.',',')} segundo. Corra!`,2);
  if(event.type==='gateClosed')notify('A porta fechou. Ajuste a velocidade, aplique e tente novamente.',5);
  if(event.type==='sensorLocked')notify(lab.stage===6&&!lab.reactorCharged?'Primeiro alcance e carregue o núcleo no alto.':`O sensor exige no máximo ${lab.level.maxBarriers} barreiras. Ajuste o bloco BARREIRAS.`,5);
  if(event.type==='hit'||event.type==='fall'){resetCamera();notify(event.type==='fall'?'O salto não alcançou a outra margem. Combine VELOCIDADE e PULO e tente novamente.':'Barreira elétrica! Você voltou ao checkpoint. Seus blocos continuam valendo.',5);}
  if(event.type==='portalLocked')notify('A passagem exige no máximo 3 barreiras. Diminua o bloco BARREIRAS e aplique.',5);
  if(event.type==='win')victory();
 }
}
function frame(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;if(mode==='playing'){accumulator+=dt;while(accumulator>=1/120&&mode==='playing'){lab.step(1/120,keys);processEvents();accumulator-=1/120;}}toastTime=Math.max(0,toastTime-dt);stageTime=Math.max(0,stageTime-dt);if(!toastTime)show('toast',false);if(!stageTime)show('stageToast',false);const seconds=Math.floor(lab.time);$('runTime').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;renderer.draw(lab,now,{intro:mode==='intro',editing:mode==='editing'});requestAnimationFrame(frame);}
fillBlocks(DEFAULT_CONFIG);mission();renderer.resize();$('start').disabled=true;$('start').textContent='Preparando laboratório…';$('apply').disabled=true;
renderer.load().then(()=>{loaded=true;$('start').disabled=false;$('start').textContent='Iniciar experimento →';$('apply').disabled=false;}).catch(error=>{console.error(error);$('start').textContent='Arte não carregada';feedback('Não foi possível carregar a arte do jogo. Atualize a página e confira a pasta assets.','error');});
$('start').addEventListener('click',begin);$('apply').addEventListener('click',applyBlocks);$('restart').addEventListener('click',restart);$('pauseButton').addEventListener('click',togglePause);$('resume').addEventListener('click',togglePause);$('newVisitor').addEventListener('click',fresh);$('nextVisitor').addEventListener('click',fresh);$('replay').addEventListener('click',replay);
$('hint').addEventListener('click',()=>{feedback(MISSIONS[lab.stage-1].hint);notify(MISSIONS[lab.stage-1].hint,8);if(mode==='playing')canvas.focus();});
$('blockWorkspace').addEventListener('focusin',()=>{if(mode==='playing')setMode('editing');});
for(const [key,id] of Object.entries(fields)){
 $(id).addEventListener('input',syncBlocks);$(id).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyBlocks();}});
}
for(const button of document.querySelectorAll('[data-step]'))button.addEventListener('click',()=>{const id=button.dataset.for,key=Object.keys(fields).find(k=>fields[k]===id),value=Number($(id).value)||0,[min,max]=LIMITS[key];$(id).value=Math.max(min,Math.min(max,value+Number(button.dataset.step)));syncBlocks();});
const keyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump'};
function updateKeys(){for(const action of ['left','right','jump'])keys[action]=Object.entries(keyMap).some(([code,target])=>target===action&&held.has(code));}
document.addEventListener('keydown',e=>{if(e.target.closest?.('#blockWorkspace'))return;if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();applyBlocks();return;}if(e.code==='KeyF'){e.preventDefault();fullscreen();return;}if(e.code==='Escape'&&mode==='playing'){setMode('paused');return;}if(e.code==='KeyP'){e.preventDefault();togglePause();return;}if(e.code==='KeyR'){e.preventDefault();restart();return;}if(e.code==='Space'&&['BUTTON','SUMMARY','INPUT'].includes(document.activeElement?.tagName))return;if(mode==='playing'&&keyMap[e.code]){e.preventDefault();held.add(e.code);updateKeys();}});
document.addEventListener('keyup',e=>{held.delete(e.code);updateKeys();});function release(){held.clear();keys={left:false,right:false,jump:false};}
window.addEventListener('blur',()=>{release();if(mode==='playing')setMode('paused');});document.addEventListener('visibilitychange',()=>{if(document.hidden){release();if(mode==='playing')setMode('paused');}});
canvas.addEventListener('pointerdown',()=>{if(mode==='editing')togglePause();canvas.focus();});
for(const button of document.querySelectorAll('[data-key]')){const name=button.dataset.key;button.addEventListener('pointerdown',e=>{e.preventDefault();if(mode==='intro')begin();if(mode==='editing'||mode==='paused')togglePause();if(mode==='playing')keys[name]=true;button.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys[name]=false);}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();if(mode==='playing')canvas.focus();}catch{notify('Use F11 no navegador para abrir a estação em tela cheia.');}}
$('fullscreen').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Sair da tela cheia ↙':'Tela cheia ↗';renderer.resize();});
$('sound').addEventListener('click',async()=>{sound=!sound;if(sound)await unlockSound();$('sound').textContent=sound?'Som ligado':'Som desligado';$('sound').setAttribute('aria-pressed',String(sound));tone('apply');if(mode==='playing')canvas.focus();});
window.addEventListener('resize',()=>renderer.resize());new ResizeObserver(()=>renderer.resize()).observe($('gameFrame'));requestAnimationFrame(frame);
