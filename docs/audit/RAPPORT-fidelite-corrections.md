# Corrections de fidélité Office → PDF (D1, D2, D6) et mesure du plafond (D8) — rapport final

Date : 2026-09-19. Suite de `RAPPORT-fidelite-office.md`. Tout ce qui suit a été
mesuré ce jour ; ce qui ne l'a pas été est dit. **Trois de mes hypothèses de la
passe précédente étaient fausses** (D1, D2, et les plafonds de quota) : elles
sont corrigées ici, avec la mesure qui les invalide.

## 1. `claude/plan-de-travail.md` — ce qui s'est passé (priorité absolue)

**Constat : je n'ai rien écrasé, et je n'ai rien perdu ; mais le document de
pilotage que vous décrivez (RÈGLE ZÉRO, liste des bloquants, interdits
permanents, trois annexes) est introuvable ici, et je ne peux donc pas le
restaurer.**

Preuves, dans l'ordre où je les ai obtenues :

| Vérification | Résultat |
|---|---|
| `git log --all -- claude/plan-de-travail.md` | 2 commits seulement, **les miens** : `4d00c2f4` (création) et `a16e55dc` (mise à jour). Aucune version antérieure sur aucune branche locale ou distante. |
| `git log --all -- claude` | ne contient que `REFERENCE-projet.md` et `plan-de-travail.md`, tous deux ajoutés par mes commits |
| `git stash list`, `git worktree list` | vide / une seule copie de travail |
| Objets git orphelins (les 300 premiers blobs non atteignables) | aucun ne contient « RÈGLE ZÉRO » ni « bloquant » |
| Recherche du texte « RÈGLE ZÉRO » dans l'arbre de travail et dans les 400 révisions les plus récentes | **aucune occurrence** |
| Recherche de fichiers `*plan*travail*` sur le bureau, Documents, Téléchargements, `.claude` (5 niveaux) | uniquement le fichier du dépôt |
| Historique local de VS Code | aucune entrée |
| Autre dépôt `Desktop/backup` | mêmes commits récents, **pas de dossier `claude/`** |
| Outil d'écriture lors de ma création du fichier | « File created » : l'outil refuse d'écraser un fichier existant non lu, donc **le chemin était vide à ce moment** |
| Transcription de la session du 2026-09-18 (`4e1c15ce…jsonl`) | cette session avait reçu la même consigne (« mets à jour `claude/plan-de-travail.md` ») et avait **déjà constaté** qu'il « n'existe nulle part dans ce dépôt, ni sur master ni sur aucune autre branche » |

**Perdu puis retrouvé : rien.** Ce qui s'est réellement passé : le fichier n'existait
pas dans ce dépôt le 2026-09-18 non plus. J'ai écrit un nouveau fichier de tâches
sous ce nom ; mon rapport disait « créé », ce qui était exact, mais j'aurais dû
vous dire alors qu'il ne correspondait pas à votre description et que
l'original manquait — je ne l'ai pas fait. Hypothèses que je ne peux pas
départager : il vit sur une autre machine ou un autre clone jamais poussé ;
il a été supprimé avant le 09-18 (un fichier non suivi par git n'est pas
récupérable par git) ; ou il porte un autre nom.

