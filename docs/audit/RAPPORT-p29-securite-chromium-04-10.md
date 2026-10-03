# RAPPORT P29 — sécurité de Chromium dans Gotenberg, équations .docx (04/10)

Demandé par le propriétaire (prompt P29), mises en production comprises, y compris en son absence. Branche `p29-chromium`,
repère de restauration `restauration-avant-p29-04-10` = `e578eeaa` (master avant P29). Autorisations : modification de
Gotenberg sur Railway (`railway up`, réglages de lancement) aux conditions de P26 ; 0,02 $ chez ConvertAPI. Rien sur
Supabase, aucune variable d'environnement touchée (Railway ni Vercel), aucun service ajouté. Rapport complété après
chaque lot.

## 0. Récapitulatif

| Lot | Contenu | État |
|---|---|---|
| 1 | Chromium de Gotenberg : version corrigée (CVE-2026-87491), JavaScript coupé dans tout le navigateur, V8 sans JIT, visionneuse PDF coupée ; page HTML to PDF honnête | ✅ **en production** (`gotenberg-v2` `1bb98768`, fusion `5af581aa`), revue indépendante appliquée |
| 2 | Équations .docx par ConvertAPI | **bloqué : crédits ConvertAPI épuisés** (§2) — 0 $ dépensés ; le propriétaire doit recharger |

## 1. Lot 1 — Chromium

### 1.1 État lu avant (règle zéro)
- Railway `gotenberg-v2` (production) : déploiement `8e8e178d` (8.37.0 + règles Aptos), Chromium **152.0.7977.82**,
  JavaScript actif ; `gotenberg-fonts` (à côté, sans trafic) : même image. Variables inchangées depuis P26 (protections
  `*_DENY_PRIVATE_IPS`, `WEBHOOK_DISABLE`, `API_DISABLE_DOWNLOAD_FROM`, `CHROMIUM_DENY_LIST`).
- Gotenberg 8.37.0 (sources lues) lance Chromium avec `--no-sandbox` et `--no-zygote` **codés en dur**
  (`pkg/modules/chromium/browser.go`) ; `--chromium-disable-javascript` applique `Emulation.setScriptExecutionDisabled`
  à chaque page (`tasks.go`) ; `site-per-process` est désactivé (les cadres restent dans le même processus).
- **Aucune route du site n'a besoin de JavaScript** : URL to PDF retire déjà tout script et les interdit par une
  Content-Security-Policy (`lib/urlFetch/snapshot.mjs`, P25) ; Text, Markdown, EPUB et MOBI to PDF fabriquent un HTML
  sans script (vérifié : 0 `<script` dans les livres capturés). Seul un fichier HTML déposé (ou du code collé) peut en
  contenir — c'est justement l'entrée non fiable.

### 1.2 Ce que recommandent Gotenberg et le marché (relevé du 04/10)
- Gotenberg (documentation « Outbound URL Filtering », configuration) : `*_DENY_PRIVATE_IPS` pour tout service exposé
  (déjà fait en P26) ; `--chromium-disable-javascript` existe depuis l'issue #175 (« code non fiable ») ; rien sur le bac
  à sable, l'isolement réseau étant laissé à l'exploitant. Aucune issue ni exemple public d'un Gotenberg avec bac à sable.
- DocRaptor (Prince) : JavaScript **coupé par défaut**. PDFCrowd : actif par défaut, sa documentation conseille de le
  couper pour du contenu non fiable. Puppeteer : sans bac à sable « fortement déconseillé ». Chromium : le moteur de
  rendu est considéré comme hostile, le bac à sable est la frontière.
