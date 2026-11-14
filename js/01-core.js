/* ==========================================================
   01-core.js
   常量：情绪天气定义、通用工具、情绪→天气映射
   ========================================================== */
"use strict";
/* ============================================================
   一、常量数据（与原工程逐条对齐）
   ============================================================ */
const WEATHERS = [
  { id: "sunny", label: "晴天" },
  { id: "cloudy", label: "多云" },
  { id: "overcast", label: "阴天" },
  { id: "rain", label: "下雨" },
  { id: "storm", label: "雷阵雨" },
  { id: "muggy", label: "闷热" },
  { id: "fog", label: "雾" },
];

const MOOD_TAGS = [
  { id: "sunny", label: "轻松", w: "sunny" },
  { id: "cloudy", label: "平淡", w: "cloudy" },
  { id: "overcast", label: "低落", w: "overcast" },
  { id: "rain", label: "委屈", w: "rain" },
  { id: "storm", label: "火大", w: "storm" },
  { id: "muggy", label: "焦虑", w: "muggy" },
  { id: "fog", label: "迷茫", w: "fog" },
  // 更有网感的补充标签，w 是它对应的底层天气
  { id: "pumped", label: "打鸡血", w: "sunny" },
  { id: "smug", label: "小得意", w: "sunny" },
  { id: "want-lie", label: "想躺平", w: "cloudy" },
  { id: "salty", label: "柠檬精", w: "cloudy" },
  { id: "emo", label: "emo了", w: "overcast" },
  { id: "numb", label: "麻了", w: "overcast" },
  { id: "drained", label: "被掏空", w: "overcast" },
  { id: "want-praise", label: "求夸奖", w: "rain" },
  { id: "want-hug", label: "求抱抱", w: "rain" },
  { id: "want-crazy", label: "想发疯", w: "storm" },
  { id: "hangry", label: "饿怒", w: "storm" },
  { id: "monday", label: "周一综合症", w: "muggy" },
  { id: "social-fear", label: "社恐发作", w: "fog" },
  { id: "brain-fried", label: "脑子烧了", w: "fog" },
];

// 把标签 id 映射到它对应的天气；旧数据里标签本身就是天气 id，找不到时原样返回。
function tagToWeather(tagId) {
  const found = MOOD_TAGS.find((t) => t.id === tagId);
  return found ? found.w : tagId;
}

const KEYWORDS = [
  ["sunny", ["轻松愉快", "开心", "高兴", "快乐", "幸福", "满足", "顺利", "感恩", "轻松", "愉快", "欣喜", "美好", "期待", "安心", "喜欢"]],
  ["cloudy", ["没什么", "还行", "一般", "普通", "平淡", "平静", "正常", "凑合"]],
  ["overcast", ["低落", "难过", "失落", "郁闷", "无聊", "空虚", "疲惫", "累", "沮丧", "压抑"]],
  ["rain", ["想哭", "委屈", "孤独", "心碎", "失望", "心酸", "眼泪", "哭"]],
  ["storm", ["受不了", "气死", "烦死", "愤怒", "生气", "崩溃", "讨厌", "火大", "暴躁", "爆炸"]],
  ["muggy", ["喘不过气", "忙不过来", "焦虑", "烦躁", "压力", "紧绷", "担心", "紧张", "心慌", "失眠"]],
  ["fog", ["说不清", "不知道", "没方向", "迷茫", "困惑", "恍惚", "麻木", "犹豫", "茫然"]],
];

const COMMENTS = {
  sunny: [
    "今天的光够用就好，不必比昨天更亮。",
    "顺的时候也可以慢慢过，不用急着加任务。",
    "把这一小段晴记住。以后阴天可以来翻。",
  ],
  cloudy: [
    "平淡不是空白，只是天气温和。",
    "没有大起大落的一天，也值得被记下来。",
    "多云适合把事情做完，不适合苛责自己。",
  ],
  overcast: [
    "沉一点也没关系，云层低的时候适合少做决定。",
    "低落不需要立刻被照亮。先把它放在这里。",
    "阴天的可见度有限，把步伐放小就好。",
  ],
  rain: [
    "湿的情绪会过去，但现在可以先撑伞，不必跑步。",
    "想哭的时候不用解释原因。这张卡片替你留着。",
    "雨天适合把话说轻一点，包括对自己。",
  ],
  storm: [
    "雷声很大，不代表你必须现在回应一切。",
    "火气被看见了。等它走远一点，再决定要不要行动。",
    "先找一个不需要表现的角落，十分钟也算。",
  ],
  muggy: [
    "紧绷的时候，身体往往比想法更早报警。可以先喝水。",
    "闷热不是你的错，是今天的气压。把清单削短。",
    "焦虑会把未来一次算完。现在只处理眼前这一小步。",
  ],
  fog: [
    "看不清的时候，停在原地也是一种走法。",
    "迷茫通常不是失败，是信息还不够。",
    "雾里不必找全貌。先认出脚边的一步。",
  ],
};

