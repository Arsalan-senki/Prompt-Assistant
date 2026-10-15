# Prompt Assistant

Browser extension that saves a reusable pretext for chat sites and can rewrite the current chat prompt once with AI (OpenRouter).

Works on **ChatGPT**, **Perplexity**, **DeepSeek**, **GapGPT**, and **Gemini**. Compatible with Chrome and Firefox (Manifest V3).

## Features

- **Saved pretext** - auto-inserts into empty chat composers
- **Enhance Prompt** - rewrites the text in the chat box once (does not change the saved pretext)
- **Streaming enhance** - writes the improved prompt into the chat as tokens arrive
- **Enhance settings** - model, style, language, tone, domain, creativity, and more
- **Multi-site adapters** - one platform file per chatbot site
- No build step - load unpacked from the repo root

## Install (manual)

1. Clone or download this repository
2. Chrome:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked
   - Select the folder that contains `manifest.json`
3. Firefox:
   - Open `about:debugging` -> This Firefox
   - Load Temporary Add-on
   - Select `manifest.json`

After reloading the extension, refresh any open chat tabs.

## Usage

### Pretext

1. Open the extension popup
2. Enter your pretext (default: `give me direct answers`)
3. Click **Set Pretext**
4. Empty chat boxes on supported sites get that text automatically
5. Click **Clear** to disable auto-insert

### Enhance

1. Add an OpenRouter API key and choose a model under **Enhance Settings** (see below)
2. Type or paste your prompt in the **chat box** (not only in the panel)
3. Click **Enhance Prompt**
4. The chat box is rewritten once; the saved panel pretext stays unchanged

Hover labels in Enhance Settings for short descriptions of each option.

### Set the OpenRouter API key

Enhance uses [OpenRouter](https://openrouter.ai/). You need your own API key.

The model dropdown offers three free OpenRouter endpoints: Qwen3 235B Instruct, DeepSeek V3.1, and Gemma 3 27B. One OpenRouter key works for all three. Free endpoints have rate limits and their availability can change.

1. Create an account at [https://openrouter.ai/](https://openrouter.ai/)
2. Open [https://openrouter.ai/keys](https://openrouter.ai/keys)
3. Create a key and copy it (starts with `sk-or-...`)
4. Open the **Prompt Assistant** extension popup
5. Click **Enhance Settings**
6. Paste the key into **OpenRouter API key**
7. Click **Save settings** (the settings panel closes)

The key is stored only in your browser (`chrome.storage.local`). It is not uploaded anywhere except to OpenRouter when you click **Enhance Prompt**.

Optional: confirm the key/model work with:

```bash
python test/check_openrouter.py
```

(Edit the key inside that script first if you use it.)

## Project structure

```
├── manifest.json
├── icons/
├── screenshots/
├── test/
│   └── check_openrouter.py      # Optional OpenRouter connectivity check
├── src/
│   ├── background/
│   │   ├── service-worker.js    # Background + enhance streaming
│   │   └── enhance.js           # OpenRouter enhance API
│   ├── content/
│   │   ├── index.js
│   │   ├── constants.js
│   │   ├── observer.js
│   │   ├── state.js
│   │   └── platforms/           # chatgpt, perplexity, deepseek, gapgpt, gemini
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   └── shared/
│       └── constants.js
├── LICENSE
└── README.md
```

### Add a new site

1. Create `src/content/platforms/<name>.js` and register it on `PretextApp.platforms`
2. Add it to `platformList` in `src/content/platforms/index.js`
3. List the file in `manifest.json` `content_scripts.js` (before `platforms/index.js`)
4. Add the site URL pattern to `manifest.json`

Content scripts are classic scripts (not ES modules) for Firefox compatibility.

## Development

```bash
git clone <your-repo-url>
```

Edit files under `src/`, then reload the extension in the browser. No bundler required.

Optional API check:

```bash
python test/check_openrouter.py
```

## Privacy

- Pretext and enhance settings are stored locally in the browser
- Enhance sends the chat prompt to OpenRouter only when you click Enhance (requires your API key)
- No analytics or other third-party tracking from this extension

## Contributing

1. Fork the repo
2. Create a branch
3. Open a pull request

## License

See [LICENSE](LICENSE).
