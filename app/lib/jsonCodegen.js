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

// P24 review (03/10): quicktype infers types from the parsed VALUES — {"price": 10.0} became int64 / i64 / long, so a
// 10.5 received later fails to unmarshal. A number written with a point or an exponent is a decimal: the sample given
// to quicktype keeps it one (only types are generated, never values). A whole number beyond 64 bits becomes a float
// type there (its last digits lost when read): the generated code starts with a comment saying so.
function sampleForTypes(src) {
  let out = '', i = 0, beyond = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"') { let j = i + 1; while (j < src.length && src[j] !== '"') j += src[j] === '\\' ? 2 : 1; out += src.slice(i, j + 1); i = j + 1; continue; }
    const m = /^-?\d+(\.\d+)?([eE][-+]?\d+)?/.exec(src.slice(i, i + 400));
    if (m && (c === '-' || (c >= '0' && c <= '9'))) {
      let t = m[0];
      if ((m[1] || m[2]) && Number.isInteger(Number(t))) t = '1.5'; // stays a decimal type (only types are generated; 6.02e23 gave "6.02e+23.5")
      else if (!m[1] && !m[2] && (BigInt(t) > 9223372036854775807n || BigInt(t) < -9223372036854775808n)) beyond++;
      out += t; i += m[0].length; continue;
    }
    out += c; i++;
  }
  return { sample: out, beyond };
}

// rootName: the name of the top-level type (default "Root").
export async function jsonToCode(text, target, rootName = 'Root') {
  const conf = LANGS[target];
  if (!conf) throw new Error(`Unknown target language "${target}"`);
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  JSON.parse(source); // the browser's own error message for invalid JSON
  const { quicktype, InputData, jsonInputForTargetLanguage } = await import('quicktype-core');
  const input = jsonInputForTargetLanguage(conf.lang);
  const { sample, beyond } = sampleForTypes(source);
  await input.addSource({ name: rootName, samples: [sample] });
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
  const code = result.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  if (!beyond) return code;
  const note = `// Note: ${beyond} whole number${beyond > 1 ? 's are' : ' is'} beyond 64 bits; typed as a float here, so its last digits would be lost — read it as a string or a big-number type.\n`;
  return code.startsWith('<?php') ? code.replace(/^<\?php\n?/, (m) => m + note) : note + code; // after <?php, never printed as text
}
