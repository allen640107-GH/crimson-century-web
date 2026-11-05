// 緋紅世紀 — UI / 戰鬥
(function(){'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const app=$('#app');
// ---------- 存檔 ----------
const SKEY='crimson_save_v1';
function defaults(){return {v:1,gold:0,lv:{},team:['nora','lysera','marin','fiel','kain'],cleared:{},stars:{},settings:{fs:1,bgm:true,sfx:true,shake:true}};}
function merge(d,s){if(!s||typeof s!='object')return d;for(const k in s){if(d[k]&&typeof d[k]=='object'&&!Array.isArray(d[k]))d[k]=merge(d[k],s[k]);else if(s[k]!==undefined)d[k]=s[k];}return d;}
let S;try{S=merge(defaults(),JSON.parse(localStorage.getItem(SKEY)||'null'));}catch(e){S=defaults();}
CL.CHARS.forEach(c=>{if(!S.lv[c.id])S.lv[c.id]=1;});
if(!Array.isArray(S.team)||S.team.length!=5||S.team.some(id=>!CL.CHMAP[id]))S.team=defaults().team;
function save(){try{localStorage.setItem(SKEY,JSON.stringify(S));}catch(e){}}
save();
// ---------- 版面 ----------
let CELL=60;
function layout(){const vv=window.visualViewport;const H=Math.round(vv?vv.height:innerHeight),W=Math.min(Math.round(vv?vv.width:innerWidth),480);
 app.style.setProperty('--W',W+'px');app.style.setProperty('--H',H+'px');
 CELL=Math.floor(Math.min(W/6,(H*0.46)/5));document.body.style.setProperty('--cell',CELL+'px');app.style.setProperty('--cell',CELL+'px');
 const memH=Math.max(44,Math.min(W/5-3,(H*0.11)));app.style.setProperty('--memH',memH+'px');
 if(B&&B.board)renderBoard(true);window.scrollTo(0,0);resizeFx();}
addEventListener('resize',layout);if(window.visualViewport){visualViewport.addEventListener('resize',layout);visualViewport.addEventListener('scroll',()=>window.scrollTo(0,0));}
document.addEventListener('touchmove',e=>{if(!e.target.closest('.scroll'))e.preventDefault();},{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('dblclick',e=>e.preventDefault());
function applySettings(){document.body.style.setProperty('--fs',S.settings.fs);AU.set('bgm',S.settings.bgm);AU.set('sfx',S.settings.sfx);
 $$('#fsseg button').forEach(b=>b.classList.toggle('on',+b.dataset.v==S.settings.fs));
 [['bgm','#t-bgm'],['sfx','#t-sfx'],['shake','#t-shake']].forEach(([k,s])=>$(s).textContent=S.settings[k]?'開啟':'關閉');}
// ---------- 畫面切換 ----------
let curScreen='title',teamBack='map';
function go(n){$('#modal').classList.add('hide');if(B&&n!='battle')B.active=false;curScreen=n;$$('.screen').forEach(s=>s.classList.toggle('on',s.id=='sc-'+n));
 if(n=='map')renderMap();if(n=='team')renderTeam();if(n=='settings')applySettings();
 if(n=='title'||n=='map'||n=='team'||n=='settings')AU.playBgm('title');$$('.g').forEach(e=>e.textContent=S.gold);}
document.addEventListener('pointerdown',()=>{AU.unlock();if(AU.cur)AU.playBgm(AU.cur);},{capture:true});
$$('[data-go]').forEach(b=>b.onclick=()=>{AU.sfx('tap');if(b.dataset.go=='team')teamBack=curScreen;if(b.dataset.go=='settings')setBack=curScreen;go(b.dataset.go);});
let setBack='title';
$('#b-start').onclick=()=>{AU.sfx('tap');go('map');};
$('#b-team1').onclick=()=>{AU.sfx('tap');teamBack='title';go('team');};
$('#b-set1').onclick=()=>{AU.sfx('tap');setBack='title';go('settings');};
$('#b-teamback').onclick=()=>{AU.sfx('tap');go(teamBack);};
$('#b-setback').onclick=()=>{AU.sfx('tap');go(setBack);};
$$('#fsseg button').forEach(b=>b.onclick=()=>{S.settings.fs=+b.dataset.v;save();applySettings();layout();});
$('#t-bgm').onclick=()=>{S.settings.bgm=!S.settings.bgm;save();applySettings();};
$('#t-sfx').onclick=()=>{S.settings.sfx=!S.settings.sfx;save();applySettings();AU.sfx('tap');};
$('#t-shake').onclick=()=>{S.settings.shake=!S.settings.shake;save();applySettings();};
$('#b-reset').onclick=()=>modal('<h2>清除存檔？</h2>所有進度與等級將會重置。',[['取消',null],['清除',()=>{localStorage.removeItem(SKEY);S=defaults();CL.CHARS.forEach(c=>S.lv[c.id]=1);save();applySettings();go('title');}]]);
function modal(html,btns){$('#modal .mbody').innerHTML=html;const bb=$('#modal .mbtns');bb.innerHTML='';
 btns.forEach(([t,f,cls])=>{const b=document.createElement('button');b.className='btn'+(cls?' '+cls:'');b.textContent=t;b.onclick=()=>{AU.sfx('tap');$('#modal').classList.add('hide');f&&f();};bb.appendChild(b);});
 $('#modal').classList.remove('hide');}
const attrTag=a=>`<span class="attr" style="background:${CL.ACOL[a]}">${CL.ANAME[a]}</span>`;
// ---------- 關卡地圖 ----------
function unlocked(i){return i==0||S.cleared[i-1];}
function renderMap(){const L=$('#stagelist');L.innerHTML='';let ch=-1;
 CL.STAGES.forEach((st,i)=>{if(st.ch!=ch){ch=st.ch;const h=document.createElement('div');h.className='chap';h.textContent=`第 ${ch+1} 章　${CL.CHAPTERS[ch].n}`;L.appendChild(h);}
  const boss=st.waves[st.waves.length-1][0],b=document.createElement('button');b.className='stg'+(unlocked(i)?'':' lock');
  b.innerHTML=`<img src="img/${boss.id}.webp" alt=""><div><div class="nm">${st.name}</div><div class="ds">${st.waves.length} 波・BOSS ${boss.name} ${attrTag(CL.MON[boss.id].attr)}<br>獎勵 💰${st.gold}${S.cleared[i]?'（重玩 '+Math.round(st.gold/2)+'）':''}</div></div><div class="st">${S.cleared[i]?'★':(unlocked(i)?'▶':'🔒')}</div>`;
  b.onclick=()=>{AU.sfx('tap');if(!unlocked(i))return modal('請先通關前一關。',[['好',null]]);startStage(i);};L.appendChild(b);});
 const first=CL.STAGES.findIndex((s,i)=>!S.cleared[i]);if(first>2)setTimeout(()=>{const e=L.querySelectorAll('.stg')[first];e&&e.scrollIntoView({block:'center'});},0);}
// ---------- 隊伍 ----------
let selSlot=0;
function leadDesc(id){const c=CL.CHMAP[id];return `<b class="k">隊長技：</b>${c.lead.d}`;}
function stat(c){const m=CL.lvMul(S.lv[c.id]);return `HP ${Math.round(c.hp*m)}　攻 ${Math.round(c.atk*m)}　回 ${Math.round(c.rcv*m)}`;}
function renderTeam(){const T=$('#teamslots');T.innerHTML='';
 S.team.forEach((id,k)=>{const c=CL.CHMAP[id],d=document.createElement('div');d.className='slot'+(k==selSlot?' sel':'');d.style.borderColor=k==selSlot?'#fff':CL.ACOL[c.attr];
  d.innerHTML=`<img src="img/${c.img}.webp" alt="">${k==0?'<span class="ld">隊長</span>':''}<span class="lv">Lv${S.lv[id]}</span>`;d.onclick=()=>{AU.sfx('tap');selSlot=k;renderTeam();};T.appendChild(d);});
 const ts=CL.teamStats(S.team,S.lv);$('#leadinfo').innerHTML=`${leadDesc(S.team[0])}<br>隊伍總 HP ${ts.hp}　回復 ${Math.round(ts.rcv)}`;
 const L=$('#charlist'),sc=L.scrollTop;L.innerHTML='';
 CL.CHARS.forEach(c=>{const inT=S.team.indexOf(c.id),lv=S.lv[c.id],r=document.createElement('div');r.className='charrow'+(inT>=0?' inteam':'');
  const cost=CL.upCost(lv),max=lv>=CL.MAXLV;
  r.innerHTML=`<div class="ch" style="border-color:${CL.ACOL[c.attr]}"><img src="img/${c.img}.webp" alt=""><span class="lv">Lv${lv}</span></div>
  <div class="cinfo"><div class="n">${c.name} ${attrTag(c.attr)}</div><div>${c.title}</div><div>${stat(c)}</div><div><b class="k">隊長：</b>${c.lead.d}</div><div><b class="k">技能「${c.act.n}」</b>${c.act.d}（冷卻 ${c.act.cd}）</div></div>
  <div class="cbtns"><button class="btn sm" data-a="set">${inT>=0?'第'+(inT+1)+'位':'編入'}</button><button class="btn sm" data-a="up" ${max||S.gold<cost?'disabled':''}>${max?'MAX':'升級<br>💰'+cost}</button></div>`;
  r.querySelector('[data-a=set]').onclick=()=>{AU.sfx('tap');const j=S.team.indexOf(c.id);if(j>=0){[S.team[j],S.team[selSlot]]=[S.team[selSlot],S.team[j]];}else S.team[selSlot]=c.id;save();renderTeam();};
  r.querySelector('[data-a=up]').onclick=()=>{if(max||S.gold<cost)return;S.gold-=cost;S.lv[c.id]++;save();AU.sfx('heal');$$('.g').forEach(e=>e.textContent=S.gold);renderTeam();};
  L.appendChild(r);});L.scrollTop=sc;}
// ---------- 特效 ----------
const fx=$('#fx'),fctx=fx.getContext('2d');let parts=[],fxRun=false;
function resizeFx(){const r=app.getBoundingClientRect();fx.width=r.width*devicePixelRatio;fx.height=r.height*devicePixelRatio;}
function burst(x,y,col,n,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=(0.5+Math.random())*(sp||4);parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,life:1,col,r:2+Math.random()*4});}if(!fxRun){fxRun=true;requestAnimationFrame(fxLoop);}}
function fxLoop(){const d=devicePixelRatio;fctx.clearRect(0,0,fx.width,fx.height);fctx.globalCompositeOperation='lighter';
 parts=parts.filter(p=>p.life>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.life-=0.025;fctx.globalAlpha=Math.max(0,p.life);fctx.fillStyle=p.col;fctx.beginPath();fctx.arc(p.x*d,p.y*d,p.r*d*p.life+0.5,0,6.283);fctx.fill();});
 fctx.globalAlpha=1;if(parts.length)requestAnimationFrame(fxLoop);else{fxRun=false;fctx.clearRect(0,0,fx.width,fx.height);}}
