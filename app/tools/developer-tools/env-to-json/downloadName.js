// File name of the result of .env to JSON (P37, 06/10). It was always env.json, also when the result is .env lines.
// The .env result is not named ".env": Chrome and Firefox remove a leading dot from a download name (no hidden
// files), so the visitor would get "env" with no extension. variables.env is kept as is; rename it to .env.
const NAMES = { json: 'env.json', env: 'variables.env' };

export function downloadName(direction) {
  const name = NAMES[direction];
  if (!name) throw new Error(`Unknown direction "${direction}"`);
  return name;
}
