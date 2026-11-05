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
  lead:{t:'attrC',a:'fire',m:2.5,c:2,m2:3.5,d:'火屬性攻擊力 2.5 倍；火珠 2 Combo 以上時 3.5 倍'},act:{t:'dmgAll',a:'fire',m:12,cd:8,n:'緋紅斬',d:'對敵方全體造成攻擊力 12 倍的火屬性傷害'}},
 {id:'garen',sub:'wood',name:'葛倫',title:'赤狼拳士',attr:'fire',img:'c_fire2',hp:600,atk:135,rcv:20,
  lead:{t:'allRes',m:1.6,n:3,m2:2.5,d:'全隊攻擊力 1.6 倍；同時消除 3 種以上屬性時 2.5 倍'},act:{t:'boost',a:'fire',m:2,turns:1,cd:7,n:'狼燄怒吼',d:'1 回合內火屬性攻擊力 2 倍'}},
 {id:'marin',sub:'light',name:'瑪琳',title:'蒼潮巫女',attr:'water',img:'c_water1',hp:480,atk:110,rcv:80,
  lead:{t:'attrRcv',a:'water',m:2,r:2,d:'水屬性攻擊力 2 倍、回復力 2 倍'},act:{t:'heal',p:0.5,cd:7,n:'潮汐祈願',d:'回復 50% 生命'}},
 {id:'sein',sub:'dark',name:'塞恩',title:'霜槍騎士',attr:'water',img:'c_water2',hp:620,atk:140,rcv:25,
  lead:{t:'attrHp',a:'water',m:2.5,hp:0.8,m2:3.2,d:'水屬性攻擊力 2.5 倍；生命 80% 以上時 3.2 倍'},act:{t:'delay',n2:2,cd:9,n:'冰封之槍',d:'敵人攻擊倒數延後 2 回合'}},
 {id:'fiel',sub:'light',name:'菲兒',title:'翠羽弓手',attr:'wood',img:'c_wood1',hp:500,atk:140,rcv:40,
  lead:{t:'attrC',a:'wood',m:2.5,c:2,m2:3.5,d:'木屬性攻擊力 2.5 倍；木珠 2 Combo 以上時 3.5 倍'},act:{t:'conv',from:'fire',to:'wood',cd:6,n:'森之箭雨',d:'火珠全部變成木珠'}},
 {id:'bark',sub:null,name:'巴克',title:'古樹守衛',attr:'wood',img:'c_wood2',hp:800,atk:100,rcv:50,
  lead:{t:'hpAttr',h:1.5,a:'wood',m:1.5,d:'全隊生命 1.5 倍、木屬性攻擊力 1.5 倍'},act:{t:'shield',n2:2,cd:8,n:'古樹之盾',d:'2 回合內受到的傷害減半'}},
 {id:'ed',sub:'fire',name:'艾德',title:'曙光聖騎',attr:'light',img:'c_light1',hp:560,atk:145,rcv:35,
  lead:{t:'attrRes',a:'light',m:2.5,n:3,m2:3.2,d:'光屬性攻擊力 2.5 倍；同時消除 3 種以上屬性時 3.2 倍'},act:{t:'conv',from:'dark',to:'light',cd:6,n:'聖光轉換',d:'暗珠全部變成光珠'}},
 {id:'nora',sub:'water',name:'諾菈',title:'天輝修女',attr:'light',img:'c_light2',hp:460,atk:100,rcv:90,
  lead:{t:'combo',m:1.5,c:5,m2:3,d:'全隊攻擊力 1.5 倍，5 Combo 以上 3 倍'},act:{t:'refresh',p:0.2,cd:5,n:'天輝洗禮',d:'珠盤全部重整並回復 20% 生命'}},
 {id:'kain',sub:'fire',name:'凱因',title:'夜鴉刺客',attr:'dark',img:'c_dark1',hp:450,atk:165,rcv:15,
  lead:{t:'attrShape',a:'dark',m:2.5,m2:3.5,d:'暗屬性攻擊力 2.5 倍；以 4 顆／十字／L／五連消除時 3.5 倍'},act:{t:'dmgOne',a:'dark',m:25,cd:7,n:'影襲',d:'對單一敵人造成攻擊力 25 倍的暗屬性傷害'}},
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
 m_fire:{name:'熔岩魔像',attr:'fire'},m_fire2:{name:'炎鱗蜥',attr:'fire'},
 m_water:{name:'冰晶海妖',attr:'water'},m_water2:{name:'深海水母',attr:'water'},
 m_wood:{name:'古樹精',attr:'wood'},m_wood2:{name:'毒花藤魔',attr:'wood'},
 m_light:{name:'金翼聖獸',attr:'light'},m_light2:{name:'天使騎士',attr:'light'},
 m_dark:{name:'血月吸血鬼',attr:'dark'},m_dark2:{name:'骸骨巫妖',attr:'dark'},
 n_fire1:{name:'獄炎獵犬',attr:'fire'},n_fire2:{name:'熔鐵機兵',attr:'fire'},n_fire3:{name:'角焰魔',attr:'fire'},n_fire4:{name:'火苗精',attr:'fire'},
 n_water1:{name:'潮汐騎士',attr:'water'},n_water2:{name:'霜翼飛龍',attr:'water'},n_water3:{name:'深淵巨蛸',attr:'water'},n_water4:{name:'泡泡海豹',attr:'water'},
 n_wood1:{name:'荊棘狼',attr:'wood'},n_wood2:{name:'苔石魔像',attr:'wood'},n_wood3:{name:'藤骨弓兵',attr:'wood'},n_wood4:{name:'蘑菇仔',attr:'wood'},
 n_light1:{name:'鎧甲獅鷲',attr:'light'},n_light2:{name:'發條天使',attr:'light'},n_light3:{name:'金鬃獨角獸',attr:'light'},n_light4:{name:'星星貓',attr:'light'},
 n_dark1:{name:'死亡騎士',attr:'dark'},n_dark2:{name:'暗影石像鬼',attr:'dark'},n_dark3:{name:'收魂幽靈',attr:'dark'},n_dark4:{name:'蝙蝠小魔',attr:'dark'},
 b_wood:{name:'千年魔樹王',attr:'wood'},b_water:{name:'深淵海皇',attr:'water'},b_fire:{name:'緋紅血龍',attr:'fire'},b_light:{name:'墮天熾天使',attr:'light'},b_dark:{name:'緋紅女帝',attr:'dark'},
 b_fire2:{name:'焰獄魔神',attr:'fire'},b_fire3:{name:'熔核機甲龍',attr:'fire'},b_fire4:{name:'赤炎鳳凰皇',attr:'fire'},
 b_water2:{name:'冰霜女王',attr:'water'},b_water3:{name:'海嘯甲鯨',attr:'water'},b_water4:{name:'潮騎士王',attr:'water'},
 b_wood2:{name:'腐森九頭蛇',attr:'wood'},b_wood3:{name:'翡翠巨人',attr:'wood'},b_wood4:{name:'毒蛛女皇',attr:'wood'},
 b_light2:{name:'黃金機神',attr:'light'},b_light3:{name:'審判天使長',attr:'light'},b_light4:{name:'聖獅王',attr:'light'},
 b_dark2:{name:'骸骨龍王',attr:'dark'},b_dark3:{name:'深淵魔王',attr:'dark'},b_dark4:{name:'血月死神',attr:'dark'},
};
const TIERN=['','精英・','霸主・'],TIERB=['','覺醒・','霸主・'],TIERM=[1,1.6,2.5];
const CHAPTERS=[{n:'緋霧森林',bg:'bg_forest'},{n:'沉沒神殿',bg:'bg_ruins'},{n:'冰封之海',bg:'bg_ruins'},{n:'天空神殿',bg:'bg_castle'},{n:'緋紅王城',bg:'bg_castle'}];
const CHLEN=8,NST=40;
const STORY=[
 ['緋紅之月第一次升起的夜晚，森林被赤霧吞沒。','莉瑟拉：「魔物越來越多了……我們必須查清這片霧的源頭。」','瑪琳：「霧的深處，傳來龍的咆哮。」'],
 ['擊敗緋紅血龍後，王都卻在同一夜陷落。','艾德：「倖存者說，魔物從沉沒的古神殿湧出。」','凱因：「那就潛進去，把根拔起來。」'],
 ['神殿的壁畫指向北方——冰封之海。','塞恩：「寒冰之下封著某種東西，它正在甦醒。」','菲兒：「冰霜女王……傳說中守護封印的人，為何會成為敵人？」'],
 ['冰霜女王倒下前留下一句話：「天空的審判，已經開始。」','諾菈：「天空神殿……那裡曾是我修行的地方。」','巴克：「不論是誰在操縱，我們都會守住大家。」'],
 ['審判天使長只是傀儡，真正的主人在緋紅王城。','薇拉：「緋紅女帝……她想用月光把整個世紀染紅。」','莉瑟拉：「這是最後一戰。全員，出發！」'],
];
const ENDING=['緋紅女帝消散，赤月褪去，黎明再次照亮大地。','緋紅世紀終結——但英雄們的旅程，仍將繼續。'];
// 章節：普通怪池
const POOL=[
 ['m_wood','m_wood2','n_wood4','n_fire4','n_water4','n_wood1','m_fire2','n_light4'],
 ['m_water','m_water2','n_water1','n_water3','n_dark4','m_dark2','n_light2','n_wood3'],
 ['n_water2','n_water1','n_water4','n_fire1','n_fire2','m_fire','n_wood2','n_dark2'],
 ['n_light1','n_light2','n_light3','m_light','m_light2','n_fire3','n_dark3','n_wood1'],
 ['n_dark1','n_dark2','n_dark3','m_dark','n_fire3','n_light3','n_water2','n_wood2'],
];
// 每關頭目 [id,tier]；首次登場皆為不同種族，後段以 覺醒／霸主 強化型再登場
const BOSSES=[
 ['b_wood',0],['b_wood4',0],['b_fire4',0],['b_water4',0],['b_wood2',0],['b_fire2',0],['b_wood3',0],['b_fire',0],
 ['b_water',0],['b_water3',0],['b_dark2',0],['b_light4',0],['b_water4',1],['b_fire3',0],['b_dark4',0],['b_light',0],
 ['b_water3',1],['b_wood2',1],['b_fire4',1],['b_water',1],['b_dark2',1],['b_wood4',1],['b_fire2',1],['b_water2',0],
 ['b_light4',1],['b_light2',0],['b_fire3',1],['b_wood3',1],['b_dark4',1],['b_light',1],['b_fire',1],['b_light3',0],
 ['b_dark2',2],['b_light2',1],['b_water2',1],['b_dark3',0],['b_wood',2],['b_light3',1],['b_dark4',2],['b_dark',2],
];
// 頭目技能組（依種族）
const BSK={
 b_wood:['conv','big','shield'],b_wood2:['poison','multi','absorb'],b_wood3:['shield','big','jam'],b_wood4:['poison','bind','multi'],
 b_water:['absorb','big','conv'],b_water2:['time','conv','big'],b_water3:['shield','multi','jam'],b_water4:['multi','big','bind'],
 b_fire:['big','conv','multi'],b_fire2:['multi','absorb','big'],b_fire3:['jam','big','shield'],b_fire4:['conv','multi','time'],
 b_light:['bind','big','conv'],b_light2:['shield','jam','big'],b_light3:['time','bind','big','absorb'],b_light4:['multi','big','shield'],
 b_dark:['conv','bind','time','absorb','multi','big'],b_dark2:['poison','big','multi'],b_dark3:['absorb','jam','big','bind'],b_dark4:['multi','time','poison','big'],
};
const WEATHER={none:{n:'',m:{}},sun:{n:'☀ 烈日',d:'火屬性 ×1.3／水屬性 ×0.8',m:{fire:1.3,water:0.8}},rain:{n:'🌧 豪雨',d:'水屬性 ×1.3／火屬性 ×0.8',m:{water:1.3,fire:0.8}},
 wind:{n:'🍃 森風',d:'木屬性 ×1.3／光屬性 ×0.9',m:{wood:1.3,light:0.9}},aurora:{n:'✨ 極光',d:'光屬性 ×1.3／暗屬性 ×0.9',m:{light:1.3,dark:0.9}},fog:{n:'🌫 赤霧',d:'暗屬性 ×1.3／木屬性 ×0.9',m:{dark:1.3,wood:0.9}}};
