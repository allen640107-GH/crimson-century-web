// 緋紅世紀 — UI / 戰鬥（v1.3：多敵波次・頭目技能・天候・共鳴・緋紅之刻・影片／劇情）
(function(){'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const app=$('#app');
// ---------- 存檔（沿用 crimson_save_v1，舊檔自動合併） ----------
const SKEY='crimson_save_v1';
function defaults(){return {v:2,gold:0,lv:{},exp:{},team:['nora','lysera','marin','fiel','kain'],cleared:{},stars:{},stam:CL.STAM_MAX,stamT:Date.now(),eggs:0,presets:[null,null,null],seen:{},settings:{fs:1,bgm:true,sfx:true,shake:true,lowfx:false,vib:true,fast:false}};}
function merge(d,s){if(!s||typeof s!='object')return d;for(const k in s){if(d[k]&&typeof d[k]=='object'&&!Array.isArray(d[k]))d[k]=merge(d[k],s[k]);else if(s[k]!==undefined)d[k]=s[k];}return d;}
let S;try{S=merge(defaults(),JSON.parse(localStorage.getItem(SKEY)||'null'));}catch(e){S=defaults();}
S.v=2;CL.CHARS.forEach(c=>{if(!S.lv[c.id])S.lv[c.id]=1;if(S.exp[c.id]==null)S.exp[c.id]=0;});
if(!Array.isArray(S.presets)||S.presets.length!=3)S.presets=[null,null,null];if(!S.seen||typeof S.seen!='object')S.seen={};
if(!Array.isArray(S.team)||S.team.length!=5||S.team.some(id=>!CL.CHMAP[id]))S.team=defaults().team;
function save(){try{localStorage.setItem(SKEY,JSON.stringify(S));}catch(e){}}
// 體力
function stamTick(){const now=Date.now();if(S.stam>=CL.STAM_MAX){S.stamT=now;return;}const n=Math.floor((now-S.stamT)/(CL.STAM_SEC*1000));if(n>0){S.stam=Math.min(CL.STAM_MAX,S.stam+n);S.stamT+=n*CL.STAM_SEC*1000;}}
function stamText(){stamTick();let t=`⚡ ${S.stam}/${CL.STAM_MAX}`;if(S.stam<CL.STAM_MAX){const s=Math.max(0,CL.STAM_SEC-Math.floor((Date.now()-S.stamT)/1000));t+=` <small>${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}</small>`;}return t;}
setInterval(()=>{$$('.stam').forEach(e=>e.innerHTML=stamText());},1000);
stamTick();save();
const LOWFX=()=>S.settings.lowfx;
// 震動：Android 瀏覽器 navigator.vibrate；APK 內走原生橋接 CrimsonNative；iPhone Safari 不支援（靜默略過）
let vibLast=0;const VIBLOG=[];
function vib(p){if(S.settings.vib===false)return;const now=performance.now();if(typeof p=='number'&&p<15&&now-vibLast<35)return;vibLast=now;VIBLOG.push(p);
 try{if(window.CrimsonNative&&CrimsonNative.vibrate){CrimsonNative.vibrate(JSON.stringify([].concat(p)));return;}if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
function hitstop(ms){if(LOWFX())return Promise.resolve();app.classList.add('hitstop');return wait(ms).then(()=>app.classList.remove('hitstop'));}
// ---------- 版面 ----------
let CELL=60;
function layout(){const vv=window.visualViewport;const H=Math.round(vv?vv.height:innerHeight),W=Math.min(Math.round(vv?vv.width:innerWidth),480);
 app.style.setProperty('--W',W+'px');app.style.setProperty('--H',H+'px');
 CELL=Math.floor(Math.min(W/6,(H*0.46)/5));app.style.setProperty('--cell',CELL+'px');
 const memH=Math.max(40,Math.min(W/6-3,(H*0.10)));app.style.setProperty('--memH',memH+'px');
 if(B&&B.board&&curScreen=='battle')renderBoard();window.scrollTo(0,0);resizeFx();}
addEventListener('resize',layout);if(window.visualViewport){visualViewport.addEventListener('resize',layout);visualViewport.addEventListener('scroll',()=>window.scrollTo(0,0));}
document.addEventListener('touchmove',e=>{if(!e.target.closest('.scroll'))e.preventDefault();},{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('dblclick',e=>e.preventDefault());
function applySettings(){app.style.setProperty('--fs',S.settings.fs);document.body.style.setProperty('--fs',S.settings.fs);AU.set('bgm',S.settings.bgm);AU.set('sfx',S.settings.sfx);
 app.classList.toggle('lowfx',!!S.settings.lowfx);const bf=$('#b-fast');if(bf)bf.classList.toggle('on',!!S.settings.fast);
 $$('#fsseg button').forEach(b=>b.classList.toggle('on',+b.dataset.v==S.settings.fs));
 [['bgm','#t-bgm'],['sfx','#t-sfx'],['shake','#t-shake'],['lowfx','#t-lowfx'],['vib','#t-vib'],['fast','#t-fast']].forEach(([k,s])=>{$(s).textContent=S.settings[k]?'開啟':'關閉';$(s).classList.toggle('off',!S.settings[k]);});}
// 按鈕按壓回饋（漣漪）
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn,.stg,.tab,.mem,.slot,.fr');if(!b||LOWFX())return;const r=b.getBoundingClientRect(),s=document.createElement('span');s.className='ripple';s.style.left=(e.clientX-r.left)+'px';s.style.top=(e.clientY-r.top)+'px';b.appendChild(s);setTimeout(()=>s.remove(),500);});
// ---------- 畫面切換 ----------
let curScreen='title',teamBack='map',setBack='title';
function go(n){if(n=='map'&&pendingScene){const p=pendingScene;pendingScene=null;return playCut(p.cs?`vid/cs${p.cs}.mp4`:null,()=>p.end?storyScene(-1,()=>go('map')):storyScene(p.ch,()=>go('map')));}
 if(n=='map'&&!S.seen.story0){S.seen.story0=1;save();return storyScene(0,()=>go('map'));}
$('#modal').classList.add('hide');if(B&&n!='battle')B.active=false;curScreen=n;$$('.screen').forEach(s=>s.classList.toggle('on',s.id=='sc-'+n));
 if(n=='map')renderMap();if(n=='team')renderTeam();if(n=='settings')applySettings();
 if(n!='battle'&&!window.__vidOn)AU.playBgm('title');$$('.g').forEach(e=>e.textContent=S.gold);$$('.stam').forEach(e=>e.innerHTML=stamText());}
function firstTap(){AU.unlock();const v=$('#vid');if(v&&!$('#vidov').classList.contains('hide')&&v.muted){v.muted=false;v.volume=1;const p=v.play();if(p&&p.catch)p.catch(()=>{});window.__vidUnmuted=1;}
 const sp=$('#sndp');if(sp)sp.classList.add('hide');if(AU.cur&&AU.cur!='none'&&!window.__vidOn)AU.playBgm(AU.cur);}
['pointerdown','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,firstTap,{capture:true,passive:true}));
document.addEventListener('au-needtap',()=>{const sp=$('#sndp');if(sp)sp.classList.remove('hide');});
$$('[data-go]').forEach(b=>b.onclick=()=>{AU.sfx('tap');if(b.dataset.go=='team')teamBack=curScreen;if(b.dataset.go=='settings')setBack=curScreen;go(b.dataset.go);});
$('#b-start').onclick=()=>{AU.sfx('tap');go('map');};
$('#b-team1').onclick=()=>{AU.sfx('tap');teamBack='title';go('team');};
$('#b-set1').onclick=()=>{AU.sfx('tap');setBack='title';go('settings');};
$('#b-teamback').onclick=()=>{AU.sfx('tap');go(teamBack);};
$('#b-setback').onclick=()=>{AU.sfx('tap');go(setBack);};
$('#b-fback').onclick=()=>{AU.sfx('tap');go('map');};
$$('#fsseg button').forEach(b=>b.onclick=()=>{S.settings.fs=+b.dataset.v;save();applySettings();layout();});
['bgm','sfx','shake','lowfx','vib'].forEach(k=>$('#t-'+k).onclick=()=>{S.settings[k]=!S.settings[k];save();applySettings();AU.sfx('tap');if(k=='vib'&&S.settings.vib)vib([40,40,80]);});
$('#b-reset').onclick=()=>modal('<h2>清除存檔？</h2>所有進度與等級將會重置。',[['取消',null],['清除',()=>{localStorage.removeItem(SKEY);S=defaults();CL.CHARS.forEach(c=>{S.lv[c.id]=1;S.exp[c.id]=0;});window.G.S=S;save();applySettings();go('title');}]]);
function modal(html,btns){$('#modal .mbody').innerHTML=html;const bb=$('#modal .mbtns');bb.innerHTML='';
 btns.forEach(([t,f,cls])=>{const b=document.createElement('button');b.className='btn'+(cls?' '+cls:'');b.textContent=t;b.onclick=()=>{AU.sfx('tap');$('#modal').classList.add('hide');f&&f();};bb.appendChild(b);});
 $('#modal').classList.remove('hide');}
const attrTag=a=>a?`<span class="attr" style="background:${CL.ACOL[a]}">${CL.ANAME[a]}</span>`:'';
// ---------- 關卡地圖 ----------
let mapTab='main';
$$('.tab').forEach(t=>t.onclick=()=>{AU.sfx('tap');mapTab=t.dataset.tab;renderMap();});
function unlocked(st){return st.unlock<0||!!S.cleared[st.unlock];}
function renderMap(){$$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.tab==mapTab));const L=$('#stagelist');L.innerHTML='';let ch=-1;
 const list=mapTab=='main'?CL.STAGES:CL.SPECIAL;
 if(mapTab=='special'){const h=document.createElement('div');h.className='chap';h.textContent='可反覆挑戰・大量金幣／經驗';L.appendChild(h);}
 list.forEach(st=>{if(mapTab=='main'&&st.ch!=ch){ch=st.ch;const h=document.createElement('div');h.className='chap';h.innerHTML=`第 ${ch+1} 章　${CL.CHAPTERS[ch].n} <button class="btn sm story" data-ch="${ch}">📜 劇情</button>`;h.querySelector('.story').onclick=e=>{e.stopPropagation();AU.sfx('tap');storyScene(+e.target.dataset.ch);};L.appendChild(h);}
  const boss=st.waves[st.waves.length-1][0],b=document.createElement('button'),ok=unlocked(st),done=S.cleared[st.i];b.className='stg'+(ok?'':' lock')+(st.kind!='main'?' sp-'+st.kind:'');
  const kind={main:'主線',gold:'金幣',exp:'經驗'}[st.kind];const wx=st.wx&&st.wx!='none'?` ${CL.WEATHER[st.wx].n}`:'';
  b.innerHTML=`<img src="img/${boss.id}.webp" alt=""><div><div class="nm">${st.name}</div><div class="ds"><span class="kind">${kind}</span> ${st.waves.length} 波・⚡${st.stam}${wx}<br>EXP ${st.exp}・💰${st.gold}${done&&st.kind=='main'?'（重玩減半）':''}</div></div><div class="st">${done?'★':(ok?'▶':'🔒')}</div>`;
  b.onclick=()=>{AU.sfx('tap');if(!ok)return modal(st.kind=='main'?'請先通關前一關。':`通關主線第 ${st.unlock+1} 關後開放。`,[['好',null]]);pickFriend(st.i);};L.appendChild(b);});
 if(mapTab=='main'){const first=CL.STAGES.findIndex(s=>!S.cleared[s.i]);if(first>2)setTimeout(()=>{const e=L.querySelectorAll('.stg')[first];e&&e.scrollIntoView({block:'center'});},0);}}
// ---------- 好友選擇 ----------
const FRIENDS=[['紅蓮旅人','lysera'],['銀月騎士','nora'],['碧海歌姬','marin'],['森語者','fiel'],['夜鴉','kain'],['雷鳴鍛匠','garen'],['冰鏡','sein'],['聖歌隊長','ed'],['影之薇拉','vela'],['大地之盾','bark']];
function pickFriend(i){const st=CL.ALLST[i];stamTick();const lv=CL.friendLv(Object.keys(S.cleared).filter(k=>+k<100).length);
 $('#fhint').innerHTML=`${st.name}　消耗體力 ⚡${st.stam}<br>好友的隊長技會與你的隊長技相乘！`;const L=$('#friendlist');L.innerHTML='';
 FRIENDS.forEach(([fn,id],k)=>{const c=CL.CHMAP[id],flv=Math.max(1,lv-(k%3)),d=document.createElement('button');d.className='fr stg';
  d.innerHTML=`<div class="ch" style="border-color:${CL.ACOL[c.attr]}"><img src="img/${c.img}.webp" alt=""><span class="lv">Lv${flv}</span></div><div class="cinfo"><div class="n">${fn}　<small>${c.name}</small> ${attrTag(c.attr)}${attrTag(c.sub)}</div><div><b class="k">隊長：</b>${c.lead.d}</div></div>`;
  d.onclick=()=>{AU.sfx('tap');stamTick();if(S.stam<st.stam)return modal(`<h2>體力不足</h2>需要 ⚡${st.stam}，目前 ⚡${S.stam}。<br>體力每 ${CL.STAM_SEC} 秒回復 1 點。`,[['好',null]]);
   if(S.stam>=CL.STAM_MAX)S.stamT=Date.now();S.stam-=st.stam;save();startStage(i,{id,lv:flv,name:fn});};L.appendChild(d);});
 go('friend');}
// ---------- 隊伍 ----------
let selSlot=0;
function stat(c){const m=CL.lvMul(S.lv[c.id]);return `HP ${Math.round(c.hp*m)}　攻 ${Math.round(c.atk*m)}　回 ${Math.round(c.rcv*m)}`;}
function expBar(id){const lv=S.lv[id];if(lv>=CL.MAXLV)return '<div class="xb"><i style="width:100%"></i></div>';return `<div class="xb"><i style="width:${100*S.exp[id]/CL.expNeed(lv)}%"></i></div>`;}
function charInfo(c){return `<div class="n">${c.name} ${attrTag(c.attr)}${c.sub?'<small>副</small>'+attrTag(c.sub):''}</div><div>${c.title}</div><div>${stat(c)}</div><div><b class="k">隊長：</b>${c.lead.d}</div><div><b class="k">技能「${c.act.n}」</b>${c.act.d}（冷卻 ${c.act.cd}）</div>`;}
function renderTeam(){const T=$('#teamslots');T.innerHTML='';
 S.team.forEach((id,k)=>{const c=CL.CHMAP[id],d=document.createElement('div');d.className='slot'+(k==selSlot?' sel':'');d.style.borderColor=k==selSlot?'#fff':CL.ACOL[c.attr];d.style.animationDelay=(k*0.3)+'s';
  d.innerHTML=`<img src="img/${c.img}.webp" alt="">${k==0?'<span class="ld">隊長</span>':''}<span class="lv">Lv${S.lv[id]}</span>`;d.onclick=()=>{AU.sfx('tap');selSlot=k;renderTeam();};T.appendChild(d);});
 const ts=CL.teamStats(S.team,S.lv);$('#leadinfo').innerHTML=`<b class="k">隊長技：</b>${CL.CHMAP[S.team[0]].lead.d}<br>隊伍總 HP ${ts.hp}　總回復 ${Math.round(ts.rcv)}`;
 const L=$('#charlist'),sc=L.scrollTop;L.innerHTML='';
 CL.CHARS.forEach(c=>{const inT=S.team.indexOf(c.id),lv=S.lv[c.id],r=document.createElement('div');r.className='charrow'+(inT>=0?' inteam':'');
  const cost=CL.upCost(lv),max=lv>=CL.MAXLV;
  r.innerHTML=`<div class="ch" style="border-color:${CL.ACOL[c.attr]}"><img src="img/${c.img}.webp" alt=""><span class="lv">Lv${lv}</span></div>
  <div class="cinfo">${charInfo(c)}${expBar(c.id)}</div>
  <div class="cbtns"><button class="btn sm" data-a="set">${inT>=0?'第'+(inT+1)+'位':'編入'}</button><button class="btn sm" data-a="up" ${max||S.gold<cost?'disabled':''}>${max?'MAX':'升級<br>💰'+cost}</button></div>`;
  r.querySelector('.ch').onclick=()=>{AU.sfx('tap');modal(`<img class="rc big" src="img/${c.img}.webp"><div class="cinfo">${charInfo(c)}</div>`,[['關閉',null]]);};
  r.querySelector('[data-a=set]').onclick=()=>{AU.sfx('tap');const j=S.team.indexOf(c.id);if(j>=0){[S.team[j],S.team[selSlot]]=[S.team[selSlot],S.team[j]];}else S.team[selSlot]=c.id;save();renderTeam();};
  r.querySelector('[data-a=up]').onclick=()=>{if(max||S.gold<cost)return;S.gold-=cost;S.lv[c.id]++;S.exp[c.id]=0;save();AU.sfx('heal');$$('.g').forEach(e=>e.textContent=S.gold);renderTeam();};
  L.appendChild(r);});L.scrollTop=sc;}
// ---------- 特效引擎（Canvas + rAF） ----------
const fx=$('#fx'),X=fx.getContext('2d');let parts=[],objs=[],amb=[];
function resizeFx(){const r=app.getBoundingClientRect();fx.width=r.width*devicePixelRatio;fx.height=r.height*devicePixelRatio;}
const nP=n=>LOWFX()?Math.ceil(n/4):n;
function burst(x,y,col,n,sp,o){n=nP(n);for(let i=0;i<n;i++){const a=Math.random()*6.283,v=(0.5+Math.random())*(sp||4);parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,life:1,dec:0.022+Math.random()*0.01,col,r:2+Math.random()*4,g:(o&&o.g!=null)?o.g:0.12});}}
// 往目標飛的粒子（屬性珠 → 隊員頭像 / 回復 → HP 條）
function homing(x,y,tx,ty,col,n,delay){n=nP(n);for(let i=0;i<n;i++)parts.push({x:x+(Math.random()-.5)*20,y:y+(Math.random()-.5)*20,home:{tx,ty},t:-(delay||0)-i*0.02,vx:(Math.random()-.5)*6,vy:-2-Math.random()*4,life:1,dec:0,col,r:3+Math.random()*3});}
// 投射物：依屬性不同
function projectile(attr,x,y,tx,ty,dur){return new Promise(res=>{let done=false;const r2=()=>{if(!done){done=true;res();}};objs.push({kind:attr,x,y,tx,ty,t0:performance.now(),dur:dur||380,res:r2});setTimeout(r2,(dur||380)+600);});}
function frameObjs(now){const d=devicePixelRatio;objs=objs.filter(o=>{const p=Math.min(1,(now-o.t0)/o.dur);const col=CL.ACOL[o.kind]||'#fff';X.save();X.scale(d,d);X.globalCompositeOperation='lighter';
 const ex=o.x+(o.tx-o.x)*p,ey=o.y+(o.ty-o.y)*p-Math.sin(p*Math.PI)*40;
 if(o.kind=='fire'){for(let k=0;k<6;k++){const q=Math.max(0,p-k*0.04),fx2=o.x+(o.tx-o.x)*q,fy=o.y+(o.ty-o.y)*q-Math.sin(q*Math.PI)*40;X.globalAlpha=1-k/6;rad(fx2,fy,16-k*2,'#ffdd55','#ff3300');}if(!LOWFX())parts.push({x:ex,y:ey,vx:(Math.random()-.5),vy:-1,life:.6,dec:.04,col:'#ff7a20',r:3,g:-0.02});}
 else if(o.kind=='water'){const h=(o.ty-0)*p;X.globalAlpha=0.85;const g=X.createLinearGradient(o.tx-18,0,o.tx+18,0);g.addColorStop(0,'rgba(40,120,255,0)');g.addColorStop(.5,'#bfe8ff');g.addColorStop(1,'rgba(40,120,255,0)');X.fillStyle=g;X.fillRect(o.tx-22,o.ty-h-20,44,h+20);rad(o.x+(o.tx-o.x)*p,o.y+(o.ty-o.y)*p,10,'#e0f6ff','#2a7fff');}
 else if(o.kind=='wood'){X.strokeStyle='#5dff6a';X.lineWidth=5;X.shadowColor='#2f2';X.shadowBlur=12;X.beginPath();const N=24;for(let k=0;k<=N*p;k++){const q=k/N,vx=o.x+(o.tx-o.x)*q+Math.sin(q*14)*14*(1-q),vy=o.y+(o.ty-o.y)*q+Math.cos(q*11)*10;k?X.lineTo(vx,vy):X.moveTo(vx,vy);}X.stroke();}
 else if(o.kind=='light'){X.globalAlpha=1-p*0.3;X.strokeStyle='#fff6c0';X.lineWidth=8*(1-p)+3;X.shadowColor='#ffe066';X.shadowBlur=20;X.beginPath();X.moveTo(o.x,o.y);X.lineTo(o.x+(o.tx-o.x)*Math.min(1,p*1.6),o.y+(o.ty-o.y)*Math.min(1,p*1.6));X.stroke();}
 else if(o.kind=='dark'){rad(ex,ey,10,'#e8b0ff','#7a1cff');if(p>0.6){const q=(p-0.6)/0.4;X.strokeStyle='#d070ff';X.lineWidth=6*(1-q)+1;X.shadowColor='#a0f';X.shadowBlur=14;for(let s=-1;s<=1;s+=2){X.beginPath();X.arc(o.tx+s*10,o.ty,40,-1.2+s*0.3,-1.2+s*0.3+q*2.4);X.stroke();}}}
 else {rad(ex,ey,10,'#fff','#f8c');}
 if(!LOWFX()&&o.kind!='water'){const lx=o.kind=='light'?o.x+(o.tx-o.x)*Math.min(1,p*1.6):ex,ly=o.kind=='light'?o.y+(o.ty-o.y)*Math.min(1,p*1.6):ey;for(let k=0;k<2;k++)parts.push({x:lx+(Math.random()-.5)*8,y:ly+(Math.random()-.5)*8,vx:(Math.random()-.5)*1.5,vy:(Math.random()-.5)*1.5,life:.7,dec:.05,col,r:2+Math.random()*3,g:0});}
 X.restore();if(p>=1){o.res();return false;}return true;});}
function rad(x,y,r,c1,c2){const g=X.createRadialGradient(x,y,0,x,y,r*2);g.addColorStop(0,c1);g.addColorStop(.4,c2);g.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=g;X.beginPath();X.arc(x,y,r*2,0,6.283);X.fill();}
// 環境粒子（標題／地圖／隊伍畫面的火星與光塵）
function ambientStep(){if(curScreen=='battle'){amb.length=0;return;}const r=app.getBoundingClientRect();const max=LOWFX()?10:40;
 while(amb.length<max)amb.push({x:Math.random()*r.width,y:r.height+Math.random()*r.height*0.5,vy:-(0.3+Math.random()*0.8),vx:(Math.random()-.5)*0.3,r:1+Math.random()*2.5,ph:Math.random()*6,col:Math.random()<0.7?'#ff5a3a':'#ffd08a'});
 const d=devicePixelRatio;X.save();X.globalCompositeOperation='lighter';amb.forEach(a=>{a.y+=a.vy;a.ph+=0.03;a.x+=a.vx+Math.sin(a.ph)*0.3;if(a.y<-10){a.y=r.height+10;a.x=Math.random()*r.width;}X.globalAlpha=0.35+0.35*Math.sin(a.ph*2);X.fillStyle=a.col;X.beginPath();X.arc(a.x*d,a.y*d,a.r*d,0,6.283);X.fill();});X.restore();}
function loop(now){try{loopBody(now);}catch(err){logErr('loop',err);objs.forEach(o=>{try{o.res&&o.res();}catch(e){}});objs=[];parts.length=0;}requestAnimationFrame(loop);}
function loopBody(now){const d=devicePixelRatio;X.clearRect(0,0,fx.width,fx.height);ambientStep();X.globalCompositeOperation='lighter';
 parts=parts.filter(p=>p.life>0);parts.forEach(p=>{if(p.home){p.t+=0.03;if(p.t<0)return;const k=Math.min(1,p.t*p.t*1.3);p.x+=p.vx*(1-k)+(p.home.tx-p.x)*k*0.5;p.y+=p.vy*(1-k)+(p.home.ty-p.y)*k*0.5;p.vy+=0.1;if(Math.hypot(p.home.tx-p.x,p.home.ty-p.y)<8)p.life=0;if(p.t>1.6)p.life=0;}
  else{p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.life-=p.dec;}
  X.globalAlpha=Math.max(0,Math.min(1,p.life));const g=X.createRadialGradient(p.x*d,p.y*d,0,p.x*d,p.y*d,Math.max(0.5,(p.r||1)*d*2));g.addColorStop(0,'#fff');g.addColorStop(.35,p.col||'#fff');g.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=g;X.beginPath();X.arc(p.x*d,p.y*d,p.r*d*2,0,6.283);X.fill();});
 X.globalAlpha=1;frameObjs(now);}
requestAnimationFrame(loop);
function enImg(k){const d=$$('#enemies .en')[k];return d?d.querySelector('.eimg'):null;}
function rel(el){const a=app.getBoundingClientRect(),r=(el||app).getBoundingClientRect();return {x:r.left-a.left+r.width/2,y:r.top-a.top+r.height/2,w:r.width,h:r.height};}
function floatNum(x,y,txt,col,cls){const d=document.createElement('div');d.className='fnum'+(cls?' '+cls:'');d.innerHTML=txt;d.style.left=x+'px';d.style.top=y+'px';d.style.color=col;$('#floats').appendChild(d);setTimeout(()=>d.remove(),1300);}
function shake(big){if(!S.settings.shake)return;app.classList.remove('shake','shakebig');void app.offsetWidth;app.classList.add(big?'shakebig':'shake');}
function flashRed(){app.classList.remove('flashred');void app.offsetWidth;app.classList.add('flashred');setTimeout(()=>app.classList.remove('flashred'),450);}
function banner(html,cls,ms){const b=$('#banner');b.className='';b.innerHTML=html;void b.offsetWidth;b.className='show '+(cls||'');return wait(ms||1100).then(()=>{b.className='';});}
const wait=ms=>{if(B)B.lastAct=Date.now();return new Promise(r=>setTimeout(r,ms*(window.__fast||(S.settings.fast?0.5:1))));};
// ---------- 錯誤記錄與看門狗 ----------
const ERRLOG=[];function logErr(where,err){const m=`${new Date().toISOString()} [${where}] ${err&&err.stack?err.stack.split('\n').slice(0,3).join(' | '):String(err)}`;ERRLOG.push(m);if(ERRLOG.length>30)ERRLOG.shift();try{localStorage.setItem('crimson_errlog',JSON.stringify(ERRLOG));}catch(e){}console.warn(m);}
window.addEventListener('error',e=>logErr('window',e.error||e.message));window.addEventListener('unhandledrejection',e=>logErr('promise',e.reason));
let WD={recov:0};
function recoverTurn(why){logErr('watchdog',why);WD.recov++;drag=null;try{cancelAnimationFrame(tmr);}catch(e){}
 objs.forEach(o=>{try{o.res&&o.res();}catch(e){}});objs=[];$('#banner').className='';$$('.finisher,.bigcombo,.cutin').forEach(x=>x.remove());
 if(!B)return;if(!Array.isArray(B.board)||B.board.length!=30||B.board.some(o=>!o))B.board=CL.newBoard(rng);
 try{renderBoard();renderEnemies();updEnemies();updHP();updTeam();}catch(e){logErr('recover',e);}
 if(B.hp<=0){B.busy=false;lose();return;}
 if(B.en.every(e=>e.hp<=0)){B.busy=false;B.lastAct=Date.now();waveCleared().catch(e=>logErr('wave',e));return;}
 B.busy=false;B.lastAct=Date.now();}
const safe=(name,fn)=>async function(...a){try{return await fn.apply(this,a);}catch(err){logErr(name,err);recoverTurn(name+' 例外');}};
setInterval(()=>{if(!B||curScreen!='battle'||!B.busy||drag||B.ending)return;const ovs=['#vidov','#story'].some(s=>{const x=$(s);return x&&!x.classList.contains('hide');})||document.querySelector('.modal:not(.hide)');
 if(ovs){B.lastAct=Date.now();return;}if(Date.now()-(B.lastAct||Date.now())>9000)recoverTurn('回合卡住超過 9 秒');},1000);
// ---------- 戰鬥 ----------
let B=null;const rng=Math.random;
function startStage(i,friend){const st=CL.ALLST[i];friend=friend||{id:S.team[0],lv:S.lv[S.team[0]],name:'好友'};const ts=CL.teamStats(S.team,S.lv,friend);const ids=S.team.concat([friend.id]);
 B={i,st,ts,ids,friend,hp:ts.hp,wave:0,en:[],target:0,cds:ids.map(id=>Math.ceil(CL.CHMAP[id].act.cd*0.5)),shield:0,boost:null,board:CL.newBoard(rng),busy:true,active:true,turns:0,maxCombo:0,bind:0,tshr:0,cg:0,crimson:false};
 $('#field').style.backgroundImage=`url(img/${st.bg}.webp)`;$('#b-stage').textContent=st.name;$('#b-wx').textContent=st.wx&&st.wx!='none'?CL.WEATHER[st.wx].n:'';$('#b-wx').title=st.wx&&st.wx!='none'?CL.WEATHER[st.wx].d:'';updCrimson();go('battle');layout();renderTeamRow();updHP();renderBoard();nextWave().then(()=>{B.busy=false;});}
function nextWave(...a){return safe('nextWave',_nextWave)(...a);}
async function _nextWave(){B.en=CL.spawnWave(B.st,B.wave);B.target=0;$('#b-wave').textContent=`WAVE ${B.wave+1}/${B.st.waves.length}`;
 const isBoss=B.en.some(e=>e.boss);renderEnemies();AU.playBgm(isBoss?'boss':'battle');
 if(isBoss){$$('#enemies .en').forEach(e=>e.classList.add('entering'));AU.sfx('boss');vib([120,80,120,80,300]);shake(true);await banner('<div class="warn">WARNING</div><div class="wsub">強大的敵人接近中</div>','warning',1700);$$('#enemies .en').forEach(e=>{e.classList.remove('entering');e.classList.add('enter');});shake(true);await wait(700);}
 else if(B.wave>0){$$('#enemies .en').forEach(e=>e.classList.add('enter'));await banner(`WAVE ${B.wave+1}`,'wave',900);}
 else{$$('#enemies .en').forEach(e=>e.classList.add('enter'));await banner(`BATTLE START`,'wave',900);}
 // 先制攻擊
 const pre=CL.preempt(B.en,{board:B.board,rng});if(pre.length){await banner('先制攻擊！','pre',800);for(const a of pre)await enemyAct(a);updEnemies();if(B.hp<=0)return lose();}}
// 敵人排版：最多 5 隻（前排 3＋後排 2），頭目置中、護衛分站兩側
function slotsFor(en){const n=en.length,bi=en.findIndex(e=>e.boss);
 if(bi>=0){const out=[];const esc=en.map((e,k)=>k).filter(k=>k!=bi);out[bi]={x:50,w:n==1?78:58,b:0,z:3};
  const sp=esc.length==1?[[16,30]]:[[13,27],[87,27]];esc.forEach((k,j)=>{out[k]={x:sp[j][0],w:sp[j][1],b:4,z:2};});if(esc.length==1)out[esc[0]].x=bi==0?84:16;return out;}
 const T={1:[[50,56,0]],2:[[28,44,0],[72,44,0]],3:[[17,33,0],[50,33,0],[83,33,0]],4:[[29,40,26],[71,40,26],[16,34,0],[84,34,0]],5:[[30,38,26],[70,38,26],[17,34,0],[50,34,0],[83,34,0]]}[n]||[];
 return T.map(([x,w,b])=>({x,w,b,z:b?1:2,back:!!b}));}
function renderEnemies(){const E=$('#enemies');E.innerHTML='';const sl=slotsFor(B.en);
 B.en.forEach((e,k)=>{const d=document.createElement('div');d.className='en'+(e.boss?' boss':'')+(e.hp<=0?' dead':'')+(e.tier?' t'+e.tier:'')+(e.escort?' escort':'')+(sl[k].back?' back':'');
  const q=sl[k];d.style.left=(q.x-q.w/2)+'%';d.style.width=q.w+'%';d.style.bottom=q.b+'%';d.style.height=(q.back?66:(e.boss?100:76))+'%';d.style.zIndex=q.z;
  d.innerHTML=`<div class="cd">倒數 <b>${e.cd}</b></div><span class="tg">◎</span><span class="esh">🛡</span><span class="eab"></span><div class="eimg"><img src="img/${e.id}.webp" alt=""></div><div class="enm">${attrTag(e.attr)} ${e.name}</div><div class="ehp"><i></i><s></s></div>`;
  d.onclick=()=>{if(e.hp<=0||B.busy)return;AU.sfx('tap');if(B.target==k||B.en.filter(x=>x.hp>0).length==1)enemyInfo(e);else{B.target=k;updEnemies();}};E.appendChild(d);});updEnemies();}
const SKN={dabs:'傷害吸收（超過閾值的單擊無效）',conv:'變珠（6 顆變成自身屬性）',shield:'護盾（3 回合傷害減半）',poison:'毒珠（消除會扣 HP）',jam:'妨礙珠（無法攻擊）',bind:'封印（2 回合無法用技能）',time:'時間壓縮（2 回合轉珠時間縮短）',absorb:'屬性吸收（被剋屬性攻擊會回復它）',multi:'連續攻擊 ×3',big:'蓄力重擊 ×2',atk:'攻擊'};
function enemyInfo(e){const sk=(e.skills||[]).map(s=>SKN[s]).join('、')||'無';const ex=[e.enrage?'HP<30% 狂暴':'',e.resolve?'根性（致命一擊殘留 1 HP 一次）':'',e.part?'部位破壞（累積 25% 傷害後防禦歸零）':'',e.nsk?'特技：'+SKN[e.nsk]:''].filter(Boolean).join('<br>');
 modal(`<img class="rc big" src="img/${e.id}.webp"><h2>${e.name}</h2>${attrTag(e.attr)}<br>HP ${e.hp.toLocaleString()} / ${e.max.toLocaleString()}<br>攻擊 ${e.atk.toLocaleString()}　防禦 ${e.def.toLocaleString()}<br>行動倒數 ${e.cd}（每 ${e.cdMax} 回合）<br>${e.boss?'特殊技：'+sk+'<br>先制：'+(SKN[e.pre]||'無'):''}<br>${ex?ex+'<br>':''}<small>再點一次同一個敵人可查看資訊；點其他敵人可切換目標。</small>`,[['關閉',null]]);}
function updEnemies(){$$('#enemies .en').forEach((d,k)=>{const e=B.en[k];if(!e)return;d.classList.toggle('dead',e.hp<=0);d.classList.toggle('target',k==B.target&&B.en.filter(x=>x.hp>0).length>1);d.classList.toggle('shielded',e.shieldT>0);d.classList.toggle('raged',!!e.raged);d.classList.toggle('broken',!!(e.part&&e.part.broken));const ab=d.querySelector('.eab');if(ab){ab.style.display=e.absorbT>0&&e.absorbA?'block':'none';if(e.absorbA)ab.innerHTML=`吸收 ${attrTag(e.absorbA)}`;}
 const i=d.querySelector('.ehp i'),s=d.querySelector('.ehp s');const w=(100*e.hp/e.max)+'%';i.style.width=w;i.style.background=CL.ACOL[e.attr];setTimeout(()=>s.style.width=w,350);const c=d.querySelector('.cd');c.innerHTML=`倒數 <b>${e.cd}</b>`;c.classList.toggle('warn',e.cd<=1);});}
function renderTeamRow(){const R=$('#teamrow');R.innerHTML='';
 B.ids.forEach((id,k)=>{const c=CL.CHMAP[id],d=document.createElement('div');d.className='mem'+(k==5?' friend':'');d.style.borderColor=CL.ACOL[c.attr];
  d.innerHTML=`<img src="img/${c.img}.webp" alt="">${k==0?'<span class="tag">隊長</span>':''}${k==5?'<span class="tag f">好友</span>':''}${c.sub?`<i class="subd" style="background:${CL.ACOL[c.sub]}"></i>`:''}<span class="scd"></span><span class="dmg"></span>`;d.onclick=()=>skillPrompt(k);R.appendChild(d);});updTeam();}
function updTeam(){$$('#teamrow .mem').forEach((d,k)=>{const r=B.cds[k]<=0;d.classList.toggle('ready',r);d.querySelector('.scd').textContent=r?'技能OK':'CD'+B.cds[k];});}
function updHP(){const p=Math.max(0,B.hp)/B.ts.hp;$('#hpbar .fill').style.width=(p*100)+'%';$('#hpbar').classList.toggle('low',p<0.3);
 $('#hpbar .txt').textContent=`${Math.max(0,Math.round(B.hp)).toLocaleString()} / ${B.ts.hp.toLocaleString()}${B.shield>0?'　🛡減傷 '+B.shield:''}${B.boost?'　⚔強化中':''}${B.bind>0?'　⛓封印 '+B.bind:''}${B.tshr>0?'　⏳時間縮短 '+B.tshr:''}`;}
function updCrimson(){const g=$('#crimson');if(!g||!B)return;const p=Math.min(1,B.cg/30);g.querySelector('i').style.width=(p*100)+'%';g.classList.toggle('full',p>=1&&!B.crimson);g.classList.toggle('armed',B.crimson);g.querySelector('span').textContent=B.crimson?'緋紅之刻 發動中！':(p>=1?'緋紅之刻 點擊發動':`緋紅之刻 ${B.cg}/30`);}
$('#crimson').onclick=()=>{if(!B||B.busy||drag||B.cg<30||B.crimson)return;B.crimson=true;B.cg=0;AU.sfx('skill');vib([40,30,80]);updCrimson();banner('緋紅之刻<br><small>下次攻擊 ×2・全體攻擊</small>','crim',1000);};
function skillPrompt(k){if(!B||B.busy||drag)return;const id=B.ids[k],c=CL.CHMAP[id],a=c.act,r=B.cds[k]<=0&&!B.bind;AU.sfx('tap');const m=B.ts.mem[k];
 modal(`<img class="rc" src="img/${c.img}.webp"><h2>${a.n}</h2>${k==5?'【好友】'+B.friend.name+'・':''}${c.name}  Lv${m.lv} ${attrTag(c.attr)}${c.sub?'<small>副</small>'+attrTag(c.sub):''}<br>${a.d}<br><small>攻 ${Math.round(m.atk)}　回 ${Math.round(m.rcv)}<br>隊長技：${c.lead.d}</small><br>${r?'<b style="color:#ff0">可以發動！</b>':(B.bind?'<b style="color:#f88">技能被封印中（'+B.bind+' 回合）</b>':'冷卻中，還需 '+B.cds[k]+' 回合')}`,r?[['取消',null],['發動',()=>useSkill(k),'big']]:[['關閉',null]]);}
async function cutin(c,a){const ci=$('#cutin');ci.innerHTML=`<div class="cbg" style="--ac:${CL.ACOL[c.attr]}"></div><img src="img/${c.img}.webp" alt=""><div class="cname">${a.n}</div><div class="cwho">${c.name}</div>`;ci.className='';void ci.offsetWidth;ci.className='show';await wait(LOWFX()?500:1000);ci.className='';}
async function useSkill(k){const id=B.ids[k],c=CL.CHMAP[id],a=c.act,m=B.ts.mem[k];B.cds[k]=a.cd;B.busy=true;AU.sfx('skill');updTeam();
 await cutin(c,a);
 const p=rel($$('#teamrow .mem')[k]);burst(p.x,p.y,CL.ACOL[c.attr],40,6);
 if(a.t=='heal'||a.t=='refresh'){const h=Math.round(B.ts.hp*a.p);B.hp=Math.min(B.ts.hp,B.hp+h);AU.sfx('heal');const q=rel($('#hpbar'));homing(p.x,p.y,q.x,q.y,'#6f6',20);await wait(400);floatNum(q.x,q.y,'+'+h.toLocaleString(),'#7f7','heal');}
 if(a.t=='refresh'){B.board=CL.newBoard(rng);renderBoard();$$('#board .orb').forEach((o,j)=>{o.classList.add('spawn');o.style.animationDelay=(j%6*30+Math.floor(j/6)*30)+'ms';});}
 if(a.t=='conv'){B.board=B.board.map(o=>CL.base(o)==a.from?a.to:o);orbEls.forEach((o,j)=>{if(B.board[j]==a.to&&o.dataset.o!=a.to){o.dataset.o=a.to;o.querySelector('img').src=`img/orb_${a.to}.webp`;o.classList.add('spawn');const q=rel(o);burst(q.x,q.y,CL.ACOL[a.to],5,2);}});}
 if(a.t=='boost'){B.boost=B.boost||{};B.boost[a.a]=a.m;$$('#teamrow .mem').forEach((d,j)=>{if(B.ts.mem[j].attr==a.a){d.classList.add('boosted');const q=rel(d);burst(q.x,q.y,CL.ACOL[a.a],15,4);}});}
 if(a.t=='delay'){B.en.forEach((e,j)=>{if(e.hp>0){e.cd+=a.n2;const q=rel($$('#enemies .en')[j]);floatNum(q.x,q.y-40,'延遲 +'+a.n2,'#cdf');}});}
 if(a.t=='shield'){B.shield=a.n2;const q=rel($('#hpbar'));burst(q.x,q.y,'#9cf',30,4);}
 if(a.t=='dmgAll'||a.t=='dmgOne'){const tg=a.t=='dmgAll'?B.en.filter(e=>e.hp>0):[B.en[B.target]&&B.en[B.target].hp>0?B.en[B.target]:B.en.find(e=>e.hp>0)].filter(Boolean);
  await Promise.all(tg.map(e=>{const q=rel($$('#enemies .en')[B.en.indexOf(e)]);return projectile(a.a,p.x,p.y,q.x,q.y,420);}));shake(true);
  tg.forEach(e=>{if(!e)return;const adv=CL.advantage(a.a,e.attr);const d=CL.capHit(e,Math.round(m.atk*a.m*adv));e.hp=Math.max(0,e.hp-d);const el=$$('#enemies .en')[B.en.indexOf(e)];hitFx(el,a.a,d,adv,true);});AU.sfx('hit');}
 updEnemies();updTeam();updHP();await wait(500);await checkDeaths();B.busy=false;
 if(B.en.every(e=>e.hp<=0))await waveCleared();}
function hitFx(el,attr,d,adv,big){if(!el||!el.querySelector('.eimg'))return;const q=rel(el&&el.querySelector('.eimg'));burst(q.x,q.y,CL.ACOL[attr],adv>1?36:18,adv>1?6:4);
 floatNum(q.x+(Math.random()*40-20),q.y-10+(Math.random()*20-10),d.toLocaleString(),CL.ACOL[attr],(big||adv>1)?'big':'');
 if(adv>1)floatNum(q.x,q.y-q.h*0.35,'效果絕佳！','#ffe14a','great');else if(adv<1)floatNum(q.x,q.y-q.h*0.35,'效果不佳…','#bbb','poor');
 el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');}
function finisher(...a){return _finisher(...a);}
async function _finisher(total,combo,kill){const f=document.createElement('div');f.className='finisher';f.innerHTML=`<div class="fl"></div><div class="ft">${kill?'FINISH!!':'OVERDRIVE!'}</div><div class="fd">總傷害 ${total.toLocaleString()}</div>`;app.appendChild(f);
 AU.sfx('big');vib([50,30,120]);shake(true);const a=rel(app);for(let n=0;n<6;n++)setTimeout(()=>burst(a.w/2+(Math.random()-.5)*a.w*0.7,a.h*0.25+(Math.random()-.5)*a.h*0.2,['#fff','#ffd060','#ff4040'][n%3],34,8),n*70);
 await hitstop(140);await wait(800);f.remove();}
function checkDeaths(...a){return _checkDeaths(...a);}
async function _checkDeaths(){for(let k=0;k<B.en.length;k++){const e=B.en[k],el=$$('#enemies .en')[k];if(e.hp<=0&&!el.classList.contains('dying')&&!el.classList.contains('dead')){el.classList.add('dying');const q=rel(el&&el.querySelector('.eimg'));
  for(let s=0;s<(LOWFX()?1:3);s++)setTimeout(()=>burst(q.x+(Math.random()-.5)*q.w*0.6,q.y+(Math.random()-.5)*q.h*0.6,CL.ACOL[e.attr],30,5),s*120);burst(q.x,q.y,'#fff',20,7);AU.sfx('big');}}
 await wait(500);}
// ---------- 珠盤 ----------
let orbEls=[];
function pos(i){return [(i%6)*CELL,Math.floor(i/6)*CELL];}
function mkOrb(o,i){const d=document.createElement('div');d.className='orb';d.dataset.i=i;d.dataset.o=o;if(CL.isPlus(o))d.classList.add('plus');d.innerHTML=`<img src="img/orb_${CL.base(o)}.webp" alt="" draggable="false">`;const [x,y]=pos(i);d.style.transform=`translate(${x}px,${y}px)`;return d;}
function renderBoard(){const bd=$('#board');bd.innerHTML='';orbEls=B.board.map((o,i)=>{const d=mkOrb(o,i);bd.appendChild(d);return d;});}
let drag=null;const board=$('#board');let MOVE_MS=4000;
function cellAt(e){const r=board.getBoundingClientRect();let x=Math.floor((e.clientX-r.left)/CELL),y=Math.floor((e.clientY-r.top)/CELL);return {x:Math.max(0,Math.min(5,x)),y:Math.max(0,Math.min(4,y)),px:Math.max(0,Math.min(r.width,e.clientX-r.left)),py:Math.max(0,Math.min(r.height,e.clientY-r.top))};}
board.addEventListener('pointerdown',e=>{if(!B||B.busy||drag||curScreen!='battle')return;e.preventDefault();board.setPointerCapture&&board.setPointerCapture(e.pointerId);
 const c=cellAt(e),i=c.y*6+c.x;drag={id:e.pointerId,i,started:false,el:orbEls[i]};drag.el.classList.add('held');moveHeld(c);AU.sfx('tap');});
window.__swapLog=[];
board.addEventListener('pointermove',e=>{if(!drag||e.pointerId!=drag.id)return;e.preventDefault();const evs=e.getCoalescedEvents?e.getCoalescedEvents():[];(evs.length?evs:[e]).forEach(ev=>{if(drag)dragTo(cellAt(ev));});});
function dragTo(c){moveHeld(c);
 // 判定：手指進入相鄰格中心區域才換珠（含斜向）
 const cx=drag.i%6,cy=Math.floor(drag.i/6),fx2=c.px/CELL-0.5,fy=c.py/CELL-0.5;let guard=0;let gx=cx,gy=cy;
 while(guard++<12){const dx=fx2-gx,dy=fy-gy;if(Math.max(Math.abs(dx),Math.abs(dy))<0.62)break;const sx=Math.abs(dx)>0.38?Math.sign(dx):0,sy=Math.abs(dy)>0.38?Math.sign(dy):0;if(!sx&&!sy)break;
  const nx=gx+sx,ny=gy+sy;if(nx<0||ny<0||nx>5||ny>4)break;window.__swapLog.push([gy*6+gx,ny*6+nx]);swapTo(ny*6+nx);gx=nx;gy=ny;if(!drag)break;}}
function moveHeld(c){const h=CELL/2;c.px=Math.max(h,Math.min(CELL*6-h,c.px));c.py=Math.max(h,Math.min(CELL*5-h,c.py));drag.el.style.transform=`translate(${c.px-h}px,${c.py-h}px) scale(1.2)`;
 if(!LOWFX()){const r=rel(board);const col=CL.ACOL[CL.base(B.board[drag.i])]||'#fff';parts.push({x:r.x-r.w/2+c.px,y:r.y-r.h/2+c.py,vx:0,vy:0,life:0.7,dec:0.05,col,r:CELL*0.12,g:0});}}
function swapTo(j){const i=drag.i;if(!drag.started){drag.started=true;startTimer();}
 [B.board[i],B.board[j]]=[B.board[j],B.board[i]];vib(8);const other=orbEls[j];orbEls[j]=drag.el;orbEls[i]=other;other.dataset.i=i;drag.el.dataset.i=j;const [x,y]=pos(i);other.style.transform=`translate(${x}px,${y}px)`;drag.i=j;AU.sfx('swap');}
['pointerup','pointercancel'].forEach(ev=>board.addEventListener(ev,e=>{if(drag&&e.pointerId==drag.id)endDrag();}));
let tmr=null;
function startTimer(){MOVE_MS=B&&B.tshr>0?2400:4000;const f=$('#timer .fill'),t0=performance.now();cancelAnimationFrame(tmr);$('#timer').classList.add('run');
 const tick=()=>{if(!drag){return;}const left=MOVE_MS-(performance.now()-t0),p=left/MOVE_MS;f.style.transform=`scaleX(${Math.max(0,p)})`;$('#timer').classList.toggle('hurry',left<1200);if(p<=0){endDrag();return;}tmr=requestAnimationFrame(tick);};tick();}
function endDrag(){const d=drag;drag=null;if(!d)return;cancelAnimationFrame(tmr);$('#timer').classList.remove('run','hurry');$('#timer .fill').style.transform='scaleX(1)';d.el.classList.remove('held');const [x,y]=pos(d.i);d.el.style.transform=`translate(${x}px,${y}px)`;
 if(d.started)playTurn();}
// ---------- 回合 ----------
function comboCount(n){const c=$('#ccount');c.innerHTML=`<b>${n}</b><span>COMBO</span>`;c.className='';void c.offsetWidth;c.style.setProperty('--cs',Math.min(2.1,1+n*0.09));c.className='show'+(n>=5?' hot':'')+(n>=8?' blaze':'');}
function playTurn(...a){return safe('playTurn',_playTurn)(...a);}
async function _playTurn(){B.busy=true;B.turns++;const r=CL.resolveAll(B.board,rng);let combo=0;const mems=$$('#teamrow .mem');
 for(const st of r.steps){
  for(const g of st.groups){combo++;AU.sfx('match',combo);vib(Math.min(70,18+combo*5));let cx=0,cy=0;
   g.cells.forEach(c=>{const q=rel(orbEls[c]);cx+=q.x;cy+=q.y;burst(q.x,q.y,CL.ACOL[g.attr],6,3);orbEls[c].classList.add('pop');});
   cx/=g.cells.length;cy/=g.cells.length;comboCount(combo);
   // 屬性粒子飛向對應隊員；回復珠飛向 HP 條
   if(g.attr=='heal'){const q=rel($('#hpbar'));homing(cx,cy,q.x,q.y,'#5f8',10);}
   else B.ts.mem.forEach((m,k)=>{if(m.attr==g.attr||m.sub==g.attr){const q=rel(mems[k]);homing(cx,cy,q.x,q.y,CL.ACOL[g.attr],m.attr==g.attr?6:3);}});
   const shp={cross:'十字 ×2！',L:'L 字 全體！',line5:'一列5 貫通！'}[g.shape]||(g.n==4?'全體攻擊！':'');
   if(shp){const bw=rel(board),t=document.createElement('div');t.className='ctext';t.textContent=shp;t.style.left=(cx-bw.x+bw.w/2)+'px';t.style.top=(cy-bw.y+bw.h/2)+'px';$('#combo').appendChild(t);setTimeout(()=>t.remove(),900);}
   if(combo>=6&&combo%2==0)shake();await wait(200);}
  // 落下（天降）
  await wait(60);const bd=$('#board');bd.innerHTML='';const ne=new Array(30);const from={};st.moves.forEach(m=>{from[m.to*6+m.x]=m.from;});
  for(let i=0;i<30;i++){const o=st.after[i],d=mkOrb(o,i);const x=i%6,f=from[i];if(f!==undefined){d.style.transform=`translate(${x*CELL}px,${f*CELL}px)`;d.classList.add('fall');}bd.appendChild(d);ne[i]=d;}
  orbEls=ne;void bd.offsetWidth;for(let i=0;i<30;i++){const [x,y]=pos(i);ne[i].style.transform=`translate(${x}px,${y}px)`;}
  B.board=st.after;await wait(300);}
 B.board=r.board;if(combo>B.maxCombo)B.maxCombo=combo;
 if(combo>=5){const t=document.createElement('div');t.className='bigcombo';t.textContent=combo+' COMBO!!';app.appendChild(t);setTimeout(()=>t.remove(),1200);AU.sfx('big');shake();await wait(450);}
 if(!combo){B.busy=false;return enemyPhase();}
 // 全部消除完才結算攻擊
 const crim=B.crimson;B.crimson=false;const t=CL.calcTurn(B.ts,r.groups,{boost:B.boost,wx:B.st.wx,crimson:crim,hpR:B.hp/B.ts.hp});B.boost=null;B.cg=Math.min(30,B.cg+combo);updCrimson();
 if(crim){await banner('緋紅之刻！<br><small>傷害 ×2・全體攻擊</small>','crim',800);}
 if(t.res>1){await banner(`${t.attrs} 屬性共鳴！<br><small>攻擊 ×${t.res}</small>`,'res',700);}
 if(t.poison>0){const pd=Math.round(B.ts.hp*0.05*t.poison);B.hp-=pd;const q=rel($('#hpbar'));floatNum(q.x,q.y-20,'毒 -'+pd.toLocaleString(),'#c6f','big');flashRed();updHP();if(B.hp<=0){B.hp=1;updHP();}}$$('#teamrow .mem').forEach(d=>d.classList.remove('boosted'));
 mems.forEach(m=>m.querySelector('.dmg').textContent='');const tot={};t.atks.forEach(a=>{tot[a.slot]=(tot[a.slot]||0)+a.dmg;});
 t.atks.filter(a=>!a.sub).forEach(a=>{const s=mems[a.slot].querySelector('.dmg');s.textContent=tot[a.slot].toLocaleString();s.style.color=CL.ACOL[a.attr];s.classList.remove('pp');void s.offsetWidth;s.classList.add('pp');});
 if(combo>1){const q=rel(board);floatNum(q.x,q.y-q.h*0.1,`COMBO ×${(1+0.25*(combo-1)).toFixed(2)}${t.res>1?'　共鳴 ×'+t.res:''}`,'#ffe28a','mult');}
 if(t.heal>0){B.hp=Math.min(B.ts.hp,B.hp+t.heal);AU.sfx('heal');const q=rel($('#hpbar'));floatNum(q.x,q.y,'+'+t.heal.toLocaleString(),'#7f7','heal');$('#hpbar').classList.add('glow');setTimeout(()=>$('#hpbar').classList.remove('glow'),600);updHP();}
 await wait(350);
 const hits=CL.applyAttacks(t.atks,B.en,B.target);const bySlot={};hits.forEach(h=>{(bySlot[h.slot+'_'+h.sub]=bySlot[h.slot+'_'+h.sub]||[]).push(h);});
 for(const key in bySlot){const hs=bySlot[key],h0=hs[0],m=rel(mems[h0.slot]);AU.sfx('swap');
  await Promise.all(hs.map(h=>{const q=rel(enImg(h.enemy));return projectile(h.attr,m.x,m.y,q.x,q.y,h.sub?260:340);}));
  hs.forEach(h=>{const el=$$('#enemies .en')[h.enemy];if(!el)return;hitFx(el,h.attr,h.dmg,h.adv,!h.sub);const q=rel(el&&el.querySelector('.eimg'));if(h.absorb)floatNum(q.x,q.y-q.h*0.45,'吸收！','#7f7','great');if(h.dabs)floatNum(q.x,q.y-q.h*0.45,'傷害吸收！','#8cf','great');if(h.capped)floatNum(q.x,q.y-q.h*0.55,'傷害上限','#ccc','great');if(h.phase){floatNum(q.x,q.y-q.h*0.5,'第二形態！','#f6f','great');el.classList.add('phase2');}if(h.resolve)floatNum(q.x,q.y-q.h*0.45,'根性！','#fc6','great');if(h.brk){floatNum(q.x,q.y-q.h*0.5,'部位破壞！','#ff8040','great');burst(q.x,q.y,'#ff8040',40,7);}});AU.sfx('hit');const hard=hs.some(h=>h.adv>1)||combo>=6;
  vib(hard?40:20);if(hard)shake();updEnemies();if(!h0.sub)await hitstop(hard?90:45);await wait(LOWFX()?60:110);}
 const total=hits.reduce((a,h)=>a+h.dmg,0),kill=B.en.every(e=>e.hp<=0);
 if(!LOWFX()&&(combo>=5||kill&&B.en.some(e=>e.boss)||total>=20000))await finisher(total,combo,kill);
 await wait(250);mems.forEach(m=>m.querySelector('.dmg').textContent='');
 await checkDeaths();
 if(B.en.every(e=>e.hp<=0)){tickStatus();updTeam();await waveCleared();return;}
 if(B.en[B.target]&&B.en[B.target].hp<=0)B.target=B.en.findIndex(e=>e.hp>0);
 await enemyPhase();}
function tickStatus(){if(B.bind>0)B.bind--;else for(let k=0;k<B.ids.length;k++)if(B.cds[k]>0)B.cds[k]--;if(B.tshr>0)B.tshr--;updHP();}
function enemyPhase(...a){return safe('enemyPhase',_enemyPhase)(...a);}
async function _enemyPhase(){B.busy=true;tickStatus();updTeam();await wait(150);
 const acts=CL.enemyTurn(B.en,{shield:B.shield>0,board:B.board,rng});if(B.shield>0)B.shield--;updEnemies();
 for(const a of acts){await enemyAct(a);if(B.hp<=0)break;}
 updEnemies();updHP();if(B.hp<=0){B.busy=false;return lose();}B.busy=false;}
function enemyAct(...a){return _enemyAct(...a);}
async function _enemyAct(a){const el=$$('#enemies .en')[a.i]||document.createElement('div'),e=B.en[a.i]||{name:''};
 if(a.type=='dabs'){el.classList.add('cast');await banner(`${e.name}<br><small>傷害吸收！單擊超過 ${a.v.toLocaleString()} 的傷害無效（${a.turns} 回合）</small>`,'eskill',900);el.classList.remove('cast');}
 if(a.type=='enrage'){el.classList.add('cast');AU.sfx('boss');shake(true);await banner(`${e.name}<br><small>狂暴化！攻擊力大幅上升</small>`,'eskill',900);el.classList.remove('cast');updEnemies();return;}
 if(a.type=='bind'){B.bind=Math.max(B.bind,a.turns);el.classList.add('cast');await banner(`${e.name}<br><small>封印之鎖！${a.turns} 回合無法使用技能</small>`,'eskill',900);el.classList.remove('cast');updTeam();updHP();}
 if(a.type=='time'){B.tshr=Math.max(B.tshr,a.turns);el.classList.add('cast');await banner(`${e.name}<br><small>時之沙！${a.turns} 回合轉珠時間縮短</small>`,'eskill',900);el.classList.remove('cast');updHP();}
 if(a.type=='absorb'){el.classList.add('cast');await banner(`${e.name}<br><small>${CL.ANAME[a.attr]}屬性吸收！${a.turns} 回合</small>`,'eskill',900);el.classList.remove('cast');updEnemies();}
 if(a.type=='jam'||a.type=='poison'){a={...a,type:'conv',msg:a.type=='jam'?'妨礙珠出現！':'毒珠出現！'};}
 if(a.multi){el.classList.add('cast');await banner(`${e.name}<br><small>連續攻擊 ×${a.hits}！</small>`,'eskill',700);el.classList.remove('cast');}
 if(a.big){el.classList.add('cast');await banner(`${e.name}<br><small>蓄力重擊！</small>`,'eskill',700);el.classList.remove('cast');}
 if(a.type=='shield'){el.classList.add('cast');await banner(`${e.name}<br><small>展開護盾！3 回合傷害減半</small>`,'eskill',900);el.classList.remove('cast');updEnemies();}
 if(a.type=='conv'){el.classList.add('cast');await banner(`${e.name}<br><small>${a.msg||'詛咒之力！珠子被轉換'}</small>`,'eskill',800);el.classList.remove('cast');
  a.cells.forEach(j=>{const o=orbEls[j];o.dataset.o=a.to;o.classList.remove('plus');o.querySelector('img').src=`img/orb_${a.to}.webp`;o.classList.remove('spawn');void o.offsetWidth;o.classList.add('spawn');const q=rel(o);burst(q.x,q.y,'#a0f',8,3);});AU.sfx('skill');await wait(400);}
 if(!a.dmg)return;
 el.classList.remove('atk');void el.offsetWidth;el.classList.add('atk');await wait(260);
 B.hp-=a.dmg;AU.sfx('enemy');vib(a.strong?[90,40,160]:70);shake(a.strong);flashRed();const q=rel($('#hpbar'));floatNum(q.x,q.y-24,(a.strong?'強力一擊！ ':'')+(a.pre?'先制 ':'')+'-'+a.dmg.toLocaleString(),'#ff5555','big');updHP();await wait(380);}
function waveCleared(...a){return safe('waveCleared',_waveCleared)(...a);}
async function _waveCleared(){updEnemies();await wait(350);
 if(B.wave<B.st.waves.length-1){B.wave++;B.busy=true;await nextWave();if(B.hp>0)B.busy=false;}else win();}
// ---------- 結算 ----------
let pendingScene=null;
function win(){if(B.ending)return;B.ending=true;B.busy=true;const st=B.st,first=!S.cleared[st.i]||st.kind!='main',k=first?1:0.5;
 let g=Math.round(st.gold*k),xp=Math.round(st.exp*k);const drops=[];
 if(st.drop.chest)drops.push({t:'chest',v:Math.round(st.gold*0.5*k)});if(st.drop.egg)drops.push({t:'egg',v:Math.round(st.exp*0.5*k)});
 drops.forEach(d=>{if(d.t=='chest')g+=d.v;else xp+=d.v;});
 S.gold+=g;S.cleared[st.i]=true;if(drops.some(d=>d.t=='egg'))S.eggs=(S.eggs||0)+1;
 const ups=[];S.team.forEach(id=>{const before=S.lv[id];const u=CL.addExp(S.lv,S.exp,id,xp);if(u.length)ups.push([id,before,S.lv[id]]);});save();
 AU.playBgm('none');AU.sfx('win');vib([60,60,60,60,250]);const a=rel(app);for(let n=0;n<8;n++)setTimeout(()=>burst(Math.random()*a.w,Math.random()*a.h*0.6,['#f33','#fc3','#fff','#f6c'][n%4],40,7),n*120);shake();
 const nx=st.kind=='main'&&st.i+1<CL.NST;
 const dropHtml=drops.map((d,j)=>`<button class="drop" data-j="${j}"><img src="img/${d.t=='chest'?'chest':'egg'}.webp" alt=""><span>點擊開啟</span></button>`).join('');
 const memHtml=S.team.map(id=>{const c=CL.CHMAP[id],u=ups.find(x=>x[0]==id);return `<div class="rm"><img src="img/${c.img}.webp" alt="">${u?`<b class="lvup">LV UP!</b>`:''}<span>Lv${S.lv[id]}</span>${expBar(id)}</div>`;}).join('');
 modal(`<h2>${st.kind=='main'&&st.i==CL.NST-1?'🏆 全破！緋紅之夜終結':'STAGE CLEAR!'}</h2>${st.name}<br><small>回合數 ${B.turns}　最大 ${B.maxCombo} COMBO</small>
  <div class="res"><div>EXP <b>+${xp.toLocaleString()}</b></div><div>💰 <b>+${g.toLocaleString()}</b></div></div><div class="rmems">${memHtml}</div>
  <div class="drops">${dropHtml}</div><div class="dmsg"></div>${!first?'<small>重玩已通關的主線關卡，獎勵減半</small>':''}`,
  [['隊伍',()=>{teamBack='map';go('team');}],['關卡選擇',()=>go('map')]].concat(nx?[['下一關 ▶',()=>pickFriend(st.i+1),'big']]:[]));
 if(first&&st.kind=='main'&&!S.seen['clr'+st.i]){const ci=[7,15,23,31].indexOf(st.i);if(ci>=0||st.i==CL.NST-1){S.seen['clr'+st.i]=1;save();pendingScene=ci>=0?{cs:ci+1,ch:ci+1}:{end:1};}}
 $$('.drop').forEach(b=>b.onclick=()=>{if(b.classList.contains('open'))return;const d=drops[+b.dataset.j];b.classList.add('open');AU.sfx('big');const q=rel(b);
  if(d.t=='chest'){b.querySelector('img').src='img/chest_open.webp';burst(q.x,q.y,'#ffd84a',50,6);$('.dmsg').innerHTML+=`<div>寶箱：💰 +${d.v.toLocaleString()}（已計入）</div>`;}
  else{burst(q.x,q.y,'#ff4a6a',40,6);burst(q.x,q.y,'#fff',20,4);$('.dmsg').innerHTML+=`<div>怪物蛋孵化出經驗精靈：EXP +${d.v.toLocaleString()}（已計入）</div>`;}
  b.querySelector('span').textContent='已開啟';});
 if(ups.length)setTimeout(()=>AU.sfx('heal'),600);}
function lose(){if(B.ending)return;B.ending=true;B.busy=true;AU.playBgm('none');AU.sfx('lose');
 modal(`<h2 class="lose">全滅……</h2>${B.st.name}<br>到達 WAVE ${B.wave+1}<br>提示：特殊關卡「經驗神殿」「金幣洞窟」可快速升級；<br>剛好 4 顆相連可全體攻擊，利用屬性剋制：火→木→水→火、光⇄暗。`,[['隊伍',()=>{teamBack='map';go('team');}],['關卡選擇',()=>go('map')],['再挑戰',()=>pickFriend(B.i),'big']]);}
$('#b-pause').onclick=()=>{if(!B||B.busy)return;AU.sfx('tap');modal('<h2>暫停</h2>要放棄這場戰鬥嗎？<br><small>（已消耗的體力不會返還）</small>',[['繼續',null,'big'],['放棄',()=>go('map')]]);};
// ---------- 測試掛鉤（截圖用） ----------
window.G={WD:()=>WD,ERRLOG,recoverTurn,nextWave:()=>nextWave(),slotsFor,storyScene,playCut,setPending:p=>{pendingScene=p},VIBLOG,vib,finisher,S,go,startStage,pickFriend,get B(){return B},save,layout,playTurn,burst,homing,projectile,cutin:(k)=>{const c=CL.CHMAP[B.ids[k]];return cutin(c,c.act);},banner,useSkill,
 demoCombo:async()=>{B.board=['fire','fire','fire','water','water','water','wood','wood','wood','wood','light','light','dark','dark','dark','heal','heal','heal','fire','water','fire','water','fire','water','light','dark','light','dark','light','dark'];renderBoard();playTurn();}};
// ---------- 影片／劇情 ----------
function playCut(src,done){const ov=$('#vidov'),v=$('#vid');if(!src){done&&done();return;}AU.playBgm('none');window.__vidOn=1;
 ov.classList.remove('hide');v.src=src;v.muted=true;v.currentTime=0;if(AU.unlocked){v.muted=false;}$('#vidhint').textContent=v.muted?'🔊 點一下開啟聲音・再點一次跳過':'點擊跳過';let fin=false;let armed=!v.muted;
 const end=()=>{if(fin)return;fin=true;window.__vidOn=0;v.pause();ov.classList.add('hide');v.onended=null;ov.onclick=null;done&&done();};
 v.onended=end;ov.onclick=()=>{if(!armed){armed=true;v.muted=false;v.play().catch(()=>{});$('#vidhint').textContent='再點一次跳過';}else end();};
 const pr=v.play();if(pr&&pr.catch)pr.catch(()=>{v.muted=true;armed=false;$('#vidhint').textContent='🔊 點一下開啟聲音・再點一次跳過';v.play().catch(()=>{$('#vidhint').textContent='點擊播放／跳過';});});setTimeout(()=>{if(!fin&&v.paused&&v.currentTime==0){}},50);}
function storyScene(ch,done){const lines=ch<0?CL.ENDING:CL.STORY[ch];const ttl=ch<0?'終章　黎明':`第 ${ch+1} 章　${CL.CHAPTERS[ch].n}`;const ov=$('#story');let k=0;
 const bg=ch<0?CL.STAGES[CL.NST-1].bg:CL.STAGES[ch*CL.CHLEN].bg;ov.style.backgroundImage=`linear-gradient(rgba(10,0,4,.55),rgba(10,0,4,.85)),url(img/${bg}.webp)`;
 const show=()=>{ov.innerHTML=`<div class="sttl">${ttl}</div><div class="sline">${lines[k]}</div><div class="snext">${k<lines.length-1?'點擊繼續 ▼':'點擊結束'}</div>`;};
 ov.classList.remove('hide');show();ov.onclick=()=>{AU.sfx('tap');k++;if(k>=lines.length){ov.classList.add('hide');ov.onclick=null;done&&done();}else show();};}
$('#b-replay').onclick=()=>{AU.sfx('tap');playCut('vid/opening.mp4',()=>go('settings'));};
$('#t-fast').onclick=()=>{S.settings.fast=!S.settings.fast;save();applySettings();AU.sfx('tap');};
$('#b-fast').onclick=()=>{S.settings.fast=!S.settings.fast;save();applySettings();AU.sfx('tap');};
function renderPresets(){const P=$('#presets');if(!P)return;P.innerHTML='';S.presets.forEach((p,k)=>{const d=document.createElement('div');d.className='preset';
 d.innerHTML=`<b>編成 ${k+1}</b><span>${p?p.map(id=>`<img src="img/${CL.CHMAP[id].img}.webp">`).join(''):'（空）'}</span><button class="btn sm" data-a="s">儲存</button><button class="btn sm" data-a="l"${p?'':' disabled'}>讀取</button>`;
 d.querySelector('[data-a=s]').onclick=()=>{S.presets[k]=S.team.slice();save();AU.sfx('tap');renderPresets();};
 d.querySelector('[data-a=l]').onclick=()=>{if(!p)return;S.team=p.filter(id=>CL.CHMAP[id]).slice(0,5);if(S.team.length!=5)S.team=defaults().team;save();AU.sfx('tap');renderTeam();};P.appendChild(d);});}
{const _rt=renderTeam;renderTeam=function(){_rt();renderPresets();};}
// 標題影片：每個工作階段播放一次開場
(function(){const mv=$('#menuvid');if(mv){mv.muted=true;const p=mv.play();if(p&&p.catch)p.catch(()=>{});}
 let seen=false;try{seen=sessionStorage.getItem('crimson_op')=='1';}catch(e){}
 if(!seen&&!window.__noOpening){try{sessionStorage.setItem('crimson_op','1');}catch(e){}playCut('vid/opening.mp4',()=>{AU.playBgm('title');});}})();
applySettings();layout();go('title');
setTimeout(()=>{if(!AU.unlocked)$('#sndp').classList.remove('hide');},300);
})();
