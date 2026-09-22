// Minimal but correct reader for the TAR formats real tools write today.
//
// Measured 2026-09-22 (docs/audit/RAPPORT-outils-mis-en-avant.md): the previous
// hand-rolled parser treated every 512-byte header as a file, so on archives made
// by Python, GNU tar, Windows' own tar.exe or macOS tar it offered the POSIX PAX
// metadata records ("@PaxHeader", "dossier/PaxHeader/été.txt") as downloadable
// files -- one of them under the REAL file's name, containing only
// "26 path=dossier/été.txt ..." -- lost accented names and truncated paths over
// 100 characters. This reader applies what those records say instead:
//   - ustar "prefix" field (paths up to 255 bytes),
//   - PAX extended headers: 'x' (next entry) and 'g' (global) -- path/size keys,
//   - GNU long names ('L') and long link names ('K'),
//   - only regular files are returned; directories, links, devices are skipped.

const decoder = new TextDecoder('utf-8');

function field(bytes, offset, length) {
  const slice = bytes.subarray(offset, offset + length);
  const end = slice.indexOf(0);
  return decoder.decode(end === -1 ? slice : slice.subarray(0, end));
}

function octal(bytes, offset, length) {
  // GNU base-256 encoding for sizes >= 8 GiB: high bit of the first byte set.
  if (bytes[offset] & 0x80) {
    let n = 0;
    for (let i = offset + 1; i < offset + length; i++) n = n * 256 + bytes[i];
    return n;
  }
  const s = field(bytes, offset, length).trim();
  return s ? parseInt(s, 8) : 0;
}

function isZeroBlock(bytes, offset) {
  for (let i = offset; i < offset + 512; i++) if (bytes[i] !== 0) return false;
  return true;
}

function checksumOk(bytes, offset) {
  const stored = octal(bytes, offset + 148, 8);
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += i >= 148 && i < 156 ? 32 : bytes[offset + i];
  return sum === stored;
}

// "len key=value\n" records; the path value is UTF-8.
function parsePax(data) {
  const out = {};
  let pos = 0;
  while (pos < data.length) {
    const space = data.indexOf(0x20, pos);
    if (space === -1) break;
    const len = parseInt(decoder.decode(data.subarray(pos, space)), 10);
    if (!len) break;
    const record = decoder.decode(data.subarray(space + 1, pos + len - 1));
    const eq = record.indexOf('=');
    if (eq > 0) out[record.slice(0, eq)] = record.slice(eq + 1);
    pos += len;
  }
  return out;
}

export class TarFormatError extends Error {}

// Returns [{ name, data: Uint8Array }] for every regular file, in archive order.
export function readTar(bytes) {
  const files = [];
  let offset = 0;
  let global = {};
  let pending = {};
  let longName = null;
  while (offset + 512 <= bytes.length) {
    if (isZeroBlock(bytes, offset)) break;
    if (!checksumOk(bytes, offset)) {
      if (offset === 0) throw new TarFormatError('This file is not a valid TAR archive.');
      throw new TarFormatError('The archive is damaged: a header checksum does not match.');
    }
    const type = String.fromCharCode(bytes[offset + 156] || 0x30);
    const magic = field(bytes, offset + 257, 6);
    let name = field(bytes, offset, 100);
    if (magic.startsWith('ustar')) {
      const prefix = field(bytes, offset + 345, 155);
      if (prefix) name = prefix + '/' + name;
    }
    let size = octal(bytes, offset + 124, 12);
    const meta = { ...global, ...pending };
    if (meta.size !== undefined && type !== 'x' && type !== 'g') size = Number(meta.size);
    const dataStart = offset + 512;
    const data = bytes.subarray(dataStart, dataStart + size);
    if (dataStart + size > bytes.length) throw new TarFormatError('The archive is truncated.');
    offset = dataStart + Math.ceil(size / 512) * 512;

    if (type === 'x') { pending = parsePax(data); continue; }
    if (type === 'g') { global = { ...global, ...parsePax(data) }; continue; }
    if (type === 'L') { longName = field(data, 0, data.length); continue; }
    if (type === 'K') continue;

    if (longName) name = longName;
    if (meta.path) name = meta.path;
    pending = {};
    longName = null;
    // '0' and NUL are regular files ('7' is a contiguous file, same thing).
    if ((type === '0' || type === '\0' || type === '7') && !name.endsWith('/')) {
      files.push({ name: name.replace(/^\.\//, ''), data });
    }
  }
  return files;
}
