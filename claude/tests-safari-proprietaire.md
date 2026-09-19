# TESTS SAFARI — feuille du propriétaire (bloquant 9)

> **Rôle de ce document :** feuille opérationnelle du **bloquant 9**, comme `tests-manuels-proprietaire.md` l'est pour le bloquant 11. **Tu es le seul à pouvoir la remplir** : ni Claude, ni WebKit local, ni un service de test ne remplacent un vrai Safari. Les verdicts se reportent dans `plan-de-travail.md` ; **ce qui échoue remonte dans le bloquant 9, jamais dans « CLOS »**.
>
> **Préparée le 19 septembre 2026 à partir de la lecture du code.** Rien ici n'a été exécuté dans Safari. Les mentions « suspect » sont des **hypothèses tirées du code, à confirmer ou infirmer par toi** — pas des constats.

---

## 0. AVANT DE COMMENCER (10 min)

**Durée honnête : ~2 h au total, en deux séances.**

| Séance | Contenu | Durée |
|---|---|---|
| **A — iPhone, outils 1 à 10** | les 10 plus risqués | **35-45 min** |
| **B — iPhone, outils 11 à 20** | le reste | **25-35 min** |
| **C — MacBook, outils 1 à 10** | les 10 plus risqués | **20-25 min** |
| **D — MacBook, outils 11 à 20** | le reste | **15-20 min** |

**Si tu t'arrêtes à la moitié : fais A puis C.** Ils couvrent les 10 outils les plus risqués sur les deux appareils. B et D sont du confort.

### Ce qu'il te faut
- L'iPhone, en **Safari** (pas Chrome iOS : Chrome sur iPhone utilise le moteur de Safari mais ce n'est pas ce qu'on teste). **Pas en navigation privée.**
- Le MacBook, en **Safari**.
- **Charge > 30 %**, Wi-Fi. **Mode économie d'énergie désactivé** (Réglages > Batterie) — il bride le processeur et fausserait les temps.
- Une app de notes ouverte à côté (voir §5).

### Note ta version (une seule fois)
- iPhone : **Réglages > Général > Informations > Version iOS** → `iOS ____`
- MacBook : **Safari > À propos de Safari** → `Safari ____` et macOS `____`

### Les fichiers d'essai

**Fournis dans le dépôt** — dossier `docs/audit/fixtures-safari/` (régénérable : `node scripts/generate-safari-fixtures.js`) :

| Fichier | Taille | Sert pour |
|---|---|---|
| `safari-A-3pages.pdf` | 1,4 Ko | Merge PDF |
| `safari-B-3pages.pdf` | 1,4 Ko | Merge PDF |
| `safari-30pages.pdf` | 8 Ko | Split PDF, Compress PDF |
| `safari-test.zip` | 0,5 Ko | (non utilisé dans les 20 ; réserve) |
| `safari-qr.png` | 2,5 Ko | QR Scanner — contient le texte `SAFARI-QR-OK-2026` |

**Comment les avoir sur l'iPhone :** copie le dossier vers **iCloud Drive** depuis le PC (ou envoie-le-toi par e-mail), puis ouvre-le dans l'app **Fichiers** de l'iPhone. Sur le MacBook, même chose (ou clone le dépôt `moufid1977haddad/allformatconvert-clean`, connecté à ton compte GitHub).

**À produire toi-même, sur l'iPhone (2 min) — c'est aussi ce que ferait un vrai visiteur :**

| Fichier | Comment | Servira pour |
|---|---|---|
| **VIDÉO** de 5 s | App **Appareil photo** > Vidéo > filme 5 secondes, n'importe quoi | outils 1, 2, 3, 8, 9 |
| **PHOTO** normale | Prends une photo (12 Mpx par défaut) | outils 5, 6, 7, 15, 17 |
| **PHOTO en Fichiers** | Ouvre la photo > Partager > **Enregistrer dans Fichiers** (elle reste au format HEIC) | outil 5 (test HEIC) |
| **MÉMO VOCAL** de 10 s | App **Dictaphone**, parle 10 secondes | outils 10, 11 |
| **PHOTO 48 Mpx** *(seulement si ton iPhone a le mode 48 Mpx : 14 Pro et plus)* | Appareil photo > réglage « Résolution » > 48 MP | outils 6, 7 — **sinon saute ces deux cas, marque « non testé »** |

