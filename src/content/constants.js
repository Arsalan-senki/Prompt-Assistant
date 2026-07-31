(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});

  root.STORAGE_KEYS = {
    pretext: 'pretext',
    enabled: 'enabled',
  };

  root.MESSAGE_TYPES = {
    updatePretext: 'updatePretext',
    getState: 'getState',
    enhancePrompt: 'enhancePrompt',
    getComposerText: 'getComposerText',
    replaceComposerOnce: 'replaceComposerOnce',
  };

  root.DEFAULT_PRETEXT = 'give me direct answers';
  root.DEFAULT_ENABLED = true;
})();
