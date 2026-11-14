# Qingyu Box

A lightweight, local-first companion for moods and everyday life.

Mood journaling, small daily adventures, calmer communication, curiosity, and
bedtime routines in a bright, interactive web interface.
The application interface is currently in Simplified Chinese.

## Features

- **Mood journal:** short entries, 21 mood tags, a calendar, and weekly or monthly summaries.
- **Daily adventures:** draw an activity, complete or skip it, and add your own ideas.
- **Cool-down space:** rewrite heated messages with local rules and take a timed pause.
- **Everyday discoveries:** explore trivia and save custom facts with optional photos.
- **Bedtime routines:** capture tomorrow's tasks, save something to look forward to, and follow a breathing exercise.
- **Reminders and backups:** weekday reminders and JSON export/import, including saved images.
- **Optional AI:** mood classification and image recognition through a configurable OpenAI-compatible endpoint.

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

The latest local UI regression run passed 62 browser checks covering core
interactions, persistence, navigation, four viewport widths (320, 390, 768,
and 1280 pixels), reduced-motion styling, and direct-file offline loading.
This is not exhaustive coverage. Real AI services, physical mobile devices,
and operating-system notification delivery were not verified in that run.
