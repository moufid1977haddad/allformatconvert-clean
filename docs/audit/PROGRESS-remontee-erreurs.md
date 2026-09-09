# PROGRESS — Remontée automatique des échecs

Suivi de reprise. Plan complet : `docs/superpowers/plans/2026-09-08-error-reporting.md`. Branche : `feat/error-reporting`. Historique détaillé (relecture indépendante, régressions corrigées) : voir les messages de commit sur cette branche.

## Tâches terminées et prouvées (code + typecheck)

- **Tâche 1** — table `tool_errors` : `supabase/tool_errors.sql` écrite. **Pas encore appliquée en base par l'utilisateur.**
- **Tâche 2** — constantes rate-limit/seuil d'alerte : `lib/quota/config.js`.
- **Tâche 3** — rate limiter dédié IP-hash : `lib/quota/toolErrorRateLimit.js`.
- **Tâche 4** — module partagé client+serveur (sanitisation, bucketing, envoi beacon) : `app/lib/reportError.js`. Testé : `node scripts/error-reporting-tests/01-sanitize.js` (tous cas + régressions post-relecture).
- **Tâche 5** — module serveur d'insertion : `lib/reportError.js`.
- **Tâche 6** — route `/api/report-error` : relue par sous-agent indépendant, 8 remarques traitées (6 corrigées, 2 documentées comme limitations acceptées). Committée.
- **Tâches 7-8** — alerte + journalisation sur les 4 routes serveur jamais couvertes par `lib/alert.js` (`pdf-repair`, `pdf-to-pdfa`, `convert-html-to-pdf`, `convert-to-pdf`) + `pdf-to-word`.
- **Tâches 9-13** — 19 outils navigateur instrumentés : TIFF (3), HEIC (2), ffmpeg.wasm (9), PDF client (4), ZIP Extractor (1).
- **Tâche 14** — agrégation quotidienne + alerte systémique dans le cron `health-check` existant (réutilise `checkStateTransition`/`sendAlert`, aucun nouveau job). Purge 90 jours ajoutée.
- **Tâche 15** — page de confidentialité mise à jour (`app/privacy/page.jsx`).

"Prouvé" ici = `npx tsc --noEmit` propre + tests Node unitaires du sanitiseur. **Aucun test de bout en bout réel (navigateur → route → base) n'a encore réussi** — voir ci-dessous.

## Modifié mais pas (encore) prouvé en conditions réelles

- **Route `/api/report-error` en local** : bloquée par un problème d'environnement local préexistant, sans rapport avec ce code — la clé `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` est refusée par Supabase ("Legacy API keys are disabled"), ce qui fait échouer TOUT appel service-role local (pas seulement le mien : `/api/quota/me` et les routes payantes existantes seraient pareillement affectées). Confirmé que ce n'est pas un bug du nouveau code : `/api/tool-counts` (qui lit via la clé anon) répond bien 200 ; seul le chemin service-role échoue. Conséquence directe et positive : le correctif de la relecture (échec propre en 503 au lieu d'un plantage) a été validé en conditions réelles par cet échec lui-même.
- **Tests navigateur du beacon (Tâche 17, Étape 1)** : en cours au moment de cette sauvegarde — fichiers de test créés (zip valide/corrompu, tiff corrompu), navigateur ouvert, pas encore d'upload effectué.
- **Les 5 routes serveur modifiées** (Tâches 7-8) : typecheck OK, jamais exercées pour de vrai (Gotenberg/ConvertAPI/pdf-tools non configurés en local).

## Pas commencé

- **Tâche 16** — proposition (texte seul, aucun code) de page admin.
- **Tâche 17 restant** — tests manuels complets (rate-limit 429, insertion réelle en base — tous deux bloqués localement par le problème de clé ci-dessus, à faire en preview/prod ou après rotation de la clé), rapport final `docs/audit/RAPPORT-remontee-erreurs.md`, build complet, push, déploiement, vérification unique READY.

## Décisions à connaître pour reprendre à froid

1. **Solution retenue** : point de collecte maison (pas Sentry) — table Supabase dédiée + route publique + réutilisation intégrale de `lib/alert.js`/`checkStateTransition`. Justifié dans le plan §Tâche 0 (confidentialité : aucun tiers ne reçoit les données ; coût : $0 marginal ; effort : la sanitisation aurait été le même travail avec ou sans Sentry).
2. **Champs transmis, exactement** : `tool`, `source` ('browser'|'server'), `ext`, `sizeBucket` (tranche, jamais la taille exacte), `errorType`, `errorMessage` (nettoyé, 300 car. max), `browser` (nom+version majeure, jamais l'UA brut). Jamais : fichier, contenu, nom réel, IP en clair.
3. **`errorMessage` est re-sanitisé côté serveur inconditionnellement** (`insertToolError`), y compris pour les payloads soumis par le navigateur — ne pas faire confiance à `sanitizeErrorMessage()` côté client seul.
4. **Seuil d'alerte** : 10 échecs/24h par outil (`TOOL_ERROR_ALERT_THRESHOLD_PER_DAY`), fenêtre glissante vérifiée une fois par jour (le cron Vercel Hobby ne tourne qu'une fois/jour — `vercel.json` : `0 8 * * *`).
5. **`pdf-ocr` et `pdf-extract-text`** : ne reporter QUE l'erreur de décodage/parsing, jamais `output`/`text` (contenu extrait) — vigilance déjà appliquée, à revérifier si ces fichiers sont retouchés.
6. **`audio-merger`** : pas de "le" fichier unique (fusion multi-fichiers) → `reportToolError` appelé sans `file`, `ext`/`sizeBucket` restent `null` plutôt que de mal attribuer à un seul des fichiers.
7. **Limitations connues, acceptées sans correction** (issues de la relecture indépendante de la Tâche 6) : confiance dans le premier maillon `X-Forwarded-For` (partagée avec `lib/quota/ipRateLimit.js` existant, non modifiée pour rester cohérente avec l'infra en place) ; corps de requête bufferisé avant contrôle de taille (risque jugé faible, bornes de la plateforme Vercel en amont).
8. **Point 3 du cahier des charges** (alertes serveur non couvertes) : seulement 4 routes avaient vraiment ce trou — `pdf-to-word` avait déjà `alertServerError` (via `lib/quota/errorAlerts.js`), donc pas retouchée pour l'alerte, seulement pour `tool_errors`.
9. **Ne jamais** committer/pousser une clé, ni tenter de contourner le problème de clé service-role local en code (règle absolue du projet) — c'est à l'utilisateur de rafraîchir sa clé s'il veut tester en local.
10. **`next-env.d.ts`** peut apparaître modifié localement (régénéré par `next dev`) — ignorer, ne pas committer, ce n'est pas lié à ce chantier.

## Pour reprendre

Tout le code (Tâches 1-15) est committé sur `feat/error-reporting` et poussé après cette sauvegarde. Prochaine étape : finir les tests navigateur du beacon (Tâche 17 Étape 1, déjà commencés), puis Tâche 16 (texte seul), puis rédiger et committer `docs/audit/RAPPORT-remontee-erreurs.md`, puis build/commit/push/déploiement/vérification.
