// 緋紅世紀 core logic (shared by game + simulation). Original content.
(function(root){
const COLS=6,ROWS=5,ATTRS=['fire','water','wood','light','dark','heal'];
const ANAME={fire:'火',water:'水',wood:'木',light:'光',dark:'暗',heal:'回復'};
const ACOL={fire:'#ff5a3c',water:'#4aa8ff',wood:'#4cd964',light:'#ffd84a',dark:'#c27bff',heal:'#ff7fc8'};
// 火剋木、木剋水、水剋火、光暗互剋
function advantage(a,d){if((a=='fire'&&d=='wood')||(a=='wood'&&d=='water')||(a=='water'&&d=='fire')||(a=='light'&&d=='dark')||(a=='dark'&&d=='light'))return 2;
 if((a=='wood'&&d=='fire')||(a=='water'&&d=='wood')||(a=='fire'&&d=='water'))return 0.5;return 1;}
const CHARS=[
 {id:'lysera',sub:'dark',name:'莉瑟拉',title:'緋焰劍姬',attr:'fire',img:'c_fire1',hp:520,atk:150,rcv:30,
  lead:{t:'attr',a:'fire',m:2.5,d:'火屬性攻擊力 2.5 倍'},act:{t:'dmgAll',a:'fire',m:12,cd:8,n:'緋紅斬',d:'對敵方全體造成攻擊力 12 倍的火屬性傷害'}},
 {id:'garen',sub:'wood',name:'葛倫',title:'赤狼拳士',attr:'fire',img:'c_fire2',hp:600,atk:135,rcv:20,
  lead:{t:'all',m:1.6,d:'全隊攻擊力 1.6 倍'},act:{t:'boost',a:'fire',m:2,turns:1,cd:7,n:'狼燄怒吼',d:'1 回合內火屬性攻擊力 2 倍'}},
 {id:'marin',sub:'light',name:'瑪琳',title:'蒼潮巫女',attr:'water',img:'c_water1',hp:480,atk:110,rcv:80,
  lead:{t:'attrRcv',a:'water',m:2,r:2,d:'水屬性攻擊力 2 倍、回復力 2 倍'},act:{t:'heal',p:0.5,cd:7,n:'潮汐祈願',d:'回復 50% 生命'}},
 {id:'sein',sub:'dark',name:'塞恩',title:'霜槍騎士',attr:'water',img:'c_water2',hp:620,atk:140,rcv:25,
  lead:{t:'attr',a:'water',m:2.5,d:'水屬性攻擊力 2.5 倍'},act:{t:'delay',n2:2,cd:9,n:'冰封之槍',d:'敵人攻擊倒數延後 2 回合'}},
 {id:'fiel',sub:'light',name:'菲兒',title:'翠羽弓手',attr:'wood',img:'c_wood1',hp:500,atk:140,rcv:40,
  lead:{t:'attr',a:'wood',m:2.5,d:'木屬性攻擊力 2.5 倍'},act:{t:'conv',from:'fire',to:'wood',cd:6,n:'森之箭雨',d:'火珠全部變成木珠'}},
 {id:'bark',sub:null,name:'巴克',title:'古樹守衛',attr:'wood',img:'c_wood2',hp:800,atk:100,rcv:50,
  lead:{t:'hpAttr',h:1.5,a:'wood',m:1.5,d:'全隊生命 1.5 倍、木屬性攻擊力 1.5 倍'},act:{t:'shield',n2:2,cd:8,n:'古樹之盾',d:'2 回合內受到的傷害減半'}},
 {id:'ed',sub:'fire',name:'艾德',title:'曙光聖騎',attr:'light',img:'c_light1',hp:560,atk:145,rcv:35,
  lead:{t:'attr',a:'light',m:2.5,d:'光屬性攻擊力 2.5 倍'},act:{t:'conv',from:'dark',to:'light',cd:6,n:'聖光轉換',d:'暗珠全部變成光珠'}},
 {id:'nora',sub:'water',name:'諾菈',title:'天輝修女',attr:'light',img:'c_light2',hp:460,atk:100,rcv:90,
  lead:{t:'combo',m:1.5,c:5,m2:3,d:'全隊攻擊力 1.5 倍，5 Combo 以上 3 倍'},act:{t:'refresh',p:0.2,cd:5,n:'天輝洗禮',d:'珠盤全部重整並回復 20% 生命'}},
 {id:'kain',sub:'fire',name:'凱因',title:'夜鴉刺客',attr:'dark',img:'c_dark1',hp:450,atk:165,rcv:15,
  lead:{t:'attr',a:'dark',m:2.5,d:'暗屬性攻擊力 2.5 倍'},act:{t:'dmgOne',a:'dark',m:25,cd:7,n:'影襲',d:'對單一敵人造成攻擊力 25 倍的暗屬性傷害'}},
 {id:'vela',sub:'water',name:'薇拉',title:'血月魔女',attr:'dark',img:'c_dark2',hp:420,atk:155,rcv:30,
  lead:{t:'all',m:2,h:0.8,d:'全隊攻擊力 2 倍、生命 0.8 倍'},act:{t:'conv',from:'heal',to:'dark',cd:7,n:'血月咒',d:'回復珠全部變成暗珠'}},
];
const CHMAP={};CHARS.forEach(c=>CHMAP[c.id]=c);
// ---- 成長：經驗值 ----
const MAXLV=30;
function lvMul(lv){return 1+0.08*(lv-1);}
function expNeed(lv){return Math.round(60*Math.pow(lv,1.55));} // lv -> lv+1
function upCost(lv){return 80+lv*60;} // 金幣直接升 1 級
function addExp(lvs,exps,id,x){const ups=[];exps[id]=(exps[id]||0)+x;let lv=lvs[id]||1;while(lv<MAXLV&&exps[id]>=expNeed(lv)){exps[id]-=expNeed(lv);lv++;ups.push(lv);}if(lv>=MAXLV)exps[id]=0;lvs[id]=lv;return ups;}
const MON={
 m_fire:{name:'熔岩魔像',attr:'fire'},m_fire2:{name:'炎鱗蜥',attr:'fire',cute:1},
 m_water:{name:'冰晶海妖',attr:'water'},m_water2:{name:'深海水母',attr:'water',cute:1},
 m_wood:{name:'古樹精',attr:'wood'},m_wood2:{name:'毒花藤魔',attr:'wood'},
 m_light:{name:'金翼聖獸',attr:'light',cute:1},m_light2:{name:'天使騎士',attr:'light'},
 m_dark:{name:'血月吸血鬼',attr:'dark'},m_dark2:{name:'骸骨巫妖',attr:'dark'},
 b_wood:{name:'千年魔樹王',attr:'wood'},b_water:{name:'深淵海皇',attr:'water'},b_fire:{name:'緋紅血龍',attr:'fire'},
 b_light:{name:'墮天熾天使',attr:'light'},b_dark:{name:'緋紅女帝',attr:'dark'},
};
const CHAPTERS=[{n:'緋霧森林',bg:'bg_forest'},{n:'沉沒神殿',bg:'bg_ruins'},{n:'熾焰荒原',bg:'bg_forest'},{n:'緋紅王城',bg:'bg_castle'}];
const BOSSES=['b_wood','b_wood','b_water','b_fire','b_wood', 'b_water','b_fire','b_light','b_dark','b_water', 'b_fire','b_light','b_water','b_wood','b_fire', 'b_light','b_water','b_dark','b_light','b_fire'];
const BOSSTITLE=['幼生','','','','王', '','','','影','', '','','','狂化','霸主', '','','','真','覺醒'];
const POOL=[['m_wood','m_wood2','m_fire2','m_water2','m_fire'],['m_water','m_water2','m_wood','m_dark2','m_light'],['m_fire','m_fire2','m_light2','m_wood2','m_light'],['m_dark','m_dark2','m_light2','m_water','m_fire']];
function mkRng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

// 關卡種類：main 主線 / gold 金幣洞窟 / exp 經驗神殿
function mkEnemy(id,hp,atk,cd,def,boss){return {id,hp:Math.round(hp),atk:Math.round(atk),cd,def:Math.round(def),boss:!!boss};}
const BOSSSKILL={b_wood:['conv','shield'],b_water:['shield','conv'],b_fire:['conv','shield'],b_light:['shield','conv'],b_dark:['conv','shield']};
function buildStage(i){ // 主線 i: 0..19
 const ch=Math.floor(i/5),r=mkRng(1000+i*77),pool=POOL[ch];
 const s=Math.pow(1.20,i),a=Math.pow(1.135,i),df=Math.pow(1.19,i); const waves=[];const nw=i<3?2:(i<10?3:4);
 for(let w=0;w<nw-1;w++){const cnt=1+Math.floor(r()*2)+(i>=8?1:0);const en=[];
  for(let k=0;k<Math.min(3,cnt);k++){const id=pool[Math.floor(r()*pool.length)];
   en.push(mkEnemy(id,260*s*(1+w*0.15),150*a,2+Math.floor(r()*2),8*df));}
  waves.push(en);}
 const bid=BOSSES[i];const nm=(BOSSTITLE[i]?BOSSTITLE[i]+'・':'')+MON[bid].name;
 const B=mkEnemy(bid,1500*s,340*Math.pow(1.15,i),i<5?3:(i%3==0?2:3),20*df,true);B.name=nm;
 B.pre=i<2?null:(i%2?'shield':'atk');B.skills=i<2?[]:BOSSSKILL[bid];
 waves.push([B]);
 return {i,kind:'main',name:`${i+1}. ${CHAPTERS[ch].n} ${['一','二','三','四','五'][i%5]}`,ch,bg:CHAPTERS[ch].bg,waves,gold:80+i*45,exp:Math.round(50*Math.pow(1.22,i)),stam:2+Math.floor(i/3),unlock:i==0?-1:i-1,drop:{egg:0.5,chest:0.5}};
}
const STAGES=[];for(let i=0;i<20;i++)STAGES.push(buildStage(i));
// 特殊關卡（可反覆遊玩）
const SPECIAL=[];
[['gold','金幣洞窟','m_light',['初級','中級','上級'],[3,8,14]],['exp','經驗神殿','m_water2',['初級','中級','上級'],[4,9,15]]].forEach(([kind,n,mid,lvn,unl],k)=>{
 lvn.forEach((ln,j)=>{const d=unl[j];const s=Math.pow(1.20,d),a=Math.pow(1.135,d),df=Math.pow(1.19,d);
  const waves=[[mkEnemy(mid,300*s,80*a,3,6*df),mkEnemy(mid,300*s,80*a,4,6*df)],[mkEnemy(mid,500*s,90*a,3,6*df)],[Object.assign(mkEnemy(kind=='gold'?'b_light':'b_water',1100*s,170*a,3,15*df,true),{name:(kind=='gold'?'黃金守護者':'智慧海靈'),pre:null,skills:[]})]];
  SPECIAL.push({i:100+k*10+j,kind,name:`${n}・${ln}`,ch:kind=='gold'?2:1,bg:kind=='gold'?'bg_castle':'bg_ruins',waves,
   gold:kind=='gold'?Math.round(400*Math.pow(1.6,j)):Math.round(60*Math.pow(1.5,j)),exp:kind=='exp'?Math.round(400*Math.pow(1.9,j)):Math.round(40*Math.pow(1.5,j)),stam:6+j*4,unlock:d,drop:kind=='gold'?{chest:1}:{egg:1}});});});
const ALLST={};STAGES.concat(SPECIAL).forEach(s=>ALLST[s.i]=s);
// 體力
function friendLv(cleared){return Math.min(30,1+Math.round(cleared*1.3));}
const STAM_MAX=50,STAM_SEC=90;
// ---- Board ----
function rndOrb(rng){return ATTRS[Math.floor(rng()*6)];}
function newBoard(rng){const b=[];for(let i=0;i<30;i++){let o,t=0;do{o=rndOrb(rng);t++;}while(t<20&&wouldMatch(b,i,o));b.push(o);}return b;}
function wouldMatch(b,i,o){const x=i%COLS,y=Math.floor(i/COLS);
 if(x>=2&&b[i-1]==o&&b[i-2]==o)return true;if(y>=2&&b[i-COLS]==o&&b[i-2*COLS]==o)return true;return false;}
function findGroups(b){const m=new Array(30).fill(false);
 for(let y=0;y<ROWS;y++)for(let x=0;x<=COLS-3;x++){const o=b[y*COLS+x];if(!o)continue;let n=1;while(x+n<COLS&&b[y*COLS+x+n]==o)n++;if(n>=3)for(let k=0;k<n;k++)m[y*COLS+x+k]=true;}
 for(let x=0;x<COLS;x++)for(let y=0;y<=ROWS-3;y++){const o=b[y*COLS+x];if(!o)continue;let n=1;while(y+n<ROWS&&b[(y+n)*COLS+x]==o)n++;if(n>=3)for(let k=0;k<n;k++)m[(y+k)*COLS+x]=true;}
 const seen=new Array(30).fill(false),groups=[];
 for(let i=0;i<30;i++){if(!m[i]||seen[i])continue;const o=b[i],st=[i],cells=[];seen[i]=true;
  while(st.length){const c=st.pop();cells.push(c);const x=c%COLS,y=Math.floor(c/COLS);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=COLS||ny>=ROWS)continue;const n=ny*COLS+nx;if(m[n]&&!seen[n]&&b[n]==o){seen[n]=true;st.push(n);}}}
  const rows={};cells.forEach(c=>{const y=Math.floor(c/COLS);rows[y]=(rows[y]||0)+1;});
  const fullRow=Object.values(rows).some(v=>v==COLS);
  groups.push({attr:o,cells,n:cells.length,row:fullRow});}
 return groups;}
