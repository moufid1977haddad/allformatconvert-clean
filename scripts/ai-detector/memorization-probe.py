# Cause of the RAIDAR false positive (30/09): is the 2016 LIGO abstract memorised by language models?
# Probe (the "extractable memorisation" test of Carlini et al., 2021/2023): give a model the first 50 tokens of the
# text, let it continue greedily for 50 tokens, and count how many of them are exactly the real next tokens.
# A text never seen gives a few percent; a memorised one gives a long exact run. Open model Qwen2.5-1.5B
# (Apache-2.0), local CPU, no cost; gpt-4o-mini's own memory cannot be probed without the key.
import json, pathlib, sys, torch
from transformers import AutoTokenizer, AutoModelForCausalLM
torch.set_num_threads(8)
HERE = pathlib.Path(__file__).parent
rid = sys.argv[1] if len(sys.argv) > 1 else 'Qwen/Qwen2.5-1.5B'
tok = AutoTokenizer.from_pretrained(rid); m = AutoModelForCausalLM.from_pretrained(rid, torch_dtype=torch.float32).eval()
rows = {x['id']: x for f in (HERE / 'corpus').glob('*.json') for x in json.loads(f.read_text(encoding='utf-8'))}
ids_ = [k for k in rows if k.startswith('h-arxiv')] + ['h-wiki-en-photosynthesis', 'h-wiki-en-glacier', 'h-gut-768', 'h-news-en-100-icebergs-heading-for-new-zealand', 'ai-gpt4omini-4', 'ai-opus-4']
out = {}
for k in ids_:
    ids = tok(rows[k]['text'], return_tensors='pt')['input_ids'][0]
    P, N = 50, 50
    with torch.no_grad():
        g = m.generate(ids[None, :P], max_new_tokens=N, do_sample=False)[0, P:]
    truth = ids[P:P + N]
    n = min(len(g), len(truth)); same = int((g[:n] == truth[:n]).sum()); run = 0
    while run < n and g[run] == truth[run]: run += 1
    out[k] = {'exact_tokens': same, 'of': n, 'first_exact_run': run}
    print(f'{k:48} exact {same:2}/{n}  first exact run {run}')
(HERE / 'results' / 'memorization-probe.json').write_text(json.dumps({'model': rid, 'rows': out}, indent=1), encoding='utf-8')