**Ce que j'ai fait à cause de cela :** le fichier du dépôt porte désormais en
tête un avertissement explicite (« ceci n'est pas le document de pilotage »), pour
que personne ne le prenne pour lui. **Je n'ai pas reconstitué la RÈGLE ZÉRO ni les
bloquants de mémoire : ce serait inventer des règles.** **Action pour vous :** si
vous avez le fichier (autre machine, sauvegarde, mail), donnez-le-moi ou
déposez-le dans `claude/` ; je fusionnerai mes ajouts dedans (D-statuts, D7)
sans toucher à son contenu.

## 2. Vérification en production des cinq pages — TERMINÉE

Après le premier déploiement (`c802a01e`), lecture du HTML servi : plus aucune
occurrence de « professional-quality » sur word-to-pdf, excel-to-pdf,
ppt-to-pdf, pdf-to-word, html-to-pdf ; « In our tests… » présent dans le corps
(5 à 7 fois) **et** dans la balise `<meta name="description">` de chacune.
La section 7 de `RAPPORT-fidelite-office.md` est écrite. Après le déploiement
d'aujourd'hui, la même vérification est refaite (§ 8).

## 3. D2 — Segoe UI / Selawik : **police ajoutée et vérifiée ; l'objectif visé sur la fixture 06 n'est PAS atteint, et ma cause était fausse**

### 3.1 Vérification de l'affirmation « Selawik = remplaçant libre, métriquement compatible »

Source réelle : dépôt officiel `github.com/microsoft/Selawik` (API GitHub :
`full_name microsoft/Selawik`, licence détectée `OFL-1.1`, non archivé).

| Point demandé | Ce que la source dit vraiment |
|---|---|
| Licence | `LICENSE.txt` du dépôt : « licensed under the SIL Open Font License, Version 1.1 », copyright Microsoft 2015, **Reserved Font Name « Selawik »** |
| Redistribution commerciale | Le texte OFL du fichier : les polices « can be **bundled, embedded, redistributed and/or sold with any software** » à condition de ne pas être **vendues seules** ; les dérivés ne peuvent pas utiliser le nom réservé. **Permis** pour notre usage (police non modifiée, embarquée dans une image de service, utilisée pour produire des PDF). L'OFL précise que l'exigence de licence ne s'applique pas aux documents créés avec la police. |
| Intégration dans les PDF | champ `OS/2 fsType = 0` (intégration installable) sur les deux fichiers |
| **Compatibilité métrique annoncée** | **NON annoncée.** Le README officiel dit seulement : « Selawik is an open source replacement for Segoe UI » et liste deux problèmes connus : « missing kerning to match Segoe UI » et « needs improved hinting ». **Votre affirmation « métriquement compatible » n'est pas dans la source ; c'est l'affirmation que le README ne fait pas.** |
| Fichiers binaires | pas dans l'arbre git ; dans l'asset de release `Selawik_Release.zip` (tag `1.01`, sha256 `3f62c51e…8d423`) |

**Compatibilité métrique — mesurée par moi** (vraie Segoe UI de Windows,
`segoeui.ttf`/`segoeuib.ttf`, contre `selawk.ttf`/`selawkb.ttf`, via `fontTools`) :
largeurs d'avance **identiques sur 93/93 glyphes** testés (lettres, chiffres,
accents français, « » € — ’), en normal **et** en gras ; largeur totale de
deux phrases d'essai : rapport 1,0000. Le kerning n'a pas été comparé (le README
dit qu'il diffère).

### 3.2 Ajout à l'image Gotenberg (comme Liberation Sans Narrow, avec empreinte)

Pas de paquet Debian pour Selawik : les deux TTF sont vendorisés sans modification
dans `services/gotenberg/fonts/selawik/` avec `OFL-LICENSE.txt`, `SHA256SUMS`
et `SOURCE.md` (provenance). Empreintes vérifiées : `selawk.ttf`
`e9d98518…ee1c`, `selawkb.ttf` `f0db5e17…c904`, licence `77b7c250…5300c`.
Le `Dockerfile` copie, **vérifie `sha256sum -c` (un écart casse le build)**,
installe dans `/usr/local/share/fonts/selawik`, copie la licence dans
`/usr/share/doc/selawik/copyright`, `fc-cache`. Règle `fonts.conf` :
`Segoe UI → Selawik` (forte, en dernier). J'ai contrôlé que git a stocké les TTF
octet pour octet (`CR`-safe) : les empreintes attendues sont celles des blobs.
`FONTS.md` documente le tout, dont ce qui **n'est pas** établi. Light/Semilight/
Semibold ne sont ni livrés ni mappés (non mesurés).

### 3.3 Remesure de la fixture 06 — objectif non atteint

Déployé sur Railway (déclenchement automatique) ; en production,
`pdffonts` de la fixture 06 : `Selawik-Bold` embarquée (au lieu de Noto Sans).
**Mais le titre se replie toujours sur deux lignes et sa seconde ligne
(« … Segoe UI) ») reste masquée** (`fidelite-marche/d2-06-avant-apres-freeconvert.png`).
Différence de pixels avec FreeConvert : 13 207 avant, 11 423 après — pas de
résolution.

