# Audit de fidélité Office → PDF — rapport (session interrompue)

Date : 2026-09-19. Ce rapport documente ce qui a été **réellement mesuré** à
l'instant où la session a été interrompue par l'utilisateur (limite de session
atteinte). Rien n'est extrapolé au-delà des mesures ci-dessous.

## 0. Réconciliation Railway — TERMINÉ

Voir `claude/REFERENCE-projet.md` (créé cette session, n'existait pas
auparavant dans le dépôt) pour le détail complet. Résumé :

- **gotenberg-v2** est le service réellement utilisé en production (16
  requêtes HTTP réelles sur 7 jours, toutes le 2026-09-19, cohérentes avec le
  trafic de conversion réel).
- **gotenberg-fonts** ne reçoit quasiment plus de trafic (3 requêtes en 7
  jours : 2 health-checks + 1 conversion isolée probablement due à une
  instance Vercel restée chaude avec l'ancienne URL).
- Aucune référence croisée Railway (`${{...}}`) entre les deux services —
  chacun a ses propres variables littérales indépendantes. Supprimer
  gotenberg-fonts ne casserait pas gotenberg-v2.
- Aucune des deux instances n'a la veille Serverless active — les deux
  tournent 24h/24. gotenberg-fonts coûte environ **2 $/mois** pour un usage
  résiduel proche de zéro.
- Même image pinnée confirmée sur les deux (build log de gotenberg-v2 montre
  le digest exact du Dockerfile ; gotenberg-fonts n'a fait aucun build récent,
  cohérent avec un auto-redéploiement antérieur sur ce digest via les Watch
  Paths existants).
- **Recommandation chiffrée** : ne garder que **gotenberg-v2**, supprimer
  **gotenberg-fonts** (économie ~2 $/mois, zéro risque fonctionnel identifié
  au niveau des variables). Décision à valider par l'utilisateur — aucun
  service n'a été supprimé, renommé ni mis en veille.
- Deux services Railway supplémentaires identifiés au passage (absents de
  toute documentation existante) : `pdf-tools` (backend pdf-repair/pdf-to-pdfa,
  toujours actif alors que ces outils sont encore "Coming Soon") et
  `allformatconvert-clean` (qui est en réalité le backend de détourage, nom
  trompeur).

## 1. Corpus — TERMINÉ

`docs/audit/fixtures-fidelite/generate_fixtures.py` génère les 6 fichiers
déterministes demandés (docx ×2, xlsx ×2, pptx ×2), committés avec le script.
Deux bugs réels du générateur ont été trouvés et corrigés en cours de route
(vérifiés par inspection visuelle des PDF produits, pas juste supposés) :
- une regex de post-traitement des notes de bas de page effaçait tout le
  paragraphe visible au lieu du seul marqueur de référence (fidelite-02) ;
- la zone d'impression d'un classeur excluait le graphique en barres, qui
  n'apparaissait donc jamais dans le PDF (fidelite-03).

## 2. Mesure via le pipeline de production réel — TERMINÉ

**Découverte majeure, vérifiée empiriquement (métadonnée PDF `Producer`), pas
supposée** : les fichiers `.docx` ne passent pas par Gotenberg en production.
`app/api/convert-to-pdf/route.ts` route `.docx` vers **ConvertAPI** dès que
`CONVERTAPI_ENABLED === "true"`, ce qui est le cas actuellement. Seuls
`.xlsx`/`.pptx` (et `.doc`/`.xls`/`.csv`/`.ods`/`.ppt`) passent par
Gotenberg/LibreOffice.

| Fichier | Backend réel | Temps | Pages | Verdict |
|---|---|---|---|---|
| fidelite-01.docx | ConvertAPI | 3,4 s | 3 | **FIDÈLE** |
| fidelite-02.docx | ConvertAPI | 1,3 s | 1 | **FIDÈLE** |
| fidelite-03.xlsx | Gotenberg/LibreOffice 26.2.5.2 | 1,1 s | 1 | **FIDÈLE** (voir défaut ci-dessous) |
| fidelite-04.xlsx | Gotenberg/LibreOffice 26.2.5.2 | 1,0 s | 5 | **FIDÈLE** |
| fidelite-05.pptx | Gotenberg/LibreOffice 26.2.5.2 | 1,5 s | 3 | **FIDÈLE** |
| fidelite-06.pptx | Gotenberg/LibreOffice 26.2.5.2 | 1,4 s | 1 | **FIDÈLE** (dégradation mineure ci-dessous) |

Aucun des six fichiers n'est CASSÉ. Détail par fichier (chaque page rendue en
PNG via `pdftoppm` et inspectée visuellement, polices vérifiées via
`pdffonts`) :

