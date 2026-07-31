(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});
  const { chatgpt, perplexity, deepseek, gapgpt } = root.platforms;

  /** Platform adapters in detection order. */
  root.platformList = [chatgpt, perplexity, deepseek, gapgpt];

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
})();