const WXL=['none','sun','rain','wind','aurora','fog'];
function mkRng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function mkEnemy(id,hp,atk,cd,def,boss){return {id,hp:Math.round(hp),atk:Math.round(atk),cd,def:Math.round(def),boss:!!boss,tier:0};}
// 難度曲線：前期平緩、後期陡峭（玩家等級上限 30，後段以數量／技能／階級增加壓力）
function gH(i){return Math.pow(1.19,Math.min(i,20))*Math.pow(1.045,Math.max(0,i-20));}
function gA(i){return Math.pow(1.13,Math.min(i,20))*Math.pow(1.05,Math.max(0,i-20));}
function gD(i){return Math.pow(1.17,Math.min(i,20))*Math.pow(1.04,Math.max(0,i-20));}
function eHP(i){return 2900*lvMul(Math.min(30,1+0.78*i));}
function kA(i){return 0.18+0.34*Math.min(1,i/30);}
const NSK=['jam','poison','bind','time'];
function buildStage(i){
 const ch=Math.floor(i/CHLEN),r=mkRng(1000+i*77),pool=POOL[ch];
 const s=gH(i),a=gA(i),df=gD(i),waves=[];const nw=i<6?3:(i<20?4:5);
 for(let w=0;w<nw-1;w++){const lo=i<3?2:(i<10?2:3),hi=i<3?3:(i<10?4:5);const cnt=lo+Math.floor(r()*(hi-lo+1));const en=[];
  for(let k=0;k<cnt;k++){const id=pool[Math.floor(r()*pool.length)];const q=r();let t=0;
   if(q<Math.max(0,Math.min(0.22,(i-16)/90)))t=2;else if(q<Math.min(0.45,i/40))t=1;
   const tm=TIERM[t],af=1/(0.55+0.18*cnt);
   const e=mkEnemy(id,240*s*(1+w*0.12)*tm,eHP(i)*kA(i)/cnt*Math.pow(tm,0.3)*(1+w*0.04),2+Math.floor(r()*2),8*df*(t?1.3:1));e.tier=t;
   if(i>=10&&r()<Math.min(0.5,(i-8)/40)){e.nsk=NSK[Math.floor(r()*NSK.length)];}
   en.push(e);}
  waves.push(en);}
 const [bid,bt]=BOSSES[i];const tb=[1,1.25,1.5][bt];
 const B=mkEnemy(bid,2600*s*Math.pow(tb,0.6)*(i>=20?1.1:1),eHP(i)*(0.16+0.18*Math.min(1,i/30))*Math.pow(tb,0.3),i<5?3:(i%3==0?2:3),20*df,true);B.tier=bt;
 B.name=TIERB[bt]+MON[bid].name;B.pre=i<2?null:['atk','shield','jam','bind'][i%4];if(i<8&&B.pre=='bind')B.pre='atk';
 B.skills=i<1?[]:BSK[bid].slice(0,Math.min(BSK[bid].length,1+Math.floor(i/5)));B.enrage=i>=4;B.resolve=i>=12;B.part=i>=6;
 const bw=[B];const esc=i<4?0:(i<16?1:2);
 for(let k=0;k<esc;k++){const id=pool[Math.floor(r()*pool.length)],t=i>=24?2:1,tm=TIERM[t];const e=mkEnemy(id,200*s*tm,eHP(i)*kA(i)*0.22*Math.pow(tm,0.3),3,8*df*1.3);e.tier=t;e.escort=1;if(i>=14)e.nsk=NSK[(i+k)%4];bw.push(e);}
 if(esc==2)bw.splice(0,0,bw.pop());// 護衛排在兩側
 waves.push(bw);
 const wx=i<2?'none':WXL[Math.floor(r()*WXL.length)];
 return {i,kind:'main',name:`${i+1}. ${CHAPTERS[ch].n} ${['一','二','三','四','五','六','七','八'][i%CHLEN]}`,ch,bg:CHAPTERS[ch].bg,waves,wx,
  gold:80+i*45,exp:Math.round(50*Math.pow(1.2,Math.min(i,24))*Math.pow(1.05,Math.max(0,i-24))),stam:2+Math.floor(i/3),unlock:i==0?-1:i-1,drop:{egg:0.5,chest:0.5}};
}
const STAGES=[];for(let i=0;i<NST;i++)STAGES.push(buildStage(i));
const SPECIAL=[];
[['gold','金幣洞窟','n_light4',['初級','中級','上級'],[3,8,14]],['exp','經驗神殿','n_water4',['初級','中級','上級'],[4,9,15]]].forEach(([kind,n,mid,lvn,unl],k)=>{
 lvn.forEach((ln,j)=>{const d=unl[j];const s=Math.pow(1.20,d),a=Math.pow(1.135,d),df=Math.pow(1.19,d);
  const waves=[[mkEnemy(mid,300*s,80*a,3,6*df),mkEnemy(mid,300*s,80*a,4,6*df),mkEnemy(mid,300*s,80*a,3,6*df)],[mkEnemy(mid,500*s,90*a,3,6*df),mkEnemy(mid,500*s,90*a,4,6*df)],[Object.assign(mkEnemy(kind=='gold'?'b_light2':'b_water4',1100*s,170*a,3,15*df,true),{name:(kind=='gold'?'黃金守護者':'智慧海靈'),pre:null,skills:[]})]];
  SPECIAL.push({i:100+k*10+j,kind,name:`${n}・${ln}`,ch:kind=='gold'?2:1,bg:kind=='gold'?'bg_castle':'bg_ruins',waves,wx:'none',
   gold:kind=='gold'?Math.round(400*Math.pow(1.6,j)):Math.round(60*Math.pow(1.5,j)),exp:kind=='exp'?Math.round(400*Math.pow(1.9,j)):Math.round(40*Math.pow(1.5,j)),stam:6+j*4,unlock:d,drop:kind=='gold'?{chest:1}:{egg:1}});});});
