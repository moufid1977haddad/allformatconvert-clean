# AI Detector evaluation (30/09): open-weight trained classifiers, run locally on CPU on the same corpus.
# Candidates from the research of 30/09 (licence checked on the model card: MIT / Apache-2.0, commercial use allowed):
#   Oxidane/tmr-ai-text-detector (MIT, roberta-base, trained on RAID; ONNX in onnx-community/tmr-ai-text-detector-ONNX)
#   desklib/ai-text-detector-v1.01 (MIT, deberta-v3-large, RAID leaderboard)
#   fakespot-ai/roberta-base-ai-text-detection-v1 (Apache-2.0, Mozilla/Fakespot)
# Output: results/<name>.json {id: {kind, lang, genre, model, p_ai}}
# Usage: python scripts/ai-detector/eval-classifiers.py [tmr|desklib|fakespot ...]
import json, pathlib, sys, time
import torch, torch.nn as nn
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoConfig, AutoModel, PreTrainedModel

HERE = pathlib.Path(__file__).parent
torch.set_num_threads(8)

def corpus():
    rows = []
    for f in sorted((HERE / 'corpus').glob('*.json')):
        rows += json.loads(f.read_text(encoding='utf-8'))
    return rows

class DesklibAIDetectionModel(PreTrainedModel):  # the model card's own class (mean pooling + one logit)
    config_class = AutoConfig
    def __init__(self, config):
        super().__init__(config)
        self.model = AutoModel.from_config(config)
        self.classifier = nn.Linear(config.hidden_size, 1)
        self.post_init()
    def forward(self, input_ids, attention_mask=None):
        h = self.model(input_ids, attention_mask=attention_mask)[0]
        m = attention_mask.unsqueeze(-1).expand(h.size()).float()
        return self.classifier((h * m).sum(1) / m.sum(1).clamp(min=1e-9))

def load(name):
    if name == 'desklib':
        rid = 'desklib/ai-text-detector-v1.01'
        tok = AutoTokenizer.from_pretrained(rid)
        model = DesklibAIDetectionModel.from_pretrained(rid).eval()
        def score(t):
            enc = tok(t, truncation=True, max_length=768, return_tensors='pt')
            with torch.no_grad():
                return torch.sigmoid(model(enc['input_ids'], enc['attention_mask'])).item()
        return score
    rid = {'tmr': 'Oxidane/tmr-ai-text-detector', 'fakespot': 'fakespot-ai/roberta-base-ai-text-detection-v1'}[name]
    tok = AutoTokenizer.from_pretrained(rid)
    model = AutoModelForSequenceClassification.from_pretrained(rid).eval()
    def score(t):
        enc = tok(t, truncation=True, max_length=512, return_tensors='pt')
        with torch.no_grad():
            return torch.softmax(model(**enc).logits, -1)[0, 1].item()  # label 1 = AI on both cards
    return score

if __name__ == '__main__':
    for name in sys.argv[1:] or ['tmr', 'desklib', 'fakespot']:
        score = load(name)
        out, t0 = {}, time.time()
        for r in corpus():
            out[r['id']] = {'kind': r['kind'], 'lang': r['lang'], 'genre': r['genre'], 'model': r.get('model'), 'p_ai': score(r['text'])}
        (HERE / 'results').mkdir(exist_ok=True)
        (HERE / 'results' / f'{name}.json').write_text(json.dumps(out, indent=1), encoding='utf-8')
        H = sorted(v['p_ai'] for v in out.values() if v['kind'] == 'human'); A = sorted(v['p_ai'] for v in out.values() if v['kind'] == 'ai')
        print(f'{name}: {len(out)} texts in {time.time()-t0:.0f}s | human p_ai max {H[-1]:.3f}, >=0.5: {sum(p>=0.5 for p in H)}/{len(H)} | ai p_ai >=0.5: {sum(p>=0.5 for p in A)}/{len(A)}, min {A[0]:.3f}')
