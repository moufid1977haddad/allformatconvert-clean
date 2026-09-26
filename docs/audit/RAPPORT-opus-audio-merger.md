# RAPPORT — Opus d'Audio Merger sur le service : rien à passer, la prémisse était fausse

**Date :** 26 septembre 2026 · **Branches :** `master` = `licence-ameliorations` = `46634ca7` au départ · **État :** **aucun code changé, rien déployé** ; question posée au propriétaire (§3).

## 1. Constat

La demande reposait sur une phrase écrite par moi dans `RAPPORT-opus-trois-outils-audio.md` (§6) puis recopiée dans `RAPPORT-mise-en-production-26-09.md` (§5) : « Audio Merger propose aussi Opus (encodeur natif) ». **Cette phrase est fausse.** Vérifié avant d'écrire la moindre ligne de code :

- **Code** (`app/tools/audio-tools/audio-merger/page.jsx`, inchangé depuis `9786eb63`, 19/09) : l'outil **n'a aucun choix de format de sortie**. Il sonde le codec de chaque fichier ; si tous ont le même codec et qu'il est dans la liste « copiable » (MP3, FLAC, Vorbis, **Opus**, AAC, PCM), il les **joint sans réencoder** (`-c copy`) ; sinon, il **réencode en MP3**. Aucun chemin n'appelle un encodeur Opus.
- **Production** (www, page servie) : le seul « opus » de la page est dans la liste des extensions **acceptées en entrée**.

Donc Audio Merger **n'encode jamais d'Opus** : des fichiers Opus en entrée ressortent en Opus **copiés tels quels** (aucune perte, aucun encodeur en jeu), tout mélange ressort en MP3. Il n'y a pas d'encodage Opus natif à remplacer par libopus ; la décision Zimtohrli (libopus meilleur 6 fois sur 6) ne s'applique à rien ici.

## 2. Ce qui a été fait

- Les deux phrases fausses sont **barrées et corrigées** dans `RAPPORT-opus-trois-outils-audio.md` et `RAPPORT-mise-en-production-26-09.md`, avec renvoi à ce rapport.
- **Plan** (`claude/plan-de-travail.md`, après le point sur le bloquant 5) : deux tâches **à faire avant le lancement, non traitées** — ① la limite de 20 conversions/heure/connexion à comparer aux offres gratuites des concurrents pour un utilisateur qui traite un lot, avec une valeur à proposer si elle est en dessous ; ② la qualité du correcteur de grammaire à mesurer dans les autres langues du site, face à LanguageTool, sur un corpus d'erreurs publié.
- Dossier temporaire lié au projet Vercel (accès aux préversions) **supprimé**.
- Étapes 2 (tests, préversion, production, www) : **sans objet**, aucun code n'a changé. Ce commit ne touche que des `.md` : l'`ignoreCommand` de Vercel ne relance aucune build.

## 3. Question au propriétaire

Faut-il **ajouter** à Audio Merger un choix de format de sortie (comme Booster/Splitter/Compressor : MP3, WAV, FLAC, AAC, OGG, M4A, **Opus via libopus sur le service**…) ? Ce serait une fonctionnalité nouvelle, pas le remplacement d'un encodeur : je ne l'ai pas faite sans accord. Remarque utile pour décider : aujourd'hui, joindre un MP3 et un WAV donne toujours un MP3, même si le visiteur voulait un fichier sans perte.

**Non vérifié ce soir :** que la jonction « copie » de plusieurs fichiers Opus produise un fichier dont la durée et la lecture sont exactes (pré-décalage Opus, horodatages Ogg). À mesurer si Audio Merger est retouché.
