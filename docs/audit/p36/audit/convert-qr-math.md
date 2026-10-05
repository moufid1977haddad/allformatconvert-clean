# P36 lot 2 — audit du texte servi, lot « convert-qr-math » (12 outils)

Lu le 05/10/2026 (branche p36, lecture seule). Texte confronté : `docs/audit/p36/contenu-avant.json` (titre, méta, H1,
interface, About, étapes, FAQ, astuces) + textes visibles rendus par le code mais absents de l'extraction (notes des liens
« Related tools » fournies par la page, légende de l'exemple).

**Conventions.** Les chemins sans préfixe sont relatifs à `app/tools/` ; ceux qui commencent par `app/`, `node_modules/`
ou `docs/` sont relatifs à la racine du dépôt. « étape n » = n-ième élément de `howTo`, « FAQ n » = n-ième question,
« astuce n » = n-ième élément de `tips`, dans l'ordre de la page. Un titre coupé au milieu d'une phrase (« … With »,
« …, Median, ») est classé **MINCE** quand il ne dit rien de faux, **FAUX/TROMPEUR** quand ce qu'il en reste est faux ou
partiel. « Vérifié node » = calcul rejoué en local avec Node 24 sur la fonction du code (aucun navigateur, aucun serveur).

**Constats communs au lot (vrais, donc hors tableaux) :** aucun des 12 outils n'appelle une route `app/api/*` de calcul ou
de conversion, donc aucune inscription, aucun quota par réseau, aucun plafond de dépense (grep `fetch(` et `/api/` sur
les 12 dossiers et `app/lib/qrRender.js`, `qrPayload.js`, `mathTools.js` : seuls `currency-converter/page.jsx:52`,
`currency-converter/RateHistory.jsx:21,51` et `mobi-to-epub/page.jsx:109` (adresse `blob:` locale) font une requête).
Seule sortie vers le site : quand une page affiche un message d'erreur via `useToolError` / `reportShownMessage`, le
texte affiché, nettoyé, part vers `/api/report-error` (`app/lib/useToolError.js:28-29`, `app/lib/reportError.js:16,72-121`) —
cela compte pour les phrases « nothing you type is sent » (voir barcode-generator et statistics-calculator).

---

## 1. Color Converter — `/tools/converter-tools/color-converter`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| color-converter | titre | « Convert Between Hex, RGB Online Free » | FORMAT | HSL, HSV/HSB et CMYK sont aussi éditables et copiables (`converter-tools/color-converter/page.jsx:73-77`), plus l'opacité (alpha) (`page.jsx:133-134`) et HEX à 3/4/6/8 chiffres (`page.jsx:10-18`) | Titre qui nomme HEX, RGB, HSL, HSV et CMYK |
| color-converter | méta | « converts between HEX, RGB, and HSL color values » | FORMAT | HSV et CMYK absents de la méta (`converter-tools/color-converter/layout.tsx:6`) alors que la page les convertit (`page.jsx:76-77`) | Méta qui liste les 5 formats + alpha + contraste WCAG |
| color-converter | FAQ 3 | « the same as most online converters » | INVÉRIFIABLE | Le code ne cite que RapidTables et ColorHexa comme références (`page.jsx:5`) ; aucun relevé « most » dans `docs/audit/` | « the formula RapidTables and ColorHexa also use » ou supprimer |
| color-converter | FAQ 2 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | Vrai (aucune route serveur), mais copiable sur toute page | Fusionner dans une ligne de faits propre à l'outil |
| color-converter | FAQ 6 | « all color math happens locally in your browser — what you enter is never sent to a server » | GÉNÉRIQUE | Vrai (aucune requête dans `page.jsx`), phrase copiable | Dire concrètement : aucun envoi, pas même les messages d'erreur (la page n'utilise pas `useToolError`) |
| color-converter | astuce 1 | « Use the color picker swatch for quick visual selection instead of typing values manually. » | GÉNÉRIQUE | Le sélecteur est un `<input type="color">` (`page.jsx:127`) ; conseil sans information | Remplacer par un fait : le sélecteur ne gère pas l'alpha, utiliser le curseur « Opacity (alpha) » (`page.jsx:133-134`) |
| color-converter | astuce 3 | « HSV is the model most design tools use in their color pickers » | INVÉRIFIABLE | Aucune source dans le code ni dans `docs/audit/` | Supprimer « most design tools » ; garder « Photoshop calls it HSB » seulement si sourcé |

