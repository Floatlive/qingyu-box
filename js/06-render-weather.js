/* ==========================================================
   06-render-weather.js
   渲染：页面通用工具、ui 状态、天气页
   ========================================================== */
/* ============================================================
   十一、图标：天气手绘 SVG + 导航线条 SVG
   ============================================================ */
function weatherGlyph(id, cls) {
  return lifeIcon(id, cls || "glyph");
}

// 导航其余图标（线条风）
function navIcon(name, cls) {
  return lifeIcon(name, cls || "glyph");
}
/* ============================================================
   十二、界面本地状态（对应各组件 useState）
   ============================================================ */
const now0 = new Date();
const ui = {
  aiConfig: readAiConfig(),
  weather: { text: "", tag: null, calY: now0.getFullYear(), calM: now0.getMonth(), selected: todayKey(), confirmId: null, hydrated: false, moreTags: false,
    aiBusy: false, aiMsg: null, aiOpen: false },
  quest: { openForm: false, text: "", difficulty: "easy", minutes: "15", error: null, confirmId: null },
  cooler: { text: "", result: null, until: null, copied: false, confirmId: null },
  trivia: { category: "动物", name: "", preview: null, imageId: null, error: null, hit: null, miss: null, confirmId: null, customName: "", customFact: "", customError: null, customConfirm: null,
    aiOpen: false, aiBusy: false, aiMsg: null, lastRandomId: null },
  alarm: {
    newTime: "22:00",
    newLabel: "",
    perm: typeof Notification !== "undefined" ? Notification.permission : "unknown",
    notice: null,
    newBedTask: "",
    hopeInput: state.bedHope.text || "",
    breathing: false,
    breathIn: true,
    breathRound: 1,
    breathText: "",
    goodNightIdx: 0,
    bedConfirm: null,
    forecastOpen: false,
    settingsOpen: false,
    remindersOpen: false,
  },
};

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ============================================================
   十三、渲染总控
   ============================================================ */
let activeTab = "weather";

function renderAll() {
  const d = new Date();
  document.getElementById("top-date").textContent =
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("on", btn.dataset.tab === activeTab);
  });
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("active", v.dataset.view === activeTab);
  });
  renderWeather();
  renderQuest();
  renderCooler();
  renderTrivia();
  renderAlarm();
}

/* ============================================================
   十四、情绪天气渲染
   ============================================================ */
