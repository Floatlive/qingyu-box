/* ==========================================================
   02-content.js
   内容库：盲盒任务、冷静词库、冷知识库
   ========================================================== */
/* ============================================================
   四、随机小冒险
   ============================================================ */
const BUILTIN_QUESTS = [
  { id: "q1", text: "走一条没走过的路回家", difficulty: "easy", minutes: 20 },
  { id: "q2", text: "给很久没联系的朋友发一句话", difficulty: "easy", minutes: 5 },
  { id: "q3", text: "把手机放远，看十分钟窗外", difficulty: "easy", minutes: 10 },
  { id: "q4", text: "给今天遇到的一个人说谢谢", difficulty: "easy", minutes: 5 },
  { id: "q5", text: "把桌面清出一块空手的地方", difficulty: "easy", minutes: 15 },
  { id: "q6", text: "用非惯用手做一件小事，比如刷牙或开门", difficulty: "easy", minutes: 3 },
  { id: "q7", text: "到楼下走一圈，这趟不戴耳机", difficulty: "mid", minutes: 15 },
  { id: "q8", text: "写下一件今天其实还不错的小事", difficulty: "easy", minutes: 5 },
  { id: "q9", text: "给植物浇水，或者给自己倒一杯水", difficulty: "easy", minutes: 3 },
  { id: "q10", text: "把一首旧歌单曲听完，中途不切走", difficulty: "mid", minutes: 5 },
  { id: "q11", text: "整理相册里的十张照片，删掉重复的", difficulty: "mid", minutes: 15 },
  { id: "q12", text: "问家里人一个你从没问过的问题", difficulty: "mid", minutes: 10 },
  { id: "q13", text: "换一种早餐或饮品", difficulty: "mid", minutes: 15 },
  { id: "q14", text: "在纸上画今天的路线，不求好看", difficulty: "easy", minutes: 10 },
  { id: "q15", text: "今晚把目标睡觉时间提前十五分钟", difficulty: "hard", minutes: 15 },
  { id: "q16", text: "做完一件拖了很久的小事：回消息、扔垃圾或订个东西", difficulty: "mid", minutes: 20 },
  { id: "q17", text: "去一家没进过的小店，只看不买也行", difficulty: "mid", minutes: 25 },
  { id: "q18", text: "把肩膀转十圈，再伸一个懒腰", difficulty: "easy", minutes: 3 },
  { id: "q19", text: "给未来的自己留一张便条，藏到下周会打开的地方", difficulty: "mid", minutes: 10 },
  { id: "q20", text: "关灯后只数呼吸到三十", difficulty: "easy", minutes: 5 },
  { id: "q21", text: "学一个陌生词，明天用它造句", difficulty: "mid", minutes: 10 },
  { id: "q22", text: "向一个人问路，哪怕你认识路", difficulty: "hard", minutes: 10 },
  { id: "q23", text: "站着吃一样东西，不边走边看屏幕", difficulty: "easy", minutes: 10 },
  { id: "q24", text: "把口袋里的收据或过期票根清掉", difficulty: "easy", minutes: 5 },
];

function difficultyLabel(d) {
  if (d === "easy") return "轻松";
  if (d === "mid") return "适中";
  return "费点劲";
}

function statusLabel(s) {
  if (s === "done") return "已完成";
  if (s === "skipped") return "已跳过";
  return "待完成";
}

// 今日若已有未跳过的任务则直接返回；七天内已完成的不进池，池空才允许重复。
function drawQuest(data, now, rand) {
  now = now || new Date();
  rand = rand || Math.random;
  const t = todayKey(now);
  const active = data.questLogs.find((q) => q.date === t);
  if (active) {
    if (active.status === "done") return { data, note: "今天的任务已经完成，明天再来。" };
    if (active.status === "skipped") return { data, note: "今天已经抽过并跳过了，明天再来。" };
    return { data, note: "今天已经抽过了，一天只能抽一次。" };
  }
  const weekAgo = addDays(t, -6);
  const blocked = new Set(
    data.questLogs
      .filter((q) => q.status === "done" && q.date >= weekAgo && q.date <= t)
      .map((q) => q.questId),
  );
  for (const q of data.questLogs) {
    if (q.date === t) blocked.add(q.questId);
  }
  const all = BUILTIN_QUESTS.concat(data.customQuests);
  const pool = all.filter((q) => !blocked.has(q.id));
  const source = pool.length > 0 ? pool : all;
  if (source.length === 0) return { data, note: "还没有任务。先添加一条自己的。" };
  const pick = source[Math.floor(rand() * source.length)];
  const log = {
    id: uid(),
    questId: pick.id,
    text: pick.text,
    difficulty: pick.difficulty,
    minutes: pick.minutes,
    date: t,
    status: "pending",
    repeated: pool.length === 0,
  };
  return {
    data: Object.assign({}, data, { questLogs: [log].concat(data.questLogs) }),
    note: log.repeated ? "这周能做的都做过一轮，这次允许重复。" : "新的一天，一件小事。",
  };
}