function rel(el){const a=app.getBoundingClientRect(),r=el.getBoundingClientRect();return {x:r.left-a.left+r.width/2,y:r.top-a.top+r.height/2,w:r.width,h:r.height};}
function floatNum(x,y,txt,col,cls){const d=document.createElement('div');d.className='fnum'+(cls?' '+cls:'');d.textContent=txt;d.style.left=x+'px';d.style.top=y+'px';d.style.color=col;$('#floats').appendChild(d);setTimeout(()=>d.remove(),1000);}
function shake(){if(!S.settings.shake)return;app.classList.remove('shake');void app.offsetWidth;app.classList.add('shake');}
function flashRed(){app.classList.remove('flashred');void app.offsetWidth;app.classList.add('flashred');setTimeout(()=>app.classList.remove('flashred'),400);}
const wait=ms=>new Promise(r=>setTimeout(r,ms*(window.__fast||1)));
// ---------- 戰鬥 ----------
let B=null;const rng=Math.random;
function startStage(i){const st=CL.STAGES[i],ts=CL.teamStats(S.team,S.lv);
 B={i,st,ts,hp:ts.hp,wave:0,en:[],target:0,cds:S.team.map(id=>Math.ceil(CL.CHMAP[id].act.cd*0.5)),shield:0,board:CL.newBoard(rng),busy:false,active:true,turns:0,maxCombo:0};
 $('#field').style.backgroundImage=`url(img/${st.bg}.webp)`;$('#b-stage').textContent=st.name;go('battle');layout();renderTeamRow();updHP();renderBoard(true);nextWave(true);}
