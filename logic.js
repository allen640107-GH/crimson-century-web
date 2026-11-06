// 緋紅世紀 core logic (shared by game + simulation). Original content.
(function(root){
const COLS=6,ROWS=5,ATTRS=['fire','water','wood','light','dark','heal'];
const ANAME={fire:'火',water:'水',wood:'木',light:'光',dark:'暗',heal:'回復'};
const ACOL={fire:'#ff5a3c',water:'#4aa8ff',wood:'#4cd964',light:'#ffd84a',dark:'#c27bff',heal:'#ff7fc8'};
// 火剋木、木剋水、水剋火、光暗互剋
function advantage(a,d){if((a=='fire'&&d=='wood')||(a=='wood'&&d=='water')||(a=='water'&&d=='fire')||(a=='light'&&d=='dark')||(a=='dark'&&d=='light'))return 2;
 if((a=='wood'&&d=='fire')||(a=='water'&&d=='wood')||(a=='fire'&&d=='water'))return 0.5;return 1;}
const CHARS=[
 {id:'lysera',sub:'dark',name:'莉瑟拉',title:'緋焰劍姬',attr:'fire',img:'c_fire1',rarity:4,hp:520,atk:150,rcv:30,
  lead:{t:'attrC',a:'fire',m:2.2,c:2,m2:3.0,d:'火屬性攻擊力 2.2 倍；火珠 2 Combo 以上時 3 倍'},act:{t:'dmgAll',a:'fire',m:9,cd:9,n:'緋紅斬',d:'對敵方全體造成攻擊力 9 倍的火屬性傷害'}},
 {id:'garen',sub:'wood',name:'葛倫',title:'赤狼拳士',attr:'fire',img:'c_fire2',rarity:3,hp:600,atk:135,rcv:20,
  lead:{t:'allRes',m:1.5,n:3,m2:2.2,d:'全隊攻擊力 1.5 倍；同時消除 3 種以上屬性時 2.2 倍'},act:{t:'boost',a:'fire',m:1.7,turns:1,cd:8,n:'狼燄怒吼',d:'1 回合內火屬性攻擊力 1.7 倍'}},
 {id:'marin',sub:'light',name:'瑪琳',title:'蒼潮巫女',attr:'water',img:'c_water1',rarity:3,hp:480,atk:110,rcv:80,
  lead:{t:'attrRcv',a:'water',m:2,r:2,d:'水屬性攻擊力 2 倍、回復力 2 倍'},act:{t:'heal',p:0.5,cd:7,n:'潮汐祈願',d:'回復 50% 生命'}},
 {id:'sein',sub:'dark',name:'塞恩',title:'霜槍騎士',attr:'water',img:'c_water2',rarity:4,hp:620,atk:140,rcv:25,
  lead:{t:'attrHp',a:'water',m:2.2,hp:0.8,m2:2.8,d:'水屬性攻擊力 2.2 倍；生命 80% 以上時 2.8 倍'},act:{t:'delay',n2:2,cd:9,n:'冰封之槍',d:'敵人攻擊倒數延後 2 回合'}},
 {id:'fiel',sub:'light',name:'菲兒',title:'翠羽弓手',attr:'wood',img:'c_wood1',rarity:3,hp:500,atk:140,rcv:40,
  lead:{t:'attrC',a:'wood',m:2.2,c:2,m2:3.0,d:'木屬性攻擊力 2.2 倍；木珠 2 Combo 以上時 3 倍'},act:{t:'conv',from:'fire',to:'wood',cd:6,n:'森之箭雨',d:'火珠全部變成木珠'}},
 {id:'bark',sub:null,name:'巴克',title:'古樹守衛',attr:'wood',img:'c_wood2',rarity:3,hp:800,atk:100,rcv:50,
  lead:{t:'hpAttr',h:1.5,a:'wood',m:1.5,d:'全隊生命 1.5 倍、木屬性攻擊力 1.5 倍'},act:{t:'shield',n2:2,cd:8,n:'古樹之盾',d:'2 回合內受到的傷害減半'}},
 {id:'ed',sub:'fire',name:'艾德',title:'曙光聖騎',attr:'light',img:'c_light1',rarity:3,hp:560,atk:145,rcv:35,
  lead:{t:'attrRes',a:'light',m:2.2,n:3,m2:2.8,d:'光屬性攻擊力 2.2 倍；同時消除 3 種以上屬性時 2.8 倍'},act:{t:'conv',from:'dark',to:'light',cd:6,n:'聖光轉換',d:'暗珠全部變成光珠'}},
 {id:'nora',sub:'water',name:'諾菈',title:'天輝修女',attr:'light',img:'c_light2',rarity:3,hp:460,atk:100,rcv:90,
  lead:{t:'combo',m:1.5,c:5,m2:2.5,d:'全隊攻擊力 1.5 倍，5 Combo 以上 2.5 倍'},act:{t:'refresh',p:0.2,cd:5,n:'天輝洗禮',d:'珠盤全部重整並回復 20% 生命'}},
 {id:'kain',sub:'fire',name:'凱因',title:'夜鴉刺客',attr:'dark',img:'c_dark1',rarity:4,hp:450,atk:165,rcv:15,
  lead:{t:'attrShape',a:'dark',m:2.2,m2:3.0,d:'暗屬性攻擊力 2.2 倍；以 4 顆／十字／L／五連消除時 3 倍'},act:{t:'dmgOne',a:'dark',m:16,cd:8,n:'影襲',d:'對單一敵人造成攻擊力 16 倍的暗屬性傷害'}},
 {id:'vela',sub:'water',name:'薇拉',title:'血月魔女',attr:'dark',img:'c_dark2',rarity:4,hp:420,atk:155,rcv:30,
  lead:{t:'all',m:2,h:0.8,d:'全隊攻擊力 2 倍、生命 0.8 倍'},act:{t:'conv',from:'heal',to:'dark',cd:7,n:'血月咒',d:'回復珠全部變成暗珠'}},
 {id:'ashara',sub:'light',name:'亞夏菈',title:'緋焰女帝',attr:'fire',img:'c_fire3',rarity:5,hp:580,atk:175,rcv:35,
  lead:{t:'attrC',a:'fire',m:2.5,c:3,m2:3.5,d:'火屬性攻擊力 2.5 倍；火珠 3 Combo 以上時 3.5 倍'},act:{t:'dmgAll',a:'fire',m:12,cd:10,n:'帝焰審判',d:'對敵方全體造成攻擊力 12 倍的火屬性傷害'}},
 {id:'shio',sub:'dark',name:'汐',title:'深淵海將',attr:'water',img:'c_water3',rarity:5,hp:640,atk:160,rcv:40,
  lead:{t:'attrHp',a:'water',m:2.5,hp:0.7,m2:3.2,d:'水屬性攻擊力 2.5 倍；生命 70% 以上時 3.2 倍'},act:{t:'delay',n2:3,cd:10,n:'深淵凍結',d:'敵人攻擊倒數延後 3 回合'}},
 {id:'lora',sub:'water',name:'蘿菈',title:'翠冠靈弓',attr:'wood',img:'c_wood3',rarity:5,hp:540,atk:165,rcv:55,
  lead:{t:'attrC',a:'wood',m:2.5,c:3,m2:3.5,d:'木屬性攻擊力 2.5 倍；木珠 3 Combo 以上時 3.5 倍'},act:{t:'conv',from:'water',to:'wood',cd:5,n:'翠雨連矢',d:'水珠全部變成木珠'}},
 {id:'raen',sub:'wood',name:'雷恩',title:'聖裁騎士',attr:'light',img:'c_light3',rarity:5,hp:600,atk:170,rcv:45,
  lead:{t:'attrRes',a:'light',m:2.5,n:3,m2:3.2,d:'光屬性攻擊力 2.5 倍；同時消除 3 種以上屬性時 3.2 倍'},act:{t:'dmgOne',a:'light',m:20,cd:9,n:'聖裁之劍',d:'對單一敵人造成攻擊力 20 倍的光屬性傷害'}},
 {id:'mo',sub:'fire',name:'墨',title:'虛空行者',attr:'dark',img:'c_dark3',rarity:5,hp:500,atk:185,rcv:25,
  lead:{t:'attrShape',a:'dark',m:2.5,m2:3.5,d:'暗屬性攻擊力 2.5 倍；以 4 顆／十字／L／五連消除時 3.5 倍'},act:{t:'dmgAll',a:'dark',m:11,cd:9,n:'虛空裂縫',d:'對敵方全體造成攻擊力 11 倍的暗屬性傷害'}},
 {id:'pyra',sub:null,name:'派菈',title:'雙尾焰巫',attr:'fire',img:'c_fire4',rarity:4,hp:480,atk:145,rcv:40,
  lead:{t:'attrC',a:'fire',m:2.0,c:2,m2:2.6,d:'火屬性攻擊力 2 倍；火珠 2 Combo 以上時 2.6 倍'},act:{t:'boost',a:'fire',m:1.8,turns:1,cd:7,n:'焰舞加持',d:'1 回合內火屬性攻擊力 1.8 倍'}},
 {id:'kaito',sub:'wood',name:'海斗',title:'雨夜刺客',attr:'water',img:'c_water4',rarity:4,hp:430,atk:160,rcv:20,
  lead:{t:'combo',m:1.6,c:4,m2:2.4,d:'全隊攻擊力 1.6 倍，4 Combo 以上 2.4 倍'},act:{t:'dmgOne',a:'water',m:14,cd:7,n:'雨刃',d:'對單一敵人造成攻擊力 14 倍的水屬性傷害'}},
 {id:'bambo',sub:'light',name:'竹禪',title:'翠竹武僧',attr:'wood',img:'c_wood4',rarity:4,hp:720,atk:115,rcv:60,
  lead:{t:'hpAttr',h:1.6,a:'wood',m:1.6,d:'全隊生命 1.6 倍、木屬性攻擊力 1.6 倍'},act:{t:'shield',n2:3,cd:9,n:'竹林結界',d:'3 回合內受到的傷害減半'}},
 {id:'zer',sub:'fire',name:'澤爾',title:'六芒緋皇',attr:'dark',img:'c_star6_zer',rarity:6,hidden:'battle',hp:620,atk:195,rcv:40,
  lead:{t:'attrShape',a:'dark',m:2.8,m2:3.8,d:'暗屬性攻擊力 2.8 倍；以 4 顆／十字／L／五連消除時 3.8 倍'},act:{t:'dmgAll',a:'dark',m:13,cd:10,n:'緋煌滅界',d:'對敵方全體造成攻擊力 13 倍的暗屬性傷害'}},
 {id:'aurora',sub:'heal',name:'奧蘿',title:'虹詠神女',attr:'light',img:'c_star6_aurora',rarity:6,hidden:'gacha',hp:560,atk:180,rcv:100,
  lead:{t:'combo',m:2.0,c:6,m2:3.6,d:'全隊攻擊力 2 倍，6 Combo 以上 3.6 倍'},act:{t:'refresh',p:0.35,cd:6,n:'虹輝洗禮',d:'珠盤全部重整並回復 35% 生命'}},

];
const CHMAP={};CHARS.forEach(c=>CHMAP[c.id]=c);

// ---- 劇情招募：CORE 開局；其餘 story（章節頭目後）或 battle（先戰鬥再對話）----
const CORE=['nora','lysera','marin'];
const RECRUIT=[
 {id:'garen',type:'battle',stage:3,gems:40,name:'葛倫',lines:['赤狼從烈焰中走出。','葛倫：「哼，有兩下子。我跟你們走——至少比一個人打怪物有趣。」']},
 {id:'fiel',type:'story',stage:7,gems:50,name:'菲兒',lines:['緋霧散去，翠羽弓手自樹梢躍下。','菲兒：「森林託付給我。下一個戰場，我也會守護你們。」']},
 {id:'sein',type:'battle',stage:11,gems:40,name:'塞恩',lines:['霜槍餘韻未消。','塞恩：「……承認了。你們的隊伍需要我的槍。」']},
 {id:'kain',type:'story',stage:15,gems:50,name:'凱因',lines:['夜鴉落在神殿廢墟上。','凱因：「影裡的路我熟。別拖後腿就行。」']},
 {id:'ed',type:'battle',stage:19,gems:45,name:'艾德',lines:['曙光劈開冰霧。','艾德：「聖光認可你們。從今日起，並肩作戰。」']},
 {id:'bark',type:'story',stage:23,gems:50,name:'巴克',lines:['古樹守衛緩緩跪下又站起。','巴克：「大地記得這份羈絆。讓我成為你們的盾。」']},
 {id:'vela',type:'battle',stage:28,gems:55,name:'薇拉',lines:['血月魔女收起咒文，笑意冷冽。','薇拉：「敗給你們……也好。把我寫進你們的命運吧。」']},
];
const FRIEND_ALIAS={lysera:'紅蓮旅人',nora:'銀月騎士',marin:'碧海歌姬',fiel:'森語者',kain:'夜鴉',garen:'雷鳴鍛匠',sein:'冰鏡',ed:'聖歌隊長',vela:'影之薇拉',bark:'大地之盾',zer:'緋煌旅人',aurora:'虹詠神女'};
function recruitAt(stage){return RECRUIT.filter(r=>r.stage===stage);}
function rivalFor(stage){return RECRUIT.find(r=>r.type==='battle'&&r.stage===stage)||null;}

// ---- 成長：經驗值 ----
const MAXLV=30;
function lvMul(lv){return 1+0.11*(lv-1);}
function expNeed(lv){return Math.round(60*Math.pow(lv,1.55));} // lv -> lv+1
function upCost(lv){return {gold:80+lv*55,mats:Math.max(1,Math.floor((lv+2)/5))};} // 金幣+素材升 1 級
function charAt(c,lv){const m=lvMul(lv||1);return {hp:Math.round(c.hp*m),atk:Math.round(c.atk*m),rcv:Math.round(c.rcv*m)};}
function rarityStars(r){r=r||3;return r>=6?'★★★★★★':('★'.repeat(r));}
function dupeMats(r){return {3:5,4:20,5:60,6:150}[r||3]||5;}
function gemClear(i,stars,first,prevStars){let g=0;if(first)g+=12+Math.floor(i/2)+ (i%8==7?25:0);const ps=prevStars||0;if(stars>ps)g+=(stars-ps)*(4+Math.floor(i/5));return g;}
function gemChapterBoss(i,first){return (first&&i%8==7)?(60+Math.floor(i/8)*20):0;}
function rollGacha(rng,pity){pity=pity||0;const r=rng();let tier=3;if(r<0.005)tier=6;else if(pity>=89||r<0.035)tier=5;else if(r<0.225)tier=4;let pool=CHARS.filter(c=>c.rarity===tier);if(tier===6)pool=pool.filter(c=>c.hidden==='gacha');if(!pool.length)pool=CHARS.filter(c=>c.rarity===5);return pool[Math.floor(rng()*pool.length)];}
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
 b_nightmare:{name:'惡夢・虛空帝',attr:'dark'},nm_void:{name:'惡夢・虛空帝',attr:'dark'},
};
const TIERN=['','精英・','霸主・'],TIERB=['','覺醒・','霸主・'],TIERM=[1,1.5,2.0];
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
 ['b_light4',1],['b_light2',0],['b_fire3',0],['b_wood3',0],['b_dark4',1],['b_light',1],['b_fire',1],['b_light3',0],
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
 wind:{n:'🍃 森風',d:'木屬性 ×1.3／光屬性 ×0.9',m:{wood:1.3,light:0.9}},aurora:{n:'✨ 極光',d:'光屬性 ×1.3／暗屬性 ×0.9',m:{light:1.3,dark:0.9}},fog:{n:'🌫 赤霧',d:'暗屬性 ×1.3／木屬性 ×0.9',m:{dark:1.3,wood:0.9}},nightmare:{n:'☠ 惡夢',d:'暗屬性 ×1.4／光屬性 ×0.85',m:{dark:1.4,light:0.85,fire:0.95,water:0.95,wood:0.95}}};