const ALLST={};STAGES.concat(SPECIAL).forEach(s=>ALLST[s.i]=s);
function friendLv(cleared){return Math.min(30,1+Math.round(cleared*1.3));}
const STAM_MAX=50,STAM_SEC=90;
// ---- Board ----（珠：屬性字串；強化珠＝屬性+'+'；'jam' 廢珠；'poison' 毒珠）
const base=o=>o&&o.length>1&&o[o.length-1]=='+'?o.slice(0,-1):o;
const isPlus=o=>!!o&&o[o.length-1]=='+';
function rndOrb(rng){return ATTRS[Math.floor(rng()*6)];}
function fallOrb(rng){const o=rndOrb(rng);return rng()<0.07?o+'+':o;}
function newBoard(rng){const b=[];for(let i=0;i<30;i++){let o,t=0;do{o=rndOrb(rng);t++;}while(t<20&&wouldMatch(b,i,o));b.push(o);}return b;}
function wouldMatch(b,i,o){const x=i%COLS,y=Math.floor(i/COLS);
 if(x>=2&&base(b[i-1])==o&&base(b[i-2])==o)return true;if(y>=2&&base(b[i-COLS])==o&&base(b[i-2*COLS])==o)return true;return false;}
function shapeOf(cells){if(cells.length!=5)return null;const xs=cells.map(c=>c%COLS),ys=cells.map(c=>Math.floor(c/COLS));
 if(new Set(xs).size==1||new Set(ys).size==1)return 'line5';
 const set=new Set(cells);for(const c of cells){const x=c%COLS;let n=0;if(x>0&&set.has(c-1))n++;if(x<COLS-1&&set.has(c+1))n++;if(set.has(c-COLS))n++;if(set.has(c+COLS))n++;if(n==4)return 'cross';}
 const cx={},cy={};xs.forEach(v=>cx[v]=(cx[v]||0)+1);ys.forEach(v=>cy[v]=(cy[v]||0)+1);
 if(Object.values(cx).some(v=>v==3)&&Object.values(cy).some(v=>v==3))return 'L';return null;}
