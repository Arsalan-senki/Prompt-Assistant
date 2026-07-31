(() => {
  const root = globalThis.PretextApp;
  const { MESSAGE_TYPES, STORAGE_KEYS } = root;

  function applyPretextUpdate({ pretext, enabled }) {
    const nextPretext = pretext ?? '';
    const nextEnabled = Boolean(enabled);
    const prev = root.getState();

    // Ignore no-op echoes (e.g. message + storage both firing)
    if (prev.pretext === nextPretext && prev.enabled === nextEnabled) {
      return;
    }

    root.setState({ pretext: nextPretext, enabled: nextEnabled });

    if (nextEnabled && nextPretext) {
      const result = root.findPromptTextarea();
      if (result) {
        result.adapter.insert(result.textarea, nextPretext);
      }
    } else {
      root.clearAllPlatforms();
    }
  }

  root.loadStateFromStorage((state) => {
    if (state.enabled && state.pretext) {
      root.checkAndInsertPretext();
    }
  });

  root.startObserver();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === MESSAGE_TYPES.updatePretext) {
      applyPretextUpdate({
        pretext: message.pretext,
        enabled: message.enabled,
      });
      return;
    }

    if (message.type === MESSAGE_TYPES.getComposerText) {
      sendResponse({ ok: true, text: root.getComposerText() });
      return true;
    }

    if (message.type === MESSAGE_TYPES.replaceComposerOnce) {
      const ok = root.replaceComposerOnce(message.text || '');
      sendResponse({
        ok,
        error: ok ? undefined : 'No chat composer found on this page.',
      });
      return true;
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return;
    if (!changes[STORAGE_KEYS.pretext] && !changes[STORAGE_KEYS.enabled]) return;

    const state = root.getState();
    applyPretextUpdate({
      pretext: changes[STORAGE_KEYS.pretext]
        ? changes[STORAGE_KEYS.pretext].newValue ?? ''
        : state.pretext,
      enabled: changes[STORAGE_KEYS.enabled]
        ? Boolean(changes[STORAGE_KEYS.enabled].newValue)
        : state.enabled,
    });
  });
})();
