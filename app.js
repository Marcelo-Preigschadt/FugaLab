import {Laboratory,DEFAULT_CODE,DEFAULT_CONFIG,MISSIONS,parseCode,formatCode} from './logic.js?v=4';
import {LabRenderer} from './render.js?v=4';
const $=id=>document.getElementById(id),canvas=$('game'),editor=$('code');
const renderer=new LabRenderer(canvas);
let lab=new Laboratory(),mode='intro',loaded=false,lastApplied=DEFAULT_CODE,keys={left:false,right:false,jump:false};
let lastTime=performance.now(),accumulator=0,toastTime=0,stageTime=0,sound=false,audio=null;
let taughtStage=0;
const stageVariables=['forcaDoPulo','arma','quantidadeDeObstaculos','velocidade','velocidade','forcaDoPulo'];
const labels={velocidade:'Velocidade',forcaDoPulo:'Força do pulo',quantidadeDeObstaculos:'Barreiras',arma:'Arma'};
function show(id,on){$(id).hidden=!on;}
function notify(text,seconds=4){$('toast').textContent=text;toastTime=seconds;show('toast',true);}
function feedback(text,type=''){ $('feedbackText').textContent=text;$('feedback').className='feedback'+(type?' '+type:'');}
function setMode(next){
 mode=next;held.clear();keys={left:false,right:false,jump:false};accumulator=0;
 show('codeBrief',next==='briefing');show('codePrompt',!['intro','briefing','editing','won'].includes(next)&&taughtStage!==lab.stage);
 show('intro',next==='intro');show('pause',next==='paused');show('victory',next==='won');show('editingBadge',next==='editing');
 document.body.classList.toggle('editor-focused',next==='editing');document.body.classList.toggle('game-paused',next==='paused');
 $('pauseButton').textContent=next==='paused'||next==='editing'?'▶':'Ⅱ';$('pauseButton').setAttribute('aria-label',next==='paused'||next==='editing'?'Continuar jogo':'Pausar jogo');
}
function highlight(errorLine=0){
 const source=editor.value,pattern=/(\/\/[^\n]*|\b(?:const|let)\b|\b(?:velocidade|forcaDoPulo|quantidadeDeObstaculos|arma)\b|-?\b\d+(?:\.\d+)?\b)/g,fragment=document.createDocumentFragment();
 let last=0;
 for(const match of source.matchAll(pattern)){
  fragment.append(document.createTextNode(source.slice(last,match.index)));
  const span=document.createElement('span'),text=match[0];span.textContent=text;
  span.className=text.startsWith('//')?'syntax-comment':/^(const|let)$/.test(text)?'syntax-keyword':/^-?\d/.test(text)?'syntax-number':'syntax-name';fragment.append(span);last=match.index+text.length;
 }
 fragment.append(document.createTextNode(source.slice(last)+'\n'));$('highlight').replaceChildren(fragment);
 $('lineNumbers').replaceChildren();source.split('\n').forEach((_,i)=>{const row=document.createElement('div');row.textContent=i+1;if(i+1===errorLine)row.className='error-line';$('lineNumbers').append(row);});
 const dirty=source!==lastApplied;show('dirtyMark',dirty);$('editorState').textContent=dirty?'ALTERAÇÕES NÃO EXECUTADAS':'SALVO NA SIMULAÇÃO';$('editorState').style.color=dirty?'#ffb876':'';syncScroll();
}
function syncScroll(){$('highlight').scrollTop=editor.scrollTop;$('highlight').scrollLeft=editor.scrollLeft;$('lineNumbers').style.marginTop=-editor.scrollTop+'px';}
function values(changed=[]){
 for(const [key,id,card] of [['velocidade','valueSpeed','statSpeed'],['forcaDoPulo','valueJump','statJump'],['quantidadeDeObstaculos','valueObstacles','statObstacles'],['arma','valueWeapon','statWeapon']]){
  $(id).textContent=lab.config[key];$(card).classList.toggle('changed',changed.includes(key));
 }
 if(changed.length)setTimeout(()=>document.querySelectorAll('.runtime-values .changed').forEach(el=>el.classList.remove('changed')),1800);
}
function mission(){
 const info=MISSIONS[lab.stage-1];$('stageNumber').textContent=`0${lab.stage} / 06`;$('missionTitle').textContent=info.title;$('missionText').textContent=info.description;$('roomName').textContent=info.room;
 for(let i=1;i<=6;i++){$('step'+i).className=i<lab.stage?'done':i===lab.stage?'active':'';$('step'+i).textContent=i<lab.stage?'✓':'0'+i;}
 $('guideAction').textContent=info.action;$('guideTest').textContent=info.test;$('lesson').textContent=info.action;
 $('checkpoint').textContent=`◈ SALA 0${lab.stage} · CHECKPOINT ATIVO`;
}
async function unlockSound(){try{audio ||= new (window.AudioContext||window.webkitAudioContext)();await audio.resume();}catch{sound=false;}}
function tone(type){
 if(!sound||!audio||audio.state!=='running')return;
 const sounds={jump:[280,540,.11,.035],land:[90,55,.055,.025],apply:[430,980,.22,.055],hit:[155,50,.2,.055],gateOpen:[320,760,.2,.045],gateClosed:[230,120,.15,.04],stage:[520,1150,.32,.05],win:[650,1300,.5,.055]};
 if(['shoot','damage','enemyDown','noWeapon'].includes(type)&&type!=='shoot')type='hit';sounds.shoot=[680,220,.055,.015];
 const [a,b,duration,volume]=sounds[type]||sounds.apply,now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.type=type==='hit'?'sawtooth':'triangle';osc.frequency.setValueAtTime(a,now);osc.frequency.exponentialRampToValueAtTime(b,now+duration);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(now+duration+.02);
}
function presentCode(){
 stageTime=0;show('stageToast',false);const info=MISSIONS[lab.stage-1];$('briefTask').textContent=info.action;$('terminal').classList.add('needs-code');
 $('editorBeacon').textContent='1. ALTERE O CÓDIGO AQUI ↓';setMode('briefing');$('goToCode').focus({preventScroll:true});
}
function focusCode(){
 setMode('editing');$('terminal').scrollIntoView({behavior:'smooth',block:'nearest'});editor.focus({preventScroll:true});
 const variable=stageVariables[lab.stage-1],pattern=new RegExp('(?:const|let)\\s+'+variable+'\\s*=\\s*(-?[0-9.]+)'),match=pattern.exec(editor.value);
 if(match){const start=match.index+match[0].lastIndexOf(match[1]);editor.setSelectionRange(start,start+match[1].length);editor.scrollTop=Math.max(0,editor.value.slice(0,start).split('\n').length-3)*26;}
 else {editor.setSelectionRange(editor.value.length,editor.value.length);editor.scrollTop=editor.scrollHeight;}
 feedback(MISSIONS[lab.stage-1].action+' Depois clique em 2. Executar código.');highlight();
}
function begin(){if(!loaded)return;presentCode();}
function applyCode(){
 if(!loaded)return;
 const result=parseCode(editor.value);
 if(!result.ok){highlight(result.line);feedback(result.error+' O jogo mantém os valores anteriores.','error');if(mode==='playing')setMode('editing');tone('hit');return;}
 if(lab.won){lab=new Laboratory(lab.config);mission();}
 taughtStage=lab.stage;$('terminal').classList.remove('needs-code');$('editorBeacon').textContent='1. EDITE → 2. EXECUTE → 3. JOGUE';
 stageTime=0;show('stageToast',false);const before={...lab.config},changed=lab.apply(result.config);if(lab.player.x===110)renderer.camera=0;lastApplied=editor.value;highlight();values(changed);
 const detail=changed.map(k=>`${labels[k]}: ${before[k]} → ${result.config[k]}`).join(' · ');
 feedback(changed.length?`Código aplicado. ${detail}. Teste o resultado no laboratório.`:'Código correto. Os valores já estavam em execução.','success');
 tone('apply');setMode('playing');canvas.focus();notify(changed.length?detail:'Código executado. Assuma o controle do robô.',4);
}
function restart(){if(mode==='intro'||mode==='won')return;lab.restart();renderer.camera=0;setMode('playing');canvas.focus();notify('Trecho reiniciado. Seu código foi mantido.');}
function togglePause(){if(mode==='playing'){setMode('paused');}else if(mode==='paused'||mode==='editing'){setMode('playing');canvas.focus();}}
function fresh(){taughtStage=0;$('terminal').classList.remove('needs-code');lab=new Laboratory();renderer.camera=0;editor.value=DEFAULT_CODE;lastApplied=DEFAULT_CODE;toastTime=0;stageTime=0;show('toast',false);show('stageToast',false);values();mission();highlight();setMode('intro');feedback('Novo visitante. Comece jogando e descubra o que precisa mudar.');}
function replay(){const config={...lab.config},edits=lab.edits;lab=new Laboratory(config);renderer.camera=0;taughtStage=0;lab.edits=edits;editor.value=formatCode(config);lastApplied=editor.value;highlight();values();mission();begin();notify('Sua versão está em execução. As seis salas usam os valores que você programou.');}
function victory(){
 setMode('won');const receipt=$('receipt');receipt.replaceChildren();
 for(const [key,label] of [['velocidade','VELOCIDADE'],['forcaDoPulo','PULO'],['quantidadeDeObstaculos','BARREIRAS'],['arma','ARMA']]){const card=document.createElement('div'),name=document.createElement('span'),value=document.createElement('strong');name.textContent=label;value.textContent=lab.config[key];card.append(name,value);receipt.append(card);}
 $('runSummary').textContent=`${lab.edits} ${lab.edits===1?'alteração aplicada':'alterações aplicadas'} · ${Math.floor(lab.time)} segundos de simulação · ${lab.retries} ${lab.retries===1?'reinício':'reinícios'}`;
 for(let i=1;i<=6;i++){$('step'+i).className='done';$('step'+i).textContent='✓';}tone('win');
}
function processEvents(){
 for(const event of lab.events){
  tone(event.type);
  if(event.type==='stage'){mission();renderer.camera=0;stageTime=3;$('stageToastText').textContent=MISSIONS[lab.stage-1].room;show('stageToast',true);feedback(MISSIONS[lab.stage-1].action,'success');presentCode();}
  if(event.type==='gateOpen')notify('Porta aberta. Corra até a saída!',2);
  if(event.type==='gateClosed')notify('A porta fechou. Ajuste a velocidade e execute: o trecho recomeça para o novo teste.',5);
  if(event.type==='hit'){renderer.camera=0;}
  if(event.type==='hit')notify('Energia esgotada. Checkpoint restaurado; inimigos derrotados continuam fora de combate.',4);
  if(event.type==='portalLocked')notify('A saída exige todos os defensores eliminados e a quantidade de barreiras indicada na missão.',5);
  if(event.type==='noWeapon')notify('Crie a habilidade: adicione const arma = 1; no código e execute.',6);
  if(event.type==='damage')notify('Você foi atingido! Use as caixas como cobertura e desvie das miras.',3);
  if(event.type==='enemyDown')notify(lab.enemiesLeft?`Defensor desativado. Restam ${lab.enemiesLeft}.`:'Setor limpo! Energia restaurada. Siga para o objetivo.',3);
  if(event.type==='checkpoint')notify('Checkpoint salvo no segundo setor. Agora ajuste a corrida!',5);
  if(event.type==='reactor'){renderer.camera=0;notify('Núcleo carregado! Escudo do guardião desativado. Checkpoint salvo.',6);}
  if(event.type==='sensorLocked')notify('Elimine os defensores e reduza as barreiras para liberar o sensor.',4);
  if(event.type==='win')victory();
 }
}
function frame(now){
 const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;
 if(mode==='playing'){
  accumulator+=dt;
  while(accumulator>=1/120&&mode==='playing'){lab.step(1/120,keys);processEvents();accumulator=Math.max(0,accumulator-1/120);}
 }
 toastTime=Math.max(0,toastTime-dt);stageTime=Math.max(0,stageTime-dt);if(!toastTime)show('toast',false);if(!stageTime)show('stageToast',false);
 $('health').textContent='● '.repeat(lab.health)+'○ '.repeat(3-lab.health);$('enemyCount').textContent=lab.enemiesLeft?`${lab.enemiesLeft} ${lab.enemiesLeft===1?'DEFENSOR':'DEFENSORES'}`:lab.stage>1?'SETOR LIMPO':'';$('weaponHud').textContent=lab.config.arma?`ARMA ${lab.config.arma} · J / X`:'ARMA OFF · PROGRAME';
 const seconds=Math.floor(lab.time);$('runTime').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 renderer.draw(lab,now,{intro:mode==='intro',editing:mode==='editing'});requestAnimationFrame(frame);
}
editor.value=DEFAULT_CODE;highlight();mission();values();renderer.resize();
$('start').disabled=true;$('start').textContent='Preparando laboratório…';$('apply').disabled=true;
renderer.load().then(()=>{loaded=true;$('start').disabled=false;$('start').replaceChildren(document.createTextNode('Iniciar experimento →'));$('apply').disabled=false;}).catch(error=>{console.error(error);$('start').textContent='Arte não carregada';feedback('Não foi possível carregar a arte do jogo. Atualize a página. Verifique se a pasta assets foi publicada por completo.','error');});
$('goToCode').addEventListener('click',focusCode);$('codePrompt').addEventListener('click',focusCode);$('tryFirst').addEventListener('click',()=>{setMode('playing');canvas.focus();feedback('Teste o robô. Para mudar suas habilidades, clique em Alterar o código.');});
$('start').addEventListener('click',begin);$('apply').addEventListener('click',applyCode);$('restart').addEventListener('click',restart);$('pauseButton').addEventListener('click',togglePause);$('resume').addEventListener('click',togglePause);$('newVisitor').addEventListener('click',fresh);$('nextVisitor').addEventListener('click',fresh);$('replay').addEventListener('click',replay);
$('hint').addEventListener('click',()=>{feedback(MISSIONS[lab.stage-1].hint);notify(MISSIONS[lab.stage-1].hint,7);if(mode==='playing')canvas.focus();});
editor.addEventListener('input',()=>highlight());editor.addEventListener('scroll',syncScroll);editor.addEventListener('focus',()=>{if(mode==='playing')setMode('editing');});
editor.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();applyCode();}
 if(e.key==='Tab'){e.preventDefault();const a=editor.selectionStart,b=editor.selectionEnd;editor.setRangeText('  ',a,b,'end');highlight();}
 if(e.key==='Escape'){editor.blur();if(mode==='editing')setMode('paused');}
});
const keyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyJ:'shoot',KeyX:'shoot'};
const held=new Set();
function updateKeys(){for(const action of ['left','right','jump','shoot'])keys[action]=Object.entries(keyMap).some(([code,target])=>target===action&&held.has(code));}
document.addEventListener('keydown',e=>{
 if(document.activeElement===editor)return;
 if(e.code==='KeyF'){e.preventDefault();fullscreen();return;}
 if(e.code==='Escape'&&mode==='playing'){setMode('paused');return;}
 if(e.code==='KeyP'){e.preventDefault();togglePause();return;}
 if(e.code==='KeyR'){e.preventDefault();restart();return;}
 if(e.code==='Space'&&['BUTTON','SUMMARY','INPUT'].includes(document.activeElement?.tagName))return;
 if(mode==='playing'&&keyMap[e.code]){e.preventDefault();held.add(e.code);updateKeys();}
});
document.addEventListener('keyup',e=>{held.delete(e.code);updateKeys();});
function release(){held.clear();keys={left:false,right:false,jump:false};}
window.addEventListener('blur',()=>{release();if(mode==='playing')setMode('paused');});document.addEventListener('visibilitychange',()=>{if(document.hidden){release();if(mode==='playing')setMode('paused');}});
canvas.addEventListener('pointerdown',()=>{if(mode==='editing')togglePause();canvas.focus();});
for(const button of document.querySelectorAll('[data-key]')){
 const name=button.dataset.key;
 button.addEventListener('pointerdown',e=>{e.preventDefault();if(mode==='intro')begin();if(mode==='editing'||mode==='paused')togglePause();keys[name]=true;button.setPointerCapture(e.pointerId);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys[name]=false);
}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Use F11 no navegador para abrir a estação em tela cheia.');}}
$('fullscreen').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Sair da tela cheia ↙':'Tela cheia ↗';renderer.resize();});
$('sound').addEventListener('click',async()=>{sound=!sound;if(sound)await unlockSound();$('sound').textContent=sound?'Som ligado':'Som desligado';$('sound').setAttribute('aria-pressed',String(sound));tone('apply');if(mode==='playing')canvas.focus();});
window.addEventListener('resize',()=>renderer.resize());new ResizeObserver(()=>renderer.resize()).observe($('gameFrame'));
requestAnimationFrame(frame);
