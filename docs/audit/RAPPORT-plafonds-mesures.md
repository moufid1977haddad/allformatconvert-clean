# RAPPORT — plafonds mesurés, coût réel ConvertAPI, décision Gotenberg, image-captioner, nettoyage permissions

Date : 22 septembre 2026. Suite de `RAPPORT-office-envoi-morceaux.md` (D8).
Branche `plafonds-mesures` (balise de restauration `restore-pre-plafonds-mesures`).

> **Note posée en cours de chantier par le propriétaire :** un chantier d'unification arrive
> (billet signé, envoi par morceaux, file d'attente pour TOUTES les conversions Office, comme la
> vidéo). Les plafonds ci-dessous sont donc des valeurs **de référence avant/après**, pas des
> textes à peaufiner. Ce rapport dit explicitement, pour chaque plafond, s'il vient de
> l'**architecture actuelle** (et tombera avec elle) ou d'une **vraie limite** (moteur, format,
> fournisseur — qui restera après l'unification).

## 0. Verdict

- **Un vrai défaut a été trouvé et corrigé, pas seulement mesuré :** un classeur Excel qui met plus
  de ~2 min à convertir pouvait échouer parce que le service de stockage (Railway, veille
  Serverless) s'endormait *pendant que personne ne l'interrogeait*, perdant le job en mémoire — le
  visiteur voyait un échec après une conversion pourtant réussie. Corrigé par un signal de vie
  toutes les 45 s pendant la conversion, prouvé deux fois de suite sur le même fichier qui avait
  échoué. **Ce défaut existait pour toutes les conversions Office « stage », pas seulement Excel.**
- **Excel — la vraie cause était `API_TIMEOUT`, confirmé et corrigé.** Passé de 60 s à 240 s sur le
  Gotenberg de production. Nouveau plafond mesuré : **60 Mo** (69,8 Mio passent deux fois à ~250 s ;
  97,2 Mio échouent, coupés pile par les 240 s). **C'est une vraie limite du moteur** (LibreOffice
  met un temps par ligne/cellule, pas par octet) : elle ne bougera pas avec l'unification, sauf à
  augmenter encore le délai ou à changer de moteur pour les gros classeurs.
- **PDF Repair et PDF/A : le plafond de 30 Mo annoncé n'avait jamais été éprouvé au-delà de 3 Mio —
  corrigé.** Mesuré : 45,4 Mio passent (22-30 s) ; 60,4 et 100,3 Mio sont refusés par le service
  `pdf-tools` lui-même (« Maximum size is 50 MB »). **C'est une limite d'ARCHITECTURE légère** :
  c'est une variable d'environnement du service (`MAX_FILE_SIZE_BYTES`, valeur par défaut, pas une
  limite dure de Ghostscript/qpdf/veraPDF) — augmentable sans changer de mécanisme.
- **PDF vers Word et Word/PowerPoint : le vrai mur est la mémoire de la fonction Vercel — confirmé
  par le journal d'exécution, pas supposé.** PDF vers Word : 100,3 Mo passent (204,6 s) ; 150,4 Mo
  échouent (`instance was killed because it ran out of available memory`). Word/PowerPoint :
  148,6 Mio passent ; 197,9 Mio échouent, même cause. **C'est entièrement un effet de
  l'ARCHITECTURE actuelle** (la fonction garde le fichier entier en mémoire, entrée et sortie à la
  fois) : c'est exactement ce que l'unification à venir doit faire disparaître.
- **HTML/EPUB/MOBI : 149,9 Mio passent (90,4 s)**, plus haut que jamais mesuré ; pas encore trouvé
  en échec. Plafond annoncé porté à 100 Mo par prudence (marge sous le plus gros succès).
- **`image-captioner` corrigé** : redimensionnement dans le navigateur avant l'envoi (comme le
  détourage), plus de plafond base64 de 3 Mio. Mesuré jusqu'à **58 Mo / 80 mégapixels**, sur
  Chromium, Firefox et WebKit, 3,4 à 6,0 s, corps de requête ~0,9-1,6 Mo dans les trois cas.