const WXL=['none','sun','rain','wind','aurora','fog'];
function mkRng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const HP_SCALE=2; // v2: all enemy/boss HP ×2
function mkEnemy(id,hp,atk,cd,def,boss){return {id,hp:Math.round(hp*HP_SCALE),atk:Math.round(atk),cd,def:Math.round(def),boss:!!boss,tier:0};}
// 難度曲線：前期平緩、後期陡峭（玩家等級上限 30，後段以數量／技能／階級增加壓力）
function gH(i){return Math.pow(1.19,Math.min(i,20))*Math.pow(1.045,Math.max(0,i-20));}
function gA(i){return Math.pow(1.13,Math.min(i,20))*Math.pow(1.05,Math.max(0,i-20));}
function gD(i){return Math.pow(1.17,Math.min(i,20))*Math.pow(1.04,Math.max(0,i-20));}
function eHP(i){return 3100*lvMul(Math.min(30,1+0.82*i));}
function kA(i){return 0.16+0.30*Math.min(1,i/28);}
const NSK=['jam','poison','bind','time'];
function buildStage(i){
 const ch=Math.floor(i/CHLEN),r=mkRng(1000+i*77),pool=POOL[ch];
 const s=gH(i),a=gA(i),df=gD(i),waves=[];const nw=i<6?3:(i<20?4:5);
 for(let w=0;w<nw-1;w++){const lo=i<3?2:(i<10?2:3),hi=i<3?3:(i<10?4:5);const cnt=lo+Math.floor(r()*(hi-lo+1));const en=[];
  for(let k=0;k<cnt;k++){const id=pool[Math.floor(r()*pool.length)];const q=r();let t=0;
   if(q<Math.max(0,Math.min(0.12,(i-20)/120)))t=2;else if(q<Math.min(0.38,i/45))t=1;
   const tm=TIERM[t],af=1/(0.55+0.18*cnt);
   const e=mkEnemy(id,240*s*(1+w*0.12)*tm*(i>15?Math.max(0.78,1-0.022*(i-15)):1)*(i>=32?0.85:1),eHP(i)*kA(i)/cnt*Math.pow(tm,0.3)*(1+w*0.04)*(i>=28?0.82:1)*(i>=36?0.85:1)*(i<8?0.78:1),2+Math.floor(r()*2),8*df*(t?1.3:1));e.tier=t;
   if(i>=10&&r()<Math.min(0.5,(i-8)/40)){e.nsk=NSK[Math.floor(r()*NSK.length)];}
   en.push(e);}
  waves.push(en);}
 const [bid,bt]=BOSSES[i];const tb=[1,1.25,1.5][bt];
 const B=mkEnemy(bid,2600*s*Math.pow(tb,0.6)*(i>=20?1.1:1),eHP(i)*(0.12+0.11*Math.min(1,i/30))*Math.pow(tb,0.3)*(i>=28?0.8:1)*(i>=36?0.75:1)*(i==39?0.55:1),i<5?3:(i%3==0?2:3),20*df,true);B.tier=bt;
 if(i>=26&&i<=28){B.atk=Math.round(B.atk*0.85);B.hp=Math.round(B.hp*0.92);}B.name=TIERB[bt]+MON[bid].name;B.pre=i<2?null:['atk','shield','jam','bind'][i%4];if(i<8&&B.pre=='bind')B.pre='atk';
 B.skills=i<1?[]:BSK[bid].slice(0,Math.min(BSK[bid].length,1+Math.floor(i/5)));B.enrage=i>=4;B.resolve=i>=12;B.part=i>=6;
 const chB=i%CHLEN==CHLEN-1;B.chapter=chB;B.hp=Math.round(B.hp*(chB?1.35:0.82)*(i>11?Math.max(0.5,1-0.04*(i-11)):1)*(i>=36?0.7:1)*(i==39?0.55:1)*(i>=26&&i<=28?0.72:1));B.capN=i<2?1.8:(chB?3.5:2.2);B.phase=i>=5;if(chB&&i>=15)B.skills=B.skills.concat(['dabs']);
 const bw=[B];const esc=i<4?0:(i<16?1:2);
 for(let k=0;k<esc;k++){const id=pool[Math.floor(r()*pool.length)],t=i>=24?2:1,tm=TIERM[t];const e=mkEnemy(id,160*s*tm*(i>=24?0.85:1),eHP(i)*kA(i)*0.18*Math.pow(tm,0.3)*(i>=24?0.72:1)*(i>=28?0.85:1),3,8*df*1.3);e.tier=t;e.escort=1;if(i>=14)e.nsk=NSK[(i+k)%4];bw.push(e);}
 if(esc==2)bw.splice(0,0,bw.pop());// 護衛排在兩側
 waves.push(bw);
 const wx=i<2?'none':WXL[Math.floor(r()*WXL.length)];
 return {i,kind:'main',name:`${i+1}. ${CHAPTERS[ch].n} ${['一','二','三','四','五','六','七','八'][i%CHLEN]}`,ch,bg:CHAPTERS[ch].bg,waves,wx,
  gold:Math.round(90+i*42),exp:Math.round(80*Math.pow(1.20,Math.min(i,24))*Math.pow(1.05,Math.max(0,i-24))),gems:14+Math.floor(i/2),stam:2+Math.floor(i/3),unlock:i==0?-1:i-1,drop:{egg:0.5,chest:0.5}};
}
const STAGES=[];for(let i=0;i<NST;i++)STAGES.push(buildStage(i));
const SPECIAL=[];
[['gold','金幣洞窟','n_light4',['初級','中級','上級'],[3,8,14]],['exp','經驗神殿','n_water4',['初級','中級','上級'],[4,9,15]]].forEach(([kind,n,mid,lvn,unl],k)=>{
 lvn.forEach((ln,j)=>{const d=unl[j];const s=Math.pow(1.20,d),a=Math.pow(1.135,d),df=Math.pow(1.19,d);
  const waves=[[mkEnemy(mid,300*s,80*a,3,6*df),mkEnemy(mid,300*s,80*a,4,6*df),mkEnemy(mid,300*s,80*a,3,6*df)],[mkEnemy(mid,500*s,90*a,3,6*df),mkEnemy(mid,500*s,90*a,4,6*df)],[Object.assign(mkEnemy(kind=='gold'?'b_light2':'b_water4',1100*s,170*a,3,15*df,true),{name:(kind=='gold'?'黃金守護者':'智慧海靈'),pre:null,skills:[]})]];
  SPECIAL.push({i:100+k*10+j,kind,name:`${n}・${ln}`,ch:kind=='gold'?2:1,bg:kind=='gold'?'bg_castle':'bg_ruins',waves,wx:'none',
   gold:kind=='gold'?Math.round(450*Math.pow(1.55,j)):Math.round(70*Math.pow(1.45,j)),exp:kind=='exp'?Math.round(550*Math.pow(1.9,j)):Math.round(60*Math.pow(1.5,j)),stam:6+j*4,unlock:d,drop:kind=='gold'?{chest:1}:{egg:1}});});});

