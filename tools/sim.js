// 模擬：AI 以 beam search 找轉珠路徑（限制步數模擬 5 秒），逐關推進並升級
const L=require('../logic.js');const {COLS,ROWS}=L;
const MAXSTEP=+process.env.STEPS||10, BEAM=+process.env.BEAM||25, TRIALS=+process.env.TRIALS||12;
function evalBoard(b,want){const g=L.findGroups(b);let s=g.length*10;g.forEach(x=>{s+=x.n*0.3+(want[x.attr]||0)});return s;}
function bestPath(board,want){let beam=[];for(let p=0;p<30;p++)beam.push({b:board,p,prev:-1,s:0});let best={b:board,s:evalBoard(board,want)};
 for(let d=0;d<MAXSTEP;d++){const nx=[];for(const st of beam){const x=st.p%COLS,y=Math.floor(st.p/COLS);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=COLS||Y>=ROWS)continue;const q=Y*COLS+X;if(q==st.prev)continue;
   const b=st.b.slice();[b[q],b[st.p]]=[b[st.p],b[q]];const s=evalBoard(b,want);nx.push({b,p:q,prev:st.p,s});if(s>best.s)best={b,s};}}
  nx.sort((a,b)=>b.s-a.s);const seen=new Set();beam=[];for(const n of nx){const k=n.b.join()+n.p;if(seen.has(k))continue;seen.add(k);beam.push(n);if(beam.length>=BEAM)break;}}
 return best.b;}
function battle(stIdx,team,lvs,seed){const rng=L.mkRng(seed),st=L.STAGES[stIdx],ts=L.teamStats(team,lvs);let hp=ts.hp,board=L.newBoard(rng);
 const cds=team.map(id=>L.CHMAP[id].act.cd);let shield=0,turns=0;const want={};ts.mem.forEach(m=>want[m.attr]=(want[m.attr]||0)+2);want.heal=0;
 for(let w=0;w<st.waves.length;w++){const en=L.spawnWave(st,w);
  while(en.some(e=>e.hp>0)){turns++;if(turns>300)return {win:false,turns};
   // actives
   for(let k=0;k<5;k++){if(cds[k]>0)continue;const a=L.CHMAP[team[k]].act;let use=false;
    if(a.t=='heal')use=hp<ts.hp*0.5; else if(a.t=='dmgAll'||a.t=='dmgOne')use=en.some(e=>e.boss&&e.hp>0)||w<st.waves.length-1;
    else if(a.t=='conv')use=true; else if(a.t=='delay'||a.t=='shield')use=en.some(e=>e.hp>0&&e.cd<=1&&e.atk>hp*0.3);
    else if(a.t=='refresh')use=hp<ts.hp*0.7;
    if(!use)continue;cds[k]=a.cd;const m=ts.mem[k];
    if(a.t=='heal')hp=Math.min(ts.hp,hp+ts.hp*a.p);
    if(a.t=='refresh'){board=L.newBoard(rng);hp=Math.min(ts.hp,hp+ts.hp*a.p);}
    if(a.t=='conv')board=board.map(o=>o==a.from?a.to:o);
    if(a.t=='delay')en.forEach(e=>e.cd+=a.n2);if(a.t=='shield')shield=a.n2;
    if(a.t=='dmgAll')en.forEach(e=>{if(e.hp>0)e.hp=Math.max(0,e.hp-Math.round(m.atk*a.m*L.advantage(a.a,e.attr)))});
    if(a.t=='dmgOne'){const e=en.find(e=>e.hp>0);if(e)e.hp=Math.max(0,e.hp-Math.round(m.atk*a.m*L.advantage(a.a,e.attr)));}}
   if(!en.some(e=>e.hp>0))break;
   board=bestPath(board,want);const r=L.resolveAll(board,rng);board=r.board;
   const t=L.calcTurn(ts,r.groups);hp=Math.min(ts.hp,hp+t.heal);
   // target: prefer enemy that our attacks are strong vs → just lowest hp alive
   let tg=0,mn=1e18;en.forEach((e,i)=>{if(e.hp>0&&e.hp<mn){mn=e.hp;tg=i}});L.applyAttacks(t.atks,en,tg);
   for(let k=0;k<5;k++)if(cds[k]>0)cds[k]--;
   const atk=L.enemyTurn(en,shield>0);if(shield>0)shield--;atk.forEach(a=>hp-=a.dmg);if(hp<=0)return {win:false,turns,wave:w};
  }}
 return {win:true,turns,hpLeft:hp/ts.hp};}
// 推進：預設隊伍、每關首通金幣 x2，金幣平均升級
const team=(process.env.TEAM||'nora,lysera,marin,fiel,kain').split(',');const lvs={};team.forEach(id=>lvs[id]=1);let gold=0;let allOk=true;const rows=[];
for(let i=0;i<20;i++){let wins=0,tt=0,hpl=0;for(let t=0;t<TRIALS;t++){const r=battle(i,team,lvs,7+t*131+i*9973);if(r.win){wins++;tt+=r.turns;hpl+=r.hpLeft;}}
 const rate=wins/TRIALS;rows.push(`關卡${String(i+1).padStart(2)} 勝率 ${(rate*100).toFixed(0).padStart(3)}%  平均回合 ${(tt/Math.max(1,wins)).toFixed(1)}  剩餘HP ${(hpl/Math.max(1,wins)*100).toFixed(0)}%  隊伍Lv ${team.map(id=>lvs[id]).join(',')}`);
 if(rate<0.75)allOk=false;
 gold+=L.STAGES[i].gold*2;let up=true;while(up){up=false;const id=team.slice().sort((a,b)=>lvs[a]-lvs[b])[0];if(lvs[id]<L.MAXLV&&gold>=L.upCost(lvs[id])){gold-=L.upCost(lvs[id]);lvs[id]++;up=true;}}}
console.log(rows.join('\n'));console.log(allOk?'ALL PASS (每關勝率 ≥75%)':'SOME FAIL');
