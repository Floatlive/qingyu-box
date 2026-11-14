/* ==========================================================
   11-ai.js
   AI 调用：状态识别 / 识图 / 冷静改写
   ========================================================== */
/* ============================================================
   十九、交互处理函数
   ============================================================ */
// —— 情绪天气 ——
function weatherTyping(v) {
  ui.weather.text = v;
  const live = document.getElementById("weather-live");
  if (live) live.innerHTML = weatherLiveHtml();
  const btn = document.getElementById("mood-submit");
  if (btn) btn.disabled = !v.trim() && !ui.weather.tag;
}
function toggleWeatherAiPanel() {
  ui.weather.aiOpen = !ui.weather.aiOpen;
  renderWeather();
}
function saveWeatherAiSettings() {
  const u = ui.weather;
  saveAiConfig(ui.aiConfig);
  ui.aiConfig = readAiConfig();
  u.aiMsg = "已保存，和冷知识页共用这份配置。";
  renderWeather();
}
async function runWeatherAi() {
  const u = ui.weather;
  if (u.aiBusy) return;
  const text = u.text.trim();
  if (!text) { u.aiMsg = "先写一句今天的状态，再让 AI 判断。"; renderWeather(); return; }
  const cfg = readAiConfig();
  if (!cfg.baseUrl || !cfg.apiKey || !cfg.model) {
    // 没配接口：回退本地关键词推断
    const w = mapMood(text, null);
    u.tag = MOOD_TAGS.some((t) => t.id === w) ? w : null;
    u.aiMsg = "还没配 AI 接口，先用本地规则帮你判断了一个；配好接口后判断会更准。";
    renderWeather();
    return;
  }
  u.aiBusy = true; u.aiMsg = null; renderWeather();
  const labelList = MOOD_TAGS.map((t) => `${t.id}（${t.label}）`).join("、");
  try {
    const resp = await fetch(cfg.baseUrl + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: "你是情绪识别助手。根据用户写的一句话，从给定标签里选一个最贴切的，只返回 JSON，不要额外文字，格式：{\"tag\":\"标签id\"}。可选标签：" + labelList },
          { role: "user", content: text }
        ],
        temperature: 0.3
      })
    });
    if (!resp.ok) {
      let detail = "";
      try { const e = await resp.json(); detail = e.error && e.error.message ? e.error.message : ""; } catch (e) {}
      throw new Error("接口返回 " + resp.status + (detail ? "：" + detail : ""));
    }
    const data = await resp.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
    const parsed = parseAiJson(content);
    let tagId = parsed && parsed.tag ? String(parsed.tag).trim() : "";
    // 兼容模型直接返回中文标签名
    if (tagId && !MOOD_TAGS.some((t) => t.id === tagId)) {
      const byLabel = MOOD_TAGS.find((t) => t.label === tagId);
      if (byLabel) tagId = byLabel.id;
    }
    if (!tagId || !MOOD_TAGS.some((t) => t.id === tagId)) throw new Error("返回的标签不在可选列表里。");
    u.tag = tagId;
    u.aiMsg = "已根据这句话选好状态，天气也跟着更新了。";
    renderWeather();
  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    u.aiMsg = /failed to fetch|networkerror|load failed|network/i.test(msg)
      ? "连不上接口。检查地址、网络，或该服务是否允许浏览器跨域调用。"
      : msg;
    renderWeather();
  } finally {
    u.aiBusy = false;
    renderWeather();
  }
}
function toggleMoodTags() {
  ui.weather.moreTags = !ui.weather.moreTags;
  renderWeather();
}
function toggleMoodTag(id) {
  ui.weather.tag = ui.weather.tag === id ? null : id;
  renderWeather();
}
function submitMood() {
  const weather = mapMood(ui.weather.text.trim(), ui.weather.tag);
  saveMood(ui.weather.text, ui.weather.tag);
  toast(pick(MOOD_TOAST[weather], `${todayKey()}|toast|${weather}`));
}
function moodDelete(id) {
  if (ui.weather.confirmId === id) {
    removeMood(id);
    ui.weather.confirmId = null;
  } else {
    ui.weather.confirmId = id;
    renderWeather();
  }
}
function calMove(dir) {
  let m = ui.weather.calM + dir;
  let y = ui.weather.calY;
  if (m < 0) { m = 11; y -= 1; }
  if (m > 11) { m = 0; y += 1; }
  ui.weather.calM = m;
  ui.weather.calY = y;
  renderWeather();
}
function calSelect(key) {
  ui.weather.selected = key;
  renderWeather();
}

