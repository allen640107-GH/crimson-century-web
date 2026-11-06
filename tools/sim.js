// 模擬 v1.3：beam search 轉珠 AI（限制步數模擬時間），逐關推進並升級；含多敵波次、頭目技能、天候、共鳴、緋紅之刻
const L=require('../logic.js');const {COLS,ROWS}=L;
const MAXSTEP=+process.env.STEPS||(process.env.AVG?5:10), BEAM=+process.env.BEAM||(process.env.AVG?3:25), TRIALS=+process.env.TRIALS||12, ONLY=process.env.ONLY;
function evalBoard(b,want){const g=L.findGroups(b);let s=g.length*10;const at=new Set();g.forEach(x=>{s+=x.n*0.3+(want[x.attr]||0)+(x.n==4?want.four||0:0)+(x.shape?2:0);if(L.ATTRS.includes(x.attr)&&x.attr!='heal')at.add(x.attr);});return s+(at.size>=3?6:0);}
function bestPath(board,want,steps){let beam=[];for(let p=0;p<30;p++)beam.push({b:board,p,prev:-1,s:0});let best={b:board,s:evalBoard(board,want)};
 for(let d=0;d<steps;d++){const nx=[];for(const st of beam){const x=st.p%COLS,y=Math.floor(st.p/COLS);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=COLS||Y>=ROWS)continue;const q=Y*COLS+X;if(q==st.prev)continue;
   const b=st.b.slice();[b[q],b[st.p]]=[b[st.p],b[q]];const s=evalBoard(b,want);nx.push({b,p:q,prev:st.p,s});if(s>best.s)best={b,s};}}
  nx.sort((a,b)=>b.s-a.s);const seen=new Set();beam=[];for(const n of nx){const k=n.b.join()+n.p;if(seen.has(k))continue;seen.add(k);beam.push(n);if(beam.length>=BEAM)break;}}
 return best.b;}
