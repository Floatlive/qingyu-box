/* ==========================================================
   04-storage.js
   存储层：localStorage、IndexedDB、AI 配置
   ========================================================== */
/* ============================================================
   九、本地存储：localStorage + IndexedDB 图库
   ============================================================ */
const STORAGE_KEY = "qingyu-v1";
const DB_NAME = "qingyu";
const DB_STORE = "images";

/* AI 识图配置（仅存本机浏览器，单独的 key） */
const AI_CONFIG_KEY = "qingyu-ai-config";
function readAiConfig() {
  try { return JSON.parse(localStorage.getItem(AI_CONFIG_KEY)) || {}; } catch (e) { return {}; }
}
function saveAiConfig(cfg) {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify({
    baseUrl: (cfg.baseUrl || "").trim().replace(/\/+$/, ""),
    apiKey: (cfg.apiKey || "").trim(),
    model: (cfg.model || "").trim()
  }));
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("无法打开本地图库"));
  });
}

function putImage(id, dataUrl) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).put(dataUrl, id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error || new Error("保存图片失败"));
      }),
  );
}

function getImage(id) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readonly");
        const req = tx.objectStore(DB_STORE).get(id);
        req.onsuccess = () => {
          db.close();
          resolve(req.result || null);
        };
        req.onerror = () => reject(req.error || new Error("读取图片失败"));
      }),
  );
}

function deleteImage(id) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).delete(id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error || new Error("删除图片失败"));
      }),
  );
}

function getImages(ids) {
  const out = {};
  return ids.reduce(
    (chain, id) =>
      chain.then(() =>
        getImage(id).then((v) => {
          if (v) out[id] = v;
        }),
      ),
    Promise.resolve(),
  ).then(() => out);
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("请选择 jpg、png 或 webp 图片"));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("图片超过 12MB，请换一张小一些的"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxEdge = 640;
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法处理图片"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => reject(new Error("这张图片无法解析"));
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return normalizeData(JSON.parse(raw));
  } catch (e) {
    return emptyData();
  }
}

function writeStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