// —— 随机小冒险 ——
function questStatus(id, status) {
  changeQuestStatus(id, status);
  if (status === "done") toast(pick(QUEST_DONE_TOAST, `${todayKey()}|${id}`));
}
function toggleQuestForm() {
  ui.quest.openForm = !ui.quest.openForm;
  renderQuest();
}
function setDifficulty(d) {
  ui.quest.difficulty = d;
  renderQuest();
}
function submitCustomQuest() {
  const err = addCustomQuest(ui.quest.text, ui.quest.difficulty, Number(ui.quest.minutes));
  if (err) {
    ui.quest.error = err;
    renderQuest();
  } else {
    ui.quest.text = "";
    ui.quest.openForm = false;
    ui.quest.error = null;
    renderQuest();
    toast("已放进任务池");
  }
}
function customQuestDelete(id) {
  if (ui.quest.confirmId === id) {
    removeCustomQuest(id);
    ui.quest.confirmId = null;
  } else {
    ui.quest.confirmId = id;
    renderQuest();
  }
}

// —— 吵架冷静器 ——
function coolerTyping(value) {
  ui.cooler.text = value;
  const button = document.getElementById("cooler-submit");
  if (button) button.disabled = !value.trim();
}
function runCooler() {
  const original = ui.cooler.text.trim();
  if (!original) return;
  const r = coolDown(original);
  ui.cooler.result = r;
  ui.cooler.copied = false;
  ui.cooler.until = r.waitMin > 0 ? Date.now() + r.waitMin * 60000 : null;
  recordCooler(original, r);
}
function resetCoolerWait() {
  const r = ui.cooler.result;
  if (r) ui.cooler.until = Date.now() + r.waitMin * 60000;
  renderCooler();
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}
function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  area.remove();
  return ok;
}
function copyCooler() {
  const r = ui.cooler.result;
  if (!r) return;
  copyText(r.rewritten).then((ok) => {
    ui.cooler.copied = ok;
    renderCooler();
  });
}
function coolerTick() {
  const u = ui.cooler;
  const num = document.getElementById("cd-num");
  if (!num || !u.until) return;
  const remain = Math.max(0, u.until - Date.now());
  if (remain > 0) {
    const s = Math.ceil(remain / 1000);
    num.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    const hint = document.getElementById("cd-hint");
    if (hint) hint.textContent = "结束前不鼓励发送。你仍然可以复制，只是先不必发出去。";
  } else {
    num.textContent = "等待结束";
    const hint = document.getElementById("cd-hint");
    if (hint) hint.textContent = "如果你还想发，可以用上面的冷静版。";
    const again = document.getElementById("cd-again");
    if (again) again.style.display = "block";
  }
}

