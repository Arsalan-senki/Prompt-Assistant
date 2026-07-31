# ChatGPT Pretext Inserter

A browser extension that automatically prepends customizable text to your ChatGPT messages. Perfect for maintaining consistent system prompts or context across conversations.

![Extension Preview](screenshots/preview.png)

## Features

- 🔄 Automatically inserts your predefined text before each ChatGPT message
- ✏️ Easy to edit and update your pretext
- 🎯 Works with chat.openai.com
- 🌐 Compatible with both Chrome and Firefox
- 🎨 Dark mode interface
- ⚡ Lightweight and fast

## Installation

### Chrome Web Store
Coming soon...

### Firefox Add-ons
Coming soon...

### Manual Installation

1. Clone this repository or download the ZIP file
2. For Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory (the folder that contains `manifest.json`)
3. For Firefox:
   - Open `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select `manifest.json` in the extension directory

## Usage

1. Click the extension icon in your browser toolbar
2. Enter the text you want to automatically insert before your messages
3. Click "Set Pretext" to save
4. Start chatting with ChatGPT - your pretext will be automatically inserted before each message
5. Use "Clear" to remove the pretext when you don't need it

## Development

### Project Structure
```
ChatGPT-Pretext-Inserter/
├── manifest.json
├── icons/
├── screenshots/
├── src/
│   ├── background/
│   │   └── service-worker.js      # Extension service worker
│   ├── content/
│   │   ├── index.js               # Content script entry
│   │   ├── constants.js           # Shared keys (classic script)
│   │   ├── observer.js            # DOM mutation observer
│   │   ├── state.js               # Pretext state + insert orchestration
│   │   └── platforms/             # One adapter per chatbot site
│   │       ├── index.js           # Registry / detection order
│   │       ├── chatgpt.js
│   │       ├── perplexity.js
│   │       └── deepseek.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   └── shared/
│       └── constants.js           # ES module constants (background)
├── LICENSE
└── README.md
```

Adding a new chatbot site: create `src/content/platforms/<name>.js` that registers an adapter on `PretextApp.platforms`, add it to `platformList` in `src/content/platforms/index.js`, list the new file in `manifest.json` `content_scripts.js` (before `platforms/index.js`), and add its URL pattern to `manifest.json`.

Content scripts are classic scripts (not ES modules) so they work in Firefox, which does not support `content_scripts.type`.

### Building from Source

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chatgpt-pretext.git
```

2. Make your changes under `src/`

3. Load the extension in your browser using the manual installation steps above (no build step required)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Privacy

This extension:
- Does not collect any user data
- Does not send data to any servers
- Only stores your pretext locally in your browser
- Only requires minimal permissions to function

## Support

If you encounter any issues or have suggestions, please:
1. Check existing issues in the GitHub repository
2. Create a new issue if your problem isn't already reported

## Acknowledgments

- Built for the ChatGPT community
- Icon designed with Gemini
