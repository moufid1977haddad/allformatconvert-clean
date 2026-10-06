// P37 (06/10): who reads the pages of PDF OCR first — the visitor's device (Tesseract.js in the browser) or our own OCR
// service (/api/pdf-ocr, Tesseract on our pdf-tools service, app/lib/serverPageOcr.js).
//
// A real iPhone pass on 2026-10-06 (iOS 26, Safari) showed the device never finishes: "Drawing the page… 0 %", then,
// after the 20 s wait of P33, our service recognized the 3 pages. The 04/10 pass had stalled the same way at
// "Recognizing text… 0 %". So on iPhone and iPad (iPadOS included, which says "Macintosh" with several touch points:
// the site's one check, app/lib/canvasLimit.js) the pages go to our service from the start, said before "Run OCR".
// Everywhere else (computers, Android) the device reads them and nothing is sent.
import { appleTouchFrom } from './canvasLimit.js';

/**
 * @param {{userAgent?: string, platform?: string, maxTouchPoints?: number}|undefined} nav  the browser's navigator
 * @param {unknown} forced  the test hook window.__forceServerPageRender (only `true` counts)
 * @returns {'server'|'device'}
 */
export function ocrFirstStep(nav, forced) {
  return forced === true || appleTouchFrom(nav) ? 'server' : 'device';
}
