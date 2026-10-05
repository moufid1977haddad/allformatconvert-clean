# AUDIT — Référencement Google et préparation AdSense (05/10, lot C — LECTURE SEULE)

**Aucun texte ni réglage du site n'a été modifié pour ce lot.** Sources : construction de production locale (`next start`,
même code que www `6887a0b1`) explorée par `scripts/p34/seo-audit.mjs` (243 pages, HTML brut sans JavaScript) ;
lectures légères de www (redirections, robots, sitemap, ads.txt) ; Lighthouse 13.5 mobile en local ; deux sous-agents en
lecture seule (marché : 6 concurrents × 5 outils, HTML brut ; AdSense : documentation officielle de Google + nos pages).
Le dossier `claude/decision-internationalisation.md` cité par le prompt **n'existe pas dans le dépôt** (il vivait dans le
Projet claude.ai) ; la position écrite au plan s'applique : **internationalisation GELÉE jusqu'à un trafic organique réel**
(« traduire une page en position 74 produit treize pages en position 74 »).

## 1. Constat chiffré

### 1a. Technique (construction locale = www)

| Point | Mesure | Verdict |
|---|---|---|
| robots.txt | `Allow: /` + sitemap ; aucun robot bloqué (Mediapartners-Google compris) | ✅ |
| Sitemap | 243 URL, **toutes en 200**, **aucune page d'outil absente**, aucune morte ; les 225 outils + 12 catégories + 6 pages | ✅ |
| `lastmod` du sitemap | **identique pour les 243 pages = heure du build** (05/10 08:14) — change à chaque déploiement | ⚠️ Google apprend à ignorer ce signal |
| Redirections | http→https, sans-www→www, barre finale → sans : 308 ; `http://onlineconvertools.com` fait **2 sauts** (→ https sans www → www) | ⚠️ mineur |
| 404 | pages inconnues → **404 réel** (pas de « soft 404 ») | ✅ |
| Canonical | 241/243 absolus, www, sur eux-mêmes ; **absent sur `/` (accueil) et `/about`** | ⚠️ |
| hreflang | **0 page** (Google Translate « 13 langues » côté navigateur : rien d'indexable) | gelé (plan) |
| Robots meta | `index, follow` partout | ✅ |
| H1 | 1 par page partout **sauf l'accueil : 2** (« 225 … » et « All Tools ») | ⚠️ |
| Titres | aucun absent ni en double ; **8 titres cassés** (phrase coupée, modèle « — Be a … ») : JPG to PDF « — Be a One-shot Batch Converter: Select Your », SCSS to CSS, JSON to YAML, Image Editor, Subtitle Generator, Find Replace / Lorem Ipsum / Text Truncator « — Be a Free Online Tool Online Free » ; « About - OnlineConverTools \| OnlineConverTools » (nom doublé) ; `/tools` « … Free File Converters Online Free » ; 21 titres > 60 caractères (2 > 70) ; **75/225 sans « Free »**, 64/225 avec « Convert » | 🔴 8 titres cassés |
| Méta-descriptions | aucune absente ni en double ; **49 outils > 160 caractères** (jusqu'à 280 : coupées dans Google) ; ton technique (« pdf-lib stitches… », « MozJPEG ») | ⚠️ |
| Contenu des pages d'outil | texte visible (HTML brut, menu exclu) : médiane **380 mots** ; **40 outils < 300 mots**, 128 < 400, 15 ≥ 700 ; par catégorie : texte 286, image 321, IA 345, développeur 348 … PDF 468, QR 559 ; `/about` 136 mots, `/contact` 79 | ⚠️ minces : texte, image, développeur |
| Liens internes entre outils voisins | **aucun lien contextuel** sur 215 outils (seuls les 17 liens du menu / pied de page, identiques partout) ; les 10 pages travaillées le 29/09 en ont 4 | 🔴 |
| Données structurées | **10 outils sur 225** (WebApplication + BreadcrumbList + FAQPage, pages du 29/09) ; 215 sans ; accueil sans (ni Organization ni WebSite) | ⚠️ |
| Lighthouse mobile (20 outils, local) | voir §1b | |

### 1b. Vitesse (Lighthouse 13.5 mobile, Moto G simulé, 4G lente, CPU ×4 ; local `next start`, HTTP/1.1 + gzip — www est en HTTP/2 + Brotli, un peu plus rapide)

20 outils clés : **Performance 84-89** (médiane 87-88), **Accessibilité 100, Bonnes pratiques 100, SEO 100** partout ;
**LCP 3,19-3,35 s** (au-dessus du seuil « bon » de 2,5 s de Google, sous le seuil « mauvais » de 4 s) ; TBT 199-355 ms ;
CLS ≤ 0,018 ; **≈ 435-464 Ko de JavaScript par page**. Détail : PDF to Word 89, JPG to PDF 89, Audio Converter 89, Video to
GIF 89, Image Compressor 88, PDF Merge 88, PDF Split 88, Word to PDF 88, Video to Audio 88, Percentage Calculator 88, PDF
Compress 87, PDF to JPG 87, Video Converter 87, PNG to JPG 87, Image Converter 87, CSV to SQL 87, Background Remover 86,
QR Generator 86, JSON Formatter 86, Image Resizer 84. (Une première mesure de CSV to SQL à 56 et de Background Remover à 70
était du bruit : 87 et 86 à la remesure.)

### 1c. Indexation réelle
- La recherche web disponible ici **n'est pas Google** et n'honore pas `site:` ; Bing affiche « About 402,000 results » pour
  `site:onlineconvertools.com` **sans montrer une seule de nos pages** (chiffre inutilisable). Une page apparaît dans les
  résultats de l'outil de recherche : `/tools/developer-tools/hash-generator` (« Hash Generator — MD5, SHA-256… »).
- Le chiffre fiable est dans la **Search Console** (Inspection de l'URL, rapport Indexation) : à relever par le propriétaire.
  Rappel du plan : 13/09, 10 catégories sur 12 indexées ; 29/09, 9 des 10 pages travaillées n'étaient pas indexées avant la
  demande ; **relevé de position prévu entre le 10 et le 24 novembre**.
- Pour la requête « csv to sql converter create table insert » (une des 10 pages travaillées), nous ne figurons pas dans les
  10 premiers résultats de cet outil (TableConvert, CodeShack, ai2sql…).

### 1d. Marché (6 concurrents × 5 outils — HTML brut, une lecture par page)

| Outil | Concurrents (titre ; mots ; JSON-LD ; langues) | Nous |
|---|---|---|
| PDF to Word | Smallpdf « PDF to Word Converter: Convert PDF to DOCX for Free », ~755 mots, HowTo + FAQPage + **AggregateRating 4,5 (1 058 899 votes)**, 14 langues ; PDF24 « … - 100% free & online - PDF24 », ~640, WebApplication + **AggregateRating 4,89 (12 879)**, 18 langues ; FreeConvert ~1 405 mots, 16 langues ; iLovePDF ~170 mots, ~25 langues ; CloudConvert ~176 mots, 0 langue | « PDF to Word — Convert Your PDF to an Editable .docx Online Free », ~700 mots, 7 FAQ, **0 JSON-LD**, 0 langue |
| Image Compressor | iLoveIMG ~86 mots + pages compress-jpg / -png / -gif / -svg ; FreeConvert ~860 mots + 32 pages par format | ~756 mots, 9 FAQ ; **aucune page par format** |
| JPG to PDF | Smallpdf ~570 mots, 5/5 (738 235 votes) visibles ; PDF24 4,94 (5 446) ; FreeConvert ~1 890 mots | **titre cassé** ; ~638 mots |
| Background Remover | iLoveIMG seul (Smallpdf, CloudConvert, FreeConvert, PDF24, 123apps n'en ont pas) | ~393 mots |
| Audio Converter | FreeConvert ~830 mots + **64 pages par format** ; CloudConvert 21 ; 123apps : domaine dédié, formats dans le titre | ~600 mots |

**Ce qui nous manque**, par effet probable sur le trafic : (1) pages indexables dans d'autres langues (tous sauf
CloudConvert ; 14 à ~25 langues, adresses traduites) — **gelé par le plan** ; (2) titres : 8 cassés, motif du marché
« X to Y Converter — Convert X to Y Free | Marque » (mot « Converter », variantes DOCX / Photo, marque en fin) ; H1 nus
(« PDF to Word ») contre « Free PDF to Word Converter » ; (3) pages d'atterrissage **par format** (longue traîne :
compress-jpg, aac-converter…) alors que nos outils gèrent déjà ces formats ; (4) note réelle visible + AggregateRating
(**jamais de chiffres inventés** : il faudrait collecter de vrais votes) ; (5) JSON-LD WebApplication + BreadcrumbList sur
toutes les pages (FAQ et HowTo n'apportent presque plus d'extraits enrichis depuis 2023 — connaissance générale, non
revérifiée) ; (6) bloc « outils liés / autres formats » sur chaque page ; (7) guides de blog liés depuis l'outil (Smallpdf :
20 liens) ; (8) méta-descriptions orientées bénéfices (« no sign-up, no watermark ») au lieu de techniques. **Pas un écart :**
le volume de texte (nos 400-760 mots ≈ Smallpdf et PDF24 ; iLovePDF et CloudConvert se classent avec ~100-200 mots grâce à
leur autorité — facteur hors page, liens entrants).

### 1e. AdSense — conditions vérifiées sur la documentation officielle de Google

| Condition | Source officielle | Statut | À faire (rien n'a été modifié) |
|---|---|---|---|
| Âge ≥ 18 ans, accès au HTML | [answer/9724](https://support.google.com/adsense/answer/9724) | présent | demande faite par le propriétaire |
| Contenu original de qualité, navigation claire | [answer/7299563](https://support.google.com/adsense/answer/7299563) | présent (menu, 12 catégories, FAQ et textes propres ; aucune page « coming soon ») | 40 outils < 300 mots et 57 outils développeur proches : risque « faible valeur » à réduire |
| Pas d'annonces sur des écrans sans contenu / de faible valeur / d'alerte ou de navigation | [publisherpolicies/10502938](https://support.google.com/publisherpolicies/answer/10502938) | à surveiller | jamais d'annonce sur les écrans de résultat, progression, erreur, 404, /signin, /contact |
| **Politique de confidentialité** : cookies tiers et Google pour les annonces, refus de la personnalisation (Ads Settings, aboutads.info), fournisseurs nommés | [answer/1348695](https://support.google.com/adsense/answer/1348695), [publisherpolicies/10437794](https://support.google.com/publisherpolicies/answer/10437794) | **à corriger** : `/privacy` ne parle pas de publicité (logique tant que les annonces sont coupées) | section « Advertising » + cookies `__gads`, `__gpi`, IDE + lien [partner-sites](https://policies.google.com/technologies/partner-sites) (déjà présent pour Analytics) |
| **CMP certifiée Google intégrée au TCF** pour l'EEE et le Royaume-Uni (depuis le 16/01/2024), la Suisse (depuis le 31/07/2024) | [answer/13554116](https://support.google.com/adsense/answer/13554116), [politique de consentement UE](https://www.google.com/about/company/user-consent-policy/) | **absente** (ni `__tcfapi`, ni Funding Choices, ni Cookiebot/OneTrust) | activer le message RGPD d'AdSense (« Privacy & messaging », CMP certifiée gratuite) ou une CMP certifiée |
| **Consentement pour Google Analytics (aujourd'hui)** | [politique de consentement UE](https://www.google.com/about/company/user-consent-policy/) | **à corriger, risque déjà présent** : `gtag` `G-7GFHW05JLH` chargé sans aucun `gtag('consent', …)` — cookies `_ga` posés sans consentement pour les visiteurs de l'UE | Consent Mode v2 relié à la CMP |
| Conditions d'utilisation | recommandé | présent mais **incohérent** : `/terms` §6 cite Google AdSense et « the consent message », qui n'existe pas encore | aligner au moment de l'activation |
| À propos, Contact | recommandés (aucune page officielle ne les exige) | présents ; `/about` court (136 mots), sans canonical ni éditeur / pays ; Contact propose un sujet « Billing » (site gratuit) | enrichir `/about` (qui édite, Québec, méthode de test) |
| ads.txt | [answer/12171612](https://support.google.com/adsense/answer/12171612) (fortement recommandé) | **absent** (404) | `public/ads.txt` : `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` après obtention de l'ID |
| Vérification de propriété | [answer/7584263](https://support.google.com/adsense/answer/7584263) | à faire | code AdSense dans le `<head>`, balise meta ou ads.txt |
| Trafic et clics (pas de clic sur ses propres annonces, pas d'échange de trafic, pas de téléchargement sans clic, pas de pop-up) | [answer/48182](https://support.google.com/adsense/answer/48182) | conforme aujourd'hui | les bancs ne doivent jamais charger de page avec annonces actives ; annonces loin des boutons Download / Convert |

## 2. Proposition de plan, en lots (classés par effet attendu sur le trafic, puis par effort)

| Lot | Contenu | Effet attendu | Effort | Nature |
|---|---|---|---|---|
| **S1** | **Corriger les 8 titres cassés** + « About … \| OnlineConverTools » doublé + `/tools` « Free … Free » ; canonical de `/` et `/about` ; un seul H1 sur l'accueil | moyen (titres = premier signal de pertinence ; aujourd'hui des phrases coupées dans Google) | ≈ 1 h | **technique** (textes de titre : validation rapide du propriétaire) |
| **S2** | Bloc **« outils liés / autres formats »** rendu côté serveur sur chaque page d'outil (4 à 8 liens choisis par catégorie et par format) | fort à moyen (maillage interne aujourd'hui nul ; transmet l'autorité des 10 catégories indexées vers les 215 outils) | ≈ 1 jour | technique |
| **S3** | **JSON-LD** WebApplication + BreadcrumbList (+ FAQPage déjà visible) sur les 215 outils, Organization + WebSite sur l'accueil, depuis le modèle des 10 pages du 29/09 | faible à moyen (résultats plus lisibles, fil d'Ariane ; peu d'extraits enrichis FAQ depuis 2023) | ≈ ½ jour | technique |
| **S4** | **Titres et méta-descriptions au motif du marché** (« X to Y Converter — Convert … Free \| OnlineConverTools », descriptions ≤ 155 caractères orientées bénéfices) sur les 50 outils les plus demandés, mesurés avant / après dans la Search Console | moyen à fort (clics par impression ; ne compte qu'après le relevé de novembre des 10 pages déjà travaillées) | ≈ 1-2 jours | **décision du propriétaire** (ton et marque) |
| **S5** | **Pages d'atterrissage par format** (compress-jpg, compress-png, mp3-converter, wav-to-mp3…) sur le même outil, texte propre à chaque format | fort sur la longue traîne (motif FreeConvert / iLoveIMG / CloudConvert) | ≈ 1 semaine pour ~40 pages ; risque « pages minces » si mal faites | **décision du propriétaire** |
| **S6** | Enrichir les **40 outils < 300 mots** (texte, image, développeur) : exemple réel, cas d'usage, FAQ issues des vraies questions | moyen (et condition AdSense « faible valeur ») | ≈ 2-3 jours | décision du propriétaire (priorité vs S5) |
| **S11** | **LCP mobile 3,2 s → < 2,5 s** : ≈ 450 Ko de JavaScript chargés par chaque page d'outil (menu, composants communs) ; découpage et chargement différé | faible à moyen (Core Web Vitals = signal de classement secondaire) | ≈ 1-2 jours | technique |
| **S7** | `lastmod` réel par page (date du dernier changement du fichier de la page, pas l'heure du build) ; redirection directe `http://onlineconvertools.com` → www en 1 saut | faible | ≈ 2 h | technique |
| **S8** | **Note réelle** (vote sur la page après un résultat, stockage, AggregateRating seulement au-delà d'un nombre de votes réels) | moyen à terme (étoiles, confiance) | ≈ 1 jour + collecte | **décision du propriétaire** |
| **S9** | Guides de blog liés depuis les outils (scanned PDF to Word, compresser un PDF pour un courriel…) | moyen à long terme | continu | décision du propriétaire |
| **S10** | **Internationalisation** (pages indexables en fr/es/de… — l'écart le plus visible avec le marché) | potentiellement le plus fort, mais **gelé par le plan** jusqu'à un trafic organique réel | plusieurs semaines | **décision du propriétaire** (dégel ou non) |
| **A1** | **Consentement** : CMP certifiée (message RGPD d'AdSense, gratuit) + Consent Mode v2 pour Analytics — **utile dès maintenant** (cookies `_ga` posés sans consentement pour l'UE), obligatoire avant toute annonce personnalisée | conformité (pas de trafic) | ≈ ½ jour | **décision du propriétaire** (choix de la CMP ; compte AdSense requis pour celle de Google) |
| **A2** | Section « Advertising » de `/privacy`, cookies publicitaires, `/terms` §6 aligné, `/about` enrichi, `ads.txt` après l'ID éditeur | condition d'approbation | ≈ 2 h | technique, **au moment de la demande AdSense** (décision du propriétaire) |

**Ordre recommandé** : S1 → S2 → S3 (techniques, ≈ 2 jours en tout, sans attendre) ; A1 (conformité Analytics, dès que le
propriétaire choisit la CMP) ; relevé Search Console de novembre pour les 10 pages travaillées ; puis décision sur S4 / S5 /
S6 selon ce relevé ; S10 reste gelé.
