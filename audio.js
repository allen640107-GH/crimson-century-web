// WebAudio 合成音樂與音效（原創旋律）
const AU=(function(){let ctx=null,master,bgmG,sfxG,cur=null,timer=null,on={bgm:true,sfx:true};
function init(){if(ctx)return;try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
 master=ctx.createGain();master.gain.value=0.8;master.connect(ctx.destination);bgmG=ctx.createGain();bgmG.gain.value=0.42;bgmG.connect(master);sfxG=ctx.createGain();sfxG.gain.value=0.5;sfxG.connect(master);}
let tEl=null;function tA(){if(!tEl){tEl=new Audio('snd/title.m4a');tEl.loop=true;tEl.preload='auto';tEl.volume=0.85;tEl.setAttribute('playsinline','');}return tEl;}
let unlocked=false;
function unlock(){init();if(ctx){if(ctx.state!='running'){try{ctx.resume();}catch(e){}}
 if(!unlocked){try{const b=ctx.createBuffer(1,1,22050),s=ctx.createBufferSource();s.buffer=b;s.connect(ctx.destination);s.start(0);}catch(e){}
  const el=tA();if(!(cur=='title'&&on.bgm)){el.muted=true;const p=el.play();if(p&&p.then)p.then(()=>{if(!(cur=='title'&&on.bgm))el.pause();el.muted=false;}).catch(()=>{el.muted=false;});}}}
 unlocked=true;if(cur=='title')playBgm('title',1);}
function tone(f,t,d,type,g,dest,slide){const o=ctx.createOscillator(),a=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
 a.gain.setValueAtTime(0.0001,t);a.gain.exponentialRampToValueAtTime(g||0.3,t+0.01);a.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(a);a.connect(dest);o.start(t);o.stop(t+d+0.05);}
function noise(t,d,g,fc){const n=ctx.createBufferSource(),b=ctx.createBuffer(1,ctx.sampleRate*d,ctx.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);
 n.buffer=b;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1200;const a=ctx.createGain();a.gain.value=g||0.3;n.connect(f);f.connect(a);a.connect(sfxG);n.start(t);}
const N=s=>440*Math.pow(2,(s-69)/12);
// 交響風曲目（原創）：弦樂頑固音型 + 銅管重音 + 定音鼓 + 合唱鋪底，全部 WebAudio 合成
let rev=null,bus=null;
function mkBus(){if(bus)return;try{bgmG.disconnect();const cp=ctx.createDynamicsCompressor();cp.threshold.value=-14;cp.ratio.value=4;bgmG.connect(cp);cp.connect(master);}catch(e){}bus=ctx.createGain();bus.gain.value=1;const dry=ctx.createGain();dry.gain.value=0.75;bus.connect(dry);dry.connect(bgmG);
 rev=ctx.createConvolver();const L=ctx.sampleRate*2.4,ir=ctx.createBuffer(2,L,ctx.sampleRate);for(let c=0;c<2;c++){const x=ir.getChannelData(c);for(let i=0;i<L;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/L,3);}
 rev.buffer=ir;const wet=ctx.createGain();wet.gain.value=0.45;bus.connect(rev);rev.connect(wet);wet.connect(bgmG);}
function env(g,t,a,d,r,v){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.setValueAtTime(v,t+a+d);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d+r);}
function strings(f,t,d,v){const g=ctx.createGain(),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(5000,f*6);lp.Q.value=0.7;lp.connect(g);g.connect(bus);
 [-7,0,7].forEach(dt=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;o.connect(lp);o.start(t);o.stop(t+d+0.3);});env(g,t,0.012,d*0.5,d*0.6+0.08,v);}
function brass(f,t,d,v){const g=ctx.createGain(),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=2;lp.frequency.setValueAtTime(300,t);lp.frequency.linearRampToValueAtTime(Math.min(4200,f*9),t+0.06);lp.frequency.exponentialRampToValueAtTime(Math.max(400,f*2),t+d+0.2);
 lp.connect(g);g.connect(bus);[0,1,2].forEach(k=>{const o=ctx.createOscillator();o.type=k==2?'square':'sawtooth';o.frequency.value=k==2?f/2:f;o.detune.value=(k-1)*6;o.connect(lp);o.start(t);o.stop(t+d+0.4);});env(g,t,0.03,d,0.25,v);}
