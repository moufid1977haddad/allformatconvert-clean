# Gotenberg — versionner l'image (partie code uniquement)

**Date : 16 septembre 2026**
**Statut : code prêt, rien de déployé.** Cette session ne touche ni Railway, ni Vercel, ni le navigateur — voir §4 pour ce que la session de déploiement devra faire.

Tag de restauration posé avant tout changement : `restore-before-gotenberg-versioning-20260916` (pointe sur `5a201410`, dernier commit avant ce chantier). Un tag `restore-before-gotenberg-versioning` (sans date) existait déjà, posé au même commit — pas de divergence, aucune action nécessaire dessus.

**Correction au prompt** : le prompt annonce « cinq outils » dépendant de `/api/convert-to-pdf` et `/api/convert-html-to-pdf`. Vérifié en lisant le code : ce sont **six** outils — `word-to-pdf`, `excel-to-pdf`, `ppt-to-pdf`, `epub-to-pdf`, `mobi-to-pdf` (via `/api/convert-to-pdf`) et `html-to-pdf` (via `/api/convert-html-to-pdf`).

---

## 1. `services/gotenberg/` — état trouvé, ce qui a été ajouté

Le répertoire **existait déjà**, commité sur `master` depuis le 1er septembre 2026 (`README.md`, `FONTS.md`, `RAILWAY.md`, `Dockerfile`, `fonts.conf`) — construit pour un chantier antérieur et distinct (mesure de fidélité des polices Office, `docs/specs/2026-09-01-office-pdf-fidelity-phase2.md`), explicitement marqué « test service, not production » et non digest-pin à l'époque. Il suit déjà le motif de `pdf-tools`/`background-removal` (un `Dockerfile` + un `README.md` à la racine du service), avec deux fichiers `.md` supplémentaires justifiés par la matière propre à Gotenberg (licences de polices, variables Railway) — repris tels quels plutôt que réinventés.

Ce chantier ne recrée donc pas ce répertoire ; il le complète pour l'objectif propre à cette session (versionner l'image, qui est indépendant de la fidélité des polices) :

- **`Dockerfile`** : ajout du digest `sha256`, absent jusqu'ici (seul le tag `8.36.0` était épinglé). Voir §2 pour la vérification.
- **`README.md`** : reformulé pour porter les deux objectifs (fidélité des polices *et* versioning), ajout de l'étape « Watch Paths » dans les instructions Railway, précision sur les 6 outils (pas 5) et sur le fait que la bascule production se fait par variables d'env, jamais par suppression du service existant.
- **`FONTS.md`, `RAILWAY.md`** : inchangés — déjà corrects et vérifiés indépendamment (§2, §3).
- **Ce rapport** : nouveau.

---

## 2. Image de base — vérifié en direct, pas supposé

### 2.1 Digest

Interrogé directement l'API du registre Docker Hub (`auth.docker.io` + `registry-1.docker.io`, pas le site web) le 16 septembre 2026 pour le tag `gotenberg/gotenberg:8.36.0` :

```
docker-content-digest: sha256:87c16b9f364279d321bc9772d31fa58aa6abe036423c270698bd636c3a8e9466
```

C'est le digest de la **manifest list** (multi-architecture), pas celui d'une seule plateforme — donc `FROM gotenberg/gotenberg:8.36.0@sha256:87c16b9f...` continue de résoudre la bonne image par architecture (amd64 pour Railway) tout en étant immuable même si le tag `8.36.0` était un jour redirigé en amont. C'est cette référence qui est maintenant dans `Dockerfile`.

### 2.2 Carlito et Caladea — présents dans l'image de base, confirmé indépendamment

Le `FONTS.md` existant l'affirmait déjà depuis le 1er septembre (en inspectant des conversions réelles) ; revérifié ici directement contre le `Dockerfile` amont du tag `v8.36.0` (`github.com/gotenberg/gotenberg`, `build/Dockerfile`), pas contre un résumé :