// —— 识图冷知识 ——
function dragZone(on) {
  const z = document.getElementById("trivia-drop");
  if (z) z.classList.toggle("drag", !!on);
}
function dropImage(e) {
  e.preventDefault();
  dragZone(0);
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) takeImage(file);
}
function pickImage(input) {
  const file = input.files && input.files[0];
  input.value = "";
  if (file) takeImage(file);
}
function takeImage(file) {
  ui.trivia.error = null;
  compressImage(file)
    .then((dataUrl) => {
      const id = uid();
      const oldId = ui.trivia.imageId;
      return putImage(id, dataUrl).then(() => {
        if (oldId) deleteImage(oldId).catch(() => {});
        ui.trivia.imageId = id;
        ui.trivia.preview = dataUrl;
        renderTrivia();
      });
    })
    .catch((err) => {
      ui.trivia.error = err.message || "图片没有放进来";
      renderTrivia();
    });
}
function setTriviaCategory(c) {
  ui.trivia.category = c;
  ui.trivia.name = "";
  renderTrivia();
}
function searchTrivia() {
  const q = ui.trivia.name.trim();
  if (!q) {
    ui.trivia.hit = null;
    ui.trivia.miss = "先选择或输入一个主体。";
    renderTrivia();
    return;
  }
  const isCustom = ui.trivia.category === "自选";
  let found = lookupTrivia(q, ui.trivia.category, isCustom ? state.customTrivia : null);
  let cross = false;
  if (!found && !isCustom) {
    found = lookupTrivia(q);
    cross = !!found;
  }
  if (!found) {
    ui.trivia.hit = null;
    ui.trivia.miss = isCustom
      ? `自选里还没有「${q}」。可以在下面先添加这条。`
      : `知识库里还没有「${q}」。换一个名字，或从列表里挑一个接近的。`;
    renderTrivia();
    return;
  }
  ui.trivia.miss = null;
  ui.trivia.hit = { name: found.name, category: found.category, fact: found.fact, cross };
  renderTrivia();
}
function randomTrivia() {
  const u = ui.trivia;
  const isCustom = u.category === "自选";
  const isAuto = u.category === "自动";
  const pool = isCustom
    ? state.customTrivia
    : isAuto
      ? TRIVIA
      : TRIVIA.filter((t) => t.category === u.category);
  if (pool.length === 0) {
    u.hit = null;
    u.miss = "这个类别还没有内容，先添加一条。";
    renderTrivia();
    return;
  }
  let candidates = pool;
  if (pool.length > 1 && u.lastRandomId) {
    const filtered = pool.filter((t) => t.id !== u.lastRandomId);
    if (filtered.length > 0) candidates = filtered;
  }
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  u.lastRandomId = item.id;
  u.name = item.name;
  u.miss = null;
  u.hit = { name: item.name, category: item.category, fact: item.fact, cross: false };
  renderTrivia();
}
function saveTrivia() {
  const h = ui.trivia.hit;
  if (!h) return;
  saveTriviaFav({ name: h.name, category: h.category, fact: h.fact, imageId: ui.trivia.imageId });
  ui.trivia.imageId = null;
  ui.trivia.preview = null;
  ui.trivia.hit = null;
  renderTrivia();
  toast("已放进收藏");
}

