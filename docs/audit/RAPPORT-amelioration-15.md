# RAPPORT — Amélioration 15 : extracteur d'archives (zip-extractor)

**Dates :** 25-26 septembre 2026 · **Branche :** `licence-ameliorations` · **Production :** `master` = `a3e2cf56`, déploiement Vercel `dpl_B2p7hAcTs7gCT5dVvxB9ohpdHDm7` (READY, alias www.onlineconvertools.com)
**Arrêt demandé :** la 15 est en production et vérifiée ; les améliorations 13, 14, 16, 17 et la correction Opus des trois outils audio **ne sont pas commencées**.

---

## 0. En une table

| # | Demande | Verdict | Preuve |
|---|---|---|---|
| 1 | RAR de 1,99 Go encore présent ? | ❌ **disparu** (ménage du disque) → **régénéré** : `make-big-rar.mjs` (nouveau, commité : le plan ne donnait que la commande `Rar.exe`) | §1 |
| 2 | Détection de fin du test (HeaderEnc1234.rar) | ✅ **corrigée dans le test**, outil non touché ; 2 autres défauts du banc trouvés et corrigés | §2 |
| 3 | Suite complète Chromium puis Firefox | ✅ **21/21 et 20/20**, 3 passages chacun, puis sur préversion et sur www | §3 |
| 4 | Plafond réel par fichier | ✅ **mesuré** : plus bas plafond réel ≈ 1,96 Go (Chromium + 7-Zip) → **1,9 Go gardé et déclaré** ; tailles passées en unités décimales | §4 |
| 5a | Premier fichier obtenu vs ezyZip | ✅ **après 3 corrections mesurées** : www, 10 paires, médiane **5,1 s contre 7,25 s**, 8 paires sur 10 | §5 |
| 5b | Extraction complète vs ezyZip | ✅ www : **9,2-11,8 s contre 31,0-32,6 s** | §5 |
| 5c | Firefox au-delà de 2,8 Gio | ✅ **3,71 Gio sans plantage** ; ezyZip : RAR **inutilisable sous Firefox** ce jour-là (404 sur son serveur) | §5 |
| 6 | Préversion puis production, Chromium + Firefox | ✅ deux cycles complets (le second après la 3ᵉ correction de vitesse) | §6 |

---

## 1. Le RAR de 1,99 Go

Introuvable (aucun `.rar` > 100 Mo dans Temp, Bureau, Téléchargements, Documents). Régénéré par `scripts/browser-tests/make-big-rar.mjs` avec WinRAR 7.10 (`Rar.exe a -m0 -ma5`) : `big.rar` = deux fichiers aléatoires de 950 Mio, **1 992 294 664 octets**. Le script produit aussi `huge.rar` / `huge.zip` (3,98 Go, 4 × 950 Mio) et `cap.rar` / `cap.zip` (un seul fichier de taille réglable) ; les sources sont gardées pour comparer les SHA-256.

## 2. Le test, pas l'outil

- **HeaderEnc1234.rar** : l'échec était intermittent (non reproduit en 4 passages). Cause dans `waitState()` : trois `waitFor` en course puis trois lectures séparées, sans lien avec l'action qui venait d'avoir lieu. Remplacé par **une seule lecture atomique du DOM**, exigée **après un changement de la page depuis l'action** (MutationObserver armé juste avant), et seulement quand **rien ne tourne** (pas de bouton Cancel). « Listé » = ligne de statut d'une liste terminée.
- **Annulation** : 2 passages Firefox sur 3 plantaient le test — l'archive d'essai (3 Mo) finissait avant le clic sur Cancel. Nouvelle archive `slow.tar` (3 × 200 Mio, 3 lots, par `tar.exe`) : le clic arrive toujours pendant le traitement ; on vérifie qu'**aucun ZIP ne sort** et que l'archive se rouvre.
- **Générateur d'essais** non rejouable : WinRAR complétait les volumes existants avec de nouvelles données → faux échecs. Les anciens volumes sont supprimés avant.

## 3. Suites

