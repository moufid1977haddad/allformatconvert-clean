# AI Detector corpus (30/09): HUMAN texts, all public and written before 2022, several languages and registers.
# - Wikipedia / Wikinews: the revision in force on 2020-12-31 (or 2021-06-30 for Wikinews), lead paragraphs.
#   CC BY-SA 4.0 / CC BY 2.5 -- attribution kept in the output (source URL with oldid).
# - Project Gutenberg: public-domain books, a passage from the middle of the book (famous openings are memorised by
#   language models, which is a different test).
# - arXiv abstracts 2016-2021 (metadata CC0).
# No personal data: topics are science, places, objects and history; no biography of a living person.
# Output: scripts/ai-detector/corpus/human.json  [{id, lang, kind:'human', genre, source, date, text}]
import json, re, html, urllib.request, urllib.parse, pathlib, sys, time

OUT = pathlib.Path(__file__).parent / 'corpus' / 'human.json'
UA = {'User-Agent': 'onlineconvertools-research/1.0 (AI detector evaluation corpus)'}

def get(url, tries=5):
    time.sleep(1.5)  # Wikimedia answers 429 to fast clients
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read().decode('utf-8')
        except Exception as e:
            if i == tries - 1: raise
            time.sleep(15 * (i + 1))

def clip(text, lo=130, hi=230):
    """Whole sentences, between lo and hi words."""
    text = re.sub(r'\s+', ' ', text).strip()
    sents = re.split(r'(?<=[.!?»])\s+(?=[A-ZÀ-ÖØ-Þ«"“¿¡])', text)
    out, n = [], 0
    for s in sents:
        w = len(s.split())
        if n + w > hi and n >= lo: break
        out.append(s); n += w
        if n >= lo and n + w > hi: break
    return ' '.join(out)

def wiki(lang, title, before='2020-12-31T00:00:00Z', site='wikipedia'):
    api = f'https://{lang}.{site}.org/w/api.php'
    q = json.loads(get(api + '?' + urllib.parse.urlencode({'action': 'query', 'prop': 'revisions', 'titles': title, 'rvstart': before,
        'rvlimit': 1, 'rvprop': 'ids|timestamp', 'format': 'json', 'redirects': 1})))
    page = next(iter(q['query']['pages'].values()))
    rev = page['revisions'][0]
    p = json.loads(get(api + '?' + urllib.parse.urlencode({'action': 'parse', 'oldid': rev['revid'], 'prop': 'text', 'format': 'json', 'disablelimitreport': 1})))
    h = p['parse']['text']['*']
    h = re.split(r'<h2', h)[0]  # lead section only
    paras = re.findall(r'<p>(.*?)</p>', h, flags=re.S)
    txt = ' '.join(paras)
    txt = re.sub(r'<sup.*?</sup>', '', txt, flags=re.S)
    txt = re.sub(r'<style.*?</style>', '', txt, flags=re.S)
    txt = re.sub(r'<span class="(?:noprint|mw-ref)[^"]*".*?</span>', '', txt, flags=re.S)
    txt = html.unescape(re.sub(r'<[^>]+>', '', txt))
    txt = re.sub(r'\[\d+\]|\[[a-z]\]|\[note \d+\]', '', txt)
    txt = re.sub(r'\s*\([^()]*(?:pronunciation|listen|écouter|IPA|API)[^()]*\)', '', txt)
    return clip(txt), f'https://{lang}.{site}.org/w/index.php?oldid={rev["revid"]}', rev['timestamp'][:10]

def gutenberg(num, frac):
    t = get(f'https://www.gutenberg.org/cache/epub/{num}/pg{num}.txt').replace('\r', '')
    title = re.search(r'Title:\s*(.+)', t); lang = re.search(r'Language:\s*(.+)', t)
    s = t.find('*** START'); e = t.find('*** END')
    body = t[t.find('\n', s) + 1:e]
    pos = int(len(body) * frac)
    # start at the next paragraph of real prose (at least 60 words, not a chapter heading)
    paras = [p for p in body[pos:].split('\n\n')]
    buf = []
    for p in paras:
        p = ' '.join(p.split())
        if len(p.split()) < 25 or p.isupper():
            if buf: break
            continue
        p = p.replace('_', '')
        buf.append(p)
        if sum(len(x.split()) for x in buf) >= 160: break
    return clip(' '.join(buf)), f'https://www.gutenberg.org/ebooks/{num}', (title.group(1).strip() if title else '?') + ' / ' + (lang.group(1).strip() if lang else '?')

def arxiv(aid):
    x = get('http://export.arxiv.org/api/query?id_list=' + aid)
    entry = x.split('<entry>')[1]
    summ = re.search(r'<summary>(.*?)</summary>', entry, re.S).group(1)
    pub = re.search(r'<published>(.*?)</published>', entry).group(1)[:10]
    return clip(html.unescape(summ), 100, 260), f'https://arxiv.org/abs/{aid}', pub