function questStreak(logs, now) {
  now = now || new Date();
  const done = logs.filter((l) => l.status === "done");
  const doneDates = new Set(done.map((l) => l.date));
  const total = done.length;
  const t = todayKey(now);
  let cursor = doneDates.has(t) ? t : addDays(t, -1);
  let days = 0;
  while (doneDates.has(cursor)) {
    days += 1;
    cursor = addDays(cursor, -1);
  }
  return { days, total };
}

// 盲盒稀有度：按任务 id 稳定分配，普通 70%、稀有 25%、传说 5%。
function rarityOf(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const n = h % 100;
  if (n < 5) return { id: "sr", label: "传说", cls: "rarity-sr" };
  if (n < 30) return { id: "r", label: "稀有", cls: "rarity-r" };
  return { id: "n", label: "普通", cls: "rarity-n" };
}

// 累计完成数对应的冒险者称号。
function questRank(total) {
  if (total >= 50) return "任务粉碎机";
  if (total >= 20) return "自律老手";
  if (total >= 8) return "有点东西的冒险者";
  if (total >= 1) return "新晋冒险者";
  return "还没开张的路人";
}

const QUEST_DONE_TOAST = [
  "叮！经验值 +1",
  "今日份自律已到账",
  "又干掉一个，爽",
  "这波操作，稳",
  "任务拿下，漂亮",
];
/* ============================================================
   五、吵架冷静器
   ============================================================ */
const SWEARS = [
  "草泥马", "操你妈", "他妈的", "你妈的", "傻逼", "傻b", "傻B",
  "脑残", "智障", "废物", "去死", "妈的", "卧槽", "我操", "操你",
  "滚蛋", "滚开", "闭嘴", "白痴", "神经病",
].sort((a, b) => b.length - a.length);

const ATTACKS = [
  [/你总是/g, "有时候", 2],
  [/你从来不?/g, "我没怎么感受到", 2],
  [/你就是/g, "这件事让我觉得", 2],
  [/都是你的?错/g, "我想一起看看原因", 2],
  [/都是你/g, "这件事里我也很在意", 2],
  [/你凭什么/g, "我想知道原因", 2],
  [/你懂什么/g, "我们看到的可能不一样", 2],
  [/爱咋咋地?/g, "我还是希望能说清楚", 2],
  [/随便你/g, "我需要一个回应", 2],
  [/活该/g, "我很难接受这个结果", 2],
  [/烦死了?/g, "我现在很烦躁", 1],
  [/无语/g, "我有点说不上来", 1],
  [/离谱/g, "这和我预期差很多", 1],
  [/真行/g, "这让我很意外", 1],
];

