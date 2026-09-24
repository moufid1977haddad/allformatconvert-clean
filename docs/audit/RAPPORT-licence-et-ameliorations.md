# RAPPORT — Licence de l'agrandisseur, coût réel d'une image, trois vérifications, améliorations 7 à 17

**Dates :** 23-24 septembre 2026 · **Branche :** `licence-ameliorations` (balise `restore/avant-licence-ameliorations`, base `f14e8ce6`)
**Arrêt demandé par le propriétaire (limite de session) — voir « Où j'en suis » en fin de rapport.**

---

## 0. En une table

| # | Demande | Verdict | Preuve |
|---|---|---|---|
| 1 | Licence du modèle MoSR (« CC-BY-0.4 ») | ✅ **CC BY 4.0 établie** par la déclaration structurée de l'auteur | §1 |
| 2 | Coût réel d'une image | ✅ **0,0048-0,0068 $** mesuré ; réservation corrigée au vrai pire cas (0,03 $) | §2 |
| 3a | Fils de calcul du détourage | ✅ **confirmé et corrigé : ×12 sur l'inférence** | §3a, production |
| 3b | Compression SVG | ✅ **construite**, égale à iLoveIMG, et mieux (contrôle de rendu) | §3b, production |
| 3c | Qualité de l'Opus natif | ⚠️ **non inférieure selon ViSQOL** ; contredit par la doc ffmpeg ; pas corrigé | §3c |
| 4 | Ménage | ✅ `next-env.d.ts` restauré, serveur de dev arrêté | — |
| 5 | Améliorations 7-17 | ✅ **8, 10, 7, 11, 12 faites** · ⬜ 9, 13-17 non commencées | §5 |

**En production (`master` = `609ee9bc`, Vercel READY, vérifié Chromium + Firefox sur www) :** points 1-3b, améliorations 8, 10, 7.
**Commité, poussé sur la branche, PAS encore en production :** améliorations 11 (`2970ca27`) et 12 (`30fb66f5`).

---

## 1. Licence du modèle d'agrandissement — établie

