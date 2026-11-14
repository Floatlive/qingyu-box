function lifeIcon(name, cls) {
  const shapes = {
    sunny: '<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity=".18"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    cloudy: '<circle cx="16" cy="7" r="4" fill="var(--sun-color, #d0a15a)" fill-opacity=".4" stroke="none"/><path d="M7 19a4 4 0 1 1 .7-7.9 5.5 5.5 0 0 1 10.6 1.4A3.3 3.3 0 0 1 18 19Z" fill="currentColor" fill-opacity=".1"/>',
    overcast: '<path d="M7 19a4 4 0 1 1 .7-7.9 5.5 5.5 0 0 1 10.6 1.4A3.3 3.3 0 0 1 18 19Z" fill="currentColor" fill-opacity=".18"/><path d="M6 7a5 5 0 0 1 8-2" opacity=".55"/>',
    rain: '<path d="M6 15a3.5 3.5 0 0 1 .8-6.9 5.5 5.5 0 0 1 10.6 1.4A2.8 2.8 0 0 1 18 15" fill="currentColor" fill-opacity=".1"/><path d="m8 17-1 3m6-3-1 3m6-3-1 3"/>',
    storm: '<path d="M5 15A3.5 3.5 0 0 1 6.8 8a5.5 5.5 0 0 1 10.6 1.4A2.8 2.8 0 0 1 19 15" fill="currentColor" fill-opacity=".12"/><path d="m12 12-3 5h4l-1 5 5-7h-4l1-3"/>',
    muggy: '<circle cx="12" cy="7" r="3" fill="currentColor" fill-opacity=".15"/><path d="M4 14c3-3 5 3 8 0s5 3 8 0M4 19c3-3 5 3 8 0s5 3 8 0"/>',
    fog: '<path d="M5 6h14M3 10h13m3 0h2M6 14h15M3 18h14"/><circle cx="19" cy="18" r="1" fill="currentColor" stroke="none"/>',
    quest: '<path d="M12 21v-9M12 15C5 15 3 11 3 6c6 0 9 3 9 9Z" fill="currentColor" fill-opacity=".13"/><path d="M12 11c0-6 3-9 9-9 0 6-3 9-9 9Z" fill="currentColor" fill-opacity=".24"/><path d="M8 21h8"/>',
    cooler: '<path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Zm12 1h2a3 3 0 0 1 0 6h-2" fill="currentColor" fill-opacity=".12"/><path d="M7 3v2m5-3v3M3 22h16"/>',
    trivia: '<path d="M12 6C9 4 6 4 3 5v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z" fill="currentColor" fill-opacity=".1"/><path d="M12 6v15M6 9l3 1m6 0 3-1M6 13l3 1m6 0 3-1"/>',
    alarm: '<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" fill="currentColor" fill-opacity=".16"/><path d="M18 2v4m-2-2h4"/>',
    heart: '<path d="M20.8 5.6c-2-2.2-5.2-2-7.2.2L12 7.5l-1.6-1.7C8.4 3.6 5.2 3.4 3.2 5.6c-2 2.2-1.4 5.3.6 7.3L12 21l8.2-8.1c2-2 2.6-5.1.6-7.3Z" fill="currentColor" fill-opacity=".12"/>',
    note: '<rect x="5" y="3" width="15" height="19" rx="3" fill="currentColor" fill-opacity=".1"/><path d="M9 3v19M3 7h4m-4 5h4m-4 5h4m6-9h4m-4 4h4m-4 4h2"/>',
    photo: '<rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fill-opacity=".08"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
    archive: '<path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" fill="currentColor" fill-opacity=".1"/><rect x="3" y="3" width="18" height="5" rx="2"/><path d="M10 12h4"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" fill="currentColor" fill-opacity=".14"/>',
  };
  return `<svg class="${cls || "life-icon"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shapes[name] || shapes.heart}</svg>`;
}

function pageIntro(name) {
  const pages = {
    weather: { label: "情绪手记", title: "今天，感觉怎么样？", text: "晴天或雨天，都值得被好好记下。", icon: "cloudy" },
    quest: { label: "生活小冒险", title: "给日常，一点新鲜感。", text: "从一件小事开始，和生活重新碰个面。", icon: "quest" },
    cooler: { label: "情绪缓冲站", title: "先缓一缓，再说。", text: "留一点空间给自己，也给想说的话。", icon: "cooler" },
    trivia: { label: "日常发现", title: "平凡里，藏着小惊喜。", text: "收藏一点好奇，让日子变得有意思。", icon: "trivia" },
    alarm: { label: "晚间小仪式", title: "把今天，轻轻放下。", text: "安顿好心事，再给明天留一点期待。", icon: "alarm" },
  };
  const page = pages[name];
  return `<header class="page-intro"><div class="intro-copy"><p class="intro-label">${page.label}</p><h1>${page.title}</h1><p class="intro-description">${page.text}</p></div><div class="intro-art intro-art-${name}">${lifeIcon(page.icon, "intro-icon")}<span class="intro-dot"></span></div></header>`;
}
