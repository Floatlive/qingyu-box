/* ==========================================================
   03-model.js
   数据模型：emptyData / normalizeData 校验
   ========================================================== */
/* ============================================================
   七、空数据与数据校验
   ============================================================ */
function emptyData() {
  return {
    version: 1,
    moods: [],
    customQuests: [],
    questLogs: [],
    coolerLogs: [],
    trivia: [],
    customTrivia: [],
    bedTasks: [],
    bedHope: { text: "", date: "" },
    alarm: {
      bedTime: "23:30",
      wakeTime: "07:00",
      reminders: [
        { id: "rem-winddown", time: "22:40", label: "开始收尾", enabled: true, weekdays: [0, 1, 2, 3, 4, 5, 6] },
        { id: "rem-screen", time: "23:20", label: "放下屏幕", enabled: true, weekdays: [0, 1, 2, 3, 4, 5, 6] },
      ],
    },
    fired: [],
  };
}

function isHm(v) {
  return typeof v === "string" && /^\d{2}:\d{2}$/.test(v);
}
function isWeather(v) {
  return WEATHERS.some((w) => w.id === v);
}

function normalizeData(raw) {
  const base = emptyData();
  if (!raw || typeof raw !== "object") return base;
  const o = raw;

  const moods = Array.isArray(o.moods)
    ? o.moods.filter((m) =>
        m && typeof m === "object" &&
        typeof m.id === "string" && typeof m.date === "string" &&
        typeof m.text === "string" && isWeather(m.weather) && typeof m.comment === "string")
    : [];

  const customQuests = Array.isArray(o.customQuests)
    ? o.customQuests.filter((q) =>
        q && typeof q === "object" &&
        typeof q.id === "string" && typeof q.text === "string" &&
        (q.difficulty === "easy" || q.difficulty === "mid" || q.difficulty === "hard"))
    : [];

  const questLogs = Array.isArray(o.questLogs)
    ? o.questLogs.filter((q) =>
        q && typeof q === "object" &&
        typeof q.id === "string" && typeof q.text === "string" && typeof q.date === "string")
    : [];

  const coolerLogs = Array.isArray(o.coolerLogs)
    ? o.coolerLogs
        .filter((c) => c && typeof c === "object" && typeof c.rewritten === "string")
        .slice(0, 30)
    : [];

  const trivia = Array.isArray(o.trivia)
    ? o.trivia.filter((t) =>
        t && typeof t === "object" &&
        typeof t.id === "string" && typeof t.name === "string" && typeof t.fact === "string")
    : [];

  const customTrivia = Array.isArray(o.customTrivia)
    ? o.customTrivia.filter((t) =>
        t && typeof t === "object" &&
        typeof t.id === "string" && typeof t.name === "string" && typeof t.fact === "string")
    : [];

  const bedTasks = Array.isArray(o.bedTasks)
    ? o.bedTasks
        .filter((t) => t && typeof t === "object" && typeof t.id === "string" && typeof t.text === "string")
        .map((t) => ({
          id: t.id,
          text: t.text.slice(0, 80),
          done: !!t.done,
          date: typeof t.date === "string" ? t.date : "",
        }))
        .slice(0, 30)
    : [];

  const bedHopeRaw = o.bedHope;
  const bedHope = bedHopeRaw && typeof bedHopeRaw === "object"
    ? { text: typeof bedHopeRaw.text === "string" ? bedHopeRaw.text.slice(0, 120) : "", date: typeof bedHopeRaw.date === "string" ? bedHopeRaw.date : "" }
    : { text: "", date: "" };

  const alarmRaw = o.alarm;
  let reminders;
  if (Array.isArray(alarmRaw && alarmRaw.reminders)) {
    reminders = alarmRaw.reminders
      .filter((r) =>
        r && typeof r === "object" &&
        typeof r.id === "string" && isHm(r.time) && typeof r.label === "string")
      .slice(0, 12)
      .map((r) => ({
        id: r.id,
        time: r.time,
        label: r.label,
        enabled: r.enabled !== false,
        weekdays: Array.isArray(r.weekdays)
          ? r.weekdays.filter((n) => typeof n === "number" && n >= 0 && n <= 6)
          : [0, 1, 2, 3, 4, 5, 6],
      }));
  } else {
    reminders = base.alarm.reminders;
  }

  return {
    version: 1,
    moods,
    customQuests,
    questLogs,
    coolerLogs,
    trivia,
    customTrivia,
    bedTasks,
    bedHope,
    alarm: {
      bedTime: isHm(alarmRaw && alarmRaw.bedTime) ? alarmRaw.bedTime : base.alarm.bedTime,
      wakeTime: isHm(alarmRaw && alarmRaw.wakeTime) ? alarmRaw.wakeTime : base.alarm.wakeTime,
      reminders,
    },
    fired: Array.isArray(o.fired)
      ? o.fired.filter((x) => typeof x === "string").slice(-200)
      : [],
  };
}

