// 緋紅世紀 core logic (shared by game + simulation). Original content.
(function(root){
const COLS=6,ROWS=5,ATTRS=['fire','water','wood','light','dark','heal'];
const ANAME={fire:'火',water:'水',wood:'木',light:'光',dark:'暗',heal:'回復'};
const ACOL={fire:'#ff5a3c',water:'#4aa8ff',wood:'#4cd964',light:'#ffd84a',dark:'#c27bff',heal:'#ff7fc8'};
// 火剋木、木剋水、水剋火、光暗互剋
function advantage(a,d){if((a=='fire'&&d=='wood')||(a=='wood'&&d=='water')||(a=='water'&&d=='fire')||(a=='light'&&d=='dark')||(a=='dark'&&d=='light'))return 2;
 if((a=='wood'&&d=='fire')||(a=='water'&&d=='wood')||(a=='fire'&&d=='water'))return 0.5;return 1;}
const CHARS=[
 {id:'lysera',name:'莉瑟拉',title:'緋焰劍姬',attr:'fire',img:'c_fire1',hp:520,atk:150,rcv:30,
  lead:{t:'attr',a:'fire',m:2.5,d:'火屬性攻擊力 2.5 倍'},act:{t:'dmgAll',a:'fire',m:12,cd:8,n:'緋紅斬',d:'對敵方全體造成攻擊力 12 倍的火屬性傷害'}},
 {id:'garen',name:'葛倫',title:'赤狼拳士',attr:'fire',img:'c_fire2',hp:600,atk:135,rcv:20,
  lead:{t:'all',m:1.6,d:'全隊攻擊力 1.6 倍'},act:{t:'conv',from:'wood',to:'fire',cd:6,n:'狼燄',d:'木珠全部變成火珠'}},
 {id:'marin',name:'瑪琳',title:'蒼潮巫女',attr:'water',img:'c_water1',hp:480,atk:110,rcv:80,
  lead:{t:'attrRcv',a:'water',m:2,r:2,d:'水屬性攻擊力 2 倍、回復力 2 倍'},act:{t:'heal',p:0.5,cd:7,n:'潮汐祈願',d:'回復 50% 生命'}},
 {id:'sein',name:'塞恩',title:'霜槍騎士',attr:'water',img:'c_water2',hp:620,atk:140,rcv:25,
  lead:{t:'attr',a:'water',m:2.5,d:'水屬性攻擊力 2.5 倍'},act:{t:'delay',n2:2,cd:9,n:'冰封之槍',d:'敵人攻擊倒數延後 2 回合'}},
 {id:'fiel',name:'菲兒',title:'翠羽弓手',attr:'wood',img:'c_wood1',hp:500,atk:140,rcv:40,
  lead:{t:'attr',a:'wood',m:2.5,d:'木屬性攻擊力 2.5 倍'},act:{t:'conv',from:'fire',to:'wood',cd:6,n:'森之箭雨',d:'火珠全部變成木珠'}},
 {id:'bark',name:'巴克',title:'古樹守衛',attr:'wood',img:'c_wood2',hp:800,atk:100,rcv:50,
  lead:{t:'hpAttr',h:1.5,a:'wood',m:1.5,d:'全隊生命 1.5 倍、木屬性攻擊力 1.5 倍'},act:{t:'shield',n2:2,cd:8,n:'古樹之盾',d:'2 回合內受到的傷害減半'}},
 {id:'ed',name:'艾德',title:'曙光聖騎',attr:'light',img:'c_light1',hp:560,atk:145,rcv:35,
  lead:{t:'attr',a:'light',m:2.5,d:'光屬性攻擊力 2.5 倍'},act:{t:'conv',from:'dark',to:'light',cd:6,n:'聖光轉換',d:'暗珠全部變成光珠'}},
 {id:'nora',name:'諾菈',title:'天輝修女',attr:'light',img:'c_light2',hp:460,atk:100,rcv:90,
  lead:{t:'combo',m:1.5,c:5,m2:3,d:'全隊攻擊力 1.5 倍，5 Combo 以上 3 倍'},act:{t:'refresh',p:0.2,cd:5,n:'天輝洗禮',d:'珠盤全部重整並回復 20% 生命'}},
 {id:'kain',name:'凱因',title:'夜鴉刺客',attr:'dark',img:'c_dark1',hp:450,atk:165,rcv:15,
  lead:{t:'attr',a:'dark',m:2.5,d:'暗屬性攻擊力 2.5 倍'},act:{t:'dmgOne',a:'dark',m:25,cd:7,n:'影襲',d:'對單一敵人造成攻擊力 25 倍的暗屬性傷害'}},
 {id:'vela',name:'薇拉',title:'血月魔女',attr:'dark',img:'c_dark2',hp:420,atk:155,rcv:30,
  lead:{t:'all',m:2,h:0.8,d:'全隊攻擊力 2 倍、生命 0.8 倍'},act:{t:'conv',from:'heal',to:'dark',cd:7,n:'血月咒',d:'回復珠全部變成暗珠'}},
];
const CHMAP={};CHARS.forEach(c=>CHMAP[c.id]=c);
const MAXLV=15;
function lvMul(lv){return 1+0.12*(lv-1);}
function upCost(lv){return 60+lv*70;}
// ---- Monsters / stages ----
const MON={
 m_fire:{name:'熔岩蜥',attr:'fire'},m_water:{name:'幽藍水母',attr:'water'},m_wood:{name:'荊棘曼陀',attr:'wood'},
 m_light:{name:'金輪哨衛',attr:'light'},m_dark:{name:'紫焰怨靈',attr:'dark'},
 b_wood:{name:'腐心古樹',attr:'wood'},b_water:{name:'深淵海后',attr:'water'},b_fire:{name:'熾鱗炎龍',attr:'fire'},
 b_light:{name:'墮光天使',attr:'light'},b_dark:{name:'緋紅女帝',attr:'dark'},
};
const CHAPTERS=[{n:'緋霧森林',bg:'bg_forest'},{n:'沉沒神殿',bg:'bg_ruins'},{n:'熾焰荒原',bg:'bg_forest'},{n:'緋紅王城',bg:'bg_castle'}];
const BOSSES=['b_wood','b_wood','b_water','b_fire','b_wood', 'b_water','b_fire','b_light','b_dark','b_water', 'b_fire','b_light','b_water','b_wood','b_fire', 'b_light','b_water','b_fire','b_light','b_dark'];
const BOSSTITLE=['幼生','','','','王', '','','','影','女王', '','','','狂化','霸主', '','','','熾天','真'];
const POOL=[['m_wood','m_fire','m_water'],['m_water','m_wood','m_dark'],['m_fire','m_light','m_wood'],['m_dark','m_light','m_fire','m_water']];
function mkRng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function buildStage(i){ // i: 0..19
 const ch=Math.floor(i/5),r=mkRng(1000+i*77),pool=POOL[ch];
 const s=Math.pow(1.20,i); const waves=[];const nw=i<3?2:(i<10?3:4);
 for(let w=0;w<nw-1;w++){const cnt=1+Math.floor(r()*2)+(i>=8?1:0);const en=[];
  for(let k=0;k<Math.min(3,cnt);k++){const id=pool[Math.floor(r()*pool.length)];
   en.push({id,hp:Math.round(260*s*(1+w*0.15)),atk:Math.round(95*Math.pow(1.135,i)),cd:2+Math.floor(r()*2)});}
  waves.push(en);}
 const bid=BOSSES[i];const nm=(BOSSTITLE[i]?BOSSTITLE[i]+'・':'')+MON[bid].name;
 waves.push([{id:bid,name:nm,boss:true,hp:Math.round(1500*s),atk:Math.round(210*Math.pow(1.14,i)),cd:i<5?3:(i%3==0?2:3)}]);
 return {i,name:`${i+1}. ${CHAPTERS[ch].n} ${['一','二','三','四','五'][i%5]}`,ch,bg:CHAPTERS[ch].bg,waves,gold:80+i*45};
}
const STAGES=[];for(let i=0;i<20;i++)STAGES.push(buildStage(i));
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
// ---- Team stats & damage ----
function teamStats(team,lvs){const L=CHMAP[team[0]].lead;let hp=0,rcv=0;const mem=team.map(id=>{const c=CHMAP[id],m=lvMul(lvs[id]||1);
  let h=c.hp*m,r=c.rcv*m;if(L.h)h*=L.h;if(L.t=='attrRcv')r*=L.r;hp+=h;rcv+=r;return {id,attr:c.attr,atk:c.atk*m,rcv:r};});
 return {hp:Math.round(hp),rcv,mem,lead:L};}
function leadAtk(L,attr,combo){let m=1;if(L.t=='attr'&&attr==L.a)m*=L.m;if(L.t=='attrRcv'&&attr==L.a)m*=L.m;if(L.t=='hpAttr'&&attr==L.a)m*=L.m;
 if(L.t=='all')m*=L.m;if(L.t=='combo')m*=combo>=L.c?L.m2:L.m;return m;}
// returns list of {slot,attr,dmg} raw (before enemy attribute) and heal
function calcTurn(ts,groups,boost){const combo=groups.length;const cm=1+(combo-1)*0.25;const per={};let healBase=0;
 groups.forEach(g=>{const v=(1+(g.n-3)*0.25)*(g.row?1.1:1);if(g.attr=='heal')healBase+=v;else per[g.attr]=(per[g.attr]||0)+v;});
 const atks=[];ts.mem.forEach((m,slot)=>{if(per[m.attr]){let d=m.atk*per[m.attr]*cm*leadAtk(ts.lead,m.attr,combo);if(boost&&boost[m.attr])d*=boost[m.attr];atks.push({slot,attr:m.attr,dmg:Math.round(d)});}});
 return {combo,atks,heal:Math.round(ts.rcv*healBase*cm)};}
function applyAttacks(atks,enemies,target){const hits=[];
 for(const a of atks){let tgt=enemies[target];if(!tgt||tgt.hp<=0)tgt=enemies.find(e=>e.hp>0);if(!tgt)break;
  const d=Math.round(a.dmg*advantage(a.attr,tgt.attr));tgt.hp=Math.max(0,tgt.hp-d);hits.push({slot:a.slot,enemy:enemies.indexOf(tgt),dmg:d,attr:a.attr,adv:advantage(a.attr,tgt.attr)});}
 return hits;}
function spawnWave(st,w){return st.waves[w].map(e=>{const M=MON[e.id];return {id:e.id,name:e.name||M.name,attr:M.attr,boss:!!e.boss,hp:e.hp,max:e.hp,atk:e.atk,cd:e.cd,cdMax:e.cd,count:0};});}
function enemyTurn(enemies,shield){const out=[];enemies.forEach((e,i)=>{if(e.hp<=0)return;e.cd--;if(e.cd<=0){e.count++;let d=e.atk;let strong=false;if(e.boss&&e.count%3==0){d=Math.round(d*1.6);strong=true;}
  if(shield)d=Math.round(d*0.5);out.push({i,dmg:d,strong});e.cd=e.cdMax;}});return out;}
const API={COLS,ROWS,ATTRS,ANAME,ACOL,CHARS,CHMAP,MON,STAGES,CHAPTERS,MAXLV,lvMul,upCost,advantage,mkRng,newBoard,findGroups,gravity,resolveAll,teamStats,calcTurn,applyAttacks,spawnWave,enemyTurn,leadAtk};
if(typeof module!='undefined')module.exports=API;else root.CL=API;
})(this);