function gravity(b,rng){const nb=b.slice(),moves=[];// moves: {to,from(-k means new)}
 for(let x=0;x<COLS;x++){let w=ROWS-1;for(let y=ROWS-1;y>=0;y--){const i=y*COLS+x;if(nb[i]){if(w!=y){nb[w*COLS+x]=nb[i];nb[i]=null;moves.push({x,from:y,to:w});}w--;}}
  let k=1;for(let y=w;y>=0;y--){nb[y*COLS+x]=rndOrb(rng);moves.push({x,from:-k,to:y,nw:true});k++;}}
 return {b:nb,moves};}
function resolveAll(b,rng){const steps=[];let cur=b.slice();
 for(let g=0;g<30;g++){const gs=findGroups(cur);if(!gs.length)break;const cl=cur.slice();gs.forEach(G=>G.cells.forEach(c=>cl[c]=null));
  const gr=gravity(cl,rng);steps.push({groups:gs,cleared:cl,after:gr.b,moves:gr.moves});cur=gr.b;}
 return {steps,board:cur,groups:steps.flatMap(s=>s.groups)};}
// ---- 隊伍數值與傷害 ----
// team: 5 ids；friend: {id,lv}|null。總 HP／回復力＝全隊加總；隊長技倍率＝自己×好友
function teamStats(team,lvs,friend){const leads=[CHMAP[team[0]].lead];if(friend)leads.push(CHMAP[friend.id].lead);
 const ids=team.map(id=>({id,lv:lvs[id]||1}));if(friend)ids.push({id:friend.id,lv:friend.lv,friend:true});
 let hp=0,rcv=0;const mem=ids.map(o=>{const c=CHMAP[o.id],m=lvMul(o.lv);let h=c.hp*m,r=c.rcv*m;
  leads.forEach(L=>{if(L.h)h*=L.h;if(L.t=='attrRcv'&&c.attr==L.a)r*=L.r;});hp+=h;rcv+=r;
  return {id:o.id,attr:c.attr,sub:c.sub,atk:c.atk*m,rcv:r,lv:o.lv,friend:!!o.friend};});
 return {hp:Math.round(hp),rcv,mem,leads,lead:leads[0]};}
