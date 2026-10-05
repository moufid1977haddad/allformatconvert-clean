# P36 — Lot 2 : consignes communes des auditeurs (une liste d'outils par auditeur)

## Règles absolues (copiées du propriétaire)
- Ne jamais lire, copier, afficher ni déplacer `.env`, `.env.local` ou tout fichier de secrets. N'utiliser que les NOMS de
  variables. Aucune commande dont la sortie pourrait contenir un secret.
- Ne modifier AUCUN fichier hors de la tâche : ce lot est en **lecture seule** du site. Les seuls fichiers que tu crées :
  `docs/audit/p36/audit/<lot>.md` et `docs/audit/p36/faits/<lot>.json` (`<lot>` = le nom de ton lot).
- Pas de commit, pas de push, pas de changement de branche, pas de `npm ci` / `npm install`, pas de serveur, pas de
  navigateur, aucun appel payant, aucune boucle d'attente.

## Ce que tu lis
- Le texte servi de chaque page (HTML brut, sections déjà séparées) : `docs/audit/p36/contenu-avant.json` (un objet par
  page : `title`, `desc` = méta-description, `h1`, `ui` = texte de l'interface de l'outil, `about.text`, `howto[]`,
  `faq[]` {q,a}, `tips[]`). C'est ce que Google lit.
- Le CODE de chaque outil : `app/tools/<catégorie>/<outil>/page.jsx` (+ fichiers voisins, `layout.tsx` pour les
  métadonnées) et tout ce qu'il importe (`app/components/*`, `app/lib/*`, `lib/*`, routes `app/api/*/route.*`, services
  `services/*` si l'outil y envoie le fichier). Les limites sont souvent dans `lib/quota/limits.js`, `app/lib/*Limits*`,
  `app/lib/deviceLimits*`, `app/lib/officeUpload.js`, `app/lib/mediaJob.js`, ou en dur dans la page.
- Ce que fait le site pour les quotas : `lib/quota/guard.js` (routes payantes : limite par réseau, par heure et par jour,
  valeurs dans des variables d'environnement — **ne pas chercher les valeurs** ; plafond de dépense mensuel du site),
  `lib/quota/*RateLimit.js` (limites chiffrées dans le code pour URL→PDF, rendu PDF, OCR). Aucune inscription n'est
  exigée par aucune route (`app/api/quota/me` lit un compteur sans rien bloquer) — vérifie-le pour tes outils.

## Ce que tu produis

### 1. `docs/audit/p36/audit/<lot>.md` — ce qui doit disparaître
Un tableau par outil, une ligne par défaut, colonnes : `Outil | Endroit (titre / méta / about / étape n / FAQ n / astuce n / interface) | Phrase exacte (courte citation) | Type | Ce que dit le code (fichier:ligne) | Correction attendue`.
Types : **FAUX** (contredit par le code), **INVÉRIFIABLE** (aucune preuve dans le code ni dans un rapport du dépôt :
« fastest », « best quality », « 100 % secure », « unlimited », « any size », « instantly », « all formats »,
« professional », « industry-standard »… ; une mesure citée doit avoir son rapport dans `docs/audit/`, sinon
INVÉRIFIABLE), **TROMPEUR** (vrai mais faux pour une partie des cas : « no upload » alors qu'un cas envoie le fichier ;
« free, no signup » alors qu'une limite horaire existe et n'est pas dite ; une limite d'ordinateur annoncée sans celle du
téléphone), **GÉNÉRIQUE** (phrase copiable telle quelle sur une autre page : « Do I need to install any software? No, it
works directly in your web browser. », « Is X free? Yes… »), **MINCE** (page dont le texte propre à l'outil est trop
court ou vide d'information réelle : dis ce qui manque), **LIBELLÉ** (bouton cité qui n'existe pas ou porte un autre
nom), **FORMAT** (format annoncé non accepté, ou accepté et non dit).
Termine par une ligne de synthèse : nombre de défauts par type pour ton lot.
Sois exhaustif : chaque affirmation de format, limite, gratuité, vitesse, confidentialité, « illimité », « sans
inscription », « sans filigrane », qualité, compatibilité navigateur/téléphone doit être confrontée au code. Une affirmation
juste ne va PAS dans le tableau.

### 2. `docs/audit/p36/faits/<lot>.json` — la fiche de faits de chaque outil (servira aux rédacteurs)
Un tableau JSON, un objet par outil, **chaque valeur prouvée par une référence `fichier:ligne`** :
```json
{
  "path": "/tools/pdf-tools/pdf-to-word",
  "task": "ce que fait l'outil, en une phrase neutre",
  "inputs": {"accept": "valeur exacte de l'attribut accept, ou null", "formats": ["PDF"], "ref": "app/tools/…/page.jsx:120"},
  "outputs": {"formats": ["DOCX", "DOC", "RTF"], "ref": "…"},
  "controls": [{"label": "libellé EXACT du bouton / champ / option tel qu'affiché", "ref": "…"}],
  "steps": ["déroulé réel : choisir un fichier → option … → bouton « Convert » → bouton « Download »"],
  "limits": [{"what": "taille max par fichier sur ordinateur", "value": "…", "constant": "NOM_DE_CONSTANTE ou null", "ref": "…"},
             {"what": "… sur iPhone/Android", "value": "…", "ref": "…"}],
  "processing": {"where": "browser | our-server | third-party | mixed", "detail": "ce qui part, vers quoi (service Railway, ConvertAPI, OpenAI, Pangram, Google…), quand le fichier est supprimé, exactement comme le code", "ref": "…"},
  "quota": "aucune | limite par réseau heure/jour (guard) | limite chiffrée … | plafond mensuel du site",
  "signup": "aucune inscription demandée (vérifié : …) | …",
  "watermark": "aucun filigrane ajouté (vérifié) | sans objet",
  "browsers": "particularités réelles (Safari, iPhone, Firefox) lues dans le code, ou null",
  "twin": "chemin d'un outil homonyme ou quasi identique ailleurs sur le site, ou null",
  "notes": "toute autre chose utile au rédacteur (cas non pris en charge, messages d'erreur réels…)"
}
```
Si une valeur ne se lit pas dans le code, écris `"value": "NON TROUVÉ"` et dis où tu as cherché — n'invente jamais.

## Message final
≤ 15 lignes : nombre d'outils lus, nombre de défauts par type, les 3 défauts les plus graves, les valeurs NON TROUVÉ.
