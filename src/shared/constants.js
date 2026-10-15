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
  tone: 'neutral',
  audience: 'general',
  length: 'same',
  domain: 'general',
  role: 'none',
  outputFormat: 'plain',
  source: 'composer',
  temperature: 0.3,
  topP: 1,
  maxTokens: 1024,
  addStructure: true,
  keepIntent: true,
  askExamples: false,
  stepByStep: false,
  noFluff: true,
  includeConstraints: true,
  stripMarkdown: true,
};

export const ENHANCE_STYLES = {
  direct:
    'Rewrite the prompt so it is clearer, more direct, and gets better answers.',
  shorter:
    'Rewrite the prompt to be shorter and denser while keeping the same intent.',
  clearer:
    'Rewrite the prompt for clarity: fix ambiguity and add missing constraints if obvious.',
  detailed:
    'Rewrite the prompt to be more specific and well-structured (goal, constraints, format).',
  custom: '',
};
