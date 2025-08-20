let state = {
    pretext: '',
    enabled: false
};

// Initialize state from storage
chrome.storage.sync.get(['pretext', 'enabled'], (data) => {
    state = { pretext: data.pretext || '', enabled: data.enabled || false };
    if (state.enabled && state.pretext) {
        checkAndInsertPretext();
    }
});

function findPromptTextarea() {
    // ChatGPT/OpenAI
    let textarea = document.querySelector('div[contenteditable="true"].ProseMirror#prompt-textarea');
    if (textarea) return { textarea, platform: 'chatgpt' };
    
    // Perplexity - look for div with contenteditable and id="ask-input" (handles both placeholder states)
    textarea = document.querySelector('div[id="ask-input"]');
    if (textarea) return { textarea, platform: 'perplexity' };
    
    // DeepSeek - look for textarea with placeholder
    textarea = document.querySelector('textarea[id="chat-input"]');
    if (textarea) return { textarea, platform: 'deepseek' };
    
    return null;
}

function checkAndInsertPretext() {
    const result = findPromptTextarea();
    if (!result) return;

    const { textarea, platform } = result;
    
    if (platform === 'chatgpt') {
        const placeholder = textarea.querySelector('p.placeholder[data-placeholder="Ask anything"]');
        if (placeholder && state.enabled && state.pretext) {
            insertPretext(textarea, platform);
        }
    } else if (platform === 'perplexity') {
        // Check if Lexical editor is empty (various empty states)
        const isEmpty = textarea.innerHTML === '<p><br></p>' || 
                       textarea.innerHTML === '<p></p>' || 
                       textarea.innerHTML === '' ||
                       textarea.textContent.trim() === '' ||
                       textarea.querySelector('p')?.textContent === '' ||
                       textarea.querySelector('span[data-lexical-text="true"]')?.textContent === '';
        if (state.enabled && state.pretext && isEmpty) {
            insertPretext(textarea, platform);
        }
    } else if (platform === 'deepseek') {
        // Check if textarea is empty (no value or only whitespace)
        if (state.enabled && state.pretext && (!textarea.value || textarea.value.trim() === '')) {
            insertPretext(textarea, platform);
        }
    }
}

function insertPretext(textarea, platform) {
    if (platform === 'chatgpt') {
        // Clear existing content first
        textarea.innerHTML = '';

        // Create and add pretext paragraph
        const pretextP = document.createElement('p');
        pretextP.textContent = state.pretext;
        textarea.appendChild(pretextP);

        // Add two empty paragraphs for double spacing
        const spacingP = document.createElement('p');
        const spacingBr = document.createElement('br');
        spacingBr.className = 'ProseMirror-trailingBreak';
        spacingP.appendChild(spacingBr);
        textarea.appendChild(spacingP);

        // Add empty paragraph for cursor position
        const emptyP = document.createElement('p');
        const br = document.createElement('br');
        br.className = 'ProseMirror-trailingBreak';
        emptyP.appendChild(br);
        textarea.appendChild(emptyP);

        // Focus the textarea and move cursor to end
        textarea.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(emptyP);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        // Trigger input event for ChatGPT to recognize the change
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (platform === 'perplexity') {
        // For Perplexity's Lexical editor, find the inner <p> and put text inside it
        const innerP = textarea.querySelector('p');
        if (innerP) {
            // Put the pretext directly inside the existing <p> element
            innerP.textContent = state.pretext;
            
            // Focus the textarea
            textarea.focus();
            
            // Position cursor at the end of the text
            const range = document.createRange();
            range.selectNodeContents(innerP);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Trigger input event
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else if (platform === 'deepseek') {
        // For regular textareas, set the value directly
        textarea.value = state.pretext + '\n\n';
        textarea.focus();
        
        // Move cursor to end
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
        // Trigger input event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// Watch for changes in the chat interface
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const result = findPromptTextarea();
        if (result && state.enabled && state.pretext) {
            const { textarea, platform } = result;
            
            if (platform === 'chatgpt') {
                const placeholder = textarea.querySelector('p.placeholder[data-placeholder="Ask anything"]');
                if (placeholder) {
                    requestAnimationFrame(() => insertPretext(textarea, platform));
                }
            } else if (platform === 'perplexity') {
                // Check if Lexical editor is empty (various empty states)
                const isEmpty = textarea.innerHTML === '<p><br></p>' || 
                               textarea.innerHTML === '<p></p>' || 
                               textarea.innerHTML === '' ||
                               textarea.textContent.trim() === '' ||
                               textarea.querySelector('p')?.textContent === '' ||
                               textarea.querySelector('span[data-lexical-text="true"]')?.textContent === '';
                if (isEmpty) {
                    requestAnimationFrame(() => insertPretext(textarea, platform));
                }
            } else if (platform === 'deepseek') {
                // Check if textarea is empty
                if (!textarea.value || textarea.value.trim() === '') {
                    requestAnimationFrame(() => insertPretext(textarea, platform));
                }
            }
        }
    }
});

// Start observing with specific configuration
observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
});

// Message handler with cross-browser support
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updatePretext') {
        state.pretext = message.pretext;
        state.enabled = message.enabled;
        
        if (state.enabled && state.pretext) {
            const result = findPromptTextarea();
            if (result) {
                insertPretext(result.textarea, result.platform);
            }
        } else {
            // Clear all textareas when disabling
            // ChatGPT textareas
            const chatgptTextareas = document.querySelectorAll('div[contenteditable="true"].ProseMirror#prompt-textarea');
            chatgptTextareas.forEach(textarea => {
                textarea.innerHTML = '<p class="placeholder" data-placeholder="Ask anything"><br class="ProseMirror-trailingBreak"></p>';
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            });
            
            // Perplexity contenteditable divs
            const perplexityTextareas = document.querySelectorAll('div[id="ask-input"]');
            perplexityTextareas.forEach(textarea => {
                const innerP = textarea.querySelector('p');
                if (innerP) {
                    innerP.innerHTML = '<br>';
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            
            // DeepSeek textareas
            const deepseekTextareas = document.querySelectorAll('textarea[placeholder="Message DeepSeek"]');
            deepseekTextareas.forEach(textarea => {
                textarea.value = '';
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
    }
});