- **Dépôt GitHub `Phhofm/models`** : **aucun fichier de licence** (`license: null` à l'API). La mention n'existe que dans le texte des versions.
- **Chronologie des 120 versions** (API GitHub) : « CC BY 4.0 » jusqu'en avril 2024 (57), puis **« CC-BY-0.4 » de mai à novembre 2024 (24)**, puis « CC-BY-4.0 » dès décembre 2024. Le modèle pré-entraîné dont dérive le nôtre (`4xmssim_mosr_pretrain`) porte la même mention, du même auteur.
- **La preuve décisive — Hugging Face `Phips/4xNomos2_hq_mosr`** : compte de Philip Hofmann (son profil renvoie à `github.com/phhofm` et à OpenModelDB « Helaman »). Le champ structuré est **`license: cc-by-4.0` dès le commit initial (2024-10-09)** : la licence a été choisie dans le menu, pas recopiée d'un texte. **110 de ses 122 dépôts HF** portent `cc-by-4.0`, **dont chacun des modèles marqués « CC-BY-0.4 » vérifiés** (atd, dat2, drct-l, AoMR).
- **OpenModelDB** enregistre le modèle en **CC-BY-4.0** (tout en recopiant le « 0.4 » dans sa description).
- Aucune question de licence n'a été posée dans le dépôt (0 ticket).
- **Architecture MoSR : MIT** (vérifié au chantier précédent).
- **Risque résiduel, non spécifique :** le jeu d'entraînement **Nomos-v2** n'a pas de licence publiée. Ce risque vaut aussi pour le repli Real-ESRGAN, entraîné sur DIV2K (réservé à la recherche) : ce critère ne distingue donc pas les deux modèles.
- **Repli déjà chiffré** (chantier précédent, même photo) : Real-ESRGAN x4plus (BSD-3), LPIPS 0,173 contre 0,107 pour MoSR et 0,164 pour iLoveIMG. Environ 3,3× plus lent (45,8 s contre 14,0 s en local, soit environ 115 s par Mpx sur Railway et environ 0,0066 $/image). **Rien n'a été basculé.**
- **Code :** la docstring de `services/background-removal/app/upscale.py` cite désormais cette preuve. La page crédite déjà l'auteur et la licence CC BY 4.0.

**Message à l'auteur, prêt à envoyer** (discussion sur `huggingface.co/Phips/4xNomos2_hq_mosr/discussions`, ou ticket sur `github.com/Phhofm/models/issues`) :

> Hi Philip, thank you for 4xNomos2_hq_mosr — we use it (unmodified official ONNX export) in the free online image upscaler at onlineconvertools.com, with attribution on the tool page.
> The GitHub release notes for this model (and for ~24 releases from May to Nov 2024, e.g. 4xmssim_mosr_pretrain) say "License: CC-BY-0.4", which is not an existing Creative Commons licence, while the Hugging Face card metadata and OpenModelDB say CC-BY-4.0. Could you confirm that the intended licence is CC BY 4.0 (commercial use allowed with attribution)? If so, correcting the release text would also help others.
> Also, is there any licence restriction on the Nomos-v2 training data that we should be aware of?
> Thanks a lot, and for all your models. — Moufid Haddad, onlineconvertools.com (contact@onlineconvertools.com)

## 2. Coût réel d'une image générée

- **Tableaux de bord OpenAI et Supabase : non lus.** Aucune session n'était ouverte dans le Chrome connecté, et je ne peux pas me connecter à votre place. La règle « service_role jamais dans l'environnement de l'agent » exclut aussi le script.
- **Moyen retenu, sans secret :** 4 images **sur préversion** (règle 8), avec lecture immédiate, par le connecteur Vercel, de la ligne `[openai-image]`. Elle contient les jetons que renvoie OpenAI, qui sont ceux qu'il facture. Tarif officiel relu : 5 $/M jetons texte en entrée, 30 $/M en sortie image.

| Taille (qualité « low ») | Jetons entrée / sortie | Coût |
|---|---|---|
| 1024×1024, consigne courte | 20 / **196** | **0,00598 $** |
| 1024×1536 et 1536×1024 | 20 / **158** | **0,00484 $** |
| 1024×1024, consigne de 1 000 caractères (anglais) | 180 / 196 | **0,00678 $** |

- **L'estimation (≈ 0,006 $) était juste.** Le nombre de jetons de sortie est fixe pour une taille donnée.
- **Budget de 5 $/mois ≈ 740 à 1 030 images** selon la taille et la longueur de la consigne.
- **Un visiteur seul ne peut pas l'épuiser.** Il a droit à 5 images par jour et par IP, soit au plus 155 par mois, environ 1,05 $. `x-forwarded-for` est écrasé par Vercel (documentation lue), et le domaine comme `*.vercel.app` n'ont **pas d'IPv6** (aucun enregistrement AAAA) : pas de rotation d'adresses dans un bloc /64. Épuiser le budget demande au moins 5 IPv4 distinctes pendant tout le mois. Le budget propre de 5 $ borne de toute façon la perte.
- **Réservation corrigée au vrai pire cas.** Un jeton BPE couvre au moins un octet, donc 1 000 caractères valent au plus 4 000 octets UTF-8 (emoji, écritures CJK), soit 4 000 jetons. Le pire cas est 4 000 × 5 $/M + 196 × 30 $/M = **0,0259 $**, au-dessus de l'ancienne réservation de 0,02 $. **Nouvelle réservation : 0,03 $** (`lib/quota/config.js`, calcul en commentaire). Tests en mémoire 6/6.
- Coût de la mesure : ≈ 0,024 $.

## 3a. Détourage — fils de calcul : confirmé, corrigé, en production

- L'essai du 14/09 avait comparé le défaut (48 fils) à **2** fils, jamais à 8. Le quota réel du conteneur est de 8 vCPU (cgroup). gunicorn sert 4 requêtes en parallèle, chacune avec 48 fils.
- **Mesure A/B/A sur Railway**, même photo (1335×2000), requêtes réelles depuis une préversion (`railway ssh` exigeait une clé SSH, que je n'ai pas générée : c'est un secret) :

| Réglage | Inférence seule | 4 simultanées : requête la plus lente (client) |
|---|---|---|
| A — défaut (48 fils) | 3,6-4,7 s | 14,6 s |
| **B — 8 fils** | **0,25-0,41 s** | **2,5 s** |
| A′ — retour au défaut | 3,0-4,5 s | 19,3 s |

- **Correctif (code) :** `infer.load_session` utilise `container_cpus()` (le quota du cgroup), avec un seul fil inter-opérations. La fonction a été déplacée dans `infer.py` et est partagée avec l'agrandisseur. Les variables `ORT_*` gardent la main si elles sont définies (« 0 » = défaut d'ONNX Runtime). Tests de logique 4/4. La ligne de démarrage affiche `cgroup_cpus`.
- **En production :** les variables 8/1 ont été posées pendant la mesure, puis le code a été déployé depuis `master`. **Les variables sont ensuite supprimées**, et la dernière ligne de démarrage lue (24/09 23:58) montre `cgroup_cpus=8 ORT_INTRA_OP_THREADS=(unset)`. C'est le code qui choisit, et le nouveau champ prouve que le nouveau code tourne (corollaire 4).
- Constat au passage : le 14/09, l'inférence mesurait 0,6 s, et le 23/09 elle mesurait 4,3 s avec le même réglage. Le défaut s'était aggravé, probablement à cause d'une charge de l'hôte différente (non établi).