async function nextWave(first){B.en=CL.spawnWave(B.st,B.wave);B.target=0;$('#b-wave').textContent=`WAVE ${B.wave+1}/${B.st.waves.length}`;
 const isBoss=B.en.some(e=>e.boss);renderEnemies();AU.playBgm(isBoss?'boss':'battle');
 if(isBoss){const bn=$('#bossbanner');bn.textContent='⚠ BOSS ⚠';bn.classList.remove('show');void bn.offsetWidth;bn.classList.add('show');AU.sfx('boss');shake();await wait(900);}}
function renderEnemies(){const E=$('#enemies');E.innerHTML='';
 B.en.forEach((e,k)=>{const d=document.createElement('div');d.className='en'+(e.boss?' boss':'')+(e.hp<=0?' dead':'');
  d.innerHTML=`<div class="cd">倒數 ${e.cd}</div><span class="tg">◎</span><img src="img/${e.id}.webp" alt=""><div class="enm">${attrTag(e.attr)} ${e.name}</div><div class="ehp"><i></i></div>`;
  d.onclick=()=>{if(e.hp>0){B.target=k;AU.sfx('tap');updEnemies();}};E.appendChild(d);});updEnemies();}
function updEnemies(){$$('#enemies .en').forEach((d,k)=>{const e=B.en[k];d.classList.toggle('dead',e.hp<=0);d.classList.toggle('target',k==B.target&&B.en.filter(x=>x.hp>0).length>1);
 const i=d.querySelector('.ehp i');i.style.width=(100*e.hp/e.max)+'%';i.style.background=CL.ACOL[e.attr];const c=d.querySelector('.cd');c.textContent=`倒數 ${e.cd}`;c.classList.toggle('warn',e.cd<=1);});}