**Pour le MacBook :** mêmes fichiers, transférés par **AirDrop** depuis l'iPhone (vidéo, photo, mémo) — ce sont des fichiers d'iPhone réels.

### Comment vérifier un téléchargement (règle valable partout)
Un « RÉUSSI » exige que **le fichier produit s'ouvre et soit correct**, pas seulement qu'un bouton ait réagi.
- **iPhone :** après le clic, une flèche de téléchargement apparaît dans la barre Safari (icône **aA** ou flèche) > **Téléchargements** > touche le fichier > il doit **s'ouvrir avec le bon contenu**.
- **MacBook :** flèche de téléchargement en haut à droite de Safari > ouvre le fichier depuis la liste.
- **Le nom et l'extension comptent.** Un fichier « .webm » qui ne s'ouvre pas, c'est ÉCHOUÉ.

### Les trois verdicts
- **RÉUSSI** : le résultat attendu est obtenu **et** le fichier produit s'ouvre.
- **ÉCHOUÉ** : erreur, page blanche, résultat faux, fichier qui ne s'ouvre pas, ou la page **se recharge toute seule / affiche « Un problème est survenu sur cette page »** (= Safari a tué l'onglet, mémoire saturée).
- **BLOQUÉ** : tu n'as pas pu faire le test (fichier introuvable, site inaccessible, iPhone sans mode 48 Mpx…). **Dis pourquoi.**

---

## 1. LES 20 OUTILS — CLASSÉS DU PLUS AU MOINS RISQUÉ

**Comment les 20 ont été choisis (critère écrit, pour pouvoir le contester) :** les **6 « Popular Tools »** de l'accueil et du pied de page (Merge PDF, Image Compressor, Background Remover, Grammar Fixer, QR Generator, Video to GIF), puis **14 outils cités sur les cartes de catégorie de l'accueil** (`app/page.jsx`), retenus **d'abord par le risque Safari lu dans le code**. Non retenus : les 216 autres, dont Word/Excel/PPT to PDF (routes serveur, hors des cartes de l'accueil) — **candidat n° 21 si tu veux couvrir le chemin « envoi au serveur + PDF renvoyé » sur Safari.**

**Ordre = risque décroissant d'après le code.** Base : `https://www.onlineconvertools.com`

