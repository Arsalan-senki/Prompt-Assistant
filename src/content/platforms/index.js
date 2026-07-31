(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});
  const { chatgpt, perplexity, deepseek, gapgpt } = root.platforms;

  /** Platform adapters in detection order. */
  root.platformList = [chatgpt, perplexity, deepseek, gapgpt];
  root.autoInsertPaused = false;

  root.findPromptTextarea = function findPromptTextarea() {
    for (const adapter of root.platformList) {
      const textarea = adapter.find();
      if (textarea) {
        return { textarea, platform: adapter.id, adapter };
      }
    }
    return null;
  };

  root.clearAllPlatforms = function clearAllPlatforms() {
    for (const adapter of root.platformList) {
      adapter.clearAll();
    }
  };

  root.getComposerText = function getComposerText() {
    const result = root.findPromptTextarea();
    if (!result) return '';
    return result.adapter.getText(result.textarea) || '';
  };

  root.pauseAutoInsert = function pauseAutoInsert(ms = 500) {
    root.autoInsertPaused = true;
    if (root._autoInsertResumeTimer) {
      clearTimeout(root._autoInsertResumeTimer);
    }
    root._autoInsertResumeTimer = setTimeout(() => {
      root.autoInsertPaused = false;
      root._autoInsertResumeTimer = null;
    }, ms);
  };

  /**
   * One-shot composer replace. Does not change saved panel pretext.
   * Pauses auto-insert so the observer cannot overwrite during/after writes.
   */
  root.replaceComposerOnce = function replaceComposerOnce(text) {
    const result = root.findPromptTextarea();
    if (!result) return false;
    root.pauseAutoInsert(600);
    if (typeof result.adapter.replaceText === 'function') {
      result.adapter.replaceText(result.textarea, text);
    } else {
      result.adapter.insert(result.textarea, text);
    }
    return true;
  };
})();
