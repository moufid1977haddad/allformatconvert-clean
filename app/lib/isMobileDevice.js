// Client-only device check used to apply a lower resource cap on mobile,
// where a browser tab has a much smaller memory ceiling before it's killed.
export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  if (navigator.userAgentData?.mobile !== undefined) return navigator.userAgentData.mobile;
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPod|Mobile/i.test(ua)) return true;
  // iPadOS 13+ reports a desktop Mac UA string; touch support is the tell.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}