// 隱藏關：全破 40 關後開放；多階段勁敵頭目 → 通關後澤爾入隊（血量對齊終章倍率，偏難但不破表）
(function(){
 const mk=(id,hp,atk,cd,def,boss,extra)=>Object.assign(mkEnemy(id,hp,atk,cd,def,boss),extra||{});
 // mkEnemy 已套 HP_SCALE=2；此處用接近終章的 raw 值再微幅上修
 const w1=[mk('n_dark1',22000,900,3,40),mk('n_dark3',22000,900,4,40),mk('n_fire3',22000,950,3,40)];
 const w2=[mk('b_dark2',70000,1100,3,55,true,{name:'影侍・骸骨龍王',skills:['shield','multi','absorb'],tier:1,capN:3.2,phase:true}),
           mk('n_dark2',32000,1000,3,45,false,{tier:1}),mk('n_dark1',32000,1000,4,45,false,{tier:1})];
 const Z=mk('c_star6_zer',160000,1350,2,80,true,{name:'勁敵・六芒緋皇澤爾',attr:'dark',rival:1,tier:2,pre:'shield',
  skills:['shield','dabs','multi','absorb','big'],enrage:true,resolve:true,phase:true,chapter:true,capN:4.0,part:1});
 const w3=[mk('n_dark3',28000,1050,3,50,false,{escort:1,tier:1}),Z,mk('n_fire1',28000,1050,3,50,false,{escort:1,tier:1})];
 SPECIAL.push({i:200,kind:'hidden',name:'隱藏・緋煌試煉',ch:5,bg:'bg_castle',waves:[w1,w2,w3],wx:'fog',
  gold:2500,exp:2000,stam:20,unlock:'all40',drop:{chest:1,egg:1},joinId:'zer',joinGems:120});
})();

