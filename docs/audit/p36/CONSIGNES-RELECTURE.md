# P36 — contrôle n° 2 : consignes du réviseur indépendant (une catégorie ou un groupe de catégories par réviseur)

Tu n'as PAS écrit ces pages. Tu relis **toutes** les pages de ta liste, réécrites par d'autres agents, avec la même liste
de contrôle qu'eux, et tu signales **toute** phrase fausse, invérifiable, générique ou dupliquée. Le propriétaire refuse
toute erreur : rien n'est déployé tant que ton relevé n'est pas à zéro défaut.

## Règles absolues (copiées du propriétaire)
- Ne jamais lire, copier, afficher ni déplacer `.env`, `.env.local` ou tout fichier de secrets. Seulement les NOMS de
  variables.
- **Lecture seule** : tu ne modifies aucun fichier du site. Seul fichier créé : `docs/audit/p36/relecture/<nom>.md`
  (`<nom>` donné dans ta consigne).
- Pas de commit, push, changement de branche, `npm ci` / `npm install`, serveur, navigateur, appel payant, boucle d'attente.

## Ce que tu relis, pour chaque page
- Le texte réécrit : props de `<SeoContent>` (ou objet `seo`) dans `app/tools/<cat>/<outil>/page.jsx` et `metadata`
  dans `layout.tsx` ; les chiffres écrits en `${…}` : calcule leur valeur réelle depuis le code ; les preuves des chiffres
  écrits en dur : `docs/audit/p36/preuves/<lot>.json`.
- Le CODE de l'outil, lu par toi-même (page, fichiers voisins, composants et bibliothèques importés, routes `app/api`,
  services `services/*`) : ne fais pas confiance aux fiches de faits ni aux comptes rendus des rédacteurs ; tu peux
  les lire pour t'orienter, jamais comme preuve.
- Production : `NEXT_PUBLIC_MEDIA_SERVICE_URL` est défini sur www (service média en ligne) ; les autres variables
  d'environnement (limites par heure/jour, budgets, durées de conservation) ne se lisent pas : une page qui donne leur
  valeur chiffrée est en défaut, une page qui dit qu'une limite existe sans chiffre est juste.

## Liste de contrôle (une ligne de défaut par manquement)
1. **Exactitude** : chaque affirmation (format d'entrée et de sortie, limite, taille, pages, mégapixels, durée, nombre de
   fichiers, libellé de bouton, réglage, valeur par défaut, comportement, lieu de traitement, suppression, quota,
   compatibilité Safari / iPhone / Firefox, absence de filigrane, inscription) est vraie **dans le code**, pour **tous**
   les cas (ordinateur et téléphone, chaque mode, chaque format, repli serveur).
2. **Libellés** : chaque bouton ou option cité existe sous ce nom exact et fait ce que la phrase dit.
3. **Lieu de traitement** : la section `privacy` dit exactement ce que fait le code (navigateur / notre serveur / quel
   prestataire / dans quel cas), et ne promet pas plus (ex. « nothing is sent » alors qu'un repli ou un mode envoie).
4. **Invérifiable** : vitesse, qualité, précision, taux, « best », « fast », « reliable », « works everywhere »… sans preuve
   dans le code ou un rapport daté du dépôt.
5. **Générique** : phrase qui resterait vraie sur une autre page en changeant le nom de l'outil ; phrase identique ou
   quasi identique à une phrase d'une autre page du site (compare avec les pages voisines et jumelles de ta liste ET des
   autres catégories quand l'outil a un jumeau).
6. **Structure** : titre ≤ 60 caractères avec le vrai mot-clé, méta 110-155 caractères, différente du texte About ;
   About 60-120 mots ; 3-6 étapes ; 3-6 FAQ dont la réponse commence par Yes / No / un chiffre et répond vraiment ;
   pas de bourrage de mots-clés ; anglais correct.
7. **Exemple** (pages texte, développeur, calcul) : la sortie montrée est celle que produit vraiment le code (refais le
   calcul ou exécute la fonction en Node).

## Ce que tu rends : `docs/audit/p36/relecture/<nom>.md`
Un tableau : `Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée`.
Sois exhaustif et précis ; ne signale pas un goût de style. Termine par : nombre de pages relues, nombre de défauts par
point de la liste (1 à 7), et la liste des pages **sans aucun défaut**.

Message final ≤ 12 lignes : nombre de défauts, les plus graves, pages sans défaut.
