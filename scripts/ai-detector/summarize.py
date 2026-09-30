# Summaries of every detector measured on the corpus: AUROC, and for a given decision rule the verdict rate,
# false positives on human texts (human called AI) and AI texts missed or undecided, overall and per language.
# Usage: python scripts/ai-detector/summarize.py <results file> <score field> [ai_at] [human_below]
#   score field: p_ai (higher = AI) or sim (RAIDAR similarity, higher = AI) or -bino (Binoculars score, lower = AI)
import json, sys, pathlib
from collections import defaultdict

def auroc(h, a):
    return sum((x > y) + 0.5 * (x == y) for x in a for y in h) / (len(a) * len(h)) if h and a else float('nan')

def load(path, field):
    rows = json.loads(pathlib.Path(path).read_text(encoding='utf-8'))
    rows = rows.get('rows', rows)
    neg = field.startswith('-'); f = field.lstrip('-')
    return {k: dict(v, s=(-v[f] if neg else v[f])) for k, v in rows.items() if f in v}

def table(rows, ai_at=None, human_below=None):
    groups = defaultdict(list)
    for k, v in rows.items():
        groups['all'].append(v); groups[v['lang']].append(v)
    out = []
    for g in ['all', 'en', 'fr', 'de', 'es', 'it']:
        vs = groups.get(g, [])
        if not vs: continue
        h = [v['s'] for v in vs if v['kind'] == 'human']; a = [v['s'] for v in vs if v['kind'] == 'ai']
        line = f'{g:4} n={len(h):2}H/{len(a):2}A  AUROC {auroc(h, a):.3f}'
        if ai_at is not None:
            hb = human_below if human_below is not None else ai_at
            fp = sum(s >= ai_at for s in h); tn = sum(s < hb for s in h)
            tp = sum(s >= ai_at for s in a); fn = sum(s < hb for s in a)
            line += f' | human: {tn} right, {fp} called AI, {len(h)-tn-fp} undecided | AI: {tp} right, {fn} called human, {len(a)-tp-fn} undecided'
        out.append(line)
    return '\n'.join(out)

if __name__ == '__main__':
    rows = load(sys.argv[1], sys.argv[2])
    ai_at = float(sys.argv[3]) if len(sys.argv) > 3 else None
    hb = float(sys.argv[4]) if len(sys.argv) > 4 else None
    print(table(rows, ai_at, hb))
    h = sorted((v['s'], k) for k, v in rows.items() if v['kind'] == 'human')
    a = sorted((v['s'], k) for k, v in rows.items() if v['kind'] == 'ai')
    hmax = h[-1][0]
    print(f'zero-false-positive threshold (> highest human {hmax:.3f}): AI caught {sum(s > hmax for s, _ in a)}/{len(a)}')
    bygenre = defaultdict(list)
    for k, v in rows.items(): bygenre[(v['kind'], v['genre'])].append(v['s'])
    print('mean score by kind/genre:', {f'{k[0]}/{k[1]}': round(sum(x)/len(x), 3) for k, x in sorted(bygenre.items())})
    print('highest human:', [(round(s, 3), k) for s, k in h[-5:]])
    print('lowest AI:    ', [(round(s, 3), k) for s, k in a[:5]])