## 2. Currency Converter — `/tools/converter-tools/currency-converter`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| currency-converter | titre | « Convert Between 24 Major World » | FAUX | La liste vient de l'API (`converter-tools/currency-converter/page.jsx:12,74`) : 166 devises (`docs/audit/RAPPORT-licence-et-ameliorations.md:124-126`, « 166 devises au lieu de 24 ») ; 20 devises « populaires » en tête (`page.jsx:14`) ; titre en plus coupé (`layout.tsx:5`) | Titre complet sans « 24 » (166 devises, taux quotidiens, historique) |
| currency-converter | FAQ 5 | « the amount and the currencies you choose are never sent anywhere » | FAUX | Les deux codes choisis partent vers api.frankfurter.dev : `rates?base=${from}&quotes=${to}` (`RateHistory.jsx:49,51`), et la liste `/currencies` y est demandée (`RateHistory.jsx:21`) ; la même réponse le dit plus loin (contradiction interne) | « The amount never leaves your browser; the two currency codes are sent to Frankfurter for the history chart » |
| currency-converter | About + FAQ 3 | « each shown with its full name » / « each with its full name » | TROMPEUR | Les noms viennent de `Intl.DisplayNames` du navigateur (`page.jsx:15-18`) ; un code inconnu du navigateur s'affiche seul (`page.jsx:17`), et sans `Intl.DisplayNames` toute la liste n'a que des codes (`page.jsx:16`). Vérifié node (ICU de Node 24, pas un navigateur) : FOK, KID, TVD, GGP, IMP, JEP n'ont pas de nom | « with its full name where your browser knows it (a few territory currencies such as FOK or KID show only their code) » |
| currency-converter | FAQ 3 | « every currency with a published daily rate » | INVÉRIFIABLE | La liste est ce que renvoie `open.er-api.com/v6/latest/USD` (`page.jsx:12,74`), rien ne prouve l'exhaustivité | « the 166 currencies ExchangeRate-API publishes » |
| currency-converter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Remplacer par un fait propre (source des taux, attribution, fréquence) |
| currency-converter | astuce 4 | « Bookmark the tool for quick reference during travel or online shopping in another currency. » | GÉNÉRIQUE | Aucune information sur l'outil | Remplacer par la fonction non dite « {montant} {devise} in other currencies » (tableau des 20 devises populaires, `page.jsx:124-134`) |

