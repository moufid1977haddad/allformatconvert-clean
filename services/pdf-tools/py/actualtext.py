"""/v1/unicode-from-actualtext (P27): give accent glyphs that have NO Unicode text the accent their own /ActualText
says, so that converters which ignore ActualText read the right letters.

Measured (docs/audit/RAPPORT-p27-nuit-04-10.md §2): LibreOffice draws some accented letters as two glyphs -- the base
letter (with Unicode text) and an accent glyph WITHOUT any -- and wraps the pair in a marked-content span whose
/ActualText carries the real letter ("é"). Poppler, xpdf and Acrobat read ActualText; ConvertAPI and pdf.js do not, so
a real 3-page PDF came out of PDF to Word as "donne% es" for "données". With the entries added here (from that same
ActualText), ConvertAPI wrote "données".

Deliberately narrow -- only that measured case, so that nothing can be mapped wrong (independent review, P27):
  - the only characters added are COMBINING MARKS (Unicode category M), each right after a base glyph that already has
    text, at most one per base -- "e" + accent glyph, nothing else;
  - spans in right-to-left scripts or scripts whose glyphs are drawn out of logical order (Indic, Thai, Khmer...) are
    left alone, and so is a span whose text does not line up glyph for glyph;
  - a code that already has text (an empty mapping included) is never changed; a code that would get two different
    marks gets none; a ToUnicode stream shared by several fonts, a font that is not an indirect object, a CMap this
    parser does not fully understand (usecmap, names, odd syntax), a Type0 font whose encoding is not Identity-H/V:
    left alone;
  - encrypted or damaged files (qpdf had to repair them) are not rewritten at all.
Page content, fonts and everything but the ToUnicode streams are untouched.

    actualtext.py <in.pdf> <out.pdf>   -> prints {"added": N}; writes <out.pdf> only when N > 0
"""
import json
import re
import sys
import unicodedata

import pikepdf