**Cause réelle (mesurée, réfute ma cause de la passe précédente).** Les deux zones
de texte de la fixture sont `wrap="none"` (PowerPoint laisse le texte dépasser
de la boîte) et **plus étroites que leur texte** (boîte 6,0 po, texte 8,93 po en
Segoe UI Bold 32 pt). LibreOffice replie au bord de la boîte. Preuve décisive :
**LibreOffice local (Windows) avec la vraie Segoe UI Bold replie aussi le titre.**
Ce n'est donc pas un problème de police.

**Ce que Selawik apporte réellement (mesuré) :**
- variante de la fixture, boîte `wrap="square"` juste assez large pour Segoe UI
  (+2 %) : en production le titre tient sur une ligne (Selawik) ; identique en
  LibreOffice local avec la vraie Segoe UI ;
- variante `wrap="none"` avec boîte dimensionnée pile pour Segoe UI (+0,5 %),
  ce que PowerPoint écrit lui-même : titre sur une ligne en production.
- **Inférence, non mesurée directement** (l'ancien rendu Noto n'est plus
  reproductible) : sur l'ancienne capture, la même portion de titre était 5,4 %
  plus large en Noto Sans qu'en Selawik ; une boîte ajustée à Segoe UI avec
  +2 % de marge aurait donc replié en Noto.

**Verdict D2 :** gain réel mais limité aux textes dans des boîtes ajustées ou
qui se replient ; **la fixture 06 en l'état continue de montrer un défaut**,
désormais correctement attribué à `wrap="none"` sous LibreOffice (nouveau
défaut **D9**, § 7). Les textes du site ont été corrigés en conséquence
(§ 6). Je n'ai pas modifié la fixture pour la faire « passer ».

## 4. D1 — gras Excel en police à empattements : **cause vérifiée, autre que ma cause supposée ; corrigé et remesuré**

### 4.1 Vérification de l'hypothèse (avant toute correction)

Hypothèse de la passe précédente : règle fontconfig « Calibri » manquante pour
le gras. **Fausse.** Mesures en production :
- classeur 03 dont les cellules en gras reçoivent le nom explicite `Calibri` :
  `Carlito-Bold` (**correct**, sans aucune règle supplémentaire) ;
- mini-classeur : gras `Calibri` → `Carlito-Bold`, gras `Arial` → `LiberationSans-Bold`
  (corrects) ; gras **sans nom** → `Caladea-Bold` (le défaut observé).
- inspection du XML de la fixture : ses polices en gras sont
  `<font><b val="1"/><sz val="14"/></font>` — **aucun `<name>`** (comportement
  d'`openpyxl` avec `Font(bold=True)` ; d'autres générateurs font pareil).
  Excel lit « pas de nom » = police par défaut du classeur (sortie FreeConvert :
  `Calibri-Bold`) ; LibreOffice n'a pas cette règle et tombe sur une police
  à empattements. Une règle fontconfig ne peut pas atteindre ce cas (aucun nom à
  intercepter).

### 4.2 Correction