- Base : **Debian 13 (trixie)**, confirmé (`FROM debian:13-slim`, dépôt `trixie-backports` référencé).
- Polices installées par `apt-get` dans le `common-stage` de l'image amont : `fonts-crosextra-carlito`, `fonts-crosextra-caladea`, `fonts-liberation`, `fonts-liberation2`, `fonts-dejavu`, `fonts-noto-core`, `fonts-noto-cjk`, `fonts-noto-color-emoji`.

**Confirmation explicite demandée par le prompt : oui, Carlito et Caladea sont bien présents dans l'image de base `gotenberg/gotenberg:8.36.0`**, via les paquets Debian `fonts-crosextra-carlito` et `fonts-crosextra-caladea`. Rien à ajouter pour ces deux polices.

### 2.3 Liberation Sans Narrow — licence, vérifiée avant intégration (règle éliminatoire)

Point non négociable du prompt : une licence non commerciale disqualifie, quelle que soit la qualité. Vérifié en deux temps, contre la source primaire, pas un résumé :

1. **Le paquet existe bien dans trixie** : `fonts-liberation-sans-narrow`, version `1:1.07.6-4`, confirmé via l'API `sources.debian.org` (suites `trixie`, `forky`, `sid`).
2. **Le fichier `debian/copyright` de ce paquet exact**, récupéré directement (`sources.debian.org/data/main/f/fonts-liberation-sans-narrow/1%3A1.07.6-4/debian/copyright`) :
   > `Copyright © 2007-2011 Red Hat, Inc.` — `License: GPL-2 with Font exception`

   Le texte de licence lui-même (accord Red Hat « LIBERATION FONT SOFTWARE ») autorise explicitement l'usage, la modification, la copie et la **distribution**, y compris dans un produit commercial — la seule restriction porte sur la marque déposée « LIBERATION » en cas de version modifiée redistribuée sous un autre nom, pas sur l'usage commercial lui-même.

**Verdict : licence commerciale-compatible, confirmée en toutes lettres — pas éliminatoire.** Contrairement au mur Wingdings/Webdings de ce projet (licence Microsoft « Core fonts for the Web » qui interdit explicitement la distribution « for profit » — voir `FONTS.md`), Liberation Sans Narrow ne porte aucune clause de ce type.

### 2.4 Liste exacte des polices dans l'image finale

| Police | Origine | Ajoutée par ce Dockerfile ? |
|---|---|---|
| Carlito | Base (`fonts-crosextra-carlito`) | Non |
| Caladea | Base (`fonts-crosextra-caladea`) | Non |
| Liberation Sans / Serif / Mono | Base (`fonts-liberation`, `fonts-liberation2`) | Non |
| DejaVu (Sans/Serif/Mono) | Base (`fonts-dejavu`) | Non |
| Noto (core, CJK, emoji couleur) | Base (`fonts-noto-core`, `fonts-noto-cjk`, `fonts-noto-color-emoji`) | Non |
| OpenSymbol | Base (fourni avec `libreoffice-writer` etc.) | Non |
| **Liberation Sans Narrow** | `fonts-liberation-sans-narrow` (Debian trixie) | **Oui** — licence vérifiée §2.3 |

Wingdings / Webdings / Wingdings 2 / Wingdings 3 : délibérément absentes, mur de licence (voir `FONTS.md`).

---

## 3. Ce que cette session n'a PAS fait (hors périmètre, volontairement)

- Aucune action Railway, aucune action Vercel, aucun test navigateur.
- Aucune bascule de trafic : le service actuel (image flottante `gotenberg/gotenberg:8`) continue de tout servir.
- Aucune correction des textes « professional-grade fidelity » du site — attend la mesure de fidélité sur documents Office réels (chantier distinct).
- Aucun outil supprimé ni renommé.

---

## 4. Pour la session de déploiement — à faire, pas encore fait

### 4.1 Réglages Railway (nouveau service, à côté de l'existant)

