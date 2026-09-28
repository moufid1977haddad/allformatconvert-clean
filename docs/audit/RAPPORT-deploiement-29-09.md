# RAPPORT — Déploiements du 29/09 (P7, P12, P13), propriétaire présent

## En bref

| Étape | Branche | Préversion (suites ×3 moteurs) | Production | Vérification sur www |
|---|---|---|---|---|
| **P7** | `licence-ameliorations` (déploiement 2 + nuit du 28/09) | `onlineconvertools-1olof8w9d` : night-28-09, download-ready, global-28-09, sonde HTML/EPUB/MOBI → PDF **ALL PASS** Chromium, Firefox, WebKit | **`2cc1848d`** | 238 pages Chromium **238/238** ; night-28-09 ALL PASS ; **Firefox HTML/EPUB/MOBI → PDF 3/3** (200, `%PDF-`, 13 469 / 13 605 / 196 783 octets) ; boutons de téléchargement ALL PASS (Firefox, 10 outils) |
| **P12** | `croissance-29-09` | `onlineconvertools-ni0vwkf67` : seo-pages-29-09 **ALL PASS ×3** | **`ceb538f3`** | 238/238 ; **les 10 pages ALL PASS** (JSON-LD complet et valide, chaque question de FAQ visible, exemples repassés dans le vrai outil, liens en 200) ; **SQL to CSV** : INSERT de 3 lignes et `O\'Brien` → `1,Ann / 2,O'Brien / 3,Cy` |
| **P13** | `qualite-29-09` | `onlineconvertools-rn1wvjhpe` : **`report-error` 204 par la nouvelle fonction SQL** (et non 503) ; banc qualité **76/76 Chromium, 76/76 Firefox, 75/75 WebKit** (+1 sauté) | **`48ce5d81`** | 238 pages Chromium **238/238** ; échantillon **tout PASS** ; **limite : 40 billets accordés, le 41ᵉ refusé** (429) ; **fausse IP dans `x-forwarded-for` sans effet** (429) |

Faits par le propriétaire pendant la session : **migration SQL** `docs/audit/migration-quota-atomique-29-09.sql` exécutée **avant** P13 (fonction créée ; droits service_role / anon / authenticated = true / false / false ; essais a et b conformes ; lignes de test supprimées) ; **purge P9** : 152 lignes supprimées, recomptage 0, contrôle 3.

