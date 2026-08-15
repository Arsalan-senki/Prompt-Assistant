import {
  DEFAULT_ENABLED,
  DEFAULT_ENHANCE_SETTINGS,
  DEFAULT_PRETEXT,
  MESSAGE_TYPES,
  STORAGE_KEYS,
} from '../shared/constants.js';
import { enhancePromptText, enhancePromptTextStream } from './enhance.js';

const CONTENT_SCRIPT_FILES = [
  'src/content/constants.js',
  'src/content/platforms/chatgpt.js',
  'src/content/platforms/perplexity.js',
  'src/content/platforms/deepseek.js',
  'src/content/platforms/gapgpt.js',
  'src/content/platforms/gemini.js',
  'src/content/platforms/index.js',
  'src/content/state.js',
  'src/content/observer.js',
  'src/content/index.js',
];

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      [STORAGE_KEYS.pretext]: DEFAULT_PRETEXT,
      [STORAGE_KEYS.enabled]: DEFAULT_ENABLED,
    });
    chrome.storage.local.set({
      [STORAGE_KEYS.enhanceSettings]: DEFAULT_ENHANCE_SETTINGS,
      [STORAGE_KEYS.enhanceApiKey]: '',
    });
  }
});

async function pingTab(tabId) {
  return chrome.tabs.sendMessage(tabId, { type: MESSAGE_TYPES.getComposerText });
}

async function injectContentScripts(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: CONTENT_SCRIPT_FILES,
  });
}

async function ensureContentScript(tabId) {
  try {
    await pingTab(tabId);
    return true;
  } catch {
    try {
      await injectContentScripts(tabId);
      await pingTab(tabId);
      return true;
    } catch {
      return false;
    }
  }
}

async function sendReplaceToTab(tabId, text) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: MESSAGE_TYPES.replaceComposerOnce,
      text,
    });
    return true;
  } catch {
    const ready = await ensureContentScript(tabId);
    if (!ready) return false;
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.replaceComposerOnce,
        text,
      });
      return true;
    } catch {
      return false;
    }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.getState) {
    chrome.storage.sync
      .get([STORAGE_KEYS.pretext, STORAGE_KEYS.enabled])
      .then(sendResponse);
    return true;
  }

  if (message.type === MESSAGE_TYPES.enhancePrompt) {
    enhancePromptText(message.text, message.settings || {})
      .then((enhanced) => sendResponse({ ok: true, enhanced }))
      .catch((error) =>
        sendResponse({ ok: false, error: error?.message || String(error) })
      );
    return true;
  }

  if (message.type === 'ensureContentScript') {
    ensureContentScript(message.tabId)
      .then((ok) => sendResponse({ ok }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'enhance-stream') return;

  port.onMessage.addListener(async (message) => {
    if (message.type !== MESSAGE_TYPES.enhancePrompt) return;

    const tabId = message.tabId;
    let lastSent = '';
    let tabReachable = true;
    let newestText = '';
    let wantFinal = false;
    let doneSent = false;
    let flushPromise = null;

    if (tabId) {
      tabReachable = await ensureContentScript(tabId);
      if (!tabReachable) {
        port.postMessage({
          type: 'error',
          error:
            'Chat page script not connected. Open a supported chat tab and refresh it, then try again.',
        });
        return;
      }
    }

    const sendDone = (text) => {
      if (doneSent) return;
      doneSent = true;
      port.postMessage({ type: 'done', text: text || '' });
    };

    /**
     * Coalesced serial writes: always apply the newest text,
     * never overlap replaces, and only signal done after the final write.
     */
    const kickFlush = () => {
      if (flushPromise) return flushPromise;

      flushPromise = (async () => {
        try {
          while (!doneSent) {
            const snapshot = newestText;
            const finishing = wantFinal;

            if (tabId && tabReachable && snapshot && snapshot !== lastSent) {
              lastSent = snapshot;
              const ok = await sendReplaceToTab(tabId, snapshot);
              if (!ok) {
                tabReachable = false;
                port.postMessage({
                  type: 'warn',
                  error:
                    'Lost connection to the chat tab. Refresh the page and run Enhance again.',
                });
              }
            }

            if (finishing && newestText === snapshot) {
              wantFinal = false;
              sendDone(snapshot || lastSent);
              break;
            }

            if (!finishing && newestText === snapshot) {
              break;
            }
          }
        } finally {
          flushPromise = null;
          if (!doneSent && (wantFinal || newestText !== lastSent)) {
            await kickFlush();
          }
        }
      })();

      return flushPromise;
    };

    try {
      const enhanced = await enhancePromptTextStream(
        message.text,
        (partial) => {
          newestText = partial || '';
          port.postMessage({ type: 'chunk', text: newestText });
          kickFlush();
        },
        message.settings || {}
      );

      newestText = enhanced || '';
      wantFinal = true;
      await kickFlush();
      sendDone(newestText || lastSent);
    } catch (error) {
      port.postMessage({
        type: 'error',
        error: error?.message || String(error),
      });
    }
  });
});