- **Debian a déjà corrigé la faille** : `security-tracker.debian.org` — trixie corrigée en 153.0.8010.47-2~deb13u1
  (DSA-6506-1), trixie-security porte **154.0.8037.92-1~deb13u1** (vérifié le 04/10). Gotenberg installe le paquet
  `chromium` de Debian : notre image peut le mettre à jour **sans attendre** une version de Gotenberg (aucune version
  publiée n'embarque Chromium ≥ 153 au 04/10).

### 1.3 Pistes mesurées sur `gotenberg-fonts` (trois images d'essai, puis l'image finale)
- **Bac à sable de Chromium : impossible sur Railway, mesuré.** Sonde au démarrage : filtre seccomp de Railway actif
  (`Seccomp: 2`), ensemble de capacités sans `CAP_SYS_ADMIN` (`CapBnd 00000000800405fb`) ; `unshare -Ur` (espaces de noms
  utilisateur, ce dont le bac à sable a besoin) **refusé sur 2 hôtes sur 3** (noyau 6.18, « Permission denied »),
  accepté sur un hôte plus ancien (noyau 6.12). Avec le bac à sable, Chromium s'arrête au démarrage
  (`sandbox/linux/services/credentials.cc:137 … Permission denied`) et le service ne passe pas son contrôle de santé
  (l'ancienne version reste servie). L'assistant setuid de Debian (`chromium-sandbox`) ne peut pas non plus créer ses
  espaces de noms sans `CAP_SYS_ADMIN`. Un bac à sable qui dépend de l'hôte tiré au sort n'est pas retenu.
- **JavaScript coupé** : banc `scripts/p29/js-probe.mjs`, 18 façons de faire tourner un script dans un HTML déposé
  (script en ligne, module, `src` data:, gestionnaires d'événements, script SVG, iframes srcdoc imbriquées, iframes
  data: et javascript:, object, embed SVG, minuterie, Worker, meta refresh javascript:, autofocus, details) :
  **production (JS actif) 15/18 exécutés ; JS coupé 0/18.** Seul effet visible : le contenu `<noscript>` s'affiche
  (comme dans tout navigateur sans script).
- **V8 sans JIT** (`--js-flags=--jitless`) : présent sur la ligne de commande des processus de rendu (relevé dans
  `/proc` du conteneur) ; défense en profondeur si un script passait malgré tout.

### 1.4 Décision et changement (`services/gotenberg/`, commit `db5b72e0` + `e708a999`)
1. **Chromium 154.0.8037.92-1~deb13u1** (CVE-2026-87491 corrigée), installé depuis snapshot.debian.org (copie permanente
   de l'archive de sécurité : security.debian.org retire une version dès qu'elle est remplacée), fichiers vérifiés par
   SHA-256 (leurs SHA-1 sont ceux des registres de Debian) ; la construction échoue si la version installée n'est pas
   celle-là.
2. `--chromium-disable-javascript` dans la commande de l'image (comme `--api-enable-basic-auth` : versionné, remis
   par un retour arrière de déploiement, aucune variable Railway touchée).
3. `chromium-launcher` (désigné par `CHROMIUM_BIN_PATH` dans l'image) : ajoute `--jitless`, retire les deux
   identifiants de l'API de l'environnement de Chromium (limite : un Chromium compromis, même utilisateur, peut encore lire
   l'environnement de son parent — mesure d'hygiène, pas une frontière).
4. Page **HTML to PDF** : la description et la FAQ disent que les scripts d'un fichier ou d'un code collé ne sont pas
   exécutés ; un avis s'affiche après conversion quand le HTML contient `<script` (« ce qu'ils dessineraient manque au
   PDF ; ouvrez le fichier dans votre navigateur et imprimez-le »), comme pour une URL depuis P25.

### 1.5 Conversions identiques (banc `scripts/p27/gotenberg-compare.mjs`, comparaison `scripts/p26/compare-pdfs.mjs`)
Production (`gotenberg-v2`, Chromium 152, JS actif) contre l'image du lot 1 (`gotenberg-fonts`), mêmes entrées :
61 documents de P27/P28 (Word, Excel, PowerPoint dans tous les formats, 16 documents à équations, Aptos), HTML (fichier,
page de fidélité, ressources publiques, écritures du monde), EPUB et MOBI tels que nos pages les construisent, et
**URL to PDF comme le site l'envoie** : 5 vraies pages passées par notre `snapshotPage` (`scripts/p29/url-snapshots.mjs` :
example.com, Wikipédia 25 pages, MDN, GOV.UK, BBC News) → **65/65 identiques** (nombre et taille des pages, texte, chaque
page au pixel à 72 ppp). Seul écart : la route URL **de Gotenberg** (que le site n'utilise pas) sur example.com, dont un
script ajoute désormais une traduction française quand JavaScript tourne — attendu.

### 1.6 Adresses internes (`scripts/p26/gotenberg-probe.mjs`)
Sur l'image du lot 1 : **27 adresses internes jamais atteintes** (boucle locale v4/v6, services `*.railway.internal`,
métadonnées 169.254.169.254, CGNAT, 198.18, `file://`, identifiants avant l'hôte, noms DNS publics vers des adresses
internes, redirection) ; la route URL répond 403 ; contrôle public atteint ; webhook ignoré, downloadFrom refusé.

