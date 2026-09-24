// What goes INSIDE a QR code for each content type -- the formats phone cameras recognise.
// Types chosen from QRCode Monkey's list (the free reference, read 2026-09-23, docs/audit/RAPPORT-licence-et-ameliorations.md §5).
//   Wi-Fi: the ZXing "WIFI:" format, read by the iOS and Android cameras; \ ; , : " are backslash-escaped.
//   vCard: version 3.0 (RFC 2426): \ , ; and line breaks escaped, CRLF line endings.
//   SMS:   SMSTO:number:message (ZXing), Phone: tel:, Email: mailto: with encoded subject/body, Location: geo:lat,lng.

const wifiEscape = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');
const vEscape = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const phoneClean = (s) => String(s).replace(/[^\d+*#]/g, '');

export const QR_TYPES = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: 'Text' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'sms', label: 'SMS' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'vcard', label: 'Contact (vCard)' },
  { id: 'geo', label: 'Location' },
];

// Returns { payload } or { error } (a message the page shows as is).
export function buildPayload(type, f = {}) {
  const v = (k) => String(f[k] ?? '').trim();
  switch (type) {
    case 'url': {
      let u = v('url');
      if (!u) return { error: 'Enter a web address.' };
      if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u; // "example.com" -> scannable link
      try { new URL(u); } catch { return { error: 'This is not a valid web address.' }; }
      return { payload: u };
    }
    case 'text':
      return v('text') ? { payload: String(f.text) } : { error: 'Enter some text.' };
    case 'email': {
      const to = v('to');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { error: 'Enter a valid email address.' };
      const q = [['subject', v('subject')], ['body', String(f.body ?? '')]].filter(([, x]) => x).map(([k, x]) => `${k}=${encodeURIComponent(x)}`);
      return { payload: `mailto:${to}${q.length ? '?' + q.join('&') : ''}` };
    }
    case 'phone': {
      const n = phoneClean(v('phone'));
      return n.replace(/\D/g, '').length >= 3 ? { payload: `tel:${n}` } : { error: 'Enter a phone number.' };
    }
    case 'sms': {
      const n = phoneClean(v('phone'));
      if (n.replace(/\D/g, '').length < 3) return { error: 'Enter a phone number.' };
      return { payload: `SMSTO:${n}:${String(f.message ?? '')}` };
    }
    case 'wifi': {
      const ssid = String(f.ssid ?? '');
      if (!ssid) return { error: 'Enter the network name (SSID).' };
      const enc = f.encryption === 'nopass' ? 'nopass' : f.encryption === 'WEP' ? 'WEP' : 'WPA'; // WPA covers WPA2/WPA3
      if (enc !== 'nopass' && !f.password) return { error: 'Enter the Wi-Fi password, or choose "No password".' };
      return { payload: `WIFI:T:${enc};S:${wifiEscape(ssid)};${enc !== 'nopass' ? `P:${wifiEscape(f.password)};` : ''}${f.hidden ? 'H:true;' : ''};` };
    }
    case 'vcard': {
      const first = v('firstName'), last = v('lastName');
      if (!first && !last && !v('org')) return { error: 'Enter at least a name or a company.' };
      const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${vEscape(last)};${vEscape(first)};;;`, `FN:${vEscape([first, last].filter(Boolean).join(' ') || v('org'))}`];
      if (v('org')) lines.push(`ORG:${vEscape(v('org'))}`);
      if (v('title')) lines.push(`TITLE:${vEscape(v('title'))}`);
      if (v('phone')) lines.push(`TEL;TYPE=CELL:${phoneClean(v('phone'))}`);
      if (v('email')) lines.push(`EMAIL:${vEscape(v('email'))}`);
      if (v('website')) lines.push(`URL:${vEscape(v('website'))}`);
      if (v('street') || v('city') || v('zip') || v('country')) lines.push(`ADR:;;${vEscape(v('street'))};${vEscape(v('city'))};;${vEscape(v('zip'))};${vEscape(v('country'))}`);
      lines.push('END:VCARD');
      return { payload: lines.join('\r\n') };
    }
    case 'geo': {
      const lat = Number(v('lat')), lng = Number(v('lng'));
      if (!v('lat') || !v('lng') || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return { error: 'Enter a latitude (-90 to 90) and a longitude (-180 to 180).' };
      }
      return { payload: `geo:${lat},${lng}` };
    }
    default:
      return { error: 'Unknown content type.' };
  }
}
