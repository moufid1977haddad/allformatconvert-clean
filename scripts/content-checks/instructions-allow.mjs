// Quoted texts in tool instructions that are NOT labels of a control (see instructions.mjs). One entry per page and
// text, with the reason. Keep it short: a mismatch is fixed in the page, not here, unless the text really is no label.
// Each entry below was read in context on 01/10 (P20).
const EXAMPLE = 'an example of what to type, not a control';
export const ALLOW = {
  'ai-tools/ai-chatbot': { 'and its population?': EXAMPLE },
  'ai-tools/image-generator': {
    '35mm photo': EXAMPLE, 'flat vector illustration': EXAMPLE, '3D render': EXAMPLE,
    'golden hour': EXAMPLE, 'neon-lit': EXAMPLE, 'soft studio light': EXAMPLE,
  },
  'developer-tools/csv-to-excel': { 'Smith, John': 'an example CSV value' },
  'developer-tools/json-to-python': { 'first-name': 'an example JSON key' },
  'developer-tools/json-to-rust': { camelCase: 'serde attribute value in generated code', 'last-name': 'an example JSON key' },
  'developer-tools/json-to-yaml': { 'Note: important': 'an example value' },
  'file-tools/base64-encoder': { 'data:mime/type;base64,': 'the prefix of the output, built in code' },
  'file-tools/file-splitter': { 'copy /b': 'a Windows command, not on this page' },
  'gif-tools/apng-to-gif': { animation: 'a word in quotes, not a label' },
  'gif-tools/gif-to-apng': { 'restore to previous': 'the GIF disposal method name' },
  'math-tools/number-base-converter': { 'convert to': 'says the page has NO such selector' },
  'math-tools/percentage-calculator': { 'X is what % of 0': 'the "X is what % of Y?" panel with Y = 0' },
  'math-tools/roman-numeral-converter': { xiv: EXAMPLE, XIV: EXAMPLE },
  'pdf-tools/pdf-extract-text': { 'Page 1:': "output heading built in code ('Page ' + i + ':')", 'Page 2:': 'same' },
  'pdf-tools/pdf-ocr': { 'Page X of Y': 'counter rendered as Page {currentPage} of {totalPages}' },
  'pdf-tools/word-to-pdf': { 'Update Field': "Microsoft Word's own menu item" },
  'text-tools/duplicate-remover': { Apple: EXAMPLE, apple: EXAMPLE },
  'text-tools/word-counter': { 'Mr.': EXAMPLE },
  'video-tools/media-player': { 'gesture:right-click': "the browser's own context menu on <video> (native controls)" },
  'video-tools/screen-recorder': { 'Chrome Tab': "the tab choice in Chrome's own screen picker" },
};
