# RAPPORT — Amélioration 13 : correcteur de grammaire (grammar-fixer), changements visibles

**Date :** 26 septembre 2026 · **Branche :** `licence-ameliorations` · **État :** **prête pour la préversion** (local, Chromium + Firefox). Non déployée (consigne d'absence du propriétaire).

## 0. En une table

| Point | Verdict | Preuve |
|---|---|---|
| Écart relevé le 23/09 : « pas de surlignage » | ❌→✅ chaque changement montré **en place, mot à mot** (supprimé barré en rouge, ajouté souligné en vert) | §2 |
| Moyen de la référence (LanguageTool : une carte par correction, acceptée une à une) | ✅ **adopté** : chaque changement se défait ou se rétablit d'un clic ; « Keep all » / « Undo all » ; le texte à copier suit les choix | §2 |
| Exactitude du diff | ✅ tout garder = **la correction à l'octet près** ; tout défaire = **le texte d'origine à l'octet près** — 2000 paires aléatoires + accents, emoji, retours à la ligne, doubles espaces | §3 |
| Suites | ✅ `grammar-fixer-diff.mjs` : **Chromium 11/11, Firefox 10/10** (Copier vérifié sous Chromium seulement) | §3 |
| Correction elle-même face à la référence | ⚠️ **non mesurée** : l'IA n'est pas appelée en local (clé et quotas côté serveur, fichiers d'environnement interdits, compteurs Supabase à ne pas toucher) | §4 |

## 1. Les références (26/09)

- **LanguageTool** (languagetool.org, piloté avec Playwright) : erreurs soulignées dans le texte, une carte par erreur (« Their — Possible typo »), acceptée une à une. Sur la phrase d'essai *« Their is many reason why peoples goes to school. She dont like it and he have went home yesterday. »* elle en signale **3** (Their, dont, went) et laisse passer « is many reason », « peoples goes ».
- **QuillBot** : derrière un contrôle Cloudflare pour un navigateur automatisé — non contourné, non mesuré.

## 2. Ce qui a été fait

- `app/tools/ai-tools/grammar-fixer/diff.js` : découpage en mots (apostrophes internes gardées : *don't*, *l’eau*), espaces et ponctuation ; diff de Myers O(ND) ; changements voisins séparés d'un seul espace regroupés (« have went » → « went » = un changement) ; au-delà de 1000 éditions, le texte est traité comme réécrit (un seul changement).
- Page : compteur (« 6 changes — 5 kept, 1 undone »), texte annoté cliquable, « Keep all » / « Undo all », résultat et Copier qui suivent les choix. Textes de la page mis à jour.

## 3. Tests

- Propriété (Node, 2000 paires aléatoires avec insertions/suppressions/remplacements, emoji et accents) : **0 échec** d'aller-retour ; 7650 caractères et 170 corrections : 16 ms ; réécriture complète de 3200 mots : 26 ms.
- `scripts/browser-tests/grammar-fixer-diff.mjs` — vraie page, **réponse de l'IA jouée par le test** (`/api/ai` intercepté) : les 6 changements de la phrase d'essai exactement (« Their is>There are | reason>reasons | peoples goes>people go | dont>doesn't | >, | have > »), un changement défait puis rétabli, tout défaire/tout garder, accents + emoji + lignes, aucun changement, réécriture de 400 mots (107-170 ms), Copier. **Chromium 11/11, Firefox 10/10.**

## 4. Non fait / à décider

- La qualité de la correction (ce que l'IA corrige) n'est pas mesurée face à LanguageTool : il faudrait appeler l'IA réelle, en préversion ou en production.
- Pas de motif par changement (« Possible typo ») : l'IA renvoie un texte, pas des diagnostics ; le demander changerait l'instruction côté serveur et le coût — à décider.
