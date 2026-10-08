# RAPPORT P38-0 — préparation du site en français, espagnol et arabe (08/10/2026)

Lecture seule : aucun fichier du site modifié, aucun build, aucune préversion, aucun déploiement. Aucun sous-agent.
Branche `p38-0` (base `bf930c88`, production P37). Livrable : `docs/audit/PLAN-I18N-P38.md`.

## Ce qui a été fait

| Point demandé | Résultat | Où |
|---|---|---|
| 1. Volume réel | script `scripts/p38/i18n-volume.mjs` (compilateur TypeScript, texte JSX + chaînes de texte + libellés) ; contrôlé chaîne par chaîne sur `pdf-merge` (± 5 %). Socle complet 134 499 car. ; 225 outils 869 447 car. ; **socle minimal + 20 outils 193 883 car. / 34 777 mots par langue** ; tout le site 1 003 946 car. / 180 643 mots | plan § 1, `docs/audit/p38/volume-i18n.json` |
| 2. Les 20 outils | 13 PDF + image-compressor, background-remover, image-resizer, qr-generator, video-to-audio, video-compressor, video-to-gif ; chaque choix sourcé : sitemaps iLovePDF / Smallpdf / PDF24 / CloudConvert, 41 relevés de suggestions Google fr / es / ar, accueil et liens entrants | plan § 2, `docs/audit/p38/suggestions-08-10.json` |
| 3. Marché | sous-répertoires partout ; adresses traduites en fr / es et **anglaises en arabe** chez les trois ; hreflang dans le sitemap (Smallpdf, PDF24), aucun chez iLovePDF ; `dir="rtl"` serveur chez iLovePDF et PDF24, pas chez Smallpdf ; **chiffres occidentaux** en arabe chez les trois ; CloudConvert anglais seul | plan § 3 |
| 4. Architecture | deux racines par groupes de routes (`app/(en)/`, `app/(intl)/[lang]/`), adresses traduites à plat, dictionnaires JS par langue (pluriels arabes à 6 formes), hreflang HTML + sitemaps par langue depuis une seule table, RTL par classes logiques Tailwind v4 (3 509 classes physiques dans `app/`, ≈ 1 000 à changer pour le périmètre), widget absent de `(intl)` ; 10 risques et ordre des étapes | plan § 4 |
| 5. Coûts | Google NMT 1,63 $ (socle + 20, 3 langues), DeepL ≈ 20 $ ; tout le site 50-81 $ ; relecture espagnole 1 391-4 869 $ (courant 2 434-3 478 $) ; propriétaire ≈ 23-35 h par langue | plan § 5 |
| 6. Découpage | 7 lots (P38-1 à P38-7), relecteur seulement aux points hreflang/pluriels, RTL, audit | plan § 6 |

## Ce qu'il faut savoir

- **Le lot le plus risqué est le premier** : déplacer tout l'existant dans `app/(en)/` (498 imports relatifs à remplacer) ;
  il ne change rien de visible et se prouve par l'égalité du texte rendu des 243 pages.
- **Le goulot est la relecture humaine**, pas la machine : ≈ 35 000 mots par langue.
- Le tarif officiel de l'API DeepL n'a pas pu être lu (la page redirige vers les offres « Translator ») : chiffre de sources
  secondaires, à confirmer dans la console DeepL.
- Pas de données de trafic par outil dans le dépôt (Search Console non relevée) : le « poids » repose sur l'accueil et les liens.
- Écarts relevés hors P38 : pas d'OCR d'image (« image en texte », très demandé dans les 3 langues), pas de convertisseur de
  dates hégire / grégorien (très demandé en arabe).
- `app/api/` n'est pas compté : ses messages d'erreur affichés tels quels seront inventoriés au lot 1.

## Décisions du propriétaire

P38-D1 adresses (`/fr/fusionner-pdf`, `/ar/merge-pdf`) ; P38-D2 chiffres occidentaux en arabe ; P38-D3 service et clé de
traduction (DeepL ou Google, clé gardée par le propriétaire) ; P38-D4 relecteur espagnol et budget ; P38-D5 liste des
20 outils ; P38-D6 comptes et 6 catégories restantes en anglais au début. Détail : plan § 7.

## Fichiers

`docs/audit/PLAN-I18N-P38.md`, `docs/audit/p38/volume-i18n.json`, `docs/audit/p38/suggestions-08-10.json`,
`scripts/p38/i18n-volume.mjs`, `claude/plan-de-travail.md` (section P38, début après le 11/10 à 18 h), ce rapport.
