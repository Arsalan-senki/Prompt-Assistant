import {
  DEFAULT_ENHANCE_SETTINGS,
  ENHANCE_STYLES,
  ENHANCE_MODEL,
  STORAGE_KEYS,
} from '../shared/constants.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function buildSystemPrompt(settings) {
  const parts = [];
  const style = settings.style || 'direct';
  const custom = settings.customInstruction?.trim() || '';

  if (style === 'custom') {
    parts.push(
      custom ||
        'Rewrite the prompt so it is clearer, more direct, and gets better answers.'
    );
  } else {
    parts.push(ENHANCE_STYLES[style] || ENHANCE_STYLES.direct);
    if (custom) {
      parts.push(`Custom instruction from the user: ${custom}`);
    }
  }

  if (settings.keepIntent !== false) {
    parts.push('Preserve the original intent and meaning.');
  }

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

  switch (settings.tone) {
    case 'formal':
      parts.push('Use a formal tone.');
      break;
    case 'casual':
      parts.push('Use a casual, conversational tone.');
      break;
    case 'technical':
      parts.push('Use a precise technical tone.');
      break;
    case 'persuasive':
      parts.push('Use a persuasive tone.');
      break;
    default:
      break;
  }

  switch (settings.audience) {
    case 'beginner':
      parts.push('Target a beginner audience.');
      break;
    case 'expert':
      parts.push('Target an expert audience; avoid over-explaining basics.');
      break;
    case 'developer':
      parts.push('Target software developers.');
      break;
    default:
      break;
  }

  switch (settings.domain) {
    case 'coding':
      parts.push('Optimize the prompt for coding / software tasks.');
      break;
    case 'writing':
      parts.push('Optimize the prompt for writing / editing tasks.');
      break;
    case 'research':
      parts.push('Optimize the prompt for research / analysis tasks.');
      break;
    case 'business':
      parts.push('Optimize the prompt for business / product tasks.');
      break;
    default:
      break;
  }

  switch (settings.role) {
    case 'expert':
      parts.push('Frame the prompt as asking an expert assistant.');
      break;
    case 'teacher':
      parts.push('Frame the prompt as asking a patient teacher.');
      break;
    case 'coder':
      parts.push('Frame the prompt as asking a senior software engineer.');
      break;
    case 'researcher':
      parts.push('Frame the prompt as asking a careful researcher.');
      break;
    default:
      break;
  }

  switch (settings.length) {
    case 'shorter':
      parts.push('Make the result noticeably shorter than the original.');
      break;
    case 'longer':
      parts.push('Make the result more complete and slightly longer if helpful.');
      break;
    default:
      parts.push('Keep roughly similar length unless clarity requires a change.');
      break;
  }

  switch (settings.outputFormat) {
    case 'bullets':
      parts.push('Format the improved prompt as concise bullet points.');
      break;
    case 'numbered':
      parts.push('Format the improved prompt as a short numbered list.');
      break;
    case 'sections':
      parts.push(
        'Format the improved prompt with short labeled sections (Goal, Context, Constraints, Output).'
      );
      break;
    default:
      parts.push('Keep the improved prompt as plain continuous text unless structure helps.');
      break;
  }

  if (settings.addStructure) {
    parts.push(
      'When helpful, include clear goals, constraints, and desired output format.'
    );
  }
  if (settings.includeConstraints) {
    parts.push('Make important constraints explicit.');
  }
  if (settings.askExamples) {
    parts.push('Ask for concrete examples in the improved prompt when useful.');
  }
  if (settings.stepByStep) {
    parts.push('Ask for a step-by-step approach in the improved prompt when useful.');
  }
  if (settings.noFluff) {
    parts.push('Remove filler, fluff, and vague wording.');
  }
  if (settings.stripMarkdown) {
    parts.push('Do not wrap the whole answer in markdown code fences.');
  }

  parts.push(
    'Output only the improved prompt text - no quotes, labels, or explanation.'
  );

  return parts.join(' ');
}

function buildRequestBody(text, settings, stream) {
  const model = settings.model || ENHANCE_MODEL;
  const temperature = Number(settings.temperature);
  const topP = Number(settings.topP);
  const maxTokens = Number(settings.maxTokens);

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
    temperature: Number.isFinite(temperature) ? temperature : 0.3,
    max_tokens: Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : 1024,
  };

  if (Number.isFinite(topP) && topP > 0 && topP <= 1) {
    body.top_p = topP;
  }

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

  const settings = {
    ...DEFAULT_ENHANCE_SETTINGS,
    ...(stored[STORAGE_KEYS.enhanceSettings] || {}),
    ...overrides,
  };

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

  if (settings.stripMarkdown) {
    enhanced = stripMarkdownFences(enhanced);
  }

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

  if (settings.stripMarkdown) {
    enhanced = stripMarkdownFences(enhanced);
  }

  // Do not call onChunk again here - final text is applied once by the caller
  return enhanced;
}
