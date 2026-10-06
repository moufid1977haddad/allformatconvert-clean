# P37 lot 2 point 1 — PDF OCR sur iPhone / iPad : directement sur notre service OCR

Date : 06/10/2026. Branche p37. Rien n'est commité ni déployé (le contrôleur commite).

## Ce qui change

- Avant : sur iPhone / iPad, la page essayait l'OCR dans le navigateur (Tesseract.js). Après 20 s sans progrès, ou en cas d'échec, elle passait à notre service OCR (/api/pdf-ocr). Le passage réel sur iPhone du 06/10 a montré que l'appareil n'aboutit jamais (« Drawing the page… 0 % »).
- Après : sur iPhone et iPad (iPadOS qui se présente comme « Macintosh » avec écran tactile compris), toutes les pages vont tout de suite à notre service OCR. Le moteur Tesseract.js n'est même pas chargé. L'avis d'envoi est affiché avant « Run OCR ».
- Ailleurs (ordinateur, Android) : rien ne change. Le navigateur lit les pages, rien n'est envoyé, une étape bloquée 90 s s'arrête avec un message.
- La décision « appareil ou service » est une fonction pure : `app/lib/ocrFirstStep.js` (`ocrFirstStep(navigator, forced)`). Elle réutilise la détection du site (`app/lib/canvasLimit.js`), dont la logique est maintenant aussi exposée en fonction pure `appleTouchFrom(nav)` ; `isAppleTouchDevice()` l'appelle, comportement identique.
- Un PDF trop gros pour notre service (plus de 44 Mo, ou plus de 4 Mo si le service média n'est pas configuré) est refusé AVANT tout envoi, avec un message clair (`ServerPageOcr.tooLarge()`). Ce refus n'est pas signalé comme défaut.
- Sur iPhone / iPad, la seule étape faite sur l'appareil par page est la lecture du texte propre de la page (P35, 20 s max). Si elle n'aboutit pas une fois, les pages suivantes ne sont plus vérifiées : pas de 20 s d'attente en plus par page.
- `LOCAL_OCR_LIMIT_MS` / `LOCAL_OCR_LIMIT_LABEL` (serverPageOcr.js) supprimés : plus utilisés.
- Les messages d'erreur et la note finale ne disent plus « this device could not recognize… » : « Our OCR service could not recognize page N of M: … » et « Our own OCR service recognized pages 1, 2 and 3: your PDF was sent there, then deleted. »

## Tests

`node scripts/p37/ocr-ios-direct.test.mjs` (Node, sans navigateur) :
- avant : 0 réussi, 4 échecs (module absent, page sans décision, attente LOCAL_OCR_LIMIT_MS présente, tesseract.js chargé partout) ;
- après : 16 réussis, 0 échec. Cas : iPhone Safari, iPhone Chrome, ancien iPad, iPadOS « Macintosh » + 5 points tactiles → service ; Mac sans tactile, Mac à 1 point, Android téléphone et tablette, Windows tactile, Linux, sans navigator → appareil ; crochet de test `__forceServerPageRender`.

Script navigateur (à lancer par le contrôleur, non lancé ici) : `scripts/p37/ocr-ios-direct-browser.mjs`. /api/pdf-ocr est toujours intercepté (faux succès), /api/media/ticket aussi (refusé) : le vrai service n'est jamais appelé. Scénarios : iPhone 13 WebKit, iPad (UA « Macintosh » + 5 points tactiles) WebKit, ordinateur Chromium.

Contrôles de contenu, tous à 0 défaut :
- `node scripts/p36/content-verify.mjs --only=pdf-tools/pdf-ocr --verbose` : 0 failure (et `--only=pdf-tools/` : 39 pages, 0 failure) ;
- `node scripts/content-checks/instructions.mjs` : 0 mismatch ;
- `node scripts/content-checks/privacy-claims.mjs` : 0 failure (compte « À propos » inchangé : 225 / 57 / 4).

docs/audit/p36/preuves/pdf-2.json : inchangé (le « 20 seconds » venait du code, pas du texte ; « 90 seconds » toujours prouvé).

## Comparaison marché

- iLovePDF OCR : traitement sur leurs serveurs, sur tous les appareils ; fichiers supprimés sous 2 h (suppression immédiate possible).
- Smallpdf OCR : traitement sur leurs serveurs, sur tous les appareils ; fichiers supprimés sous 1 h.
- PDF24 OCR (en ligne) : traitement sur leurs serveurs (Allemagne), fichiers supprimés après 1 h ; une application de bureau hors ligne existe à part.
- Nous : lecture sur l'appareil pour ordinateur et Android (rien n'est envoyé) ; sur iPhone / iPad seulement, notre propre service, PDF supprimé dès le traitement fini, avec avis avant et après.