function findGroups(b){const m=new Array(30).fill(false),B=b.map(base);
 for(let y=0;y<ROWS;y++)for(let x=0;x<=COLS-3;x++){const o=B[y*COLS+x];if(!o)continue;let n=1;while(x+n<COLS&&B[y*COLS+x+n]==o)n++;if(n>=3)for(let k=0;k<n;k++)m[y*COLS+x+k]=true;}
 for(let x=0;x<COLS;x++)for(let y=0;y<=ROWS-3;y++){const o=B[y*COLS+x];if(!o)continue;let n=1;while(y+n<ROWS&&B[(y+n)*COLS+x]==o)n++;if(n>=3)for(let k=0;k<n;k++)m[(y+k)*COLS+x]=true;}
 const seen=new Array(30).fill(false),groups=[];
 for(let i=0;i<30;i++){if(!m[i]||seen[i])continue;const o=B[i],st=[i],cells=[];seen[i]=true;
  while(st.length){const c=st.pop();cells.push(c);const x=c%COLS,y=Math.floor(c/COLS);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=COLS||ny>=ROWS)continue;const n=ny*COLS+nx;if(m[n]&&!seen[n]&&B[n]==o){seen[n]=true;st.push(n);}}}
  const rows={};cells.forEach(c=>{const y=Math.floor(c/COLS);rows[y]=(rows[y]||0)+1;});
  const fullRow=Object.values(rows).some(v=>v==COLS);
  groups.push({attr:o,cells,n:cells.length,row:fullRow,shape:shapeOf(cells),plus:cells.filter(c=>isPlus(b[c])).length});}
 return groups;}
