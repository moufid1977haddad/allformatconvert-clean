# P36 — Lots 3 à N : consignes communes des rédacteurs (une liste d'outils par rédacteur)

Tu as fait l'audit de ton lot (Lot 2) : tu connais le code de chaque outil, sa fiche de faits
(`docs/audit/p36/faits/<lot>.json`) et ce qui doit disparaître (`docs/audit/p36/audit/<lot>.md`). Tu réécris maintenant
le contenu SEO de chaque page de ton lot. Ce texte sera la base des traductions FR / ES / AR : il doit être **exact**.
Le propriétaire ne tolère **aucune erreur**.

## Règles absolues (copiées du propriétaire)
- Ne jamais lire, copier, afficher ni déplacer `.env`, `.env.local` ou tout fichier de secrets. Seulement les NOMS de
  variables. Aucune commande dont la sortie pourrait contenir un secret.
- Ne modifier aucun fichier hors de la tâche. Fichiers autorisés, pour les outils de TON lot seulement :
  1. `app/tools/<cat>/<outil>/layout.tsx` : uniquement `metadata.title.absolute`, `metadata.description`,
     `metadata.openGraph.title`, `metadata.openGraph.description` (canonical, URL, `ToolSeo` : inchangés) ;
  2. `app/tools/<cat>/<outil>/page.jsx` (ou le fichier voisin qui porte l'objet `seo`) : uniquement les props de
     `<SeoContent …>` ou de l'objet `seo` passé à un composant partagé ; et, si l'audit a trouvé une phrase FAUSSE dans le
     texte de l'interface de l'outil (note, aide, message), la chaîne de texte elle-même — jamais la logique, les
     constantes, les libellés de boutons (ils sont la référence) ni la mise en page. Liste chaque chaîne d'interface
     modifiée dans ton message final ;
  3. `docs/audit/p36/preuves/<lot>.json` (voir « Chiffres ») ;
  4. `docs/audit/p36/redaction/<lot>.md` (ton compte rendu).
  Ne touche à aucun composant partagé (`app/components/*`, `app/lib/*`, `lib/*`) : si un texte FAUX vit dans un composant
  partagé, signale-le dans ton compte rendu sans le modifier.
- Pas de commit, push, changement de branche, `npm ci` / `npm install`, serveur, navigateur, appel payant, boucle d'attente.
- Ne change aucune adresse de page, ne supprime ni ne renomme aucun outil.

## Ce qu'il faut lire d'abord
- `docs/audit/GABARIT-CONTENU-P36.md` : §2 (structure, formules de titre et de méta, FAQ, anti-motifs) et §3 (questions
  réelles par outil).
- `app/components/SeoContent.tsx` : les props disponibles (P36 a ajouté `howToTitle`, `specs`, `specsTitle`, `privacy`,
  `privacyTitle`).
- `docs/audit/p36/contenu-avant.json` : le texte actuellement servi (pour ne rien garder de faux ni de générique).

## La page à produire (ordre affiché : About → Example → How to → Formats and limits → Where your file is processed → FAQ → Tips → Related tools)
- `title` (prop) : **inchangé** (c'est le nom affiché « About {title} »).
- `metadata.title.absolute` : ≤ 60 caractères, mot-clé principal réel en tête, formule du gabarit §2a, un seul bénéfice
  vrai ; unique sur le site ; différent du H1.
- `metadata.description` : **110 à 155 caractères**, formule §2b ; différente du texte About ; unique.
- `openGraph.title` / `openGraph.description` : **identiques** aux deux précédents.
- `description` (About) : 60 à 120 mots, propre à l'outil : ce qu'il fait, pour quoi faire, formats réels d'entrée et de
  sortie, ce qu'il ne fait pas, en une phrase où il traite le fichier.
- `example` : **obligatoire** pour les outils texte, développeur, calcul, conversion d'unités/couleurs, encodage ; la sortie
  doit être **produite en exécutant le vrai code de l'outil** (Node : importe la fonction de la page ou de sa lib et
  exécute-la ; si ce n'est pas possible, reproduis exactement l'algorithme du code et dis-le dans ton compte rendu). Pour
  les fichiers (PDF, image, audio, vidéo) : pas d'exemple inventé ; un exemple seulement s'il cite un résultat mesuré dans
  un rapport du dépôt (`docs/audit/…`), avec sa date.
- `howToTitle` : « How to <verbe réel> … » (ex. « How to convert PDF to Word »).
- `howTo` : 3 à 5 étapes (6 au plus), une phrase chacune, avec les **libellés exacts** des boutons et options entre
  guillemets droits doubles `"Convert"` (copiés du JSX ; `scripts/content-checks/instructions.mjs` les vérifie) ; la
  dernière dit ce qu'on obtient (format, nom du bouton de téléchargement, ZIP si plusieurs fichiers).
- `specs` : 3 à 7 lignes `{ label, value }`, par exemple « Input formats », « Output », « Maximum file size »,
  « On iPhone and iPad » (seulement si une limite différente existe dans le code), « Files at once », « Length »,
  « Pages », « Usage limits » (pour les outils soumis à `lib/quota/guard.js` : limite par réseau par heure et par jour
  et budget mensuel du site, **sans chiffre** puisque les valeurs sont dans l'environnement ; chiffres seulement s'ils sont
  dans le code). Les formats nommés dans une ligne « Input… / Output… » doivent apparaître dans le code de la page (C4).
- `privacy` : 40 à 90 mots, **exactement ce que fait le code** : dans le navigateur (rien n'est envoyé) / envoyé à notre
  serveur (lequel : service de conversion sur Railway, Gotenberg, pdf-tools, service média…) / à un prestataire nommé
  (ConvertAPI, OpenAI, Pangram, Google pour la reconnaissance vocale du navigateur…), dans quel cas (repli iPhone, gros
  fichiers, mode précis…), et quand il est supprimé (seulement si le code ou la doc officielle du prestataire le dit ;
  sinon ne rien affirmer sur le délai). Garde `privacyTitle` par défaut (« Where your file is processed ») ou adapte-le
  (« Where your text is processed », « Where your image is processed »).
- `faqs` : 3 à 6 questions réelles (gabarit §3 pour ton outil), règles §2d : la réponse commence par Yes / No / le chiffre,
  25 à 70 mots, exacte. Pas de « Is it free? Yes, no signup », pas de « Do I need to install software? ». Une question sur
  la gratuité seulement si une limite réelle est à expliquer (quota, budget).
- `tips` : 0 à 4 conseils propres à l'outil (une action dans cet outil ou un outil lié) ; aucun banal.
- `related`, `example` existants (10 pages du 29/09) : garde-les s'ils sont exacts.
- Total visible visé : 350 à 700 mots ; **moins plutôt que du remplissage**.

## Exactitude
- Chaque affirmation vient de ta fiche de faits (fichier:ligne). Rien d'autre. « Free » est vrai (aucun paiement sur le
  site). « No account / no sign-up » seulement si tu as vérifié qu'aucune route de l'outil ne l'exige — et pas en
  formule creuse répétée. « No watermark » seulement si le code n'en ajoute pas (et jamais comme argument répété).
- **Chiffres** (tailles, pages, mégapixels, secondes, minutes, langues, fichiers, %, fps…) : de préférence calculés depuis la
  constante du code dans un gabarit `${…}` (importe la constante que la page utilise déjà ou son module, sans changer le
  code de l'outil : un `import` en tête de `page.jsx` est permis s'il ne change rien au comportement). Sinon, chaque
  chiffre écrit en dur doit avoir sa preuve dans `docs/audit/p36/preuves/<lot>.json` :
  `{ "/tools/<cat>/<outil>": [ { "claim": "60 seconds", "file": "app/components/GifFromVideoTool.jsx", "pattern": "MAX_\\w*\\s*=\\s*60\\b" } ] }`
  (`claim` = le texte exact de la page ; `pattern` = expression régulière qui trouve la valeur dans `file`). Le contrôle
  C3 refuse tout nombre avec unité non prouvé.
- Limites **par appareil** quand le code les distingue (ordinateur / iPhone-iPad / Android).
- Ce qui n'est pas dans le code ou dans un rapport du dépôt n'est **pas** écrit (vitesse, qualité, taux de compression,
  précision, « works on all devices »…).

## Unicité (Google « scaled content abuse »)
- Aucune phrase copiable sur une autre page. Aucune phrase identique à une autre page du site (C7 : aucune paire au-delà
  de 30 % de phrases identiques, mesuré sur TOUT le site, autres lots compris).
- Outils jumeaux ou proches (mêmes moteurs : MP4/MOV/AVI/WebM to GIF, PDF to JPG / PDF to Image, Markdown Editor /
  Previewer, JSON to Go / C# / Python, homonymes dans deux catégories) : textes réellement différents, centrés sur ce qui
  distingue chaque page (format d'entrée propre, réglage propre, public propre), sans inventer de différence.
- Pas de bourrage : le mot-clé exact au plus 3 à 4 fois hors titres.
- Anglais simple (américain), phrases courtes, aucun ton publicitaire, aucun emoji.

## Contrôles à lancer avant de rendre (tous à zéro défaut pour tes outils)
```
node scripts/p36/content-verify.mjs --only=<cat>/      (C0-C7 ; pour un lot à cheval sur deux catégories, lance-le pour chacune)
node scripts/content-checks/instructions.mjs           (libellés cités = libellés du code ; 0 mismatch sur tout le site)
node scripts/content-checks/privacy-claims.mjs         (aucune promesse « rien n'est envoyé » fausse ; 0 failure)
```
Ne lance pas `npm run build` (le contrôleur le fait). Les défauts C1 des pages d'AUTRES lots ne te concernent pas.

## Compte rendu `docs/audit/p36/redaction/<lot>.md` et message final
Par outil : titre et méta (avec longueurs), mots du texte visible avant/après (estimés depuis le source), affirmations
fausses ou invérifiables supprimées (renvoi à l'audit), chaînes d'interface corrigées, exemples exécutés (commande), points
non vérifiables laissés de côté. Message final ≤ 15 lignes : résultat des trois contrôles, ce qui reste douteux.

## Précisions (06/10, après l'audit)
- **Production** : `NEXT_PUBLIC_MEDIA_SERVICE_URL` est défini sur www (le service média est en ligne depuis le 20/09) :
  décris toujours la branche « service configuré » du code (`mediaServiceConfigured()` vrai, `MediaServiceTool`, limites du
  service, 25 MiB pour la transcription, etc.), jamais la page de repli `LegacyPage`. `docs/audit/p36/contenu-avant.json`
  a été relu **sur www** (et non plus sur une construction locale, qui n'a pas cette variable) ; les entités HTML n'y
  sont plus décodées deux fois.
- Les messages d'erreur affichés sont envoyés, nettoyés, à `/api/report-error` (P25) : une page qui dit « nothing is
  sent » doit rester exacte pour le fichier et le texte de l'utilisateur ; ne promets pas « aucune requête » si une erreur
  affichée peut partir.