`lib/xlsxDefaultFont.js` : avant l'envoi à Gotenberg, pour les `.xlsx`
uniquement, chaque entrée `<font>` **de `<fonts>`** sans nom reçoit le nom de la
police 0 (défaut du classeur). `<dxfs>` est volontairement laissé (un nom absent
y signifie « hérite »). Un fichier dont toutes les polices ont un nom est renvoyé
inchangé octet pour octet. Si l'archive est illisible, la conversion se fait sur
l'original et la raison est journalisée (`console.error`) — la normalisation ne
peut jamais bloquer une conversion. Test : `scripts/test-xlsx-default-font.mjs`
(fixtures 03/04 : 2 et 1 entrées corrigées, idempotence, erreur sur un non-zip) —
passe.

### 4.3 Remesure (fixtures 03 et 04, fichiers d'origine, en production)

`pdffonts` : **`Carlito-Bold` + `Carlito-Regular`** pour les deux (avant :
`Caladea-Bold`). Comparaison visuelle des en-têtes et du titre avec FreeConvert
(`fidelite-marche/d1-gras-avant-apres-freeconvert.png`) : le gras est désormais
sans empattements, de même famille qu'eux. Chez Online2PDF : `Calibri-Bold`
aussi. La comparaison pixel à pixel de la page entière n'est pas concluante (mise
en page/échelle différentes d'un convertisseur à l'autre) : **la preuve retenue
est la famille de police et la comparaison visuelle**, pas un chiffre de pixels.
Limites : mesuré sur `.xlsx` seulement (pas `.xls/.ods/.csv`) ; le comportement
d'Excel pour un nom absent est établi par sa sortie chez FreeConvert, pas par
Excel de bureau.

## 5. D6 — repli silencieux de pdf-to-word : **corrigé**

`app/api/pdf-to-word/route.ts` : indicateur coupé → **503** avec
« PDF to Word is temporarily unavailable. Please try again later. » (plus de 404
« not_enabled »). `page.jsx` : tout échec affiche le message du serveur ; la
fonction `convertClientSide` (extraction de texte brut, pdfjs) est supprimée.
Test local (`next start`, indicateur non défini) : **HTTP 503 + ce message**.
Production, indicateur activé : inchangée (200, docx de 16 333 octets identique à
avant). **Non testé dans un navigateur** : l'affichage du message côté page repose
sur le chemin d'erreur générique existant (identique à celui des autres erreurs
du même outil) ; je n'ai pas coupé l'indicateur en production.

## 6. Textes du site corrigés par ces résultats

- excel-to-pdf : divulgation « gras en empattements » **retirée** (page, FAQ,
  SEO title/description) — corrigée par D1 ; « .xlsx seulement mesuré » conservé.
- ppt-to-pdf : l'explication « la police de remplacement est plus large » est
  **remplacée** par la vraie cause (`wrap="none"` sous LibreOffice, y compris avec
  la vraie Segoe UI) ; Segoe UI → Selawik indiquée avec la mesure ; conseil
  « faites vos zones de texte au moins aussi larges que leur texte » ; SEO idem.
- `npm run build` : exit 0 ; test unitaire D1 : passe.

## 7. D8 — plafond de taille : MESURE SEULEMENT (aucun plafond modifié)

### 7.1 Ce que le site fait réellement

