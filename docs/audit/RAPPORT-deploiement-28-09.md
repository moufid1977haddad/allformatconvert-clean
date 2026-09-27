# RAPPORT — Déploiement de la nuit et décisions du 28/09

**Session :** propriétaire présent. **Branche de travail :** `licence-ameliorations`. **Production :** `master` passé de `4d8ed7ff` à `77a47594` (fusion sans push forcé). **Balise de restauration :** `restauration-avant-deploiement-28-09` → `4d8ed7ff` (poussée).

*(rapport complété au fil des étapes — version finale en fin de session)*

## 0. Documents lus, feuille versée

`claude/plan-de-travail.md`, `docs/audit/RAPPORT-nuit-27-09.md`, `claude/tests-manuels-proprietaire.md` lus ; la feuille du bloquant 11 est commitée sur `licence-ameliorations` (`a5fdc576`).

## 1. Déploiement — ✅ en production, vérifié sur www sous les trois moteurs

**Préversion** `onlineconvertools-quv60g2rk` = commit `7d55c8bb` (tête de `deploiement-nuit-28-09`), ouverte par un relais local (`vercel-preview-proxy.mjs`, jeton de `vercel env run` dans un dossier temporaire ne contenant que `.vercel/project.json` — jamais affiché, aucun fichier d'environnement lu). **Toutes les suites de la nuit** relancées dessus, puis **les mêmes sur www** après la fusion :

| Suite | Préversion | www (production) |
|---|---|---|
| Chargement des **238 pages** (accueil, 12 catégories, 225 outils) | Chromium 238/238, Firefox 238/238, WebKit 238/238 ¹ | **Chromium, Firefox, WebKit : 238/238 propres** |
| Grammar Fixer mot à mot (IA jouée) | 11/11 · 10/10 | 11/11 · 10/10 |
| Audio / Video Metadata (ffprobe) | 9/9 ×3 moteurs | 9/9 ×3 |
| Décodage de secours (Waveform, Equalizer) | 4/4 ×2 | 4/4 ×2 |
| Formats illisibles (Media Player, Screenshot) | 4 · 4 · 3 | 4 · 4 · 3 |
| Audio Trimmer sans aperçu | 12/12 ×3 | 12/12 ×3 |
| Video Trimmer sans aperçu | 6/6 ×3 | 6/6 ×3 |
| Video Trimmer coupe précise | 2/2 ×2 | 2/2 ×2 |
| 4 outils MediaRecorder + Screen Recorder | 42/42 Chromium · Firefox 36/37 puis 12/12 ×2 ² | 42/42 · 42/42 |
| Service joué (Compressor, Converter, GIF, Upscaler) | 11/11 ×3 | 11/11 ×3 |
| Opus par le service (joué) | 8/8 ×2 | 8/8 ×2 |
| Amélioration 17 | 20 · 18 · 17 | 20 · 18 · 17 |
| Vague 1 | 12/12 ×2 | 12/12 ×2 |
| Image Resizer | 2/2 ×3 | 2/2 ×3 |
| Zip Extractor | 21 · 20 ³ · 20 | 21 · 20 · 20 |
| ZIP en flux > 1,9 Go (2,2 Go, octets identiques) | Firefox 6/6, WebKit 6/6 | 6/6 · 6/6 |
| Coupes et jonctions (mesures) | identiques à la nuit | identiques (Splitter 0 ms WAV/MP3/FLAC/OGG, M4A +17 ms) |
| WebKit, reste de la feuille Safari | 6/6 | 6/6 |

¹ **WebKit sur préversion : 238 pages en erreur au premier passage** — `TypeError … navigator.storage.persisted`. Cause établie : **la barre de commentaires que Vercel injecte sur les préversions** (`vercel.live/_next-live/feedback/feedback.html`, pile d'appel relevée) ; bloquée (option `--no-vercel-toolbar` ajoutée à `all-pages-load.mjs`, qui ne bloque que `vercel.live`), **238/238 propres** ; absente de www, où WebKit est propre sans aucun filtrage. **Cela tranche aussi l'erreur non identifiée du 22/09** (bloquant 9) : elle ne vient pas du site.
² Video Resizer sous Firefox : un échec (« produced a file ») au premier passage, sous forte charge (deux files de suites en parallèle) ; **12/12 deux fois de suite** en relance seule, 42/42 sur www.
³ Zip Extractor sous Firefox : dépassement de délai au premier passage sous la même charge ; **20/20** en relance seule, 20/20 sur www.

Rien n'a échoué deux fois ; **aucun point retiré du lot.** Seul changement de la branche avant fusion : un commit de test (`98abfeeb`, `MOCK_SERVICE_URL` pour jouer le service sur une préversion déployée), sans effet sur le site.

**Fusion :** `deploiement-nuit-28-09` → `master` en `77a47594` (`--no-ff`, sans push forcé) ; `lib/ai` et `app/api/ai` identiques à `4d8ed7ff` (le correcteur de grammaire reste celui de la production). Déploiement de production `onlineconvertools-3x4zzpire`, **READY à 17:03 UTC**. **Retour arrière :** `git revert -m 1 77a47594` (ou la balise).

## 2. Limite du service média — ✅ 40/h appliquée, vérifiée sur www

`MEDIA_JOBS_PER_HOUR_PER_IP` : **20 → 40**, une seule variable Vercel (type « plain », cibles Production + Preview), modifiée par l'API Vercel (valeur de limite seulement, aucune autre valeur affichée). `MEDIA_JOBS_PER_DAY_PER_IP` **inchangée : 60**. La valeur est entrée en production avec le déploiement de `77a47594`.
**Preuve sur www (17:06 UTC) :** 40 billets `POST /api/media/ticket` accordés dans l'heure, **le 41ᵉ refusé** (429, « Too many conversions from your connection this hour », `Retry-After` 3201 s). Effet de bord assumé : ces 40 billets comptent aussi dans les 60 du jour pour ma connexion (jusqu'à minuit UTC) ; aucun travail n'a été lancé avec (billets inutilisés, expirés seuls).

## 5. Branche distante `origin/worktree-quota-spend-infra` — ✅ supprimée

Sa pointe `f3acb3b5` (30/08, « docs: disclose usage-metrics collection… ») est **un ancêtre de master** : 0 commit hors de master (`git rev-list origin/master..` vide). Supprimée (`git push origin --delete`), vérifiée absente. Restauration possible : `git push origin f3acb3b5:refs/heads/worktree-quota-spend-infra`.
