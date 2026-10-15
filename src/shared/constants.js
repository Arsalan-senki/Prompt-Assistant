export const STORAGE_KEYS = {
  pretext: 'pretext',
  enabled: 'enabled',
  enhanceApiKey: 'enhanceApiKey',
  enhanceSettings: 'enhanceSettings',
};

export const MESSAGE_TYPES = {
  updatePretext: 'updatePretext',
  getState: 'getState',
  enhancePrompt: 'enhancePrompt',
  getComposerText: 'getComposerText',
  replaceComposerOnce: 'replaceComposerOnce',
};

export const DEFAULT_PRETEXT = 'give me direct answers';
export const DEFAULT_ENABLED = true;

export const ENHANCE_MODELS = [
  'qwen/qwen3-235b-a22b-2507:free',
  'deepseek/deepseek-chat-v3.1:free',
  'google/gemma-3-27b-it:free',
];
export const ENHANCE_MODEL = ENHANCE_MODELS[0];

export const DEFAULT_ENHANCE_SETTINGS = {
  model: ENHANCE_MODEL,
  style: 'direct',
  customInstruction: '',
  language: 'auto',
};

export const ENHANCE_STYLES = {
  direct:
    'Rewrite the prompt so it is clearer, more direct, and gets better answers.',
  shorter:
    'Rewrite the prompt to be shorter and denser while keeping the same intent.',
  detailed:
    'Rewrite the prompt to be more specific and well-structured (goal, constraints, format).',
};