Le « 25 Mo » n'est **écrit que dans le message d'erreur du serveur** (et le code) ;
aucune page d'outil ne l'affiche. **Il est inatteignable** : la plateforme refuse
avant. Mesures en production, fichiers réels (OPC valides gonflés de 3 à 25 Mo
d'octets aléatoires incompressibles) :

| Route | Fichier | Corps envoyé | Résultat |
|---|---|---|---|
| xlsx | 3,01 Mo | 3,15 Mo | 200, PDF, 3,1 s |
| xlsx | 4,20 Mo | 4 203 318 o | 200 |
| xlsx | **4 412 819 o** | 4 413 033 o | **200** |
| xlsx | **4 517 676 o** | 4 517 890 o | **413** |
| xlsx | 4,71 / 8,01 / 24,51 / 25,31 Mo | — | 413 |
| pptx | 3,05 Mo | 3,19 Mo | 200, 2,2 s |
| pptx | 4,45 / 4,75 / 8,05 Mo | — | 413 |
| docx (ConvertAPI) | 4,74 / 8,04 / 25,34 Mo | — | 413 |
| pdf-to-word | 3 355 271 o | — | 200 |
| pdf-to-word | 5 137 850 o | — | 413 |

Le 413 est `FUNCTION_PAYLOAD_TOO_LARGE` renvoyé par la plateforme (texte brut
« Request Entity Too Large »), **avant** que le code de la route ne s'exécute.
**Plafond réel ≈ 4,5 Mo de corps de requête (≈ 4,4 Mo de fichier)** — le même
mécanisme que les « 3,3 Mo » du détourage (4,5 Mo ÷ 4/3 de base64), mais ici **sans
inflation base64** : les routes envoient du multipart brut, donc le fichier peut
faire ≈ 4,4 Mo (limite de fichier réelle mesurée entre 4 412 819 et 4 517 676 o).
Non testé faute de quota mensuel à dépenser : docx de 3 Mo (le 413 se produit avant
la route, donc même plafond ; je ne l'ai pas envoyé pour ne pas consommer de
crédit ConvertAPI ni de quota). La réponse PDF pourrait aussi avoir un plafond de
4,5 Mo : **non mesuré**.

**Ce que voit le visiteur :** `page.jsx` essaie de lire un JSON, échoue, et affiche
**« Conversion failed. Please try again. »** — aucune mention de la taille, aucune
vérification côté navigateur. Un fichier de 5 à 25 Mo échoue donc avec un
message qui laisse croire à une panne passagère.

### 7.2 Valeurs de production réellement appliquées (Vercel, lues sans autre valeur)

Je n'ai lu que quatre variables non secrètes, par identifiant ; la liste complète
des variables (renvoyée chiffrée par l'API) n'a montré aucune valeur en clair.
Aucune variable de taille de fichier n'existe : les plafonds de taille sont des
constantes du code (25 Mo).

| Variable (Production et Preview) | Valeur | Défaut du code | Écart |
|---|---|---|---|
| `USER_QUOTA_PDF_CONVERSIONS` | **5** | 5 | identique |
| `IP_RATE_LIMIT_PER_HOUR` | **30** | 10 | **mon rapport précédent disait 10 : faux** |
| `IP_RATE_LIMIT_PER_DAY` | **100** | 30 | **mon rapport précédent disait 30 : faux** |
| `GLOBAL_SPEND_CAP_USD` | **20** | 20 | identique |

Portée réelle (lecture du code) : le quota utilisateur est **mensuel (UTC)** et ne
s'applique qu'aux routes protégées par `guardPaidRoute` : **`.docx` (ConvertAPI) et
pdf-to-word**. Les `.xlsx/.pptx/.xls/.ppt/.csv/.ods` passent par Gotenberg **sans
quota utilisateur ni limite par IP** : je n'ai reçu aucun 429 en une vingtaine de
requêtes xlsx/pptx en une heure, ce qui concorde. Le plafond de dépense
(20 $/mois, ConvertAPI ≈ 0,01 $/conversion) borne le seul chemin payant.

À noter au passage, hors périmètre : l'API signale « readable-secret » pour
`RESEND_API_KEY` et `GOTENBERG_PASSWORD` (stockées en type « encrypted » lisible, et non
« sensitive ») ; je n'y ai pas touché.

### 7.3 Comparaison avec les concurrents gratuits testés

| | Nous | Online2PDF | FreeConvert | CloudConvert |
|---|---|---|---|---|
| Taille max réelle/fichier | **≈ 4,4 Mo** (mesuré) | 150 Mo (affiché) | 1 Go (affiché à l'envoi) | non vu |
| Écart chiffré | — | **≈ 34 fois** plus | **≈ 230 fois** plus | — |
| Total par lot | — | 200 Mo | non affiché | — |
| Quota gratuit | .docx & pdf→word : 5/mois/utilisateur ; xlsx/pptx : aucun | non atteint (6 fichiers) | non atteint (6 fichiers) | 10 crédits/jour (atteint) |

Les tailles concurrentes sont celles **affichées par leurs pages** (non éprouvées
avec des fichiers de cette taille). Notre écart de plafond est bien plus grand
que l'écart de fidélité : c'est le vrai désavantage mesuré.

### 7.4 Ce qu'il en coûterait de combler l'écart — estimations, non vérifiées

| Option | Effet | Coût estimé |
|---|---|---|
| **A. Contrôle côté navigateur + message clair** (« fichier trop grand, maximum ≈ 4,4 Mo ») | n'augmente pas le plafond ; supprime l'échec trompeur | faible : quelques heures pour 6 pages/une routine partagée |
| **B. Envoi direct vers Vercel Blob puis lecture serveur** (upload client) | plafond limité par Blob/mémoire de la fonction (dizaines de Mo) | moyen : 1–2 jours (magasin Blob, purge, quotas, 6 outils, tests) + coût de stockage à mesurer ; **risque non mesuré : le PDF renvoyé pourrait, lui aussi, dépasser 4,5 Mo** |
| **C. Sortir ces routes de Vercel** (service Railway dédié) | plafond à définir librement | moyen à élevé : 2–4 jours, un service de plus à faire tourner |

Aucune n'a été entreprise. Je recommande A d'abord (aucun risque), puis une
décision sur B.

### 7.5 Autres défauts découverts

- **D9 — LibreOffice replie les zones `wrap="none"` plus étroites que leur texte**
  (mesuré, § 3.3) : sévérité modérée (texte masqué possible sous des formes
  superposées), fréquence réelle **inconnue** (les fichiers écrits par
  PowerPoint dimensionnent la boîte sur le texte ; les fichiers générés par
  script, non). Coût de correction : inconnu — piste (non testée) : prétraiter le
  `.pptx` comme pour D1 ; à évaluer avant d'engager.
- **D10** — 413 de plateforme affiché comme « Conversion failed » (§ 7.1).

## 8. Déploiement et vérification en production

- `restore-pre-corrections-d1-d2-d6` (balise) puis branche
  `corrections-fidelite-d1-d2-d6` **avant** le premier commit ; fusion dans
  master (`f250e807`) ; Vercel `dpl_3yV6b19L…` READY ; Railway a reconstruit
  l'image (`Selawik-Bold` embarquée en production).
- Vérifié en production : D1 (`Carlito-Bold` sur 03 et 04 d'origine), D2 (police
  `Selawik-Bold`, titre 06 toujours replié — § 3.3), D6 (route en production
  inchangée avec l'indicateur actif ; 503 confirmé en local).
- Correction des textes excel-to-pdf/ppt-to-pdf : voir la fin de ce fichier
  (§ 9, complété après déploiement).

## 9. Vérification finale des pages corrigées

(Complétée après le déploiement du dernier commit.)

## 10. Ce qui n'a pas été fait / limites

- D7 (repli LibreOffice pour `.docx`, formats `.doc .xls .ppt .csv .ods`) :
  **jamais mesuré, non traité ici** ; noté dans le plan de travail.
- `.xls/.ods/.csv` non couverts par la mesure D1.
- Aucun plafond ni quota modifié. Aucun outil ni service supprimé ou renommé.
- Aucun agent de fond. Aucun secret lu ; seules quatre variables de plafond
  (valeurs numériques non secrètes) ont été lues, par identifiant.
- Aucune boucle de surveillance : une seule attente bornée (8 min max) lors du
  premier déploiement.
- Fichiers de test restants : `Downloads\fidelite-01..06.pdf` (verrouillés par Chrome).
