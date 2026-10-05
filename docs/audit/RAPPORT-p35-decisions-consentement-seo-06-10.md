# RAPPORT — P35 : décisions P33, consentement Europe, SEO technique S1-S3 (06/10)

Propriétaire absent (retour 18 h, UTC-4) ; aucune question posée ; ce qui lui revient est au plan (`claude/plan-de-travail.md`,
section P35). Branche `p35`, repère de restauration `restauration-avant-p35-06-10` = `739aad96`. Chaque lot est commité
et poussé avec sa partie de ce rapport avant le suivant.

## Lot 1 — décisions P33 tranchées par le propriétaire

### D1 — OCR serveur : 2 à la fois, 1 par visiteur, file d'attente avec la place

**Marché** : iLovePDF, Smallpdf et PDF24 font toute l'OCR sur leurs serveurs, sans place affichée (barre de progression
seule) ; OCR2Edit (famille online-convert) annonce « no waiting » comme avantage payant, donc une file pour l'offre
gratuite. Personne n'affiche la place ; nous la donnons parce que l'attente peut atteindre quelques minutes sur iPhone.

**Fait** (service `services/pdf-tools/src/ocrQueue.js`, `ocr.js`, `server.js` ; site `lib/pdfOcr.js`,
`app/api/pdf-ocr/route.ts`, `app/lib/serverPageOcr.js`, page PDF OCR) :
- **2 reconnaissances à la fois** sur le service (`OCR_CONCURRENCY` = 2), **1 par visiteur** : la clé du visiteur est un
  HMAC (clé de service du site) de l'adresse IPv4 ou du **préfixe /64** d'une IPv6 — jamais l'IP, jamais écrite dans les
  journaux ; une connexion IPv6 possède souvent tout un /64 (relecture).
- **Au-delà : file d'attente côté serveur**, premier arrivé premier servi (une requête qui attend son propre visiteur ne
  bloque pas les autres). La page reçoit des lignes JSON : sa place à chaque changement (et toutes les 10 s pour qu'aucun
  proxy ne coupe), « started » au début de sa reconnaissance (répété pendant), puis le résultat. Message affiché :
  « Waiting for our OCR service, which is busy with other pages: yours is number 3 in line. It starts by itself; keep this
  page open. » puis « yours is next ». **Aucun échec ni secours inutile** : la page attend.
- **Bornes de la file** (refus avec une phrase, jamais une attente sans fin) : 20 requêtes en attente au total, 2 par
  visiteur, 200 s d'attente au plus (+ 50 s de reconnaissance comptées à partir de son début ; fonction Vercel 300 s).
- La copie d'un gros PDF (staged) n'est prise qu'**une fois le créneau obtenu** : la file ne garde aucun fichier de
  44 Mo en attente.