function coolDown(original) {
  let score = 0;
  let core = original;
  let changed = false;
  for (const w of SWEARS) {
    if (!w) continue;
    const hits = core.split(w).length - 1;
    if (hits > 0) {
      score += hits * 3;
      core = core.split(w).join("");
      changed = true;
    }
  }
  for (const atk of ATTACKS) {
    const re = atk[0];
    const rep = atk[1];
    const weight = atk[2];
    const global = new RegExp(re.source, re.flags);
    const hits = (core.match(global) || []).length;
    if (hits > 0) {
      score += hits * weight;
      core = core.replace(global, rep);
      changed = true;
    }
  }
  const bangs = (original.match(/[!！]/g) || []).length;
  score += Math.min(4, bangs);
  if ((original.match(/[?？]{2,}/g) || []).length > 0) score += 1;

  core = core.replace(/[!！]{2,}/g, "。").replace(/[?？]{3,}/g, "？");
  core = core.replace(/[~～]{2,}/g, "");
  core = core.replace(/\s+/g, " ").replace(/^[，,。.!！\s]+/, "").trim();
  if (!core) core = "我有些不舒服，想把这件事说清楚";
  if (!/[。！？!?]$/.test(core)) core += "。";

  // 用原文哈希从文案池里挑一条，避免每次都同一句话。
  let seed = 0;
  for (let i = 0; i < original.length; i++) seed = (seed * 31 + original.charCodeAt(i)) >>> 0;
  const pick = (arr) => arr[seed % arr.length];

  let level = "calm";
  let waitMin = 0;
  let rewritten;
  let advice;

  if (score >= 5) {
    level = "angry";
    waitMin = 25;
    const tail = pick([
      "我现在情绪有点上头，先缓一下，等会儿我们好好说。",
      "我先不带着火气回，等冷静点，我们再把事情捋清楚。",
      "这会儿我怕说重话，先停一下，晚点认真跟你聊。",
      "我先把到嘴边的狠话收回来，等气顺了，我们好好沟通。",
      "我现在脑子有点热，先不回，免得说出后悔的话。",
      "先让我冷静几分钟，我不想带着情绪跟你吵。",
    ]);
    rewritten = core + tail;
    advice = pick([
      "这时候发出去，明天大概率要道歉。先锁 25 分钟。",
      "怒气值拉满了。先别发，25 分钟后你会感谢现在的自己。",
      "先把手机放下，离对话框远一点，就 25 分钟。",
      "现在的你正在给自己挖坑，25 分钟后再决定要不要跳。",
      "这条发出去容易收不回来，先让它在草稿箱冷静 25 分钟。",
      "火气上头时做的决定，基本都在给未来的自己添堵。先等等。",
    ]);
  } else if (score >= 2) {
    level = "hot";
    waitMin = 10;
    const tail = pick([
      "我想先把事情说清楚，不是想争输赢。",
      "我在意的是这件事，不是针对你。",
      "我先把语气放下来，我们好好聊。",
      "我希望我们能把误会解开，而不是比谁声音大。",
      "我现在有点情绪，但还是想好好跟你讲。",
      "先不较劲了，我想听听你的想法，也说说我的。",
    ]);
    rewritten = changed ? core + tail : core;
    advice = pick([
      "先喝口水。10 分钟后再看，多半会庆幸没发原版。",
      "火还没灭，先让它在草稿箱冷静 10 分钟。",
      "这时候发容易把事情吵大，先晾 10 分钟。",
      "情绪正在线，先让它降降温，10 分钟后再读一遍。",
      "别急着按发送，给这件事 10 分钟，也给自己留点余地。",
      "现在的语气还带刺，10 分钟后你会想换个说法。",
    ]);
  } else {
    // 平静：不画蛇添足，直接用清理后的原文。
    rewritten = core;
    advice = pick([
      "这话没带火药，发吧。",
      "情绪平稳，绿灯通行。",
      "现在的你和十分钟后的你，应该都不会后悔这句。",
      "挺冷静的，发出去不用撤回。",
      "这条很稳，放心发，不用连夜撤回。",
      "语气平和、意思清楚，属于可以安心发送的版本。",
    ]);
  }
  return { rewritten, level, score, waitMin, advice };
}

function levelLabel(level) {
  if (level === "angry") return "愤怒";
  if (level === "hot") return "激动";
  return "平静";
}

/* ============================================================
   六、识图冷知识（33 条，5 类）
   ============================================================ */
