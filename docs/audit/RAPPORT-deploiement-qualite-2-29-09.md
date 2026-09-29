# RAPPORT — Déploiement P14 (`qualite-2-29-09`), propriétaire présent

## En bref

| Étape | Résultat |
|---|---|
| Repère de restauration | **`restauration-avant-qualite-2-29-09`** = `0b67804b` (master = production d'avant, code identique à `48ce5d81`), poussé |
| Préversion | poussée directe d'une branche fraîche `qualite-2-29-09-preview` (pointe `fc78fda3`) : construite sans erreur → `onlineconvertools-hy8vmu22r` **Ready** (l'API n'a pas été nécessaire) |
| Bancs sur la préversion (relais local, jeton OIDC en mémoire) | **Chromium 76/76** · **Firefox 75/75** (Screen Recorder : Chromium seul) · **WebKit 67/67 exécutables** + 7 contrôles audio/vidéo impossibles dans le WebKit de Playwright sous Windows (pas d'`AudioContext`, pas de MediaRecorder, vidéos non chargées) — mêmes 7 qu'en local, déjà au plan (Safari réel, P1) |
| Fusion | `git merge --no-ff` → **`828cfe75`**, poussée **sans poussée forcée** (`0b67804b..828cfe75`) |
| Production | `onlineconvertools-pe0y3yri0` **Ready**, alias **www.onlineconvertools.com** |
| www | **238 pages Chromium : 238 propres** ; contrôles ciblés **tous PASS** (ci-dessous) |
| Retour arrière | **aucun** (aucun échec sur www) |
| Branche de préversion | supprimée après vérification (pointe `fc78fda3` dans master, 0 commit hors master) |

## Contrôles ciblés sur www (Chromium)

| Famille corrigée | Contrôle | Résultat |
|---|---|---|
| Filtres image | Image Inverter sur une photo JPEG → `image/jpeg`, fichier `inverted.jpg` | PASS |
| GIF | APNG to GIF : 2 images de 250 ms, pixels transparents gardés, pas de fuite de l'image 1 dans l'image 2, boucle infinie gardée, APNG joué une fois → pas de bloc NETSCAPE ; Image to GIF : transparence et proportions (le banc GIF n'a pas de filtre : ses 7 contrôles côté navigateur ont tourné, aucun service) | 7/7 PASS |
| PDF Redact | « John Smith » coupé (gras, retour à la ligne) retiré ; valeur de champ retirée partout dans le fichier ; seule la phrase noircie | 5/5 PASS |
| Markdown to PDF | `<img onerror>` et `<script>` du Markdown : `__pwned` reste `undefined` | PASS |
| Audio Booster | sinusoïde 0,5 ×4 : **0,0 %** d'échantillons écrêtés, RMS ×1,90 | 2/2 PASS |
| AI Chatbot | 2ᵉ message envoyé **avec la conversation** (requête lue, réponse jouée par le test : **aucun appel à OpenAI**) ; retours à la ligne gardés | 2/2 PASS |

Aucune suite complète rejouée sur www, aucun appel payant, aucun appel au service média.

## Commandes utiles

- Retour arrière (si nécessaire un jour) : redéployer le repère `restauration-avant-qualite-2-29-09` (`0b67804b`) — par
  une promotion Vercel du déploiement de production précédent, ou `git revert -m 1 828cfe75` poussé normalement
  (**jamais** de poussée forcée).
- Restauration de la branche de préversion supprimée :
  `git push origin fc78fda349822d7b20e24ff4f44775a2814a6f79:refs/heads/qualite-2-29-09-preview`

## Écart de méthode

- `scripts/browser-tests/image-audit-2.mjs` : option `--only=` ajoutée pour ne jouer que le contrôle de format sur www.
  Ce commit contient ce script (hors `docs/`) : Vercel reconstruira la production avec un **code du site identique**
  à `828cfe75` (`git diff` vide sur `app`, `lib`, `next.config.ts`, `package.json`). **Dernier déploiement de production :
  `82da9cf5`** (`onlineconvertools-35djgimn3`, Ready, alias www) — contrôlé : accueil, PDF Redact, APNG to GIF, AI Chatbot en 200,
  contrôle Markdown to PDF rejoué PASS.

## Pour le propriétaire, ensuite

1. Passe **Safari réel** (P1) sur les outils nommés au bloquant 5 : PDF Sign au doigt, PDF Forms, PDF OCR interrogeable,
   impression de Markdown to PDF, Screen Recorder, Video Rotator/Filter/Resizer avec pause, Audio Waveform.
2. **Appels payants** listés au bloquant 5 (qualité des sorties IA, Audio Transcriber, Image Generator).