// 惡夢級：通關隱藏・緋煌試煉後開放；5 波、更強血攻與妨礙技（熟練隊勝率目標約 30–60%）
(function(){
 const mk=(id,hp,atk,cd,def,boss,extra)=>Object.assign(mkEnemy(id,hp,atk,cd,def,boss),extra||{});
 const w1=[mk('n_dark1',52000,1750,3,55,false,{nsk:'jam',tier:1}),mk('n_dark3',52000,1750,3,55,false,{nsk:'poison',tier:1}),mk('n_dark2',52000,1800,3,55,false,{nsk:'time',tier:1})];
 const w2=[mk('b_dark3',175000,2200,2,80,true,{name:'惡夢使・深淵魔王',skills:['jam','poison','absorb','multi','bind'],tier:2,capN:4.1,phase:true,enrage:true,resolve:true}),
           mk('n_dark1',70000,1900,3,65,false,{tier:1,nsk:'bind'}),mk('n_fire3',70000,1900,3,65,false,{tier:1,nsk:'jam'})];
 const w3=[mk('b_dark4',210000,2350,2,85,true,{name:'惡夢影・血月死神',skills:['poison','time','dabs','multi','jam'],tier:2,capN:4.3,phase:true,resolve:true,enrage:true}),
           mk('n_dark3',78000,2000,3,70,false,{tier:1,nsk:'poison'}),mk('n_dark1',78000,2000,3,70,false,{tier:1,nsk:'time'})];
 const w4=[mk('n_dark1',80000,2050,3,70,false,{escort:1,tier:2,nsk:'jam'}),mk('b_dark2',260000,2500,2,90,true,{name:'惡夢侍・骸骨龍王',skills:['shield','absorb','big','jam','dabs'],tier:2,capN:4.4,phase:true,enrage:true,resolve:true}),mk('n_dark2',80000,2050,3,70,false,{escort:1,tier:2,nsk:'poison'})];
 const Boss=mk('b_nightmare',420000,2700,2,110,true,{name:'惡夢・虛空帝',attr:'dark',tier:2,pre:'jam',
  skills:['jam','poison','dabs','absorb','time','multi','big','bind'],enrage:true,resolve:true,phase:true,chapter:true,capN:4.9,part:1});
 const w5=[mk('n_dark3',95000,2150,3,75,false,{escort:1,tier:2,nsk:'poison'}),Boss,mk('n_dark1',95000,2150,3,75,false,{escort:1,tier:2,nsk:'jam'})];
 SPECIAL.push({i:201,kind:'nightmare',name:'惡夢級・虛空裂縫',ch:5,bg:'bg_nightmare',waves:[w1,w2,w3,w4,w5],wx:'nightmare',
  gold:5000,exp:4000,stam:30,unlock:200,drop:{chest:1,egg:1},
  firstGems:320,firstMats:40,title:'惡夢征服者'});
})();

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
function teamStats(team,lvs,friend){const tids=team.filter(id=>id&&CHMAP[id]);const leads=[CHMAP[tids[0]].lead];if(friend)leads.push(CHMAP[friend.id].lead);
 const ids=tids.map(id=>({id,lv:lvs[id]||1}));if(friend)ids.push({id:friend.id,lv:friend.lv,friend:true});
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
function capHit(e,d){if(e.cap){d=Math.max(0,Math.min(d,e.cap-e.tDmg));e.tDmg+=d;}if(e.phase&&!e.phased&&e.hp>e.max*0.5&&e.hp-d<=e.max*0.5){d=e.hp-Math.round(e.max*0.5);e.phased=true;e.shieldT=2;e.tDmg=e.cap||0;}return d;}
function hitOne(a,e){let d=Math.round(a.dmg*advantage(a.attr,e.attr));d=Math.max(1,d-e.def);if(e.shieldT>0&&!a.pierce)d=Math.round(d*0.5);return d;}
function applyAttacks(atks,enemies,target){const hits=[];
 for(const a of atks){const alive=enemies.filter(e=>e.hp>0);if(!alive.length)break;
  let tg;if(a.all)tg=alive;else{let t=enemies[target];if(!t||t.hp<=0)t=alive[0];tg=[t];}
  tg.forEach(t=>{let d=hitOne(a,t);const h={slot:a.slot,enemy:enemies.indexOf(t),dmg:d,attr:a.attr,adv:advantage(a.attr,t.attr),all:a.all,sub:a.sub};
   if(t.absorbT>0&&t.absorbA==a.attr&&!a.pierce){t.hp=Math.min(t.max,t.hp+d);h.absorb=true;hits.push(h);return;}
   if(t.dabsT>0&&d>t.dabsV&&!a.pierce){h.dabs=true;h.dmg=0;hits.push(h);return;}
   if(t.cap){d=Math.max(0,Math.min(d,t.cap-t.tDmg));if(d<h.dmg)h.capped=true;t.tDmg+=d;h.dmg=d;}
   if(t.phase&&!t.phased&&t.hp>t.max*0.5&&t.hp-d<=t.max*0.5){d=t.hp-Math.round(t.max*0.5);t.phased=true;t.shieldT=2;t.atk=Math.round(t.atk*1.15);t.tDmg=t.cap||0;h.phase=true;h.dmg=d;}
   if(t.resolve&&!t.resolveUsed&&t.hp>=t.max*0.5&&d>=t.hp){d=t.hp-1;t.resolveUsed=true;h.resolve=true;h.dmg=d;}
   t.hp=Math.max(0,t.hp-d);
   if(t.part&&!t.part.broken){t.part.dealt+=d;if(t.part.dealt>=t.part.hp&&t.hp>0){t.part.broken=true;t.def=0;t.atk=Math.round(t.atk*0.85);t.cd+=1;h.brk=true;}}
   hits.push(h);});}
 return hits;}
function spawnWave(st,w){return st.waves[w].map(e=>{const M=MON[e.id]||{name:e.name||'勁敵',attr:e.attr||'fire'};const t=e.tier||0;
 return {id:e.id,name:e.name||(TIERN[t]+M.name),attr:e.attr||M.attr,boss:!!e.boss,tier:t,escort:!!e.escort,rival:!!e.rival,hp:e.hp,max:e.hp,atk:e.atk,def:e.def||0,cd:e.cd,cdMax:e.cd,count:0,pre:e.pre||null,skills:e.skills||[],nsk:e.nsk||null,
  shieldT:0,absorbT:0,absorbA:null,enrage:!!e.enrage,raged:false,resolve:!!e.resolve,resolveUsed:false,chapter:!!e.chapter,cap:e.capN?Math.round(e.hp/e.capN):0,tDmg:0,phase:!!e.phase,phased:false,dabsT:0,dabsV:0,part:e.part?{hp:Math.round(e.hp*0.25),dealt:0,broken:false}:null};});}
function pickCells(rng,n,board,avoid){const idx=[];for(let k=0;k<30;k++)if(!avoid||!avoid(board&&board[k]))idx.push(k);const out=[];for(let k=0;k<n&&idx.length;k++){const j=Math.floor(rng()*idx.length);out.push(idx.splice(j,1)[0]);}return out;}
const WEAKTO={fire:'water',water:'wood',wood:'fire',light:'dark',dark:'light'};
// 執行一個技能，回傳動作
function doSkill(e,i,sk,ctx,red){const d=e.atk,rng=ctx.rng||Math.random,board=ctx.board;
 if(sk=='shield'){e.shieldT=3;return {i,type:'shield',turns:3,dmg:red(Math.round(d*0.4))};}
 if(sk=='conv'||sk=='jam'||sk=='poison'){const to=sk=='conv'?e.attr:sk;const cells=pickCells(rng,sk=='conv'?6:(sk=='jam'?5:4),board,o=>o=='jam'||o=='poison');if(board)cells.forEach(k=>board[k]=to);return {i,type:sk,cells,to,dmg:red(Math.round(d*0.4))};}
 if(sk=='bind')return {i,type:'bind',turns:2,dmg:red(Math.round(d*0.5))};
 if(sk=='time')return {i,type:'time',turns:2,dmg:red(Math.round(d*0.5))};
 if(sk=='absorb'){e.absorbT=2;e.absorbA=WEAKTO[e.attr];return {i,type:'absorb',attr:e.absorbA,turns:2,dmg:0};}
 if(sk=='dabs'){e.dabsT=2;e.dabsV=Math.round(e.max*0.06);return {i,type:'dabs',turns:2,v:e.dabsV,dmg:red(Math.round(d*0.3))};}
 if(sk=='multi'){const n=3;return {i,type:'atk',dmg:red(Math.round(d*0.5))*n,hits:n,strong:true,multi:true};}
 if(sk=='big')return {i,type:'atk',dmg:red(Math.round(d*2.0)),strong:true,big:true};
 return {i,type:'atk',dmg:red(d)};}
function preempt(enemies,ctx){ctx=ctx||{};const out=[];enemies.forEach((e,i)=>{if(e.hp<=0||!e.pre)return;
 if(e.pre=='atk')out.push({i,type:'atk',dmg:Math.round(e.atk*0.7),pre:true});
 else{const a=doSkill(e,i,e.pre,ctx,v=>v);a.pre=true;a.dmg=0;out.push(a);}});return out;}
// 敵人回合：每隻敵人各自倒數；頭目交替普攻與技能；HP<30% 時狂暴
function enemyTurn(enemies,shield,board,rng){const ctx=typeof shield=='object'&&shield?shield:{shield,board,rng};const out=[];const red=v=>ctx.shield?Math.round(v*0.5):v;
 enemies.forEach((e,i)=>{e.tDmg=0;if(e.hp<=0)return;if(e.dabsT>0)e.dabsT--;if(e.shieldT>0)e.shieldT--;if(e.absorbT>0){e.absorbT--;if(!e.absorbT)e.absorbA=null;}
  if(e.enrage&&!e.raged&&e.hp<e.max*0.3){e.raged=true;e.atk=Math.round(e.atk*1.35);e.cdMax=Math.max(1,e.cdMax-1);e.cd=Math.min(e.cd,1);out.push({i,type:'enrage',dmg:0});return;}
  e.cd--;if(e.cd>0)return;e.cd=e.cdMax;e.count++;
  if(e.boss&&e.skills.length&&e.count%2==0){const sk=e.skills[Math.floor(e.count/2-1)%e.skills.length];out.push(doSkill(e,i,sk,ctx,red));return;}
  if(!e.boss&&e.nsk&&e.count%2==0){out.push(doSkill(e,i,e.nsk,ctx,red));return;}
  out.push({i,type:'atk',dmg:red(e.atk)});});return out;}
const API={COLS,ROWS,ATTRS,ANAME,ACOL,CHARS,CHMAP,MON,STAGES,SPECIAL,ALLST,CHAPTERS,CHLEN,NST,STORY,ENDING,WEATHER,TIERN,MAXLV,STAM_MAX,STAM_SEC,HP_SCALE,CORE,RECRUIT,FRIEND_ALIAS,recruitAt,rivalFor,friendLv,lvMul,expNeed,addExp,upCost,charAt,rarityStars,dupeMats,gemClear,gemChapterBoss,rollGacha,advantage,mkRng,newBoard,findGroups,gravity,resolveAll,teamStats,calcTurn,applyAttacks,spawnWave,enemyTurn,preempt,leadAtk,capHit,base,isPlus,shapeOf};
if(typeof module!='undefined')module.exports=API;else root.CL=API;
})(this);
