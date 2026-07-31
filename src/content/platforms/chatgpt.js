(() => {
  const root = (globalThis.PretextApp = globalThis.PretextApp || {});
  root.platforms = root.platforms || {};

  root.platforms.chatgpt = {
    id: 'chatgpt',

    find() {
      return (
        document.querySelector('div.ProseMirror#prompt-textarea') ||
        document.querySelector('#prompt-textarea.ProseMirror') ||
        document.querySelector('div.ProseMirror[contenteditable="true"]')
      );
    },

    isReadyForInsert(textarea) {
      const text = (textarea.textContent || '').replace(/\u200B/g, '').trim();
      if (text !== '') return false;

      return Boolean(
        textarea.querySelector('p.placeholder') ||
          textarea.querySelector('p[data-placeholder]') ||
          textarea.querySelector('p[data-empty-paragraph="true"]') ||
          !textarea.textContent?.trim()
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
     * Build ProseMirror paragraphs from plain text (newline -> new <p>).
     */
    setParagraphs(textarea, text) {
      const lines = String(text).split('\n');
      textarea.innerHTML = '';

      lines.forEach((line) => {
        const p = document.createElement('p');
        if (line.length > 0) {
          p.textContent = line;
        } else {
          const br = document.createElement('br');
          br.className = 'ProseMirror-trailingBreak';
          p.appendChild(br);
        }
        textarea.appendChild(p);
      });

      if (!textarea.querySelector('p')) {
        const p = document.createElement('p');
        const br = document.createElement('br');
        br.className = 'ProseMirror-trailingBreak';
        p.appendChild(br);
        textarea.appendChild(p);
      }

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
      // Saved pretext: text + blank line for the user to continue typing
      this.setParagraphs(textarea, `${pretext}\n\n`);
    },

    replaceText(textarea, text) {
      // One-shot / streaming: replace <p> content inside .ProseMirror
      this.setParagraphs(textarea, text);
    },

    clearAll() {
      document.querySelectorAll('div.ProseMirror#prompt-textarea, #prompt-textarea.ProseMirror').forEach((textarea) => {
        textarea.innerHTML =
          '<p data-empty-paragraph="true" data-placeholder="Ask anything" class="placeholder"><br class="ProseMirror-trailingBreak"></p>';
        textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
      });
    },
  };
})();
