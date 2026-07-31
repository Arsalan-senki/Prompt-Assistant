(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});
  root.platforms = root.platforms || {};

  root.platforms.deepseek = {
    id: 'deepseek',

    find() {
      return (
        document.querySelector('textarea#chat-input') ||
        document.querySelector('textarea[id="chat-input"]') ||
        document.querySelector('textarea[placeholder*="DeepSeek" i]')
      );
    },

    isReadyForInsert(textarea) {
      return !textarea.value || textarea.value.trim() === '';
    },

    insert(textarea, pretext) {
      textarea.value = pretext + '\n\n';
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    },

    clearAll() {
      const deepseekTextareas = document.querySelectorAll(
        'textarea#chat-input, textarea[id="chat-input"], textarea[placeholder*="DeepSeek" i]'
      );
      deepseekTextareas.forEach((textarea) => {
        textarea.value = '';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    },
  };
})();
