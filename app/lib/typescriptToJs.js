// TypeScript to JS (P37): used only by app/tools/developer-tools/typescript-to-js/page.jsx.
// Tested by scripts/p37/typescript-to-js.test.mjs against TypeScript's own transpiler.
//
// Sucrase strips the types. Two fixes over the P36 page:
// - JSX: the page enabled JSX only when the code contained "return <" or "return (<", so an arrow
//   component `() => <div/>` or `const el = <span/>` failed with "Unexpected token". tsc decides by
//   file extension (.ts / .tsx); a pasted text has none, so the code is first read as .ts (where
//   `<any>x` is a cast) and, only if that fails, read again as .tsx. If both fail, the error of the
//   reading that got further is shown.
// - Namespaces: Sucrase removes every namespace with everything inside it, so the values of
//   `namespace A { export const x = 1 }` were dropped without a word. tsc compiles such a namespace
//   into an object; Sucrase cannot. A namespace that holds values now stops the conversion with a
//   message naming it. Namespaces that hold only types, and ambient ones (declare), produce no
//   JavaScript under tsc either and are still removed.
//
// The CommonJS build of Sucrase is loaded (dist/index.js and dist/parser): both entry points then
// share one copy of the parser in the browser bundle, and Node can run the same file in the tests.

const OPTIONS = { disableESTransforms: true, keepUnusedImports: false, jsxRuntime: 'preserve' };
const IDENT = /^[A-Za-z_$][\w$]*$/;
class NamespaceValuesError extends Error {}

function lineOf(code, index) {
  return code.slice(0, index).split('\n').length;
}

// Index of the token closing the brace opened at tokens[open].
function closingBrace(code, tokens, open) {
  let depth = 0;
  for (let i = open; i < tokens.length; i++) {
    const t = code.slice(tokens[i].start, tokens[i].end);
    if (t === '{' || t === '${') depth++;
    else if (t === '}') { depth--; if (depth === 0) return i; }
  }
  return tokens.length - 1;
}

// Does this namespace body produce JavaScript once its types are removed?
function holdsValues(transform, body, transforms) {
  let out;
  try { out = transform(body, { ...OPTIONS, transforms }).code; } catch { return true; }
  return /\S/.test(out.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''));
}

// Throws when the code has a namespace (or `module X {}`) that holds values.
function refuseValueNamespaces(code, parse, transform, jsx) {
  const transforms = jsx ? ['typescript', 'jsx'] : ['typescript'];
  const { tokens } = parse(code, jsx, true, false);
  const text = (i) => (tokens[i] ? code.slice(tokens[i].start, tokens[i].end) : '');
  let ambientEnd = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (i <= ambientEnd || !tokens[i].isType) continue;
    const word = text(i);
    if (word === 'declare' && ['namespace', 'module', 'global'].includes(text(i + 1))) {
      let open = i + 1;
      while (open < tokens.length && text(open) !== '{' && text(open) !== ';') open++;
      if (text(open) === '{') ambientEnd = closingBrace(code, tokens, open);
      continue;
    }
    if ((word !== 'namespace' && word !== 'module') || !IDENT.test(text(i + 1))) continue;
    let j = i + 1;
    const name = [text(j)];
    while (text(j + 1) === '.' && IDENT.test(text(j + 2))) { name.push(text(j + 2)); j += 2; }
    if (text(j + 1) !== '{') continue;
    const close = closingBrace(code, tokens, j + 1);
    const body = code.slice(tokens[j + 1].end, tokens[close].start);
    if (holdsValues(transform, body, transforms)) {
      throw new NamespaceValuesError(`namespace "${name.join('.')}" (line ${lineOf(code, tokens[i].start)}) contains code, not only types. This converter removes types only and cannot compile a namespace into JavaScript, so that code would be lost. Move them out of the namespace, or compile this file with tsc.`);
    }
  }
}

export async function convertTypescript(code) {
  const [{ transform }, { parse }] = await Promise.all([import('sucrase/dist/index.js'), import('sucrase/dist/parser/index.js')]);
  const run = (jsx) => {
    const out = transform(code, { ...OPTIONS, transforms: jsx ? ['typescript', 'jsx'] : ['typescript'] }).code;
    refuseValueNamespaces(code, parse, transform, jsx);
    return out;
  };
  let tsError;
  try { return run(false); } catch (e) { tsError = e; }
  if (tsError instanceof NamespaceValuesError) throw tsError;
  try { return run(true); } catch (e) {
    if (e instanceof NamespaceValuesError) throw e;
    throw (e.pos ?? -1) > (tsError.pos ?? -1) ? e : tsError;
  }
}
