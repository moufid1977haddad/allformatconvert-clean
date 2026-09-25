'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { HASH_ALGORITHMS, DEFAULT_ALGORITHMS, TAG_NAME, byId, toHex, toBase64, parseExpected, sameBytes, algorithmsOfLength } from '../../../lib/hashAlgorithms';

const GROUPS = [...new Set(HASH_ALGORITHMS.map((a) => a.group))];
const fmtSize = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(2)} GB`);

// Relative cost per byte of each algorithm in WebAssembly (measured in Chromium, 2026-09-24), used to share
// the algorithms out between workers. SHA-1/2 held in memory run natively and cost next to nothing.
const WASM_COST = { md5: 2, sha1: 2.6, sha224: 5.4, sha256: 5.4, sha384: 3.6, sha512: 3.6, sha3_256: 4, sha3_512: 7.5, keccak256: 4, blake2b: 1.5, blake3: 1.8, ripemd160: 3, crc32: 0.7, crc32c: 0.7, xxh64: 0.2, xxh3: 0.2, xxh128: 0.2 };
// Largest file held in memory once for Web Crypto: the reference's own 700 MiB on desktop, the site-wide 100 MB
// mobile budget on phones and tablets (a tab there is killed before any error can be caught). Past it: streamed.
const inMemoryMax = () => (isMobileDevice() ? 100 : 700) * 1024 * 1024;
const PARALLEL_FROM = 16 * 1024 * 1024;

// Algorithms are shared between up to 4 workers that each read the file on their own, so a big file takes as
// long as its slowest algorithm instead of the sum of all of them (the reference hashes them one after another).
// Only one worker may hold the file in memory: every Web Crypto algorithm goes to the first one.
function planWorkers(size, algorithms) {
  const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2;
  const k = size < PARALLEL_FROM ? 1 : Math.max(1, Math.min(4, cores - 1, algorithms.length));
  const bins = Array.from({ length: k }, () => ({ ids: [], cost: 0 }));
  const native = size <= inMemoryMax() ? algorithms.filter((id) => byId[id].subtle) : [];
  bins[0].ids.push(...native); bins[0].cost += native.length * 0.3;
  for (const id of algorithms.filter((a) => !native.includes(a)).sort((a, b) => WASM_COST[b] - WASM_COST[a])) {
    const bin = bins.reduce((m, x) => (x.cost < m.cost ? x : m));
    bin.ids.push(id); bin.cost += WASM_COST[id];
  }
  return bins.filter((x) => x.ids.length).map((x) => x.ids);
}

// Hashing never blocks the page. workersRef.current.abort() (Cancel, or newer text) stops every worker of the job.
function runHash(blob, algorithms, hmacKey, onProgress, workersRef) {
  const groups = planWorkers(blob.size, algorithms);
  const done = groups.map(() => 0);
  const workers = groups.map(() => new Worker(new URL('./hash.worker.js', import.meta.url), { type: 'module' }));
  const stop = () => { workers.forEach((w) => w.terminate()); if (workersRef.current?.workers === workers) workersRef.current = null; };
  let abort;
  const aborted = new Promise((_, reject) => { abort = () => { stop(); reject(new Error('Cancelled.')); }; });
  workersRef.current = { workers, abort };
  return Promise.race([aborted, Promise.all(groups.map((ids, i) => new Promise((resolve, reject) => {
    const w = workers[i];
    w.onmessage = ({ data }) => {
      if (data.type === 'progress') { done[i] = data.done; onProgress?.(Math.min(...done), data.size); }
      else if (data.type === 'done') resolve(data.results);
      else reject(new Error(data.message));
    };
    w.onerror = (e) => reject(new Error(e?.message || 'The hashing worker stopped unexpectedly.'));
    w.postMessage({ blob, algorithms: ids, hmacKey, inMemoryMax: inMemoryMax() });
  })))]).then((parts) => { stop(); return Object.assign({}, ...parts); }, (e) => { stop(); throw e; });
}

export default function HashGeneratorPage() {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(DEFAULT_ALGORITHMS);
  const [format, setFormat] = useState('hex');
  const [hmacKey, setHmacKey] = useState('');
  const [expected, setExpected] = useState('');
  const [textResult, setTextResult] = useState(null);
  const [fileRun, setFileRun] = useState({ sig: '', items: [] }); // items: { name, size, results, secs } | { name, size, error }
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // { name, index, count, pct }
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState('');
  const inputRef = useRef(null);
  const workerRef = useRef(null);
  const textWorkerRef = useRef(null);
  const cancelled = useRef(false);

  const hmac = hmacKey.length > 0;
  const active = selected.filter((id) => !hmac || byId[id].hmac); // keyed: only algorithms HMAC is defined for
  const sig = active.join() + '|' + hmacKey;
  const skippedByHmac = hmac ? selected.filter((id) => !byId[id].hmac).map((id) => byId[id].label) : [];

  // Text is hashed as you type (UTF-8, exactly the characters in the box).
  useEffect(() => {
    if (mode !== 'text') return;
    if (!active.length) return; // nothing shown: the render asks for an algorithm
    let stale = false;
    const t = setTimeout(async () => {
      textWorkerRef.current?.abort();
      try {
        const results = await runHash(new Blob([text]), active, hmacKey, null, textWorkerRef);
        if (!stale) { setTextResult({ results, bytes: new TextEncoder().encode(text).length }); setError(''); }
      } catch (e) { if (!stale) setError(e.message); }
    }, 200);
    return () => { stale = true; clearTimeout(t); };
  }, [mode, text, sig]); // eslint-disable-line react-hooks/exhaustive-deps -- sig covers active and hmacKey

  const fileResults = fileRun.sig === sig ? fileRun.items : []; // results of other settings are not shown
  const setFileResults = (items) => setFileRun({ sig, items });

  const addFiles = (list) => {
    const added = Array.from(list || []);
    if (!added.length) return;
    setFiles((prev) => [...prev, ...added]);
    setFileResults([]); setError('');
  };
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : HASH_ALGORITHMS.map((a) => a.id).filter((x) => x === id || s.includes(x))));

  const hashFiles = async () => {
    if (!files.length || !active.length) return;
    cancelled.current = false;
    setBusy(true); setError(''); setFileResults([]);
    const out = [];
    for (let i = 0; i < files.length && !cancelled.current; i++) {
      const f = files[i];
      setProgress({ name: f.name, index: i, count: files.length, pct: 0 });
      const t0 = performance.now();
      try {
        const results = await runHash(f, active, hmacKey, (done, size) => setProgress({ name: f.name, index: i, count: files.length, pct: size ? Math.round((done / size) * 100) : 100 }), workerRef);
        out.push({ name: f.name, size: f.size, results, secs: (performance.now() - t0) / 1000 });
      } catch (e) {
        if (cancelled.current) break;
        out.push({ name: f.name, size: f.size, error: e.message });
      }
      setFileResults([...out]);
    }
    setBusy(false); setProgress(null);
  };
  const cancel = () => { cancelled.current = true; workerRef.current?.abort(); setBusy(false); setProgress(null); setError('Cancelled. Files finished before the cancel are listed below.'); };

  const show = (bytes) => (format === 'base64' ? toBase64(bytes) : toHex(bytes, format === 'HEX'));
  const want = parseExpected(expected);
  const expectedBad = expected.trim() && !want;
  const copy = async (value, tag) => { try { await navigator.clipboard.writeText(value); setCopied(tag); setTimeout(() => setCopied(''), 1500); } catch { setError('Copy was blocked by the browser. Select the text and copy it by hand.'); } };

  // `sha256sum --tag` style lines: GNU sha256sum -c and BSD shasum -c both check them.
  const checksumLines = (entries) => entries.filter((e) => e.results).flatMap((e) => active.filter((id) => e.results[id]).map((id) => `${hmac ? 'HMAC-' : ''}${TAG_NAME[id]} (${e.name}) = ${toHex(e.results[id])}`)).join('\n') + '\n';
  const downloadChecksums = () => {
    const url = URL.createObjectURL(new Blob([checksumLines(fileResults)], { type: 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = 'checksums.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const resultRows = (results, tagPrefix) => {
    const matched = want && active.some((id) => results[id] && sameBytes(results[id], want));
    return (
      <div className="space-y-2">
        {active.filter((id) => results[id]).map((id) => {
          const value = show(results[id]);
          const isMatch = want && sameBytes(results[id], want);
          return (
            <div key={id} className={`rounded-lg border p-3 ${isMatch ? 'bg-green-50 border-green-400' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-neutral-600">{hmac ? 'HMAC-' : ''}{byId[id].label}{isMatch && <span className="ml-2 text-green-700">✓ matches the expected hash</span>}</span>
                <button onClick={() => copy(value, tagPrefix + id)} className="text-xs text-indigo-600 hover:text-indigo-500">{copied === tagPrefix + id ? 'Copied' : 'Copy'}</button>
              </div>
              <div data-algorithm={id} className="font-mono text-xs break-all text-neutral-800">{value}</div>
            </div>
          );
        })}
        {want && !matched && (
          <p className="text-sm text-red-600" role="alert">✗ None of the selected algorithms gives the expected hash.{algorithmsOfLength(want.length).length ? ` A hash of this length is usually ${algorithmsOfLength(want.length).join(' or ')} — make sure it is ticked above.` : ''}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hash Generator</h1>
        <p className="text-neutral-500 text-center mb-2">MD5, SHA-1, SHA-2, SHA-3, BLAKE2, BLAKE3, RIPEMD-160, CRC32 and xxHash — for text or files of any size</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Everything is computed in your browser: nothing is uploaded. No file size limit — large files are read in pieces.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
          <div role="radiogroup" aria-label="What to hash" className="grid grid-cols-2 gap-2">
            {[['text', 'Text'], ['files', 'Files']].map(([id, label]) => (
              <button key={id} role="radio" aria-checked={mode === id} onClick={() => { setMode(id); setError(''); }} disabled={busy} className={`rounded-lg py-2 font-semibold border ${mode === id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-neutral-700 border-neutral-200 hover:border-indigo-400'}`}>{label}</button>
            ))}
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-neutral-700 mb-2">Algorithms</legend>
            <div className="space-y-2">
              {GROUPS.map((g) => (
                <div key={g}>
                  <div className="text-xs text-neutral-500 mb-1">{g}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {HASH_ALGORITHMS.filter((a) => a.group === g).map((a) => (
                      <label key={a.id} className={`flex items-center gap-1.5 text-sm ${hmac && !a.hmac ? 'text-neutral-400' : 'text-neutral-800'}`}>
                        <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} disabled={busy} />{a.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2 text-xs">
              <button onClick={() => setSelected(HASH_ALGORITHMS.map((a) => a.id))} disabled={busy} className="text-indigo-600 hover:underline">Select all</button>
              <button onClick={() => setSelected(DEFAULT_ALGORITHMS)} disabled={busy} className="text-indigo-600 hover:underline">Defaults</button>
              <button onClick={() => setSelected([])} disabled={busy} className="text-indigo-600 hover:underline">None</button>
            </div>
          </fieldset>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-neutral-700 font-semibold">Output</span>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 bg-white">
                <option value="hex">Hex, lowercase</option>
                <option value="HEX">Hex, UPPERCASE</option>
                <option value="base64">Base64</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-neutral-700 font-semibold">HMAC secret key (optional)</span>
              <input type="text" value={hmacKey} onChange={(e) => setHmacKey(e.target.value)} disabled={busy} placeholder="Leave empty for a plain hash" autoComplete="off" spellCheck={false} className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2" />
            </label>
          </div>
          {skippedByHmac.length > 0 && <p className="text-xs text-amber-700">HMAC is not defined for {skippedByHmac.join(', ')}: {skippedByHmac.length > 1 ? 'they are' : 'it is'} skipped while a key is set.</p>}

          <label className="block text-sm">
            <span className="text-neutral-700 font-semibold">Expected hash, to verify (optional)</span>
            <input type="text" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Paste the checksum published with the download" spellCheck={false} className={`mt-1 w-full border rounded-lg px-3 py-2 font-mono text-xs ${expectedBad ? 'border-red-400' : 'border-neutral-200'}`} />
            {expectedBad && <span className="text-xs text-red-600">This is neither hexadecimal nor Base64.</span>}
          </label>

          {mode === 'text' ? (
            <>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-y" placeholder="Type or paste text — it is hashed as you type" value={text} onChange={(e) => setText(e.target.value)} aria-label="Text to hash" />
              {!active.length && <p className="text-sm text-neutral-500">Tick at least one algorithm.</p>}
              {textResult && active.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-500">{textResult.bytes} byte{textResult.bytes === 1 ? '' : 's'} of UTF-8 text{text === '' ? ' (empty input)' : ''}</p>
                  {resultRows(textResult.results, 'text-')}
                </div>
              )}
            </>
          ) : (
            <>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-neutral-200 hover:border-indigo-500'}`}
                onClick={() => !busy && inputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) addFiles(e.dataTransfer.files); }}
              >
                <p className="text-neutral-600">Drop files here, or click to choose</p>
                <p className="text-neutral-400 text-xs mt-1">Any type, any size, several at once</p>
                <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              </div>
              {files.length > 0 && (
                <div className="space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                      <span className="truncate flex-1">{f.name} <span className="text-neutral-400">· {fmtSize(f.size)}</span></span>
                      <button onClick={() => { setFiles((p) => p.filter((_, j) => j !== i)); setFileResults([]); }} disabled={busy} className="text-red-500 hover:text-red-400 ml-2 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              )}
              {busy ? (
                <div className="space-y-3">
                  <ProgressBar pct={progress?.pct ?? 0} label={progress ? `Hashing ${progress.name}${progress.count > 1 ? ` (${progress.index + 1} of ${progress.count})` : ''}…` : 'Hashing…'} />
                  <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
                </div>
              ) : (
                <button onClick={hashFiles} disabled={!files.length || !active.length} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
                  {active.length ? `Hash ${files.length || ''} file${files.length === 1 ? '' : 's'}` : 'Tick at least one algorithm'}
                </button>
              )}
              {fileResults.length > 0 && (
                <div className="space-y-4">
                  {fileResults.map((r, i) => (
                    <div key={i} className="border border-neutral-200 rounded-xl p-4">
                      <div className="text-sm font-semibold mb-2 break-all">{r.name} <span className="font-normal text-neutral-400">· {fmtSize(r.size)}{r.secs != null ? ` · ${r.secs.toFixed(1)} s` : ''}</span></div>
                      {r.error ? <p className="text-sm text-red-600" role="alert">{r.error}</p> : resultRows(r.results, `f${i}-`)}
                    </div>
                  ))}
                  {!busy && fileResults.some((r) => r.results) && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      <button onClick={() => copy(checksumLines(fileResults), 'all')} className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl py-2 text-sm font-semibold">{copied === 'all' ? 'Copied' : 'Copy all'}</button>
                      <button onClick={downloadChecksums} className="bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 text-sm font-semibold">Download checksums.txt</button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
        </div>
      </div>
      <SeoContent
        title="Hash Generator"
        description="Hash Generator computes MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA3-256, SHA3-512, Keccak-256, BLAKE2b, BLAKE3, RIPEMD-160, CRC32, CRC32C, xxHash64, XXH3 and XXH128 for text or for files of any size, entirely in your browser — nothing is uploaded. Hash several files at once, add an HMAC key, paste a published checksum to verify a download, and save the results as a checksums.txt that sha256sum -c can check."
        howTo={[
          "Choose Text or Files.",
          "Tick the algorithms you need (MD5, SHA-1, SHA-256, SHA-512 and CRC32 are ticked by default).",
          "Type or paste text — it is hashed as you type — or drop one or more files and click Hash.",
          "To verify a download, paste the checksum published with it in \"Expected hash\": the matching algorithm turns green.",
          "Copy any value, or download every result as checksums.txt."
        ]}
        faqs={[
          { q: "Which algorithms are supported?", a: "MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA3-256, SHA3-512, Keccak-256 (the Ethereum variant, which differs from SHA3-256), BLAKE2b-512, BLAKE3, RIPEMD-160, CRC32, CRC32C, xxHash64, XXH3-64 and XXH128. SHA-1 and the SHA-2 family use your browser's built-in Web Crypto; the others use hash-wasm, an open-source WebAssembly library." },
          { q: "Is there a file size limit?", a: "No. Files are read in 8 MB pieces, so even files larger than your device's memory can be hashed; speed depends on your device. Files up to 700 MB (100 MB on phones and tablets) are also held in memory once so SHA-1 and SHA-2 can use the browser's faster native code. A 5 GB file was hashed in under a minute on a desktop computer in our tests." },
          { q: "Are my files or text uploaded?", a: "No. Hashing runs in a background worker inside your browser tab; nothing is sent to a server." },
          { q: "How do I verify a downloaded file?", a: "Drop the file, then paste the checksum published by the site you downloaded it from into \"Expected hash\" (hex or Base64). The matching algorithm is highlighted in green; if none matches, the tool says which algorithms produce a hash of that length." },
          { q: "What is the checksums.txt file?", a: "One line per file and algorithm, in the \"SHA256 (file) = hash\" format that `sha256sum -c`, `md5sum -c` and `shasum -c` understand, so you can check the files again later from a terminal." },
          { q: "What does the HMAC key do?", a: "With a key, the tool computes a keyed HMAC (for example HMAC-SHA256) instead of a plain hash — used to sign API requests and webhooks. HMAC is not defined for checksums such as CRC32 or xxHash, nor for BLAKE3 and Keccak, so they are skipped while a key is set." },
          { q: "Why does my text give a different hash elsewhere?", a: "Text is hashed as UTF-8, exactly as it appears in the box. A trailing newline, Windows line endings (CRLF) or a different encoding change the hash; the byte count under the results helps spot this." }
        ]}
        tips={[
          "Avoid MD5 and SHA-1 for anything security-sensitive — they are fine as checksums against accidental corruption, not against tampering. Use SHA-256 or better.",
          "None of these are appropriate for storing passwords — use a slow, salted algorithm such as bcrypt or Argon2.",
          "CRC32 and xxHash are checksums built for speed, not security: good for spotting corrupted copies, useless against deliberate changes.",
          "Hashing the same file twice always gives the same result; a one-byte change gives a completely different one."
        ]}
      />
    </div>
  );
}