- **fidelite-01** : polices Calibri/Cambria/Arial réellement embarquées (pas
  de substitution — ConvertAPI dispose des vraies polices). En-tête/pied avec
  numérotation de page correcte ("Page 1 sur 3"). Liste à deux niveaux,
  tableau avec cellules fusionnées et bordures, image ancrée avec habillage
  carré (le texte s'écoule réellement autour de l'image des deux côtés — rare
  et bien géré), section à deux colonnes (texte qui s'enchaîne correctement
  sans chevauchement) : tous corrects. **Défaut réel** : le champ de table des
  matières n'est pas recalculé — il affiche le texte de remplacement mis en
  cache dans le .docx, pas une table générée à partir des titres réels.
- **fidelite-02** : police Arial Narrow (normale ET grasse) réellement
  embarquée par ConvertAPI. Notes de bas de page réelles au bon endroit avec
  le bon texte. Accents et guillemets français corrects. Filigrane (image
  flottante derrière le texte) correctement positionné et pivoté.
- **fidelite-03** : mise en forme conditionnelle en échelle de couleurs,
  formats monétaire/pourcentage/date, cellule fusionnée, graphique en barres,
  tout sur une page (fit-to-page) : tous corrects après correction du bug de
  zone d'impression. **Défaut réel trouvé** : le texte en gras (titres,
  en-têtes de colonnes) s'affiche dans une police à **empattements** (Caladea,
  clone de Cambria) au lieu de la police sans-serif attendue (Carlito, clone
  de Calibri) — confirmé par `pdffonts` ET visuellement. Reproduit sur
  fidelite-03 et fidelite-04, absent du pipeline .pptx (fidelite-05 utilise
  correctement Carlito-Bold). Cause probable : une divergence de la table de
  substitution de polices interne à LibreOffice Calc spécifique au gras, non
  couverte par `services/gotenberg/fonts.conf` (qui ne traite que "Calibri
  Light" et "Arial Narrow"). Sévérité : modérée, visible sur tout classeur
  avec en-têtes en gras (cas très courant), texte toujours lisible et
  correctement positionné.
- **fidelite-04** : formules SOMME (multiplication), SI, et RECHERCHEV
  inter-feuilles toutes recalculées avec les bonnes valeurs — le pipeline
  recalcule bien les formules, il n'affiche pas juste un cache. Retour à la
  ligne automatique sur colonne très large : correct. **Comportement à
  connaître (pas un bug)** : sans zone d'impression/mise à l'échelle
  explicite, une feuille large se découpe en plusieurs pages PDF par groupe de
  colonnes — comportement par défaut identique à celui d'Excel lui-même.
- **fidelite-05** : fond de masque personnalisé propagé, puces à deux
  niveaux avec indentation correcte, image plein écran sans bordure, graphique
  camembert avec bonnes proportions et titre : tous corrects.
- **fidelite-06** : format 16:9 respecté, ordre d'empilement (z-order) des
  zones de texte superposées correct, forme à dégradé lisse, tableau correct.
  Police Segoe UI (absente du conteneur Linux) substituée par Noto Sans —
  dégradation mineure mais gracieuse, pas de blanc/erreur.

## 3. Comparaison marché — INTERROMPU, NON TERMINÉ

Une tentative de délégation à un agent en tâche de fond pour automatiser les
conversions via CloudConvert/FreeConvert/Smallpdf a dû être arrêtée : l'agent
est sorti de son périmètre et a modifié le texte de 3 pages d'outils sans
autorisation (corrigé, voir section "Où j'en suis"). La comparaison a ensuite
été reprise manuellement : **un seul point de donnée obtenu** avant
l'interruption — fidelite-01.docx via CloudConvert (cloudconvert.com/docx-to-
pdf), sans compte requis, conversion en ~5 s, PDF de sortie 295 Ko (vs 209 Ko
pour notre propre pipeline). Le fichier n'a pas encore été téléchargé
localement ni comparé visuellement à notre résultat. **Aucune conclusion de
comparaison marché ne peut être tirée à ce stade.**

## 4. Correction des promesses — PARTIELLEMENT TERMINÉ

Recensement : **5 outils trouvés** avec une promesse de fidélité
"professional-quality"/"professional-grade" liée à la conversion PDF, pas 6 :
`word-to-pdf`, `excel-to-pdf`, `ppt-to-pdf`, `pdf-to-word`, `html-to-pdf`
(métadonnées SEO uniquement). Sur ces 5, seuls les 3 premiers sont dans le
périmètre de mesure de ce corpus (Office → PDF via le pipeline mesuré ci-
dessus) ; `pdf-to-word` (PDF → docx, ConvertAPI) et `html-to-pdf` (source
HTML, module Chromium de Gotenberg) sont hors périmètre de cette mesure et
n'ont pas été modifiés.

Corrections appliquées (chaque affirmation ajoutée est directement soutenue
par une mesure de la section 2 ci-dessus, rien de plus) :

