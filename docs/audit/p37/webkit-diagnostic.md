# P37 — Diagnostic WebKit (pdfq, epub) du script lot1-browser

Date : 06/10. Build local http://localhost:3137 (branche p37). Playwright 1.62.1, WebKit Windows (UA « Version/26.5 Safari »).

## Verdict

Aucun des deux échecs n'est une régression P37. Aucun n'est un bug que Safari réel verrait. Aucun code de `app/` modifié.

- **pdfq** : limite de Playwright WebKit sous Windows (pas d'`OffscreenCanvas`). Le site réagit déjà correctement : message clair.
- **epub** : deux défauts du script de test. L'application envoie le bon HTML.

## 1. pdfq — Image Converter, PDF qualité 20 % contre 50 %

Reproduction (WebKit) :
- Dans la page : `typeof OffscreenCanvas` = `"undefined"`. Dans un worker aussi (sonde par worker blob : `"undefined"`).
- Le worker `imageConverter.worker.js` refuse alors chaque fichier (garde ligne 55).
- Texte affiché : « 1 file failed to convert: photo.png: This browser cannot process images in the background (it needs Safari 16.4 or later, or a current Chrome, Edge or Firefox). »
- Aucun lien Download, donc le script attendait 60 s puis échouait. Aucune erreur console, aucune `pageerror`.

Cause : API manquante `OffscreenCanvas` (page et worker) dans le WebKit de Playwright pour Windows. Safari 16.4+ l'a (2D, y compris dans les workers). Le plancher du site est Safari 16.4.

Pas P37 : la garde existait avant P37 (`git show restauration-avant-p37-07-10:…/imageConverter.worker.js`, ligne 55, introduite en 8e8a22f9). Elle bloque tous les formats, pas seulement le PDF. Le diff P37 de `extraFormats.js` (qualité `quality / 100` au lieu de `Math.max(0.5, …)`) n'est jamais atteint dans ce navigateur.

## 2. epub — EPUB to PDF, chapitre manquant, « chapters sent 0 »

Deux défauts du script, aucun dans l'application :

1. **Attente trop tôt.** `getByText('PDF ready')` trouvait déjà l'étape 3 du mode d'emploi (« When "PDF ready" appears… »). L'attente rendait la main avant la requête (mesuré : « READY » à 1,4 s, POST à 2,2 s). Chromium passait par chance de timing (READY 1,25 s, POST 1,31 s).
2. **Corps de requête invisible en WebKit.** `route.request().postDataBuffer()` omet les octets d'une partie `File` d'un FormData : 182 octets (en-têtes de partie seuls) en WebKit, 804 en Chromium. Preuve isolée : un FormData avec un `File` « HELLO-BLOB » est bien sérialisé dans la page (`new Response(fd).text()` le contient), mais Playwright WebKit ne le rend pas ; un champ texte, lui, est rendu.

Lu dans la page, le corps envoyé en WebKit est correct : 804 octets, 2 chapitres, aucun chapitre vide. La note « 1 chapter of this book could not be read… » s'affiche.

## Correction (script seulement)

`scripts/p37/lot1/lot1-browser.pw.mjs` :
- pdfq : sonde `OffscreenCanvas` dans un worker ; attend le lien **ou** le message de refus. Si le worker n'a pas `OffscreenCanvas` et que la page affiche le message, ligne `SKIP` (environnement), pas FAIL. Sinon FAIL avec le détail, plus de blocage de 60 s.
- epub : `getByText('PDF ready', { exact: true })` ; corps lu dans la page (fetch enveloppé, `new Response(body).text()`), plus via `postDataBuffer`.

## Résultats après correction (`--only=pdfq,epub`)

- WebKit : SKIP pdfq (raison affichée), PASS epub (2 chapitres, aucun vide, note présente). Sortie 0.
- Chromium : PASS pdfq {20 %: 9029 o, 50 %: 20583 o}, PASS epub.
- Firefox : PASS pdfq {9968, 21564}, PASS epub.

Reste pour le propriétaire : la qualité PDF n'est pas prouvée dans un WebKit ; seul un vrai Safari (Mac ou iPhone) le peut.