## 3b. Compression SVG — construite, en production

- **Moyen d'iLoveIMG, lu dans sa sortie sur Tux.svg :** préréglage par défaut de SVGO (identifiants `a`, `g`, `h`, nombres raccourcis, groupes fusionnés, une seule ligne, toujours du vecteur). **Leur fichier : 35 973 o ; SVGO 4.1 par défaut : 35 969 o.**
- **iLoveIMG refuse une vraie carte Illustrator** (« fichier endommagé ») que nous compressons de **−45 %**.
- **Construit (`image-compressor`) :** SVGO (MIT) dans le Worker, en un passage et en plusieurs passages, le plus petit résultat gardé. Avant, un SVG faisait **échouer** l'outil.
- **Mieux que la référence — contrôle de rendu.** La page dessine l'original et le résultat (fonds blanc et noir) et refuse tout écart de 64 niveaux ou plus, après tolérance à l'anticrénelage (voisinage 3×3). Étalonnage mesuré dans Chromium et Firefox (`svg-check-calibration.mjs`, qui échoue en cas de dérive) :
  - le PSNR ne convient pas : retirer une petite forme donne encore 53,9 dB ;
  - le maximum brut par pixel non plus : une sortie correcte monte à 73 niveaux dans les navigateurs ;
  - avec la tolérance au voisinage, les sorties correctes restent **≤ 59** et les formes supprimées vont de **72 à 145** ;
  - seule limite : un filet de 3 pixels (37-39) passe inaperçu.
