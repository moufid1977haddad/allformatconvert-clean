// Server-side instructions for every tool that calls /api/ai and /api/ai-vision.
//
// Why this file exists: until 2026-09-23 the browser sent the system
// instruction itself, so anyone could POST {system: "...anything..."} and use
// the site's OpenAI key as a general-purpose model for any content, at the
// owner's expense. The browser now sends only the tool name, the visitor's
// content and, for two tools, one option chosen from a fixed list. Everything
// else (instruction, model, max tokens) is decided here and in the routes.

const LANGUAGES = [
  'English', 'French', 'Spanish', 'German', 'Italian',
  'Portuguese', 'Arabic', 'Chinese', 'Japanese', 'Russian',
];
const EMAIL_TONES = ['Professional', 'Friendly', 'Formal', 'Casual', 'Persuasive'];

// Each entry: option name the tool may send (or null), allowed values, and
// the instruction built from that value. No free text reaches the instruction.
const TEXT_TOOLS = {
  'ai-chatbot': {
    system: () => 'You are a helpful, friendly AI assistant. Answer questions and help with tasks in a conversational way.',
  },
  'ai-detector': {
    system: () => 'You are an AI text detector. Analyze the provided text and determine if it was likely written by an AI or a human. Provide a percentage likelihood and explain your reasoning.',
  },
  'ai-paraphraser': {
    system: () => 'You are a paraphrasing expert. Rewrite the provided text using different words and sentence structures while preserving the original meaning. Return only the paraphrased text.',
  },
  'ai-translator': {
    option: 'targetLang', values: LANGUAGES,
    system: (lang) => `You are a professional translator. Translate the provided text to ${lang}. Return only the translation without explanations.`,
  },
  'ai-writer': {
    system: () => 'You are a professional content writer. Generate high-quality, engaging content based on the user input. Be creative and detailed.',
  },
  'data-extractor': {
    system: () => 'You are a data extraction expert. Extract structured data from the provided text. Format the extracted data in a clear, organized way (JSON or table format when appropriate).',
  },
  'email-generator': {
    option: 'tone', values: EMAIL_TONES,
    system: (tone) => `You are a professional email writer. Generate a well-structured ${tone.toLowerCase()} email based on the user description. Include subject line, greeting, body, and closing.`,
  },
  'grammar-fixer': {
    system: () => 'You are a grammar expert. Fix all grammar, spelling, and punctuation errors in the text. Return only the corrected text without explanations.',
  },
  'keyword-extractor': {
    system: () => 'You are a keyword extraction expert. Extract the most important keywords and key phrases from the provided text. Return them as a numbered list with brief explanations of why each is important.',
  },
  'sentiment-analyzer': {
    system: () => 'You are a sentiment analysis expert. Analyze the sentiment of the provided text. Determine if it is Positive, Negative, or Neutral, provide a confidence percentage, and explain the key sentiment indicators.',
  },
  'text-summarizer': {
    system: () => 'You are a text summarizer. Create a concise summary of the provided text. Keep the key points and main ideas. Return only the summary.',
  },
  'pdf-ai-summary': {
    system: () => 'You are a document summarizer. The user message is the text extracted from a PDF document. Provide a clear and concise summary of its content.',
  },
  'pdf-translate': {
    option: 'targetLang', values: LANGUAGES,
    system: (lang) => `You are a professional translator. Translate the following text to ${lang}. Return only the translation.`,
  },
};

const VISION_TOOLS = {
  'image-captioner': 'Generate a creative, descriptive caption for this image.',
};

// Fields the browser used to be able to send and must not any more. Their
// presence is refused (400), never silently ignored, so a probe gets a clear
// answer and the closure can be proven from outside.
const FORBIDDEN_FIELDS = ['system', 'model', 'max_tokens', 'messages', 'temperature'];

function forbiddenField(body, extra = []) {
  for (const f of [...FORBIDDEN_FIELDS, ...extra]) {
    if (body && Object.prototype.hasOwnProperty.call(body, f)) return f;
  }
  return null;
}

/**
 * @returns {{ok:true, system:string}|{ok:false, error:string}}
 */
function resolveTextTool(body) {
  const bad = forbiddenField(body);
  if (bad) return { ok: false, error: `The "${bad}" field is decided by the server and cannot be sent.` };
  const tool = body && body.tool;
  const def = typeof tool === 'string' && Object.prototype.hasOwnProperty.call(TEXT_TOOLS, tool) ? TEXT_TOOLS[tool] : null;
  if (!def) return { ok: false, error: 'Unknown tool.' };
  if (!def.option) return { ok: true, system: def.system() };
  const value = body.options && body.options[def.option];
  if (!def.values.includes(value)) return { ok: false, error: `Unsupported ${def.option}.` };
  return { ok: true, system: def.system(value) };
}

/**
 * @returns {{ok:true, prompt:string}|{ok:false, error:string}}
 */
function resolveVisionTool(body) {
  const bad = forbiddenField(body, ['prompt']);
  if (bad) return { ok: false, error: `The "${bad}" field is decided by the server and cannot be sent.` };
  const tool = body && body.tool;
  if (typeof tool !== 'string' || !Object.prototype.hasOwnProperty.call(VISION_TOOLS, tool)) {
    return { ok: false, error: 'Unknown tool.' };
  }
  return { ok: true, prompt: VISION_TOOLS[tool] };
}

module.exports = { resolveTextTool, resolveVisionTool, TEXT_TOOLS, VISION_TOOLS, LANGUAGES, EMAIL_TONES };