**Légende des risques :** `Worker` Web Worker · `TÉLÉCH` téléchargement de fichier · `WASM` WebAssembly · `OffCanvas` OffscreenCanvas · `MÉDIA` API média (MediaRecorder, captureStream, getUserMedia) · `PRESSE` presse-papiers · `PLEIN` plein écran · `MÉM` mémoire / taille de canvas.
*(Aucun des 20 n'utilise le plein écran : vérifié par recherche dans le code, rien à tester de ce côté.)*

---

### ▶ SÉANCE A/C — LES 10 PLUS RISQUÉS

#### 1. Video Compressor
`https://www.onlineconvertools.com/tools/video-tools/video-compressor`
- **Risque :** `MÉDIA` `TÉLÉCH`. **Suspect n° 1 du site.** Le code appelle `video.captureStream()` puis `new MediaRecorder(stream, { mimeType: 'video/webm' })` **sans jamais tester si Safari le permet** (aucun `isTypeSupported`). À ma connaissance, Safari ne fournit pas `captureStream()` sur un élément vidéo et n'a longtemps pas écrit de WebM — **à confirmer par le test.** Même si ça passe, la sortie est un **.webm**, que l'iPhone peut ne pas savoir ouvrir.
- **Fichier :** ta **VIDÉO** 5 s (~10-20 Mo).
- **Geste :** ouvre la page > touche la zone > **Vidéos** (ou Fichiers) > choisis la vidéo > touche **Compress Video** > attends la fin de la lecture.
- **Attendu :** une taille « avant / après » s'affiche et le bouton **Download** donne un fichier `compressed.webm` **qui s'ouvre**.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 2. Video Converter
`https://www.onlineconvertools.com/tools/video-tools/video-converter`
- **Risque :** `MÉDIA` `TÉLÉCH`. Même mécanisme que le n° 1 (`captureStream` + `MediaRecorder` webm, sans détection).
- **Fichier :** la **VIDÉO** 5 s.
- **Geste :** choisis la vidéo > touche **Convert to WebM** > attends.
- **Attendu :** une seconde vidéo apparaît sous la première et **Download WebM** donne `converted.webm` qui s'ouvre.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 3. Video Trimmer
`https://www.onlineconvertools.com/tools/video-tools/video-trimmer`
- **Risque :** `MÉDIA` `TÉLÉCH`. Même mécanisme (`captureStream` + `MediaRecorder` webm).
- **Fichier :** la **VIDÉO** 5 s.
- **Geste :** choisis la vidéo > laisse les réglages par défaut (ou coupe 1 s au début) > touche **Trim Video** > attends.
- **Attendu :** la vidéo découpée apparaît et **Download** donne `trimmed.webm` qui s'ouvre.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 4. Voice Recorder
`https://www.onlineconvertools.com/tools/audio-tools/voice-recorder`
- **Risque :** `MÉDIA` `TÉLÉCH`. Le code crée `new MediaRecorder(stream)` **sans type**, puis **étiquette de force le résultat `audio/webm`** et propose `recording.webm`. Safari enregistre en **MP4/AAC** : on risque un fichier **mal nommé** (`.webm` qui contient du MP4), donc illisible ailleurs. Demande aussi l'autorisation du micro.
- **Fichier :** aucun. Tu parles.
- **Geste :** ouvre la page > **Start Recording** > **Autoriser** le micro > parle 5 s > **Stop Recording** > écoute le lecteur > touche **Download WebM**, puis **Download WAV**.
- **Attendu :** l'écoute restitue ta voix ; `recording.wav` s'ouvre et se lit ; **note si `recording.webm` s'ouvre**.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(précise WAV et WEBM séparément dans tes notes)*

#### 5. Image Converter
`https://www.onlineconvertools.com/tools/image-tools/image-converter`
- **Risque :** `Worker` `OffCanvas` `TÉLÉCH` `MÉM`. Le convertisseur tourne dans un **Web Worker** et crée un `OffscreenCanvas` puis `convertToBlob`. **Le format par défaut est WebP** — à ma connaissance Safari n'encode pas le WebP (ni l'AVIF) via canvas et peut **renvoyer un PNG sans le dire**. Le HEIC passe par `heic2any`. « Download all » lance **plusieurs téléchargements d'affilée** et chaque lien est **révoqué immédiatement après le clic** (risque : téléchargement vide ou refusé).
- **Fichiers :** (a) **PHOTO** normale ; (b) **PHOTO en Fichiers** (HEIC).
- **Geste (a) :** choisis la photo > format **WebP** (défaut) > touche **Convert** > **Download** > ouvre. **Refais avec PNG puis JPG.**
- **Geste (b) :** même chose avec le fichier HEIC pris **depuis Fichiers**.
- **Attendu :** chaque conversion donne un fichier **du format demandé** (`.webp`, `.png`, `.jpg`) qui s'ouvre. **Vérifie que le fichier WebP est bien du WebP** : Fichiers > appui long > **Informations** > Type.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(3 sous-cas : WebP / PNG-JPG / HEIC)*