/* AI 识图（可选，需用户自己配置 OpenAI 兼容的多模态接口） */
function parseAiJson(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) {
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) {}
  }
  try { return JSON.parse(s); } catch (e) { return null; }
}
async function runAiRecognize() {
  const t = ui.trivia;
  if (t.aiBusy) return;
  if (!t.preview) { t.aiMsg = "先选一张图，再让 AI 识别。"; t.aiOpen = true; renderTrivia(); return; }
  const cfg = readAiConfig();
  if (!cfg.baseUrl || !cfg.apiKey || !cfg.model) {
    t.aiMsg = "先在「AI 设置」里填好接口地址、密钥和模型名。";
    t.aiOpen = true; renderTrivia(); return;
  }
  t.aiBusy = true; t.aiMsg = null; renderTrivia();
  try {
    const resp = await fetch(cfg.baseUrl + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: "你是识图助手。根据图片识别其中的主体，并用中文写一条关于它的冷知识。只返回 JSON，不要任何额外文字，格式：{\"name\":\"主体名称\",\"category\":\"从 动物、植物、食物、器物、建筑、天文、人体、地理、科技 里选一个最贴切的类别\",\"fact\":\"一条50到120字、内容准确的中文冷知识\"}" },
          { role: "user", content: [
            { type: "text", text: "请识别图中的主体并给出一条冷知识，严格只返回 JSON。" },
            { type: "image_url", image_url: { url: t.preview } }
          ]}
        ],
        temperature: 0.6
      })
    });
    if (!resp.ok) {
      let detail = "";
      try { const e = await resp.json(); detail = e.error && e.error.message ? e.error.message : ""; } catch (e) {}
      throw new Error("接口返回 " + resp.status + (detail ? "：" + detail : ""));
    }
    const data = await resp.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
    const parsed = parseAiJson(content);
    if (!parsed || !parsed.name || !parsed.fact) throw new Error("没能从返回里解析出名称和冷知识。");
    t.name = String(parsed.name).slice(0, 30);
    const realCats = TRIVIA_CATEGORIES.filter((c) => c !== "自动" && c !== "自选");
    const aiCat = String(parsed.category || "").trim();
    if (aiCat && realCats.includes(aiCat)) t.category = aiCat;
    t.hit = { name: t.name, category: t.category, fact: String(parsed.fact).slice(0, 220), ai: true };
    t.miss = null; t.error = null;
    t.aiMsg = "识别完成，已自动归类，结果在下面，可直接保存或手动改。";
    renderTrivia();
  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    t.aiMsg = /failed to fetch|networkerror|load failed|network/i.test(msg)
      ? "连不上接口。检查地址、网络，或该服务是否允许浏览器直接调用（跨域 CORS）。"
      : msg;
    renderTrivia();
  } finally {
    t.aiBusy = false;
    renderTrivia();
  }
}
function toggleAiPanel() {
  ui.trivia.aiOpen = !ui.trivia.aiOpen;
  renderTrivia();
}
function saveAiSettings() {
  const t = ui.trivia;
  saveAiConfig(ui.aiConfig);
  ui.aiConfig = readAiConfig();
  t.aiMsg = "设置已保存在这台设备。";
  renderTrivia();
}
function triviaDelete(id) {
  if (ui.trivia.confirmId === id) {
    removeTrivia(id);
    ui.trivia.confirmId = null;
  } else {
    ui.trivia.confirmId = id;
    renderTrivia();
  }
}

function addCustomTrivia() {
  const u = ui.trivia;
  const name = u.customName.trim();
  const fact = u.customFact.trim();
  if (!name) { u.customError = "先写个名称。"; renderTrivia(); return; }
  if (!fact) { u.customError = "内容还没写。"; renderTrivia(); return; }
  if (state.customTrivia.some((t) => t.name === name)) {
    u.customError = "这个名称已经有了。";
    renderTrivia();
    return;
  }
  state = Object.assign({}, state, {
    customTrivia: [
      { id: uid(), category: "自选", name, aliases: [], fact, custom: true, date: todayKey() },
    ].concat(state.customTrivia),
  });
  u.customName = "";
  u.customFact = "";
  u.customError = null;
  commit();
  toast("已添加到自选");
}

function viewCustomTrivia(id) {
  const item = state.customTrivia.find((t) => t.id === id);
  if (!item) return;
  ui.trivia.name = item.name;
  ui.trivia.miss = null;
  ui.trivia.hit = { name: item.name, category: item.category, fact: item.fact, cross: false };
  renderTrivia();
}

function customTriviaDelete(id) {
  const u = ui.trivia;
  if (u.customConfirm === id) {
    state = Object.assign({}, state, {
      customTrivia: state.customTrivia.filter((t) => t.id !== id),
    });
    u.customConfirm = null;
    commit();
  } else {
    u.customConfirm = id;
    renderTrivia();
  }
}

