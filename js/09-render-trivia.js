/* ==========================================================
   09-render-trivia.js
   渲染：冷知识页
   ========================================================== */
/* ============================================================
   十七、识图冷知识渲染
   ============================================================ */
function renderTrivia() {
  const el = document.getElementById("view-trivia");
  const u = ui.trivia;
  const isCustom = u.category === "自选";
  const isAuto = u.category === "自动";
  const options = isCustom
    ? state.customTrivia
    : isAuto
      ? TRIVIA
      : TRIVIA.filter((item) => item.category === u.category);

  let h = pageIntro("trivia") + `<p class="small muted">从相册选一张生活里的照片，配上想记住的小知识。</p>

  <label class="dropzone" id="trivia-drop"
    ondragover="event.preventDefault();dragZone(1)" ondragleave="dragZone(0)" ondrop="dropImage(event)">
    ${u.preview
      ? `<img src="${u.preview}" alt="已选择的配图"/>`
      : `${lifeIcon("photo", "photo-icon")}<span class="small muted">点这里从相册选择，或把图片拖进来</span>`}
    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;" onchange="pickImage(this)"/>
  </label>
  ${u.error ? `<p class="small" style="color:var(--stamp);">${esc(u.error)}</p>` : ""}

  <section class="card" style="padding:14px 16px;">
    <div class="row" style="flex:none;gap:10px;align-items:center;">
      <button class="btn primary" style="flex:1;" ${u.aiBusy ? "disabled" : ""} onclick="runAiRecognize()">
        ${u.aiBusy ? "识别中…" : "AI 自动识图"}
      </button>
      <button class="btn ghost" style="flex:0 0 auto;" onclick="toggleAiPanel()">AI 设置</button>
    </div>
    ${u.aiMsg ? `<p class="small" style="margin-top:10px;color:var(--ink-soft);">${esc(u.aiMsg)}</p>` : ""}
    ${u.aiOpen ? `
      <div style="margin-top:12px;">
        <div class="field">
          <label class="lbl">接口地址 Base URL</label>
          <input class="txt" value="${esc(ui.aiConfig.baseUrl)}" placeholder="https://api.openai.com/v1" oninput="ui.aiConfig.baseUrl=this.value"/>
        </div>
        <div class="field">
          <label class="lbl">API 密钥</label>
          <input class="txt" value="${esc(ui.aiConfig.apiKey)}" placeholder="sk-..." oninput="ui.aiConfig.apiKey=this.value"/>
        </div>
        <div class="field">
          <label class="lbl">模型名（需支持图片）</label>
          <input class="txt" value="${esc(ui.aiConfig.model)}" placeholder="gpt-4o-mini" oninput="ui.aiConfig.model=this.value"/>
        </div>
        <button class="btn block" onclick="saveAiSettings()">保存设置</button>
        <p class="tiny muted" style="margin-top:8px;">密钥只存在这台设备的浏览器里，不会上传；调用会产生该服务商的费用，接口还需允许浏览器跨域。</p>
      </div>` : ""}
  </section>

  <div>
    <label class="lbl">类别</label>
    <div class="wrap">
      ${TRIVIA_CATEGORIES.map((c) =>
        `<button type="button" class="chip ${u.category === c ? "on" : ""}" onclick="setTriviaCategory('${c}')">${c}</button>`
      ).join("")}
    </div>
  </div>`;

  if (isCustom) {
    h += `<section class="card">
      <h2 class="card-title">添加我的冷知识</h2>
      <div class="field">
        <label class="lbl">名称</label>
        <input class="txt" maxlength="40" value="${esc(u.customName)}" placeholder="比如 我的钥匙、工位的多肉" oninput="ui.trivia.customName=this.value"/>
      </div>
      <div class="field">
        <label class="lbl">内容</label>
        <textarea class="txt" maxlength="300" placeholder="写一条你知道、想记住的小知识" oninput="ui.trivia.customFact=this.value">${esc(u.customFact)}</textarea>
      </div>
      ${u.customError ? `<p class="small" style="color:var(--stamp);margin-bottom:10px;">${esc(u.customError)}</p>` : ""}
      <button class="btn primary block" onclick="addCustomTrivia()">保存这条</button>
    </section>`;
  }

  h += `<div>
    <label class="lbl">${isCustom ? "我添加的" : "从库里选"}</label>
    <select class="txt" onchange="ui.trivia.name=this.value">
      <option value="">${isCustom ? "选择一条" : "选择主体"}</option>
      ${options.map((item) =>
        `<option value="${esc(item.name)}" ${u.name === item.name ? "selected" : ""}>${item.name}</option>`
      ).join("")}
    </select>
  </div>

  <div>
    <label class="lbl">或自己输入</label>
    <input class="txt" maxlength="40" value="${esc(u.name)}" placeholder="比如 猫、砖墙、蜂蜜" oninput="ui.trivia.name=this.value"/>
  </div>

  <div class="row" style="flex:none;gap:10px;">
    <button class="btn primary" style="flex:1;" onclick="searchTrivia()">查一条</button>
    <button class="btn" style="flex:1;" onclick="randomTrivia()">随机来一条</button>
  </div>`;

  if (u.miss) h += `<p class="card small" style="padding:12px 14px;">${esc(u.miss)}</p>`;

  if (u.hit) {
    h += `<article class="card">
      <p class="tiny mono muted">${esc(u.hit.category)}</p>
      <h2 class="fact-name">${esc(u.hit.name)}<span class="cold-tag">冷度 ${coldLevel(u.hit.name)}%</span></h2>
      ${u.hit.ai ? `<p class="tiny muted">这条由 AI 识图生成，内容请自己再核对一下。</p>` : ""}
      ${u.hit.cross ? `<p class="tiny muted">这个条目在别的类别里，已经找过来了。</p>` : ""}
      <p class="small" style="line-height:1.7;margin-top:8px;">${esc(u.hit.fact)}</p>
      <button class="btn primary block" style="margin-top:12px;" onclick="saveTrivia()">保存到收藏</button>
    </article>`;
  }

  if (isCustom && state.customTrivia.length > 0) {
    h += `<section class="card"><h2 class="card-title">我的自选库</h2>`;
    h += state.customTrivia.map((item) => `
      <article style="margin-bottom:12px;">
        <h3 style="font-size:17px;">${esc(item.name)}</h3>
        <p class="small muted" style="margin-top:4px;">${esc(item.fact)}</p>
        <div class="row" style="margin-top:8px;flex:none;">
          <button class="btn" style="min-height:40px;" onclick="viewCustomTrivia('${item.id}')">查看</button>
          <button class="btn ghost" style="min-height:40px;" onclick="customTriviaDelete('${item.id}')">
            ${u.customConfirm === item.id ? "确认删除" : "删除"}
          </button>
        </div>
      </article>`).join("");
    h += `</section>`;
  }

  h += `<section class="card"><h2 class="card-title">${lifeIcon("heart")}冷知识收藏</h2>`;
  if (state.trivia.length === 0) {
    h += `<p class="small muted">保存之后，配图和句子会留在这台设备上。</p>`;
  } else {
    h += state.trivia.map((item) => `
      <article class="entry" style="margin-bottom:12px;">
        <span class="thumb" data-thumb="${esc(item.imageId || "")}"></span>
        <div class="body">
          <p class="meta">${formatCnDate(item.date)} · ${esc(item.category)}</p>
          <h3 style="font-size:18px;">${esc(item.name)}</h3>
          <p class="small muted">${esc(item.fact)}</p>
          <button class="btn ghost" style="min-height:38px;margin-top:6px;" onclick="triviaDelete('${item.id}')">
            ${u.confirmId === item.id ? "再点一次删除" : "删除"}
          </button>
        </div>
      </article>`).join("");
  }
  h += `</section>`;

  el.innerHTML = h;
  loadThumbs();
}

function loadThumbs() {
  document.querySelectorAll("[data-thumb]").forEach((node) => {
    const id = node.getAttribute("data-thumb");
    if (!id) {
      node.style.background = "var(--paper-deep)";
      return;
    }
    getImage(id).then((src) => {
      if (src) {
        node.outerHTML = `<img class="thumb" src="${src}" alt="配图"/>`;
      }
    }).catch(() => {});
  });
}

