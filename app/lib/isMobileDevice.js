// Client-only device check used to apply a lower resource cap on mobile,
// where a browser tab has a much smaller memory ceiling before it's killed.
//
// P37 (06/10): Android tablets were treated as computers. Chrome, Edge and Samsung Internet on a tablet report
// navigator.userAgentData.mobile = false and leave "Mobile" out of the UA, and that answer was trusted first; on 10-inch
// and larger tablets Chrome even asks for the desktop site by default, with a Linux desktop UA ("X11; Linux x86_64").
// A tablet tab has a phone's memory ceiling, not a computer's, so every Android device gets the mobile caps:
//   - "Android" in the UA, or userAgentData.platform "Android" (phones and tablets, every browser);
//   - Amazon Fire tablets: Silk, or a Kindle Fire model code (KF..), also in Silk's desktop view;
//   - a Linux UA (not a Chromebook) with a touch screen: an Android tablet showing the desktop site. This is the same
//     tell as for the iPad below (desktop UA + touch); a Linux laptop with a touch screen also gets the lower caps.
// iPadOS 13+ reports a desktop Mac UA string; touch support is the tell there (as in canvasLimit.js and download.js).
/** The same check on a navigator-like object {userAgent, maxTouchPoints, userAgentData} (pure, tested in node). */
export function isMobileNavigator(nav) {
  if (!nav) return false;
  const ua = nav.userAgent || '';
  const touch = (Number(nav.maxTouchPoints) || 0) > 1;
  const hints = nav.userAgentData;
  if (/Android/i.test(ua) || /^Android$/i.test(hints?.platform || '')) return true;
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  if (/Macintosh/.test(ua) && touch) return true;
  if (/\bSilk\/|\bKF[A-Z]{2,6}\b/.test(ua)) return true;
  if (/\bLinux\b/.test(ua) && !/\bCrOS\b/.test(ua) && touch) return true;
  if (hints?.mobile === true) return true;
  return /Mobile/i.test(ua);
}

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return isMobileNavigator(navigator);
}
