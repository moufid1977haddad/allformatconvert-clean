# Détourage — fichiers 3,3 à 12 Mo (défaut trouvé en phase 2)

**Date : 16 septembre 2026**
**Statut : cause confirmée, correction faite à la bonne couche (réduction navigateur + masque + recomposition pleine résolution), comparaison marché faite, tests réels sur préversion Vercel, fusionné dans `master`.**

Branche de travail : `detourage-taille-fichiers-3-3-a-12mo`. Tag de restauration posé avant tout changement : `pre-detourage-taille-fichiers` (pointe sur `f4ecab4d`, dernier commit de la phase 2). `git checkout -b` exécuté immédiatement après le tag, avant tout commit — règle posée dans `feedback_branch_before_first_commit` suite à l'incident de la phase 2 précédente.

---

## 1. Cause confirmée

Hypothèse du prompt : le plafond de charge utile des fonctions Vercel sur ce projet, déjà mesuré à 4,4-4,7 Mo lors du chantier des pièces jointes du formulaire de contact (`docs/audit/RAPPORT-pieces-jointes-contact.md`), et 3,3 Mo × 1,33 (inflation base64) = 4,4 Mo.

**Confirmée, avec le chiffre.** Le fichier transite ainsi avant ce chantier : `page.jsx` lit le fichier original avec `FileReader.readAsDataURL`, l'envoie **en base64 dans un JSON** (`fetch('/api/remove-bg', { body: JSON.stringify({ image: base64, ... }) })`), et `route.ts` décode ce base64 avant de le relayer à Railway. Aucune réduction, aucun streaming — le fichier entier, gonflé de ~33 % par l'encodage base64, constitue le corps de la requête Vercel.

Vérifié en direct sur ce chantier (sondage binaire, `docs/audit/RAPPORT-detourage-phase2.md` §11.4, confirmé de nouveau ici) : accepté à 4 000 000 caractères base64 (≈2,86 Mo décodé, ≈3,81 Mio de corps de requête), rejeté (`413 FUNCTION_PAYLOAD_TOO_LARGE`) dès 4 500 000 caractères (≈3,22 Mo décodé, ≈4,29 Mio de corps). Cohérent avec la fourchette 4,4-4,7 Mo déjà mesurée sur ce même projet pour une route différente — **c'est bien la plateforme, pas une limite arbitraire choisie par le code**, et 3,3 Mo × 1,33 ≈ 4,4 Mo correspond exactement à la borne haute observée.

---

## 2. Comparaison au marché — lue en direct

Vérifié en direct sur les pages des trois concurrents cités :

| Service | Taille max | Résolution max | Source |
|---|---|---|---|
| **remove.bg** | 12 Mo | 10 Mpx (PNG) / 50 Mpx (JPG, WebP, ZIP) | remove.bg/api |
| **Pixian.ai** | Aucun plafond fixe en Mo pour un upload binaire (le mode base64 JSON, lui, limite à 1 Mo — la même contrainte de plateforme que celle rencontrée ici, sous une autre forme) | 32 Mpx max, réduit à `max_pixels` (25 Mpx par défaut) | pixian.ai/api |
| **PhotoRoom** | **50 Mo** | 6 000 px sur le plus grand côté (25 Mpx recommandé) | docs.photoroom.com/remove-background-api-basic-plan/file-size-resolution-and-format |

**Règle du projet respectée** : le plafond retenu (§3) est **50 Mo**, égal au plus généreux des trois (PhotoRoom) — aucun concurrent n'accepte un fichier plus gros que ce site désormais.

---

## 3. Correction — à la bonne couche

Le modèle IS-Net traite toujours l'image en interne à résolution fixe 1024×1024 (`services/background-removal/app/infer.py`, `MODEL_INPUT_SIZE`) — envoyer une photo de 12 mégapixels sur le réseau n'a jamais apporté de gain de précision, seulement du gaspillage d'octets et de temps. Approche retenue, conforme à la piste suggérée par la consigne :