## 3. MOBI to EPUB — `/tools/converter-tools/mobi-to-epub`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| mobi-to-epub | méta + About + FAQ 1 | « a real, standards-compliant EPUB file » / « standards-compliant, ZIP-based EPUB » | FAUX | Le paquet est déclaré EPUB 3.0 (`converter-tools/mobi-to-epub/page.jsx:187`) mais le `<metadata>` n'a pas la `meta property="dcterms:modified"` que la norme EPUB 3 exige (`page.jsx:176-206`, aucun « modified » dans le fichier) ; `dc:language` peut valoir « unknown » (parser `node_modules/@lingo-reader/mobi-parser/dist/index.browser.mjs:785`, écrit tel quel `page.jsx:191`). Aucun rapport epubcheck dans `docs/audit/` | « an EPUB 3 file (ZIP with the mimetype entry first, OPF, nav and NCX table of contents) » sans « standards-compliant » |
| mobi-to-epub | About | « so chapters, images, and the cover are extracted correctly … that opens in standard e-reader apps » | INVÉRIFIABLE | Aucun rapport d'ouverture dans des liseuses dans `docs/audit/` (seuls `2026-09-06-couverture-formats.md:61-81`, `PROGRESS-famille4.md:19` sur les extensions) | Décrire ce qui est copié (chapitres dans l'ordre du spine, images, feuilles de style, couverture, titre/auteur/éditeur/description) sans garantie d'ouverture |
| mobi-to-epub | FAQ 1 | « Will this reliably convert my MOBI ebook to a working EPUB? » — « Yes » | INVÉRIFIABLE | Aucune mesure de fiabilité dans `docs/audit/` | Question factuelle : « What is copied into the EPUB? » |
| mobi-to-epub | FAQ 3 + astuce 2 | « The parser automatically detects whether a file uses the older MOBI6 structure … or the newer KF8 structure » / « with the internal format detected automatically » | TROMPEUR | Le choix se fait par l'extension : `.azw3` → lecteur KF8, sinon lecteur MOBI6 ; l'autre n'est essayé que si le premier lève une erreur (`page.jsx:243-254`) | « A .azw3 file is read as KF8, the others as MOBI6; if that fails, the other reader is tried » |
| mobi-to-epub | titre | « Convert Your Kindle Ebook » | TROMPEUR | Les fichiers protégés DRM ne sont pas convertis, et la page ne le détecte pas : le champ `encryption` est lu par le parser (`index.browser.mjs:162`) mais jamais testé, ni par le parser ni par `page.jsx` (aucun test DRM) — effet réel sur un fichier DRM non vérifié | « Convert a DRM-free MOBI, AZW, AZW3 or PRC ebook to EPUB » |
| mobi-to-epub | interface | « Click or drop a MOBI file here » / « Choose a MOBI file » | FORMAT | Le sélecteur accepte `.mobi,.azw,.azw3,.prc` (`page.jsx:376`) ; l'invite ne nomme que MOBI (`page.jsx:375`, `app/components/UploadPrompt.jsx:10-11`) | « a MOBI, AZW, AZW3 or PRC file » |
| mobi-to-epub | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Fusionner dans une ligne de faits |
| mobi-to-epub | FAQ 4 | « No. All processing happens locally in your browser — your file is never uploaded to a server. » | GÉNÉRIQUE | Vrai (seul `fetch` = adresse `blob:` locale, `page.jsx:109`) ; copiable | Dire ce qui se passe réellement : fichier lu en mémoire, EPUB créé par JSZip dans la page (`page.jsx:278-357`) |
| mobi-to-epub | astuce 4 | « Always open the resulting EPUB in your e-reader app to confirm it looks right before deleting your original file. » | GÉNÉRIQUE | Redite de l'étape 4 | Remplacer par un fait (liens internes non réécrits, nom de sortie `<nom>.epub` `page.jsx:385`) |
| mobi-to-epub | page entière | — | MINCE | Faits du code absents du texte : aucune limite de taille (aucune constante, tout le fichier en mémoire `page.jsx:284`) ; métadonnées recopiées (titre, auteurs, éditeur, description, langue, couverture `page.jsx:176-195`) ; table des matières NCX + nav (`page.jsx:208-241`) ; message d'erreur « No readable chapters found in this file. » (`page.jsx:289`) ; nom du fichier de sortie (`page.jsx:385`) ; bouton « Save / Share » sur les appareils qui partagent (`app/components/FileDownload.jsx:213-218`) | Ajouter un bloc « Formats et limites » et « Ce qui est copié » |

