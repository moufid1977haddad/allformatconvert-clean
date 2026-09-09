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

| Route de collecte publique `/api/report-error` (écrite, relecture indépendante en cours) | `app/api/report-error/route.js` | Relecture par sous-agent indépendant lancée (route + sanitiseur uniquement, comme demandé) — résultat pas encore revenu |
| Alerte serveur sur les 4 chemins jamais couverts par `lib/alert.js` | `app/api/pdf-repair/route.ts`, `app/api/pdf-to-pdfa/route.ts`, `app/api/convert-html-to-pdf/route.ts`, `app/api/convert-to-pdf/route.ts` (chemin `handleGotenberg`) | Réutilise `alertServerError` existant (déjà utilisé ailleurs dans le repo) — pas de nouveau mécanisme |
| Journalisation `tool_errors` côté serveur sur ces 4 chemins + `pdf-to-word` (qui avait déjà `alertServerError` mais pas encore `tool_errors`) | mêmes fichiers + `app/api/pdf-to-word/route.ts` | `npx tsc --noEmit` → 0 erreur sur tout le projet |

## Modifié mais pas encore testé en conditions réelles

- **Route `/api/report-error`** — écrite, pas encore testée en vrai (curl / navigateur) : en attente du retour de la relecture indépendante avant de committer, et de l'application de `supabase/tool_errors.sql` en base par l'utilisateur pour pouvoir vérifier qu'une ligne est réellement insérée.
- **Les 5 routes serveur modifiées** (`pdf-repair`, `pdf-to-pdfa`, `convert-html-to-pdf`, `convert-to-pdf`, `pdf-to-word`) — le typecheck passe, mais aucun appel réel n'a été déclenché (nécessiterait Gotenberg/ConvertAPI/le service pdf-tools configurés, absents en local). Aucun de ces chemins n'a encore été exercé pour de vrai.

## Reste à faire

1. Committer la route de collecte une fois la relecture indépendante close et ses remarques traitées (Tâche 6).
2. **Instrumentation navigateur** (Tâches 9-13) : 3 outils TIFF, 2 HEIC, 9 ffmpeg.wasm (audio/vidéo), 4 PDF client, 1 ZIP — 19 outils au total.
3. **Agrégation + alerte quotidienne** (Tâche 14) dans le cron `health-check` existant.
4. **Page de confidentialité** (Tâche 15).
5. **Proposition page admin, sans construction** (Tâche 16).
6. **Rapport final, tests manuels, build, commit, push, déploiement, vérification unique** (Tâche 17).

**Action utilisateur en attente** : exécuter `supabase/tool_errors.sql` dans l'éditeur SQL Supabase avant que les tests bout-en-bout ne puissent réellement écrire/lire des lignes.

## Pour reprendre

Si la session s'arrête ici : le lot des routes serveur (Tâches 7-8) est committé et propre (typecheck OK). La route de collecte (`app/api/report-error/route.js`) existe sur disque mais N'EST PAS ENCORE COMMITÉE — elle attend le retour de la relecture indépendante lancée en tâche de fond. Reprendre en vérifiant d'abord si cette relecture est revenue ; sinon relancer une relecture équivalente avant de committer la route, puis continuer à la Tâche 9 (instrumentation TIFF) du plan.
