(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});
  root.platforms = root.platforms || {};

  root.platforms.chatgpt = {
    id: 'chatgpt',

    find() {
      return (
        document.querySelector('#prompt-textarea[contenteditable="true"]') ||
        document.querySelector('div[contenteditable="true"].ProseMirror#prompt-textarea') ||
        document.querySelector('#prompt-textarea')
      );
    },

    isReadyForInsert(textarea) {
      const text = (textarea.textContent || '').replace(/\u200B/g, '').trim();
      if (text !== '') return false;

      return Boolean(
        textarea.querySelector('p.placeholder') ||
          textarea.querySelector('p[data-placeholder]') ||
          !textarea.textContent?.trim()
      );
    },

    insert(textarea, pretext) {
      textarea.innerHTML = '';

      const pretextP = document.createElement('p');
      pretextP.textContent = pretext;
      textarea.appendChild(pretextP);

      const spacingP = document.createElement('p');
      const spacingBr = document.createElement('br');
      spacingBr.className = 'ProseMirror-trailingBreak';
      spacingP.appendChild(spacingBr);
      textarea.appendChild(spacingP);

      const emptyP = document.createElement('p');
      const br = document.createElement('br');
      br.className = 'ProseMirror-trailingBreak';
      emptyP.appendChild(br);
      textarea.appendChild(emptyP);

      textarea.focus();
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(emptyP);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    },

    clearAll() {
      const chatgptTextareas = document.querySelectorAll('#prompt-textarea');
      chatgptTextareas.forEach((textarea) => {
        textarea.innerHTML =
          '<p class="placeholder" data-placeholder="Ask anything"><br class="ProseMirror-trailingBreak"></p>';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    },
  };
})();
