/* ==========================================================
   08-render-cooler.js
   渲染：冷静页
   ========================================================== */
/* ============================================================
   十六、吵架冷静器渲染
   ============================================================ */
function renderCooler() {
  const el = document.getElementById("view-cooler");
  const u = ui.cooler;
  let h = pageIntro("cooler") + `<section class="card cooler-compose"><p class="small muted">把想发出去的话放进来。这里只改写和建议，不替你决定要不要发。</p>
    <textarea class="txt" maxlength="1000" placeholder="此刻想发出去的原文" oninput="coolerTyping(this.value)">${esc(u.text)}</textarea>
    <button id="cooler-submit" class="btn primary block" ${!u.text.trim() ? "disabled" : ""} onclick="runCooler()">${lifeIcon("cooler")}生成冷静版</button></section>`;

  if (u.result) {
    const r = u.result;
    h += `<section class="card">
      <div class="row" style="align-items:center;justify-content:space-between;flex:none;">
        <h2 class="card-title" style="border:none;margin:0;padding:0;">对照</h2>
        <span class="level-badge lv-${r.level}">${levelLabel(r.level)}</span>
      </div>
      <p class="tiny muted" style="margin-top:10px;">原文</p>
      <p class="small" style="white-space:pre-wrap;">${esc(u.text.trim())}</p>
      <p class="tiny muted" style="margin-top:12px;">冷静版</p>
      <p class="small" style="white-space:pre-wrap;">${esc(r.rewritten)}</p>
      <p class="small" style="margin-top:12px;">${esc(r.advice)}</p>`;

    if (r.waitMin > 0) {
      h += `<div class="countdown">
        <p class="tiny muted">冷静倒计时</p>
        <p class="cd-num" id="cd-num">--:--</p>
        <p class="tiny muted" id="cd-hint"></p>
        <button class="btn block" id="cd-again" style="display:none;margin-top:8px;" onclick="resetCoolerWait()">再等 ${r.waitMin} 分钟</button>
      </div>`;
    }

    h += `<button class="btn ${coolerWaiting() ? "ghost" : ""} block" style="margin-top:10px;" onclick="copyCooler()">
      ${u.copied ? "已复制冷静版" : coolerWaiting() ? "仍要复制（不建议现在发）" : "复制冷静版"}
    </button></section>`;
  }

  if (state.coolerLogs.length > 0) {
    h += `<section class="card"><h2 class="card-title">${lifeIcon("note")}最近改写</h2>`;
    h += state.coolerLogs.slice(0, 5).map((log) => `
      <article style="margin-bottom:10px;">
        <p class="tiny lv-${log.level}">${levelLabel(log.level)}</p>
        <p class="small muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(log.original)}</p>
        <p class="small" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${esc(log.rewritten)}</p>
        <button class="btn ghost" style="min-height:38px;margin-top:6px;" onclick="coolerLogDelete('${log.id}')">
          ${ui.cooler.confirmId === log.id ? "再点一次确认删除" : "删除"}
        </button>
      </article>`).join("");
    h += `</section>`;
  }

  el.innerHTML = h;
}

function coolerWaiting() {
  const u = ui.cooler;
  if (!u.until) return false;
  return u.until - Date.now() > 0;
}