function renderWeather() {
  const el = document.getElementById("view-weather");
  const u = ui.weather;
  const t = todayKey();
  const existing = state.moods.find((m) => m.date === t);
  if (!u.hydrated) {
    u.text = existing ? existing.text : "";
    u.tag = existing ? existing.tag : null;
    u.hydrated = true;
  }
  const commonTags = MOOD_TAGS.slice(0, 6);
  const selectedExtra = MOOD_TAGS.find((item) => item.id === u.tag && !commonTags.includes(item));
  const tagButton = (item) => `<button type="button" class="chip ${u.tag === item.id ? "on" : ""}" aria-pressed="${u.tag === item.id}" onclick="toggleMoodTag('${item.id}')">${commonTags.includes(item) ? weatherGlyph(item.w, "life-icon") : ""}<span>${item.label}</span></button>`;
  const tagGroups = [
    { label: "轻松 · 有劲", weather: "sunny" },
    { label: "平淡 · 想歇歇", weather: "cloudy" },
    { label: "低落 · 没力气", weather: "overcast" },
    { label: "委屈 · 想被关心", weather: "rain" },
    { label: "生气 · 有点烦", weather: "storm" },
    { label: "焦虑 · 有压力", weather: "muggy" },
    { label: "迷茫 · 理不清", weather: "fog" },
  ];
  const trimmed = u.text.trim();
  const weather = mapMood(trimmed, u.tag);
  const comment = pickComment(weather, `${t}|${trimmed}|${u.tag || ""}`);

  let html = pageIntro("weather");

  if (hasRainStreak(state.moods)) {
    html += `<p class="card dashed small" style="padding:12px 14px;">连续三天是雨或雷。不必急着变晴，可以只做一件很小的事，比如出门走十分钟。</p>`;
  }

  // 记录卡片
  html += `<section class="card mood-compose">
    <p class="tiny mono muted">${formatCnDate(t)}</p>
    <label class="lbl compose-label" for="mood-text" style="margin-top:10px;">${lifeIcon("note")}今天一句</label>
    <textarea class="txt" id="mood-text" maxlength="200" placeholder="写今天的状态，或只选下面的标签" oninput="weatherTyping(this.value)">${esc(u.text)}</textarea>
    <div id="mood-tags" role="group" aria-label="情绪状态" style="margin-top:10px;">
      <div class="mood-common">${commonTags.map(tagButton).join("")}</div>
      ${!u.moreTags && selectedExtra ? `<div class="mood-selected"><span class="tiny muted">已选</span>${tagButton(selectedExtra)}</div>` : ""}
      <div id="mood-more" ${u.moreTags ? "" : "hidden"}>
        ${u.moreTags ? tagGroups.map((group) => `<div class="mood-group" role="group" aria-label="${group.label}">
          <p class="tiny muted">${group.label}</p>
          <div class="wrap">${MOOD_TAGS.filter((item) => item.w === group.weather && !commonTags.includes(item)).map(tagButton).join("")}</div>
        </div>`).join("") : ""}
      </div>
    </div>
    <button class="btn ghost block mood-more-toggle" aria-expanded="${u.moreTags}" aria-controls="mood-more" onclick="toggleMoodTags()">${u.moreTags ? "收起细分状态 −" : "更多状态 +"}</button>
    <div id="weather-live">${weatherLiveHtml()}</div>
    <button id="mood-submit" class="btn primary block" style="margin-top:12px;" ${!trimmed && !u.tag ? "disabled" : ""} onclick="submitMood()">
      ${existing ? "更新今天" : "记下今天"}
    </button>
    <div class="row mood-tools">
      <button class="btn ghost" ${u.aiBusy ? "disabled" : ""} onclick="runWeatherAi()">
        ${u.aiBusy ? "识别中…" : "用 AI 帮我选"}
      </button>
      <button class="btn ghost" style="flex:0 0 auto;" aria-expanded="${u.aiOpen}" onclick="toggleWeatherAiPanel()">AI 设置</button>
    </div>
    ${u.aiMsg ? `<p class="small" style="margin-top:10px;color:var(--ink-soft);">${esc(u.aiMsg)}</p>` : ""}
    ${u.aiOpen ? `
      <div style="margin-top:12px;padding:14px;background:var(--card-2);border:1px solid var(--line);border-radius:var(--radius-sm);">
        <div class="field">
          <label class="lbl">接口地址 Base URL</label>
          <input class="txt" value="${esc(ui.aiConfig.baseUrl)}" placeholder="https://api.openai.com/v1" oninput="ui.aiConfig.baseUrl=this.value"/>
        </div>
        <div class="field">
          <label class="lbl">API 密钥</label>
          <input class="txt" value="${esc(ui.aiConfig.apiKey)}" placeholder="sk-..." oninput="ui.aiConfig.apiKey=this.value"/>
        </div>
        <div class="field">
          <label class="lbl">模型名</label>
          <input class="txt" value="${esc(ui.aiConfig.model)}" placeholder="gpt-4o-mini" oninput="ui.aiConfig.model=this.value"/>
        </div>
        <button class="btn block" onclick="saveWeatherAiSettings()">保存设置</button>
        <p class="tiny muted" style="margin-top:8px;">这里和冷知识页共用同一份配置，密钥只存在本机浏览器。</p>
      </div>` : ""}
  </section>`;

  // 统计
  html += statBlock("本周", countWeathers(state.moods, datesInWeek()));
  html += statBlock("本月", countWeathers(state.moods, datesInMonth(u.calY, u.calM)));

  // 月历
  html += calendarHtml();

  // 最近
  html += `<section class="card"><h2 class="card-title">${lifeIcon("note")}最近</h2>`;
  if (state.moods.length === 0) {
    html += `<p class="small muted">记下第一天之后，这里会出现天气卡片。</p>`;
  } else {
    html += state.moods.slice(0, 21).map((m) => `
      <article class="entry" style="margin-bottom:12px;">
        ${weatherGlyph(m.weather, "glyph md")}
        <div class="body">
          <p class="meta">${formatCnDate(m.date)} · ${weatherLabel(m.weather)}</p>
          <p class="txt-line">${m.text ? esc(m.text) : "只选了标签"}</p>
          <p class="small muted" style="margin-top:2px;">${esc(m.comment)}</p>
          <button class="btn ghost block" style="min-height:38px;margin-top:6px;" onclick="moodDelete('${m.id}')">
            ${u.confirmId === m.id ? "再点一次删除" : "删除这条"}
          </button>
        </div>
      </article>`).join("");
  }
  html += `</section>`;

  el.innerHTML = html;
}