function gravity(b,rng){const nb=b.slice(),moves=[];
 for(let x=0;x<COLS;x++){let w=ROWS-1;for(let y=ROWS-1;y>=0;y--){const i=y*COLS+x;if(nb[i]){if(w!=y){nb[w*COLS+x]=nb[i];nb[i]=null;moves.push({x,from:y,to:w});}w--;}}
  let k=1;for(let y=w;y>=0;y--){nb[y*COLS+x]=fallOrb(rng);moves.push({x,from:-k,to:y,nw:true});k++;}}
 return {b:nb,moves};}
function resolveAll(b,rng){const steps=[];let cur=b.slice();
 for(let g=0;g<30;g++){const gs=findGroups(cur);if(!gs.length)break;const cl=cur.slice();gs.forEach(G=>G.cells.forEach(c=>cl[c]=null));
  const gr=gravity(cl,rng);steps.push({groups:gs,cleared:cl,after:gr.b,moves:gr.moves});cur=gr.b;}
 return {steps,board:cur,groups:steps.flatMap(s=>s.groups)};}
// ---- 隊伍數值與傷害 ----
function teamStats(team,lvs,friend){const leads=[CHMAP[team[0]].lead];if(friend)leads.push(CHMAP[friend.id].lead);
 const ids=team.map(id=>({id,lv:lvs[id]||1}));if(friend)ids.push({id:friend.id,lv:friend.lv,friend:true});
 let hp=0,rcv=0;const mem=ids.map(o=>{const c=CHMAP[o.id],m=lvMul(o.lv);let h=c.hp*m,r=c.rcv*m;
  leads.forEach(L=>{if(L.h)h*=L.h;if(L.t=='attrRcv'&&c.attr==L.a)r*=L.r;});hp+=h;rcv+=r;
  return {id:o.id,attr:c.attr,sub:c.sub,atk:c.atk*m,rcv:r,lv:o.lv,friend:!!o.friend};});
 return {hp:Math.round(hp),rcv,mem,leads,lead:leads[0]};}
