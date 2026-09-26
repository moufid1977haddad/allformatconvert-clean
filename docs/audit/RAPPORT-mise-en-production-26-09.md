# RAPPORT — Mise en production du 26/09 : améliorations 14, 16, 13, 17 et Opus des trois outils audio

**Date :** 26 septembre 2026 · **Branche :** `licence-ameliorations` · **Production avant :** `master` = `a3e2cf56`

## 1. Service média (Railway) d'abord

**Impact en production, annoncé avant et accepté par le propriétaire :** pousser `ffmpeg_ops.py` sur master déclenchait (1) une build de production Vercel au code du site identique (l'`ignoreCommand` ne saute que docs/ et .md) et (2) un redémarrage du service utilisé par Audio Converter et les outils vidéo ; aucun comportement changé (sans `kbps`, commande identique).

- **Avant la mise en ligne, en local, avec le même ffmpeg que le service** (BtbN `autobuild-2026-08-31-13-27`, n8.1.2, build Windows du même tag ; SHA-256 `273abb45…` = celle publiée par GitHub) : `run_kbps_unit.py` **12/12**, `run_tests.py` **106/106**. `s30.mp4` n'existe plus sur ce poste : vidéo de 30 s 1080p générée par ffmpeg (mire + bruit, son = bruit rose + sinus). Un premier passage avec un son sinus pur donnait l'Opus à 64 kbit/s **sous** la tolérance (un sinus pur coûte très peu en VBR) : artefact de l'échantillon, pas du service ; le test affiche désormais le débit mesuré en cas d'échec.
- `run_tests.py` ne peut pas viser le service en ligne (il démarre son propre serveur et signe ses billets avec une clé jetable ; la clé du service est un secret). À la place, **essai du service en ligne par le chemin du navigateur** (`scripts/browser-tests/media-service-kbps-live.mjs` : billet de www, envoi par morceaux, départ, téléchargement) : Opus sans `kbps` 92 kbit/s (défaut 128, VBR), `kbps` 64 → 49,3, `kbps` 256 → 206,4, durées exactes ; **`kbps` sur MP3 refusé (« Unsupported bitrate. »)** — seul le nouveau code fait cela : preuve que c'est lui qui tourne. **4/4.**
- Commit `95e7125f` sur master (service seul) ; Railway : déploiement `68ff1c73` ; Vercel : production `onlineconvertools-gkt3idky1` (code du site identique).
- **Audio Converter en production après coup** (`audio-converter-format.mjs`, www) : Opus et MP3, **Chromium et Firefox, 4/4** ; l'Opus (OggS + OpusHead) se décode, 8,00 s.

## 2. Préversion (`onlineconvertools-lst7l87fa`, commit `707e037e` : tout le lot)

**Accès (même méthode que la 15, jeton jamais affiché) :** jeton OIDC Trusted Sources posé côté serveur par le mandataire `vercel-preview-proxy.mjs`, pour Chromium comme pour Firefox. Le jeton lu par `vercel env run` dans le dossier du projet venait de l'ancien `.env.local` et **avait expiré** (vérifié par sa date seule) ; aucun fichier d'environnement n'a été lu, modifié ni copié : `vercel env run` a été lancé depuis un dossier temporaire lié au projet (`.vercel/project.json` : identifiants du projet et de l'équipe seulement), qui télécharge un jeton neuf **en mémoire**.

