const DEFAULT_PRETEXT = 'give me direct answers';
const ENHANCE_MODELS = [
  'qwen/qwen3-235b-a22b-2507:free',
  'deepseek/deepseek-chat-v3.1:free',
  'google/gemma-3-27b-it:free',
];
const DEFAULT_ENHANCE_SETTINGS = {
  model: ENHANCE_MODELS[0],
  style: 'direct',
  customInstruction: '',
  language: 'auto',
  tone: 'neutral',
  audience: 'general',
  length: 'same',
  domain: 'general',
  role: 'none',
  outputFormat: 'plain',
  source: 'composer',
  temperature: 0.3,
  topP: 1,
  maxTokens: 1024,
  addStructure: true,
  keepIntent: true,
  askExamples: false,
  stepByStep: false,
  noFluff: true,
  includeConstraints: true,
  stripMarkdown: true,
};

const MESSAGE_TYPES = {
  enhancePrompt: 'enhancePrompt',
  getComposerText: 'getComposerText',
  replaceComposerOnce: 'replaceComposerOnce',
};

let statusTimer = null;
let progressTimer = null;

function showStatus(message, type = 'success', { sticky = false } = {}) {
  const statusMessage = document.getElementById('statusMessage');
  if (!statusMessage) return;
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  if (!sticky) {
    statusTimer = setTimeout(() => {
      statusMessage.className = 'status-message';
      statusTimer = null;
    }, 3200);
  }
}

function setEnhanceProgress(text = 'Enhancing') {
  const label = document.getElementById('enhanceButtonLabel');
  if (label) label.textContent = text;
}

function setEnhanceBusy(busy, stageText = 'Enhancing') {
  const btn = document.getElementById('enhanceButton');
  const settingsBtn = document.getElementById('openEnhanceSettings');
  const statusMessage = document.getElementById('statusMessage');

  if (btn) {
    btn.disabled = busy;
    btn.classList.toggle('is-busy', busy);
    btn.setAttribute('aria-busy', busy ? 'true' : 'false');
  }
  if (settingsBtn) settingsBtn.disabled = busy;

  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }

  if (busy) {
    if (statusTimer) {
      clearTimeout(statusTimer);
      statusTimer = null;
    }
    if (statusMessage) statusMessage.className = 'status-message';
    setEnhanceProgress(stageText);
  } else {
    setEnhanceProgress('Enhance Prompt');
  }
}

function showMainPanel() {
  const main = document.getElementById('mainPanel');
  const settings = document.getElementById('enhanceSettingsPanel');
  if (!main || !settings) return;
  main.classList.remove('hidden');
  settings.classList.add('hidden');
}

function showSettingsPanel() {
  const main = document.getElementById('mainPanel');
  const settings = document.getElementById('enhanceSettingsPanel');
  if (!main || !settings) return;
  hideHelpPanel();
  main.classList.add('hidden');
  settings.classList.remove('hidden');
  loadEnhanceSettings();
}

function showHelpPanel() {
  const help = document.getElementById('helpPanel');
  const toggle = document.getElementById('helpToggle');
  if (!help || !toggle) return;
  help.classList.remove('hidden');
  toggle.setAttribute('aria-expanded', 'true');
}

function hideHelpPanel() {
  const help = document.getElementById('helpPanel');
  const toggle = document.getElementById('helpToggle');
  if (!help || !toggle) return;
  help.classList.add('hidden');
  toggle.setAttribute('aria-expanded', 'false');
}

function toggleHelpPanel() {
  const help = document.getElementById('helpPanel');
  if (!help) return;
  if (help.classList.contains('hidden')) {
    showHelpPanel();
  } else {
    hideHelpPanel();
  }
}

function readEnhanceSettingsFromForm() {
  return {
    model: document.getElementById('enhanceModel').value,
    style: document.getElementById('enhanceStyle').value || 'direct',
    customInstruction: document
      .getElementById('enhanceCustomInstruction')
      .value.trim(),
    language: document.getElementById('enhanceLanguage').value || 'auto',
    tone: document.getElementById('enhanceTone').value || 'neutral',
    audience: document.getElementById('enhanceAudience').value || 'general',
    domain: document.getElementById('enhanceDomain').value || 'general',
    role: document.getElementById('enhanceRole').value || 'none',
    outputFormat: document.getElementById('enhanceOutputFormat').value || 'plain',
    length: document.getElementById('enhanceLength').value || 'same',
    source: document.getElementById('enhanceSource').value || 'composer',
    temperature: Number(document.getElementById('enhanceTemperature').value) || 0.3,
    topP: Number(document.getElementById('enhanceTopP').value) || 1,
    maxTokens: Number(document.getElementById('enhanceMaxTokens').value) || 1024,
    addStructure: document.getElementById('enhanceAddStructure').checked,
    includeConstraints: document.getElementById('enhanceIncludeConstraints').checked,
    keepIntent: document.getElementById('enhanceKeepIntent').checked,
    noFluff: document.getElementById('enhanceNoFluff').checked,
    askExamples: document.getElementById('enhanceAskExamples').checked,
    stepByStep: document.getElementById('enhanceStepByStep').checked,
    stripMarkdown: document.getElementById('enhanceStripMarkdown').checked,
  };
}

