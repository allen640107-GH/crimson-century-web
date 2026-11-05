// 緋紅世紀 audio — Kevin MacLeod BGM (HTMLAudio dual-element crossfade) + WebAudio SFX
const AU=(function(){
 const TRACKS={title:'snd/title.m4a',battle:'snd/battle.m4a',boss:'snd/boss.m4a',phase2:'snd/phase2.m4a'};
 const XFADE=1.15, LOOP_LEAD=0.4;
 let ctx=null,sfxG=null,master=null;
 let on={bgm:true,sfx:true}, vol={bgm:0.85,sfx:0.7};
 let cur=null,unlocked=false,want=null,xfading=false,fadeTok=0,loopTimer=null,raf=null,priming=false;
 let a=null,b=null,act='a';
 const isApk=()=>!!(window.CrimsonNative)||(location.protocol==='file:');
 const clamp01=x=>Math.max(0,Math.min(1,x));
 function setVol(el,v){if(!el)return;try{el.volume=clamp01(v);}catch(e){}}
 function init(){if(ctx)return;try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  master=ctx.createGain();master.gain.value=1;master.connect(ctx.destination);
  sfxG=ctx.createGain();sfxG.gain.value=vol.sfx*0.55;sfxG.connect(master);}
 function mk(src){const el=new Audio();el.preload='auto';el.loop=false;el.setAttribute('playsinline','');el.playsInline=true;if(src)el.src=src;setVol(el,0);return el;}
 function ensure(){if(!a){a=mk(TRACKS.title);b=mk(TRACKS.title);}return {a,b};}
 function live(){return act==='a'?a:b;}
 function idle(){return act==='a'?b:a;}
 function bgmGain(){return on.bgm?clamp01(vol.bgm):0;}
 function applyVol(){const g=bgmGain(),L=live();if(L&&!xfading)setVol(L,g);if(sfxG)sfxG.gain.value=clamp01(vol.sfx)*0.55*(on.sfx?1:0);}
 function clearLoop(){if(loopTimer){clearTimeout(loopTimer);loopTimer=null;}if(raf){cancelAnimationFrame(raf);raf=null;}}
 function scheduleLoop(){clearLoop();const L=live();if(!L||!L.duration||!isFinite(L.duration)||L.paused)return;
  const rem=L.duration-L.currentTime;const left=Math.max(50,(rem-LOOP_LEAD)*1000);
  loopTimer=setTimeout(()=>wrapLoop(),left);
  const tick=()=>{const el=live();if(!el||el.paused||!cur||cur==='none'||xfading)return;if(el.duration-el.currentTime<=LOOP_LEAD+0.05){wrapLoop();return;}raf=requestAnimationFrame(tick);};
  raf=requestAnimationFrame(tick);}
 function fadeSwap(I,L,g,durMs,done){const tok=++fadeTok;xfading=true;const t0=performance.now();
  (function step(now){if(tok!==fadeTok)return;const k=clamp01((now-t0)/durMs);setVol(I,g*k);setVol(L,g*(1-k));
   if(k<1)requestAnimationFrame(step);else{L.pause();try{L.currentTime=0;}catch(e){}setVol(L,0);act=act==='a'?'b':'a';xfading=false;done&&done();}})(t0);}
 function wrapLoop(){clearLoop();if(!cur||cur==='none'||!on.bgm||!unlocked||xfading)return;const L=live(),I=idle();if(!L||!L.duration)return;
  let rem=L.duration-L.currentTime;if(rem>LOOP_LEAD+0.25){scheduleLoop();return;}
  if(rem<0)rem=0;I.src=TRACKS[cur];try{I.currentTime=0;}catch(e){}setVol(I,0);const g=bgmGain();
  const p=I.play();if(p&&p.catch)p.catch(()=>{});
  fadeSwap(I,L,g,Math.min(XFADE,Math.max(0.12,rem||LOOP_LEAD))*1000,scheduleLoop);}
 function crossTo(name){ensure();const L=live(),I=idle();const src=TRACKS[name];if(!src){stopAll();cur=null;return;}
  want=name;cur=name;clearLoop();fadeTok++;xfading=false;
  if(!on.bgm||!unlocked){L.pause();I.pause();return;}
  I.src=src;try{I.currentTime=0;}catch(e){}setVol(I,0);const g=bgmGain();
  const p=I.play();if(p&&p.catch)p.catch(()=>{if(!unlocked)document.dispatchEvent(new Event('au-needtap'));});
  const had=L&&!L.paused&&L.src&&L.volume>0.02;
  if(!had){L.pause();setVol(I,g);act=act==='a'?'b':'a';scheduleLoop();return;}
  fadeSwap(I,L,g,XFADE*1000,scheduleLoop);}
 function stopAll(){clearLoop();fadeTok++;xfading=false;want='none';cur=null;[a,b].forEach(el=>{if(!el)return;el.pause();setVol(el,0);});}
 function unlock(){init();if(ctx&&ctx.state!=='running'){try{ctx.resume();}catch(e){}}
  unlocked=true;ensure();
  const sp=document.getElementById('sndp');if(sp)sp.classList.add('hide');
  const target=want&&want!=='none'?want:(cur&&cur!=='none'?cur:null);
  if(target)playBgm(target,1);
  else{
   // prime silently once if nothing queued
   if(!priming){priming=true;const el=live();const was=el.muted;el.muted=true;const p=el.play();
    const fin=()=>{el.pause();el.muted=was;try{el.currentTime=0;}catch(e){}setVol(el,0);priming=false;};
    if(p&&p.then)p.then(fin).catch(fin);else fin();}}
 }
 function playBgm(name,force){
  if(name==='none'||!name){stopAll();return;}
  if(!TRACKS[name]){stopAll();return;}
  want=name;
  if(!unlocked){cur=name;document.dispatchEvent(new Event('au-needtap'));return;}
  if(!on.bgm){cur=name;[a,b].forEach(el=>{if(el)el.pause();});clearLoop();return;}
  const L=live();
  if(cur===name&&L&&!L.paused&&!force){applyVol();return;}
  crossTo(name);}
 function tone(f,t,d,type,g,dest,slide){if(!ctx)return;const o=ctx.createOscillator(),ag=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
  ag.gain.setValueAtTime(0.0001,t);ag.gain.exponentialRampToValueAtTime(Math.min(0.28,g||0.2),t+0.01);ag.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(ag);ag.connect(dest);o.start(t);o.stop(t+d+0.05);}
 function noise(t,d,g,fc){if(!ctx)return;const n=ctx.createBufferSource(),buf=ctx.createBuffer(1,Math.max(1,ctx.sampleRate*d),ctx.sampleRate),x=buf.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);
  n.buffer=buf;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1200;const ag=ctx.createGain();ag.gain.value=Math.min(0.35,g||0.2);n.connect(f);f.connect(ag);ag.connect(sfxG);n.start(t);}
 const N=s=>440*Math.pow(2,(s-69)/12);
 function sfx(name,p){if(!on.sfx)return;init();if(!ctx)return;if(ctx.state!=='running'){try{ctx.resume();}catch(e){}}if(!unlocked&&!isApk())return;const t=ctx.currentTime;
  switch(name){
   case 'tap':tone(880,t,0.05,'square',0.06,sfxG);break;
   case 'swap':tone(600+Math.random()*80,t,0.04,'triangle',0.1,sfxG);break;
   case 'match':{const f=N(64+Math.min(p||1,14)*2);tone(f,t,0.22,'triangle',0.22,sfxG);tone(f*1.5,t+0.03,0.22,'sine',0.12,sfxG);break;}
   case 'hit':noise(t,0.16,0.28,1800);tone(180,t,0.12,'square',0.12,sfxG,60);break;
   case 'enemy':noise(t,0.28,0.4,700);tone(120,t,0.28,'sawtooth',0.2,sfxG,40);break;
   case 'heal':[72,76,79,84].forEach((s,i)=>tone(N(s),t+i*0.06,0.28,'sine',0.14,sfxG));break;
   case 'skill':tone(300,t,0.45,'sawtooth',0.12,sfxG,1200);[76,79,83,88].forEach((s,i)=>tone(N(s),t+0.1+i*0.05,0.35,'triangle',0.12,sfxG));break;
   case 'win':[69,72,76,81,84,88].forEach((s,i)=>tone(N(s),t+i*0.1,0.5,'triangle',0.18,sfxG));break;
   case 'lose':[64,62,60,57].forEach((s,i)=>tone(N(s),t+i*0.25,0.45,'sine',0.2,sfxG));break;
   case 'boss':tone(55,t,1.2,'sawtooth',0.25,sfxG,40);noise(t,1.0,0.22,400);break;
   case 'big':[60,64,67,72,76].forEach((s,i)=>tone(N(s+12),t+i*0.04,0.4,'square',0.08,sfxG));noise(t,0.4,0.22,3000);break;
  }}
 function set(k,v){
  if(k==='bgm'||k==='sfx'){on[k]=!!v;applyVol();if(k==='bgm'){if(!v){const L=live();if(L)L.pause();clearLoop();}else if(unlocked&&want&&want!=='none')playBgm(want,1);}return;}
  if(k==='bgmVol'){vol.bgm=clamp01(+v||0);applyVol();return;}
  if(k==='sfxVol'){vol.sfx=clamp01(+v||0);applyVol();return;}
 }
 function pauseAll(){const L=live();if(L)L.pause();clearLoop();}
 function resume(){if(unlocked&&on.bgm&&want&&want!=='none')playBgm(want,1);}
 if(isApk()){document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{unlocked=true;init();ensure();if(want&&want!=='none')playBgm(want,1);const sp=document.getElementById('sndp');if(sp)sp.classList.add('hide');},80));}
 return {unlock,playBgm,sfx,set,pauseAll,resume,isApk,
  get cur(){return cur},get want(){return want},get state(){return ctx?ctx.state:'none'},get unlocked(){return unlocked},
  get titleEl(){return cur==='title'?live():null},get liveEl(){return live()},
  get bgmTime(){const L=live();return L&&!L.paused?L.currentTime:0},
  get bgmPaused(){const L=live();return !L||L.paused},
  get vols(){return {bgm:vol.bgm,sfx:vol.sfx,on:{...on}}}};
})();
window.__pause=()=>AU.pauseAll();