function renderTeamRow(){const R=$('#teamrow');R.innerHTML='';
 S.team.forEach((id,k)=>{const c=CL.CHMAP[id],d=document.createElement('div');d.className='mem';d.style.borderColor=CL.ACOL[c.attr];
  d.innerHTML=`<img src="img/${c.img}.webp" alt=""><span class="scd"></span><span class="dmg"></span>`;d.onclick=()=>skillPrompt(k);R.appendChild(d);});updTeam();}
function updTeam(){$$('#teamrow .mem').forEach((d,k)=>{const r=B.cds[k]<=0;d.classList.toggle('ready',r);d.querySelector('.scd').textContent=r?'技能OK':'CD'+B.cds[k];});}
function updHP(){const p=Math.max(0,B.hp)/B.ts.hp;$('#hpbar .fill').style.width=(p*100)+'%';$('#hpbar').classList.toggle('low',p<0.3);
 $('#hpbar .txt').textContent=`${Math.max(0,Math.round(B.hp))} / ${B.ts.hp}${B.shield>0?'　🛡減傷 '+B.shield:''}`;}
function skillPrompt(k){if(B.busy||drag)return;const c=CL.CHMAP[S.team[k]],a=c.act,r=B.cds[k]<=0;AU.sfx('tap');
 modal(`<img class="rc" src="img/${c.img}.webp"><h2>${a.n}</h2>${c.name}・${c.title}<br>${a.d}<br>${r?'<b style="color:#ff0">可以發動！</b>':'冷卻中，還需 '+B.cds[k]+' 回合'}`,r?[['取消',null],['發動',()=>useSkill(k),'big']]:[['關閉',null]]);}
