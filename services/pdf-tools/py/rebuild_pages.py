"""PDF Repair, last structural method (P28): a PDF that lost its trailer and catalog (a truncated download, a cut
copy) still holds its page objects. Measured: qpdf, Poppler and Ghostscript all refuse such a file ("couldn't find
trailer dictionary"); iLovePDF's repair engine (3-Heights PDF Repair) rebuilds it. Same idea with nothing but the
file's own bytes: append a NEW catalog and a trailer, and let qpdf reconstruct the cross-reference table. No content
stream is touched.

Which pages, in which order (independent review, P28):
  * every object is taken in its LAST occurrence in the file (an incremental update rewrites an object further down;
    an object unpacked from an object stream counts at the position of that stream), and only those last copies of
    unpacked objects are appended -- an older revision never wins;
  * if the page tree's root (/Type /Pages without /Parent) survives, the new catalog points to it: page order,
    deleted pages and inherited /Resources, /MediaBox, /CropBox, /Rotate stay exactly the document's own;
  * otherwise the pages are listed in object-number order -- only when every page carries its own /MediaBox and
    /Resources (nothing to inherit) and the file has a single revision (no incremental update that could have deleted
    a page); else nothing is rebuilt.
    python rebuild_pages.py <in.pdf> <out.pdf>
exit 0 printing '{"pages": n, "mode": "tree"|"object-order"}', 3 when nothing can be rebuilt safely.
"""
import json
import re
import sys
import zlib

src, dst = sys.argv[1], sys.argv[2]
data = open(src, 'rb').read()

# Objects that end with "endobj" (an object cut by the truncation is not taken). Page and page-tree objects are
# dictionaries, never streams, so a non-greedy match up to the first endobj is the whole object.
OBJ = re.compile(rb'(?<![0-9])(\d{1,10})\s+(\d{1,5})\s+obj\b(.*?)\bendobj', re.S)
PAGE = re.compile(rb'/Type\s*/Page(?![a-zA-Z])')
PAGES = re.compile(rb'/Type\s*/Pages(?![a-zA-Z])')
OBJSTM = re.compile(rb'/Type\s*/ObjStm')
MAX_UNPACKED = 256 << 20  # an object stream inflating beyond this is skipped (decompression bomb)

latest = {}  # object number -> (position, generation, body, unpacked)
for m in OBJ.finditer(data):
    num, gen, body, pos = int(m.group(1)), int(m.group(2)), m.group(3), m.start()
    latest[num] = (pos, gen, body, False)
    if not OBJSTM.search(body):
        continue
    # Chromium, pdf-lib and Word keep most objects compressed inside object streams, which only the lost
    # cross-reference stream pointed to: each intact FlateDecode object stream is unpacked.
    head, _, rest = body.partition(b'stream')
    first, count = re.search(rb'/First\s+(\d+)', head), re.search(rb'/N\s+(\d+)', head)
    if not (first and count and re.search(rb'/Filter\s*/FlateDecode', head)) or re.search(rb'/DecodeParms', head):
        continue
    raw = re.sub(rb'^\r?\n', b'', rest).rsplit(b'endstream', 1)[0]
    try:
        d = zlib.decompressobj()
        text = d.decompress(raw, MAX_UNPACKED)
        if d.unconsumed_tail:
            continue
    except zlib.error:
        continue
    first, count = int(first.group(1)), int(count.group(1))
    nums = [int(x) for x in text[:first].split()[: 2 * count]]
    if len(nums) != 2 * count:
        continue
    offs = nums[1::2] + [len(text) - first]
    for i in range(count):
        onum = nums[2 * i]
        prev = latest.get(onum)
        if prev is None or prev[0] <= pos:  # objects in a stream are generation 0, dated by the stream's position
            latest[onum] = (pos, 0, text[first + offs[i]: first + offs[i + 1]], True)

if not latest:
    sys.exit(3)


def refs(body, key):
    m = re.search(rb'/' + key + rb'\s*\[([^\]]*)\]', body)
    return [int(x) for x in re.findall(rb'(\d+)\s+\d+\s+R', m.group(1))] if m else []


def is_page(body):
    return PAGE.search(body) and not PAGES.search(body) and b'stream' not in body


roots = [n for n, (_, _, b, _) in latest.items() if PAGES.search(b) and not re.search(rb'/Parent\s+\d+\s+\d+\s+R', b)]
mode, page_count, root = None, 0, None
if len(roots) == 1:
    # Walk the surviving tree: every node and page must be there (else fall through to the stricter rule).
    stack, seen, ok = [roots[0]], set(), True
    while stack and ok:
        n = stack.pop()
        if n in seen or n not in latest:
            ok = False
            break
        seen.add(n)
        body = latest[n][2]
        if PAGES.search(body):
            stack.extend(refs(body, rb'Kids'))
        elif is_page(body):
            page_count += 1
        else:
            ok = False
    if ok and page_count:
        mode, root = 'tree', roots[0]

if mode is None:
    # More than one revision: two %%EOF, or one followed by more of the file (the end of a later revision was cut),
    # or a cross-reference section pointing to a previous one (/Prev <offset>, not an outline item's /Prev <n> 0 R).
    # A linearized file counts too (refused: cautious).
    eofs = [m.end() for m in re.finditer(rb'%%EOF', data)]
    several = len(eofs) > 1 or (len(eofs) == 1 and data[eofs[0]:].strip()) or re.search(rb'/Prev\s+\d+(?![\d\s]*\d\s+R)', data)
    pages = sorted(n for n, (_, _, b, _) in latest.items() if is_page(b))
    own = all(re.search(rb'/MediaBox', latest[n][2]) and re.search(rb'/Resources', latest[n][2]) for n in pages)
    if not pages or not own or several:
        sys.exit(3)
    mode, page_count = 'object-order', len(pages)

top = max(latest) + 1
cat, tree = top, top + 1
tail = b''.join(b'\n%d 0 obj\n%s\nendobj\n' % (n, b.strip()) for n, (_, _, b, unpacked) in sorted(latest.items()) if unpacked)
if mode == 'tree':
    tail += b'\n%d 0 obj\n<< /Type /Catalog /Pages %d %d R >>\nendobj\n' % (cat, root, latest[root][1])
else:
    kids = b' '.join(b'%d %d R' % (n, latest[n][1]) for n in pages)
    tail += (b'\n%d 0 obj\n<< /Type /Catalog /Pages %d 0 R >>\nendobj\n' % (cat, tree)
             + b'%d 0 obj\n<< /Type /Pages /Kids [ %s ] /Count %d >>\nendobj\n' % (tree, kids, len(pages)))
tail += b'trailer\n<< /Root %d 0 R /Size %d >>\n%%%%EOF\n' % (cat, tree + 1)
open(dst, 'wb').write(data + tail)
print(json.dumps({'pages': page_count, 'mode': mode}))
