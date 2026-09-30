# AI Detector evaluation (30/09): Binoculars (Hans et al., ICML 2024, code BSD-3-Clause, github.com/ahans30/Binoculars)
# with small MULTILINGUAL open model pairs, run locally on CPU on the same corpus.
# score = log-perplexity of the text under the performer / cross-perplexity between observer and performer
# (exactly the reference implementation: ppl from the performer's logits, x-ppl = cross-entropy of the observer's
# next-token distribution against the performer's log-probabilities). LOWER score = more likely AI.
# Also stores the observer's plain log-perplexity and Fast-DetectGPT's analytic criterion for each model (fd_obs, fd_perf).
# Usage: python scripts/ai-detector/eval-binoculars.py <name> <observer repo> <performer repo> [max_tokens]
import json, pathlib, sys, time
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

HERE = pathlib.Path(__file__).parent
torch.set_num_threads(8)

def corpus():
    rows = []
    for f in sorted((HERE / 'corpus').glob('*.json')):
        rows += json.loads(f.read_text(encoding='utf-8'))
    return rows

def fast_detect(logits, target):
    # Fast-DetectGPT (Bao et al., ICLR 2024, MIT), analytic form with the same model for sampling and scoring:
    # (sum log p(x_t) - sum E[log p]) / sqrt(sum Var[log p]). HIGHER = more likely AI.
    lp = torch.log_softmax(logits, -1); p = lp.exp()
    ll = lp.gather(-1, target[:, None])[:, 0]
    mean = (p * lp).sum(-1); var = (p * lp * lp).sum(-1) - mean * mean
    return ((ll.sum() - mean.sum()) / var.sum().sqrt()).item()

def main(name, obs_id, perf_id, max_tokens=512):
    tok = AutoTokenizer.from_pretrained(obs_id)
    obs = AutoModelForCausalLM.from_pretrained(obs_id, torch_dtype=torch.float32).eval()
    perf = AutoModelForCausalLM.from_pretrained(perf_id, torch_dtype=torch.float32).eval()
    out_file = HERE / 'results' / f'{name}.json'
    out = json.loads(out_file.read_text(encoding='utf-8')) if out_file.exists() else {}
    t0 = time.time()
    for r in corpus():
        if r['id'] in out: continue
        ids = tok(r['text'], return_tensors='pt', truncation=True, max_length=max_tokens)['input_ids']
        with torch.no_grad():
            lo = obs(ids).logits[0, :-1].float()
            lp = perf(ids).logits[0, :-1].float()
        target = ids[0, 1:]
        ppl = torch.nn.functional.cross_entropy(lp, target).item()              # performer log-perplexity
        obs_ppl = torch.nn.functional.cross_entropy(lo, target).item()          # observer log-perplexity
        x_ppl = (-(torch.softmax(lo, -1) * torch.log_softmax(lp, -1)).sum(-1)).mean().item()
        fd = {k: fast_detect(l, target) for k, l in (('fd_obs', lo), ('fd_perf', lp))}
        out[r['id']] = {'kind': r['kind'], 'lang': r['lang'], 'genre': r['genre'], 'model': r.get('model'),
                        'bino': ppl / x_ppl, 'ppl': ppl, 'obs_ppl': obs_ppl, 'x_ppl': x_ppl, **fd, 'tokens': int(ids.shape[1])}
        out_file.parent.mkdir(exist_ok=True)
        out_file.write_text(json.dumps(out, indent=1), encoding='utf-8')
    print(f'{name}: {len(out)} texts, {time.time()-t0:.0f}s')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 512)
