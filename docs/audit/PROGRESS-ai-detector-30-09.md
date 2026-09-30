# PROGRESS — AI Detector 30/09 (brouillon de travail, repris dans RAPPORT-ai-detector-30-09.md)

## Recherche concurrents (lue en direct le 29/09 au soir, UTC)

| Concurrent | Moyen | Précision indépendante | Français | API / compte | Prix API (≈ 300 mots) |
|---|---|---|---|---|---|
| Pangram | classifieur transformeur entraîné (« hard negative mining with synthetic mirrors », arXiv 2402.14873) ; Pangram 4 le 29/07/2026 | Chicago Booth/NBER w34223 (2025) : faux positifs ≈ 0, faux négatifs 2-4 %, seul sous FPR ≤ 0,005 ; tâche partagée COLING 2025 (RAID) 99,3 % | oui (20+ langues) | compte + clé `x-api-key` ; `POST https://text.external-api.pangram.com/task` puis `GET /task/{id}` (lu sur docs.pangram.com) | 0,05 $ / 100 mots (page Developers relue) → 0,15 $ ; lot −20 % |
| GPTZero | classifieur profond de bout en bout (depuis 2023), au départ perplexité + burstiness | RAID (ACL 2024) : 66,5 % à 5 % FPR ; Booth : FP < 1 %, FN 0-2 % ; Perkins 2024 : ≈ 26 % | oui | compte + clé ; API au plan Professional (≈ 25-46 $/mois, 500 k mots, source tierce) | ≈ 0,015 $ dans le quota |
| Originality.ai | transformeur propre type ELECTRA, 160 Go | RAID : 85,0 % à 5 % FPR, FPR plancher 0,62 % ; Booth : FN 10-40 % | oui (revendiqué, FP 0,70 %) | API au plan Enterprise seulement (179 $/mois) | 0,036 $ à plein usage ; 179 $ minimum |
| Copyleaks | propriétaire (« AI Detector V9 ») | Perkins 2024 : 64,8 % (meilleur du lot) ; pas dans RAID | probable, non vérifié | compte + clé, plans payants (page prix 403) | ≈ 0,013 $ (source tierce) |
| ZeroGPT | « DeepAnalyse », décrit comme perplexité + burstiness | RAID : 65,5 % à 5 % FPR, **FPR plancher 16,9 %** | non vérifié | compte + clé + liste d'IP, prépayé | non publié |
| Sapling | transformeur par jeton, modèle 20260820 | pas d'étude indépendante sérieuse (≈ 17 % FP, source faible) | **non (anglais seulement)** | compte + clé (essai 50 k caractères/jour) | 0,005 $ / 1 000 caractères → 0,009 $ |

Aucun des six n'offre d'API sans compte → **aucun concurrent mesuré par API** (règle : pas de compte créé).

## Recherche moyens gratuits (poids ouverts)
- Classifieurs MIT/Apache : Oxidane/tmr-ai-text-detector (RAID TPR@1 % 90 % auto-déclaré, ONNX 126 Mo), desklib/ai-text-detector-v1.01, fakespot-ai/roberta-base — tous entraînés en anglais.
- Zéro-coup : Binoculars (BSD-3), Fast-DetectGPT (MIT), binoculars-eu (Linagora, Apache-2.0, profil français Luciole-1B : AUROC 0,959, TPR@1 % 0,48).
- Non commerciaux (exclus, interdit n° 14) : EditLens/Open Pangram (CC BY-NC-SA), RADAR, SuperAnnotate (licence propriétaire), Anvil-ML détecteur français (CC BY-NC-SA).

## Corpus
42 humains (Wikipédia révision du 31/12/2020, Gutenberg, arXiv 2016-2021 ; en 17, fr 9, es 6, de 5, it 5) · 40 IA (claude-opus-5-5, claude-sonnet-5, claude-haiku-4-5, claude-fable-5-1, gpt-4o-mini ; 8 consignes chacun ; en 20, fr 15, de 2, it 2, es 1).