const TRIVIA = [
  { id: "cat", category: "动物", name: "猫", aliases: ["家猫", "猫咪"],
    fact: "家猫缺少感知甜味的基因，所以对糖几乎无感。它们一天常常睡 12 到 16 小时。胡须的宽度大致等于身体宽度，用来判断自己能不能钻过缝隙。" },
  { id: "octopus", category: "动物", name: "章鱼", aliases: ["八爪鱼"],
    fact: "章鱼有三颗心脏，血液因含铜而呈蓝色。它的手臂上分布着大量神经元，吸盘可以在较少依赖大脑的情况下做局部反应。" },
  { id: "crow", category: "动物", name: "乌鸦", aliases: [],
    fact: "乌鸦能记住具体的人脸，还会把“这个人危险”告诉同伴。它们会把坚果放到车轮经过的地方，等车压开再吃。" },
  { id: "penguin", category: "动物", name: "企鹅", aliases: ["帝企鹅"],
    fact: "帝企鹅在寒风里会轮流站到圈外，再慢慢挪回中心，于是没有一只鸟一直被风吹着。看起来很短的腿，其实有一截藏在羽毛下面。" },
  { id: "ant", category: "动物", name: "蚂蚁", aliases: [],
    fact: "蚂蚁没有肺，靠身体两侧的小气门呼吸。外出的工蚁会沿路留下气味，回来的同伴把气味叠得更浓，较短的路就会越来越明显。" },
  { id: "firefly", category: "动物", name: "萤火虫", aliases: [],
    fact: "萤火虫的光几乎不发热，所以叫冷光。不同种类用不同的闪烁节奏求偶。有的雌虫会模仿别种的节奏，把对方引过来吃掉。" },
  { id: "pigeon", category: "动物", name: "鸽子", aliases: ["白鸽"],
    fact: "鸽子能感知地磁场，也能记住很长的视觉路线。城市鸽多半是岩鸽的后代，高楼对它们来说很像原本筑巢的悬崖。" },
  { id: "snail", category: "动物", name: "蜗牛", aliases: [],
    fact: "蜗牛的壳连着身体，不能像换帽子一样丢掉。爬行时分泌的黏液能减少摩擦，也能帮它认路。它的“牙”有上千颗，长在一条齿舌上。" },
  { id: "sunflower", category: "植物", name: "向日葵", aliases: ["太阳花"],
    fact: "还在长的向日葵花盘会从东转到西追着太阳。花开定型后大多朝东，早晨更容易被晒暖，也更容易吸引传粉的昆虫。" },
  { id: "ginkgo", category: "植物", name: "银杏", aliases: ["白果"],
    fact: "银杏是很古老的种子植物，常被称作活化石。秋天的扇形叶往往会在很短几天里一起变黄掉落。行道树多选雄株，因为雌株种子的外皮气味很冲。" },
  { id: "bamboo", category: "植物", name: "竹子", aliases: ["竹"],
    fact: "竹子是草，不是树。有的种类一个生长季就能长高很多，靠的是一节节拉长，而不是像树木那样慢慢加出年轮。" },
  { id: "cactus", category: "植物", name: "仙人掌", aliases: [],
    fact: "仙人掌的刺是退化的叶子，用来减少蒸发，也挡住想咬它的动物。肥厚的茎代替叶子进行光合作用，并把水存在里面。" },
  { id: "dandelion", category: "植物", name: "蒲公英", aliases: [],
    fact: "看上去的一朵蒲公英，其实是许多小花聚在一起。种子带着绒毛可以乘风离开。根即使断在土里，也常常能再长出一株。" },
  { id: "mushroom", category: "植物", name: "蘑菇", aliases: ["菌菇"],
    fact: "蘑菇不是植物，它属于真菌，和植物的亲缘更远。地上的伞只是用来散播孢子的部分，真正的主体是土壤或木头里的菌丝。" },
  { id: "lotus", category: "植物", name: "荷花", aliases: ["莲", "荷叶"],
    fact: "荷叶表面有细小的蜡质突起，水珠会滚成球并把灰尘带走。荷花的种子非常耐放，在合适的条件下保存许多年仍可能发芽。" },
  { id: "banana", category: "食物", name: "香蕉", aliases: [],
    fact: "超市里的香蕉几乎是同一品种的克隆，基因非常接近，所以一种病害就能威胁大片种植园。野生香蕉里有又硬又大的种子，我们吃到的是长期选育后几乎无籽的果肉。" },
  { id: "honey", category: "食物", name: "蜂蜜", aliases: ["蜜"],
    fact: "蜂蜜含水量低又偏酸，很多细菌很难在里面繁殖，密封好可以放很久。蜜蜂会扇动翅膀让花蜜里的水蒸发，再封进蜂蜡盖里。" },
  { id: "chocolate", category: "食物", name: "巧克力", aliases: ["可可"],
    fact: "可可豆要先发酵，才会有熟悉的巧克力味道，刚摘下来又苦又涩。白巧克力几乎不含可可固体，主要是可可脂、糖和奶。表面发白多半是油脂重新结晶，不一定是坏了。" },
  { id: "chili", category: "食物", name: "辣椒", aliases: ["辣"],
    fact: "辣椒素刺激的是疼痛受体，大脑会以为被烫到，于是出汗、流泪。鸟类对这种刺激不敏感，吃掉辣椒反而帮它传播种子。牛奶里的脂肪比白水更能缓和辣感。" },
  { id: "tofu", category: "食物", name: "豆腐", aliases: [],
    fact: "豆腐是豆浆遇到盐卤或石膏后，蛋白质聚到一起形成的。北豆腐更紧实，嫩豆腐里的水更多。豆渣也不是纯粹的废料，里面还有不少纤维。" },
  { id: "tea", category: "食物", name: "茶", aliases: ["绿茶", "红茶", "乌龙茶"],
    fact: "绿茶、红茶和乌龙可以来自同一种茶树，差别主要在叶片氧化了多少。氧化更充分的红茶颜色更深，香气也不同。茶里的咖啡因溶出很快，第一泡往往更提神。" },
  { id: "onion", category: "食物", name: "洋葱", aliases: [],
    fact: "切开洋葱时，含硫的物质挥发出来刺激眼睛，泪腺才开始工作。先放凉再切，挥发会慢一些。人类驯化洋葱已有几千年，和野生植株差得很远。" },
  { id: "dumpling", category: "食物", name: "饺子", aliases: ["水饺"],
    fact: "馅里的水分煮开后会变成蒸汽，皮如果没压紧就容易破。褶子不只为了好看，也是在把边缘封住。不同地方的褶向和形状差很多。" },
  { id: "pencil", category: "器物", name: "铅笔", aliases: [],
    fact: "铅笔芯不是铅，主要是石墨混了黏土。黏土越多，芯越硬，字迹越浅，这就是 HB、2B 这些标号的来历。外面的木头让它在折断时不那么容易伤到人。" },
  { id: "soap", category: "器物", name: "肥皂", aliases: ["香皂"],
    fact: "肥皂由油脂和碱反应而来。它的分子一头亲水、一头亲油，能把油污裹成小滴再被水冲走。把手洗干净，搓洗和冲洗通常比“是否抗菌”更要紧。" },
  { id: "mirror", category: "器物", name: "镜子", aliases: [],
    fact: "古代镜子多是磨亮的青铜。今天的玻璃镜是在背面镀上很薄的金属。镜子看起来左右相反，其实是前后被翻了一下：你面向北，镜中的人面向南。" },
  { id: "umbrella", category: "器物", name: "雨伞", aliases: ["伞"],
    fact: "折叠伞靠细金属骨和关节把一块布撑圆。雨水会沿着伞骨流向边缘。最早的伞更多用来遮阳，防雨是后来才普及的用途。" },
  { id: "zipper", category: "器物", name: "拉链", aliases: [],
    fact: "拉链靠两排齿互相咬合，滑块负责把它们压到能扣上的角度。它在十九世纪末就被发明，但过了几十年才变得可靠，最早常装在靴子而不是衣服上。" },
  { id: "bridge", category: "建筑", name: "桥", aliases: ["拱桥", "大桥"],
    fact: "拱桥把重量沿着弧线传向两边的地基，所以石头也能跨过河。悬索桥把桥面挂在主缆上，适合更长的距离。伸缩缝是为了让桥在冷热里有地方变长变短。" },
  { id: "lighthouse", category: "建筑", name: "灯塔", aliases: [],
    fact: "灯塔不一定靠特别耀眼的灯泡，透镜会把光收成一束再转出去，远处就看到闪烁。不同灯塔的闪法不同，水手可以据此分辨自己在哪里。" },
  { id: "stair", category: "建筑", name: "台阶", aliases: ["楼梯"],
    fact: "公共台阶太高会累，太窄会踩空，所以高度和深度有一套经验比例。螺旋楼梯省地方，但内侧踏面很窄，搬大件时会明显吃亏。" },
  { id: "brick", category: "建筑", name: "砖墙", aliases: ["砖", "红砖"],
    fact: "砖要错缝砌，是为了不让竖缝连成一条直线，裂缝就不容易一口气跑上去。空心砖更轻，也更能隔一点温度和声音。" },
  { id: "metro", category: "建筑", name: "地铁", aliases: ["列车", "火车"],
    fact: "车轮内侧有一圈轮缘，卡着钢轨，车子才不会轻易脱出去。车轮踏面略带锥度，转弯时能自己调整左右轮走的距离。隧道里的风，很多是列车像活塞一样推出来的。" },

  { id: "dog", category: "动物", name: "狗", aliases: ["小狗", "犬"],
    fact: "狗的鼻子纹路各不相同，类似人的指纹。它们嗅觉受体远多于人类，主要靠气味认识世界。狗并不是只能看见黑白，能分辨蓝色和黄色，只是看不到红色和绿色。" },
  { id: "owl", category: "动物", name: "猫头鹰", aliases: ["鸮"],
    fact: "猫头鹰的眼球接近管状，不能在眼眶里转动，所以靠非常灵活的脖子，头部可以转过很大的角度来环顾四周。它的羽毛边缘有锯齿状结构，飞行时声音很小。" },
  { id: "butterfly", category: "动物", name: "蝴蝶", aliases: [],
    fact: "蝴蝶的脚上有味觉感受器，落在植物上其实是在“尝”这东西能不能吃、适不适合产卵。它用长长的口器吸食花蜜，不用时会像发条一样卷起来。" },
  { id: "seahorse", category: "动物", name: "海马", aliases: [],
    fact: "海马是鱼，靠很小的鳍游动，游得很慢。雌海马把卵放进雄海马腹部的育儿袋，由雄海马负责孵化，最后“生”出小海马。" },
  { id: "bee", category: "动物", name: "蜜蜂", aliases: ["工蜂"],
    fact: "工蜂回到蜂巢会跳“8字舞”，用身体摆动的方向和时长告诉同伴花源在哪个方向、有多远。一只工蜂一生采的蜜其实很少，蜂蜜是大量蜜蜂协作的结果。" },
  { id: "goldfish", category: "动物", name: "金鱼", aliases: [],
    fact: "金鱼的记忆并不是只有几秒，实验里它们能记住喂食时间、路线和颜色，时间可以长达数月。" },
  { id: "sloth", category: "动物", name: "树懒", aliases: [],
    fact: "树懒动作慢，毛发里常会附生藻类，让它在树叶间看起来发绿、更不容易被发现。它吃的叶子难消化，在胃里停留很久。" },
  { id: "elephant", category: "动物", name: "大象", aliases: [],
    fact: "大象的鼻子没有骨头，靠数万条肌肉完成抓、吸、闻等动作。它们还能通过脚掌感知地面传来的低频震动，用来远距离交流。" },

  { id: "strawberry", category: "植物", name: "草莓", aliases: [],
    fact: "草莓表面那些“小籽”其实才是它真正的果实（瘦果），我们吃的红色多汁部分是膨大的花托。" },
  { id: "tomato", category: "植物", name: "番茄", aliases: ["西红柿"],
    fact: "番茄在植物学上符合水果的定义（由花的子房发育、含种子），但在日常饮食和一些关税分类里被当作蔬菜。" },
  { id: "apple", category: "植物", name: "苹果", aliases: [],
    fact: "苹果能浮在水面上，因为它内部约有四分之一是空气。它和梨、玫瑰其实属于同一科。" },
  { id: "carrot", category: "植物", name: "胡萝卜", aliases: [],
    fact: "胡萝卜并不天生就是橙色，早期品种多为紫色、白色，橙色是后来人工选育并推广的结果。" },
  { id: "venusflytrap", category: "植物", name: "捕蝇草", aliases: [],
    fact: "捕蝇草的夹子内有感觉毛，昆虫在短时间内连续碰到两次，夹子才会合拢，这样可以避免被落叶或雨滴误触发。" },
  { id: "corn", category: "植物", name: "玉米", aliases: ["苞米"],
    fact: "玉米顶端的每一根“玉米须”都连着下面的一粒玉米，它们其实是细长的花柱，用来接收花粉。" },
  { id: "maple", category: "植物", name: "枫树", aliases: ["枫"],
    fact: "枫糖浆是用枫树的树液熬出来的，树液含糖不高，要蒸发掉大量水分才能得到浓稠的糖浆。" },
  { id: "aloe", category: "植物", name: "芦荟", aliases: [],
    fact: "芦荟是多肉植物，肥厚的叶子里储存大量水分和凝胶状物质，叶片边缘还长着小刺。" },

  { id: "coffee", category: "食物", name: "咖啡", aliases: ["咖啡豆"],
    fact: "咖啡豆其实是咖啡树果实里的种子，咖啡因在植物里能起到一定驱虫作用。" },
  { id: "egg", category: "食物", name: "鸡蛋", aliases: ["蛋"],
    fact: "鸡蛋放久了气室会变大，所以很新鲜的蛋会沉在水里，存放很久的蛋更容易浮起来；蛋黄颜色深浅主要和饲料有关。" },
  { id: "potato", category: "食物", name: "土豆", aliases: ["马铃薯"],
    fact: "土豆原产于南美洲，发芽或变绿时会产生较多龙葵素，这种情况不建议吃。" },
  { id: "peanut", category: "食物", name: "花生", aliases: [],
    fact: "花生是豆科植物，开花后子房会扎进土里，在地下结出果实。" },
  { id: "grape", category: "食物", name: "葡萄", aliases: [],
    fact: "葡萄表面那层白霜主要是天然的蜡质和酵母，不是脏东西，反而说明比较新鲜。" },
  { id: "watermelon", category: "食物", name: "西瓜", aliases: [],
    fact: "西瓜大约九成以上是水，炎热时吃它能顺便补充水分。" },
  { id: "cheese", category: "食物", name: "奶酪", aliases: ["芝士"],
    fact: "有些奶酪（如埃曼塔）里的大洞，是发酵细菌产生的二氧化碳气泡留下的。" },
  { id: "salt", category: "食物", name: "盐", aliases: ["食盐"],
    fact: "盐是重要的调味品，人体需要少量钠，但长期吃得太多会增加身体负担。" },

  { id: "glass", category: "器物", name: "玻璃", aliases: [],
    fact: "玻璃主要由含硅的原料高温熔化制成，可以回收再熔化利用，古代玻璃曾是很贵重的材料。" },
  { id: "paper", category: "器物", name: "纸", aliases: ["纸张"],
    fact: "纸由植物纤维交织制成，回收后可以重新打成纸浆再造纸，能减少树木消耗。" },
  { id: "magnet", category: "器物", name: "磁铁", aliases: ["磁石"],
    fact: "磁铁同名磁极相斥、异名磁极相吸，地球本身也像一个大磁体，指南针正是利用这一点。" },
  { id: "battery", category: "器物", name: "电池", aliases: [],
    fact: "电池通过内部的化学反应在正负极之间产生电流，用完的电池应按要求回收，不要随意丢弃。" },
  { id: "rubber", category: "器物", name: "橡胶", aliases: [],
    fact: "天然橡胶来自橡胶树的汁液，经过硫化处理后会变得更结实、更有弹性。" },
  { id: "bulb", category: "器物", name: "灯泡", aliases: ["灯"],
    fact: "传统白炽灯靠钨丝通电发热发光，大部分能量变成了热；LED 灯把更多电能转成光，更省电。" },
  { id: "key", category: "器物", name: "钥匙", aliases: ["锁"],
    fact: "钥匙上的齿形会顶起锁里对应的弹子，齿形对得上，锁芯才能转动。" },

  { id: "dam", category: "建筑", name: "水坝", aliases: ["大坝"],
    fact: "水坝把水拦蓄起来，可用于防洪、供水和发电；重力坝主要靠自身巨大的重量抵抗水的推力。" },
  { id: "skyscraper", category: "建筑", name: "摩天楼", aliases: ["高楼"],
    fact: "摩天楼主要靠内部的钢或混凝土框架承重，外墙更多是围护，还要专门设计来抵抗大风。" },
  { id: "tunnel", category: "建筑", name: "隧道", aliases: [],
    fact: "开挖隧道常使用盾构机，它一边挖土一边在内部拼上管片，水下隧道还得承受很大的水压。" },
  { id: "road", category: "建筑", name: "道路", aliases: ["公路"],
    fact: "道路多用沥青或混凝土铺成，路面会设计一定坡度和排水设施，避免积水。" },
  { id: "stadium", category: "建筑", name: "体育场", aliases: ["体育馆"],
    fact: "体育场常做成碗状看台，逐层抬高，让不同位置的观众视线都尽量不被挡住。" },
  { id: "pyramid", category: "建筑", name: "金字塔", aliases: [],
    fact: "金字塔由大量石块垒成，建造时如何搬运、抬升这些巨石，至今仍是研究和讨论的话题。" },

  // ===== 天文 =====
  { id: "moon", category: "天文", name: "月球", aliases: ["月亮"],
    fact: "月球正以每年约3.8厘米的速度慢慢远离地球。它的自转周期和绕地球公转周期相同，所以总是同一面朝向我们，背面得靠探测器才能看到。" },
  { id: "venus", category: "天文", name: "金星", aliases: [],
    fact: "金星的自转方向和多数行星相反，在那里太阳从西边升起。它自转一圈约243个地球日，绕太阳一圈约225天，所以金星上的一天比一年还长。" },
  { id: "sunlight", category: "天文", name: "太阳光", aliases: ["阳光"],
    fact: "太阳光到达地球大约需要8分20秒，所以你此刻看到的太阳，其实是它8分多钟前的样子。星星的光有些甚至要走成千上万年才到我们眼里。" },
  { id: "neutronstar", category: "天文", name: "中子星", aliases: ["脉冲星"],
    fact: "中子星密度极高，一茶匙它的物质放到地球上，质量可达数十亿吨。快速旋转、两极发出规律辐射束的中子星，被称作脉冲星，像宇宙里的灯塔。" },
  { id: "saturnring", category: "天文", name: "土星环", aliases: [],
    fact: "土星环主要由无数冰块和碎石组成，小的像尘粒，大的像房屋。环虽然宽达数十万公里，厚度却很薄，很多地方只有十几米到几百米。" },

  // ===== 人体 =====
  { id: "bone", category: "人体", name: "骨骼", aliases: ["骨头"],
    fact: "婴儿出生时大约有300块骨头，随着长大，一些骨头逐渐融合，成人通常是206块。骨头不是死的，里面有活细胞，会不断更新和自我修复。" },
  { id: "gastricacid", category: "人体", name: "胃酸", aliases: ["胃液"],
    fact: "胃液酸性很强，pH大约在1.5到3.5之间，足以溶解一些金属。胃壁靠一层不断分泌的黏液保护自己，才不会被自己的酸消化掉。" },
  { id: "redcell", category: "人体", name: "红细胞", aliases: ["红血球"],
    fact: "成熟的红细胞没有细胞核，好腾出更多空间携带氧气。它们在体内循环约120天后退役，由骨髓持续制造新的补上。" },
  { id: "skin", category: "人体", name: "皮肤", aliases: [],
    fact: "皮肤是人体最大的器官，每平方厘米住着数以亿计的微生物，构成皮肤菌群。它还是重要的免疫屏障，每过约一个月表皮就基本换新一次。" },
  { id: "eye", category: "人体", name: "眼睛", aliases: ["眼球"],
    fact: "人眼能分辨上百万种颜色。物体在视网膜上其实成的是倒立的像，大脑会自动把它处理成正立的画面，这个过程你完全感觉不到。" },

  // ===== 地理 =====
  { id: "sahara", category: "地理", name: "撒哈拉", aliases: ["撒哈拉沙漠"],
    fact: "撒哈拉的细沙会被盛行风卷起，跨越大西洋飘到南美洲，为亚马逊雨林带来磷等矿物质。地球上最大的沙漠和最大的雨林，就这样隔着大洋连在一起。" },
  { id: "deadsea", category: "地理", name: "死海", aliases: [],
    fact: "死海其实是个湖，含盐量是普通海水的好几倍，人可以轻松浮在水面看报纸。它的水面在地球陆地最低点附近，因为太咸，鱼和多数植物都难以生存。" },
  { id: "iceland", category: "地理", name: "冰岛", aliases: [],
    fact: "冰岛正好坐在两大板块拉开的生长边界上，火山和地热资源丰富，很多家庭用地热取暖、泡温泉。岛上冰川与火山并存，也被称作冰与火之国。" },
  { id: "amazonriver", category: "地理", name: "亚马逊河", aliases: ["亚马孙河"],
    fact: "按水量算，亚马逊河是世界流量最大的河，入海的淡水约占全球河流总径流量的五分之一，入海口上百公里外的海水都能被冲淡。" },
  { id: "mariana", category: "地理", name: "马里亚纳海沟", aliases: [],
    fact: "马里亚纳海沟的挑战者深渊深度超过1万米，是已知海洋最深处。那里的水压约为海平面的上千倍，却仍有鱼虾和微生物存活。" },

  // ===== 科技 =====
  { id: "qrcode", category: "科技", name: "二维码", aliases: ["QR码"],
    fact: "二维码三个角上的大方块是定位标记，让相机无论从哪个角度扫，都能快速确定方向和位置。即使图案被弄脏或遮住一小块，靠纠错码也常能读出来。" },
  { id: "gps", category: "科技", name: "卫星定位", aliases: ["GPS","北斗"],
    fact: "手机定位通常要同时看到至少4颗卫星，3颗用来算位置，1颗校正时钟误差。卫星上的钟走得和地面不一样快，还得用相对论做修正。" },
  { id: "fiber", category: "科技", name: "光纤", aliases: ["光导纤维"],
    fact: "光纤靠光在极细的玻璃芯里不断全反射向前传播，能长距离、大容量地送信号，损耗还很低。我们上网的很多数据，就是沿着一根根比头发还细的光纤跑的。" },
  { id: "chip", category: "科技", name: "芯片", aliases: ["处理器","集成电路"],
    fact: "芯片在指甲盖大小的面积上集成了数以亿计到上百亿个晶体管，每个元件只有纳米级。制造它要经过光刻、蚀刻等上千道工序，是现代工业最精密的产品之一。" },
  { id: "bluetooth", category: "科技", name: "蓝牙", aliases: [],
    fact: "蓝牙的名字来自10世纪的丹麦国王哈拉尔，绰号蓝牙，他统一了丹麦和挪威。取这个名字，是希望这项技术能把不同设备统一连接起来。" },
];

const TRIVIA_CATEGORIES = ["动物", "植物", "食物", "器物", "建筑", "天文", "人体", "地理", "科技", "自动", "自选"];

function lookupTrivia(query, category, extraPool) {
  const q = query.trim();
  if (!q) return null;
  let base = category ? TRIVIA.filter((t) => t.category === category) : TRIVIA;
  if (extraPool && extraPool.length) base = base.concat(extraPool);
  const lower = q.toLowerCase();
  const exact = base.find(
    (t) => t.name === q || t.aliases.some((a) => a === q) || t.name.toLowerCase() === lower,
  );
  if (exact) return exact;
  return (
    base.find(
      (t) =>
        t.name.includes(q) ||
        q.includes(t.name) ||
        t.aliases.some((a) => a.includes(q) || q.includes(a)),
    ) || null
  );
}

// 按主体名称稳定生成一个“冷度”，数值越高越离谱、越想转发。
function coldLevel(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 60 + (h % 40); // 60-99
}

