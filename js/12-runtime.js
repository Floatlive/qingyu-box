/* ==========================================================
   12-runtime.js
   运行时：音频、提醒轮询、toast、切页与启动
   ========================================================== */
/* ============================================================
   二十、提示音与系统通知
   ============================================================ */
let audioCtx = null;
function unlockAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function beep() {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 494;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}
function sysNotify(title, body) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try { new Notification(title, { body }); } catch (e) {}
}

/* ============================================================
   二十一、提醒调度（每 10 秒）
   ============================================================ */
const seenFired = new Set();
function reminderTick() {
  const now = new Date();
  const res = dueReminders(state.alarm, state.fired, now);
  const keys = [];
  const lines = [];
  const all = res.live.concat(res.missed);
  for (const r of all) {
    const key = fireKey(r, now);
    if (seenFired.has(key)) continue;
    seenFired.add(key);
    keys.push(key);
    const missedOne = res.missed.includes(r);
    lines.push(missedOne ? `可能错过了「${r.label}」` : `到点了：${r.label}`);
    if (!missedOne) {
      beep();
      sysNotify("晴雨匣", `${r.label} · ${r.time}`);
    }
  }
  if (keys.length === 0) return;
  markFired(keys);
  ui.alarm.notice = lines.join("。");
  if (activeTab === "alarm") renderAlarm();
}

/* ============================================================
   二十二、轻提示
   ============================================================ */
let toastTimer = null;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ============================================================
   二十三、初始化与事件绑定
   ============================================================ */
function switchTab(tab) {
  activeTab = tab;
  renderAll();
}

function init() {
  document.getElementById("brand-icon").innerHTML = lifeIcon("cloudy");
  document.getElementById("data-icon").innerHTML = lifeIcon("archive");
  // 底部导航
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // 首次点击解锁音频
  window.addEventListener("pointerdown", unlockAudio, { once: true });

  // 数据弹窗
  const modal = document.getElementById("data-modal");
  document.getElementById("data-btn").addEventListener("click", () => modal.classList.add("show"));
  document.getElementById("modal-close").addEventListener("click", () => modal.classList.remove("show"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });

  // 导出
  document.getElementById("export-btn").addEventListener("click", () => {
    exportBundle().then((json) => {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qingyu-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("已开始下载备份");
    });
  });

  // 导入
  const fileInput = document.getElementById("import-file");
  document.getElementById("import-btn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importBundle(String(reader.result || "")).then((err) => {
        modal.classList.remove("show");
        toast(err || "备份已恢复，图片也一起放回来了");
      });
    };
    reader.readAsText(file);
  });

  // 定时器
  setInterval(reminderTick, 10000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") reminderTick();
  });
  setInterval(coolerTick, 250);
  setInterval(updateAlarmBig, 1000);

  // 导航图标（直接用完整内联 SVG 替换占位 span）
  document.getElementById("nav-glyph-weather").outerHTML = weatherGlyph("cloudy", "glyph");
  document.getElementById("nav-glyph-quest").outerHTML = navIcon("quest", "glyph");
  document.getElementById("nav-glyph-cooler").outerHTML = navIcon("cooler", "glyph");
  document.getElementById("nav-glyph-trivia").outerHTML = navIcon("trivia", "glyph");
  document.getElementById("nav-glyph-alarm").outerHTML = navIcon("alarm", "glyph");

  renderAll();
}

init();