function battle(st,team,lvs,friend,seed){const rng=L.mkRng(seed),ts=L.teamStats(team,lvs,friend);let hp=ts.hp,board=L.newBoard(rng);
 const ids=team.concat(friend?[friend.id]:[]);const cds=ids.map(id=>Math.ceil(L.CHMAP[id].act.cd*0.5));let shield=0,turns=0,boost=null,bind=0,tshr=0,cg=0;const base={};ts.mem.forEach(m=>{base[m.attr]=(base[m.attr]||0)+2;});
 const wxm=(L.WEATHER[st.wx]||L.WEATHER.none).m;
 let btBoss=0;for(let w=0;w<st.waves.length;w++){const en=L.spawnWave(st,w);
  const act=a=>{if(a.dmg)hp-=a.dmg;if(a.type=='bind')bind=Math.max(bind,a.turns);if(a.type=='time')tshr=Math.max(tshr,a.turns);};
  L.preempt(en,{board,rng}).forEach(act);if(hp<=0)return {win:false,turns};
  while(en.some(e=>e.hp>0)){turns++;if(en.some(e=>e.boss&&e.hp>0))btBoss++;if(turns>300){if(process.env.DBG)console.error("TIMEOUT",st.i+1,w,JSON.stringify(en.map(e=>[e.name,e.hp,e.def,e.absorbT])));return {win:false,turns};}boost=null;
   if(!bind)for(let k=0;k<ids.length;k++){if(cds[k]>0)continue;const a=L.CHMAP[ids[k]].act;let use=false;const bossOn=en.some(e=>e.boss&&e.hp>0);
    if(a.t=='heal')use=hp<ts.hp*0.5; else if(a.t=='dmgAll'||a.t=='dmgOne')use=bossOn||w<st.waves.length-1;
    else if(a.t=='conv'||a.t=='boost')use=bossOn||w<st.waves.length-1; else if(a.t=='delay'||a.t=='shield')use=en.some(e=>e.hp>0&&e.cd<=1&&e.atk>hp*0.25);
    else if(a.t=='refresh')use=hp<ts.hp*0.7||board.filter(o=>o=='jam'||o=='poison').length>=5;
    if(!use)continue;cds[k]=a.cd;const m=ts.mem[k];
    if(a.t=='heal')hp=Math.min(ts.hp,hp+ts.hp*a.p);
    if(a.t=='refresh'){board=L.newBoard(rng);hp=Math.min(ts.hp,hp+ts.hp*a.p);}
    if(a.t=='conv')board=board.map(o=>L.base(o)==a.from?a.to:o);
    if(a.t=='boost'){boost=boost||{};boost[a.a]=a.m;}
    if(a.t=='delay')en.forEach(e=>e.cd+=a.n2);if(a.t=='shield')shield=a.n2;
    if(a.t=='dmgAll')en.forEach(e=>{if(e.hp>0)e.hp=Math.max(0,e.hp-L.capHit(e,Math.round(m.atk*a.m*L.advantage(a.a,e.attr))))});
    if(a.t=='dmgOne'){const e=en.filter(e=>e.hp>0).sort((x,y)=>y.max-x.max)[0];if(e)e.hp=Math.max(0,e.hp-L.capHit(e,Math.round(m.atk*a.m*L.advantage(a.a,e.attr))));}}
   if(!en.some(e=>e.hp>0))break;
   const want=Object.assign({},base);for(const k in want)want[k]*=(wxm[k]||1);want.heal=hp<ts.hp*0.5?3:0;want.poison=-6;want.jam=-1;want.four=en.filter(e=>e.hp>0).length>=3?3:0;
   en.forEach(e=>{if(e.hp>0&&e.absorbT>0&&e.absorbA)want[e.absorbA]=-8;});
   board=bestPath(board,want,tshr>0?Math.max(3,MAXSTEP-3):MAXSTEP);const r=L.resolveAll(board,rng);board=r.board;
   const crim=cg>=30&&en.some(e=>e.boss&&e.hp>0);if(crim)cg=0;
   const t=L.calcTurn(ts,r.groups,{boost,wx:st.wx,crimson:crim,hpR:hp/ts.hp});cg+=t.combo;hp=Math.min(ts.hp,hp+t.heal)-Math.round(ts.hp*0.05*t.poison);
   let tg=0,mn=1e18;en.forEach((e,i)=>{if(e.hp>0&&e.hp<mn){mn=e.hp;tg=i}});L.applyAttacks(t.atks,en,tg);
   if(bind)bind--;else for(let k=0;k<ids.length;k++)if(cds[k]>0)cds[k]--;if(tshr)tshr--;
   if(!en.some(e=>e.hp>0))break;
   L.enemyTurn(en,{shield:shield>0,board,rng}).forEach(act);if(shield>0)shield--;if(hp<=0){if(process.env.DBG)console.error("LOSE st",st.i+1,"w",w,"turn",turns,JSON.stringify(en.map(e=>[e.name,e.hp,e.max,e.atk,e.def])));return {win:false,turns,wave:w};}
  }}
 return {win:true,turns,hpLeft:hp/ts.hp,bossT:btBoss};}
const team=(process.env.TEAM||'nora,lysera,marin').split(',');const lvs={},exps={};team.forEach(id=>lvs[id]=1);let gold=0,mats=40;let allOk=true;const rows=[];const STAT=[];const PASS=+process.env.PASS||0.75;
function test(st,friend){let wins=0,tt=0,hpl=0,bt=0;for(let t=0;t<TRIALS;t++){const r=battle(st,team,lvs,friend,7+t*131+st.i*9973);if(r.win){wins++;tt+=r.turns;hpl+=r.hpLeft;bt+=r.bossT||0;}}return {rate:wins/TRIALS,tt:tt/Math.max(1,wins),hpl:hpl/Math.max(1,wins),bt:bt/Math.max(1,wins)};}