| Point | Chromium | Firefox |
|---|---|---|
| 14 barcode-generator (`barcode-generator.mjs`) | **67/67** | **67/67** |
| 14 face aux références (`-vs-references.mjs --batch`) | nous **102/102** fichiers relus ; barcode-maker 31/68 « exacts » (34 « .jpg/.gif » qui sont des PNG, 3 SVG illisibles) ; barqode 50/50 sur 10 types ; **1000 EAN-13 : 4,65 s contre 9,79 s** (barcode-maker), 1000/1000 relus | nous **102/102** ; 1000 EAN-13 : **3,26 s**, 1000/1000 relus (références non rejouées sous Firefox) |
| 16 unit/color-converter (`unit-color-converter.mjs`) | **30/30** | **30/30** |
| 13 grammar-fixer, diff (`grammar-fixer-diff.mjs`, IA jouée par le test) | **11/11** | **10/10** |
| 17 gif-maker / qr-scanner / audio-trimmer (`improvement-17.mjs`) | **20/20** | **18/18** (+1 sauté : collage scripté impossible sous Firefox → prouvé en vrai ci-dessous) |
| Opus, de bout en bout, **vrai service** (`audio-opus-real.mjs`) | **4/4** | **4/4** |
| Collage QR depuis le **vrai presse-papiers** (`qr-scanner-paste-real.mjs`) | **réussi** | **réussi** |
| Correction de grammaire, **vraie IA**, face à LanguageTool | **25/25 contre 15/25** (2 passages identiques) | — (appel serveur, sans navigateur) |

### 2.1 Opus de bout en bout, avec le vrai service
Vraies pages, vrai billet de la préversion, vrai envoi, vrai libopus, fichiers téléchargés puis décodés ici par ffmpeg. Source : 4 s de bruit rose + sinus.
- Booster : 1 travail, Opus 4,00 s, ~90 kbit/s ; Splitter : 2 travaux, 3,00 s + 1,00 s ; **Compressor à 64k : 47 kbit/s** (contre ~90 au défaut : le débit choisi est appliqué) ; Audio Converter : 4,00 s. Noms en `.opus` dans les deux navigateurs.
- ⚠️ Seule entorse au chemin réel : l'origine de la préversion (ici le mandataire `localhost`) n'est pas dans `ALLOWED_ORIGINS` du service, qui répond alors **sans en-tête CORS** (il ne refuse rien, `cors.py`). L'option `--cors-shim` relaie les appels au service par Playwright et ajoute cet en-tête, rien d'autre. Sur www, le test tourne sans elle (§4). Le service de production n'a pas été reconfiguré.

### 2.2 Grammaire : la vraie IA face à LanguageTool
`scripts/browser-tests/grammar-vs-languagetool.mjs` : **25 erreurs connues** dans 12 phrases, en 3 textes collés comme par un visiteur, + un texte sans faute ; une erreur compte comme corrigée si la forme fautive disparaît **et** qu'une forme correcte (liste écrite à la main) apparaît. LanguageTool : son API publique (le moteur de languagetool.org, offre gratuite, pas Premium), chaque première suggestion appliquée (« tout accepter »).
- **Nous 25/25, LanguageTool 15/25**, sur 2 passages identiques ; le texte sans faute revient **inchangé des deux côtés**.
- LanguageTool laisse « many reason », « peoples goes », « She don't », « Me and him goes », « Each of the students have », « it's taste », « then yesterday », et introduit deux fausses corrections : « he have gone », « **We are going** … when it starts » (le temps change le sens).
- Limites : corpus de 25 erreurs écrit par moi (anglais seulement) ; « tout accepter » n'est pas ce que ferait un visiteur attentif chez LanguageTool. **Verdict : pas en dessous → la 13 part en production.** (Le serveur et l'instruction de l'IA ne changent pas avec la 13 : c'est la même IA qu'en production.)

### 2.3 Collage d'image du lecteur de QR code
`improvement-17.mjs` ne collait que par un `ClipboardEvent` fabriqué (et pas du tout sous Firefox). Nouvel essai : une image PNG d'un QR mise dans le **presse-papiers Windows** (PowerShell, `Clipboard.SetImage`, comme un outil de capture), puis **Ctrl+V** dans une fenêtre visible : le code est lu, **Chromium et Firefox**. Non couvert : Safari, mobile, collage d'une image copiée depuis une autre page web (le presse-papiers porte alors du HTML + image).
