'use client';
import { useEffect, useRef } from 'react';

// P27 (WCAG 2.2 AA), one site-wide rule instead of ~100 page edits, like FileDropBridge:
//
// 1. Upload areas work from the keyboard. About 95 tool pages draw their upload area as a <div onClick> around a
//    hidden <input type="file">: a mouse can open the picker, Tab never reaches it (2.1.1 Keyboard). Every such area
//    (an element holding exactly one hidden, enabled file input, drawn as an upload area: dashed border or pointer
//    cursor) becomes a button for assistive technology -- role="button", in the Tab order, a name taken from its own
//    words -- and Enter or Space opens the same picker a click opens. Areas that already are buttons, labels or
//    focusable are left alone.
// 2. Status messages are announced (4.1.3): a polite live region says when a file is ready to download and when a
//    task starts showing progress (errors already use role="alert"). Polite: never interrupts the visitor.
const isHidden = (el) => {
  const s = getComputedStyle(el);
  return s.display === 'none' || s.visibility === 'hidden' || el.classList.contains('hidden') || el.classList.contains('sr-only');
};

function zoneFor(input) {
  let el = input.parentElement;
  for (let depth = 0; el && el !== document.body && depth < 4; depth++, el = el.parentElement) {
    if (el.matches('button, a, label, [role="button"], [tabindex], summary')) return null;
    if (el.querySelectorAll('input[type="file"]').length !== 1) return null;
    // a button may not hold other controls (axe nested-interactive): such areas are left as they are
    if (el.querySelector('button, a[href], select, textarea, input:not([type="file"]), [tabindex], [role="button"]')) return null;
    const s = getComputedStyle(el);
    if (s.cursor === 'pointer' || /border-dashed/.test(el.className) || s.borderStyle.includes('dashed')) return el;
  }
  return null;
}

function nameOf(zone) {
  return (zone.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 140) || 'Choose a file';
}

function enhance(root) {
  for (const input of root.querySelectorAll('input[type="file"]:not([disabled])')) {
    if (!isHidden(input)) continue;
    const zone = zoneFor(input);
    if (!zone || zone.dataset.a11yZone) continue;
    zone.dataset.a11yZone = '1';
    zone.setAttribute('role', 'button');
    zone.setAttribute('tabindex', '0');
    zone.setAttribute('aria-label', nameOf(zone));
    zone.addEventListener('keydown', (e) => {
      if (e.target !== zone || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      const target = zone.querySelector('input[type="file"]:not([disabled])');
      if (target) target.click();
    });
  }
}

export default function A11yBridge() {
  const regionRef = useRef(null);

  useEffect(() => {
    const main = document.getElementById('main-content') || document.body;
    let queued = false;
    const announced = new WeakSet();
    const say = (text) => {
      const region = regionRef.current;
      if (!region) return;
      region.textContent = '';
      // a fresh text node after a tick: screen readers announce a change, not a replacement in the same frame
      setTimeout(() => { region.textContent = text; }, 60);
    };
    const scan = () => {
      queued = false;
      enhance(main);
      for (const el of main.querySelectorAll('[data-file-download]')) {
        if (announced.has(el)) continue;
        announced.add(el);
        say(`Your file is ready to download: ${el.getAttribute('data-name') || 'result'}.`);
      }
      for (const bar of main.querySelectorAll('[role="progressbar"]')) {
        if (announced.has(bar)) continue;
        announced.add(bar);
        say(bar.getAttribute('aria-label') || 'Working…');
      }
      // zone names follow their words (a chosen file's name replaces "Click or drop…")
      for (const zone of main.querySelectorAll('[data-a11y-zone]')) {
        const n = nameOf(zone);
        if (zone.getAttribute('aria-label') !== n) zone.setAttribute('aria-label', n);
      }
    };
    scan();
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(scan);
    });
    mo.observe(main, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, []);

  return <div ref={regionRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-a11y-status />;
}