// 條件式隊長技 ctx:{combo,attrs,hpR,ac:{attr:combo},shape}
function leadOne(L,attr,ctx){const c=ctx||{combo:0,attrs:0,hpR:1,ac:{},shape:false};let m=1;const hit=attr==L.a;
 if((L.t=='attr'||L.t=='attrRcv'||L.t=='hpAttr')&&hit)m*=L.m;
 if(L.t=='attrC'&&hit)m*=((c.ac[L.a]||0)>=L.c?L.m2:L.m);
 if(L.t=='attrHp'&&hit)m*=(c.hpR>=L.hp?L.m2:L.m);
 if(L.t=='attrRes'&&hit)m*=(c.attrs>=L.n?L.m2:L.m);
 if(L.t=='attrShape'&&hit)m*=(c.shape?L.m2:L.m);
 if(L.t=='all')m*=L.m;if(L.t=='allRes')m*=(c.attrs>=L.n?L.m2:L.m);
 if(L.t=='combo')m*=c.combo>=L.c?L.m2:L.m;return m;}
function leadAtk(ts,attr,ctx){if(typeof ctx=='number')ctx={combo:ctx,attrs:0,hpR:1,ac:{},shape:false};return ts.leads.reduce((m,L)=>m*leadOne(L,attr,ctx),1);}
// opts:{boost,wx,crimson,hpR}
function calcTurn(ts,groups,opts){if(opts&&!('wx' in opts)&&!('crimson' in opts)&&!('hpR' in opts)&&!('boost' in opts))opts={boost:opts};opts=opts||{};
 const combo=groups.length;const cm=1+(combo-1)*0.25;const per={},all={},pierce={},rows={},ac={};let healBase=0,poison=0,shape=false;
 groups.forEach(g=>{if(g.attr=='jam')return;if(g.attr=='poison'){poison++;return;}
  let v=(1+(g.n-3)*0.25)*(1+0.06*(g.plus||0));
  if(g.attr=='heal'){healBase+=v*(g.shape=='cross'?2:1);return;}
  ac[g.attr]=(ac[g.attr]||0)+1;
  if(g.shape=='cross')v*=2;if(g.shape=='L')v*=1.5;if(g.shape=='line5')v*=1.5;
  per[g.attr]=(per[g.attr]||0)+v;if(g.n==4||g.shape=='L'||g.shape=='cross')all[g.attr]=true;if(g.shape=='line5')pierce[g.attr]=true;
  if(g.n==4||g.shape)shape=true;if(g.row)rows[g.attr]=(rows[g.attr]||0)+1;});
 const attrs=Object.keys(per).length;const res=attrs>=5?2.5:(attrs>=4?1.8:(attrs>=3?1.5:1));
 const ctx={combo,attrs,hpR:opts.hpR==null?1:opts.hpR,ac,shape};const wm=(WEATHER[opts.wx||'none']||WEATHER.none).m;
 const atks=[];ts.mem.forEach((m,slot)=>{
  const one=(attr,isSub)=>{if(!per[attr])return;let d=m.atk*per[attr]*cm*leadAtk(ts,m.attr,ctx)*res*(wm[attr]||1)*(1+0.15*(rows[attr]||0));if(isSub)d*=(m.sub==m.attr?0.1:1/3);if(opts.boost&&opts.boost[attr])d*=opts.boost[attr];if(opts.crimson)d*=2;
   atks.push({slot,attr,dmg:Math.round(d),all:!!all[attr]||!!opts.crimson,pierce:!!pierce[attr],sub:isSub});};
  one(m.attr,false);if(m.sub)one(m.sub,true);});
 return {combo,atks,heal:Math.round(ts.rcv*healBase*cm),poison,res,attrs,cm,ac,shape,rows};}