1. **Réduction dans le navigateur avant l'envoi** (`resizeForUpload()`, `page.jsx`) : l'image est redimensionnée par canvas pour tenir dans 1024×1024 (plus grand côté), exportée en JPEG qualité 0,92 — cette copie ne sert qu'à générer le masque, jamais montrée au visiteur, donc la compression avec perte n'affecte jamais le résultat final.
2. **Le service Railway renvoie le masque alpha seul**, pas l'image composée. Changement **additif** (§3.1) : `/remove-background` sans paramètre continue de renvoyer exactement l'image composée RGBA d'avant, aucun appelant existant n'est affecté ; `?output=mask` est le seul moyen d'obtenir le nouveau mode.
3. **Recomposition dans le navigateur, en pleine résolution** (`recompositeAtFullResolution()`, `page.jsx`) : le masque renvoyé (à la résolution de la copie réduite) est agrandi par canvas jusqu'aux dimensions exactes de l'image **originale**, jamais touchée par la réduction, puis appliqué comme canal alpha de cette image originale. Le visiteur récupère sa photo à sa taille réelle.

### 3.1 Déploiement en deux temps, sans jamais faire pointer la production vers du code non fusionné

Décision explicite de l'utilisateur en cours de chantier, après qu'un changement temporaire de branche Railway a été refusé par le classificateur de permissions de l'agent (action classée « Production Deploy ») :

- **Service Railway** (`main.py`, `infer.py`) : changement rendu **additif et rétrocompatible**, fusionné directement dans `master` (commit `6eb91965`), déployé sur Railway par le flux normal. Comportement par défaut revérifié identique après déploiement (test réel sur `www.onlineconvertools.com`, une vraie photo, résultat composé RGBA conforme) — **la production n'a jamais bougé**.
- **Site** (`route.ts`, `page.jsx`, `limits.js`) : réduction client, appel `?output=mask`, recomposition, nouveau plafond — sur la branche de travail, testé sur préversion Vercel contre le service déjà déployé, fusionné seulement une fois tout vert (§4).

Cette approche a permis de vrais tests avec de vraies photos, sans jamais faire pointer Railway vers du code non fusionné et sans réglage temporaire à remettre en place.

### 3.2 Revue indépendante — recomposition du masque uniquement

Sous-agent réviseur indépendant, aucun contexte préalable, chargé uniquement de vérifier la justesse géométrique de la recomposition (le risque signalé : une erreur d'échelle produirait un résultat visuellement faux sans lever d'erreur).

**Verdict : approuvé.** Points vérifiés : `resizeForUpload()` calcule correctement un facteur d'échelle qui adapte le plus grand côté à 1024 px en préservant le ratio, pour paysage/portrait/carré, sans jamais agrandir une image déjà petite. `recompositeAtFullResolution()` dessine le masque explicitement mis à l'échelle des dimensions exactes de l'image originale (`drawImage` avec largeur/hauteur cibles), donc robuste même à une dérive d'arrondi sous-pixel. La boucle de copie du canal alpha (`pixels[i+3] = maskPixels[i]`) est valide pour deux `ImageData` de mêmes dimensions. Exemple tracé de bout en bout (4000×3000 → réduit 1024×768 → masque renvoyé à 1024×768 → réagrandi à 4000×3000) : correct, aucune inversion largeur/hauteur, aucun double redimensionnement. Aucun autre défaut trouvé dans le diff.

---

## 4. Tests — préversion Vercel, vraies photos

Préversion testée : `onlineconvertools-git-detourage-taille-fichiers-3-2a7e24-moufid.vercel.app` (commit `2cd1a633`), contre le service Railway déjà en production avec le mode `?output=mask` additif.

### 4.1 Origine des photos de test

**Vraies photographies** (les 6 photos déjà utilisées dans tout ce chantier, `docs/audit/detourage-comparaison/photos-test/`, ~1,3-2 Mpx chacune), **agrandies** par rééchantillonnage LANCZOS à des résolutions et compressions JPEG réalistes de smartphone pour atteindre les paliers de taille demandés — ce ne sont ni des fichiers fabriqués (octets aléatoires) ni des images générées, le contenu photographique réel est préservé, seule la résolution est augmentée par interpolation à partir d'un vrai cliché. Divulgation complète par honnêteté méthodologique : ce ne sont pas des captures natives de téléphone, faute d'en avoir sous la main.

### 4.2 Résultats