function timp(f,t,v){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f*1.6,t);o.frequency.exponentialRampToValueAtTime(f,t+0.08);o.connect(g);g.connect(bus);env(g,t,0.004,0.02,0.9,v);o.start(t);o.stop(t+1.1);
 const n=ctx.createBufferSource(),b=ctx.createBuffer(1,ctx.sampleRate*0.2,ctx.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/x.length,4);n.buffer=b;
 const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;const ng=ctx.createGain();ng.gain.value=v*0.8;n.connect(lp);lp.connect(ng);ng.connect(bus);n.start(t);}
function choir(f,t,d,v){const g=ctx.createGain(),bp=ctx.createBiquadFilter(),bp2=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=750;bp.Q.value=1.2;bp2.type='bandpass';bp2.frequency.value=1150;bp2.Q.value=1.5;
 bp.connect(g);bp2.connect(g);g.connect(bus);[-12,-4,4,12].forEach(dt=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=5+Math.random();lg.gain.value=8;l.connect(lg);lg.connect(o.detune);o.connect(bp);o.connect(bp2);o.start(t);o.stop(t+d+1);l.start(t);l.stop(t+d+1);});env(g,t,d*0.35,d*0.3,0.8,v);}
// 每首：bpm、和弦(根音 MIDI 與三和弦)、旋律(每 2 拍一音, null 休止)、強度
const SONGS={
 title:{bpm:72,prog:[[57,60,64],[53,57,60],[55,59,62],[52,56,59]],mel:[76,null,74,72,71,null,72,69,72,null,71,69,68,null,71,null],lvl:0},
 battle:{bpm:138,prog:[[57,60,64],[53,57,60],[50,53,57],[52,56,59],[57,60,64],[53,57,60],[55,59,62],[52,56,59]],mel:[69,72,76,null,74,72,77,76, 74,null,72,71,72,74,76,null],lvl:1},
 boss:{bpm:156,prog:[[50,53,57],[51,54,58],[50,53,57],[49,52,56],[46,50,53],[47,51,54],[49,52,56],[49,53,56]],mel:[74,null,73,74,77,76,74,73, 70,null,73,74,82,81,77,76],lvl:2},
 win:null};
function playBgm(name,force){
 if(name=='title'){const was=cur;cur='title';if(timer){clearInterval(timer);timer=null;}const el=tA();if(!on.bgm){el.pause();return;}if(!el.paused&&!force)return;if(was!='title')try{el.currentTime=0;}catch(e){}
  const p=el.play();if(p&&p.catch)p.catch(()=>{window.__needTap=1;document.dispatchEvent(new Event('au-needtap'));});return;}
 if(tEl)tEl.pause();
 if(cur==name&&timer)return;cur=name;if(timer){clearInterval(timer);timer=null;}if(!ctx||!SONGS[name])return;mkBus();
 const S=SONGS[name],sx=60/S.bpm/4;let step=0,next=ctx.currentTime+0.1;
 timer=setInterval(()=>{if(!on.bgm||ctx.state!='running'){next=ctx.currentTime+0.1;return;}
  while(next<ctx.currentTime+0.35){const bi=Math.floor(step/16),bar=bi%S.prog.length,ch=S.prog[bar],k=step%16,sec=Math.floor(bi/S.prog.length)%2,L=S.lvl,t=next;
   if(L==0){ if(k==0){choir(N(ch[0]),t,sx*16,0.05);choir(N(ch[2]),t,sx*16,0.04);strings(N(ch[0]-12),t,sx*15,0.06);}
     if(k%4==0)strings(N(ch[(k/4)%3]+12),t,sx*3.5,0.03);
     if(k%8==0&&sec){const m=S.mel[(bar*2+k/8)%16];if(m)strings(N(m),t,sx*7,0.05);} }
   else{
    // 弦樂 16 分音符頑固音型
    const ost=[0,1,2,1,0,1,2,1,0,2,1,2,0,1,2,1];strings(N(ch[ost[k]]-12+(k>=8&&L==2?12:0)),t,sx*0.8,L==2?0.05:0.042);
    if(k%8==0)strings(N(ch[0]-24),t,sx*7.5,0.06);
    // 合唱鋪底
    if(k==0){choir(N(ch[0]),t,sx*16,L==2?0.06:0.04);choir(N(ch[1]+12),t,sx*16,0.03);if(L==2)choir(N(ch[2]),t,sx*16,0.04);}
    // 銅管重音
    const stab=L==2?[0,3,6,10,12]:[0,6,10];if(stab.includes(k)&&(L==2||bar%2==0||sec)){ch.forEach(c=>brass(N(c),t,k==0?sx*3:sx*1.2,L==2?0.05:0.04));}
    // 定音鼓
    if(k==0||k==8||(L==2&&k%4==0))timp(N(ch[0]-24),t,0.5);if(bar%4==3&&k>=12)timp(N(ch[0]-24),t,0.25+0.06*(k-12));
    // 旋律（第二段）
    if(sec&&k%8==0){const m=S.mel[(bar*2+k/8)%16];if(m){brass(N(m),t,sx*6,0.045);strings(N(m+12),t,sx*7,0.03);}}
    if(S.drum!==0&&k%4==2)noiseB(t,0.05,L==2?0.08:0.05);
   }
   step++;next+=sx;}},50);}