function hitOne(a,e){let d=Math.round(a.dmg*advantage(a.attr,e.attr));d=Math.max(1,d-e.def);if(e.shieldT>0&&!a.pierce)d=Math.round(d*0.5);return d;}
function applyAttacks(atks,enemies,target){const hits=[];
 for(const a of atks){const alive=enemies.filter(e=>e.hp>0);if(!alive.length)break;
  let tg;if(a.all)tg=alive;else{let t=enemies[target];if(!t||t.hp<=0)t=alive[0];tg=[t];}
  tg.forEach(t=>{let d=hitOne(a,t);const h={slot:a.slot,enemy:enemies.indexOf(t),dmg:d,attr:a.attr,adv:advantage(a.attr,t.attr),all:a.all,sub:a.sub};
   if(t.absorbT>0&&t.absorbA==a.attr&&!a.pierce){t.hp=Math.min(t.max,t.hp+d);h.absorb=true;hits.push(h);return;}
   if(t.resolve&&!t.resolveUsed&&t.hp>=t.max*0.5&&d>=t.hp){d=t.hp-1;t.resolveUsed=true;h.resolve=true;h.dmg=d;}
   t.hp=Math.max(0,t.hp-d);
   if(t.part&&!t.part.broken){t.part.dealt+=d;if(t.part.dealt>=t.part.hp&&t.hp>0){t.part.broken=true;t.def=0;t.atk=Math.round(t.atk*0.85);t.cd+=1;h.brk=true;}}
   hits.push(h);});}
 return hits;}
function spawnWave(st,w){return st.waves[w].map(e=>{const M=MON[e.id];const t=e.tier||0;
 return {id:e.id,name:e.name||(TIERN[t]+M.name),attr:M.attr,boss:!!e.boss,tier:t,escort:!!e.escort,hp:e.hp,max:e.hp,atk:e.atk,def:e.def||0,cd:e.cd,cdMax:e.cd,count:0,pre:e.pre||null,skills:e.skills||[],nsk:e.nsk||null,
  shieldT:0,absorbT:0,absorbA:null,enrage:!!e.enrage,raged:false,resolve:!!e.resolve,resolveUsed:false,part:e.part?{hp:Math.round(e.hp*0.25),dealt:0,broken:false}:null};});}
