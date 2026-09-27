// A page left open while a new version of the site is deployed can ask for a code
// file ("chunk") of its old version. Vercel's skew protection (on for this project,
// 12 h) serves most of them, but not every case (a tab older than that, a file
// loaded from a Web Worker…): the browser then throws "Failed to load chunk"
// (Turbopack), "Loading chunk N failed" (webpack), "error loading dynamically
// imported module" (Firefox) or "Importing a module script failed" (Safari).
// It is not a bug of the tool: the page is simply out of date. Like the sites that
// handle it well, we reload the page once, automatically; if that already happened
// a moment ago, we tell the visitor instead of looping (tool_errors 143-146).

const RELOAD_KEY = 'oct-chunk-reload-at';

export function isChunkLoadError(error) {
  if (!error) return false;
  const name = String(error.name || '');
  const msg = String(error.message || error);
  return name === 'ChunkLoadError'
    || /Failed to load chunk|Loading (CSS )?chunk [\w-]+ failed|error loading dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module/i.test(msg);
}

// Reloads the page unless it was already reloaded for this reason in the last minute.
// Returns true when a reload was started.
export function reloadOnceForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false; // no storage: never risk a reload loop
  }
  window.location.reload();
  return true;
}

// Tells the page-wide banner (NewVersionBanner) to offer a reload.
export function announceNewVersion() {
  try { window.dispatchEvent(new Event('oct:new-version')); } catch {}
}