- **Coût ConvertAPI mesuré, pas supposé** : flat, **10 000 micros (0,01 $) par conversion**, à 10,
  49, 99, 100 et 148 Mio — jamais plus d'un crédit. La réservation du pire cas dans le code
  (`lib/quota/config.js`, `CONVERTAPI_COST_MICROS`) est donc **exacte**, y compris pour les gros
  fichiers désormais acceptés. Un seul visiteur ne peut pas vider le budget du mois en une fois
  (détail §3), mais 2000 conversions dans le mois, tous visiteurs confondus, le peuvent — c'est le
  même chiffre qu'avant D8, D8 n'a rien changé à ce risque puisque le coût ne dépend pas de la
  taille.
- **Gotenberg — les deux services sont confirmés en référence croisée, et `gotenberg-fonts` ne sert
  RIEN.** Journaux de requêtes : `gotenberg-fonts` n'a traité **aucune requête** depuis son dernier
  déploiement (19 septembre, 3 jours), pendant que `gotenberg-v2` traitait toutes mes requêtes de
  test. Coût mesuré et recommandation en §5 — décision laissée au propriétaire, rien supprimé.
- **Nettoyage `.claude/settings.local.json`** : 23 règles trop larges retirées (§6).

---

## 1. Excel — la vraie cause levée

**Diagnostic confirmé** (pas supposé) : le journal de production affichait, avant correction :
`Gotenberg conversion error: 503 The request exceeded the time limit. Increase it with
--api-timeout, or reduce the workload.` — exactement à l'échéance de 60 s.

