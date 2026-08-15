(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});
  root.platforms = root.platforms || {};

  const SELECTOR = 'div.ql-editor.textarea.new-input-ui, .ql-editor.textarea.new-input-ui';

  root.platforms.gemini = {
    id: 'gemini',

    find() {
      return document.querySelector(SELECTOR);
    },

    isReadyForInsert(textarea) {
      if (textarea.classList.contains('ql-blank')) return true;

      const text = (textarea.textContent || '').replace(/\u200B/g, '').trim();
      if (text !== '') return false;

      return (
        textarea.innerHTML === '<p><br></p>' ||
        textarea.innerHTML === '<p></p>' ||
        textarea.innerHTML === '' ||
        text === ''
      );
    },

    getText(textarea) {
      const paragraphs = Array.from(textarea.querySelectorAll('p')).map((p) =>
        (p.textContent || '').replace(/\u200B/g, '')
      );
      if (paragraphs.length) {
        return paragraphs.join('\n').replace(/\n+$/g, '').trim();
      }
      return (textarea.textContent || '').replace(/\u200B/g, '').trim();
    },

    /**
     * Build Quill paragraphs from plain text (newline -> new <p>).
     */
    setParagraphs(textarea, text) {
      const lines = String(text).split('\n');
      textarea.innerHTML = '';

      lines.forEach((line) => {
        const p = document.createElement('p');
        if (line.length > 0) {
          p.textContent = line;
        } else {
          p.appendChild(document.createElement('br'));
        }
        textarea.appendChild(p);
      });

      if (!textarea.querySelector('p')) {
        const p = document.createElement('p');
        p.appendChild(document.createElement('br'));
        textarea.appendChild(p);
      }

      textarea.classList.toggle('ql-blank', !(text || '').trim());

      textarea.focus();
      const lastP = textarea.querySelector('p:last-child');
      const selection = window.getSelection();
      if (selection && lastP) {
        const range = document.createRange();
        range.selectNodeContents(lastP);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
    },

    insert(textarea, pretext) {
      this.setParagraphs(textarea, `${pretext}\n\n`);
    },

    replaceText(textarea, text) {
      this.setParagraphs(textarea, text);
    },

    clearAll() {
      document.querySelectorAll(SELECTOR).forEach((textarea) => {
        textarea.innerHTML = '<p><br></p>';
        textarea.classList.add('ql-blank');
        textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
      });
    },
  };
})();
