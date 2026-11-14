/* ==========================================================
   10-render-alarm.js
   渲染：入睡页
   ========================================================== */
/* ============================================================
   十八、反向闹钟渲染
   ============================================================ */
const DAYS = [
  { v: 1, l: "一" }, { v: 2, l: "二" }, { v: 3, l: "三" }, { v: 4, l: "四" },
  { v: 5, l: "五" }, { v: 6, l: "六" }, { v: 0, l: "日" },
];

function renderAlarm() {
  const el = document.getElementById("view-alarm");
  const u = ui.alarm;
  const alarm = state.alarm;
  const now = new Date();
  const phase = clockPhase(alarm.bedTime, alarm.wakeTime, now);
  const bedNext = nextOccurrence(alarm.bedTime, now);
  const wakeNext = nextOccurrence(alarm.wakeTime, now);
  const planned = plannedSleepHours(alarm.bedTime, alarm.wakeTime);
  const remainToWake = (wakeNext.getTime() - now.getTime()) / 3600000;
  const later = Math.max(0, remainToWake - 0.5);

  let h = pageIntro("alarm");
  if (u.notice) h += `<p class="card small" style="padding:12px 14px;" role="status">${esc(u.notice)}</p>`;

  /* 睡前待办：把脑子倒空 */
  h += `<section class="card">
    <h2 class="card-title">${lifeIcon("note")}把脑子倒空</h2>
    <p class="small muted">写下来，脑子就不用连夜加班帮你记着了。明天要做的事，先放这。</p>
    <div class="row" style="margin-top:12px;flex:none;gap:8px;">
      <input class="txt" maxlength="80" value="${esc(u.newBedTask)}" placeholder="明天要做的一件小事" style="flex:1;"
        oninput="ui.alarm.newBedTask=this.value" onkeydown="if(event.key==='Enter'){event.preventDefault();addBedTask();}"/>
      <button class="btn primary" style="flex:0 0 auto;" onclick="addBedTask()">添加</button>
    </div>`;
  if (state.bedTasks.length > 0) {
    h += `<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">`;
    h += state.bedTasks.map((t) => `
      <div class="row" style="flex:none;align-items:center;gap:8px;background:var(--card-2);border:1px solid var(--line-soft);border-radius:12px;padding:8px 10px;">
        <button class="btn ghost" style="min-height:38px;flex:0 0 auto;padding:0 12px;" onclick="toggleBedTask('${t.id}')">${t.done ? "已完成" : "待办"}</button>
        <p class="small" style="flex:1;min-width:0;margin:0;${t.done ? "text-decoration:line-through;color:var(--faint);" : ""}">${esc(t.text)}</p>
        <button class="btn ghost" style="min-height:38px;flex:0 0 auto;padding:0 12px;" onclick="bedTaskDelete('${t.id}')">${u.bedConfirm === t.id ? "确认" : "删除"}</button>
      </div>`).join("");
    h += `</div>`;
  }
  h += `</section>`;

  /* 明天的盼头 */
  h += `<section class="card">
    <h2 class="card-title">${lifeIcon("sunny")}明天的盼头</h2>
    <p class="small muted">给自己留一个起床的理由，哪怕只是一顿好吃的。</p>
    <input class="txt" maxlength="120" value="${esc(u.hopeInput)}" placeholder="比如 明天中午去吃那家面" style="margin-top:12px;" oninput="ui.alarm.hopeInput=this.value"/>
    <button class="btn primary block" style="margin-top:10px;" onclick="saveBedHope()">记下这个盼头</button>
  </section>`;

  h += `<section class="card">
    <p class="tiny muted">${phase === "late" ? "已过目标入睡" : "距离目标入睡"}</p>
    <p class="big-num" id="alarm-big" style="margin-top:8px;"></p>
    <p class="sleep-title">${sleepTitle(phase, phase === "late" ? remainToWake : planned)}</p>
    <div class="divider" style="margin:12px 0;"></div>
    <div class="small">
      ${phase === "late"
        ? `<p>如果现在还不睡，到 ${alarm.wakeTime} 大约只剩 ${formatHours(remainToWake)}。</p>
           <p class="muted" style="margin-top:8px;">再拖 30 分钟，就大约只剩 ${formatHours(later)}。</p>
           <p style="margin-top:10px;">${nightLine(remainToWake)}</p>`
        : `<p>如果准时在 ${alarm.bedTime} 睡到 ${alarm.wakeTime}，大约能睡 ${planned === null ? "—" : formatHours(planned)}。</p>
           <p style="margin-top:10px;">${dayLine()}</p>`}
    </div>
  </section>`;

  /* 明日状态预测：游戏化熬夜代价（前置，先看到后果） */
  const fc = sleepForecast();
  const bar = (label, val, warn) => `
    <div style="margin-bottom:8px;">
      <div class="row" style="flex:none;justify-content:space-between;font-size:13px;color:var(--ink-soft);">
        <span>${label}</span><span>${val}</span>
      </div>
      <div style="height:8px;background:var(--line-soft);border-radius:99px;overflow:hidden;margin-top:4px;">
        <div style="height:100%;width:${val}%;background:${warn ? "var(--ochre)" : "var(--grad)"};border-radius:99px;"></div>
      </div>
    </div>`;
  h += `<section class="card">
    <h2 class="card-title">现在不睡，明天会怎样</h2>
    ${ui.alarm.forecastOpen ? `
      <p class="small muted">继续熬到起床，约等于整宿没睡，明天的配置是：</p>
      <p class="small" style="margin-top:8px;font-size:16px;"><span style="color:var(--stamp);font-weight:700;">${fc.level}</span></p>
      <div style="margin-top:12px;">
        ${bar("耐心", fc.patience)}
        ${bar("专注力", fc.focus)}
        ${bar("精力", fc.energy)}
        ${bar("嘴馋程度", fc.snack, true)}
        ${bar("黑眼圈程度", fc.eye, true)}
      </div>
      <p class="small" style="margin-top:12px;line-height:1.7;color:var(--ink-soft);">${esc(NO_SLEEP_LINES[ui.alarm.nosleepIdx || 0])}</p>
      <p class="small muted" style="margin-top:10px;">反过来，现在去睡还能救回约 <b>${fc.sleepHours.toFixed(1)}</b> 小时。</p>
      <button class="btn ghost block" style="margin-top:12px;" onclick="toggleForecast()">收起</button>
    ` : `
      <p class="small muted">点一下，看看继续熬下去，明天的你是个什么配置。</p>
      <button class="btn primary block" style="margin-top:12px;" onclick="toggleForecast()">查看</button>
    `}
  </section>`;

  h += `<details class="card sleep-details" id="sleep-settings" ${u.settingsOpen ? "open" : ""} ontoggle="if(this.isConnected)ui.alarm.settingsOpen=this.open">
    <summary><span><strong>作息时间</strong><span class="small muted">${alarm.bedTime} 睡觉 · ${alarm.wakeTime} 起床</span></span><span class="detail-indicator" aria-hidden="true"></span></summary>
    <div class="row detail-content" style="flex:none;gap:12px;">
    <div style="flex:1;">
      <label class="lbl" for="bed">目标睡觉</label>
      <input class="txt" id="bed" type="time" value="${alarm.bedTime}" onchange="setClock('bedTime',this.value)"/>
    </div>
    <div style="flex:1;">
      <label class="lbl" for="wake">起床</label>
      <input class="txt" id="wake" type="time" value="${alarm.wakeTime}" onchange="setClock('wakeTime',this.value)"/>
    </div>
    </div>
  </details>

  <details class="card sleep-details" id="sleep-reminders" ${u.remindersOpen ? "open" : ""} ontoggle="if(this.isConnected)ui.alarm.remindersOpen=this.open">
    <summary><span><strong>到点提醒</strong><span class="small muted">${alarm.reminders.length ? `${alarm.reminders.filter((reminder) => reminder.enabled && reminder.weekdays.length).length} 条生效 · 共 ${alarm.reminders.length} 条` : "还没有提醒，点此添加"}</span></span><span class="detail-indicator" aria-hidden="true"></span></summary>
    <div class="detail-content">
    <p class="small muted">页面打开时会响，并尽量弹出系统通知。应用关着的时候，系统不一定还能叫你。</p>
    <button class="btn block" style="margin-top:10px;" onclick="requestNotify()">
      ${u.perm === "granted" ? "通知已允许" : u.perm === "denied" ? "通知被拒绝" : "允许通知"}
    </button>
    ${u.perm === "denied" ? `<p class="tiny muted" style="margin-top:8px;">可以在浏览器设置里重新允许。页面里的提醒仍然会显示。</p>` : ""}

    <ul style="list-style:none;margin:14px 0 0;padding:0;">
      ${alarm.reminders.map((r) => `
        <li class="rem-item">
          <div class="row" style="flex:none;gap:8px;">
            <input class="txt" aria-label="提醒名称" maxlength="20" value="${esc(r.label)}" style="flex:1;" onchange="editReminder('${r.id}','label',this.value)"/>
            <input class="txt" aria-label="提醒时间" type="time" value="${r.time}" style="flex:0 0 110px;" onchange="editReminder('${r.id}','time',this.value.slice(0,5))"/>
          </div>
          <div class="week-row">
            ${DAYS.map((d) => `
              <button type="button" class="week-btn ${r.weekdays.includes(d.v) ? "on" : ""}" aria-label="周${d.l}" aria-pressed="${r.weekdays.includes(d.v)}"
                onclick="toggleWeekday('${r.id}',${d.v})">${d.l}</button>`).join("")}
          </div>
          <div class="switch-line">
            <button class="btn ${r.enabled ? "" : "ghost"}" onclick="toggleReminder('${r.id}')">${r.enabled ? "已开启" : "已关闭"}</button>
            <button class="btn ghost" onclick="deleteReminder('${r.id}')">删除</button>
          </div>
        </li>`).join("")}
    </ul>

    ${alarm.reminders.length < 8 ? `
      <form onsubmit="event.preventDefault();submitNewReminder();">
        <label class="lbl" style="margin-top:6px;">再加一条</label>
        <div class="row" style="flex:none;gap:8px;">
          <input class="txt" maxlength="20" value="${esc(u.newLabel)}" placeholder="比如 刷牙" style="flex:1;" oninput="ui.alarm.newLabel=this.value"/>
          <input class="txt" type="time" value="${u.newTime}" style="flex:0 0 110px;" onchange="ui.alarm.newTime=this.value.slice(0,5)"/>
        </div>
        <button class="btn block" type="submit" style="margin-top:10px;">添加提醒</button>
      </form>` : ""}
    </div>
  </details>`;

  /* 呼吸放松 */
  h += `<section class="card" style="text-align:center;">
    <h2 class="card-title" style="text-align:left;">${lifeIcon("quest")}呼吸放松</h2>
    <p class="small muted" style="text-align:left;">跟着圆的节奏，吸气时让它变大，呼气时变小。</p>`;
  if (u.breathing) {
    h += `<div style="margin:18px auto 10px;width:120px;height:120px;border-radius:50%;background:var(--grad);
      transform:scale(${u.breathIn ? 1.35 : 0.75});transition:transform 4s ease-in-out;opacity:0.85;"></div>
      <p class="small" style="font-size:17px;margin-top:10px;">${u.breathText}</p>
      <p class="tiny muted">第 ${u.breathRound} / 8 轮</p>
      <button class="btn ghost block" style="margin-top:12px;" onclick="stopBreathing(false)">提前结束</button>`;
  } else {
    h += `<button class="btn primary block" style="margin-top:14px;" onclick="startBreathing()">开始呼吸放松（约 1 分钟）</button>`;
  }
  h += `</section>`;

  /* 晚安陪伴语 */
  h += `<section class="card" style="text-align:center;">
    <p class="small" style="line-height:1.8;font-size:15px;">${esc(GOOD_NIGHT[u.goodNightIdx])}</p>
    <button class="btn ghost block" style="margin-top:12px;" onclick="nextGoodNight()">换一句</button>
  </section>`;

  el.innerHTML = h;
  updateAlarmBig();
}