function noiseB(t,d,g){const n=ctx.createBufferSource(),b=ctx.createBuffer(1,Math.max(1,ctx.sampleRate*d),ctx.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;
 n.buffer=b;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=3000;const a=ctx.createGain();a.gain.setValueAtTime(g,t);a.gain.exponentialRampToValueAtTime(0.0001,t+d);n.connect(f);f.connect(a);a.connect(bgmG);n.start(t);}
function sfx(name,p){if(!ctx||!on.sfx)return;const t=ctx.currentTime;
 switch(name){
  case 'tap':tone(880,t,0.06,'square',0.08,sfxG);break;
  case 'swap':tone(600+Math.random()*80,t,0.04,'triangle',0.12,sfxG);break;
  case 'match':{const f=N(64+Math.min(p||1,14)*2);tone(f,t,0.25,'triangle',0.3,sfxG);tone(f*1.5,t+0.03,0.25,'sine',0.15,sfxG);break;}
  case 'hit':noise(t,0.2,0.4,1800);tone(180,t,0.15,'square',0.15,sfxG,60);break;
  case 'enemy':noise(t,0.35,0.6,700);tone(120,t,0.35,'sawtooth',0.3,sfxG,40);break;
  case 'heal':[72,76,79,84].forEach((s,i)=>tone(N(s),t+i*0.06,0.3,'sine',0.18,sfxG));break;
  case 'skill':tone(300,t,0.5,'sawtooth',0.15,sfxG,1200);[76,79,83,88].forEach((s,i)=>tone(N(s),t+0.1+i*0.05,0.4,'triangle',0.15,sfxG));break;
  case 'win':[69,72,76,81,84,88].forEach((s,i)=>tone(N(s),t+i*0.1,0.6,'triangle',0.22,sfxG));break;
  case 'lose':[64,62,60,57].forEach((s,i)=>tone(N(s),t+i*0.25,0.5,'sine',0.25,sfxG));break;
  case 'boss':tone(55,t,1.5,'sawtooth',0.35,sfxG,40);noise(t,1.2,0.3,400);break;
  case 'big':[60,64,67,72,76].forEach((s,i)=>tone(N(s+12),t+i*0.04,0.5,'square',0.1,sfxG));noise(t,0.5,0.3,3000);break;
 }}
function set(k,v){on[k]=v;if(k=='bgm'&&tEl){if(!v)tEl.pause();else if(cur=='title'&&unlocked)playBgm('title',1);}}
return {unlock,playBgm,sfx,set,get cur(){return cur},get state(){return ctx?ctx.state:'none'},get titleEl(){return tEl},get unlocked(){return unlocked}};})();
