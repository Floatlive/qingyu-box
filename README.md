# 晴雨匣 · Qingyu Box

**Current application version: v2.0.1**

A lightweight web app for recording feelings, organizing everyday life, and
winding down before bed. It runs in desktop and mobile browsers, with a bright
interface in Simplified Chinese and local storage for personal records.

## Current Features

This overview describes the implementation on the default branch.

| Page | Available features |
| --- | --- |
| Mood journal · 天气 | Write or update a daily entry; choose from six common mood tags or expand all 21; browse a calendar, recent entries, and weekly/monthly summaries. |
| Daily adventures · 冒险 | Draw a daily activity, complete or skip it, restore it to pending, track completion history and streaks, and add custom tasks. |
| Cool-down space · 冷静 | Rewrite heated messages using local rules, compare and copy the result, take a suggested timed pause, and review recent rewrites. |
| Everyday discoveries · 冷知识 | Search or randomly explore trivia by category, create custom entries, attach photos, and save image-and-text favorites. |
| Bedtime routines · 入睡 | Capture and complete bedtime tasks, save something to look forward to tomorrow, set sleep/wake times and weekday reminders, and follow a breathing exercise. |

- **Optional AI:** classify a written mood or identify a photo and generate trivia
  through a user-configured OpenAI-compatible service. AI requires a network
  connection and provider credentials; cool-down rewrites use local rules.
- **Backups:** export and import JSON files with saved images. Import merges
  records into existing data and keeps current reminder settings.
- **Offline use:** core features work when opened directly from local files,
  without an account, installation, build step, or external CDN.
- **Responsive interface:** layouts support desktop and mobile browser widths.
  This repository provides a web app, not a native mobile app.

## Getting Started

Open `index.html` in a browser. Core features require no build step, package
installation, CDN, or network connection.

For a consistent browser origin and notification permissions, serve locally:

```sh
python -m http.server 8127 --bind 127.0.0.1
```

Open `http://127.0.0.1:8127/`.

Use the same hostname and port each time. Switching between `file://`,
`localhost`, `127.0.0.1`, or different ports can expose different stored data.
Export a backup before changing origins or devices. Direct-file storage
behavior can vary by browser.

## Privacy and Storage

| Storage | Contents |
| --- | --- |
| localStorage: `qingyu-v1` | Records, activities, trivia metadata, bedtime notes, and reminders |
| localStorage: `qingyu-ai-config` | Optional AI endpoint, model, and API key |
| IndexedDB: `qingyu` / `images` | Saved images |

Core records stay in the current browser. There is no account system,
automatic backup, or cross-device synchronization. Clearing browser data can
remove records; export backups regularly.

Optional AI requests send the relevant input and authentication information
to the configured provider, which must allow browser cross-origin requests
and may charge for usage. Keys are stored in localStorage, not a secure vault.
Never commit credentials or embed a shared provider key in a public deployment.
Exported backups exclude the AI configuration.

## Project Structure

```text
index.html                  Application shell
css/style.css               Responsive theme
js/01-core.js               Mood definitions and helpers
js/02-content.js            Built-in activities and trivia
js/03-model.js              Data normalization and merging
js/04-storage.js            Storage, images, and AI configuration
js/05-state.js              State and actions
js/06-icons.js              Local SVG icons and page introductions
js/06-render-weather.js     Shared UI state and mood journal
js/07-render-quest.js        Daily adventures
js/08-render-cooler.js       Cool-down space
js/09-render-trivia.js       Everyday discoveries
js/10-render-alarm.js        Bedtime routines
js/11-ai.js                 Interaction handlers and AI requests
js/12-runtime.js            Navigation, timers, and notifications
```

Plain HTML, CSS, and JavaScript with classic scripts loaded in dependency
order. No framework or external runtime assets.

## Limitations

- Mood weather is a journal metaphor, not a real forecast.
- Rewrites and sleep predictions are informal tools, not professional advice.
- Reminders require the page to run and depend on browser permissions.
  They are not reliable system alarms when the page is closed or suspended.
- AI availability and quality depend on the configured provider.

## Validation

The November 15, 2026 local UI regression run passed 62 browser checks covering core
interactions, persistence, navigation, four viewport widths (320, 390, 768,
and 1280 pixels), reduced-motion styling, and direct-file offline loading.
This is not exhaustive coverage. Real AI services, physical mobile devices,
and operating-system notification delivery were not verified in that run.

Three model regression tests cover duplicate imported IDs, duplicate mood dates,
and rejection of unsafe record IDs. Run them with Node.js:

```sh
node --test tests/model.test.cjs
```
