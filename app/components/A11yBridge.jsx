'use client';
import { useEffect, useRef } from 'react';

// P27 (WCAG 2.2 AA), one site-wide rule instead of ~100 page edits, like FileDropBridge:
//
// 1. Upload areas work from the keyboard. About 110 tool pages draw their upload area as a <div onClick> (dashed
//    border, pointer cursor) that opens a hidden <input type="file">, inside it or next to it: a mouse can open the
//    picker, Tab never reaches it (2.1.1 Keyboard). Every such area becomes a button for assistive technology --
//    role="button", in the Tab order, a name taken from its own words -- and Enter or Space does what a click does
//    (the area's own click handler runs, so each tool keeps its own rules: nothing opens while it is busy). Areas that
//    already are buttons, links, labels or focusable, or that hold other controls, are left alone.
// 2. Status messages are announced (4.1.3): a polite live region says when a file is ready to download and when a
//    task starts showing progress (errors already use role="alert"). Polite: never interrupts the visitor.
// an element drawn as an upload area: dashed border and pointer cursor, with a file input inside it or next to it
function isZone(el) {
  if (el.closest('button, a, label, [role="button"], summary, [data-a11y-zone]') || el.hasAttribute('tabindex')) return false;
  const s = getComputedStyle(el);
  if (!s.borderStyle.includes('dashed') || s.cursor !== 'pointer') return false;
  // a button may not hold other controls (axe nested-interactive)
  if (el.querySelector('button, a[href], select, textarea, input:not([type="file"]), [tabindex], [role="button"]')) return false;
  const scope = el.parentElement || el;
  return !!(el.querySelector('input[type="file"]') || scope.querySelector('input[type="file"]'));
}

function nameOf(zone) {
  return (zone.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 140) || 'Choose a file';
}

function enhance(root) {
  // only elements that ask for a dashed border (class or inline style): cheap, and every upload area of the site does
  for (const zone of root.querySelectorAll('.border-dashed, [style*="dashed"]')) {
    if (zone.dataset.a11yZone || !isZone(zone)) continue;
    zone.dataset.a11yZone = '1';
    zone.setAttribute('role', 'button');
    zone.setAttribute('tabindex', '0');
    zone.setAttribute('aria-label', nameOf(zone));
    zone.addEventListener('keydown', (e) => {
      if (e.target !== zone || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      zone.click();
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
    // the visitor hears that the file was taken (4.1.3), whatever the tool shows next
    const onChange = (e) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.type === 'file' && t.files && t.files.length) {
        const names = [...t.files].map((f) => f.name);
        say(names.length === 1 ? `Selected: ${names[0]}.` : `Selected: ${names.length} files.`);
      }
    };
    main.addEventListener('change', onChange, true);
    scan();
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(scan);
    });
    mo.observe(main, { childList: true, subtree: true, characterData: true });
    return () => { mo.disconnect(); main.removeEventListener('change', onChange, true); };
  }, []);

  return <div ref={regionRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-a11y-status />;
}