function loadEnhanceSettings() {
  chrome.storage.local.get(['enhanceApiKey', 'enhanceSettings'], (data) => {
    const settings = { ...DEFAULT_ENHANCE_SETTINGS, ...(data.enhanceSettings || {}) };

    document.getElementById('enhanceApiKey').value = data.enhanceApiKey || '';
    document.getElementById('enhanceModel').value = ENHANCE_MODELS.includes(settings.model)
      ? settings.model
      : DEFAULT_ENHANCE_SETTINGS.model;
    document.getElementById('enhanceStyle').value = settings.style || 'direct';
    const legacyExtra = settings.extraContext || '';
    const custom = settings.customInstruction || '';
    document.getElementById('enhanceCustomInstruction').value = [custom, legacyExtra]
      .filter(Boolean)
      .join('\n\n');
    document.getElementById('enhanceLanguage').value = settings.language || 'auto';
    document.getElementById('enhanceTone').value = settings.tone || 'neutral';
    document.getElementById('enhanceAudience').value = settings.audience || 'general';
    document.getElementById('enhanceDomain').value = settings.domain || 'general';
    document.getElementById('enhanceRole').value = settings.role || 'none';
    document.getElementById('enhanceOutputFormat').value =
      settings.outputFormat || 'plain';
    document.getElementById('enhanceLength').value = settings.length || 'same';
    document.getElementById('enhanceSource').value =
      settings.source === 'panel' ? 'panel' : 'composer';
    document.getElementById('enhanceTemperature').value = String(
      settings.temperature ?? 0.3
    );
    document.getElementById('enhanceTopP').value = String(settings.topP ?? 1);
    document.getElementById('enhanceMaxTokens').value = settings.maxTokens || 1024;
    document.getElementById('enhanceAddStructure').checked =
      settings.addStructure !== false;
    document.getElementById('enhanceIncludeConstraints').checked =
      settings.includeConstraints !== false;
    document.getElementById('enhanceKeepIntent').checked =
      settings.keepIntent !== false;
    document.getElementById('enhanceNoFluff').checked = settings.noFluff !== false;
    document.getElementById('enhanceAskExamples').checked = Boolean(settings.askExamples);
    document.getElementById('enhanceStepByStep').checked = Boolean(settings.stepByStep);
    document.getElementById('enhanceStripMarkdown').checked =
      settings.stripMarkdown !== false;
  });
}

function saveEnhanceSettings() {
  const enhanceSettings = readEnhanceSettingsFromForm();
  const enhanceApiKey = document.getElementById('enhanceApiKey').value.trim();

  chrome.storage.local.set({ enhanceApiKey, enhanceSettings }, () => {
    showMainPanel();
    showStatus('Enhance settings saved');
  });
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0] || null);
    });
  });
}

function sendTabMessage(tabId, payload) {
  return chrome.tabs.sendMessage(tabId, payload).catch(() => null);
}

async function getEnhanceSourceMode() {
  const data = await chrome.storage.local.get(['enhanceSettings']);
  const settings = { ...DEFAULT_ENHANCE_SETTINGS, ...(data.enhanceSettings || {}) };
  // Legacy "auto" behaved like panel fallback - treat it as chat-only now
  return settings.source === 'panel' ? 'panel' : 'composer';
}

/**
 * Enhance always targets the chat composer by default.
 * Panel pretext is only used if Text source is explicitly set to "panel".
 */
async function resolveTextToEnhance() {
  const source = await getEnhanceSourceMode();

  if (source === 'panel') {
    return document.getElementById('repeatableTextInput').value.trim();
  }

  const tab = await getActiveTab();
  if (!tab?.id) return '';

  try {
    await chrome.runtime.sendMessage({
      type: 'ensureContentScript',
      tabId: tab.id,
    });
  } catch {
    // continue; sendTabMessage may still work
  }

  const response = await sendTabMessage(tab.id, {
    type: MESSAGE_TYPES.getComposerText,
  });

  return response?.text?.trim() || '';
}

