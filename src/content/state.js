(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});

  let state = {
    pretext: '',
    enabled: false,
  };

  root.getState = function getState() {
    return state;
  };

  root.setState = function setState(next) {
    state = { ...state, ...next };
  };

  root.loadStateFromStorage = function loadStateFromStorage(callback) {
    chrome.storage.sync.get([root.STORAGE_KEYS.pretext, root.STORAGE_KEYS.enabled], (data) => {
      const hasPretext =
        typeof data[root.STORAGE_KEYS.pretext] === 'string' &&
        data[root.STORAGE_KEYS.pretext].trim() !== '';

      state = {
        pretext: hasPretext ? data[root.STORAGE_KEYS.pretext] : root.DEFAULT_PRETEXT,
        enabled: hasPretext
          ? Boolean(data[root.STORAGE_KEYS.enabled])
          : root.DEFAULT_ENABLED,
      };

      if (!hasPretext) {
        chrome.storage.sync.set({
          [root.STORAGE_KEYS.pretext]: root.DEFAULT_PRETEXT,
          [root.STORAGE_KEYS.enabled]: root.DEFAULT_ENABLED,
        });
      }

      if (callback) callback(state);
    });
  };

  root.checkAndInsertPretext = function checkAndInsertPretext() {
    const result = root.findPromptTextarea();
    if (!result) return;

    const { textarea, adapter } = result;
    if (state.enabled && state.pretext && adapter.isReadyForInsert(textarea)) {
      adapter.insert(textarea, state.pretext);
    }
  };
})();