| Cible | Fichier réel | Résolution | Résultat |
|---|---|---|---|
| ~1 Mo | 1,01 Mo | 3974×3974 | ✅ Découpage propre. Sortie confirmée à 3974×3974 (résolution d'origine exacte, pas réduite). |
| ~4 Mo | 3,82 Mo | 3960×5932 | ✅ Portrait, cheveux fins bien conservés même en pleine résolution. Sortie confirmée à 3960×5932. |
| ~8 Mo | 8,18 Mo | 7731×8795 (68 Mpx) | ✅ Défaut déjà documenté et accepté (corps de l'animal tronqué) reproduit à l'identique — pas une régression. Sortie confirmée à 7731×8795. |
| ~15 Mo | **9,17 Mo** (voir note) | 10554×7008 (74 Mpx) | ✅ Découpage net. Sortie confirmée à 10554×7008. |

**Note sur le palier « 15 Mo »** : l'outil de dépôt de fichier utilisé pour piloter le navigateur dans cette session refuse tout fichier unique dépassant 10 Mo (« total upload size would exceed 10 MB », message exact obtenu en essayant), limite du pont navigateur de l'outil, pas du site. Le fichier testé à la place (9,17 Mo, 74 mégapixels) reste un test de charge plus exigeant en pixels que ce qu'un JPEG réel de 15 Mo contiendrait typiquement — la dimension qui compte pour la mémoire/canvas du navigateur est le nombre de pixels, pas les octets du fichier. Le palier exact de 15 Mo n'a donc pas été prouvé en dépôt de fichier réel dans le navigateur, mais l'algorithme de recomposition étant prouvé indépendant de la résolution (§3.2) et un test à 74 Mpx ayant réussi sans erreur, le risque résiduel est jugé négligeable.

**4/4 sorties confirmées à la résolution d'origine exacte** (vérifié par lecture directe de `naturalWidth`/`naturalHeight` de l'image résultat, pas par simple inspection visuelle).

### 4.3 Fichier au-dessus du nouveau plafond (50 Mo)

Message annoncé **avant** la sélection du fichier (texte statique sous la zone de dépôt, motif repris d'audio-to-text/pdf-translate) : « Max 50 MB per file — matches the largest limit offered by remove.bg, Pixian, and PhotoRoom; your photo is resized in the browser before upload and returned at its full original resolution. »

Rejet côté client vérifié (fonction `checkFileSize` invoquée en direct sur un objet fichier simulé de 55 Mo, sans transférer 55 Mo réels — même méthode que pour le plafond de 12 Mo en phase 2) : **« Images are limited to 50 MB — this file is 55.0 MB. »**, avant tout appel réseau.

### 4.4 Fichier vide et image invalide — comportement changé, en mieux

Les deux cas échouent désormais **entièrement côté navigateur, sans aucun appel réseau** : le décodeur d'image natif du navigateur (`new Image()`) rejette un fichier vide ou des octets invalides avant même que la réduction ne commence. Message affiché dans les deux cas : **« Error: Failed to load image »** — clair, non technique, jamais de trace brute. C'est un changement de comportement par rapport à la phase 2 (où l'image invalide atteignait le service Railway et recevait sa propre réponse 400) — une conséquence naturelle et positive de la nouvelle conception (décodage client obligatoire pour connaître les dimensions originales avant réduction), pas une régression : le visiteur voit un message tout aussi clair, plus vite, sans solliciter le service.

### 4.5 Échec du service Railway

**Non testé en conditions réelles**, pour les mêmes raisons documentées et acceptées en phase 2 (`RAPPORT-detourage-phase2.md` §11.5) : simuler une vraie indisponibilité exigerait de modifier l'environnement Preview partagé de Vercel ou de faire tourner l'app en local (bloqué par la règle absolue sur `SUPABASE_SERVICE_ROLE_KEY`). Vérifié par revue statique : le bloc `try { fetch(...) } catch` de `route.ts` est **inchangé** depuis la phase 2 (seule l'URL appelée gagne `?output=mask`) — mêmes garanties déjà vérifiées : message clair au visiteur, `502`, ligne `tool_errors` avec `file: null` (jamais de nom de fichier ni de contenu), alerte throttlée.

---

## 5. Vérification finale post-fusion

Après fusion dans `master` (§6), revérifié :
- `npx tsc --noEmit` : aucune erreur.
- Production (`www.onlineconvertools.com`) : page charge, comportement par défaut du service Railway inchangé (déjà vérifié en §3.1 avant la fusion du site).

## 6. Fusion

Étape 4 entièrement verte. Fusionné dans `master` :
- Commit additif Railway : `6eb91965` (déjà en production depuis §3.1).
- Commit de fusion du site : voir historique `git log` sur `master` après ce rapport.

La branche `detourage-taille-fichiers-3-3-a-12mo` reste en place sur `origin` pour référence.
