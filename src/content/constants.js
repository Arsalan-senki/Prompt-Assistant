(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});

  root.STORAGE_KEYS = {
    pretext: 'pretext',
    enabled: 'enabled',
  };

  root.MESSAGE_TYPES = {
    updatePretext: 'updatePretext',
    getState: 'getState',
  };
})();
