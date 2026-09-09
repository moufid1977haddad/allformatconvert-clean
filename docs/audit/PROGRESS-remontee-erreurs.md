# PROGRESS — Remontée automatique des échecs

Suivi de reprise pour ce chantier. Mis à jour et commité après chaque lot. Plan complet : `docs/superpowers/plans/2026-09-08-error-reporting.md`. Branche : `feat/error-reporting`.

## Fait et prouvé

| Élément | Fichier(s) | Preuve |
|---|---|---|
| Table Supabase `tool_errors` (migration écrite, PAS ENCORE appliquée en base par l'utilisateur) | `supabase/tool_errors.sql` | Relecture manuelle du SQL — schéma conforme au contrat de champs |
| Constantes de config (rate limit + seuil d'alerte) | `lib/quota/config.js` | `node -e "require('./lib/quota/config.js').TOOL_ERROR_ALERT_THRESHOLD_PER_DAY"` → `10` |
| Rate limiter dédié IP-hash pour la route de collecte | `lib/quota/toolErrorRateLimit.js` | Chargement module OK (env Supabase factices, pas de vraie clé) |
| Module partagé client+serveur (sanitisation, bucketing, parsing navigateur, envoi sendBeacon/fetch) | `app/lib/reportError.js` | `node scripts/error-reporting-tests/01-sanitize.js` → tous les cas passent (filename réel jamais présent dans le message nettoyé, troncature à 300 car., chemins Windows/Unix balayés, entrées non-string ne lèvent jamais) |
| Module serveur d'insertion (`insertToolError`, `buildServerToolError`) | `lib/reportError.js` | Chargement module OK |

## Modifié mais pas encore testé en conditions réelles

- Rien à ce stade — le lot 1 (modules partagés) ne touche encore aucune route ni aucun outil visiteur. Les vérifications ci-dessus sont des vérifications de module isolé (Node), pas des tests bout-en-bout navigateur → route → base.

## Reste à faire

1. **Route de collecte `/api/report-error`** (Tâche 6) — nécessite relecture indépendante obligatoire (route + sanitiseur) avant commit.
2. **Alerte serveur sur les 4 chemins non couverts** (Tâche 7) : pdf-repair, pdf-to-pdfa, convert-html-to-pdf, convert-to-pdf (chemin Gotenberg).
3. **Journalisation `tool_errors` côté serveur** (Tâche 8) sur ces mêmes routes + pdf-to-word.
4. **Instrumentation navigateur** (Tâches 9-13) : 3 outils TIFF, 2 HEIC, 9 ffmpeg.wasm (audio/vidéo), 4 PDF client, 1 ZIP — 19 outils au total.
5. **Agrégation + alerte quotidienne** (Tâche 14) dans le cron `health-check` existant.
6. **Page de confidentialité** (Tâche 15).
7. **Proposition page admin, sans construction** (Tâche 16).
8. **Rapport final, tests manuels, build, commit, push, déploiement, vérification unique** (Tâche 17).

**Action utilisateur en attente** : exécuter `supabase/tool_errors.sql` dans l'éditeur SQL Supabase avant que les tests bout-en-bout (Tâche 6 Step 3 et suivants) ne puissent réellement écrire/lire des lignes.

## Pour reprendre

Si la session s'arrête ici : le prochain lot est la Tâche 6 (route `/api/report-error`), qui dépend uniquement des fichiers déjà commités dans ce lot (`lib/quota/toolErrorRateLimit.js`, `lib/reportError.js`). Rien n'est perdu — reprendre directement à la Tâche 6 du plan.
