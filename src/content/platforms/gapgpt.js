(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});
  root.platforms = root.platforms || {};

  const SELECTOR = 'textarea.q-field__native.q-placeholder.bidi-textarea';

  root.platforms.gapgpt = {
    id: 'gapgpt',

    find() {
      return document.querySelector(SELECTOR);
    },

    isReadyForInsert(textarea) {
      return !textarea.value || textarea.value.trim() === '';
    },

    getText(textarea) {
      return (textarea.value || '').trim();
    },

    insert(textarea, pretext) {
      textarea.value = pretext + '\n\n';
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    },

    /** One-shot replace (exact text, no extra spacing). */
    replaceText(textarea, text) {
      textarea.value = text;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    },


    clearAll() {
      document.querySelectorAll(SELECTOR).forEach((textarea) => {
        textarea.value = '';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    },
  };
})();