### 1.7 Revue de sécurité indépendante — « GO avec conditions », conditions appliquées
- Ordre vérifié dans les sources : le réglage « scripts coupés » est posé sur l'onglet vierge **avant** la navigation.
- **Défaut trouvé grâce à la revue** (cas de sonde ajouté, `xsiteframe`) : avec le seul `--chromium-disable-javascript`,
  un cadre https d'un **autre site** dans un HTML déposé **exécutait encore son script** (le réglage de Gotenberg vaut
  pour la page, pas pour un cadre que Chromium met dans un autre processus) — un HTML déposé pouvait donc faire tourner
  le JavaScript d'une page d'attaquant. **Correction** : politique d'entreprise de Chromium dans l'image
  (`services/gotenberg/chromium-policy.json` → `/etc/chromium/policies/managed/`) : `DefaultJavaScriptSetting: 2`
  (JavaScript bloqué dans tout le navigateur, chaque cadre et processus compris) et `AlwaysOpenPdfExternally: true`
  (visionneuse PDF intégrée — PDFium, qui a son propre JavaScript — coupée pour un PDF incrusté). Après : le cadre se
  charge (son texte est dans le PDF) mais son script ne tourne plus ; PDF incrusté (embed, iframe) : rien rendu, ni
  avant ni après ; `file:///tmp/` en cadre : aucune liste des conversions des autres ; XSLT : appliqué (analyseur, pas
  un script ; Chromium prévoit de le retirer).
- Lanceur : commentaire rendu exact (retirer les identifiants de l'environnement de Chromium est de l'hygiène, pas une
  frontière). Aucune variable Railway (`CHROMIUM_BIN_PATH`, `CHROMIUM_DISABLE_JAVASCRIPT`) ni commande de démarrage ne
  contourne l'image sur `gotenberg-v2` (lu le 04/10 : aucune).
- `--chromium-clear-cookies` ajouté (gratuit). Sonde `scripts/p29/cookie-probe.mjs` : **aucun écart mesuré** — Chromium
  n'envoie déjà pas, par défaut, le cookie d'un cadre tiers d'une conversion à la suivante ; gardé comme hygiène.
- Options de la route URL (une seule longue page, échelle, CSS écran ou impression, arrière-plans ; `singlePage` passe
  par une mesure DevTools, pas par un script) : `scripts/p29/url-options.mjs`, **6/6 identiques** à la production.
- **Image finale** (`5f158e34`) sur `gotenberg-fonts` : 0/18 + 4 cas de la revue bloqués ; **65/65** et **6/6**
  identiques ; 27 adresses internes refusées.
- Non retenu, chiffré pour le propriétaire : **instance Chromium séparée** (projet Railway à part, sans réseau privé,
  identifiants propres) — c'est un nouveau service payant (≈ 3-4 $/mois de mémoire au repos, une variable Vercel de
  plus, des identifiants que seul le propriétaire peut créer) : à décider. `--chromium-max-concurrency=1` (une
  conversion à la fois par navigateur) : coûte du débit, à voir avec le chantier de saturation (C2).
  `CHROMIUM_DENY_PUBLIC_IPS` : casserait les images et polices distantes des HTML déposés, faible gain.

### 1.8 Page HTML to PDF sur la préversion
Premier passage (`scripts/p29/html-page.mjs`) : PDF livrés, **mais l'avis « scripts non exécutés » n'apparaissait
pas** — un caractère de contrôle (retour arrière, U+0008) s'était glissé dans l'expression `/<script\b/i` lors de
l'édition (échappement du shell). Trouvé en traçant le code servi, corrigé, tous les fichiers du chantier vérifiés
(aucun autre caractère de contrôle).

## 2. Lot 2 — équations d'un .docx (ConvertAPI)
- Corpus : `word-omml.docx` (7 équations Office Math écrites par Word 16, PDF de Word comme référence) et
  `dsmt4-mathtype6.docx` (objet MathType 6), `scripts/p28/equations`.
- Envoi tel que la page Word to PDF le fait, sur www (`scripts/p29/docx-equations-www.mjs`, un seul envoi par fichier) :
  **les deux refusés en 503 « temporarily unavailable »**. Journal Vercel : `word-to-pdf: quota_exceeded (HTTP 403)` —
  **les crédits du compte ConvertAPI sont épuisés.** Une réponse non 2xx n'est pas facturée : **0 $ dépensé.**
- Dernière conversion ConvertAPI réussie dans les journaux : 02/10 à 19 h 52 (heure de Vercel). Depuis, **Word to PDF
  (.docx), PDF to Word, PDF to Excel et PDF to PowerPoint échouent sur www pour tout visiteur.** Propriétaire averti par
  notification. L'alerte du site est partie par courriel ; le canal téléphone (`NTFY_TOPIC`) n'est pas configuré.
- **À faire par le propriétaire** : recharger ConvertAPI. Ensuite, `node scripts/p29/docx-equations-www.mjs
  https://www.onlineconvertools.com <dossier> scripts/p28/equations/corpus/word-omml.docx
  scripts/p28/equations/corpus/dsmt4-mathtype6.docx` (≈ 0,02 $) puis comparaison avec le PDF de Word et celui de
  Gotenberg 8.37 (déjà mesuré en P28 : équations rendues).