- **Compatibilité** : sans l'en-tête `X-OCR-Stream: 1` (site d'avant P35), le service répond exactement comme P33 (JSON,
  20 s d'attente puis 503 « busy », 50 s en tout). Service publié seul d'abord.
- `/health` du service : `ocr: {concurrency: 2, line: true}` (aucun compteur de visiteurs).

**Tests** : `scripts/p35/ocr-queue.test.mjs` 16/16 (logique pure : 2 au plus, 1 par visiteur, ordre, places décroissantes,
file pleine, attente expirée, annulation) ; `scripts/p35/ocr-line.test.mjs` **18/18** contre le vrai service local
(Tesseract) : 7 requêtes simultanées de 4 visiteurs → toutes servies, jamais plus de 2 en même temps ni 2 d'un même
visiteur, places annoncées 5 → 4 → 3 → 2 → 1 ; le 4ᵉ envoi d'un visiteur qui en a déjà 2 en attente refusé (429, sa
phrase, pas d'alerte) ; un visiteur qui ferme la page sort de la file (`line_aborted`) et celui de derrière avance de 2 à
1 ; ancien appelant : JSON, deux servis, le troisième « busy » ; aucune IP ni clé dans les journaux ; aucune ligne « en
file » après le début de la reconnaissance. Non-régression P33 : service 34/34, route 37/37. **Navigateur** (WebKit
iPhone, page locale, 6 autres visiteurs devant) : la page affiche « number 5 → 4 → 3 → 2 in line », « yours is next »,
puis le texte des 3 pages, 3/3 ; `scripts/p33/ocr-fallback.mjs` (WebKit iPhone) : voir §Lot 1 — tests finaux.

**Relecture de sécurité** (sous-agent) : **GO avec conditions** ; appliqué : (1) la ligne de maintien répétait la place
pendant la reconnaissance (la page aurait réaffiché « number 2 in line ») → « started » ; (2) une exception après le
début du flux laissait la connexion ouverte jusqu'à 285 s → erreur rendue dans la dernière ligne ; (3) IPv6 : clé par /64 ;
(8) refus « déjà en attente » reconnu par un champ `reason` et non par le texte ; (9) clé = HMAC et non SHA-256 nu
(réversible en IPv4). **Notes acceptées** : un refus de la file (pleine, expirée) consomme quand même la page du quota
horaire du visiteur (le quota est réservé avant l'envoi, comme P33) ; mémoire : 2 Tesseract × ≤ 1,5 Go d'espace
d'adresses (mesuré en P33 : 0,7-1 Go sur une page dense de 25 Mpx), aucune limite de mémoire posée sur le service
Railway (`limitOverride` nul) ; le bouton d'annulation de la page n'existe pas : seule la fermeture de l'onglet libère la
place.

**En production** : pdf-tools `c92b907b` (déploiement Railway `cc305b32`, 05/10 07 h 51, heure de Montréal) ; `/health`
`concurrency 2, line true`, 102 langues ; ancien site sur www : un appel `/api/pdf-ocr` (page 2, eng+fra) 200 en 3,1 s ;
www-light 29/29.

### D2 — `MEDIA_SERVICE_URL` de pdf-tools en réseau privé

- Lecture par `scripts/p35/railway-vars.mjs` / `media-url-private.mjs` (la CLI Railway est lue dans le processus, seul un
  booléen est affiché) : **privé : non** (adresse publique).
- Port du service média : aucune variable `PORT` ; Railway injecte `PORT=8080` à l'exécution, gunicorn écoute
  `0.0.0.0:$PORT` ; le réseau privé Railway résout en IPv4 et IPv6 pour les environnements créés après le 16/10/2025
  ([Railway](https://docs.railway.com/networking/private-networking/how-it-works)) ; le trafic privé réveille un service en
  veille ([Railway, App Sleeping](https://docs.railway.com/reference/app-sleeping)).
- **Bascule** (`scripts/p35/media-url-switch.mjs private`, ancienne valeur gardée hors dépôt pour le retour arrière) :
  `http://${{media-processing.RAILWAY_PRIVATE_DOMAIN}}:8080` → **privé : oui** ; redéploiement pdf-tools `fa232a69`
  (07 h 54).
- **Contrôle** : chemin « gros PDF » de bout en bout sur www (`scripts/p32/staged-render-preview.mjs` : billet du site,
  envoi au service média, pages 1 et 6 dessinées par pdf-tools qui va chercher le fichier **par le réseau privé**,
  suppression) : **7/7**, avant (adresse publique) comme après ; www-light 29/29 (outil média Media Player compris).
  Aucun retour arrière nécessaire.

### D3 — Redact : texte sélectionnable hors des zones noircies

**Marché** : Adobe Acrobat, iLovePDF et Smallpdf retirent le contenu choisi et gardent le reste sélectionnable ; PDF24
aplatissait la page entière en image, comme nous jusqu'ici (P33 §2b).

**Fait** (sous-agent dans une copie de travail isolée, commit `ad3f7020` repris ; `app/lib/pdfRedact.js`, page PDF
Redact) : chaque page noircie reste une image (rien de l'original n'est recopié) **plus une couche de texte invisible**
(mode de rendu 3, Helvetica WinAnsi, largeur ajustée mot par mot) des **mots hors des zones noircies**. Exclus : tout mot
touché par une correspondance, tout mot dont la boîte (élargie comme une boîte noire) touche une boîte noire (texte ou
annotation), le texte vertical ; puis la recherche des termes et motifs est **refaite sur les mots gardés mis bout à
bout** et tout ce qui reformerait un terme est retiré. Le contrôle final du fichier (`verifyRedacted`, P33) est
inchangé et refuse toujours un fichier où un terme se trouve. Textes de la page (résumé, description, FAQ, astuces)
alignés : image de la page + couche invisible des mots hors des boîtes ; mots voisins d'une boîte, texte vertical et
alphabets que Helvetica ne sait pas écrire (grec, cyrillique, arabe, asiatique, certains accents) non gardés.

**Bancs** (construction de production locale) :
- **31 PDF piégés de P33** (Chromium, avec OCR Tesseract de chaque page noircie) : **31 acceptés, 0 refus, 0 fuite**
  (pdftotext, formes redessinées, octets, PDF.js, OCR) ; « Adobe » (g5) accepté comme en P33. WebKit : voir tests finaux.
- Kit `photo-2` : `scripts/p33/redact-truth.mjs` **12/12** WebKit iPhone et Chromium ; `scripts/p35/redact-text-layer.mjs`
  **7/7** sur les deux moteurs : page 2 garde 7 mots sur 9 (« Page 2 - PDF avec images Image »), « d'origine » et « : »
  retirés car voisins de la boîte, terme absent du fichier, écart de position ≤ 0,97 pt ; page à MediaBox décalée,
  /Rotate 90 et texte à 30° : 15/15, ≤ 0,70 pt.
- **Faux refus** : « the » sur les 35 PDF réels : 0 refus, 0 fuite ; balayage Node de la relecture n° 3 de P33 (≈ 38 termes
  par fichier) : **252 rédactions acceptées, 0 refus, 0 fuite**, 76 247 mots gardés sur 561 pages noircies.
- **Limites dites** : les mots voisins immédiats d'une zone noircie ne sont pas gardés ; positions approximatives quand la
  police espace les lettres (Tc/Tw) ; liens et champs des pages noircies toujours retirés ; alphabets hors WinAnsi non
  gardés (une couche dans la police d'origine demanderait de la recopier, ce que P33 a interdit pour fermer les fuites).

### D4 et autres décisions P33 ouvertes

- **D4 — confirmation avant d'envoyer une page au service de rendu (iPhone)** : **non ajoutée**. Marché : iLovePDF,
  Smallpdf et PDF24 envoient toujours le fichier sans confirmation ; chez nous l'envoi n'a lieu qu'en secours, l'avis est
  affiché avant (en permanence sur iPhone/iPad) et après. Une confirmation ajouterait un geste au cas où l'appareil a déjà
  échoué.
- **P33 P3 — sur un PDF qui a déjà du texte, la couche OCR doublait le texte copié** : **tranché et fait**. Marché :
  OCRmyPDF saute par défaut les pages qui ont du texte (`--skip-text`), Adobe Acrobat refuse de les reconnaître (« page
  contains renderable text »). Désormais une page dont le propre texte fait au moins la moitié du texte reconnu ne reçoit
  pas la couche (le texte reconnu reste affiché, et la page le dit : « Pages 1, 2 and 3 already had selectable text: … not
  doubled ») ; un scan avec seulement un tampon texte (« Scanned by … ») reçoit toujours la couche. Test
  `scripts/p35/ocr-text-layer.mjs` 5/5 (PDF avec texte : « photo-2.jpg » une seule fois ; scan : couche ajoutée).

### Lot 1 — tests finaux (construction de production locale avec tout le lot)
- WebKit (iPhone simulé) sur les 31 PDF piégés, avec OCR : **31 acceptés, 0 refus, 0 fuite** (seul signal : « Adobe » dans
  `/Registry (Adobe)` d'une police, comme en P33) ; 41 mots gardés sur 38 pages noircies.
- `scripts/p33/ocr-fallback.mjs` WebKit iPhone (route réelle + pdf-tools local) : **21/21** (non-régression P33).
- `scripts/p35/ocr-line-browser.mjs` (WebKit iPhone, 6 visiteurs devant) : 3/3 ; `ocr-text-layer.mjs` 5/5.
- `npm run build` et ses gardes verts.

### Lot 1 — mise en ligne
- **Préversion, une seule fois** : `onlineconvertools-2e77vjplb` (= `3324ed50`), par le relais `vercel-preview-proxy` (jeton
  en mémoire), route réelle et **pdf-tools de production** : file d'attente `scripts/p35/ocr-line-deployed.mjs` **3/3**
  (une page à la fois pour un même visiteur, les deux autres reçoivent leur place puis leur texte) ; Redact kit WebKit
  iPhone 12/12 ; couche de texte 7/7 ; PDF OCR WebKit iPhone 21/21.
- **Production** : master `3324ed50` (avance rapide) → Vercel **`onlineconvertools-jccwufjem`** ; www-light **29/29** ;
  `ocr-line-deployed` sur www **3/3** ; pdf-tools reconstruit sur master, `/health` ok, `MEDIA_SERVICE_URL` toujours
  privée. **Aucun retour arrière.** Retour arrière prêt : promouvoir `onlineconvertools-2lg294nt3` (site de P34) ;
  pdf-tools : annuler `c92b907b` par un commit ; D2 : `scripts/p35/media-url-switch.mjs rollback` (ancienne valeur gardée
  hors dépôt).