#### 6. Background Remover
`https://www.onlineconvertools.com/tools/ai-tools/background-remover`
- **Risque :** `MÉM` `TÉLÉCH`. Réduit la photo à 1024 px pour l'envoi, mais **recompose le résultat à la pleine résolution dans un canvas** (`getImageData`). **Safari iOS limite la surface d'un canvas** (de l'ordre de 16 Mpx) : une photo 48 Mpx peut donner un résultat **vide ou noir**. ⚠️ **Appelle un service payant** — voir la règle n° 8 en fin de document.
- **Fichiers :** (a) **PHOTO** normale (12 Mpx) avec un sujet net ; (b) **PHOTO 48 Mpx** si dispo.
- **Geste :** choisis la photo > touche **Remove Background** > attends (~5 s, jusqu'à ~15 s au réveil du service) > **Download PNG**.
- **Attendu :** le sujet est détouré sur fond **transparent** et le PNG téléchargé **s'ouvre avec la transparence** (fond en damier dans l'aperçu, pas de noir).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(sous-cas 12 Mpx / 48 Mpx)*

#### 7. Image Upscaler
`https://www.onlineconvertools.com/tools/ai-tools/image-upscaler`
- **Risque :** `MÉM`. **Mise à l'échelle jusqu'à ×8 directement dans un canvas** : une photo 12 Mpx × 2 = 48 Mpx, bien **au-delà de la limite de canvas de Safari iOS**. Suspect : résultat vide, ou onglet tué.
- **Fichiers :** **PHOTO** normale ; puis une **petite** image (capture d'écran, ~1 Mpx).
- **Geste :** choisis la photo > facteur **×2** > **Upscale Image**. Refais avec la petite image en **×4**.
- **Attendu :** une image agrandie s'affiche avec ses nouvelles dimensions et se télécharge. **Note à partir de quel facteur / quelle taille ça casse.**
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(sous-cas : photo ×2 / petite image ×4)*

#### 8. Video to GIF
`https://www.onlineconvertools.com/tools/gif-tools/video-to-gif`
- **Risque :** `MÉDIA` `MÉM` `TÉLÉCH`. Le code se place sur chaque image avec `video.currentTime = …` puis **attend l'événement `seeked` sans aucune limite de temps** (contrairement à MP4 to GIF qui en a une). Sur iOS, une vidéo pas encore chargée peut **ne jamais l'émettre** : le bouton reste bloqué indéfiniment. Il garde aussi chaque image en **data-URL PNG** en mémoire.
- **Fichier :** la **VIDÉO** 5 s.
- **Geste :** choisis la vidéo > laisse FPS et durée par défaut > touche **Convert to GIF Frames** > attends **30 s au maximum**.
- **Attendu :** « N frames captured » s'affiche puis un **GIF animé** apparaît ; le bouton **Download GIF** donne un `.gif` qui s'ouvre **et s'anime**. *(Si rien ne bouge après 30 s : ÉCHOUÉ, note « bloqué à l'attente ».)*
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 9. MP4 to GIF
`https://www.onlineconvertools.com/tools/gif-tools/mp4-to-gif`
- **Risque :** `MÉDIA` `TÉLÉCH`. Accepte seulement `video/mp4` (or l'iPhone filme en **.MOV**, extension `.mov`). Une garde existe pour un `seeked` qui n'arrive pas. Suspect : la vidéo iPhone est **refusée au choix du fichier**.
- **Fichier :** la **VIDÉO** 5 s (essaie-la telle quelle, sans la convertir).
- **Geste :** choisis la vidéo > **Convert to GIF** > **Download GIF**.
- **Attendu :** soit un GIF qui s'anime, soit un **message clair** disant que le format n'est pas accepté. *(Un fichier grisé et non sélectionnable dans le sélecteur = note-le, c'est un défaut d'usage.)*
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 10. Audio Converter
`https://www.onlineconvertools.com/tools/audio-tools/audio-converter`
- **Risque :** `WASM` `Worker` `MÉM` `TÉLÉCH`. **ffmpeg.wasm** : le moteur (~25-30 Mo, dit la page) est **téléchargé au premier usage** puis exécuté dans un Worker. Sur iPhone : temps de chargement et **mémoire**. *(Version mono-thread : elle n'exige pas les en-têtes spéciaux que Safari réclame pour le multi-thread.)*
- **Fichier :** le **MÉMO VOCAL** (.m4a, ~100-200 Ko).
- **Geste :** choisis le mémo > format de sortie **MP3** > **Convert Audio** > **attends jusqu'à 60 s la première fois** > télécharge.
- **Attendu :** un `.mp3` **qui se lit** et dure ~10 s.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

---

### ▶ SÉANCE B/D — LES 10 SUIVANTS

#### 11. Audio Trimmer
`https://www.onlineconvertools.com/tools/audio-tools/audio-trimmer`
- **Risque :** `WASM` `Worker` `MÉM` `TÉLÉCH` (ffmpeg.wasm, comme le n° 10).
- **Fichier :** le **MÉMO VOCAL**.
- **Geste :** choisis le mémo > règle Start/End pour garder ~5 s > **Trim Audio** > télécharge.
- **Attendu :** un fichier audio de ~5 s qui se lit.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 12. Merge PDF
`https://www.onlineconvertools.com/tools/pdf-tools/pdf-merge`
- **Risque :** `Worker` (module) `TÉLÉCH` `MÉM`. Web Worker de type `module` (pris en charge par Safari récent, mais **c'est précisément ce qui casse sur un Safari ancien**) + pdf-lib. Plafond mobile : 100 Mo / 300 pages.
- **Fichiers :** `safari-A-3pages.pdf` **et** `safari-B-3pages.pdf` (depuis Fichiers, sélection multiple).
- **Geste :** choisis les deux > **Merge PDFs** > **Download** > ouvre.
- **Attendu :** **un PDF de 6 pages** : « FICHIER A » pages 1-3 puis « FICHIER B » pages 1-3.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 13. Split PDF
`https://www.onlineconvertools.com/tools/pdf-tools/pdf-split`
- **Risque :** `Worker` `TÉLÉCH`. Produit potentiellement **plusieurs fichiers** : Safari peut n'en accepter qu'un ou demander une permission.
- **Fichier :** `safari-30pages.pdf`.
- **Geste :** choisis-le > séparation par défaut (ou plage 1-10) > **Split** > **Download**.
- **Attendu :** des PDF (ou un ZIP) **qui s'ouvrent** avec les bonnes pages. *(Note le nombre de fichiers reçus.)*
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 14. Compress PDF
`https://www.onlineconvertools.com/tools/pdf-tools/pdf-compress`
- **Risque :** `Worker` `TÉLÉCH`.
- **Fichier :** `safari-30pages.pdf`.
- **Geste :** choisis-le > **Compress** > **Download**.
- **Attendu :** un PDF de **30 pages** qui s'ouvre. *(Un fichier déjà minuscule peut ne pas rétrécir : ce n'est pas un échec tant qu'il s'ouvre et garde 30 pages.)*
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 15. Image Compressor
`https://www.onlineconvertools.com/tools/image-tools/image-compressor`
- **Risque :** `TÉLÉCH` `MÉM`. Passe par un canvas puis `toDataURL('image/jpeg')` ; le téléchargement est un **lien data-URL** (`compressed.jpg`), plus fragile que les liens `blob:` quand l'image est grosse.
- **Fichier :** la **PHOTO** normale (12 Mpx).
- **Geste :** choisis la photo > **Compress** > **Download**.
- **Attendu :** un `compressed.jpg` **plus léger** qui s'ouvre et ressemble à l'original.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 16. GIF Maker
`https://www.onlineconvertools.com/tools/gif-tools/gif-maker`
- **Risque :** `TÉLÉCH` `MÉM`. Sélection **multiple** d'images, encodage GIF dans la page.
- **Fichiers :** **3 photos** de ta photothèque (sélection multiple).
- **Geste :** choisis 3 photos > **Create GIF** > **Download GIF**.
- **Attendu :** un `.gif` **animé de 3 images** qui s'ouvre.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 17. Zip Creator
`https://www.onlineconvertools.com/tools/file-tools/zip-creator`
- **Risque :** `Worker` (module) `TÉLÉCH` `MÉM`. Plafond mobile 100 Mo.
- **Fichiers :** `safari-A-3pages.pdf` + `safari-B-3pages.pdf` + la **PHOTO**.
- **Geste :** choisis les 3 > **Create ZIP** > **Download ZIP** > ouvre le ZIP dans Fichiers (appui long > Décompresser).
- **Attendu :** un `.zip` qui **se décompresse** avec les 3 fichiers intacts.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 18. QR Scanner
`https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-scanner`
- **Risque :** `PRESSE` `MÉM`. Lit une **image** (pas la caméra) via `jsQR` et un canvas. Bouton **Copy** = `navigator.clipboard.writeText` (Safari l'autorise **seulement** en réponse directe à un toucher).
- **Fichier :** `safari-qr.png`.
- **Geste :** choisis-le > le texte apparaît > touche **Copy** > colle dans ton app de notes.
- **Attendu :** le texte lu est **`SAFARI-QR-OK-2026`** et **la note contient ce texte après le collage**.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 19. Grammar Fixer
`https://www.onlineconvertools.com/tools/ai-tools/grammar-fixer`
- **Risque :** `PRESSE`. Appel réseau `/api/ai` (service payant) + bouton **Copy**. ⚠️ Voir la règle n° 8 en fin de document.
- **Fichier :** aucun. **Texte à coller** : `i has went to the store yesterday and buyed two apple`
- **Geste :** colle le texte > **Fix Grammar** > attends > touche **Copy** > colle dans les notes.
- **Attendu :** une phrase **corrigée** (ex. « I went to the store yesterday and bought two apples. ») et **le collage dans les notes fonctionne**.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 20. QR Generator
`https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-generator`
- **Risque :** `TÉLÉCH`. Deux téléchargements : **PNG** (canvas) et **SVG**. Un SVG téléchargé sur iPhone s'ouvre parfois comme du **texte** au lieu d'une image.
- **Fichier :** aucun. **Texte :** `SAFARI-QR-OK-2026`
- **Geste :** saisis le texte > **Generate QR Code** > **Download PNG**, puis **Download SVG**.
- **Attendu :** `qrcode.png` s'ouvre en image ; `qrcode.svg` s'ouvre **en image** (sinon note « s'ouvre en texte »).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(précise PNG et SVG séparément)*

---

## 2. SECTION iPHONE (Safari iOS) — CE QUI CHANGE

**Ce que les sections précédentes testent déjà, appliqué à l'iPhone. Surveille en plus :**

1. **Téléchargement du fichier produit** — la cause n° 1 d'échec sur iPhone. Vérifie **à chaque outil** avec la règle du §0. Signale : aucune flèche de téléchargement, fichier vide, mauvaise extension, fichier introuvable dans Téléchargements.
2. **Mémoire** — Safari iOS **tue l'onglet** sans préavis quand il déborde. Symptôme : **la page se recharge toute seule** ou affiche « Un problème est survenu sur cette page web ». **C'est un ÉCHOUÉ**, à noter même si « ça remarche ensuite ». Les plus exposés : n° 6, 7, 8, 10, 11 (photos 48 Mpx, agrandissement, ffmpeg).
3. **Après chaque outil lourd (6, 7, 8, 10) : ferme l'onglet** (pas seulement la page) avant le suivant, sinon l'échec du n° 8 peut venir de la mémoire laissée par le n° 7.
4. **Sélecteur de fichiers** — note si un fichier est **grisé** (format refusé par le champ) : c'est un défaut d'usage réel (n° 9 surtout).
5. **Autorisations** — micro (n° 4) : si la fenêtre d'autorisation n'apparaît pas, note-le.
6. **Rotation / verrouillage de l'écran pendant un traitement** : ne le fais pas exprès ; mais si l'écran se verrouille tout seul pendant n° 1-3 ou 10, **note-le** (la lecture s'arrête, l'enregistrement aussi).

## 3. SECTION MacBook (Safari macOS) — CE QUI CHANGE

Le MacBook a beaucoup de mémoire : les **plantages mémoire sont improbables**. Les défaillances attendues sont **de compatibilité** (API absentes), pas de ressources.

1. **`captureStream` / `MediaRecorder` webm** (n° 1-3) : les erreurs seront **franches et lisibles** ici — c'est le meilleur endroit pour lire le message exact.
2. **`OffscreenCanvas` / WebP** (n° 5) : vérifie le **format réellement produit**.
3. **Téléchargements multiples** (n° 5 « Download all », n° 13) : Safari demande **« Autoriser plusieurs téléchargements ? »** — note si la demande apparaît, et ce qui se passe si tu refuses.
4. **Presse-papiers** (n° 18, 19) : autorisé seulement sur geste direct. Colle dans TextEdit / Notes pour vérifier.
5. **La console — utile ici seulement :** Safari > Réglages > **Avancées** > coche **« Afficher les fonctionnalités pour les développeurs »**. Après un échec : menu **Développement > Afficher la console JavaScript** (⌥⌘C) et **copie le message rouge**. **C'est ce qui rend la correction possible sans refaire le test.**
6. **Ne fais pas** ce test dans Chrome/Firefox en croyant représenter Safari.

---

## 4. ORDRE ET DURÉE — RÉSUMÉ

| Étape | Quoi | Durée |
|---|---|---|
| 0 | Préparation, fichiers, versions | 10 min |
| **A** | **iPhone, outils 1 → 10** | **35-45 min** |
| **C** | **MacBook, outils 1 → 10** | **20-25 min** |
| B | iPhone, outils 11 → 20 | 25-35 min |
| D | MacBook, outils 11 → 20 | 15-20 min |
| | **Total** | **~1 h 50 à 2 h 15** |

**Tu peux tout faire en deux jours : A + C le premier, B + D le second.** Ces durées sont des **estimations**, pas des mesures — le premier lancement de ffmpeg (n° 10, 11) et le réveil du détourage (n° 6) sont les moments longs.

**Si un outil bloque plus de 5 minutes : note ÉCHOUÉ ou BLOQUÉ, passe au suivant.** Ne cherche pas à réparer.

---

## 5. COMMENT RAPPORTER (pour que la correction soit possible sans refaire le test)

**Pendant le test, sur l'iPhone :** ouvre l'app **Notes** à côté. **Une ligne par outil**, tout de suite :

```
N° | R / É / B | ce que j'ai vu en une phrase
```
Exemples : `1 | É | "captureStream is not a function"` · `4 | É | wav OK, webm ne s'ouvre pas` · `9 | R | GIF animé OK`

**Pour chaque ÉCHOUÉ ou BLOQUÉ, note en plus — c'est ce dont on a besoin :**
1. **L'outil** (numéro) et **l'appareil** : iPhone/MacBook + version iOS/Safari.
2. **Ce que tu faisais** : le fichier utilisé (nom, taille approximative) et le geste, en une phrase.
3. **L'écran** : **capture d'écran** (iPhone : bouton latéral + volume haut ; Mac : ⇧⌘4) **au moment de l'échec**.
4. **Le message exact**, mot pour mot (ou « aucun message »).
5. **Le comportement** parmi : *rien ne se passe* · *bouton bloqué / chargement infini* · *message d'erreur* · *page rechargée toute seule* · *fichier obtenu mais illisible* · *fichier absent*.
6. **Reproductible ?** Refais **une seule fois** : « 2 fois sur 2 » ou « 1 fois sur 2 ».
7. **Sur MacBook : le message de la console** (voir §3, point 5).

**À la fin :** envoie-moi les notes (colle-les dans la conversation) et les captures. **Je reporte les verdicts dans `plan-de-travail.md` (bloquant 9) ; chaque ÉCHOUÉ devient un défaut chiffré, et aucun n'est marqué « CLOS » sans un retest de ta part sur le vrai Safari.**

---

## 6. RÈGLE À CONNAÎTRE AVANT DE LANCER (règle permanente n° 8)

**Deux outils déclenchent une opération payante en production : n° 6 Background Remover (~0,003 $ l'image, service Railway) et n° 19 Grammar Fixer (appel OpenAI, fraction de centime).** La règle n° 8 du projet demande de tester ce genre d'opération **sur une préversion**. Cette feuille pointe **la production** parce qu'une préversion Vercel est protégée par une connexion, pénible sur un iPhone. **Décision qui t'appartient :**
- **Par défaut : tu les lances en production, chacun UNE fois** (quelques dixièmes de centime au total, très loin du plafond de 20 $).
- Si tu préfères la préversion : dis-le avant, et je fournis l'adresse et le moyen de t'y connecter.

**Ne relance pas ces deux tests en boucle** : les limites par IP (30 par heure) et le quota utilisateur s'appliquent.

---

## 7. VERDICTS (à remplir puis reporter dans le plan)

| # | Outil | iPhone | MacBook | Note |
|---|---|---|---|---|
| 1 | Video Compressor | | | |
| 2 | Video Converter | | | |
| 3 | Video Trimmer | | | |
| 4 | Voice Recorder | | | |
| 5 | Image Converter | | | |
| 6 | Background Remover | | | |
| 7 | Image Upscaler | | | |
| 8 | Video to GIF | | | |
| 9 | MP4 to GIF | | | |
| 10 | Audio Converter | | | |
| 11 | Audio Trimmer | | | |
| 12 | Merge PDF | | | |
| 13 | Split PDF | | | |
| 14 | Compress PDF | | | |
| 15 | Image Compressor | | | |
| 16 | GIF Maker | | | |
| 17 | Zip Creator | | | |
| 18 | QR Scanner | | | |
| 19 | Grammar Fixer | | | |
| 20 | QR Generator | | | |

*Légende : R = RÉUSSI · É = ÉCHOUÉ · B = BLOQUÉ.*

**Ce que cette feuille ne prouve pas, même 20/20 :** les 200+ autres outils, les fichiers volumineux (les plafonds mobiles 100 Mo / 300 pages ne sont pas éprouvés ici), et les versions de Safari autres que la tienne.