const PRIORITY = ["storm", "rain", "muggy", "overcast", "fog", "sunny", "cloudy"];

// 记下天气后随机弹出的有梗提示，按当天天气选。
const MOOD_TOAST = {
  sunny: ["今天的你，主打一个发光", "电量满格，已记录", "这份好心情，存档了"],
  cloudy: ["多云但不慌，记下了", "状态一般，也值得记一笔", "先存着，等风来"],
  overcast: ["低电量的一天，已记录", "先按下，不评价", "阴天也没关系，记下来了"],
  rain: ["抱抱，今天先这样", "雨天已存档，会过去的", "难过也记下来了，不用硬撑"],
  storm: ["先别炸，已经帮你记下来了", "火气已存档，别做冲动决定", "今天的小炮仗，先收着"],
  muggy: ["闷着的一天，记下了", "高压锅先泄压，已记录", "烦躁已存档，透口气"],
  fog: ["迷糊的一天，先记下来", "人形问号已存档", "想不清楚也没关系，记着了"],
};

/* ============================================================
   二、基础工具与日期
   ============================================================ */
function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function weatherLabel(id) {
  const w = WEATHERS.find((x) => x.id === id);
  return w ? w.label : "多云";
}

function todayKey(d) {
  d = d || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(key) {
  const parts = key.split("-").map(Number);
  return new Date(parts[0] || 1970, (parts[1] || 1) - 1, parts[2] || 1);
}

function addDays(key, n) {
  const dt = parseKey(key);
  dt.setDate(dt.getDate() + n);
  return todayKey(dt);
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function formatCnDate(key) {
  const d = parseKey(key);
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEK[d.getDay()]}`;
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ============================================================
   三、情绪天气：映射、评论、连雨、统计
   ============================================================ */
// 关键词从长到短匹配，命中后把原文挖空，避免短词重复计分。
function mapMood(text, tag) {
  const bangs = (text.match(/[!！]/g) || []).length;
  if (tag) {
    const base = tagToWeather(tag);
    if (bangs >= 3 && (base === "rain" || base === "overcast")) return "storm";
    return base;
  }
  const scores = {};
  WEATHERS.forEach((w) => { scores[w.id] = 0; });
  let rest = text;
  const items = KEYWORDS
    .flatMap((pair) => pair[1].map((word) => ({ w: pair[0], word })))
    .sort((a, b) => b.word.length - a.word.length);
  for (const it of items) {
    if (rest.includes(it.word)) {
      scores[it.w] += 2;
      rest = rest.split(it.word).join("\u0000".repeat(it.word.length));
    }
  }
  if (/[…]{1,}|。{2,}/.test(text)) scores.fog += 1;
  if (bangs >= 3) scores.storm += 2;
  else if (bangs >= 2) scores.storm += 1;

  let best = "cloudy";
  let bestScore = 0;
  for (const id of PRIORITY) {
    if (scores[id] > bestScore) {
      best = id;
      bestScore = scores[id];
    }
  }
  return bestScore === 0 ? "cloudy" : best;
}

// 通用：按种子字符串从数组里稳定挑一条，同一种子结果固定。
function pick(arr, seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function pickComment(weather, seed) {
  const list = COMMENTS[weather];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length] || list[0];
}

// 以今天或最近一条记录为终点，向前连看三个日历日，都是雨或雷才提醒。
function hasRainStreak(moods, now) {
  now = now || new Date();
  const map = new Map(moods.map((m) => [m.date, m.weather]));
  const t = todayKey(now);
  const end = map.has(t) ? t : addDays(t, -1);
  return [0, 1, 2].every((offset) => {
    const w = map.get(addDays(end, -offset));
    return w === "rain" || w === "storm";
  });
}

function countWeathers(moods, dates) {
  const counts = {};
  WEATHERS.forEach((w) => { counts[w.id] = 0; });
  for (const m of moods) {
    if (dates.has(m.date)) counts[m.weather] += 1;
  }
  return WEATHERS.map((w) => ({ id: w.id, label: w.label, count: counts[w.id] }));
}

function datesInWeek(now) {
  now = now || new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  const set = new Set();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    set.add(todayKey(d));
  }
  return set;
}

function datesInMonth(year, month) {
  const set = new Set();
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) set.add(todayKey(new Date(year, month, d)));
  return set;
}