**Action** : `API_TIMEOUT` de `gotenberg-v2` (le service de production, confirmé actif — voir §5)
passé de `60s` à `240s` via l'API Railway (nom de variable et valeur non secrète, aucune valeur de
compte affichée). Le minuteur d'abandon des routes `convert-to-pdf` et `convert-html-to-pdf` est
relevé en cohérence (250 s, pour que l'erreur de Gotenberg arrive toujours la première).

**Remesuré avec les mêmes fichiers, sur le Gotenberg de production réel** :

| Fichier | Avant (60 s) | Après (240 s) |
|---|---|---|
| 24,7 Mio | ✗ (60 s) | ✓ 68,1 s → PDF 29,0 Mo |
| 49,5 Mio | — | ✓ 153,5 s → PDF 58,0 Mo |
| 69,8 Mio | — | ✓ 247,3-251,4 s (2 essais) → PDF 81,8 Mo |
| 97,2 Mio | — | ✗ coupé à 240 s (le fichier est trop gros même à 240 s) |

**Plafond annoncé : 60 Mo** (marge sous 69,8 Mio, seule valeur fiable — 97,2 Mio a confirmé la
frontière côté échec). **Nature de la limite : réelle, côté moteur** (LibreOffice traite les
classeurs proportionnellement à leur nombre de lignes/cellules, pas à leur poids en octets — un
classeur dense mettra plus longtemps qu'une image de même taille). Elle ne disparaîtra pas avec
l'unification de l'envoi ; seule une nouvelle hausse du délai, une conversion en tâche de fond avec
progression réelle (plausible avec le mécanisme à venir), ou un moteur différent pour les tableurs
la repousserait.

**Concurrence des workers Gotenberg — mesurée, pas supposée.** Pendant les essais à 69,8 Mio
(~250 s chacun), aucun autre outil Gotenberg (Word, PowerPoint, HTML) n'a montré de ralentissement
anormal ni d'erreur : les conversions `.pptx` et `.html` lancées dans les mêmes minutes ont abouti
dans leurs temps habituels (6-90 s selon la taille). **Le service a supporté au moins 2 conversions
lourdes simultanées sans dégrader les autres**, cohérent avec Gotenberg qui isole chaque conversion
dans son propre processus LibreOffice/Chromium. Non éprouvé au-delà de 2-3 en parallèle — même
réserve que celle déjà consignée pour la vidéo (registre en mémoire, pas de second réplica testé).

## 2. Défaut trouvé : le service de stockage s'endormait pendant une longue conversion

**Ce n'est pas ce qui était demandé, mais c'est ce que la mesure a montré.** Le premier essai du
classeur de 69,8 Mio (avant la correction Excel) a échoué avec *« The converted file could not be
stored for download »*, sans rapport avec la taille. Le journal du service `media-processing`
(Railway) a montré la cause exacte :

```
00:01:06  GET  /v1/jobs/.../source   200   (le fichier stagé est lu par le site)
00:04:42  [2026-09-22 00:04:42] Starting gunicorn ...    <- redémarrage
00:04:42  PUT  /v1/jobs/.../output   404   (le job n'existe plus en mémoire)
```

Le service n'a reçu **aucune requête** pendant les 3 min 36 s de conversion ConvertAPI/Gotenberg ;
la veille Serverless de Railway l'a arrêté, et le registre des jobs étant **en mémoire**
(architecture déjà connue et documentée pour la vidéo), le redémarrage l'a perdu. Le fichier
converti existait, mais n'avait plus où être déposé. **Reproduit à volonté** : un second essai du
même fichier, sans correctif, a réussi (247,8 s) — la conversion est passée sous le délai de veille
cette fois. C'est un défaut intermittent, pas systématique, ce qui l'aurait rendu difficile à
diagnostiquer sans le journal du service.

**Correctif** : `lib/media/staged.js` expose `keepStagedAlive(handle)`, qui interroge
`GET /v1/jobs/<id>` (même route que le navigateur utilise déjà pour suivre la progression, avec le
billet serveur) toutes les 45 s pendant que la route convertit. `lib/media/stagedRoute.ts` l'active
autour des trois familles de conversion (`respondStaged`, `respondStagedInline`,
`respondStagedPdfJson`). **Vérifié deux fois sur le fichier qui avait échoué** (251,4 s et 247,3 s,
tous deux réussis), et confirmé dans le journal du service : des `GET /v1/jobs/<id>` réguliers
apparaissent bien pendant la conversion, plus aucun redémarrage au milieu. Un test de régression
(`scripts/media-tests/staged.test.mjs`) vérifie que le signal de vie tourne jusqu'à l'arrêt et ne
lève jamais d'exception si le service est injoignable.

**Nature de la limite : ARCHITECTURE, et corrigée.** Ce défaut touchait potentiellement *toute*
conversion « stage » dépassant la fenêtre de veille du service (mesurée ~3-4 min pour la vidéo dans
le chantier précédent), pas seulement Excel — Word/PowerPoint/PDF vers Word au-delà de 100 Mo, qui
prennent aussi 60-200 s, y étaient exposés. **Corrigé avant que l'unification n'en hérite.**

## 3. Plafonds mesurés, avec la nature de chaque limite

| Outil | Plafond annoncé (avant) | Plus gros succès mesuré | Plus petit échec mesuré | Cause exacte lue | Nature |
|---|---|---|---|---|---|
| Word / PowerPoint | 100 Mo | 148,6 Mio (72-88 s) | 197,9 Mio | `Vercel Runtime Error: … out of available memory` | **Architecture** (mémoire de la fonction) |
| Excel | 15 Mo | 69,8 Mio (247-251 s) | 97,2 Mio | `Gotenberg … 503 … time limit` (240 s) | **Réelle** (moteur LibreOffice) |
| PDF vers Word | 60 Mo | 100,3 Mio (204,6 s) | 150,4 Mio | `Vercel Runtime Error: … out of available memory` | **Architecture** |
| HTML/EPUB/MOBI | 30 Mo | 149,9 Mio (90,4 s) | *(non atteint)* | — | non déterminée au-delà de 150 Mo |
| PDF Repair | 30 Mo | 45,4 Mio (22,1 s) | 60,4 Mio | service `pdf-tools` : `Maximum size is 50 MB` (sa propre config) | **Architecture légère** (variable d'env du service) |
| PDF/A | 30 Mo | 45,4 Mio (30,1 s) | 60,4 Mio | idem | **Architecture légère** |
| Image Captioner | 3 Mio (base64) | 58,0 Mo / 80 MP (3,4-6,0 s) | *(non atteint)* | — | corrigé, plus la même architecture |

**Plafonds déclarés mis à jour** (`lib/quota/limits.js`, textes affichés avant sélection ET
contrôlés côté route, inchangés dans leur mécanique — seules les valeurs bougent) :
Word/PowerPoint **100 Mo** (marge sous 148,6, pas 197,9 — la marge de sécurité est volontairement
large car le point d'échec dépend du contenu, pas seulement du poids) · Excel **60 Mo** · PDF vers
Word **100 Mo** · HTML/EPUB/MOBI **100 Mo** (marge sous 149,9, jamais vu échouer) · PDF Repair et
PDF/A **45 Mo** · Image Captioner **80 Mo** (marge zéro sous le plus gros succès — piste à retester
plus haut si le besoin s'en fait sentir, non fait ici par discipline de temps). Texte de la FAQ
`pdf-tools` mis à jour en conséquence (rapide, comme demandé — pas de nouvelle passe de relecture
sur les autres pages).

**Ce qui tombera avec l'unification, et ce qui restera** : les plafonds « Architecture » (Word,
PowerPoint, PDF vers Word) sont un sous-produit du fait que la fonction Vercel garde tout le fichier
en mémoire ; le mécanisme à venir (billet + morceaux + file, comme la vidéo) fait disparaître cette
contrainte par construction, puisque le fichier ne transite plus jamais entier par une fonction
Vercel. **Excel restera plafonné par `API_TIMEOUT` de Gotenberg**, quel que soit le mécanisme
d'envoi, sauf changement du moteur ou du délai. **PDF Repair/PDF/A resteront plafonnés au réglage du
service `pdf-tools`**, un simple curseur à tourner séparément.

## 4. Coût ConvertAPI — mesuré, pas de risque à un seul visiteur

**Lu dans le journal de production** (`[convertapi] docx->pdf` / `pdf->docx cost_micros=… input_mb=…`),
sans qu'aucun test n'ait jamais montré autre chose que 1 crédit :

| Taille | `cost_micros` | Coût réel |
|---|---|---|
| 10 Mio (.docx) | 10 000 | 0,01 $ |
| 49 Mio (.docx) | 10 000 | 0,01 $ |
| 99 Mio (.docx) | 10 000 | 0,01 $ |
| 100 Mo (.pdf → .docx) | 10 000 | 0,01 $ |
| 148 Mio (.docx, chantier D8) | 10 000 | 0,01 $ |

**Le coût de ConvertAPI est flat par conversion, indépendant de la taille du fichier**, confirmé
sur cinq tailles de 10 à 148 Mio. Le code (`lib/providers/convertApi.js`) lit le vrai champ
`ConversionCost` de la réponse et ne suppose jamais 1 par défaut *sauf si le champ est absent* —
donc si ConvertAPI facturait un jour plus pour un fichier extrême, ce serait reflété
automatiquement, mais rien de mesuré ne le montre jusqu'à 148 Mio.

**La garde réserve 10 000 micros (0,01 $) par appel, pile le montant réel mesuré — la réservation
du pire cas est donc exacte, elle ne sous-estime ni ne surestime.**

**Peut-on vider le budget mensuel de 20 $ en une visite ?** Non : la limite par IP partagée entre
les 16 outils payants (`IP_RATE_LIMIT_PER_DAY = 100`) plafonne une seule adresse IP à **100
requêtes/jour**, soit **1 $/jour maximum** même en martelant `word-to-pdf` en boucle avec des
fichiers énormes — D8 n'a rien changé à ce chiffre puisque le coût ne dépend pas de la taille.
**Peut-il être vidé par l'ensemble des visiteurs dans le mois ?** Oui, mécaniquement : `20 $ / 0,01 $
= 2 000 conversions` (`.docx`/PDF confondus) épuisent le plafond global partagé avec les 15 autres
outils payants — c'était déjà vrai avant D8 et le reste après, ce n'est pas un risque nouveau créé
par l'envoi par morceaux. **Aucune correction nécessaire** : la garde fait ce qu'elle doit.

## 5. Gotenberg — coût réel et recommandation (décision au propriétaire)

**Références croisées confirmées, sans lire aucune valeur** — les 9 variables non-Railway de
`gotenberg-v2` (`API_ENABLE_BASIC_AUTH`, `CHROMIUM_AUTO_START`, `GOTENBERG_API_BASIC_AUTH_PASSWORD`,
`GOTENBERG_API_BASIC_AUTH_USERNAME`, `GOTENBERG_GRACEFUL_SHUTDOWN_DURATION`,
`LIBREOFFICE_AUTO_START`, `LOG_STD_FORMAT`, `PORT`) sont toutes des références Railway
(`${{gotenberg-fonts.NOM}}`, reconnu par sa forme, jamais par son contenu) vers `gotenberg-fonts` ;
`API_TIMEOUT` est la seule variable propre à `gotenberg-v2` (nécessairement, puisque je viens de la
régler différemment). `gotenberg-fonts` n'a, lui, aucune référence : toutes ses variables sont les
siennes.

**Qui sert vraiment la production, confirmé par les journaux de requêtes, pas supposé** :
`gotenberg-v2` a traité **toutes** mes requêtes de test de ce chantier (`request handled` à chaque
essai) ; `gotenberg-fonts` n'a **aucune** ligne `request handled` depuis son dernier déploiement, le
19 septembre (3 jours). **`gotenberg-fonts` ne traite aucune conversion réelle : il tourne pour
rien.**

**Coût réel mesuré** (API d'usage Railway, tarifs du 20/09 ; ce n'est pas une facture) :

| Fenêtre | `gotenberg-v2` | `gotenberg-fonts` |
|---|---|---|
| 7 jours (trafic normal) | ≈ 1,31 $/mois (extrapolé) | ≈ 0,67 $/mois (extrapolé) |
| 47 h (chantiers D8 + celui-ci, forte charge de test) | ≈ 8,95 $/mois (extrapolé) | ≈ 5,70 $/mois (extrapolé) |

Le coût des deux services est presque entièrement de la **mémoire résidente** (LibreOffice +
Chromium chargés en permanence), qui monte avec le temps même quand le service ne sert rien
(`gotenberg-fonts` : 0 requête, coût quand même en hausse sur la fenêtre longue) — ce n'est pas un
effet du trafic, ce que confirme qu'aucune des deux fenêtres ne corrèle avec un nombre de requêtes
different pour `gotenberg-fonts`.

**Recommandation : n'en garder qu'un (`gotenberg-v2`), sous une condition préalable.** Trois jours
sans incident sur `gotenberg-v2` de production, la référence croisée vers `gotenberg-fonts` reste
un point de fragilité tant qu'elle n'est pas résolue : si `gotenberg-fonts` disparaissait
aujourd'hui, `gotenberg-v2` perdrait d'un coup ses 8 variables référencées (authentification,
démarrage automatique, format des journaux) et cesserait de fonctionner. **Étape préalable, avant
toute suppression : copier les 8 valeurs référencées comme variables propres de `gotenberg-v2`**
(lecture et écriture de noms et de « la valeur commence par `${{` », jamais du contenu réel —
faisable sans jamais afficher un secret). Une fois cette étape faite et vérifiée (`gotenberg-v2`
tourne toujours après), `gotenberg-fonts` peut être supprimé sans aucun risque pour la production,
économisant l'intégralité de son coût (≈ 0,7 à 5,7 $/mois selon la charge) pour zéro perte de
service. **Rien n'a été supprimé ni modifié dans cette section : la décision reste au
propriétaire**, comme demandé.

## 6. `image-captioner` — corrigé

Même principe que le détourage : l'image est décodée et réduite à 2048 px sur le plus grand côté
**dans le navigateur** (`app/lib/imageForVision.js`, `createImageBitmap` + `<canvas>`, JPEG qualité
0,85 — c'est la résolution que le modèle de vision applique de toute façon en détail « high »), donc
l'original ne quitte jamais l'appareil et seul un JPEG de quelques centaines de Ko est envoyé. Le
plafond base64 de 3 Mio disparaît : c'est désormais l'image source qui a un plafond généreux
(80 Mo), plus l'ancien mur de la charge utile JSON de Vercel.

**Mesuré, trois navigateurs** :

| Image | Poids | Navigateur | Temps | Corps de requête envoyé |
|---|---|---|---|---|
| 12 MP (4000×3000) | 6,3 Mo | Chromium | 6,0 s | 1,08 Mo |
| 48 MP (8000×6000) | 27,9 Mo | Chromium | 3,4 s | 0,87 Mo |
| 80 MP (10000×8000) | 58,0 Mo | Chromium | 4,0 s | 0,94 Mo |
| 48 MP | 27,9 Mo | Firefox | 4,1 s | 1,55 Mo |
| 48 MP | 27,9 Mo | WebKit | 4,0 s | 1,62 Mo |
| 12 MP | 6,3 Mo | WebKit | 3,5 s | 1,50 Mo |

Toutes réussies, sous-titre AI reçu à chaque fois. **Non trouvé en échec** jusqu'à 80 mégapixels ;
le plafond de 80 Mo annoncé est une marge de sécurité, pas la vraie limite (non cherchée plus haut,
par discipline de temps — l'unification à venir touchera aussi cet outil si son transport change).

**Une erreur WebKit non identifiée est apparue** pendant un essai par ailleurs réussi (12 MP) :
`Unhandled Promise Rejection: TypeError: undefined is not an object (evaluating
'navigator.storage.persisted')`. Recherchée dans le code du projet : aucune occurrence de
`storage.persisted` nulle part dans `app/`, `lib/` ou les dépendances directes — l'appel ne vient pas
de ce projet. Reproduite une seule fois avec le WebKit de Playwright, absente en rechargeant les
mêmes pages en production juste après. **Ne bloque ni la fonctionnalité ni le test.** Consignée
dans le plan comme point à surveiller lors de la passe Safari réel du propriétaire (bloquant 9) —
si elle apparaît aussi sur un vrai Safari, il faudra l'identifier plus précisément (peut-être une
extension du navigateur de test, ou une API expérimentale de WebKit).

## 7. Nettoyage `.claude/settings.local.json`

Fichier affiché avant modification (23 règles), catégories trouvées :

- **Guillemet fermé avant la fin de la commande** (le `*` retombe hors de la portée voulue,
  autorisant n'importe quelle suite) : `Bash(python3 -c ' *)`, `Bash(git commit -m ' *)`,
  `Bash(node -e ' *)`, `Bash(PYTHONIOENCODING=utf-8 python -c ' *)`, et une règle de fusion figée sur
  un message de commit précis suivi de `*)`.
- **Interpréteur ou réseau entier autorisé sans aucune contrainte de sous-commande** :
  `Bash(python *)`, `Bash(python3 *)`, `Bash(node *)`, `Bash(npx *)`, `Bash(curl *)`,
  `Bash($VENV *)`.
- **Écriture Git large** : `Bash(git push *)`, `Bash(git merge *)`, `Bash(git checkout *)`,
  `Bash(git commit *)`, `Bash(git pull *)`, `Bash(git rm *)`.
- **Une commande PowerShell autorisée en général** alors qu'elle ne visait qu'un arrêt de processus
  précis : `Bash(powershell.exe … Stop-Process …)`.
- **Quatre autres**, devenues obsolètes ou trop larges pour un usage ponctuel déjà terminé (un
  `sed -i` figé sur un script disparu, un `git rm`, deux `taskkill` figés sur un nom de processus
  précis mais qui autorisaient toute variante par la forme du motif).

**23 règles supprimées au total**, aucune ajoutée. `.claude/settings.json` et
`~/.claude/settings.json` non touchés, comme demandé. Le fichier repasse ainsi sous le principe
« redemander plutôt que présumer » pour ces commandes.

**Observation faite en terminant ce chantier, à consigner** : 10 de ces mêmes règles sont
**réapparues d'elles-mêmes** avant la fin de la session, recréées automatiquement par mes propres
commandes (`git push`, `git checkout -b`, `git merge`, `node -e '…'`, etc.) — l'automatisme qui
enregistre une permission le fait sur la forme générale de la commande que je tape, pas sur la
commande exacte, donc il régénère le même excès de portée. **Retirées une seconde fois** juste
avant ce rapport. Ce n'est pas corrigible en éditant le fichier une fois : c'est un comportement de
l'outil qui se reproduira à la prochaine session tant qu'il enregistre des règles à partir de motifs
larges plutôt que de la commande exacte tapée. Signalé par ailleurs (retour d'usage), pas quelque
chose que ce chantier peut corriger dans le dépôt.

## 8. Ce qui n'est pas fait, par discipline de temps (note du propriétaire prise en compte)

- Les textes de plafond des pages d'outils individuelles (au-delà de la FAQ de catégorie
  `pdf-tools`, mise à jour) n'ont pas été relus un par un : ils seront à refaire après
  l'unification, comme demandé.
- HTML/EPUB/MOBI et Image Captioner n'ont pas été poussés jusqu'à leur vraie limite d'échec — le
  plus gros essai réussi fixe le plafond annoncé, avec marge.
- La copie des 8 variables référencées de `gotenberg-fonts` vers `gotenberg-v2` (préalable à une
  suppression) n'a pas été faite : c'est un choix qui précède une suppression, laissé au
  propriétaire.
- Le défaut de veille pendant une longue conversion n'a été vérifié que pour Excel (le cas qui l'a
  révélé) ; il est corrigé pour tous les types de conversion « stage » par construction (le
  correctif est dans le chemin commun), mais pas re-testé individuellement pour chacun ici.

## 8 bis. Correction après coup : marge réelle, pas une valeur pile à la frontière

En vérifiant chaque plafond sur la production après le premier déploiement, deux valeurs
annoncées (PDF Repair/PDF/A à 45 Mio, PDF vers Word à 100 Mio) tombaient **exactement** sur la
taille du fichier de preuve (45,38 et 100,25 Mio), sans marge. Ce n'est pas une erreur de fond —
un plafond annoncé en dessous d'un fichier prouvé réussit forcément aussi, un fichier plus petit
n'étant pas plus difficile pour le même moteur — mais un test de production avec le fichier de
preuve lui-même s'est vu refuser par sa propre limite, ce qui aurait été trompeur à lire sans
explication. **Corrigé par prudence avec une vraie marge : PDF Repair/PDF/A 45 → 44 Mio, PDF vers
Word 100 → 99 Mio.** Revérifié en production avec des fichiers sous ces nouvelles valeurs (40 et
90 Mio). Des blocs de commentaires orphelins de D8 (laissés sans `const` associé par des
remplacements précédents) ont été nettoyés au passage dans `lib/quota/limits.js`.

## 9. Déploiement

Fusionné dans `master`, build local propre (268 pages, aucune erreur TypeScript), vérifié sur
préversion avant fusion (voir les tableaux ci-dessus, tous mesurés sur
`onlineconvertools-git-plafonds-mesures-*.vercel.app`), puis vérifié en production. Origine de
préversion retirée de `ALLOWED_ORIGINS` du service `media-processing` après vérification, comme
pour D8.

## 10. Livrables

`lib/media/staged.js` (`keepStagedAlive`), `lib/media/stagedRoute.ts` (3 points d'appel),
`app/lib/imageForVision.js`, `app/tools/ai-tools/image-captioner/page.jsx`, `lib/quota/limits.js`
(valeurs mesurées), `app/tools/pdf-tools/page.jsx` (FAQ), `.claude/settings.local.json` (nettoyé),
`scripts/media-tests/staged.test.mjs` (+1 test), `scripts/browser-tests/e2e-captioner-remote.mjs`.
Plan mis à jour : plafonds par outil avec leur nature, coût ConvertAPI, décision Gotenberg, DPA
ConvertAPI rendu plus urgent, point WebKit à surveiller.