| Réglage | Valeur |
|---|---|
| Root Directory | `services/gotenberg` |
| Watch Paths | `services/gotenberg/**` |
| Healthcheck Path | `/health` |
| Variables d'environnement | Les 9 listées dans `services/gotenberg/RAILWAY.md` — noms et rôles déjà documentés, **valeurs à saisir directement dans Railway, jamais dans ce dépôt** |

### 4.2 Variables Vercel `GOTENBERG_*` à basculer (noms uniquement — aucune valeur ci-dessous ni ailleurs)

Trouvées par lecture du code (`app/api/convert-to-pdf/route.ts`, `app/api/convert-html-to-pdf/route.ts`, `app/api/cron/health-check/route.ts`) :

- `GOTENBERG_URL`
- `GOTENBERG_USERNAME`
- `GOTENBERG_PASSWORD`
- `GOTENBERG_TIMEOUT_MS`

Les trois premières changent de valeur lors de la bascule (nouvelle URL/identifiants du service versionné) ; `GOTENBERG_TIMEOUT_MS` est un réglage de comportement indépendant du service pointé et n'a pas de raison de changer, sauf si le nouveau service justifie un délai différent.

### 4.3 Bascule bleu/vert — séquence obligatoire

1. Nouveau service Railway créé **à côté** de l'actuel (§4.1) — l'ancien n'est jamais touché à cette étape.
2. Ancien service conservé comme **filet de repli**, tant que le nouveau n'a pas prouvé sa fiabilité en conditions réelles.
3. Bascule des variables `GOTENBERG_*` (§4.2) sur l'environnement **Preview** de Vercel d'abord — jamais Production directement.
4. Tests réels sur préversion contre les 6 outils concernés (§ correction ci-dessus).
5. Seulement une fois Preview vert : bascule des mêmes variables sur **Production**.
6. **L'ancien service Railway n'est supprimé qu'avec l'accord explicite de l'utilisateur**, jamais automatiquement, jamais dans la même session que la bascule.

---

## 5. Fichiers touchés par cette session

- `services/gotenberg/Dockerfile` — digest ajouté.
- `services/gotenberg/README.md` — reformulé (6 outils, Watch Paths, double objectif fidélité/versioning).
- `docs/audit/RAPPORT-gotenberg-versionne.md` — ce rapport (nouveau).
- Aucun fichier applicatif du site modifié. Aucun outil supprimé ni renommé.

---

## 6. Session de déploiement — exécutée le 18 septembre 2026

### 6.1 Constat de départ, différent de l'hypothèse du §4

Avant toute action de cette session, vérification a montré que **le service Railway existant s'appelle `gotenberg-fonts`**, pas un nom générique « gotenberg » — et qu'il avait déjà, depuis le chantier du 1er septembre, exactement la configuration que le §4.1 demandait de créer pour le nouveau service (`Root Directory: services/gotenberg`, `Watch Paths: services/gotenberg/**`). Conséquence : quand le commit 74e4660 (digest pin) a été poussé sur `master` à la fin de la session de code, `gotenberg-fonts` s'est **auto-redéployé lui-même** avant même le début de cette session — sans passage par une bascule bleu/vert réfléchie. Ce n'était pas une action de cette session, mais un effet de bord du Watch Paths déjà en place sur le service existant.

Confirmation que `gotenberg-fonts` est bien le service de **production** (et non un service de test comme sa description originale le laissait penser) : `GOTENBERG_URL` dans Vercel pointait dessus (vérifié en lisant la valeur dans le tableau de bord, jamais affichée dans ce terminal). Un seul workspace, un seul projet (`fortunate-manifestation`), un seul environnement Railway (`production`) existent sur ce compte — aucun autre service Gotenberg n'a été trouvé ailleurs.

### 6.2 Nouveau service créé : `gotenberg-v2`

