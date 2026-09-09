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
- **Tests navigateur du beacon (Tâche 17, Étape 1)** : NON effectués — l'extension Chrome (claude-in-chrome) s'est déconnectée en cours de session, avant le premier upload. Les 4 procédures ci-dessous sont écrites pour que l'utilisateur les fasse lui-même.
- **Les 5 routes serveur modifiées** (Tâches 7-8) : typecheck OK, jamais exercées pour de vrai (Gotenberg/ConvertAPI/pdf-tools non configurés en local).

## Procédures de test manuel (4), à faire par l'utilisateur

Prérequis : serveur de dev lancé (`npm run dev`, sur `http://localhost:3000`). Fichiers de test déjà préparés dans `C:\Users\moufi\AppData\Local\Temp\claude\C--Users-moufi-Desktop-onlineconvertools\82720794-9e0c-46b9-942d-026741befd95\scratchpad\` :
- `valid-test.zip` (140 octets, une vraie archive ZIP valide contenant `hello.txt`)
- `corrupt-test.zip` (59 octets de texte brut, pas une vraie archive)
- `corrupt-test.tiff` (49 octets de texte brut, pas un vrai TIFF)
- `corrupt-test.mp3` (68 octets de texte brut, pas un vrai MP3)

Si ces fichiers n'existent plus (dossier temporaire nettoyé), n'importe quel petit fichier texte renommé avec la bonne extension fonctionne aussi bien pour les cas "corrompu" — le but est juste un fichier que l'outil ne peut pas décoder.

Dans Chrome : F12 → onglet **Réseau** (Network) → filtrer sur `report-error` avant de commencer chaque test.

### Test 1 — La remontée part bien lors d'un échec

1. URL : `http://localhost:3000/tools/file-tools/zip-extractor`
2. Fichier à uploader : `corrupt-test.zip`
3. Cliquer la zone d'upload, sélectionner le fichier (l'extraction se lance automatiquement au choix du fichier).
4. Dans l'onglet Réseau : chercher une requête vers `report-error` (type `fetch`/`xhr` ou `ping` selon si `sendBeacon` ou le repli `fetch` a été utilisé).
5. **Résultat attendu** : une requête `POST /api/report-error` apparaît, avec un statut soit `204` (si la clé Supabase locale fonctionne), soit `503` (si le même problème de clé service-role que documenté plus haut persiste — dans les deux cas la requête est bien partie, ce qui est ce que ce test vérifie). Une alerte navigateur "Error: ..." apparaît aussi (comportement existant de l'outil, inchangé).

### Test 2 — Rien ne part lors d'un succès

1. URL : `http://localhost:3000/tools/file-tools/zip-extractor`
2. Fichier à uploader : `valid-test.zip`
3. Cliquer la zone d'upload, sélectionner le fichier.
4. Dans l'onglet Réseau : regarder toutes les requêtes émises après l'upload (pas seulement filtrées sur `report-error` cette fois, pour être sûr de ne rien manquer).
5. **Résultat attendu** : la liste "1 file(s) extracted" avec `hello.txt` téléchargeable apparaît, et **aucune** requête vers `report-error` n'apparaît dans l'onglet Réseau.

### Test 3 — Aucun nom de fichier ni contenu ne fuit

1. Reprendre la requête `POST /api/report-error` capturée au Test 1.
2. Cliquer dessus dans l'onglet Réseau → sous-onglet **Payload** (ou "Request") → regarder le corps JSON envoyé.
3. **Résultat attendu** : le corps contient exactement les champs `tool` (`"zip-extractor"`), `source` (`"browser"`), `ext` (`"zip"` ou `null`), `sizeBucket` (ex. `"0-1MB"`), `errorType`, `errorMessage`, `browser`. Le champ `errorMessage` ne doit contenir ni `corrupt-test.zip`, ni `corrupt-test`, ni aucun chemin Windows (`C:\...`) ou Unix (`/...`) réel — au pire un jeton `[file]` ou `[path]` à la place. Refaire ce test avec `corrupt-test.tiff` sur `http://localhost:3000/tools/image-tools/tiff-to-png` pour confirmer sur un deuxième outil (celui qui a motivé ce chantier).

### Test 4 — Un échec de la remontée ne casse jamais l'outil

1. Arrêter le serveur de dev (`Ctrl+C` dans le terminal où tourne `npm run dev`), ou renommer temporairement `app/api/report-error/route.js` en `route.js.disabled` puis relancer `npm run dev`.
2. URL : `http://localhost:3000/tools/image-tools/tiff-to-png`
3. Fichier à uploader : `corrupt-test.tiff`, puis cliquer "Convert to PNG".
4. **Résultat attendu** : le message d'erreur habituel de l'outil ("Could not decode this TIFF file: ...") s'affiche normalement, sans page blanche, sans exception JavaScript visible, sans blocage de l'interface — même si la requête vers `report-error` échoue silencieusement (404 ou connexion refusée) en arrière-plan. Remettre `route.js.disabled` en `route.js` ensuite si renommé.

### Test 5 (bonus, nécessite une base fonctionnelle) — Limitation d'abus

Bloqué en local par le problème de clé `SUPABASE_SERVICE_ROLE_KEY` documenté plus haut. À faire une fois la clé rafraîchie, ou directement contre l'URL de prévisualisation Vercel une fois déployée (voir section déploiement) :
```
for i in $(seq 1 21); do curl -s -o /dev/null -w "%{http_code}\n" -X POST <URL>/api/report-error -H "Content-Type: application/json" -d '{"tool":"zip-extractor","source":"browser","errorMessage":"test"}'; done
```
**Résultat attendu** : les 20 premières requêtes répondent `204`, la 21e répond `429` avec un en-tête `Retry-After`.

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

Tout le code (Tâches 1-15) est committé sur `feat/error-reporting` et poussé. Les 4 procédures de test manuel ci-dessus sont écrites mais pas exécutées (extension navigateur indisponible dans cette session) — c'est à l'utilisateur de les faire. Le reste (Tâche 16 texte, rapport final, build, commit, push, déploiement, vérification READY) est en cours de finalisation dans la foulée de cette sauvegarde.