/* 合并导入：按 id / 日期去重，只追加，不覆盖、不清空当前数据 */
function mergeById(cur, inc) {
  const seen = new Set(cur.map((x) => x.id));
  return cur.concat(inc.filter((x) => x && x.id && !seen.has(x.id)));
}
function mergeData(current, incoming) {
  const cur = normalizeData(current);
  const inc = normalizeData(incoming);
  const moodDates = new Set(cur.moods.map((m) => m.date));
  const moods = cur.moods.concat(inc.moods.filter((m) => !moodDates.has(m.date)));
  return {
    version: 1,
    moods,
    customQuests: mergeById(cur.customQuests, inc.customQuests),
    questLogs: mergeById(cur.questLogs, inc.questLogs),
    coolerLogs: mergeById(cur.coolerLogs, inc.coolerLogs).slice(-30),
    trivia: mergeById(cur.trivia, inc.trivia),
    customTrivia: mergeById(cur.customTrivia, inc.customTrivia),
    bedTasks: mergeById(cur.bedTasks, inc.bedTasks),
    bedHope: cur.bedHope.text ? cur.bedHope : inc.bedHope,
    alarm: cur.alarm,
    fired: Array.from(new Set(cur.fired.concat(inc.fired))).slice(-200),
  };
}

/* ============================================================
   八、反向闹钟：时间计算
   ============================================================ */
function isHmString(v) {
  return /^\d{2}:\d{2}$/.test(v);
}

