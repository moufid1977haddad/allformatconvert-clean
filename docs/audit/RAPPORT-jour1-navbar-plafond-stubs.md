# Jour 1 — navbar, plafond pdf-translate, chiffrage des stubs

Date : 2026-09-11

---

## Tâche 1 — Le débordement de la navbar existe-t-il encore ?

**Non. Le bloquant est clos, aucun code n'a été modifié.**

Mesure sur la production (`https://www.onlineconvertools.com`) avec un vrai navigateur piloté localement (iframe même-origine réinjectée dans un onglet réel — technique qui contourne la limite connue de `resize_window`/l'émulateur d'appareil sur ce poste, cf. mémoire de session), lecture de `scrollWidth`/`clientWidth` réellement calculés par le moteur de rendu, jamais du CSS source :

| Largeur demandée | Largeur de viewport réelle (scrollbar déduite) | `scrollWidth − clientWidth` de la barre | idem `<header>` | idem `document` | idem les 3 enfants directs (logo, nav catégories, contrôles droits) |
|---|---|---|---|---|---|
| 1024 | 1009 | 0 | 0 | 0 | 0 / 0 / 0 |
| 1100 | 1085 | 0 | 0 | 0 | 0 / 0 / 0 |
| 1200 | 1185 | 0 | 0 | 0 | 0 / 0 / 0 |
| 1280 | 1265 | 0 | 0 | 0 | 0 / 0 / 0 |
| 1360 | 1345 | 0 | 0 | 0 | 0 / 0 / 0 |
| 1393 | 1378 | 0 | 0 | 0 | 0 / 0 / 0 |
| 1440 | 1425 | 0 | 0 | 0 | 0 / 0 / 0 |
| 1536 | 1521 | 0 | 0 | 0 | 0 / 0 / 0 |

L'écart constant de 15 px entre la largeur demandée et le `clientWidth` réel correspond exactement à la marge de référence -14/-15 px déjà documentée et acceptée sur ce projet (barre de défilement verticale du système) — confirme que la méthode de mesure est cohérente avec les sessions précédentes, pas un artefact de la technique.

**Zéro débordement horizontal, aux 8 largeurs demandées, sur la barre elle-même, sur `<header>`, sur `<html>`, et sur chacun des 3 enfants directs.** Une capture d'écran à 1393 px (la largeur historiquement signalée) confirme visuellement : logo, icônes de catégorie, recherche, sélecteur de langue, bouton mode sombre et bouton « Sign In » tiennent tous avec une marge visible, sans coupure ni barre de défilement horizontale.

Conclusion : les refontes successives depuis le 15 août (icônes lucide-react, menu hamburger mobile, wordmark Poppins) ont fait disparaître le débordement sans qu'aucun ticket ne l'ait explicitement refermé. Rien à corriger.

---

## Tâche 2 — Déclarer le plafond de pdf-translate

**Fait.** La limite (5 pages / 3 000 caractères) n'a été ni levée, ni contournée, ni rendue configurable — seuls les deux nombres déjà codés en dur (`5` et `3000`) ont été nommés en constantes locales au fichier (`MAX_PDF_TRANSLATE_PAGES`, `MAX_PDF_TRANSLATE_CHARS`) pour éviter que la nouvelle mention à l'écran ne dérive silencieusement de la logique d'extraction si l'un des deux nombres change un jour.

