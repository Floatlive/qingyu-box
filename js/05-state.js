/* ==========================================================
   05-state.js
   全局状态：commit / saveMood 等业务动作
   ========================================================== */
/* ============================================================
   十、全局状态与操作（对应原 store）
   ============================================================ */
let state = readStorage();
let questNote = "";

function commit() {
  writeStorage(state);
  renderAll();
}

function saveMood(text, tag) {
  const trimmed = text.trim();
  if (!trimmed && !tag) return;
  const date = todayKey();
  const weather = mapMood(trimmed, tag);
  const comment = pickComment(weather, `${date}|${trimmed}|${tag || ""}`);
  const existing = state.moods.find((m) => m.date === date);
  const entry = existing
    ? Object.assign({}, existing, { text: trimmed, tag, weather, comment })
    : { id: uid(), date, text: trimmed, tag, weather, comment, createdAt: Date.now() };
  const moods = [entry]
    .concat(state.moods.filter((m) => m.date !== date))
    .sort((a, b) => b.date.localeCompare(a.date));
  state = Object.assign({}, state, { moods });
  commit();
}

function removeMood(id) {
  state = Object.assign({}, state, { moods: state.moods.filter((m) => m.id !== id) });
  commit();
}

function doDraw() {
  const result = drawQuest(state);
  state = result.data;
  questNote = result.note;
  commit();
}

function changeQuestStatus(id, status) {
  state = Object.assign({}, state, {
    questLogs: state.questLogs.map((q) => (q.id === id ? Object.assign({}, q, { status }) : q)),
  });
  commit();
}

function addCustomQuest(text, difficulty, minutes) {
  const trimmed = text.trim();
  if (!trimmed) return "先写一句任务。";
  if (minutes < 1 || minutes > 180) return "耗时请填 1 到 180 分钟。";
  state = Object.assign({}, state, {
    customQuests: [
      { id: uid(), text: trimmed.slice(0, 80), difficulty, minutes: Math.round(minutes), custom: true },
    ].concat(state.customQuests),
  });
  commit();
  return null;
}

function removeCustomQuest(id) {
  state = Object.assign({}, state, { customQuests: state.customQuests.filter((q) => q.id !== id) });
  commit();
}

function recordCooler(original, result) {
  state = Object.assign({}, state, {
    coolerLogs: [
      {
        id: uid(),
        createdAt: Date.now(),
        original: original.slice(0, 1000),
        rewritten: result.rewritten,
        level: result.level,
        score: result.score,
        waitMin: result.waitMin,
      },
    ]
      .concat(state.coolerLogs)
      .slice(0, 30),
  });
  commit();
}

function coolerLogDelete(id) {
  const u = ui.cooler;
  if (u.confirmId === id) {
    state = Object.assign({}, state, { coolerLogs: state.coolerLogs.filter((l) => l.id !== id) });
    u.confirmId = null;
    commit();
    renderCooler();
  } else {
    u.confirmId = id;
    renderCooler();
  }
}

function saveTriviaFav(input) {
  state = Object.assign({}, state, {
    trivia: [
      {
        id: uid(),
        name: input.name,
        category: input.category,
        fact: input.fact,
        date: todayKey(),
        imageId: input.imageId,
      },
    ].concat(state.trivia),
  });
  commit();
}

function removeTrivia(id) {
  const item = state.trivia.find((t) => t.id === id);
  state = Object.assign({}, state, { trivia: state.trivia.filter((t) => t.id !== id) });
  commit();
  if (item && item.imageId) deleteImage(item.imageId).catch(() => {});
}

function setAlarmClock(patch) {
  state = Object.assign({}, state, {
    alarm: Object.assign({}, state.alarm, patch),
  });
  commit();
}

function addReminder(time, label) {
  if (state.alarm.reminders.length >= 8) return;
  state = Object.assign({}, state, {
    alarm: Object.assign({}, state.alarm, {
      reminders: state.alarm.reminders.concat([
        {
          id: uid(),
          time,
          label: label.trim() || "提醒",
          enabled: true,
          weekdays: [0, 1, 2, 3, 4, 5, 6],
        },
      ]),
    }),
  });
  commit();
}

function patchReminder(id, patch) {
  state = Object.assign({}, state, {
    alarm: Object.assign({}, state.alarm, {
      reminders: state.alarm.reminders.map((r) => (r.id === id ? Object.assign({}, r, patch) : r)),
    }),
  });
  commit();
}

function deleteReminder(id) {
  state = Object.assign({}, state, {
    alarm: Object.assign({}, state.alarm, {
      reminders: state.alarm.reminders.filter((r) => r.id !== id),
    }),
  });
  commit();
}

function markFired(keys) {
  if (keys.length === 0) return;
  state = Object.assign({}, state, { fired: state.fired.concat(keys).slice(-200) });
  writeStorage(state);
}

function exportBundle() {
  const ids = state.trivia.map((t) => t.imageId).filter(Boolean);
  return getImages(ids).then((images) =>
    JSON.stringify(
      { app: "晴雨匣", version: 1, exportedAt: new Date().toISOString(), data: state, images },
      null,
      2,
    ),
  );
}

function importBundle(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return Promise.resolve("这个文件不是有效的 JSON。");
  }
  const bundle = parsed;
  const source = bundle && typeof bundle === "object" && "data" in bundle ? bundle.data : parsed;
  const data = normalizeData(source);
  const images =
    bundle && typeof bundle === "object" && bundle.images && typeof bundle.images === "object"
      ? bundle.images
      : {};
  const tasks = Object.entries(images)
    .filter((entry) => typeof entry[1] === "string" && entry[1].startsWith("data:image/"))
    .map((entry) => putImage(entry[0], entry[1]));
  return Promise.all(tasks).then(() => {
    state = mergeData(state, data);
    questNote = "备份已合并进来，原有内容没有被清掉。";
    commit();
    return null;
  });
}