## 4. Unit Converter — `/tools/converter-tools/unit-converter`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| unit-converter | titre | « Convert Between Units Across Six Categories » | FAUX | 12 catégories (`converter-tools/unit-converter/page.jsx:15-29`) | « … across 12 categories » (ou les nommer) |
| unit-converter | méta | « six categories — Length, Weight, Temperature, Speed, Area, and Volume » | FAUX | 12 : + Fuel economy, Time, Data, Pressure, Energy, Power (`page.jsx:20,24-28`) | Méta avec les 12 catégories |
| unit-converter | étape 1 | « (Length, Weight, Temperature, Speed, Area, Volume, Time, Data, Pressure, Energy or Power) » | FAUX | Il y a aussi le bouton « Fuel economy » (`page.jsx:20,104-114`) | Ajouter « Fuel economy » |
| unit-converter | étape 4 | « with the factor for one unit underneath » | TROMPEUR | La ligne « 1 X = … » n'est pas affichée pour Temperature ni Fuel economy (`page.jsx:155`) | « … (except for temperature and fuel economy, which are not simple factors) » |
| unit-converter | astuce 2 | « the conversion isn't a simple multiplier like the other categories, since Celsius, Fahrenheit, and Kelvin use different zero points » | TROMPEUR | Fuel economy n'est pas un multiplicateur non plus (L/100 km est l'inverse de km/L, `page.jsx:31-37`) ; Rankine oublié (`page.jsx:19,43`) | Citer aussi Rankine et la consommation (inverse) |
| unit-converter | FAQ 1 | « Yes, it's completely free with no signup and no limits. » | GÉNÉRIQUE | Vrai, copiable | Fusionner dans une ligne de faits |
| unit-converter | FAQ 4 | « everything is calculated locally in your browser — what you enter is never sent to a server » | GÉNÉRIQUE | Vrai (aucune requête), copiable | Remplacer par un fait propre (saisie : séparateurs de milliers, « 1,000 » ambigu refusé `page.jsx:63-75,153`) |
| unit-converter | astuce 4 | « Bookmark this page for quick access to conversions you use often in cooking, DIY, or technical work. » | GÉNÉRIQUE | Aucune information | Remplacer par un fait (notation scientifique dès 1e15 et sous 1e-6, `page.jsx:53-55` ; alerte sous le zéro absolu `page.jsx:85,131`) |

## 5. Barcode Generator — `/tools/qr-barcodes-tools/barcode-generator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| barcode-generator | méta + interface + About + étape 4 | « Every code is scanned back before you download it. » / « Every code is read back by an independent decoder before it is offered » / « each code is drawn, then scanned back by a separate reader » | TROMPEUR | 5 types sur 37 ne sont pas relus : MSI Plessey, Pharmacode, Code 11, EAN-5 seul, EAN-2 seul (`zxing: null`, `qr-barcodes-tools/barcode-generator/symbologies.js:19-21,38-39` ; `page.jsx:118`, message `page.jsx:416`). Et ce qui est relu est l'image raster dessinée sur le canvas ; SVG, PDF et EPS sont redessinés à part et ne sont pas décodés (`render.js:327-336`, `page.jsx:140-141`) | « Each code is drawn and read back by zxing-cpp before the files are offered — except MSI Plessey, Pharmacode, Code 11 and the standalone EAN-5/EAN-2, which no browser reader decodes (the page says so). SVG/PDF/EPS are drawn from the same settings. » |
| barcode-generator | FAQ 3 | « MSI Plessey, Pharmacode and Code 11 have no such reader in a browser » | TROMPEUR | EAN-5 seul et EAN-2 seul non plus (`symbologies.js:38-39`) | Lister les 5 types |
| barcode-generator | FAQ 3 | « only offers the files if it reads exactly what you entered (check digits included) » | TROMPEUR | Code 39 et Interleaved 2 of 5 avec « Add the optional check digit » : la valeur attendue est `null`, la page vérifie seulement qu'un code du bon type a été lu (`render.js:282-283,301,324`) | Ajouter l'exception |
| barcode-generator | About | « Download PNG, JPG or GIF with the resolution written in » | FAUX | Seuls PNG (bloc pHYs, `render.js:204-215`) et JPG (densité JFIF, `render.js:216-224`) reçoivent la résolution ; le GIF est encodé sans (`render.js:239-248,331`) | « PNG and JPG with the resolution written in; GIF … » |
| barcode-generator | FAQ 4 | « PNG, JPG and GIF use a whole number of pixels per module … and writes that resolution into the file » | FAUX | Idem : pas de résolution dans le GIF (`render.js:239-248,331`) ; la phrase est dans `seo.js:7` | Retirer GIF de « writes that resolution » |
| barcode-generator | FAQ 6 | « or import a CSV or TSV file » | TROMPEUR | Fichier refusé au-delà de 5 Mo (`page.jsx:160`), limite non dite (`seo.js:9`) | « (up to 5 MB) » |
| barcode-generator | FAQ 9 + About | « nothing you type is sent to a server » / « nothing is uploaded » | TROMPEUR | Quand aucun code d'un lot n'a pu être fait, le message affiché contient les valeurs (« No code could be made: line 1: <valeur> — … », `page.jsx:198`) ; l'erreur passe par `useToolError` (`page.jsx:64`) et part nettoyée vers `/api/report-error` (`app/lib/useToolError.js:28-29`) ; le nettoyage ne retire que les passages entre guillemets, URL, courriels, suites de 7 chiffres et noms de fichier (`app/lib/reportError.js:72-121`) — une valeur courte non citée passe | Corriger le message (valeurs entre guillemets) ou dire « except the text of an error message, without your file » |
| barcode-generator | étape 2 | « switch to "Many (ZIP)" » | LIBELLÉ | Le bouton s'appelle « Many (ZIP or labels) » (`page.jsx:267`) | Citer le vrai libellé |
| barcode-generator | étape 4 | « Click Generate » | LIBELLÉ | Boutons « Generate Barcode » (`page.jsx:395`), « Generate all as ZIP » / « Generate label sheets (PDF) » (`page.jsx:398`) | Citer les trois libellés |
| barcode-generator | lien associé (note fournie par la page) | « QR Scanner — decode a QR code from an image » | LIBELLÉ | L'outil s'appelle « QR Code Scanner » (`app/lib/relatedTools.js:394`) et lit aussi la caméra et les codes-barres (`qr-scanner/page.jsx:86-115`, `qr-scanner/scan.worker.js:12`) ; note dans `seo.js:28` | « QR Code Scanner — camera or image, QR codes and barcodes » |

## 6. QR Code Generator — `/tools/qr-barcodes-tools/qr-generator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| qr-generator | titre | « Instantly Turns … » | INVÉRIFIABLE | Aucune mesure de durée dans `docs/audit/` ; génération + relecture jsQR asynchrones (`qr-barcodes-tools/qr-generator/page.jsx:84-99`) | Retirer « Instantly » |
| qr-generator | titre | « Any Text or URL » | TROMPEUR | Un contenu trop long est refusé : « This is too much content for one QR code… » (`page.jsx:86`) ; huit types, pas seulement texte/URL (`app/lib/qrPayload.js:11-20`) | « QR Code Generator — Links, Wi-Fi, vCard, SMS… as PNG, SVG or PDF » |
| qr-generator | méta + interface + About + étape 3 + FAQ 4 | « each one scanned back before download » / « Every code is scanned back before you download it » / « every code is read back by a QR decoder before you can download it » | TROMPEUR | Seul le dessin PNG du canvas est décodé (réduit à 800 px, jsQR, `app/lib/qrRender.js:117-136` ; `page.jsx:88-94`) ; le SVG et le PDF sont dessinés à part et non décodés (`qrRender.js:62-113`), et le PDF dessine la forme « Rounded » en carrés (`qrRender.js:103`) | « The PNG drawing is read back by a QR decoder before the files are offered; SVG and PDF use the same module grid » |
| qr-generator | About + FAQ 5 | « a choice of module shapes » / « SVG or PDF for print » | TROMPEUR | La forme « Rounded » devient carrée dans le PDF (`qrRender.js:103`) ; seuls PNG et SVG la gardent (`qrRender.js:47-48,80`) | « Rounded is kept in PNG and SVG; the PDF draws square modules » |
| qr-generator | FAQ 5 + astuce 1 | « both are vector files that stay sharp at any size » / « they stay crisp at any size » | TROMPEUR | Avec un logo : le SVG embarque l'image telle qu'envoyée (`qrRender.js:85`), le PDF une copie PNG de 512 px au plus (`page.jsx:66-72`, `qrRender.js:106`) | « The code itself is vector; a logo stays the image you gave (PDF: at most 512 px) » |
| qr-generator | About | « Unlike most generators » | INVÉRIFIABLE | Seul QRCode Monkey a été comparé (`page.jsx:11-13`) | « Unlike QRCode Monkey » ou supprimer |
| qr-generator | FAQ 4 | « the way a phone camera does » | INVÉRIFIABLE | Le lecteur est la bibliothèque jsQR, lumineux sur sombre non essayé (`qrRender.js:126,134`) | « decodes it with jsQR, an open-source QR reader » |
| qr-generator | FAQ 2 | « (phones join the network when they scan it) » | INVÉRIFIABLE | Le code écrit seulement la charge `WIFI:T:…;S:…;P:…;` (`qrPayload.js:50-56`) ; le comportement du téléphone n'est pas prouvé dans le dépôt | « most phone cameras offer to join the network » sans garantie, ou supprimer |
| qr-generator | étape 3 | « check it holds exactly what you typed » | TROMPEUR | Ce qui est vérifié est la charge construite : « https:// » ajouté à une adresse sans schéma (`qrPayload.js:29`), numéros nettoyés de tout sauf chiffres + * # (`qrPayload.js:9,42,46`), préfixes `mailto:`, `tel:`, `SMSTO:`, `geo:` (`qrPayload.js:39-75`) | « check it holds exactly the content built from your fields » |

## 7. QR Code Scanner — `/tools/qr-barcodes-tools/qr-scanner`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| qr-scanner | titre + méta | « Decode Any QR Code Image » / « decodes any QR code image » | TROMPEUR | Seules les images que le navigateur sait ouvrir passent (`qr-barcodes-tools/qr-scanner/page.jsx:55,60-62,82`) ; au-delà de 12 Mpx l'image est réduite (`page.jsx:65-68`) ; échec possible (« No QR code or barcode found in this image », `page.jsx:77`) | « Scan a QR code or barcode from your camera, a photo or a screenshot » |
| qr-scanner | titre + méta | (QR seulement) | FORMAT | Les images envoyées ou collées sont lues pour tous les formats de zxing-cpp (`formats: []`, `scan.worker.js:12`) : codes-barres compris ; non dit dans titre et méta (`layout.tsx:5-6`) | Nommer « QR codes and barcodes » |
| qr-scanner | About | « from any image » | TROMPEUR | Idem ligne 1 (`page.jsx:55,60-62`) | « from a photo or screenshot (PNG, JPG, … any image your browser opens) » |
| qr-scanner | About | « instantly retrieve » | INVÉRIFIABLE | Décodage dans un Worker avec délai de garde de 20 s (`page.jsx:28-34`) ; aucune mesure | Retirer « instantly » |
| qr-scanner | FAQ 5 | « EAN-13, EAN-8, UPC, Code 128, Code 39, ITF, Data Matrix, PDF417, Aztec and Micro QR » / « (zxing, the reference open-source decoder) » | FORMAT | `formats: []` = tous les formats lus par zxing-cpp, dont Code 93 et Codabar cités dans le code (`scan.worker.js:2,12`) ; « the reference » sans source | Liste complète ou « and the other formats zxing-cpp reads (Code 93, Codabar…) » ; retirer « the reference » |
| qr-scanner | FAQ 1 | « Yes, it's completely free and requires no registration to decode unlimited QR codes. » | GÉNÉRIQUE | Vrai (aucune limite, aucune route), copiable | Fusionner dans une ligne de faits |
| qr-scanner | FAQ 3 | « Do I need to install any software? No, … works directly in your browser without any downloads or installations. » | GÉNÉRIQUE | Exemple type des consignes | Supprimer |

## 8. Fraction Calculator — `/tools/math-tools/fraction-calculator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| fraction-calculator | titre | « Adds, Subtracts, Multiplies Online » | TROMPEUR | La division existe (bouton « / », `math-tools/fraction-calculator/page.jsx:58` ; `app/lib/mathTools.js:170-171`) ; titre coupé (`layout.tsx:5`) | Titre avec les 4 opérations, nombres mixtes, étapes |
| fraction-calculator | étape 2 | « Choose +, -, × or ÷. » | LIBELLÉ | Les boutons affichent « + », « - », « * », « / » (`page.jsx:58-67`) | « Choose +, -, * or / » |
| fraction-calculator | FAQ 4 | « the first 100 digits are shown followed by '…' » | FAUX | Sont montrés 100 chiffres **plus** les chiffres non périodiques dus aux facteurs 2 et 5 du dénominateur, suivis de « … (the repeating part is longer than 100 digits) » (`mathTools.js:198-207`) | « the decimal is cut after the first 100 digits of the repeating part, followed by '…' » |
| fraction-calculator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Supprimer ou fusionner |

## 9. Percentage Calculator — `/tools/math-tools/percentage-calculator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| percentage-calculator | méta | « exact results as you type » | FAUX | Calcul en virgule flottante affiché à 10 chiffres significatifs (`math-tools/percentage-calculator/page.jsx:35,45,55,65,76,86` ; `app/lib/exactNumbers.js:10-14`) ; la FAQ 8 et l'exemple (« -16.66666667% ») le montrent ; méta dans `seo.js:13` | « results to 10 significant digits as you type » ; citer les 6 calculs |
| percentage-calculator | FAQ 4 | « This calculator computes percentage change, not percentage difference. » | FAUX | Panneau « Percentage difference between X and Y » (`page.jsx:80-87`) ; phrase `seo.js:18` | « Both: the third panel gives the change, the sixth the difference » |
| percentage-calculator | FAQ 6 | « A decrease can never go below −100% » | FAUX | Formule (Y − X) ÷ abs(X) × 100 (`page.jsx:55`) : de 10 à −5 = −150 % (vérifié node) ; phrase `seo.js:20` | « … below −100 % only when the new value is negative » |
| percentage-calculator | FAQ 3 | « (new − old) ÷ old × 100 » | TROMPEUR | Le code divise par la valeur absolue de l'ancienne valeur (`page.jsx:55`, commentaire « from -10 to -5 is +50 % ») ; phrase `seo.js:17` | « (new − old) ÷ the absolute value of old × 100 » |
| percentage-calculator | FAQ 10 | « Do the three panels work independently? » | FAUX | Six panneaux (`page.jsx:29,39,49,59,69,80`) ; phrase `seo.js:24` | « Do the six panels… » |
| percentage-calculator | astuce 1 | « keep values filled in across all three at once » | FAUX | Six panneaux (`page.jsx:29-87`) ; texte `page.jsx:104` | « across all six » |
| percentage-calculator | exemple (légende) | « The three calculations » | TROMPEUR | La page en propose six (`page.jsx:29-87`) ; légende `seo.js:27` | « Three of the six calculations » |
| percentage-calculator | lien associé (note fournie par la page) | « Unit Converter — length, weight, temperature, speed, area and volume. » | FAUX | 12 catégories (`converter-tools/unit-converter/page.jsx:15-29`) ; note `seo.js:38` | Note à jour (12 catégories) |
| percentage-calculator | FAQ 9 | « It is free with no signup, and every calculation runs in your browser — nothing you type is sent anywhere. » | GÉNÉRIQUE | Vrai (aucune requête, pas de `useToolError` dans `page.jsx`), copiable | Garder un seul fait précis, sans la formule générique |

## 10. Roman Numeral Converter — `/tools/math-tools/roman-numeral-converter`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| roman-numeral-converter | FAQ 2 | « Does it validate strict Roman numeral syntax? No — … even unconventional ones like "IIII", so it won't flag … as errors. » | FAUX | Seule la forme canonique est acceptée : `fromRoman` refuse ce que `toRoman` n'écrit pas (`app/lib/exactNumbers.js:68-75`) ; message « "IIII" is not a valid Roman numeral (standard form, 1 to 3999 — for example 4 is IV, not IIII) » (`math-tools/roman-numeral-converter/page.jsx:51`) | « Yes: only the standard form is accepted (IIII, IM, VX are refused with a message) » |
| roman-numeral-converter | astuce 4 | « this tool doesn't flag non-standard letter combinations as invalid » | FAUX | Idem (`exactNumbers.js:68-75`, `page.jsx:33,51`) | Retourner l'astuce : la page signale les formes non standard |
| roman-numeral-converter | titre | « Convert Between Arabic Numbers » | MINCE | Titre coupé : la seconde moitié (« and Roman numerals ») manque (`layout.tsx:5`) | Titre complet |
| roman-numeral-converter | About | « converts between Arabic numbers (1–3999) and Roman numerals instantly and bidirectionally as you type, entirely in your browser. » | MINCE | Une seule phrase (`page.jsx:64`). Absents : refus des décimales/exposants avec message (`page.jsx:21`), message hors 1–3999 (`page.jsx:24`), validation stricte (`page.jsx:51`), majuscules automatiques (`page.jsx:28`) | About de 3–4 phrases avec ces faits |
| roman-numeral-converter | FAQ 4 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Supprimer |

## 11. Scientific Calculator — `/tools/math-tools/scientific-calculator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| scientific-calculator | titre | « Scientific Calculator — Evaluate Expressions With » | MINCE | Titre coupé après « With » (`math-tools/scientific-calculator/layout.tsx:5`) | Titre complet (degrés/radians, log/ln, n!, Ans, historique) |
| scientific-calculator | FAQ 4 | « very large or very small results use scientific notation instead of being rounded to 0 » | TROMPEUR | Affichage `String(Number(x.toPrecision(12)))` (`app/lib/mathTools.js:19-24`) : la notation scientifique n'apparaît qu'à partir de 1e21 ; 2^60 s'affiche « 1152921504610000000 » (12 chiffres puis des zéros, vrai 1152921504606846976 — vérifié node). Les petits nombres (< 1e-6) sont bien en notation scientifique | « 12 significant digits; below 0.000001 and from 1e21 up, scientific notation » |
| scientific-calculator | interface | « Advanced scientific calculator » | GÉNÉRIQUE | Sous-titre sans information (`page.jsx:115`) | Sous-titre factuel (« Degrees or radians, log and ln, n!, Ans and memory ») |
| scientific-calculator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Supprimer |

## 12. Statistics Calculator — `/tools/math-tools/statistics-calculator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| statistics-calculator | titre | « Compute Count, Sum, Mean, Median, » | MINCE | Titre coupé après une virgule (`math-tools/statistics-calculator/layout.tsx:5`) | Titre complet |
| statistics-calculator | FAQ 5 | « A measure that is not defined for your data shows — with the reason. » | FAUX | Sans raison : écart type et variance d'échantillon (`page.jsx:48,50`), IQR (`page.jsx:54`), erreur standard (`page.jsx:55`), coefficient de variation (`page.jsx:56`), valeurs aberrantes (`page.jsx:60`) affichent « — » seul ; la raison n'est donnée que pour les moyennes géométrique/harmonique, Q1/Q3, asymétrie et kurtosis (`page.jsx:45-46,52-53,57-58`) | « … shows —; for the means, quartiles, skewness and kurtosis the reason is written » |
| statistics-calculator | About | « any entry that isn't a number is listed » | TROMPEUR | Seules les 5 premières sont citées, puis « … » (`app/lib/mathTools.js:74`) | « the first five entries that aren't numbers are listed » |
| statistics-calculator | FAQ 6 | « Is my data uploaded? No — all calculations happen in your browser. » | TROMPEUR | Les entrées invalides figurent dans le message « Not a number: … » (`mathTools.js:74`), affiché par `useToolError` (`page.jsx:12,16`) et envoyé nettoyé à `/api/report-error` (`app/lib/useToolError.js:28-29`) ; le nettoyage laisse passer un mot court non cité (`app/lib/reportError.js:72-121`). Les nombres valides ne partent jamais | « Your numbers are never sent; if some entries are not numbers, the error text (up to five of them) is reported to us to fix bugs » — ou corriger le message (entrées entre guillemets) |
| statistics-calculator | étape 1 | « separated by commas, spaces or new lines » | FORMAT | Le point-virgule sépare aussi (`mathTools.js:72` : `/[\s,;]+/`), non dit nulle part | Ajouter « or semicolons » |
| statistics-calculator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Supprimer |

---

## Synthèse du lot « convert-qr-math »

12 outils lus, **85 défauts** (une ligne de tableau = un défaut) :

| Type | Nombre | Répartition |
|---|---|---|
| FAUX | 18 | currency 2, mobi-to-epub 1, unit 3, barcode 2, fraction 1, percentage 6, roman 2, statistics 1 |
| TROMPEUR | 23 | currency 1, mobi-to-epub 2, unit 2, barcode 5, qr-generator 5, qr-scanner 2, fraction 1, percentage 2, scientific 1, statistics 2 |
| INVÉRIFIABLE | 10 | color 2, currency 1, mobi-to-epub 2, qr-generator 4, qr-scanner 1 |
| GÉNÉRIQUE | 19 | color 3, currency 2, mobi-to-epub 3, unit 3, qr-scanner 2, fraction 1, percentage 1, roman 1, scientific 2, statistics 1 |
| MINCE | 5 | mobi-to-epub 1, roman 2, scientific 1, statistics 1 |
| LIBELLÉ | 4 | barcode 3, fraction 1 |
| FORMAT | 6 | color 2, mobi-to-epub 1, qr-scanner 2, statistics 1 |

Par outil : color 7, currency 6, mobi-to-epub 10, unit 8, barcode 10, qr-generator 9, qr-scanner 7, fraction 4,
percentage 9, roman 5, scientific 4, statistics 6.

Les plus graves : (1) Roman Numeral Converter, FAQ 2 + astuce 4 disent l'inverse du code (validation stricte) ;
(2) Percentage Calculator, FAQ 4 nie l'existence du 6e panneau et 3 textes parlent de « three panels » ; (3) Currency
Converter, FAQ 5 dit que les devises choisies ne partent nulle part alors qu'elles partent vers Frankfurter ; titre « 24 »
au lieu de 166.
