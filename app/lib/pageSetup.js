// Pure helpers of app/components/PageSetup.jsx (P24), here so a server route can use them too (P25, E4: HTML to PDF
// from a URL). No React, no browser API.
export const PAGE_SETUP_DEFAULT = { size: 'auto', landscape: false, margin: 'auto' };
export const SIZES = [['auto', 'As in the document'], ['A4', 'A4'], ['Letter', 'Letter'], ['Legal', 'Legal'], ['A3', 'A3'], ['A5', 'A5']];
export const MARGINS = [['auto', 'As in the document'], ['0', 'None'], ['10mm', 'Small (10 mm)'], ['20mm', 'Normal (20 mm)'], ['30mm', 'Big (30 mm)']];

/** The @page rule for a choice, or '' when everything is left to the document. */
export function pageSetupCss({ size, landscape, margin }) {
  const parts = [];
  if (size !== 'auto') parts.push(`size: ${size}${landscape ? ' landscape' : ''};`);
  else if (landscape) parts.push('size: landscape;');
  if (margin !== 'auto') parts.push(`margin: ${margin};`);
  return parts.length ? `@page { ${parts.join(' ')} }` : '';
}

/** The HTML with the rule added last in <head> (a later @page rule wins), or at the start when there is no <head>. */
export function withPageSetup(html, setup) {
  const css = pageSetupCss(setup);
  if (!css) return html;
  const tag = `<style data-page-setup>${css}</style>`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${tag}</head>`);
  // no <head>: after the doctype / <html> tag, never before the doctype (that would switch the page to quirks mode)
  const m = /^\s*(<!doctype[^>]*>)?\s*(<html[^>]*>)?/i.exec(html);
  return html.slice(0, m[0].length) + tag + html.slice(m[0].length);
}

// Paper widths and heights in millimetres (portrait), for the scale that emulates a screen width (P25, E4).
export const PAPER_MM = { A4: [210, 297], Letter: [215.9, 279.4], Legal: [215.9, 355.6], A3: [297, 420], A5: [148, 210] };