- Projet Railway `fortunate-manifestation`, créé depuis `moufid1977haddad/allformatconvert-clean`, branche `master`.
- Root Directory : `services/gotenberg` · Builder : Dockerfile (confirmé dans les logs : `load build definition from services/gotenberg/Dockerfile`, même digest `sha256:87c16b9f...` que le service existant) · Watch Paths : `services/gotenberg/**` · Healthcheck Path : `/health`.
- Domaine généré : **`gotenberg-v2-production.up.railway.app`** (port 3000).
- Les 9 variables d'environnement ont été ajoutées par **référence croisée Railway** (`${{gotenberg-fonts.NOM_VAR}}`) plutôt que recopiées — leurs valeurs n'ont jamais été lues ni affichées.
- Vérifié isolément avant toute bascule : `/health` répond `{"status":"up",...}` avec Chromium et LibreOffice déjà « up ».

### 6.3 Bascule Preview puis Production

`GOTENBERG_URL` a été scindée en deux valeurs distinctes par environnement (au lieu d'une valeur unique partagée) : Preview → `gotenberg-v2-production.up.railway.app`, Production conservée sur l'ancienne valeur le temps des tests. `GOTENBERG_USERNAME`/`GOTENBERG_PASSWORD` restent partagés (identifiants réutilisés, comme documenté au §4.2).

Piège rencontré : un « Ignored Build Step » du projet Vercel annule automatiquement tout redéploiement d'un commit qui ne touche que `docs/**`/`*.md`/`README` — ce qui était le cas du dernier commit. Contournement : décocher « Use project's Ignore Build Step » sur le redéploiement manuel (sans cache de build), uniquement pour ce déploiement précis — aucun réglage de projet n'a été modifié.

Après le redéploiement Preview (`onlineconvertools-git-master-moufid.vercel.app`), les six outils ont été testés avec des fichiers réels (`scripts/audit/fixtures/files/sample.{docx,xlsx,pptx,epub,mobi,html}`, déjà utilisés dans les audits précédents de ce projet) :

| Outil | Avant (production, `gotenberg-fonts`) | Après (production, `gotenberg-v2`) |
|---|---|---|
| word-to-pdf | ✅ PDF généré | ✅ PDF généré |
| excel-to-pdf | ✅ PDF généré | ✅ PDF généré |
| ppt-to-pdf | ✅ PDF généré | ✅ PDF généré |
| epub-to-pdf | ✅ PDF généré | ✅ PDF généré |
| mobi-to-pdf | ✅ PDF généré | ✅ PDF généré |
| html-to-pdf | ✅ PDF généré | ✅ PDF généré |

Tous verts sur Preview → bascule de `GOTENBERG_URL` Production vers `gotenberg-v2`, redéploiement Production forcé de la même façon (même contournement de l'Ignored Build Step), puis les six outils ont été **retestés en conditions réelles sur `www.onlineconvertools.com`** après bascule — tous verts (tableau ci-dessus, colonne « Après »).

### 6.4 Temps de conversion : mesure non concluante, signalé honnêtement

Le prompt demandait une comparaison des temps de conversion sur le même fichier. Une tentative de mesure via horodatage autour des actions navigateur a été abandonnée : l'écart mesuré (~48 s) reflétait le temps d'aller-retour de l'automatisation elle-même (plusieurs appels séquentiels), pas le temps réel de conversion côté Gotenberg — le chiffre aurait été trompeur s'il avait été présenté comme tel. Fait vérifiable à la place : les deux services font tourner **la même image Docker, au même digest** (confirmé dans les logs de build de `gotenberg-v2`), donc aucune différence de performance n'est attendue, et aucune n'a été perceptible pendant les tests manuels (conversions quasi instantanées des deux côtés).

### 6.5 État final

- **URL du nouveau service** : `https://gotenberg-v2-production.up.railway.app`
- `gotenberg-fonts` (ancien service) **conservé intact, non supprimé**, sert de filet de repli — sa suppression attend l'accord explicite du propriétaire, comme demandé.
- Aucun outil supprimé ni renommé. Aucune valeur de variable affichée à aucun moment.
- `GOTENBERG_PASSWORD` porte une alerte Vercel native « Needs Attention » (variable de type Config plutôt que Secret) — signalé pour information, aucune action prise (hors périmètre de cette session).