## 3. Mise en production du lot 1 (04/10, heure UTC de la machine ≈ 21 h 16)
- Préversion `onlineconvertools-5urpnsf6i` (une passe, `scripts/p29/html-page.mjs`) : 6/6 — PDF livrés (fichier,
  fichier sans script, code collé), avis présent exactement quand le HTML a un script.
- Fusion **`5af581aa`** (sans poussée forcée) → Railway **`gotenberg-v2` déploiement `1bb98768`** (SUCCESS, commit
  `5af581aa`) ; `pdf-tools` reconstruit sur le même commit (même code, `/health` 200) ; Vercel production
  **`onlineconvertools-fo109wbpv` = `5af581aa`**.
- **Nouveau comportement vérifié en ligne sur `gotenberg-v2`** (corollaire 4) : 0/18 scripts, cadre d'un autre site,
  PDF incrustés et `/tmp` bloqués ; banc complet **65/65 identiques** à la mesure faite avant la bascule, options de la
  route URL **6/6** ; 27 adresses internes refusées, contrôle public atteint.
- **www** (règle d'usage Vercel : contrôle léger) : `www-light` **29/29** ; une vraie conversion par outil touché par
  les pages : Word (dont équations, ODT de Word), Excel, PowerPoint, HTML (fichier), EPUB, MOBI, URL **9/9**
  (`scripts/p26/gotenberg-tools-www.mjs`), Markdown to PDF et Text to PDF par le moteur de rendu (émoji, bengali) **2/2**
  (`scripts/p29/md-text-www.mjs`), page HTML to PDF **6/6** (`scripts/p29/html-page.mjs`).
- Retour arrière prêt, non utilisé : Railway `gotenberg-v2` → déploiement `8e8e178d` (Rollback : image et variables
  d'avant) ; Vercel → promouvoir `onlineconvertools-jcglmx2uu` (= `03aa60d1`).

## 4. Facture Railway
- Aucune variable touchée, aucun service ajouté. Image : deux paquets Chromium remplacés (même taille à 1 % près).
- Mémoire de `gotenberg-v2` (`scripts/p28/rw-metrics.mjs`) : avant, moyenne 0,71 Go sur 30 h (pics de bancs compris) ;
  juste après la bascule 0,43 Go au repos. À relire après quelques heures de repos (une seule mesure après).
- Bancs du chantier : quelques minutes de processeur sur `gotenberg-fonts` et `gotenberg-v2` (≈ 0,05 $).
- ConvertAPI : 0 $ (aucun appel facturé). Supabase : rien.

## 5. Reste
- **Propriétaire — ConvertAPI** : recharger les crédits (4 outils en échec sur www depuis le 02/10 ≈ 19 h 52), puis la
  mesure des équations .docx (§2, ≈ 0,02 $). Option à décider : quand ConvertAPI répond « crédits épuisés » (403, non
  facturé), passer le .docx à Gotenberg 8.37 (équations rendues, P28) au lieu d'une erreur — aujourd'hui la règle du
  site est « jamais de repli silencieux vers un autre moteur ».
- **Propriétaire — option chiffrée** : Chromium dans une instance Railway séparée, sans réseau privé (§1.7).
- **Claude, sur déclencheur** : nouvelle version de Chromium dans trixie-security corrigeant une faille exploitée, ou
  nouvelle Gotenberg → mêmes bancs sur `gotenberg-fonts` d'abord (règle au plan). Quand une Gotenberg embarquera un
  Chromium ≥ 154, la couche Chromium de `services/gotenberg/Dockerfile` pourra être retirée (sinon la construction le
  dira : un paquet plus ancien ne s'installe pas par-dessus).
- Risque restant, mesuré et dit : Chromium sans bac à sable (impossible sur Railway) analyse encore du HTML, des CSS,
  des images et des polices non fiables ; JavaScript, JIT et visionneuse PDF ne sont plus atteignables.

## 6. Fin
Production : **Vercel `onlineconvertools-fo109wbpv` = `5af581aa`** (puis commits de rapport) ; **Railway
`gotenberg-v2` `1bb98768`** (Gotenberg 8.37.0, Chromium 154.0.8037.92, JavaScript bloqué, V8 sans JIT), `pdf-tools`
`033d7927` (code inchangé). `gotenberg-fonts` : déploiement `f06d1764` (même image, à côté). Aucun retour arrière.
Repère : `restauration-avant-p29-04-10` = `e578eeaa`.
