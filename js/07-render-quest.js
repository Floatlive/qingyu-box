/* ==========================================================
   07-render-quest.js
   渲染：冒险页
   ========================================================== */
/* ============================================================
   十五、随机小冒险渲染
   ============================================================ */
function renderQuest() {
  const el = document.getElementById("view-quest");
  const u = ui.quest;
  const t = todayKey();
  const streak = questStreak(state.questLogs);
  const todays = state.questLogs.filter((q) => q.date === t && q.status === "pending");

  let h = pageIntro("quest") + `<section class="kpi-grid">
    <div class="kpi"><p class="k-label">连续完成</p><p class="k-num">${streak.days}</p><p class="k-unit">天</p></div>
    <div class="kpi"><p class="k-label">累计完成</p><p class="k-num">${streak.total}</p><p class="k-unit">次</p></div>
  </section>
  <p class="rank-line">当前身份：<span>${questRank(streak.total)}</span></p>

  <button class="btn primary block" onclick="doDraw()">${lifeIcon("spark")}抽今日盲盒</button>`;
  if (questNote) h += `<p class="small muted">${esc(questNote)}</p>`;

  if (todays.length === 0) {
    const anyToday = state.questLogs.some((q) => q.date === t);
    h += `<p class="card small muted" style="padding:14px;">${anyToday ? "今天的任务已经处理完，去下面历史看看。" : "今天还没有任务，抽一条，或换成自己的。"}</p>`;
  }
  h += todays.map((q) => {
    const rarity = rarityOf(q.questId);
    return `
    <article class="card">
      <p class="tiny mono muted">今日 · ${difficultyLabel(q.difficulty)} · 约 ${q.minutes} 分钟${q.repeated ? " · 本周重复" : ""} <span class="rarity-tag ${rarity.cls}">${rarity.label}</span></p>
      <h2 style="font-size:20px;margin-top:8px;line-height:1.5;">${esc(q.text)}</h2>
      <p class="small muted" style="margin-top:6px;">${statusLabel(q.status)}</p>
      ${q.status === "pending"
        ? `<div class="row" style="margin-top:10px;">
            <button class="btn primary" onclick="questStatus('${q.id}','done')">完成</button>
            <button class="btn" onclick="questStatus('${q.id}','skipped')">跳过</button>
          </div>`
        : `<button class="btn ghost block" style="margin-top:10px;" onclick="questStatus('${q.id}','pending')">改回待完成</button>`}
    </article>`;
  }).join("");

  // 自定义任务
  h += `<section class="card">
    <button class="btn block" onclick="toggleQuestForm()">${u.openForm ? "收起表单" : "添加自己的任务"}</button>`;
  if (u.openForm) {
    h += `<div style="margin-top:14px;">
      <div class="field">
        <label class="lbl">任务</label>
        <input class="txt" id="quest-text" maxlength="80" value="${esc(u.text)}" placeholder="一件很小、今天能做完的事" oninput="ui.quest.text=this.value"/>
      </div>
      <label class="lbl">难度</label>
      <div class="wrap" style="margin-bottom:12px;">
        ${["easy", "mid", "hard"].map((d) =>
          `<button type="button" class="chip ${u.difficulty === d ? "on" : ""}" onclick="setDifficulty('${d}')">${difficultyLabel(d)}</button>`
        ).join("")}
      </div>
      <div class="field">
        <label class="lbl">预计分钟</label>
        <input class="txt" id="quest-min" inputmode="numeric" value="${esc(u.minutes)}" oninput="ui.quest.minutes=this.value.replace(/[^0-9]/g,'').slice(0,3)"/>
      </div>
      ${u.error ? `<p class="small" style="color:var(--stamp);margin-bottom:10px;">${esc(u.error)}</p>` : ""}
      <button class="btn primary block" onclick="submitCustomQuest()">放进任务池</button>
    </div>`;
  }
  if (state.customQuests.length > 0) {
    h += `<div style="margin-top:14px;display:flex;flex-direction:column;gap:8px;">
      ${state.customQuests.map((q) => `
        <div class="row" style="align-items:center;flex:none;background:var(--paper);border:1.5px solid var(--line-soft);border-radius:3px;padding:8px 10px;">
          <div style="flex:1;min-width:0;">
            <p class="small">${esc(q.text)}</p>
            <p class="tiny muted mono">${difficultyLabel(q.difficulty)} · ${q.minutes} 分钟</p>
          </div>
          <button class="btn ghost" style="min-height:40px;flex:0 0 auto;padding:0 12px;" onclick="customQuestDelete('${q.id}')">
            ${u.confirmId === q.id ? "确认" : "删除"}
          </button>
        </div>`).join("")}
    </div>`;
  }
  h += `</section>`;

  // 历史：所有已完成或跳过的（含今天）
  const past = state.questLogs.filter((q) => q.status !== "pending").slice(0, 30);
  h += `<section class="card"><h2 class="card-title">${lifeIcon("note")}历史</h2>`;
  if (past.length === 0) {
    h += `<p class="small muted">完成或跳过之后，任务会立刻出现在这里。</p>`;
  } else {
    h += past.map((q) => `
      <article style="margin-bottom:10px;">
        <p class="tiny mono muted">${formatCnDate(q.date)} · ${statusLabel(q.status)}</p>
        <p class="small" style="margin-top:2px;">${esc(q.text)}</p>
        <button class="btn ghost" style="min-height:38px;margin-top:6px;" onclick="questStatus('${q.id}','pending')">改回待完成</button>
      </article>`).join("");
  }
  h += `</section>`;

  el.innerHTML = h;
}
