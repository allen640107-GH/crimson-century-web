// WebAudio 合成音樂與音效（原創旋律）
const AU=(function(){let ctx=null,master,bgmG,sfxG,cur=null,timer=null,on={bgm:true,sfx:true};
function init(){if(ctx)return;try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
 master=ctx.createGain();master.gain.value=0.8;master.connect(ctx.destination);bgmG=ctx.createGain();bgmG.gain.value=0.22;bgmG.connect(master);sfxG=ctx.createGain();sfxG.gain.value=0.5;sfxG.connect(master);}
function unlock(){init();if(ctx&&ctx.state!='running')ctx.resume();}
function tone(f,t,d,type,g,dest,slide){const o=ctx.createOscillator(),a=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
 a.gain.setValueAtTime(0.0001,t);a.gain.exponentialRampToValueAtTime(g||0.3,t+0.01);a.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(a);a.connect(dest);o.start(t);o.stop(t+d+0.05);}
function noise(t,d,g,fc){const n=ctx.createBufferSource(),b=ctx.createBuffer(1,ctx.sampleRate*d,ctx.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);
 n.buffer=b;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1200;const a=ctx.createGain();a.gain.value=g||0.3;n.connect(f);f.connect(a);a.connect(sfxG);n.start(t);}
const N=s=>440*Math.pow(2,(s-69)/12);
// 曲目：小調琶音 + 低音 + 鼓
const SONGS={
 title:{bpm:76,prog:[[57,60,64],[53,57,60],[55,59,62],[52,56,59]],lead:[76,74,72,71, 72,69,71,68],wave:'triangle'},
 battle:{bpm:132,prog:[[57,60,64],[57,60,64],[53,57,60],[55,59,62]],lead:[69,72,76,74,72,71,72,69],wave:'square',drum:1},
 boss:{bpm:150,prog:[[50,53,57],[51,54,58],[50,53,57],[49,52,56]],lead:[74,73,74,77,76,74,73,70],wave:'sawtooth',drum:2},
 win:null};
function playBgm(name){if(cur==name&&timer)return;cur=name;if(timer){clearInterval(timer);timer=null;}if(!ctx||!SONGS[name])return;
 const S=SONGS[name],beat=60/S.bpm/2;let step=0,next=ctx.currentTime+0.1;
 timer=setInterval(()=>{if(!on.bgm||ctx.state!='running'){next=ctx.currentTime+0.1;return;}
  while(next<ctx.currentTime+0.3){const bar=Math.floor(step/8)%S.prog.length,ch=S.prog[bar],k=step%8;
   tone(N(ch[0]-12),next,beat*1.8,'triangle',k%4==0?0.35:0.0001,bgmG);
   tone(N(ch[k%3]+12),next,beat*0.9,S.wave,0.07,bgmG);
   if(k%2==0&&step%32>=16)tone(N(S.lead[(k/2+bar*2)%8]),next,beat*1.9,'sine',0.12,bgmG);
   if(S.drum){if(k%4==0)tone(110,next,0.15,'sine',0.5,bgmG,40);if(k%4==2)noiseB(next,0.08,0.15);if(S.drum==2&&k%2==1)noiseB(next,0.03,0.06);}
   step++;next+=beat;}},60);}
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
function set(k,v){on[k]=v;if(k=='bgm'&&!v&&bgmG){}}
return {unlock,playBgm,sfx,set,get cur(){return cur}};})();
