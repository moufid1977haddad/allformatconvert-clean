'use client';
import { useEffect } from 'react';
import { isIos } from './IosOriginalNote';

// iPhone / iPad (28/09, owner): a video preview stays black until played, where a Mac shows its first image — iOS
// loads nothing before a tap. Site-wide, iOS only: every <video> with a file (blob) source asks for its metadata and
// is placed at 0.001 s, which makes Safari decode and draw the first image (the "#t=0.001" technique, done here for
// every tool at once instead of in each page). Camera streams (srcObject) are left alone.
export default function IosVideoFirstFrame() {
  useEffect(() => {
    if (!isIos()) return undefined;
    // 30/09 (owner's iPhone): (1) a <video> without playsinline opens FULL SCREEN when it plays on iPhone -- every
    // video of the site now plays in the page; (2) a result shown with its src already set (Video Trimmer) stayed
    // white: iOS had settled on loading nothing before preload was changed, so it is asked to load again.
    const prep = (v) => {
      if (v.tagName !== 'VIDEO') return;
      if (!v.hasAttribute('playsinline')) { v.setAttribute('playsinline', ''); v.playsInline = true; }
      if (!v.hasAttribute('preload') || v.preload === 'none') {
        v.preload = 'metadata';
        if (v.readyState === 0 && !v.srcObject && (v.getAttribute('src') || v.currentSrc)) v.load();
      }
    };
    document.querySelectorAll('video').forEach(prep);
    const mo = new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      prep(n); n.querySelectorAll?.('video').forEach(prep);
    })));
    mo.observe(document.body, { childList: true, subtree: true });
    const onMeta = (e) => {
      const v = e.target;
      if (v.tagName !== 'VIDEO' || v.srcObject || !v.currentSrc.startsWith('blob:')) return;
      if (v.paused && v.currentTime === 0) v.currentTime = 0.001;
    };
    document.addEventListener('loadedmetadata', onMeta, true); // media events do not bubble: caught while capturing
    return () => { mo.disconnect(); document.removeEventListener('loadedmetadata', onMeta, true); };
  }, []);
  return null;
}
