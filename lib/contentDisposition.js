// A Content-Disposition header for ANY file name. HTTP header values are byte
// strings: putting a visitor's name as-is in `filename="…"` made the Fetch
// Headers API throw "Cannot convert argument to a ByteString" as soon as the
// name held a character above U+00FF (Chinese, Arabic, "’", "œ"…) -- a real
// visitor's pdf-to-word conversion failed that way on 26/09 (tool_errors 131-132).
// The standard way (RFC 6266 + RFC 5987, what download servers send): an ASCII
// fallback in `filename`, and the exact UTF-8 name, percent-encoded, in
// `filename*`, which every current browser prefers.

// "Café d’été.pdf" -> "Cafe d_ete.pdf"; nothing outside printable ASCII, no quote, no backslash.
function asciiFallback(name) {
  const s = String(name || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_')
    .trim();
  return s.replace(/^_+(?=\.)/, '') || 'download';
}

// RFC 5987 attr-char: everything else percent-encoded (encodeURIComponent leaves ' ( ) * ! to encode too).
function rfc5987(name) {
  return encodeURIComponent(name).replace(/['()*!]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function contentDisposition(name, type = 'attachment') {
  const clean = String(name || 'download').replace(/[\u0000-\u001f\u007f]/g, '');
  return `${type}; filename="${asciiFallback(clean)}"; filename*=UTF-8''${rfc5987(clean)}`;
}

module.exports = { contentDisposition, asciiFallback };
