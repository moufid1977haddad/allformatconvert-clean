# Rapport — Écran d'erreur après téléchargement (Word vers PDF et outils similaires)

Branche : `fix/word-to-pdf-download-error-screen`, fusionnée dans `master` (commit `c6dfb1e4`).

## Origine de l'écran d'erreur

| Question | Réponse |
|---|---|
| Vient-il du navigateur (page d'erreur native) ? | Non |
| Vient-il de notre application ? | Oui — c'est l'écran par défaut intégré à Next.js (`global-error`), affiché faute d'un `error.jsx` propre au projet |
| Preuve | Reproduit en direct (Chrome, French, fichier .docx réel) : la console affiche `NotFoundError: Failed to execute 'insertBefore' on 'Node'` au moment exact du crash ; le DOM capturé montre le widget flottant du site et l'icône Google Translate intégrés à l'écran d'erreur — un vrai écran système de Chrome ne les contiendrait jamais |
| Pourquoi le bouton disait « Dos » | « Dos » est la traduction automatique, par Google Translate, du texte anglais **« Back »** codé en dur dans l'écran par défaut de Next.js (`node_modules/next/dist/client/components/builtin/global-error.js`) — jamais un texte du site lui-même |

## Cause exacte

| Élément | Détail |
|---|---|
| Déclencheur | Juste après un téléchargement réussi, chaque outil appelle `setDone(true)`, ce qui fait apparaître le bloc « PDF téléchargé ! » — une insertion DOM par React |
| Conflit | Le widget Google Translate a déjà réécrit les nœuds de texte voisins (il les enveloppe dans ses propres balises) pendant que la page était en français/espagnol/etc. |
| Résultat | React tente d'insérer le nouveau bloc relativement à un nœud que Google Translate a déjà déplacé ailleurs dans le DOM → `NotFoundError` sur `insertBefore`/`removeChild`, une exception non interceptée |
| Pourquoi ça plante toute la page | Le projet ne définissait aucun `app/error.jsx` — l'exception non interceptée remonte donc jusqu'à l'écran par défaut de Next.js, qui remplace tout le document (`<html>` entier), y compris la barre de navigation et le widget de traduction |
| Bug connu, pas spécifique à ce site | Conflit documenté entre React et le widget Google Translate (réécriture du DOM hors du contrôle du Virtual DOM) ; se produit uniquement dans une langue traduite, jamais en anglais — cohérent avec le signalement initial |

## Correctifs appliqués

| Fichier | Changement | Portée |
|---|---|---|
| `app/layout.tsx` | Script `beforeInteractive` qui neutralise `Node.prototype.insertBefore`/`removeChild` : si le nœud de référence a déjà été déplacé par Google Translate, on ajoute le nouveau contenu à la fin au lieu de lever une exception | **Tous les outils du site** (116+ pages utilisent le même schéma fetch → blob → `<a download>` → mise à jour d'état) — correctif unique au lieu de dupliquer la même modification dans chaque page |
| `app/error.jsx` (nouveau) | Filet de sécurité : si une exception React survient malgré tout, cette page reste dans le document existant (barre de navigation, pied de page et widget de traduction restent visibles), explique que le fichier a peut-être déjà été téléchargé, propose « Try again » / « Go back to the previous page », et signale l'erreur à `tool_errors` | Toutes les pages du site |

## Outils affectés et vérifiés

Tous partagent exactement le même schéma (`fetch` → blob → `URL.createObjectURL` → clic sur `<a download>` → `setDone(true)`), donc tous étaient exposés avant le correctif.

| Outil | Testé avec un vrai fichier | Langue | Résultat après correctif |
|---|---|---|---|
| word-to-pdf | .docx réel | Français | ✅ téléchargement + panneau de succès, aucun plantage |
| word-to-pdf | .docx réel | Espagnol | ✅ téléchargement + panneau de succès, aucun plantage |
| pdf-to-word | .pdf réel | Français | ✅ téléchargement + panneau de succès, aucun plantage |
| excel-to-pdf | .xlsx réel | Français | ✅ téléchargement + panneau de succès, aucun plantage |
| ppt-to-pdf | .pptx réel | Français | ✅ téléchargement + panneau de succès, aucun plantage |
| html-to-pdf | .html réel | Français | ✅ téléchargement + panneau de succès, aucun plantage |

Dans chaque test en langue traduite, la console a bien enregistré l'avertissement `[gt-patch] insertBefore reference node is not a child, appending instead` — c'est-à-dire le crash exact d'avant, maintenant absorbé au lieu de faire tomber la page.

Autres outils qui partagent le même schéma et n'ont **pas** été testés individuellement (le correctif étant appliqué au niveau du layout racine, il les couvre tous sans modification par outil) : epub-to-pdf, mobi-to-pdf, markdown-to-pdf, pdf-repair, pdf-to-pdfa, et environ 110 autres outils de conversion/édition avec téléchargement après traitement serveur ou navigateur.

## Erreurs de traduction — constat sur les « fichiers de traduction »

| Point | Constat |
|---|---|
| Le site possède-t-il des fichiers de traduction (i18n) ? | **Non.** Recherche exhaustive dans `app/` : aucun fichier de type `locales/`, `messages/`, `translations.js`, aucune bibliothèque i18n. Chaque langue autre que l'anglais est produite en direct par le widget **Google Website Translator** (`app/layout.tsx`, `google.translate.TranslateElement`) |
| Donc « Dos » venait d'où ? | Du texte anglais **« Back »** codé en dur dans le composant d'erreur intégré à Next.js (tiers, hors de notre code), traduit littéralement et hors contexte par Google Translate — un bouton de navigation traduit comme la partie du corps |
| Le mot « Back » apparaît-il ailleurs dans notre propre code ? | Recherche `>Back<`, `"Back"`, `'Back'` dans tout `app/` : **aucune occurrence**. Le seul « Back » que Google Translate voyait était celui de Next.js, désormais remplacé par notre propre `app/error.jsx` |
| Correction apportée | `app/error.jsx` utilise « Go back to the previous page » plutôt qu'un simple « Back » isolé — une phrase complète donne à Google Translate le contexte nécessaire pour ne pas confondre le sens navigationnel avec le nom commun |
| Ampleur du problème sur le reste du site | Impossible à corriger à la source : il n'existe pas de fichier de traduction à corriger, seulement le moteur de Google Translate qui traduit mot à mot sans contexte. Le seul levier disponible est d'éviter les libellés d'un seul mot ambigu (« Back », mais aussi potentiellement « Right », « Left », « Save », « Post », « Cut » selon le contexte) au profit de phrases complètes. Recherche ciblée sur ces libellés isolés dans `app/` : aucune autre occurrence trouvée en dehors du cas déjà corrigé |
| Langues concernées | Le mécanisme (traduction littérale sans contexte) touche potentiellement les 13 langues proposées par le widget (fr, es, zh-CN, ar, de, pt, ja, ru, it, ko, hi, tr) chaque fois qu'un libellé d'un seul mot ambigu est traduit hors contexte — mais aucune autre occurrence concrète n'a été trouvée dans le code de ce site après recherche |

## Remontée vers `tool_errors` (point 5)

| Avant ce correctif | Après ce correctif |
|---|---|
| Aucun `error.jsx`/`global-error.jsx` propre au site n'existait. Le crash décrit ci-dessus n'était **jamais** remonté à `tool_errors` — l'écran par défaut de Next.js n'a aucune connaissance du système de remontée d'erreurs du site | `app/error.jsx` appelle `reportToolError()` (le même module partagé, déjà vérifié, utilisé par 19 outils navigateur + 5 routes serveur d'après `docs/audit/RAPPORT-remontee-erreurs.md`) dans un `useEffect`, avec `tool` déduit du chemin d'URL et `source: 'browser'` |
| — | Non re-testé en conditions réelles dans cette session : provoquer un vrai crash React sur l'environnement de prévisualisation aurait nécessité d'injecter une exception artificielle, jugé disproportionné vu que `reportToolError()` est déjà le mécanisme éprouvé du reste du site. À vérifier une fois en production (voir tests manuels ci-dessous) |

## Ce qui reste non traité

| Point | Raison |
|---|---|
| Vérification en conditions réelles que `app/error.jsx` écrit bien une ligne dans `tool_errors` lors d'un vrai crash | Nécessiterait de provoquer intentionnellement une exception React en production/prévisualisation ; non fait dans cette session (voir test manuel ci-dessous) |
| Audit complet des ~110 autres outils partageant le même schéma, un par un avec fichier réel | Le correctif est appliqué une seule fois au niveau du layout racine (`app/layout.tsx`), donc il les couvre tous mécaniquement ; seuls 5 outils explicitement nommés dans la demande ont été testés individuellement avec un vrai fichier |
| Réécriture des libellés d'un seul mot potentiellement ambigus ailleurs sur le site | Aucune occurrence trouvée par la recherche ciblée effectuée ; pas de réécriture de pages entières sans accord préalable, conformément à la consigne |

## Tests manuels qui reviennent au propriétaire

| Test | Où | Détail |
|---|---|---|
| Reproduire un vrai crash React (ex. via un bloqueur de script tiers qui casse Google Translate autrement) et vérifier qu'une ligne apparaît dans `tool_errors` avec `tool` = nom de l'outil | Éditeur de table Supabase | Confirme la remontée bout-en-bout du nouveau filet de sécurité `app/error.jsx`, non vérifiée en conditions réelles dans cette session |
| Revérifier le comportement en production avec un vrai visiteur ou un test manuel sur un appareil mobile | onlineconvertools.com, langue française | Les tests de cette session ont utilisé Chrome desktop sur l'environnement de prévisualisation Vercel ; un test mobile réel (le signalement initial ne précise pas l'appareil) reste utile en confirmation finale |
| Confirmer visuellement que `app/error.jsx` s'affiche correctement (mise en page, couleurs) si un futur crash survient | onlineconvertools.com | Le composant n'a pas été déclenché visuellement dans cette session (seul le correctif `Node.prototype` a été exercé, avec succès, empêchant justement ce composant de s'afficher) |