ENTRY = re.compile(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>")
RANGE = re.compile(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>")


def code_width(font):
    if font.get("/Subtype") == pikepdf.Name.Type0:
        return 2 if font.get("/Encoding") in (pikepdf.Name("/Identity-H"), pikepdf.Name("/Identity-V")) else None
    return 1


def parse_tounicode(data):
    """{code: text} or None when the CMap uses anything this parser does not fully read."""
    if "usecmap" in data:
        return None
    m = {}
    for block in re.findall(r"beginbfchar(.*?)endbfchar", data, re.S):
        body = block.strip()
        entries = ENTRY.findall(body)
        if len(ENTRY.sub("", body).split()) or not entries and body:
            return None
        for a, b in entries:
            m[int(a, 16)] = bytes.fromhex(b).decode("utf-16-be", "replace")
    for block in re.findall(r"beginbfrange(.*?)endbfrange", data, re.S):
        body = block.strip()
        entries = RANGE.findall(body)
        if len(RANGE.sub("", body).split()):
            return None  # arrays or other forms: not read here, so not touched
        for a, b, c in entries:
            raw = bytes.fromhex(c)
            if len(raw) < 2:
                return None
            for i, code in enumerate(range(int(a, 16), int(b, 16) + 1)):
                last = int.from_bytes(raw[-2:], "big") + i
                m[code] = (raw[:-2] + (last & 0xFFFF).to_bytes(2, "big")).decode("utf-16-be", "replace")
    return m


def visual_order_script(text):
    for ch in text:
        if unicodedata.bidirectional(ch) in ("R", "AL", "AN"):
            return True
        o = ord(ch)
        if 0x0900 <= o <= 0x0DFF or 0x0E00 <= o <= 0x0EFF or 0x1000 <= o <= 0x109F or 0x1780 <= o <= 0x17FF \
                or 0xA8E0 <= o <= 0xA8FF or 0x1B00 <= o <= 0x1B7F:
            return True
    return False


def main():
    src, out = sys.argv[1], sys.argv[2]
    pdf = pikepdf.open(src)
    if pdf.is_encrypted or pdf.get_warnings():
        print(json.dumps({"added": 0}))
        return

    # every ToUnicode stream and how many fonts use it
    users = {}
    for obj in pdf.objects:
        if isinstance(obj, pikepdf.Dictionary) and obj.get("/Type") == pikepdf.Name.Font and isinstance(obj.get("/ToUnicode"), pikepdf.Stream):
            users[obj.ToUnicode.objgen] = users.get(obj.ToUnicode.objgen, 0) + 1

    cmaps = {}  # ToUnicode objgen -> {"stream", "map", "width", "add", "conflict"}

    def info_for(font):
        if not font.is_indirect or code_width(font) is None:
            return None
        tu = font.get("/ToUnicode")
        if not isinstance(tu, pikepdf.Stream) or users.get(tu.objgen, 0) != 1:
            return None
        if tu.objgen not in cmaps:
            parsed = parse_tounicode(tu.read_bytes().decode("latin-1"))
            cmaps[tu.objgen] = None if parsed is None else {"stream": tu, "map": parsed, "width": code_width(font), "add": {}, "conflict": set()}
        return cmaps[tu.objgen]

    def align(span):
        codes = span["codes"]
        if not codes or None in codes or visual_order_script(span["text"]):
            return
        chars = unicodedata.normalize("NFD", span["text"])
        pos, pending, prev_mapped = 0, [], False
        for info, code in codes:
            known = info["map"].get(code)
            if known is not None:
                k = unicodedata.normalize("NFD", known)
                if not k or chars[pos:pos + len(k)] != k:
                    return
                pos += len(k)
                prev_mapped = True
            else:
                if pos >= len(chars) or not prev_mapped or not unicodedata.category(chars[pos]).startswith("M"):
                    return
                pending.append((info, code, chars[pos]))
                pos += 1
                prev_mapped = False  # at most one added mark per base
        if pos != len(chars):
            return
        for info, code, ch in pending:
            if info["add"].get(code, ch) != ch:
                info["conflict"].add(code)
            info["add"][code] = ch

    seen_forms = set()

    def walk(owner, resources):
        fonts = {str(k): v for k, v in (resources.get("/Font") or {}).items()}
        cur, saved, stack = None, [], []
        for operands, op in pikepdf.parse_content_stream(owner):
            op = str(op)
            if op == "q":
                saved.append(cur)
            elif op == "Q":
                cur = saved.pop() if saved else None
            elif op == "Tf":
                f = fonts.get(str(operands[0]))
                cur = info_for(f) if f is not None else None
            elif op in ("BDC", "BMC"):
                props = operands[1] if op == "BDC" and len(operands) > 1 else None
                if isinstance(props, pikepdf.Dictionary) and "/ActualText" in props and not any(stack):
                    stack.append({"text": str(props.ActualText), "codes": []})
                else:
                    stack.append(None)
            elif op == "EMC":
                span = stack.pop() if stack else None
                if span:
                    align(span)
            elif op in ("Tj", "TJ", "'", '"'):
                span = next((s for s in stack if s), None)
                if span is None:
                    continue
                if cur is None:
                    span["codes"].append(None)  # a glyph we cannot place: the span will not line up
                    continue
                items = operands[0] if op == "TJ" else [operands[-1]]
                for it in items:
                    if isinstance(it, pikepdf.String):
                        raw = bytes(it)
                        if len(raw) % cur["width"]:
                            span["codes"].append(None)
                            continue
                        for i in range(0, len(raw), cur["width"]):
                            span["codes"].append((cur, int.from_bytes(raw[i:i + cur["width"]], "big")))
            elif op == "Do":
                xo = (resources.get("/XObject") or {}).get(str(operands[0]))
                if isinstance(xo, pikepdf.Stream) and xo.get("/Subtype") == pikepdf.Name.Form and xo.objgen not in seen_forms:
                    seen_forms.add(xo.objgen)
                    walk(xo, xo.get("/Resources") or resources)

    for page in pdf.pages:
        walk(page, page.get("/Resources") or pikepdf.Dictionary())

    added = 0
    for info in cmaps.values():
        if not info:
            continue
        adds = {c: ch for c, ch in info["add"].items() if c not in info["conflict"] and c not in info["map"]}
        if not adds:
            continue
        width = info["width"]
        items = sorted(adds.items())
        blocks = []
        for i in range(0, len(items), 100):  # at most 100 entries per bfchar block (PDF spec)
            chunk = items[i:i + 100]
            body = "".join(f"<{c:0{width * 2}X}> <{ch.encode('utf-16-be').hex().upper()}>\n" for c, ch in chunk)
            blocks.append(f"{len(chunk)} beginbfchar\n{body}endbfchar\n")
        data = info["stream"].read_bytes().decode("latin-1")
        if data.count("endcmap") != 1:
            continue
        info["stream"].write(data.replace("endcmap", "".join(blocks) + "endcmap").encode("latin-1"))
        added += len(adds)
    if added:
        pdf.save(out)
    print(json.dumps({"added": added}))


if __name__ == "__main__":
    main()