async function enhanceOnce() {
  const text = await resolveTextToEnhance();
  if (!text) {
    showStatus(
      'No prompt found in the chat box. Type/paste your prompt in chat, then click Enhance.',
      'error'
    );
    return;
  }

  const tab = await getActiveTab();
  if (!tab?.id) {
    showStatus('No active tab to paste into', 'error');
    return;
  }

  if (!/^https:\/\/(chatgpt\.com|www\.perplexity\.ai|chat\.deepseek\.com|gapgpt\.app|gemini\.google\.com)\//.test(tab.url || '')) {
    showStatus('Open a supported chat page first (ChatGPT, Perplexity, DeepSeek, GapGPT, Gemini)', 'error');
    return;
  }

  setEnhanceBusy(true, 'Enhancing');

  try {
    const ensured = await chrome.runtime.sendMessage({
      type: 'ensureContentScript',
      tabId: tab.id,
    });
    if (!ensured?.ok) {
      setEnhanceBusy(false);
      showStatus('Chat page not ready. Refresh the chat tab, then try Enhance again.', 'error');
      return;
    }

    await new Promise((resolve, reject) => {
      const port = chrome.runtime.connect({ name: 'enhance-stream' });
      let settled = false;

      const finishOk = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const finishErr = (error) => {
        if (settled) return;
        settled = true;
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      port.onMessage.addListener((msg) => {
        if (msg.type === 'chunk') {
          setEnhanceProgress('Replacing');
          return;
        }

        if (msg.type === 'warn') {
          showStatus(msg.error || 'Chat tab warning', 'error');
          return;
        }

        if (msg.type === 'done') {
          // Final replace already finished in the background before "done"
          finishOk(msg.text || '');
          return;
        }

        if (msg.type === 'error') {
          finishErr(new Error(msg.error || 'Enhance failed'));
        }
      });

      port.onDisconnect.addListener(() => {
        if (settled) return;
        // Ignore Chrome/Firefox noise when the port closes normally
        void chrome.runtime.lastError;
        finishErr(
          new Error(
            'Enhance stopped early. Keep the chat tab open, refresh it, and try again.'
          )
        );
      });

      port.postMessage({
        type: MESSAGE_TYPES.enhancePrompt,
        text,
        tabId: tab.id,
      });
    });

    setEnhanceBusy(false);
    showStatus('Enhanced once - saved pretext unchanged', 'success');
  } catch (error) {
    setEnhanceBusy(false);
    const raw = error?.message || String(error);
    if (
      raw.includes('Receiving end does not exist') ||
      raw.includes('Could not establish connection') ||
      raw.includes('message port closed')
    ) {
      showStatus(
        'Chat page script missing. Refresh the chat tab, then click Enhance again.',
        'error'
      );
      return;
    }
    showStatus(raw || 'Enhance failed', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('repeatableTextInput');
  const versionEl = document.getElementById('versionDisplay');

  if (versionEl) {
    versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
  }

  chrome.storage.sync.get(['pretext', 'enabled'], (data) => {
    if (!input) return;

    const pretext =
      typeof data.pretext === 'string' && data.pretext.trim() !== ''
        ? data.pretext
        : DEFAULT_PRETEXT;

    if (!data.pretext || data.pretext.trim() === '') {
      chrome.storage.sync.set({ pretext: DEFAULT_PRETEXT, enabled: true });
    }

    input.value = pretext;
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  });

  document.getElementById('setTextButton')?.addEventListener('click', () => {
    const pretext = document.getElementById('repeatableTextInput').value.trim();
    if (pretext) {
      chrome.storage.sync.set({ pretext, enabled: true }, () => {
        showStatus('Pretext set and enabled!');
      });
    } else {
      showStatus('Please enter some text first', 'error');
    }
  });

  document.getElementById('clearTextButton')?.addEventListener('click', () => {
    document.getElementById('repeatableTextInput').value = '';
    chrome.storage.sync.set({ pretext: '', enabled: false }, () => {
      showStatus('Pretext cleared!');
    });
  });

  document.getElementById('enhanceButton')?.addEventListener('click', () => {
    enhanceOnce();
  });

  document.getElementById('openEnhanceSettings')?.addEventListener('click', () => {
    showSettingsPanel();
  });

  document.getElementById('backFromSettings')?.addEventListener('click', () => {
    showMainPanel();
  });

  document.getElementById('saveEnhanceSettings')?.addEventListener('click', () => {
    saveEnhanceSettings();
  });

  document.getElementById('helpToggle')?.addEventListener('click', () => {
    toggleHelpPanel();
  });

  document.getElementById('helpClose')?.addEventListener('click', () => {
    hideHelpPanel();
  });

  input?.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = `${this.scrollHeight}px`;
  });
});