// —— 反向闹钟 ——
function setClock(key, val) {
  setAlarmClock({ [key]: val.slice(0, 5) });
}
function toggleForecast() {
  ui.alarm.forecastOpen = !ui.alarm.forecastOpen;
  if (ui.alarm.forecastOpen) ui.alarm.nosleepIdx = Math.floor(Math.random() * NO_SLEEP_LINES.length);
  renderAlarm();
}
function requestNotify() {
  if (typeof Notification === "undefined") return;
  Notification.requestPermission().then((result) => {
    ui.alarm.perm = result;
    renderAlarm();
  });
}
function editReminder(id, key, val) {
  patchReminder(id, { [key]: val });
}
function toggleWeekday(id, v) {
  const r = state.alarm.reminders.find((x) => x.id === id);
  if (!r) return;
  const weekdays = r.weekdays.includes(v)
    ? r.weekdays.filter((n) => n !== v)
    : r.weekdays.concat([v]).sort((a, b) => a - b);
  patchReminder(id, { weekdays });
}
function toggleReminder(id) {
  const r = state.alarm.reminders.find((x) => x.id === id);
  if (!r) return;
  patchReminder(id, { enabled: !r.enabled });
}
function submitNewReminder() {
  if (state.alarm.reminders.length >= 8) return;
  addReminder(ui.alarm.newTime, ui.alarm.newLabel);
  ui.alarm.newLabel = "";
  renderAlarm();
  toast("已添加提醒");
}

/* 睡前待办与明天的盼头 */
function addBedTask() {
  const u = ui.alarm;
  const text = u.newBedTask.trim();
  if (!text) { toast("先写点什么"); return; }
  state = Object.assign({}, state, {
    bedTasks: [{ id: uid(), text, done: false, date: todayKey() }].concat(state.bedTasks).slice(0, 30),
  });
  u.newBedTask = "";
  commit();
  renderAlarm();
}
function toggleBedTask(id) {
  state = Object.assign({}, state, {
    bedTasks: state.bedTasks.map((t) => (t.id === id ? Object.assign({}, t, { done: !t.done }) : t)),
  });
  commit();
  renderAlarm();
}
function bedTaskDelete(id) {
  const u = ui.alarm;
  if (u.bedConfirm === id) {
    state = Object.assign({}, state, { bedTasks: state.bedTasks.filter((t) => t.id !== id) });
    u.bedConfirm = null;
    commit();
    renderAlarm();
  } else {
    u.bedConfirm = id;
    renderAlarm();
  }
}
function saveBedHope() {
  const text = ui.alarm.hopeInput.trim();
  state = Object.assign({}, state, { bedHope: { text, date: todayKey() } });
  commit();
  renderAlarm();
  toast(text ? "盼头记下了，明天有东西可期待。" : "盼头已清空。");
}

/* 呼吸放松：吸气 4 秒、呼气 4 秒，共 8 轮 */
let breathTimer = null;
function startBreathing() {
  const u = ui.alarm;
  u.breathing = true;
  u.breathIn = true;
  u.breathRound = 1;
  u.breathText = "吸气…";
  renderAlarm();
  breathTimer = setInterval(() => {
    const ua = ui.alarm;
    if (ua.breathIn) {
      ua.breathIn = false;
      ua.breathText = "呼气…";
    } else {
      ua.breathIn = true;
      ua.breathRound += 1;
      if (ua.breathRound > 8) { stopBreathing(true); return; }
      ua.breathText = "吸气…";
    }
    renderAlarm();
  }, 4000);
}
function stopBreathing(finished) {
  const u = ui.alarm;
  if (breathTimer) { clearInterval(breathTimer); breathTimer = null; }
  u.breathing = false;
  renderAlarm();
  if (finished) toast("做完了，是不是松快了一点？");
}
function nextGoodNight() {
  const u = ui.alarm;
  u.goodNightIdx = (u.goodNightIdx + 1) % GOOD_NIGHT.length;
  renderAlarm();
}

function updateAlarmBig() {
  const node = document.getElementById("alarm-big");
  if (!node) return;
  const alarm = state.alarm;
  const now = new Date();
  const phase = clockPhase(alarm.bedTime, alarm.wakeTime, now);
  const bedNext = nextOccurrence(alarm.bedTime, now);
  if (phase === "late") {
    node.textContent = formatRemain(now.getTime() - (bedNext.getTime() - 86400000));
  } else {
    node.textContent = formatRemain(bedNext.getTime() - now.getTime());
  }
}

