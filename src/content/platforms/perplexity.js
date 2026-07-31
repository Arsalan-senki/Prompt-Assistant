(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});
  root.platforms = root.platforms || {};

  root.platforms.perplexity = {
    id: 'perplexity',

    find() {
      return document.querySelector('#ask-input, div[id="ask-input"]');
    },

    isReadyForInsert(textarea) {
      const text = (textarea.textContent || '').replace(/\u200B/g, '').trim();
      if (text !== '') return false;

      return (
        textarea.innerHTML === '<p><br></p>' ||
        textarea.innerHTML === '<p></p>' ||
        textarea.innerHTML === '' ||
        text === '' ||
        textarea.querySelector('p')?.textContent === '' ||
        textarea.querySelector('span[data-lexical-text="true"]')?.textContent === ''
      );
    },

    insert(textarea, pretext) {
      const innerP = textarea.querySelector('p');
      if (!innerP) return;

      innerP.textContent = pretext;
      textarea.focus();

      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(innerP);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    },

    clearAll() {
      const perplexityTextareas = document.querySelectorAll('#ask-input, div[id="ask-input"]');
      perplexityTextareas.forEach((textarea) => {
        const innerP = textarea.querySelector('p');
        if (innerP) {
          innerP.innerHTML = '<br>';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    },
  };
})();
