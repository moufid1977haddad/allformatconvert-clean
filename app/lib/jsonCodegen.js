// JSON to typed code (TypeScript, Python, Go, C#, Rust, PHP) — 29/09.
//
// Measured before: the six generators only looked at the top-level keys.
// A nested object became `object` / `dict` / `interface{}` / serde_json::Value,
// a top-level array produced fields named 0, 1, 2, a key such as "first-name"
// or "class" produced code that does not compile, null became `object` in
// TypeScript, and every integer was typed as a float. The page gave no warning.
//
// The market reference (app.quicktype.io, and JSONLint / transform.tools which
// use the same engine or its approach) infers one named type per nested
// object, merges every element of an array, marks fields that are missing or
// null as optional, distinguishes integers from floats and renames fields to
// the language's convention with the serialization attribute that keeps the
// JSON name. We use that engine itself: quicktype-core (Apache-2.0), loaded
// only when the visitor clicks Convert.

const LANGS = {
  typescript: { lang: 'typescript', options: { 'just-types': 'true', 'prefer-unions': 'true' } },
  python: { lang: 'python', options: { 'just-types': 'true', 'python-version': '3.7' } },
  go: { lang: 'go', options: { 'just-types': 'true' } },
  csharp: { lang: 'csharp', options: { features: 'attributes-only', framework: 'SystemTextJson', namespace: 'App' } },
  rust: { lang: 'rust', options: { 'leading-comments': 'false', 'derive-debug': 'true', 'derive-clone': 'true', 'skip-serializing-none': 'true' } },
  php: { lang: 'php', options: { 'with-get': 'false' } },
};

// rootName: the name of the top-level type (default "Root").
export async function jsonToCode(text, target, rootName = 'Root') {
  const conf = LANGS[target];
  if (!conf) throw new Error(`Unknown target language "${target}"`);
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  JSON.parse(source); // the browser's own error message for invalid JSON
  const { quicktype, InputData, jsonInputForTargetLanguage } = await import('quicktype-core');
  const input = jsonInputForTargetLanguage(conf.lang);
  await input.addSource({ name: rootName, samples: [source] });
  const inputData = new InputData();
  inputData.addInput(input);
  const result = await quicktype({
    inputData,
    lang: conf.lang,
    rendererOptions: conf.options,
    // Keep a string a string: no guessed enums, dates or UUID types from
    // sample values (a date type would also need an extra crate/package).
    inferEnums: false,
    inferDateTimes: false,
    inferUuids: false,
    inferIntegerStrings: false,
    inferBooleanStrings: false,
  });
  return result.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