function leadOne(L,attr,combo){let m=1;if((L.t=='attr'||L.t=='attrRcv'||L.t=='hpAttr')&&attr==L.a)m*=L.m;if(L.t=='all')m*=L.m;if(L.t=='combo')m*=combo>=L.c?L.m2:L.m;return m;}
function leadAtk(ts,attr,combo){return ts.leads.reduce((m,L)=>m*leadOne(L,attr,combo),1);}
// 回傳每位隊員的主／副屬性攻擊 {slot,attr,dmg,all,sub}
function calcTurn(ts,groups,boost){const combo=groups.length;const cm=1+(combo-1)*0.25;const per={},four={};let healBase=0;
 groups.forEach(g=>{const v=1+(g.n-3)*0.25;if(g.attr=='heal')healBase+=v;else{per[g.attr]=(per[g.attr]||0)+v;if(g.n==4)four[g.attr]=true;}});
 const atks=[];ts.mem.forEach((m,slot)=>{
  const one=(attr,isSub)=>{if(!per[attr])return;let d=m.atk*per[attr]*cm*leadAtk(ts,m.attr,combo);if(isSub)d*=(m.sub==m.attr?0.1:1/3);if(boost&&boost[attr])d*=boost[attr];
   atks.push({slot,attr,dmg:Math.round(d),all:!!four[attr],sub:isSub});};
  one(m.attr,false);if(m.sub)one(m.sub,true);});
 return {combo,atks,heal:Math.round(ts.rcv*healBase*cm)};}