Sources : ilovepdf.com/blog/delete-file-from-ilovepdf, smallpdf.com/blog/how-to-turn-off-document-storage-with-smallpdf, help.pdf24.org (how long uploaded files stay on your server).

## Textes de la page : avant → après

- Sous-titre : « … in your browser (on iPhone and iPad, a page the device cannot read goes to our own OCR service) » → « … in your browser (on iPhone and iPad, on our own OCR service) ».
- Avis avant (iPhone / iPad) : « On iPhone and iPad, a page your device cannot recognize within 20 seconds is recognized by our own OCR service instead: your PDF is sent there, then deleted. » → « On iPhone and iPad, the text is recognized by our own OCR service, not by your device: when you click "Run OCR", your PDF is sent there, then deleted. »
- Étape 3 : « Click "Run OCR"; the first run downloads the engine and the language data, then the pages are read one by one. » → « Click "Run OCR". On a computer or Android device, the first run downloads the engine and the language data; on iPhone and iPad, the PDF goes to our OCR service. The pages are read one by one. »
- Spécification « On iPhone and iPad » : « A page that fails or is not recognized within 20 seconds goes to our OCR service, for PDFs up to 44 MB » → « Every page is recognized by our OCR service, for PDFs up to 44 MB ».
- Confidentialité : « On an iPhone or iPad, a page that fails, or makes no progress for 20 seconds, and the pages after it, are recognized by our own OCR service (…) » → « On an iPhone or iPad, every page is recognized by our own OCR service (Tesseract on our pdf-tools server), because the recognition did not finish on a real iPhone in our tests: the PDF is sent there, then deleted, and the page tells you before and after. »
- FAQ « Is the first run slower? » : « Yes. The OCR engine … » → « On a computer or an Android device, yes: … On iPhone and iPad the OCR engine is not downloaded, since our OCR service reads the pages. »
- FAQ « Is there a limit on iPhone or iPad? » : « Yes, when our service takes over: it accepts PDFs up to 44 MB … » → « Yes. Our OCR service, which reads the pages there, accepts PDFs up to 44 MB … »
- layout.tsx (métadonnées) : inchangé, toujours vrai.

## Autres pages rendues vraies

- app/privacy/page.jsx : la puce « PDF pages an iPhone or iPad cannot recognize (OCR) … within 20 seconds … » devient « PDF OCR on an iPhone or iPad: there, every page is recognized by our own OCR service … The page says so before you start and after; on a computer or an Android device, PDF OCR never sends the file. » « OCR » est retiré des exemples « Processed entirely in your browser » (l'outil est nommé dans la section). Date « Last updated » : October 6 → October 7, 2026 (règle « date propriétaire = système + 1 jour » ; à vérifier par le contrôleur).
- app/about/page.jsx : « For 4 of them this happens only when an iPhone or iPad cannot finish the work itself » → « For 4 of them this happens only on an iPhone or iPad, and the page says so. » Le compte (4) et son mécanisme (privacy-claims.mjs, serverToolCount.json) ne changent pas : la catégorie reste « envoie seulement sur iPhone / iPad ».
- app/tools/pdf-tools/page.jsx (FAQ de catégorie) : « On iPhone and iPad, OCR, Redact, PDF to Image and PDF to JPG may send the whole PDF … » → « On iPhone and iPad, OCR sends the whole PDF to our pdf-tools service, and Redact, PDF to Image and PDF to JPG may send it there. »

## Relecture indépendante du diff

- Ordinateur / Android : même chemin qu'avant (le bloc catch de repli n'avait d'effet que sur iPhone / iPad ; délais 30 s et 90 s inchangés).
- iPhone / iPad : aucun `import('tesseract.js')`, aucun worker OCR ; `remote.close()` toujours appelé (finally).
- Refus de taille : levé avant `sentToServer = true`, donc le message n'affirme pas un envoi qui n'a pas eu lieu.
- ESLint : seule erreur restante (setState dans un effet, ligne 72) déjà présente avant.
- Point à savoir : scripts/p33/ocr-fallback.mjs (scénarios iPhone « appareil d'abord, puis repli ») et le crochet `window.__localOcrLimitMs` décrivent l'ancien comportement ; ils ne sont plus valables pour l'iPhone. Le crochet `window.__forceServerPageRender` reste valable.