**Aucune poussée forcée. Aucun retour arrière n'a été nécessaire.** Repères de restauration : P7 → production d'avant = `8123f0c0` (le repère `restauration-avant-deploiement2-28-09` = `03f34e53` n'en diffère que par le changement additif du service vidéo) ; P12 → `restauration-avant-croissance-29-09` = `2cc1848d` ; P13 → `restauration-avant-qualite-29-09` = `ceb538f3` (tous deux poussés sur GitHub).

## Les 10 URL à soumettre (Search Console → Inspection de l'URL → Demander une indexation), dans cet ordre

1. https://www.onlineconvertools.com/tools/math-tools/percentage-calculator
2. https://www.onlineconvertools.com/tools/developer-tools/csv-to-sql
3. https://www.onlineconvertools.com/tools/developer-tools/sql-to-csv
4. https://www.onlineconvertools.com/tools/developer-tools/csv-to-json
5. https://www.onlineconvertools.com/tools/developer-tools/toml-to-json
6. https://www.onlineconvertools.com/tools/developer-tools/json-to-toml
7. https://www.onlineconvertools.com/tools/developer-tools/csv-to-tsv
8. https://www.onlineconvertools.com/tools/developer-tools/tsv-to-csv
9. https://www.onlineconvertools.com/tools/developer-tools/hash-generator
10. https://www.onlineconvertools.com/tools/qr-barcodes-tools/barcode-generator

## Détail et écarts

### Préversions
- **La poussée directe de `licence-ameliorations` a donné une préversion en ERREUR** (comme ses deux précédentes) : la commande d'exclusion de Vercel (`ignoreCommand`) compare au commit précédent de la branche (`827b128c`), absent du clone superficiel (« fatal: bad object »). Même piège que le 28/09 : les trois préversions ont été créées **par l'API** (`POST /v13/deployments`, source Git = une branche fraîche). Pour P12 et P13, dont le commit de tête ne touche que la documentation (l'exclusion l'aurait annulé), la préversion a été construite sur le dernier commit de code (`d51a4ce0`, `bdcdb8de`) : les commits écartés ne contiennent que `claude/plan-de-travail.md` et un rapport (vérifié par `git diff --stat`).
- Accès aux préversions protégées : relais local avec un jeton OIDC frais, obtenu en mémoire par `vercel env run` depuis un dossier ne contenant que les identifiants du projet ; aucun fichier d'environnement lu ni affiché.
- **WebKit sur les préversions** : la barre de commentaires de Vercel (`vercel.live`, propre aux préversions, absente de www) lève `navigator.storage.persisted` sur chaque page. Seo-pages : 10 échecs, tous cette erreur ; relancé sans elle → ALL PASS. Banc qualité : 62 erreurs, toutes cette erreur, 75 contrôles réels verts ; relancé avec `--no-vercel-toolbar` (option ajoutée) → 75/75.
- **Chromium, « xml exact »** sur la préversion P13 : le contrôle lisait la sortie 150 ms après le clic alors que JSON to XML charge sa bibliothèque au clic (plus lent au travers du relais). Contrôle corrigé (attente du résultat) → 76/76.
- **download-ready** sous Firefox et WebKit (P7) : la première passe, lancée en parallèle avec deux autres moteurs, n'avait écrit aucune ligne ; relancée seule → ALL PASS (10 outils) ×2.
- La fonction SQL est prouvée **deux fois** : sur la préversion (`report-error` → 204) et sur www (40 billets accordés : chaque réservation passe par elle ; puis refus atomique).

### Vérification sur www — deux « échecs » qui étaient mes contrôles, vérifiés avant toute décision
- **SQL to CSV (P12)** : mon premier script passait `O\'Brien` sans sa barre oblique (le shell l'avait mangée) → SQL invalide en entrée. Rejoué avec la vraie entrée (affichée dans la sortie) : résultat exact.
- **File Encryptor (P13)** : mon contrôle cherchait « old XOR format » (le libellé de Text Encryptor) ; la page dit « old XOR method ». Contrôles séparés : octets relus identiques à l'original, avertissement affiché.
Aucun des deux ne concernait le site ; aucun retour arrière n'était justifié.

### Effets de bord assumés
- Le contrôle de limite a consommé l'allocation vidéo horaire de ta connexion (40 billets, jamais utilisés) : les outils vidéo et audio passant par le service te répondront « Too many conversions… » jusqu'à la fin de l'heure (`Retry-After` 1 284 s au moment du test).
- Aucun appel payant, aucune ligne écrite dans `tool_errors` (la sonde `report-error` n'a été jouée que sur la préversion, qui n'écrit jamais).

### Dernier déploiement de production : `ed5bc690`
Le commit de ce rapport contenait aussi `scripts/browser-tests/deploiement-29-09-www.mjs` (hors `docs/`) : Vercel a reconstruit la production, **code du site identique** à `48ce5d81` (`git diff` vide sur `app`, `lib`, `next.config.ts`, `package.json`). Contrôlé : READY, accueil et 3 pages en 200, échantillon P13 rejoué tout PASS.

### Nouveaux scripts
- `scripts/browser-tests/deploiement-29-09-limits.mjs` — sonde de la fonction SQL, limite atteinte puis refusée, fausse IP.
- `scripts/browser-tests/deploiement-29-09-www.mjs` — échantillon P13 sur www.

## Pour le propriétaire, ensuite

1. **Search Console** : les 10 URL ci-dessus, une par une (Inspection de l'URL → Demander une indexation).
2. **Tests Safari 9 à 30** (`claude/tests-safari-proprietaire.md`) — iPhone : 9, 10, 11, 13, 15, 25, 30 et la coupe précise du n° 4 ; MacBook : le reste — puis **retests de P1** : 1a (Opus sur Mac), 1b, 1c (consigne et première image sur iPhone), 1e ; et les points ajoutés le 29/09 : Brightness & Contrast et Image Blur, Video Filter (refus clair), Audio Equalizer, JPG to PDF avec une photo portrait d'iPhone.
3. **Décision Gotenberg** (P8) : 3 réplicas le jour du lancement, ≈ +16 $/mois tant qu'ils tournent.
4. **P10** : relire et compléter le premier commentaire Product Hunt (`docs/lancement/product-hunt.md` §4).
5. **P11** : soumissions de liens, dans l'ordre (Show HN d'abord ; `docs/lancement/sources-de-liens.md`).
