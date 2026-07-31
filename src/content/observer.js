(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});
  const INSERT_DEBOUNCE_MS = 50;

  /**
   * Watch the chat UI for an empty composer and insert pretext when ready.
   * Debounced so our own DOM writes don't retrigger endlessly.
   */
  root.startObserver = function startObserver() {
    let debounceTimer = null;

    const scheduleCheck = () => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        const result = root.findPromptTextarea();
        const state = root.getState();
        if (!result || !state.enabled || !state.pretext) return;
        const { textarea, adapter } = result;
        if (adapter.isReadyForInsert(textarea)) {
          adapter.insert(textarea, state.pretext);
        }
      }, INSERT_DEBOUNCE_MS);
    };

    const observer = new MutationObserver(scheduleCheck);

    const observe = () => {
      if (!document.body) {
        requestAnimationFrame(observe);
        return observer;
      }
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      return observer;
    };

    return observe();
  };
})();
