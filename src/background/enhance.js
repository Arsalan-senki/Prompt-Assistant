import {
  DEFAULT_ENHANCE_SETTINGS,
  ENHANCE_STYLES,
  ENHANCE_MODELS,
  STORAGE_KEYS,
} from '../shared/constants.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function buildSystemPrompt(settings) {
  const parts = [];
  const style = settings.style || 'direct';
  const custom = settings.customInstruction?.trim() || '';

  parts.push(ENHANCE_STYLES[style] || ENHANCE_STYLES.direct);
  if (custom) {
    parts.push(`Custom instruction from the user: ${custom}`);
  }

  parts.push('Preserve the original intent and meaning.');

  switch (settings.language) {
    case 'en':
      parts.push('Write the improved prompt in English.');
      break;
    case 'fa':
      parts.push('Write the improved prompt in Persian (Farsi).');
      break;
    default:
      parts.push('Keep the same language as the original prompt.');
      break;
  }

  parts.push('Make important constraints explicit and remove filler.');
  parts.push('Do not wrap the answer in markdown code fences.');

  parts.push(
    'Output only the improved prompt text - no quotes, labels, or explanation.'
  );

  return parts.join(' ');
}

function buildRequestBody(text, settings, stream) {
  const model = settings.model;
  const body = {
    model,
    stream,
    messages: [
      { role: 'system', content: buildSystemPrompt(settings) },
      {
        role: 'user',
        content: `Improve this prompt:\n\n${text}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  };

  return body;
}

async function loadEnhanceConfig(overrides = {}) {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.enhanceApiKey,
    STORAGE_KEYS.enhanceSettings,
  ]);

  const apiKey = (stored[STORAGE_KEYS.enhanceApiKey] || '').trim();
  if (!apiKey) {
    throw new Error('Add your OpenRouter API key in Enhance settings.');
  }

  const saved = stored[STORAGE_KEYS.enhanceSettings] || {};
  const settings = {
    ...DEFAULT_ENHANCE_SETTINGS,
    model: ENHANCE_MODELS.includes(saved.model)
      ? saved.model
      : DEFAULT_ENHANCE_SETTINGS.model,
    style: saved.style || DEFAULT_ENHANCE_SETTINGS.style,
    customInstruction: saved.customInstruction || saved.extraContext || '',
    language: saved.language || DEFAULT_ENHANCE_SETTINGS.language,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => key in DEFAULT_ENHANCE_SETTINGS)
    ),
  };

  // Reject old/custom model IDs rather than sending the user's key to an
  // unlisted or potentially paid endpoint.
  if (!ENHANCE_MODELS.includes(settings.model)) {
    throw new Error('Choose one of the supported free models in Enhance settings.');
  }

  return { apiKey, settings };
}

function stripMarkdownFences(text) {
  return text
    .replace(/^```[\w-]*\n?/, '')
    .replace(/\n?```$/, '')
    .trim();
}

/**
 * Non-streaming enhance (fallback).
 */
export async function enhancePromptText(text, overrides = {}) {
  const { apiKey, settings } = await loadEnhanceConfig(overrides);

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/chatgpt-pretext-inserter',
      'X-Title': 'Prompt Assistant',
    },
    body: JSON.stringify(buildRequestBody(text, settings, false)),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message || JSON.stringify(errBody);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Enhance failed (${response.status})`);
  }

  const data = await response.json();
  let enhanced = data?.choices?.[0]?.message?.content?.trim();
  if (!enhanced) {
    throw new Error('Model returned an empty response.');
  }

  enhanced = stripMarkdownFences(enhanced);

  return enhanced;
}

/**
 * Stream enhance tokens. Calls onChunk(partialText) as content arrives.
 * Returns the final enhanced string.
 */
export async function enhancePromptTextStream(text, onChunk, overrides = {}) {
  const { apiKey, settings } = await loadEnhanceConfig(overrides);

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/chatgpt-pretext-inserter',
      'X-Title': 'Prompt Assistant',
    },
    body: JSON.stringify(buildRequestBody(text, settings, true)),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message || JSON.stringify(errBody);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Enhance failed (${response.status})`);
  }

  if (!response.body) {
    // Environment without streams - fall back
    const enhanced = await enhancePromptText(text, overrides);
    onChunk?.(enhanced);
    return enhanced;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith('data:')) continue;

      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length) {
          fullText += delta;
          onChunk?.(fullText);
        }
      } catch {
        // ignore partial JSON lines
      }
    }
  }

  let enhanced = fullText.trim();
  if (!enhanced) {
    throw new Error('Model returned an empty response.');
  }

  enhanced = stripMarkdownFences(enhanced);

  // Do not call onChunk again here - final text is applied once by the caller
  return enhanced;
}