async function useSkill(k){const c=CL.CHMAP[S.team[k]],a=c.act,m=B.ts.mem[k];B.cds[k]=a.cd;B.busy=true;AU.sfx('skill');
 const p=rel($$('#teamrow .mem')[k]);burst(p.x,p.y,CL.ACOL[c.attr],40,6);
 if(a.t=='heal'||a.t=='refresh'){const h=Math.round(B.ts.hp*a.p);B.hp=Math.min(B.ts.hp,B.hp+h);AU.sfx('heal');const q=rel($('#hpbar'));floatNum(q.x,q.y,'+'+h,'#7f7');}
 if(a.t=='refresh'){B.board=CL.newBoard(rng);renderBoard(true);}
 if(a.t=='conv'){B.board=B.board.map(o=>o==a.from?a.to:o);renderBoard(true);$$('#board .orb').forEach(o=>{const q=rel(o);if(B.board[+o.dataset.i]==a.to)burst(q.x,q.y,CL.ACOL[a.to],4,2);});}
 if(a.t=='delay'){B.en.forEach(e=>e.cd+=a.n2);}
 if(a.t=='shield')B.shield=a.n2;
 if(a.t=='dmgAll'||a.t=='dmgOne'){const tg=a.t=='dmgAll'?B.en.filter(e=>e.hp>0):[B.en[B.target]&&B.en[B.target].hp>0?B.en[B.target]:B.en.find(e=>e.hp>0)];
  shake();tg.forEach(e=>{if(!e)return;const d=Math.round(m.atk*a.m*CL.advantage(a.a,e.attr));e.hp=Math.max(0,e.hp-d);const el=$$('#enemies .en')[B.en.indexOf(e)],q=rel(el);burst(q.x,q.y,CL.ACOL[a.a],50,7);floatNum(q.x,q.y-20,d.toLocaleString(),CL.ACOL[a.a],'weak');el.classList.add('hit');setTimeout(()=>el.classList.remove('hit'),300);});AU.sfx('hit');}
 updEnemies();updTeam();updHP();await wait(500);B.busy=false;
 if(B.en.every(e=>e.hp<=0))await waveCleared();}
// ---------- 珠盤 ----------
let orbEls=[];
function pos(i){return [(i%6)*CELL,Math.floor(i/6)*CELL];}
function mkOrb(o,i){const d=document.createElement('div');d.className='orb';d.dataset.i=i;d.innerHTML=`<img src="img/orb_${o}.webp" alt="" draggable="false">`;const [x,y]=pos(i);d.style.transform=`translate(${x}px,${y}px)`;return d;}
function renderBoard(){const bd=$('#board');bd.innerHTML='';orbEls=B.board.map((o,i)=>{const d=mkOrb(o,i);bd.appendChild(d);return d;});}
let drag=null;
const board=$('#board');
function cellAt(e){const r=board.getBoundingClientRect();let x=Math.floor((e.clientX-r.left)/CELL),y=Math.floor((e.clientY-r.top)/CELL);return {x:Math.max(0,Math.min(5,x)),y:Math.max(0,Math.min(4,y)),px:e.clientX-r.left,py:e.clientY-r.top};}
board.addEventListener('pointerdown',e=>{if(!B||B.busy||drag||curScreen!='battle')return;e.preventDefault();board.setPointerCapture&&board.setPointerCapture(e.pointerId);
 const c=cellAt(e),i=c.y*6+c.x;drag={id:e.pointerId,i,started:false,t0:0,el:orbEls[i],moved:0};drag.el.classList.add('held');moveHeld(c);AU.sfx('tap');});
board.addEventListener('pointermove',e=>{if(!drag||e.pointerId!=drag.id)return;e.preventDefault();const c=cellAt(e);moveHeld(c);
 const ni=c.y*6+c.x;if(ni==drag.i)return;
 // 只允許相鄰（含斜向）交換；快速移動時沿途補步
 let guard=0;while(ni!=drag.i&&guard++<10){const cx=drag.i%6,cy=Math.floor(drag.i/6);const dx=Math.sign(c.x-cx),dy=Math.sign(c.y-cy);const step=(cy+dy)*6+(cx+dx);swapTo(step);}});
function moveHeld(c){const h=CELL/2;drag.el.style.transform=`translate(${c.px-h}px,${c.py-h}px) scale(1.15)`;}
function swapTo(j){const i=drag.i;if(!drag.started){drag.started=true;startTimer();}
 [B.board[i],B.board[j]]=[B.board[j],B.board[i]];const other=orbEls[j];orbEls[j]=drag.el;orbEls[i]=other;other.dataset.i=i;drag.el.dataset.i=j;const [x,y]=pos(i);other.style.transform=`translate(${x}px,${y}px)`;drag.i=j;AU.sfx('swap');}