**Motif trouvé et reproduit à l'identique** : `app/tools/audio-tools/audio-to-text/page.jsx` déclare son plafond de 10 Mo par un `<p className="text-neutral-400 text-xs text-center -mt-2">` placé immédiatement après la zone de dépôt de fichier et avant l'`<input>` caché, avec la formulation « Max X — a hard cap to keep [raison] cost-effective and free for everyone. » — vérifié qu'il s'agit bien du même motif utilisé pour un plafond de coût délibéré sur ce projet (vague 3 de l'audit de fiabilité), pas un composant réinventé pour l'occasion.

Reproduction sur `app/tools/pdf-tools/pdf-translate/page.jsx`, même classe CSS, même position (juste après la zone de dépôt, avant l'`<input>` caché), même ton :
> « Max 5 pages / 3,000 characters translated — a hard cap to keep translation cost-effective and free for everyone. »

Le plafond est maintenant visible **avant** la sélection du fichier, pas seulement dans la FAQ en bas de page (qui existait déjà et reste inchangée). Vérifié dans le HTML généré par `next build` : la ligne est bien présente, statiquement rendue.

---

## Tâche 3 — Chiffrage du retrait des 3 stubs (rien retiré)

### Où ils apparaissent aujourd'hui

Les trois pages (`pdf-to-excel`, `pdf-to-ppt`, `image-generator`) affichent chacune un vrai écran « Coming Soon » (60 à 64 lignes de JSX chacune, vérifié — ce ne sont pas des pages cassées, l'utilisateur qui clique dessus comprend immédiatement que l'outil n'est pas prêt) :

| Surface | Présent ? | Détail |
|---|---|---|
| Page d'accueil (vue par défaut, « outils tendance ») | Non | Les 6 liens vedettes du HTML brut de l'accueil n'incluent aucun des 3 stubs |
| Recherche interne de la page d'accueil | **Oui** | `app/page.jsx` filtre `ALL_TOOLS` (import de `app/lib/toolsRegistry.js`) — les 3 stubs y figurent comme des entrées normales, indiscernables des 225 outils réels dans les résultats de recherche |
| Barre de recherche de la navbar | **Oui** | Second tableau `allTools`, propre à `app/components/Navbar.jsx`, distinct de `toolsRegistry.js` — les 3 stubs y figurent aussi |
| Méga-menu déroulant de la navbar (survol) | **Oui** | Même fichier, mais ce menu n'est rendu qu'après un événement `onMouseEnter` (cf. `RAPPORT-indexation.md` §4) — invisible à un crawler, visible à un visiteur humain qui survole |
| Pages de catégorie (`/tools/pdf-tools`, `/tools/ai-tools`) | **Oui** | Grille d'outils rendue côté serveur, cliquable — un visiteur qui parcourt la catégorie PDF ou IA voit et peut cliquer sur le stub |
| `/tools` (plan des catégories) | Non | Ne liste que les 12 catégories, aucun nom d'outil individuel |
| `sitemap.xml` | Non | Exclu depuis le 31 août via `robots: { index: false }` dans chaque `layout.tsx`, filtré par `app/sitemap.ts` |
| Redirection historique | Seulement `image-generator` | `lib/legacyRedirects.ts` ligne 80 : `/tools/image-generator` → `/tools/ai-tools/image-generator` (301) |

### Coût d'un retrait du menu (navigation + recherche + grille de catégorie), pages conservées telles quelles

| Fichier | Lignes touchées | Nature |
|---|---|---|
| `app/components/Navbar.jsx` | 6 (2 par outil : entrée méga-menu + entrée `allTools`) | Suppressions simples, une ligne = une entrée |
| `app/lib/toolIcons.js` | 8 (icône + couleur de texte + couleur de fond par outil, sauf 2 lignes partagées) | **2 des 8 lignes sont partagées avec de vrais outils** : la ligne d'icônes de `pdf-to-excel`/`pdf-to-ppt` porte aussi `ppt-to-pdf` (outil réel, livré) sur la même ligne ; celle d'`image-generator` porte aussi `text-summarizer` et `ai-translator` (réels). Modification chirurgicale d'une ligne, pas suppression franche — risque d'erreur si mal fait |
| `app/lib/toolsRegistry.js` | 3 (1 par outil) | Suppressions simples |
| `app/tools/pdf-tools/page.jsx` | 2 (pdf-to-excel, pdf-to-ppt) | Suppressions simples dans la grille de la catégorie |
| `app/tools/ai-tools/page.jsx` | 1 (image-generator) | Suppression simple dans la grille de la catégorie |
| **Total** | **20 lignes, 5 fichiers** | dont 2 lignes à risque de casse d'un outil réel si l'édition est imprécise |

**Risque de lien interne cassé** : nul pour `pdf-to-excel`/`pdf-to-ppt` (aucune redirection ne pointe vers eux). Pour `image-generator` : nul tant que la page elle-même n'est pas supprimée — la redirection legacy (`/tools/image-generator` → `/tools/ai-tools/image-generator`) reste valide puisque sa destination existe toujours, juste non liée depuis le menu.

**Risque de page orpheline : réel et certain.** Un retrait du menu + de la recherche + de la grille de catégorie, cumulé à l'absence déjà actée du sitemap, ferait de chacune des 3 pages une **page orpheline au sens strict** : plus aucun lien interne entrant nulle part sur le site, uniquement accessible par une URL tapée directement, un ancien favori, ou (pour `image-generator` seul) la redirection legacy. C'est le compromis exact que le propriétaire doit trancher : masquer la promesse « Coming Soon » aux visiteurs qui naviguent normalement, au prix de rendre la page injoignable autrement que par accident.

**Coût additionnel si les pages elles-mêmes sont aussi supprimées** (au-delà du simple retrait du menu, non demandé ici mais à anticiper) : suppression de `page.jsx` + `layout.tsx` par outil (≈ 75-85 lignes en moins par outil), et pour `image-generator` uniquement, la ligne 80 de `lib/legacyRedirects.ts` cesserait de pointer vers une page existante — un visiteur suivant un ancien favori ou un backlink vers `/tools/image-generator` recevrait alors un 404 silencieux là où il obtient aujourd'hui une redirection propre vers une page « Coming Soon » explicite. Ce cas ne se produit pas si on se limite au retrait du menu (page conservée).

`create-ai-tools.js` (racine du dépôt, référence `image-generator` ligne 10) est un script de génération ponctuel déjà exécuté historiquement, jamais importé par l'application ni le build — non concerné par un retrait, mentionné pour être complet.

### Cohérence noindex / sitemap aujourd'hui

**Toujours cohérente.** Les trois pages affichent aujourd'hui, sans exception, un état « Coming Soon » réel et honnête (vérifié dans le JSX de chacune) — rien n'a été livré derrière depuis leur mise en noindex le 31 août qui rendrait cette exclusion obsolète. Le noindex empêche justement Google d'indexer une page sans contenu fonctionnel, et l'absence du sitemap en découle logiquement (`app/sitemap.ts` filtre déjà sur ce `robots.index`) — aucune incohérence à signaler, aucune action requise sur ce point.

---

## Récapitulatif chiffré

| Tâche | Résultat | Action de code |
|---|---|---|
| 1. Débordement navbar | 0 px de débordement aux 8 largeurs testées (1024–1536) | Aucune — bloquant clos |
| 2. Plafond pdf-translate | Plafond (5 pages / 3 000 caractères) désormais annoncé avant sélection, ni levé ni configurable | 1 fichier modifié, motif audio-to-text reproduit à l'identique |
| 3. Retrait des 3 stubs | 5 fichiers, 20 lignes, risque de page orpheline certain si fait sans compensation, cohérence noindex/sitemap confirmée intacte | Aucune — chiffrage seul, rien retiré |