function hitOne(a,e){let d=Math.round(a.dmg*advantage(a.attr,e.attr));d=Math.max(1,d-e.def);if(e.shieldT>0)d=Math.round(d*0.5);return Math.min(d,e.hp)>0?d:d;}
function applyAttacks(atks,enemies,target){const hits=[];
 for(const a of atks){const alive=enemies.filter(e=>e.hp>0);if(!alive.length)break;
  let tg;if(a.all)tg=alive;else{let t=enemies[target];if(!t||t.hp<=0)t=alive[0];tg=[t];}
  tg.forEach(t=>{const d=hitOne(a,t);t.hp=Math.max(0,t.hp-d);hits.push({slot:a.slot,enemy:enemies.indexOf(t),dmg:d,attr:a.attr,adv:advantage(a.attr,t.attr),all:a.all,sub:a.sub});});}
 return hits;}
function spawnWave(st,w){return st.waves[w].map(e=>{const M=MON[e.id];return {id:e.id,name:e.name||M.name,attr:M.attr,boss:!!e.boss,hp:e.hp,max:e.hp,atk:e.atk,def:e.def||0,cd:e.cd,cdMax:e.cd,count:0,pre:e.pre||null,skills:e.skills||[],shieldT:0};});}
// 先制攻擊：回傳動作
function preempt(enemies){const out=[];enemies.forEach((e,i)=>{if(e.hp<=0||!e.pre)return;if(e.pre=='atk')out.push({i,type:'atk',dmg:Math.round(e.atk*0.7),pre:true});if(e.pre=='shield'){e.shieldT=3;out.push({i,type:'shield',pre:true,turns:3});}});return out;}
// 敵人回合：倒數歸零時行動。頭目每 3 次行動：普通 → 特殊技（變珠／護盾）→ 強力一擊
function enemyTurn(enemies,shield,board,rng){const out=[];enemies.forEach((e,i)=>{if(e.hp<=0)return;if(e.shieldT>0)e.shieldT--;e.cd--;if(e.cd>0)return;e.cd=e.cdMax;e.count++;
  let d=e.atk,strong=false;const red=v=>shield?Math.round(v*0.5):v;
  if(e.boss&&e.skills.length&&e.count%3==2){const sk=e.skills[Math.floor(e.count/3)%e.skills.length];
   if(sk=='shield'){e.shieldT=3;out.push({i,type:'shield',turns:3,dmg:red(Math.round(d*0.5))});return;}
   if(sk=='conv'&&board){const idx=[];for(let k=0;k<30;k++)idx.push(k);const pick=[];for(let k=0;k<6;k++){const j=Math.floor((rng||Math.random)()*idx.length);pick.push(idx.splice(j,1)[0]);}
    const tgt=enemies[i].attr; pick.forEach(k=>board[k]=tgt);out.push({i,type:'conv',cells:pick,to:tgt,dmg:red(Math.round(d*0.5))});return;}}
  if(e.boss&&e.count%3==0){d=Math.round(d*1.6);strong=true;}
  out.push({i,type:'atk',dmg:red(d),strong});});return out;}
const API={COLS,ROWS,ATTRS,ANAME,ACOL,CHARS,CHMAP,MON,STAGES,SPECIAL,ALLST,CHAPTERS,MAXLV,STAM_MAX,STAM_SEC,friendLv,lvMul,expNeed,addExp,upCost,advantage,mkRng,newBoard,findGroups,gravity,resolveAll,teamStats,calcTurn,applyAttacks,spawnWave,enemyTurn,preempt,leadAtk};
if(typeof module!='undefined')module.exports=API;else root.CL=API;
})(this);
