// Stand-in for Node's `fs` in the browser bundle (next.config.ts,
// turbopack.resolveAlias). quicktype-core's NodeIO imports these four
// functions to read schema files from disk, a path JSON-to-code never takes in
// the browser. If it ever did, the error says so instead of failing silently.
function unavailable() {
  throw new Error('File system access is not available in the browser.');
}
export const createReadStream = unavailable;
export const existsSync = unavailable;
export const lstatSync = unavailable;
export const readlinkSync = unavailable;