WIKI = {
    'en': ['Glacier', 'Photosynthesis', 'Bicycle', 'Chess', 'Printing press', 'Honey bee', 'Lighthouse', 'Coral reef'],
    'fr': ['Volcan', 'Boulangerie', 'Cathédrale Notre-Dame de Chartres', 'Marée', 'Fromage', 'Canal du Midi', 'Lavande', 'Pont du Gard'],
    'de': ['Gletscher', 'Buchdruck', 'Schwarzwald', 'Fahrrad', 'Rhein', 'Brot'],
    'es': ['Volcán', 'Imprenta', 'Café', 'Río Amazonas', 'Paella'],
    'it': ['Vulcano', 'Stampa a caratteri mobili', 'Olio di oliva', 'Pizza', 'Colosseo'],
}
SKIP = {'Schwarzwald', 'Stampa a caratteri mobili', 'Boulangerie', 'Brot'}  # lead under 80 words on 2020-12-31
# Less-known human texts (added after the first measurements: famous Wikipedia leads and classics are memorised by
# language models, which makes perplexity-based detectors call them AI): Wikinews articles, little-read books.
WIKINEWS = {
    'en': ['100 icebergs heading for New Zealand', 'Amazon deforestation accelerating', 'Arctic ice cap shrank sharply this summer',
           'Annual Perseids meteor shower visible in northern hemisphere', 'Around 7,100 cheetahs remain, say experts'],
    'fr': ['Afrique : déclin du lac Tchad', "Algérie : des milliers d'oiseaux migrateurs recensés dans les Aurès",
           'Aoste : la gestion des déchets coûte de plus en plus cher', 'Chine : Pékin en alerte rouge pollution', 'Compostage pour Montréal'],
}
GUT = [(52520, 0.4), (16901, 0.4), (13704, 0.5), (60183, 0.4), (51804, 0.5), (62000, 0.5),
       (1260, 0.45), (768, 0.5), (98, 0.4), (17989, 0.45), (4791, 0.3), (22367, 0.5), (2000, 0.45), (45334, 0.45), (5021, 0.6)]
ARXIV = ['1602.03837', '2010.11929', '1912.01703', '2106.09685', '1905.11946']

def main():
    rows = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else []  # incremental: keep what is already fetched
    have = {r['id'] for r in rows}
    for lang, titles in WIKI.items():
        for t in titles:
            if f'h-wiki-{lang}-{re.sub(r"[^a-z0-9]+", "-", t.lower())}' in have or t in SKIP: continue
            try:
                text, src, date = wiki(lang, t)
                rows.append({'id': f'h-wiki-{lang}-{re.sub(r"[^a-z0-9]+", "-", t.lower())}', 'lang': lang, 'kind': 'human', 'genre': 'encyclopedia',
                             'source': src, 'date': date, 'license': 'CC BY-SA (Wikipedia contributors)', 'text': text})
                print('ok', lang, t, len(text.split()), date, file=sys.stderr)
            except Exception as e:
                print('FAIL wiki', lang, t, e, file=sys.stderr)
    for lang, titles in WIKINEWS.items():
        for t in titles:
            rid = f'h-news-{lang}-{re.sub(r"[^a-z0-9]+", "-", t.lower())[:40]}'
            if rid in have: continue
            try:
                text, src, date = wiki(lang, t, before='2021-12-31T00:00:00Z', site='wikinews')
                text = re.sub(r'^\w+day, \w+ \d+, \d{4}\s*', '', text)
                text = re.sub(r'^\w+ \d+ \w+ \d{4}\.?\s*', '', text)
                if len(text.split()) < 80: print('SHORT news', lang, t, len(text.split()), file=sys.stderr); continue
                rows.append({'id': rid, 'lang': lang, 'kind': 'human', 'genre': 'news', 'source': src, 'date': date,
                             'license': 'CC BY 2.5 (Wikinews contributors)', 'text': text})
                print('ok news', lang, t, len(text.split()), date, file=sys.stderr)
            except Exception as e:
                print('FAIL news', lang, t, e, file=sys.stderr)
    for num, frac in GUT:
        if f'h-gut-{num}' in have: continue
        try:
            for f in (frac, frac + 0.07, frac + 0.14, frac + 0.21):  # dialogue-heavy spots give short passages
                text, src, meta = gutenberg(num, f)
                if len(text.split()) >= 80: break
            if len(text.split()) < 80: print('SHORT gut', num, file=sys.stderr); continue
            lang = {'English': 'en', 'French': 'fr', 'German': 'de', 'Spanish': 'es', 'Italian': 'it'}.get(meta.split(' / ')[-1], meta.split(' / ')[-1])
            rows.append({'id': f'h-gut-{num}', 'lang': lang, 'kind': 'human', 'genre': 'fiction' if num not in (52520,) else 'essay', 'source': src, 'date': 'public domain',
                         'license': 'public domain (Project Gutenberg)', 'title': meta, 'text': text})
            print('ok gut', num, meta, len(text.split()), file=sys.stderr)
        except Exception as e:
            print('FAIL gut', num, e, file=sys.stderr)
    for aid in ARXIV:
        if f'h-arxiv-{aid}' in have: continue
        try:
            text, src, date = arxiv(aid)
            rows.append({'id': f'h-arxiv-{aid}', 'lang': 'en', 'kind': 'human', 'genre': 'abstract', 'source': src, 'date': date,
                         'license': 'arXiv metadata CC0', 'text': text})
            print('ok arxiv', aid, len(text.split()), date, file=sys.stderr)
        except Exception as e:
            print('FAIL arxiv', aid, e, file=sys.stderr)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
    print(len(rows), 'human texts ->', OUT)

if __name__ == '__main__':
    main()
