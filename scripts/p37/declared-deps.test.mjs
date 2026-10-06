// P37 lot 1 -- every bare import in app/ and lib/ must resolve to a package declared in package.json
// "dependencies" (a package reached only as a dependency of another one can disappear or change version
// when that other package is updated).
//   node scripts/p37/declared-deps.test.mjs
// Imports are read with TypeScript's preProcessFile: import/export ... from, import(), require().
import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const declared = new Set(Object.keys(pkg.dependencies || {}));
const builtins = new Set(builtinModules);
const EXT = /\.(m?[jt]sx?|cjs)$/;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (EXT.test(e.name)) yield p;
  }
}
const pkgName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
const isBare = (spec) => !/^(\.|\/|@\/|node:|data:|https?:)/.test(spec) && !builtins.has(spec.split('/')[0]);

const missing = new Map(); // package -> [file, ...]
let files = 0, imports = 0;
for (const dir of ['app', 'lib']) {
  for (const file of walk(path.join(ROOT, dir))) {
    files++;
    const info = ts.preProcessFile(fs.readFileSync(file, 'utf8'), true, true);
    for (const { fileName } of info.importedFiles) {
      if (!isBare(fileName)) continue;
      imports++;
      const name = pkgName(fileName);
      if (declared.has(name)) continue;
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      if (!missing.has(name)) missing.set(name, []);
      if (!missing.get(name).includes(rel)) missing.get(name).push(rel);
    }
  }
}
console.log(`${files} files, ${imports} bare imports read in app/ and lib/`);
for (const [name, where] of missing) {
  let installed = 'not installed';
  try { installed = 'installed ' + JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', name, 'package.json'), 'utf8')).version; } catch { /* reported as not installed */ }
  const dev = pkg.devDependencies && pkg.devDependencies[name] ? ' (in devDependencies only)' : '';
  console.log(`FAIL ${name} is imported but not declared in dependencies${dev}; ${installed}; ${where.join(', ')}`);
}
console.log(missing.size ? `\n${missing.size} undeclared package(s)` : '\nALL PASS: every bare import is declared in dependencies');
process.exit(missing.size ? 1 : 0);