function pickCells(rng,n,board,avoid){const idx=[];for(let k=0;k<30;k++)if(!avoid||!avoid(board&&board[k]))idx.push(k);const out=[];for(let k=0;k<n&&idx.length;k++){const j=Math.floor(rng()*idx.length);out.push(idx.splice(j,1)[0]);}return out;}
const WEAKTO={fire:'water',water:'wood',wood:'fire',light:'dark',dark:'light'};
// 執行一個技能，回傳動作
function doSkill(e,i,sk,ctx,red){const d=e.atk,rng=ctx.rng||Math.random,board=ctx.board;
 if(sk=='shield'){e.shieldT=3;return {i,type:'shield',turns:3,dmg:red(Math.round(d*0.4))};}
 if(sk=='conv'||sk=='jam'||sk=='poison'){const to=sk=='conv'?e.attr:sk;const cells=pickCells(rng,sk=='conv'?6:(sk=='jam'?5:4),board,o=>o=='jam'||o=='poison');if(board)cells.forEach(k=>board[k]=to);return {i,type:sk,cells,to,dmg:red(Math.round(d*0.4))};}
 if(sk=='bind')return {i,type:'bind',turns:2,dmg:red(Math.round(d*0.5))};
 if(sk=='time')return {i,type:'time',turns:2,dmg:red(Math.round(d*0.5))};
 if(sk=='absorb'){e.absorbT=2;e.absorbA=WEAKTO[e.attr];return {i,type:'absorb',attr:e.absorbA,turns:2,dmg:0};}
 if(sk=='multi'){const n=3;return {i,type:'atk',dmg:red(Math.round(d*0.5))*n,hits:n,strong:true,multi:true};}
 if(sk=='big')return {i,type:'atk',dmg:red(Math.round(d*2.0)),strong:true,big:true};
 return {i,type:'atk',dmg:red(d)};}
function preempt(enemies,ctx){ctx=ctx||{};const out=[];enemies.forEach((e,i)=>{if(e.hp<=0||!e.pre)return;
 if(e.pre=='atk')out.push({i,type:'atk',dmg:Math.round(e.atk*0.7),pre:true});
 else{const a=doSkill(e,i,e.pre,ctx,v=>v);a.pre=true;a.dmg=0;out.push(a);}});return out;}
// 敵人回合：每隻敵人各自倒數；頭目交替普攻與技能；HP<30% 時狂暴
function enemyTurn(enemies,shield,board,rng){const ctx=typeof shield=='object'&&shield?shield:{shield,board,rng};const out=[];const red=v=>ctx.shield?Math.round(v*0.5):v;
 enemies.forEach((e,i)=>{if(e.hp<=0)return;if(e.shieldT>0)e.shieldT--;if(e.absorbT>0){e.absorbT--;if(!e.absorbT)e.absorbA=null;}
  if(e.enrage&&!e.raged&&e.hp<e.max*0.3){e.raged=true;e.atk=Math.round(e.atk*1.6);e.cdMax=Math.max(1,e.cdMax-1);e.cd=Math.min(e.cd,1);out.push({i,type:'enrage',dmg:0});return;}
  e.cd--;if(e.cd>0)return;e.cd=e.cdMax;e.count++;
  if(e.boss&&e.skills.length&&e.count%2==0){const sk=e.skills[Math.floor(e.count/2-1)%e.skills.length];out.push(doSkill(e,i,sk,ctx,red));return;}
  if(!e.boss&&e.nsk&&e.count%2==0){out.push(doSkill(e,i,e.nsk,ctx,red));return;}
  out.push({i,type:'atk',dmg:red(e.atk)});});return out;}
const API={COLS,ROWS,ATTRS,ANAME,ACOL,CHARS,CHMAP,MON,STAGES,SPECIAL,ALLST,CHAPTERS,CHLEN,NST,STORY,ENDING,WEATHER,TIERN,MAXLV,STAM_MAX,STAM_SEC,friendLv,lvMul,expNeed,addExp,upCost,advantage,mkRng,newBoard,findGroups,gravity,resolveAll,teamStats,calcTurn,applyAttacks,spawnWave,enemyTurn,preempt,leadAtk,base,isPlus,shapeOf};
if(typeof module!='undefined')module.exports=API;else root.CL=API;
})(this);
