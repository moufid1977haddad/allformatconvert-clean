// P35 (06/10, owner's decision D1 of P33): the OCR slots of this service, shared by every visitor.
//
// - at most `max` recognitions at the same time on the service (OCR_CONCURRENCY = 2: Tesseract ≈ 0.7-1 GB on a 12 MP
//   page, two at a time stay well under the container);
// - at most ONE recognition in progress per visitor (`key`: the hash of the visitor's IP, sent by the site — a visitor
//   cannot hold both slots with very dense pages, the case the security review of 05/10 left open);
// - beyond that, the request WAITS in line (first come, first served; a request whose visitor already has a page in
//   progress waits for it and does not block the others) and is told its place in line each time it changes, so the
//   page can show an honest "you are number 2 in line" instead of failing;
// - bounds on the line itself: `maxWaiting` requests waiting in all, `maxWaitingPerKey` per visitor, `maxWaitMs` at most
//   in line; beyond them the request is refused with a reason (said to the visitor), never left hanging.
// A request without a key (an older caller) gets a key of its own: it is only bound by `max`, as before.
// Pure logic, no timers other than the wait limit: scripts/p35/ocr-queue.test.mjs drives it with fake recognitions.

let anonymous = 0;

class OcrQueue {
  constructor({ max, maxWaiting, maxWaitingPerKey }) {
    this.max = max;
    this.maxWaiting = maxWaiting;
    this.maxWaitingPerKey = maxWaitingPerKey;
    this.running = 0;
    this.runningKeys = new Map(); // key -> recognitions in progress (0 or 1)
    this.waiting = []; // {key, start, onPosition, position}
  }

  #canStart(key) {
    return this.running < this.max && !this.runningKeys.get(key);
  }

  #start(key) {
    this.running++;
    this.runningKeys.set(key, (this.runningKeys.get(key) || 0) + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.running--;
      const n = this.runningKeys.get(key) - 1;
      if (n > 0) this.runningKeys.set(key, n); else this.runningKeys.delete(key);
      this.#pump();
    };
  }

  // starts every waiting request that may start now (in order), then tells the others their new place
  #pump() {
    for (let i = 0; i < this.waiting.length && this.running < this.max;) {
      const w = this.waiting[i];
      if (this.#canStart(w.key)) {
        this.waiting.splice(i, 1);
        w.start(this.#start(w.key));
      } else i++;
    }
    this.#tell();
  }

  #tell() {
    this.waiting.forEach((w, i) => {
      if (w.position !== i + 1) {
        w.position = i + 1;
        try { w.onPosition(w.position); } catch { /* a closed connection: its abort removes it */ }
      }
    });
  }

  /** {running, waiting} — for /health (no key, no visitor detail) */
  stats() {
    return { running: this.running, waiting: this.waiting.length };
  }

  /**
   * Waits for a slot. Resolves {ok: true, release, waited (ms), firstPosition} or {ok: false, reason} where reason is
   * 'line_full' | 'visitor_line_full' | 'timeout' | 'aborted'. `onPosition(n)` is called with the place in line (1 =
   * next) when the request has to wait, then each time it changes.
   */
  acquire(key, { maxWaitMs, signal, onPosition = () => {} } = {}) {
    const k = key || `anonymous-${++anonymous}`;
    if (signal && signal.aborted) return Promise.resolve({ ok: false, reason: 'aborted' });
    if (this.#canStart(k)) return Promise.resolve({ ok: true, release: this.#start(k), waited: 0, firstPosition: 0 });
    if (this.waiting.length >= this.maxWaiting) return Promise.resolve({ ok: false, reason: 'line_full' });
    if (this.waiting.filter((w) => w.key === k).length >= this.maxWaitingPerKey) return Promise.resolve({ ok: false, reason: 'visitor_line_full' });
    const since = Date.now();
    return new Promise((resolve) => {
      let timer = null;
      const entry = { key: k, onPosition, position: 0 };
      const leave = (reason) => {
        const i = this.waiting.indexOf(entry);
        if (i < 0) return;
        this.waiting.splice(i, 1);
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve({ ok: false, reason });
        this.#tell();
      };
      const onAbort = () => leave('aborted');
      entry.start = (release) => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve({ ok: true, release, waited: Date.now() - since, firstPosition });
      };
      this.waiting.push(entry);
      const firstPosition = this.waiting.length;
      timer = setTimeout(() => leave('timeout'), maxWaitMs);
      if (signal) signal.addEventListener('abort', onAbort, { once: true });
      this.#tell();
    });
  }
}

module.exports = { OcrQueue };