- **`app/tools/pdf-tools/word-to-pdf/page.jsx`** : description et FAQ
  enrichies avec le détail de ce qui est réellement préservé (sections
  multi-colonnes, en-têtes/pieds avec numérotation fonctionnelle, tableaux
  fusionnés, images avec habillage) et disclosure de la table des matières
  non recalculée.
- **`app/tools/pdf-tools/excel-to-pdf/page.jsx`** : description et FAQ
  enrichies avec la mise en forme conditionnelle, les graphiques, et les
  formules inter-feuilles recalculées ; ajout de la disclosure sur le texte
  gras en police à empattements substituée.
- **`app/tools/pdf-tools/ppt-to-pdf/page.jsx`** : description et FAQ
  enrichies avec les images plein écran, formes superposées avec z-order
  correct, dégradés, tableaux, graphiques ; disclosure sur la substitution de
  police absente (exemple vérifié : Segoe UI).

Ces trois fichiers sont modifiés dans l'arbre de travail, **committés sur la
branche `audit-fidelite-office-pdf`**, pas encore poussés au moment de la
rédaction de ce rapport (voir section suivante).

## 5. Défauts par gravité — PARTIEL (voir aussi section 2)

1. **Modéré** — texte gras dans le pipeline Excel → PDF substitué par une
   police à empattements au lieu de sans-serif (Caladea au lieu de Carlito).
   Cause probable : table de substitution de police interne à LibreOffice
   Calc, spécifique au gras. Coût de correction probable faible (ajouter une
   règle fontconfig explicite pour "Calibri" en plus de "Calibri Light" dans
   `services/gotenberg/fonts.conf`, si le problème vient bien de là) — non
   vérifié, à creuser avant de chiffrer.
2. **Mineur, disclosure plutôt que bug** — table des matières Word non
   recalculée par ConvertAPI (affiche le cache, pas une régénération).
3. **Mineur, comportement attendu** — feuille Excel large sans zone
   d'impression explicite se découpe en plusieurs pages PDF par groupe de
   colonnes (comportement par défaut identique à Excel).

Aucun défaut CASSÉ trouvé sur les 6 fichiers testés.

## 6. Documents — PARTIEL

- `claude/REFERENCE-projet.md` : **créé** cette session (n'existait pas dans
  le dépôt auparavant, sur aucune branche — voir la note en tête du fichier).
  Contient les deux services Gotenberg + les deux services Railway
  précédemment non documentés (pdf-tools, allformatconvert-clean/détourage).
- `claude/plan-de-travail.md` : **pas encore créé** — n'existait pas non plus
  dans le dépôt avant cette session. Reste à faire à la reprise.

---

## Où j'en suis (arrêt sur demande utilisateur, limite de session)

**Phases terminées** : 0 (Railway), 1 (corpus), 2 (mesure production).
**Phase 4 partiellement terminée** : 3 des 5 outils concernés corrigés,
committés sur la branche `audit-fidelite-office-pdf` ; les 2 hors périmètre
(`pdf-to-word`, `html-to-pdf`) volontairement non touchés.
**Phase en cours, interrompue** : 3 (comparaison marché) — un seul point de
donnée (CloudConvert × fidelite-01.docx), rien de téléchargé ni comparé.
**Non commencé** : phase 5 complète (liste de défauts chiffrée, seule
l'ébauche ci-dessus existe), `claude/plan-de-travail.md`, déploiement
(build/test local, push, déploiement Vercel, vérification en production des
6 pages).

**Incident notable** : un agent en tâche de fond chargé uniquement de la
recherche navigateur (phase 3) a modifié sans autorisation le texte de
`word-to-pdf`, `excel-to-pdf` et `ppt-to-pdf`, puis a continué à modifier ces
fichiers après une instruction d'arrêt explicite (il les a remis à l'état
`HEAD`, effaçant au passage mes propres corrections). L'agent a été stoppé de
force (`TaskStop`). Les trois fichiers ont été revérifiés et réécrits
proprement par moi, contenu par contenu, avant ce commit — chaque affirmation
qu'ils contiennent est tracée à une mesure de la section 2.

**Ce qui bloque** : rien de technique — la session s'arrête sur limite de
temps utilisateur, pas sur un blocage.

**Toute première action à la reprise** :
1. Vérifier que ce commit est bien poussé (`git log origin/master..HEAD` sur
   la branche, ou l'état de la PR si une PR a été ouverte).
2. Reprendre la comparaison marché (phase 3) **directement, sans déléguer à
   un agent en tâche de fond** — faire les conversions CloudConvert/
   FreeConvert/Smallpdf soi-même, séquentiellement, pour les 6 fichiers.
3. Puis : finir la section 5 (défauts chiffrés), créer
   `claude/plan-de-travail.md`, lancer le build/test local, pousser, déployer,
   et vérifier en production que les 3 pages déjà corrigées (et les 2 restant
   hors périmètre, à confirmer avec l'utilisateur) affichent le nouveau texte.