const owned=new Set(team);
function maybeRecruit(i){L.RECRUIT.filter(r=>r.stage===i).forEach(r=>{if(owned.has(r.id))return;owned.add(r.id);lvs[r.id]=lvs[r.id]||Math.max(1,...[...owned].map(x=>lvs[x]||1));exps[r.id]=0;
  if(team.length<5)team.push(r.id);else{ // swap in lowest-lv member sometimes for variety
   const weak=team.slice().sort((a,b)=>(lvs[a]||1)-(lvs[b]||1))[0];
   if((lvs[r.id]||1)>=(lvs[weak]||1)){const ix=team.indexOf(weak);if(ix>=0)team[ix]=r.id;}
  }});}
function reward(st){team.forEach(id=>L.addExp(lvs,exps,id,st.exp+(st.drop.egg?Math.round(st.exp*0.5):0)));gold+=st.gold+(st.drop.chest?Math.round(st.gold*0.5):0);if(st.drop.egg)mats+=3;if(st.drop.chest)mats+=2;if(st.kind=="main")mats+=1+Math.floor(st.i/8);}
for(let i=0;i<L.NST;i++){const _sel=!ONLY||ONLY.split(',').map(Number).includes(i+1)||ONLY.split(',').map(Number).includes(i);const friend={id:team[0],lv:L.friendLv(i)};
 L.SPECIAL.filter(s=>s.unlock==i-1).forEach(s=>{const r=test(s,friend);rows.push(`  ${s.name} 勝率 ${(r.rate*100).toFixed(0)}%`);if(r.rate<0.75)allOk=false;reward(s);});
 const st=L.STAGES[i];if(!_sel){reward(st);maybeRecruit(i);let up0=true;while(up0){up0=false;const id=team.slice().sort((a,b)=>lvs[a]-lvs[b])[0];if(lvs[id]<L.MAXLV){const c=L.upCost(lvs[id]);if(gold>=c.gold&&mats>=c.mats){gold-=c.gold;mats-=c.mats;lvs[id]++;up0=true;}}}continue;}const r=test(st,friend);STAT.push({i,ch:st.ch,rate:r.rate,tt:r.tt,bt:r.bt,chB:i%L.CHLEN==L.CHLEN-1});
 rows.push(`關卡${String(i+1).padStart(2)} 勝率 ${(r.rate*100).toFixed(0).padStart(3)}%  平均回合 ${r.tt.toFixed(1).padStart(5)}  剩餘HP ${(r.hpl*100).toFixed(0).padStart(3)}%  頭目回合 ${r.bt.toFixed(1)}  敵數 ${st.waves.map(w=>w.length).join('-')} 隊伍Lv ${team.map(id=>lvs[id]).join(',')}`);
 if(r.rate<PASS)allOk=false;reward(st);maybeRecruit(i);
 let up=true;while(up){up=false;const id=team.slice().sort((a,b)=>lvs[a]-lvs[b])[0];if(lvs[id]<L.MAXLV){const c=L.upCost(lvs[id]);if(gold>=c.gold&&mats>=c.mats){gold-=c.gold;mats-=c.mats;lvs[id]++;up=true;}}}}
console.log(rows.join('\n'));const chs=[...new Set(STAT.map(s=>s.ch))];console.log('章 | 勝率均/最低 | 平均回合 | 頭目回合(一般) | 頭目回合(章末)');chs.forEach(c=>{const a=STAT.filter(s=>s.ch==c),n=a.filter(s=>!s.chB),b=a.filter(s=>s.chB),av=(x,k)=>x.length?(x.reduce((p,s)=>p+s[k],0)/x.length):0;
 console.log(`${c+1} | ${(av(a,'rate')*100).toFixed(0)}% / ${(Math.min(...a.map(s=>s.rate))*100).toFixed(0)}% | ${av(a,'tt').toFixed(1)} | ${av(n,'bt').toFixed(1)} (${Math.min(...n.map(s=>s.bt)).toFixed(1)}-${Math.max(...n.map(s=>s.bt)).toFixed(1)}) | ${av(b,'bt').toFixed(1)}`);});
console.log(allOk?'ALL PASS (每關勝率 ≥75%)':'SOME FAIL');