function weatherLiveHtml() {
  const u = ui.weather;
  const trimmed = u.text.trim();
  if (!trimmed && !u.tag) return "";
  const weather = mapMood(trimmed, u.tag);
  const comment = pickComment(weather, `${todayKey()}|${trimmed}|${u.tag || ""}`);
  return `<div class="preview-box" style="margin-top:12px;">
    ${weatherGlyph(weather, "glyph")}
    <div style="min-width:0;">
      <p class="wlabel">${weatherLabel(weather)}</p>
      <p class="wcomment">${esc(comment)}</p>
    </div>
  </div>`;
}

function statBlock(title, rows) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const visible = rows.filter((r) => r.count > 0);
  let h = `<section class="card"><h2 class="card-title">${title}</h2>`;
  if (total === 0) {
    h += `<p class="small muted">这一段还没有记录。</p>`;
  } else {
    h += visible.map((r) => {
      const pct = Math.round((r.count / total) * 100);
      return `<div class="stat-li">
        <div class="stat-head"><span>${r.label}</span><span class="mono muted">${r.count} 天 · ${pct}%</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </div>`;
    }).join("");
    const top = visible.slice().sort((a, b) => b.count - a.count)[0];
    const topPct = Math.round((top.count / total) * 100);
    h += `<p class="stat-verb">「${top.label}」出场最多，占了 ${topPct}%，这是你这一段最常出现的状态。</p>`;
  }
  return h + `</section>`;
}

function calendarHtml() {
  const u = ui.weather;
  const y = u.calY;
  const m = u.calM;
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const byDate = new Map(state.moods.map((x) => [x.date, x]));
  const selectedEntry = byDate.get(u.selected);

  let h = `<section class="card">
    <div class="cal-head">
      <h2>${y}年${m + 1}月</h2>
      <div class="row" style="flex:0 0 auto;">
        <button class="btn" style="min-height:40px;width:42px;padding:0;" onclick="calMove(-1)" aria-label="上个月">‹</button>
        <button class="btn" style="min-height:40px;width:42px;padding:0;" onclick="calMove(1)" aria-label="下个月">›</button>
      </div>
    </div>
    <div class="cal-grid">
      ${["一", "二", "三", "四", "五", "六", "日"].map((d) => `<div class="cal-dow">${d}</div>`).join("")}`;
  for (let i = 0; i < firstDow; i++) h += `<div class="cal-cell pad"></div>`;
  for (let day = 1; day <= days; day++) {
    const key = todayKey(new Date(y, m, day));
    const entry = byDate.get(key);
    h += `<button type="button" class="cal-cell ${u.selected === key ? "sel" : ""}" onclick="calSelect('${key}')">
      <span>${day}</span>
      ${entry ? weatherGlyph(entry.weather, "glyph sm") : `<span class="glyph sm"></span>`}
    </button>`;
  }
  h += `</div><div class="divider" style="margin-top:12px;"></div>`;
  if (selectedEntry) {
    h += `<div class="entry">
      ${weatherGlyph(selectedEntry.weather, "glyph md")}
      <div class="body">
        <p class="meta">${formatCnDate(selectedEntry.date)} · ${weatherLabel(selectedEntry.weather)}</p>
        <p class="txt-line">${selectedEntry.text ? esc(selectedEntry.text) : "只选了标签"}</p>
        <p class="small muted" style="margin-top:2px;">${esc(selectedEntry.comment)}</p>
      </div>
    </div>`;
  } else {
    h += `<p class="small muted">${formatCnDate(u.selected)} 没有记录。</p>`;
  }
  return h + `</section>`;
}