function nextOccurrence(hm, from) {
  from = from || new Date();
  const parts = hm.split(":").map(Number);
  const d = new Date(from);
  d.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

function plannedSleepHours(bed, wake) {
  if (!isHmString(bed) || !isHmString(wake) || bed === wake) return null;
  const bp = bed.split(":").map(Number);
  const wp = wake.split(":").map(Number);
  let mins = wp[0] * 60 + wp[1] - (bp[0] * 60 + bp[1]);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

function clockPhase(bed, wake, now) {
  now = now || new Date();
  const bedNext = nextOccurrence(bed, now);
  const wakeNext = nextOccurrence(wake, now);
  return wakeNext.getTime() < bedNext.getTime() ? "late" : "day";
}

function formatHours(hours) {
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分`;
}

function formatRemain(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}小时${String(m).padStart(2, "0")}分${String(sec).padStart(2, "0")}秒`;
  return `${m}分${String(sec).padStart(2, "0")}秒`;
}

// 深夜文案：按剩余睡眠时长分三档，每档多条随机。
const NIGHT_LINES = {
  critical: [
    "这个点还没睡，明天的你将以残血状态上线。现在闭眼，立刻，马上。",
    "睡眠余额已亮红灯，而且这玩意儿没有快充。躺下就是止损。",
    "再刷五分钟？你对自己的“五分钟”怕是有什么误解。手机放下，晚安。",
    "明天的黑眼圈和坏脾气已经在排队等你了，别让它们等太久。",
    "你的身体正在连夜起草一份关于你的差评。赶紧睡，还能撤回。",
  ],
  short: [
    "睡不够的坑，早上的咖啡填不平。现在翻身还来得及。",
    "屏幕再亮，也照不亮你明天犯困的脸。扣下它。",
    "爱熬夜的人，会在明早的闹钟里后悔。这个循环今天就断了吧。",
    "你的床已经等你很久了，别让一段短视频抢走你的困意。",
    "现在睡是自救，再熬是自费挨打。选一个。",
  ],
  mild: [
    "晚是晚了点，但还没到破罐破摔的程度。关灯，体面收场。",
    "别再点开下一条了，算法不会困，你会。",
    "今天就到这吧，没刷完的明天还在，觉没睡够可是真亏。",
    "给自己一个干脆的收尾：降亮度、放手机、闭眼。",
    "现在睡，明早还能当个正常人。冲。",
  ],
};

const DAY_LINES = [
  "今晚的早睡，是明天不摸鱼的底气。先把手上的小事收个尾。",
  "立 flag 容易，到点就撤才是真本事。今晚试试。",
  "熬夜一时爽，第二天全靠咖啡和意志硬撑。今晚争取准时。",
  "别给拖延留门缝，定好时间，到点就躺下。",
  "早睡这件事，做一次就知道有多香。今晚安排上。",
];

function nightLine(remainHours) {
  const key = remainHours < 5 ? "critical" : remainHours < 6.5 ? "short" : "mild";
  return pick(NIGHT_LINES[key], `${todayKey()}|night|${key}`);
}
function dayLine() {
  return pick(DAY_LINES, `${todayKey()}|day`);
}

// 根据当前阶段和睡眠时长给一个趣味称号。
function sleepTitle(phase, hours) {
  if (hours === null) return "先设好睡觉和起床时间";
  if (phase === "late") {
    if (hours < 4) return "熬夜冠军（卫冕中）";
    if (hours < 5.5) return "月亮不睡你不睡";
    if (hours < 7) return "熬夜预备役";
    return "还能抢救一下";
  }
  if (hours >= 8) return "养生天花板";
  if (hours >= 7) return "睡眠优等生";
  if (hours >= 6) return "勉强及格选手";
  return "电量告急";
}

// 晚安陪伴语：有梗又温柔，可换一句。
const GOOD_NIGHT = [
  "今天辛苦了，剩下的事交给明天的你，他比较能扛。晚安。",
  "手机没电了还知道充电，你也一样。晚安，去充电。",
  "世界先静音，烦恼先挂起，你只负责睡着。晚安。",
  "做个好梦，梦里不用回消息、不用早起、没有 deadline。",
  "今天的你已经很努力了，允许自己关机休息。晚安。",
  "把不开心留在屏幕外，被窝里只装舒服的事。晚安。",
  "月亮下班了，现在轮到你。晚安。",
  "睡着是今天最后一件正经事，完成它。晚安。",
  "不用想明天怎么办，先把今晚睡好，答案会长出来。",
  "你值得一段不被打扰的好觉，现在就去拿。晚安。",
];

// 熬夜劝退文案，点开“现在不睡”时随机来一句
const NO_SLEEP_LINES = [
  "明天的你会像一台没充电还被强制开机的旧手机，随时黑屏。",
  "黑眼圈能当眼影，但耐心和专注力是真的会连夜离家出走。",
  "今晚省下的这几个小时，明天会用一整天的浑浑噩噩连本带利还回来。",
  "深夜的灵感有多嚣张，明天中午的脑子就有多空旷。",
  "你不是在延长今天，是在提前透支明天那个还得扛事的自己。",
  "熬夜不会让问题变少，只会让明天的你解题时多一层雾。",
];

// 明日状态预测：展示“现在不睡”的代价，并对比“现在去睡”能救回多少。
function sleepForecast(now) {
  now = now || new Date();
  const alarm = state.alarm;
  const phase = clockPhase(alarm.bedTime, alarm.wakeTime, now);

  // 现在去睡：实际/计划能睡多久
  let sleepHours;
  if (phase === "late") {
    const wake = nextOccurrence(alarm.wakeTime, now);
    sleepHours = (wake.getTime() - now.getTime()) / 3600000;
  } else {
    sleepHours = plannedSleepHours(alarm.bedTime, alarm.wakeTime) || 0;
  }
  sleepHours = Math.max(0, Math.round(sleepHours * 10) / 10);

  // 现在不睡：继续熬到起床，约等于整宿没睡
  const noSleepHours = 0;

  const clamp = (v) => Math.max(5, Math.min(100, Math.round(v)));
  const score = (h) => ({
    patience: clamp(h * 14),
    focus: clamp(h * 13 + 5),
    energy: clamp(h * 14),
    snack: clamp(105 - h * 12),
    eye: clamp(105 - h * 13),
  });
  const levelOf = (h) => {
    if (h >= 7) return "满血复活";
    if (h >= 6) return "基本在线";
    if (h >= 5) return "靠咖啡续命";
    if (h >= 4) return "残血硬撑";
    return "濒危保护动物";
  };

  const bad = score(noSleepHours);
  return {
    phase,
    sleepHours,
    noSleepHours,
    patience: bad.patience,
    focus: bad.focus,
    energy: bad.energy,
    snack: bad.snack,
    eye: bad.eye,
    level: levelOf(noSleepHours),
  };
}

function dueReminders(alarm, fired, now) {
  now = now || new Date();
  const date = todayKey(now);
  const dow = now.getDay();
  const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const live = [];
  const missed = [];
  for (const r of alarm.reminders) {
    if (!r.enabled) continue;
    if (!r.weekdays.includes(dow)) continue;
    const key = `${date}|${r.id}|${r.time}`;
    if (fired.includes(key)) continue;
    if (r.time === hm) {
      live.push(r);
      continue;
    }
    const parts = r.time.split(":").map(Number);
    const diff = minutesNow - (parts[0] * 60 + parts[1]);
    if (diff > 0 && diff <= 20) missed.push(r);
  }
  return { live, missed };
}

function fireKey(r, now) {
  now = now || new Date();
  return `${todayKey(now)}|${r.id}|${r.time}`;
}
