'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { adsEnabled, adsenseClient, adSlots } from '../lib/ads';

// One display ad unit, placed only where the placement plan allows (docs/audit/RAPPORT-prelancement-01-10.md §3):
// - its height is reserved before the ad arrives (no layout shift, CLS stays 0 — the moyen of 123apps, whose ad boxes
//   carry a fixed min-height);
// - it is requested only when it comes near the screen (IntersectionObserver), never at page load;
// - it is labelled "Advertisement" (the only labels AdSense allows are "Advertisements" / "Sponsored Links");
// - it never sits inside a tool's working area or next to a Download button (AdSense placement policy).
export function AdSlot({ slot, minHeight = 280 }) {
  const ref = useRef(null);
  const pathname = usePathname();
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* the ad simply stays empty */ }
    }, { rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);
  return (
    <aside aria-label="Advertisement" className="max-w-5xl mx-auto px-4 my-8">
      <p className="text-[11px] uppercase tracking-wider text-neutral-500 text-center mb-1">Advertisement</p>
      <div style={{ minHeight }} className="flex items-center justify-center">
        <ins
          key={pathname}
          ref={ref}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight }}
          data-ad-client={adsenseClient()}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}

// First placement: bottom of every TOOL page (after the tool, its result and its explanations; before the footer).
// Nothing on the homepage, category pages, legal pages or account pages.
export default function ToolFooterAd() {
  const pathname = usePathname() || '';
  if (!adsEnabled() || !/^\/tools\/[^/]+\/[^/]+$/.test(pathname)) return null;
  return <AdSlot slot={adSlots.toolFooter} />;
}