- **Défaut réel attrapé :** sur le logo W3C, SVGO déplace une lettre (conversion en arcs), avec un écart de 115. La **variante prudente** est alors choisie (−4 %, et c'est dit). Un SVG déjà optimisé est gardé, avec un message distinct.
- **Détection SVG** tolérante aux longs DOCTYPE d'Illustrator (le logo Wikipédia était refusé à tort : corrigé, −33 %).
- **Production, Chromium :** Tux −28 %, carte −45 %, logo W3C −4 % (variante prudente). Photo JPEG non régressée.

## 3c. Opus des trois autres outils audio — mesuré, non corrigé

- Audio Booster et Audio Splitter encodent en Opus natif à **96 kb/s par défaut** (débit constant exact) ; Audio Compressor au débit choisi.
- **Mesure :** sorties **des vrais outils** (Chromium) contre libopus (opus-tools officiel de Xiph, **libopus 1.3-rc2**, archive.mozilla.org, SHA-256 `84e643f1…`), **à taille de fichier égale** (±0,5 %). Extraits de 20 s de deux morceaux CC BY-SA (Wikimedia), notés par ViSQOL en mode audio (portage Python `visqol-python` 3.8.0, utilisé seulement pour mesurer) :

| MOS-LQO | 64k natif / libopus | 96k | 128k |
|---|---|---|---|
| Instrumental | **4,453** / 4,382 | **4,512** / 4,426 | **4,665** / 4,544 |
| Chanté | **4,437** / 4,220 | **4,526** / 4,433 | **4,665** / 4,550 |

- **ViSQOL ne montre aucune infériorité, au contraire.** Mais **la documentation officielle de ffmpeg** dit que l'encodeur natif (CELT seul) est « généralement moins bon, au mieux égal ». ViSQOL récompense la fidélité de forme d'onde et pénalise les procédés psychoacoustiques de libopus. **Aucune seconde métrique disponible** (PEAQ non installable ici).
- **Décision : pas de correction** (consigne : « corrige si elle est en dessous », et ce n'est pas prouvé). **Pour trancher définitivement :** une écoute ABX à l'aveugle par le propriétaire (les fichiers se régénèrent avec `scripts/browser-tests/opus-native-outputs.mjs`), ou une mesure PEAQ/ViSQOL C++ officielle. Le correctif, s'il faut le faire, est connu : encoder l'Opus sur le service (libopus), comme Audio Converter.

## 5. Améliorations 7 à 17

**Ordre suivi et pourquoi :**
- **8** d'abord : les seuls écarts restants qui rendaient un **résultat faux sans le dire** (leçon ⑪), et le moins cher.
- **10** ensuite : l'outil dépendait d'une API qui pouvait s'éteindre (corollaire 3).
- **7** et **11** : outils très demandés, dont les manques de fonctions étaient les plus visibles.
- **12** : outil très utilisé, qui n'offrait que 4 formats.

### 8 — Outils texte ✅ (production)
- **Moyen des références, mesuré sur les mêmes entrées :**
  - wordcounter.net découpe sur les espaces : deux phrases japonaises = **1** mot, emoji famille = 8 caractères, 13 mots et 5 phrases sur la phrase-test ;
  - convertcase.net met une majuscule à chaque phrase, rend « I », et garde une **liste** de sigles.
- **Nous :** `Intl.Segmenter` plus une liste d'abréviations : **18 mots, 77 caractères, 6 phrases**, identiques sous Chromium et Firefox (Firefox marquait des kana comme non-mots : corrigé).
- Sentence case ne mettait qu'**une seule** majuscule pour tout le texte. Il traite désormais chaque phrase, et décide « criée ou sigle » phrase par phrase.
- Title Case (petits mots en minuscules, O'Neil, Well-Known) ; « Capitalized Case » ajouté pour l'ancien comportement.
- L'inversion ne casse plus emoji, drapeaux ni accents ; l'inversion des mots se fait ligne par ligne.
- Tests : unitaires 8/8, navigateur 7/7 (Chromium + Firefox, production).

### 10 — Convertisseur de devises ✅ (production)
- Sources vérifiées en direct :
  - l'URL v4 n'a plus ni conditions ni documentation ;
  - **`open.er-api.com/v6`** est l'accès libre documenté : 166 devises, mise à jour quotidienne avec date de la suivante, **usage commercial permis, attribution exigée** (lien ajouté) ;
  - Frankfurter v1 : 29 devises et en-tête `Deprecation`.
- Résultat : **166 devises au lieu de 24**, noms complets, format propre à chaque devise (yen sans décimales), taux unitaire et inverse.
- **Écart avec la BCE : 0,055 %.** Tests 6/6 (Chromium + Firefox, production).

### 7 — Découpage PDF ✅ (production)
- Modes **gratuits** d'iLovePDF, relevés sur sa page : plages personnalisées (fusion possible), toutes les N pages, chaque page, pages choisies (fusion possible). ZIP ajouté.
- **Résultat faux silencieux corrigé :** « 5-3 » ou « abc » donnaient un PDF **vide** annoncé comme réussi. C'est désormais refusé avec la raison, avant tout traitement. Le nombre de PDF est annoncé avant le découpage.
- Meta description tronquée (« (e.g. ») corrigée.
- **Pire cas mesuré** (chaque page d'un PDF texte de 2 000 pages à polices partagées) : 363 Mo produits, 591 Mo de pic, 211 s. La page l'annonce au-delà de 500 fichiers.
- Tests : unitaires 7/7, navigateur 8/8 (Chromium + Firefox, production).

### 11 — Générateur de QR ✅ (branche, pas en production)
- Référence QRCode Monkey : types, couleurs, logo, correction d'erreur, PNG/SVG/PDF/EPS, sans vérification de lecture.
- **Nous :**
  - 8 types : URL, texte, e-mail, téléphone, SMS, Wi-Fi (format ZXing échappé), vCard 3.0, lieu ;
  - 200 à 2 000 px ; carrés, arrondis ou points ; logo jusqu'à 2 Mo (niveau H forcé) ; PDF vectoriel ;
  - zone de silence de 4 modules (norme ; l'ancien outil en laissait 2).
- **Mieux que la référence :** chaque code est **décodé (jsQR) et n'est proposé que s'il rend exactement le contenu saisi.** Clair sur sombre et contraste < 3:1 sont refusés.
- **Défaut attrapé par cette relecture :** en points, seuls les yeux étaient pleins et le code ne se lisait pas. Tous les motifs de fonction sont désormais pleins.
- Tests : unitaires 5/5, navigateur **11/11** (Chromium + Firefox, local). Chaque PNG et SVG est relu **indépendamment** côté Node, accents, chinois et emoji compris.

### 12 — Convertisseur d'images ✅ (branche, pas en production)
- Sorties **GIF, BMP, TIFF, ICO, PDF** ajoutées (offertes par CloudConvert et Convertio).
- **GIF :**
  - le « Floyd-Steinberg » d'`image-q` a été **mesuré identique au pixel à « sans tramage »** (et un objet JS par pixel : 30 Mpx n'aboutissait pas) ;
  - tramage réécrit sur tableaux typés : **30 Mpx en 3,5 s (Chromium) / 7,2 s (Firefox)** ;
  - 42,68 dB vu à travers un flou σ=1, contre 42,40 ; transparence 1 bit conservée.
- **TIFF :** `utif2` déclarait l'alpha **prémultiplié** pour des données qui ne l'étaient pas, ce qui assombrissait les bords (43,6 dB). Corrigé : **77 dB, comme le PNG issu de la même toile.**
- BMP 24 bits sans perte ; ICO 16 à 256 px, chaque entrée un vrai PNG ; PDF d'une page à la taille de l'image.
- Chaque sortie est vérifiée par sa signature. Un signal de vie du Worker empêche le chien de garde de 20 s de prendre un long encodage pour un blocage.
- Tests navigateur 8/8 (Chromium + Firefox, local).

### Non commencées
- **9** hash-generator ;
- **13** grammar-fixer (surlignage) ;
- **14** barcode-generator ;
- **15** zip-extractor ;
- **16** unit/color-converter ;
- **17** gif-maker, qr-scanner, audio-trimmer.

## 6. Ce que ce rapport ne prouve pas

- Safari réel et iPhone (bloquant 9) pour toutes les pages modifiées.
- Coût d'image lu dans le tableau de bord OpenAI : non fait (pas de session). Les jetons, eux, viennent de la réponse d'OpenAI.
- Opus natif face à libopus : pas de seconde métrique.
- GIF face à CloudConvert (ImageMagick) sur le même fichier : non mesuré (quota gratuit de 10 par jour).
- QR : relu par jsQR, pas par un vrai appareil photo de téléphone.

## 7. Écarts et erreurs de ma part

- Plusieurs `sed` ont cassé des lignes de scripts de test (barres obliques, regex). Tous ont été repris à l'outil d'édition et **attrapés par les tests eux-mêmes**, avant tout commit.
- Le premier « blocage » du GIF de 30 Mpx était **mon fichier d'essai** : 30,02 Mpx, au-dessus du plafond, donc refusé à juste titre par l'outil.
- La première fusion vers `master` a été interrompue (refus d'outil, par accident). Elle a été refaite après vérification de l'état réel.

## Où j'en suis

- **Fait et en production** (`master` = `609ee9bc`, Vercel READY, vérifié Chromium + Firefox sur www) : points 1, 2, 3a, 3b, 4 ; améliorations **8, 10, 7**. Railway (service d'images) sur le nouveau code, variables `ORT_*` supprimées et prouvées absentes.
- **Fait, commité et poussé sur `licence-ameliorations`, PAS en production :** amélioration **11** (`2970ca27`) et **12** (`30fb66f5`), testées en local seulement (Chromium + Firefox).
- **En cours :** rien. Arrêt propre entre deux tâches, avant de commencer la n° 9.
- **Non versionnés, volontairement :** `scripts/browser-tests/opus-native-outputs.mjs` (outil de mesure du §3c, à commiter à la reprise si l'écoute ABX est faite) ; `scripts/browser-tests/pdf-compress-remote.mjs` (hérité du chantier précédent, non examiné).
- **Toute première action à la reprise :**
  1. créer un lien de préversion pour le dernier déploiement de `licence-ameliorations` (connecteur Vercel `get_access_to_vercel_url`) ;
  2. lancer `scripts/browser-tests/qr-generator.mjs <lien> public/og-image.png` et `scripts/browser-tests/image-converter-formats.mjs <lien> <photo> <png transparent> <photo 29,9 Mpx>` ;
  3. si tout est vert, avancer `master` en avance rapide et pousser, puis revérifier sur www ;
  4. ensuite, améliorations **9 → 15 → 14 → 16 → 13 → 17**, avec la même méthode.
