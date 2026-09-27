import json, re, csv, os
import pandas as pd

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw')
OUT = os.path.dirname(os.path.abspath(__file__))
N = 40
stats = {}

def clean(s):
    return re.sub(r'\s+', ' ', str(s).replace('﻿', '')).strip()

def m2_pairs(path, joiner=' '):
    blocks = open(path, encoding='utf-8-sig').read().strip().split('\n\n')
    out = []
    for b in blocks:
        lines = b.strip().split('\n')
        if not lines or not lines[0].startswith('S '):
            continue
        toks = lines[0][2:].split(' ')
        edits = []
        for l in lines[1:]:
            if not l.startswith('A '):
                continue
            p = l[2:].split('|||')
            s, e = map(int, p[0].split())
            typ, cor, ann = p[1], p[2], p[-1].strip()
            if ann != '0' or typ == 'noop' or s < 0:
                continue
            if cor == '-NONE-':
                cor = ''
            edits.append((s, e, cor))
        new = list(toks)
        for s, e, cor in sorted(edits, key=lambda x: (-x[0], -x[1])):
            new[s:e] = cor.split(' ') if cor else []
        out.append((joiner.join(toks), joiner.join(t for t in new if t != '')))
    return out

def detok(s):
    s = re.sub(r' ([.,;:!?)\]»])', r'\1', s)
    s = re.sub(r'([(\[«]) ', r'\1', s)
    s = re.sub(r"(\w') (?=\w)", r'\1', s)
    return s

def sent_split(t):
    return [x for x in re.split(r'(?<=[.!?؟])\s+', clean(t)) if x]

def select(pairs, extra=lambda s, r: True):
    elig = []
    for s, r in pairs:
        s, r = clean(s), clean(r)
        if s != r and 20 <= len(s) <= 300 and r and extra(s, r):
            elig.append((s, r))
    n = len(elig)
    idx = [(i * n) // N for i in range(N)] if n >= N else list(range(n))
    return [elig[i] for i in idx], n

def write(lang, pairs, total, **kw):
    sel, n = select(pairs, **kw)
    with open(os.path.join(OUT, f'{lang}.jsonl'), 'w', encoding='utf-8') as f:
        for s, r in sel:
            f.write(json.dumps({'src': s, 'ref': r}, ensure_ascii=False) + '\n')
    stats[lang] = (total, n, len(sel))

# de: Falko-MERLIN test (HF mirror culverscruple/falko_merlin_wiki test_combined.jsonl)
p = [(j['src'], j['tgt']) for j in map(json.loads, open(f'{R}/fmw_test.jsonl', encoding='utf-8'))]
write('de', p, len(p))

# it: MERLIN Italian, TH1 (aseifert/merlin italian.jsonl), detokenized identically on both sides
p = [(detok(j['original']), detok(j['corrected'])) for j in map(json.loads, open(f'{R}/aseifert_italian.jsonl', encoding='utf-8'))]
write('it', p, len(p))

# fr: WiCoPaCo sentence-level (datasets-CNRS/wicopaco_phrases train.csv)
d = pd.read_csv(f'{R}/wicopaco_phrases.csv')
tot_fr = len(d)
d = d[d['before'].str.len().between(20, 300) & (d['before'] != d['after'])]
p = list(zip(d['before'], d['after']))
write('fr', p, len(p))

# es: COWS-L2H famous.F17.csv, essay vs corrected1, sentence-aligned when counts match
d = pd.read_csv(f'{R}/cows_famous_F17.csv')
p = []
for e, c in zip(d['essay'], d['corrected1']):
    if isinstance(e, str) and isinstance(c, str):
        a, b = sent_split(e), sent_split(c)
        if len(a) == len(b):
            p += list(zip(a, b))
write('es', p, len(p))

# pt: Penteado & Perez 2023 dataset (arXiv source), all 4 categories
p = []
for fn in ['grammar.csv', 'spelling.csv', 'fast_typing.csv', 'internet.csv']:
    d = pd.read_csv(f'{R}/ptsrc/dataset/{fn}')
    p += list(zip(d['incorrect'], d['correct']))
write('pt', p, len(p))

# ru: LORuGEC test m2, detokenized
p = [(detok(s), detok(r)) for s, r in m2_pairs(f'{R}/lorugec_test.m2')]
write('ru', p, len(p))

# zh: NLPCC 2018 test gold.01, annotator 0, tokens joined without spaces
p = m2_pairs(f'{R}/nlpcc_gold.01', joiner='')
write('zh', p, len(p))

# ja: JWTD v2 test.jsonl
p = [(j['pre_text'], j['post_text']) for j in map(json.loads, open(f'{R}/jwtd/jwtd/test.jsonl', encoding='utf-8'))]
write('ja', p, len(p))

# ar: ZAEBUC test raw vs cor (paragraph-aligned), sentence-aligned when counts match
# ZAEBUC test docs (test.sent.ids), sentences cut from the official word alignment
# (AR-all.alignment-FINAL.tsv) wherever the raw token ends with . ! ? or Arabic ?
ids = [l.strip() for l in open(f'{R}/zaebuc_test.ids', encoding='utf-8') if l.strip()]
rows = {}
with open(f'{R}/zaebuc_align.tsv', encoding='utf-8') as f:
    next(f)
    for line in f:
        c = line.rstrip('\n').split('\t')
        c += [''] * (4 - len(c))
        rows.setdefault(c[0], []).append((c[1], c[2]))
p = []
for doc in ids:
    rs, cs = [], []
    for rw, cw in rows.get(doc, []):
        if rw: rs.append(rw)
        if cw: cs.append(cw)
        if rw and re.search(r'[.!?؟]$', rw):
            p.append((' '.join(rs), ' '.join(cs))); rs, cs = [], []
    if rs:
        p.append((' '.join(rs), ' '.join(cs)))
write('ar', p, len(p))

# hi: Hi-GEC (HiWikiEdits) test.src/test.tgt
a = open(f'{R}/hi_test.src', encoding='utf-8').read().splitlines()
b = open(f'{R}/hi_test.tgt', encoding='utf-8').read().splitlines()
p = list(zip(a, b))
write('hi', p, len(p))

# tr: GECTurk manually annotated movie reviews (m2), annotator 0; skip lines with '&' markup
p = m2_pairs(f'{R}/tr_movie.bin')
write('tr', p, len(p), extra=lambda s, r: '&' not in s)

for k, v in stats.items():
    print(k, 'pairs=%d eligible=%d written=%d' % v)