`scripts/browser-tests/zip-extractor.mjs` : RAR WinRAR (noms chinois, CRC de WinRAR), RAR à en-têtes chiffrés (mauvais puis bon mot de passe), 7z AES noms chiffrés, 7z données seules chiffrées (mot de passe demandé à l'extraction), ZIP AES-256 et ZipCrypto, 7z découpé complet/incomplet, RAR5 chiffré 3 volumes (WinRAR), ZIP `.z01/.z02`, CAB/LZH/7z-bzip2 de libarchive comparés à `tar.exe`, non-archive, téléchargement d'un seul fichier, ZIP écrit en flux (`showSaveFilePicker`, Chromium), annulation.
Local (build de production) : **Chromium 21/21 ×3, Firefox 20/20 ×3**. Même résultat sur les deux préversions et sur www (§6).

## 4. Plafond par fichier

Un seul fichier par archive, son propre Download, SHA-256 contrôlé (`zip-extractor-cap.mjs`, plafond relevé **dans une build locale seulement**, jamais commitée) :

| Fichier unique | Chromium 7-Zip (RAR) | Chromium zip.js | Firefox 7-Zip | Firefox zip.js |
|---|---|---|---|---|
| 1,9 Go | ✅ | ✅ | ✅ | ✅ |
| 2,1 Go | ❌ tronqué à 1,83 Gio | ✅ | ✅ | ✅ |
| 2,2 Go | ❌ | ❌ | ❌ « Blob … larger than 2 GB » | ✅ |
| 3,0 Go | ❌ | ❌ | ❌ | ✅ |

Chaque échec est un **message**, jamais un onglet planté. Plafond réel le plus bas ≈ 1,96 Go → **1,9 Go gardé**, déclaré comme ailleurs (ligne sous le titre, FAQ, « too large » par fichier). Revérifié après la préallocation (§5) : 1,9 Go intact partout.
**Corrigé en route :** les tailles listées étaient en Gio étiquetés « GB » (un fichier de 1,9 Go s'affichait « 1.77 GB », donc un fichier affiché « 1.85 GB » aurait été refusé sous une limite annoncée « 1.9 GB ») ; tout est en unités décimales, comme la limite et comme ezyZip.
**Non mesuré :** le plafond mobile (300 Mo) — aucun appareil mobile réel.

## 5. Comparaison avec ezyZip — même RAR de 1,99 Go

### Comment ezyZip s'y prend (lu dans son code client public, 25/09)
Son Worker RAR charge **unrar de RARLAB compilé en WebAssembly** (`rar-stream.wasm`, version du 22/09/2026), liste d'abord, extrait un fichier à la demande **en mémoire ou en flux dans OPFS**, et ne chevauche **pas** extraction et téléchargement. Sans `showSaveFilePicker`, il plafonne chaque fichier à 2 Gio.

### Premier fichier obtenu — trois corrections, chacune mesurée avant d'être faite
Banc d'essai dans le navigateur (même 7-Zip servi par notre page, fichier de 950 Mio stocké) :
1. **7 612 lectures `FileReaderSync` de 128 Ko** : c'était l'essentiel du temps. Lecture anticipée de 16 Mo → extraction **10 s → 4,2 s** (Chromium), 8,5 → 6,7 s (Firefox). 64 Mo n'apportent rien de plus.
2. **Fichier en mémoire qui grandit par 1/8 en se recopiant** (~9 copies) puis `readFile` : allocation unique à la taille connue par la liste, Blob pris sans copie → **4,8 s → 2,05 s** (plancher sans rien écrire : 1,83 s) ; Firefox 7,0 → 4,7 s.
3. **Mesuré sur www (26/09), 10 paires en alternant l'ordre : médiane 9,1 s contre 8,2 s — encore en dessous.** Décomposé par phases : liste 0,9 s contre 0,45 s (notre moteur ne se chargeait qu'au choix du fichier), extraction 3,0-3,2 s contre 4,4-4,6 s, écriture du téléchargement par le navigateur 3,2-4,6 s contre 3,7-4,3 s (même mécanisme, bruit du disque). → **7-Zip chargé pendant que la page est inactive** (un seul chargement partagé si l'archive arrive pendant ; vérifié).

**Écarté par la mesure :** sortie de 7-Zip écrite en flux dans OPFS (le moyen d'ezyZip pour les gros fichiers) — aucun gain de temps (8,5 s dans les deux cas).
**Piège de mesure identifié :** le premier passage à froid est lent pour le premier site mesuré, quel qu'il soit (cache disque de Windows : ezyZip 12,0 s quand il passe en premier), d'où l'alternance de l'ordre.

**Résultat final sur www (production 2, 26/09), 10 paires en alternant l'ordre, contenu identique à chaque fois :**

| | Nous | ezyZip |
|---|---|---|
| Médiane | **5,1 s** | 7,25 s |
| Valeurs | 4,9 · 4,9 · 5,0 · 5,0 · 5,0 · 5,2 · 5,4 · 5,5 · 7,7 · 13,7 | 6,1 · 6,2 · 6,6 · 6,9 · 7,2 · 7,3 · 7,5 · 8,3 · 14,1 · 16,3 |
| Paires gagnées | **8 / 10** | 2 / 10 |

Avant les corrections (25/09, local) : 13,5 / 22,5 / 13,3 s contre 14,9 / 6,5 / 6,3 s.

### Extraction complète
« Save all to a folder » (nous) contre « Save All » (ezyZip), un vrai dossier sur disque des deux côtés (OPFS d'un profil persistant), chaque fichier relu et vérifié par SHA-256 ; fin chez ezyZip = tailles complètes **et** plus de `.crswap` (il préalloue ses fichiers).

| | Nous | ezyZip |
|---|---|---|
| Local (25/09) | 9,0 · 9,5 · 10,5 s | 30,4 · 32,5 · 27,3 s |
| Préversion 2 | 13,9 · 10,2 s | 35,1 · 34,8 s |
| **www (production 2)** | **11,8 · 9,8 · 9,2 s** | 32,6 · 31,3 · 31,0 s |

Les deux fichiers identiques à chaque passage, des deux côtés. (Premier essai : ezyZip échouait au 2ᵉ fichier — **artefact de mon banc**, un contexte Playwright est un profil privé dont l'OPFS en mémoire a un petit quota ; corrigé par un profil persistant, ezyZip réussit alors.)

### Firefox au-delà de 2,8 Gio
- **Nous** (`zip-extractor-huge.mjs`, huge.rar et huge.zip, 3,98 Go) : les 4 fichiers téléchargés l'un après l'autre (**3,71 Gio**), tous identiques, onglet réactif après chacun, **aucun plantage** (l'ancienne version se figeait à 2,8 Gio). « Download all as ZIP » refuse au-delà de 1,9 Go sous Firefox (il faudrait tenir le ZIP en mémoire) et dit quoi faire : fichiers un par un, ou Chrome/Edge qui écrivent le ZIP en flux sur disque.
- **ezyZip sous Firefox, 26/09 :** ne peut ouvrir **aucun RAR**, pas même 5 Ko — « File Error ». Vérifié dans le Firefox de Playwright **et dans Firefox 156.0.1 officiel** (piloté par WebDriver BiDi) : ses Workers RAR et 7-Zip importent `/assets/shared-utils-446fc9cf.js`, **404 sur son serveur, confirmé aussi par curl** (26/09, 02:28 UTC). Sa page ZIP n'a pas réagi dans mon banc Firefox, même avec un petit ZIP : **non concluant, rien n'est affirmé là-dessus.**

## 6. Préversions et production

Accès aux préversions protégées sans les ouvrir : jeton OIDC de `vercel link` (Trusted Sources, `x-vercel-trusted-oidc-idp-token`) posé **seulement sur les requêtes vers notre origine** (`vercel-preview-auth.mjs`) ; sous Firefox, l'interception Playwright n'atteint pas les requêtes d'un Web Worker (« NetworkError » dès le plus petit ZIP) → mandataire local qui ajoute le jeton côté serveur (`vercel-preview-proxy.mjs`). Le jeton ne va jamais à un tiers. (Le connecteur Vercel demandait une reconnexion : la CLI a servi.)

- **Préversion 1** `dpl_4Xor27Hz…` puis **production 1** `dpl_5AHufDmm…` (`9971e361`) : suites 21/21 et 20/20, 1,9 Go intact partout, 3,71 Gio sous Firefox. C'est sur www que le premier fichier est apparu **encore en dessous** (médiane 9,1 contre 8,2 s) → correction 3.
- **Préversion 2** `dpl_ojUdUbUM…` : suites 21/21 et 20/20 ; premier fichier, 10 paires : **médiane 5,2 s contre 6,75 s**, 8 paires gagnées sur 10 ; extraction complète 13,9 / 10,2 s contre 35,1 / 34,8 s ; 1,9 Go Chromium 17,1 s et Firefox 16,6 s, identiques ; huge.rar Firefox sans plantage (59 s).
- **Production 2** `dpl_B2p7hAcT…` (`a3e2cf56`) : suites **21/21** (Chromium) et **20/20** (Firefox) ; premier fichier et extraction complète ci-dessus ; 1,9 Go : Chromium RAR 12,2 s, ZIP 18,0 s, Firefox RAR 16,3 s, ZIP 23,3 s, **tous identiques** ; huge.rar sous Firefox, 3,71 Gio téléchargés un à un, identiques, **aucun plantage** (58 s).

## 7. Ce qui reste vrai et non fait

- **Sous Firefox (et Safari), « Download all as ZIP » est plafonné à 1,9 Go** et « Save all to a folder » n'existe pas (pas d'API de dossier) : au-delà, fichiers un par un. Moyen connu pour lever ce plafond : un téléchargement en flux par Service Worker. Non fait ; ezyZip ne peut pas servir de référence sous Firefox ce jour-là.
- **Non mesuré :** Safari / iPhone, appareils mobiles réels (plafond mobile 300 Mo), ezyZip ZIP sous Firefox.
- Mesures faites depuis ce poste (disque et connexion de bureau) ; l'écriture du téléchargement par le navigateur, identique des deux côtés, est la part la plus bruitée.

## Commits

`9d51b764` test (étapes 1-3) · `13a18b29` plafond + unités · `fb694073` lecture anticipée + préallocation · `bfe899ac` comparaison + Firefox 3,98 Go · `30ddfdba` accès préversion · `9971e361` mandataire, préversion vérifiée · `a3e2cf56` 7-Zip chargé au repos · (ce rapport).