['pointerup','pointercancel'].forEach(ev=>board.addEventListener(ev,e=>{if(drag&&e.pointerId==drag.id)endDrag();}));
let tmr=null;
function startTimer(){const f=$('#timer .fill'),T=5000,t0=performance.now();cancelAnimationFrame(tmr);
 const tick=()=>{if(!drag){f.style.transform='scaleX(1)';return;}const p=1-(performance.now()-t0)/T;f.style.transform=`scaleX(${Math.max(0,p)})`;if(p<=0){endDrag();return;}tmr=requestAnimationFrame(tick);};tick();}
function endDrag(){const d=drag;drag=null;cancelAnimationFrame(tmr);$('#timer .fill').style.transform='scaleX(1)';d.el.classList.remove('held');const [x,y]=pos(d.i);d.el.style.transform=`translate(${x}px,${y}px)`;
 if(d.started)playTurn();}
// ---------- 回合 ----------
const ATTRCOL=CL.ACOL;
async function playTurn(){B.busy=true;B.turns++;const r=CL.resolveAll(B.board,rng);let combo=0;
 for(const st of r.steps){
  for(const g of st.groups){combo++;g.cells.forEach(c=>orbEls[c]&&orbEls[c].classList.add('match'));await wait(90);
   AU.sfx('match',combo);let cx=0,cy=0;g.cells.forEach(c=>{const q=rel(orbEls[c]);cx+=q.x;cy+=q.y;burst(q.x,q.y,ATTRCOL[g.attr],7,3.5);orbEls[c].classList.add('pop');orbEls[c].style.transform+=' scale(1.6)';});
   cx/=g.cells.length;cy/=g.cells.length;const bw=rel(board),t=document.createElement('div');t.className='ctext';t.textContent=combo+' COMBO'+(g.row?'！橫排':'');t.style.left=(cx-bw.x+bw.w/2)+'px';t.style.top=(cy-bw.y+bw.h/2)+'px';$('#combo').appendChild(t);setTimeout(()=>t.remove(),900);
   if(combo>=4&&combo%2==0)shake();await wait(260);}
  // 落下
  await wait(80);const bd=$('#board');bd.innerHTML='';const ne=new Array(30);
  const from={};st.moves.forEach(m=>{from[m.to*6+m.x]=m.from;});
  for(let i=0;i<30;i++){const o=st.after[i],d=mkOrb(o,i);const x=i%6,f=from[i];if(f!==undefined){const fy=f*CELL;d.style.transform=`translate(${x*CELL}px,${fy}px)`;d.classList.add('fall');}bd.appendChild(d);ne[i]=d;}
  orbEls=ne;void bd.offsetWidth;for(let i=0;i<30;i++){const [x,y]=pos(i);ne[i].style.transform=`translate(${x}px,${y}px)`;}
  B.board=st.after;await wait(330);}
 B.board=r.board;
 if(combo>B.maxCombo)B.maxCombo=combo;
 if(combo>=5){const t=document.createElement('div');t.className='bigcombo';t.textContent=combo+' COMBO!!';app.appendChild(t);setTimeout(()=>t.remove(),1200);AU.sfx('big');shake();const a=rel(app);for(let k=0;k<6;k++)burst(Math.random()*a.w,a.h*0.4+Math.random()*a.h*0.3,['#f33','#fc3','#fff'][k%3],25,6);await wait(500);}
 const t=CL.calcTurn(B.ts,r.groups);
 // 隊員顯示傷害
 const mems=$$('#teamrow .mem');mems.forEach(m=>m.querySelector('.dmg').textContent='');
 t.atks.forEach(a=>{const s=mems[a.slot].querySelector('.dmg');s.textContent=a.dmg.toLocaleString();s.style.color=CL.ACOL[a.attr];});
 if(t.heal>0){B.hp=Math.min(B.ts.hp,B.hp+t.heal);AU.sfx('heal');const q=rel($('#hpbar'));floatNum(q.x,q.y,'+'+t.heal,'#7f7');updHP();}
 await wait(250);
 // 攻擊
 const hits=CL.applyAttacks(t.atks,B.en,B.target);
 for(const h of hits){const el=$$('#enemies .en')[h.enemy],q=rel(el),m=rel(mems[h.slot]);burst(m.x,m.y,CL.ACOL[h.attr],10,3);
  burst(q.x,q.y,CL.ACOL[h.attr],h.adv>1?40:20,h.adv>1?6:4);floatNum(q.x+(Math.random()*40-20),q.y-10,h.dmg.toLocaleString()+(h.adv>1?' 剋制!':h.adv<1?' ↓':''),CL.ACOL[h.attr],h.adv>1?'weak':'');
  el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');AU.sfx('hit');if(h.dmg>B.ts.hp*0.5||combo>=6)shake();updEnemies();await wait(170);}
 mems.forEach(m=>m.querySelector('.dmg').textContent='');
 for(let k=0;k<5;k++)if(B.cds[k]>0)B.cds[k]--;updTeam();
 if(B.en.every(e=>e.hp<=0)){await waveCleared();return;}
 if(B.en[B.target]&&B.en[B.target].hp<=0)B.target=B.en.findIndex(e=>e.hp>0);
 await wait(200);
 const atk=CL.enemyTurn(B.en,B.shield>0);if(B.shield>0)B.shield--;
 for(const a of atk){const el=$$('#enemies .en')[a.i];el.classList.remove('atk');void el.offsetWidth;el.classList.add('atk');await wait(220);
  B.hp-=a.dmg;AU.sfx('enemy');shake();flashRed();const q=rel($('#hpbar'));floatNum(q.x,q.y-24,(a.strong?'強力一擊！ ':'')+'-'+a.dmg,'#f55','weak');updHP();await wait(300);if(B.hp<=0)break;}
 updEnemies();updHP();
 if(B.hp<=0){B.busy=false;return lose();}
 B.busy=false;}
async function waveCleared(){updEnemies();await wait(450);
 if(B.wave<B.st.waves.length-1){B.wave++;B.busy=true;await nextWave();B.busy=false;}else win();}
function win(){B.busy=true;const first=!S.cleared[B.i];const g=first?B.st.gold:Math.round(B.st.gold/2);S.gold+=g;S.cleared[B.i]=true;save();AU.playBgm('none');AU.sfx('win');
 const a=rel(app);for(let k=0;k<8;k++)setTimeout(()=>burst(Math.random()*a.w,Math.random()*a.h*0.6,['#f33','#fc3','#fff','#f6c'][k%4],40,7),k*120);shake();
 const nx=B.i+1<20;const lead=CL.CHMAP[S.team[0]];
 modal(`<h2>${B.i==19?'🏆 全破！緋紅之夜終結':'STAGE CLEAR!'}</h2><img class="rc" src="img/${lead.img}.webp"><br>${B.st.name}<br>回合數 ${B.turns}　最大 ${B.maxCombo} COMBO<br><b style="color:#ffe28a;font-size:1.3em">獲得 💰 ${g}${first?'（首次通關）':''}</b><br>持有 💰 ${S.gold}　可到「隊伍」升級角色`,
  [['隊伍升級',()=>{teamBack='map';go('team');}],['關卡選擇',()=>go('map')]].concat(nx?[['下一關 ▶',()=>startStage(B.i+1),'big']]:[]));}
function lose(){B.busy=true;AU.playBgm('none');AU.sfx('lose');
 modal(`<h2 class="lose">全滅……</h2>${B.st.name}<br>到達 WAVE ${B.wave+1}<br>提示：重玩已通關的關卡可獲得金幣，升級角色後再挑戰！<br>也可以利用屬性剋制：火→木→水→火、光⇄暗。`,[['隊伍升級',()=>{teamBack='map';go('team');}],['關卡選擇',()=>go('map')],['再挑戰',()=>startStage(B.i),'big']]);}
$('#b-pause').onclick=()=>{if(!B||B.busy)return;AU.sfx('tap');modal('<h2>暫停</h2>要放棄這場戰鬥嗎？',[['繼續',null,'big'],['放棄',()=>go('map')]]);};
// ---------- 測試掛鉤（截圖用） ----------
window.G={S,go,startStage,get B(){return B},save,demoCombo:async()=>{B.board=['fire','fire','fire','water','water','water','wood','wood','wood','light','light','light','dark','dark','dark','heal','heal','heal','fire','fire','fire','water','water','water','wood','wood','wood','light','light','light'].slice(0,30);
  for(let y=0;y<5;y++)for(let x=0;x<6;x++){}renderBoard();playTurn();},layout};
applySettings();layout();go('title');
})();
