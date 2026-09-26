# RAPPORT — Amélioration 16 : convertisseur d'unités et convertisseur de couleurs

**Date :** 26 septembre 2026 · **Branche :** `licence-ameliorations` · **État :** **prête pour la préversion** (local, Chromium + Firefox). Non déployée (consigne d'absence du propriétaire).

## 0. En une table

| Point | Verdict | Preuve |
|---|---|---|
| Catégories manquantes (Temps, Données, Pression, Énergie) | ✅ ajoutées, plus **Puissance** : 11 catégories | §2 |
| Exactitude face à unitconverters.net, mêmes 11 conversions | ❌→✅ à 10 chiffres, **nous moins précis sur 6** (ils en affichent 11) → **12 chiffres** : **au moins aussi exacts sur les 11, plus exacts sur 5** | §3 |
| Saisie invalide (`abc`, vide) | ❌→✅ affichait un résultat pour 0 ; maintenant message, pas de résultat ; `1e3`, `-12,5` acceptés ; sous le zéro absolu signalé | §2 |
| HSV, CMYK | ✅ ajoutés, modifiables comme les autres ; **CMYK identique à RapidTables sur 7 couleurs sur 7** | §4 |
| HEX invalide | ❌→✅ laissait l'ancienne couleur sans un mot ; maintenant message, la dernière couleur valide reste affichée | §4 |
| Suites | ✅ `scripts/browser-tests/unit-color-converter.mjs` : **Chromium 30/30, Firefox 30/30** (build de production) | §5 |

## 1. Les références (lues le 26/09)

- **unitconverters.net** — catégories « courantes » : longueur, masse, volume, température, surface, **pression, énergie**, puissance, force, **temps**, vitesse, angle, consommation, **stockage de données**… ; une paire De/Vers (comme nous) ; facteurs listés (1 atm = 101325 Pa) ; résultats à 11 chiffres significatifs.
- **RapidTables** — HEX, RGB, HSL, **HSV**, **CMYK** ; ColorHexa (403 à la lecture automatique) montre les mêmes espaces et plus (Lab, XYZ…).

## 2. Convertisseur d'unités — ce qui a été fait

- **Temps** (s, ms, µs, ns, min, h, jour, semaine, mois moyen, année grégorienne 365,2425 j), **Données** (bit, octet, kB/MB/GB/TB/PB décimaux, KiB/MiB/GiB/TiB binaires, kbit/Mbit/Gbit), **Pression** (Pa, kPa, MPa, bar, mbar, atm, psi, mmHg, inHg, torr), **Énergie** (J, kJ, MJ, Wh, kWh, cal, kcal, BTU, eV, ft·lbf), **Puissance** (W, kW, MW, hp, hp métrique, BTU/h, kcal/h).
- Facteurs = **définitions** (SI, NIST SP 811) écrites dans le code : psi = 0,45359237 kg × 9,80665 / 0,0254² m², mmHg conventionnel = 13,5951 × 9,80665 Pa, calorie thermochimique = 4,184 J, BTU IT = 1055,05585262 J, eV = 1,602176634e-19 J (exact depuis 2019), cheval-vapeur = 550 ft·lbf/s, cheval métrique = 75 kgf·m/s.
- Le facteur pour une unité est affiché sous le résultat (« 1 atm = 14,6959487755 psi »), comme chez la référence.
- Saisie gardée telle quelle : un champ numérique changeait `""` et `-` en 0 et affichait un résultat. Virgule décimale acceptée. Notation scientifique pour les très grands et très petits résultats.
- FAQ corrigée : elle annonçait « 4 decimal places », faux depuis le 22/09.

## 3. Exactitude face à unitconverters.net (mêmes valeurs tapées sur les deux pages ; valeur attendue calculée dans le test à partir des définitions)

| Conversion | Attendu | Nous (12 chiffres) | unitconverters.net |
|---|---|---|---|
| 1 atm → psi | 14,69594877551… | 14,6959487755 (9e-13) | 14,695948775 (3,5e-11) |
| 1 mmHg → Pa | 133,322387415 | **133,322387415 (0)** | 133,322 (**2,9e-6**) |
| 2,5 bar → psi | 36,2594344325… | 36,2594344326 (1,3e-12) | 36,259434433 (1,2e-11) |
| 1 kWh → BTU | 3412,14163312… | 3412,14163313 (6e-13) | 3412,1416331 (8,2e-12) |
| 1 eV → kWh | 4,45049065e-26 | **4,45049065e-26 (0)** | 4,450490649E-26 (2,2e-10) |
| 250 kcal → kJ | 1046 | 1046 | 1046 |
| 1 hp → W | 745,699871582… | 745,699871582 (4e-13) | 745,69987158 (3e-12) |
| 100 kW → hp métrique | 135,962161730… | 135,96216173 (2,9e-12) | 135,96216173 (2,9e-12) |
| 1 année → jours | 365,2425 (grégorienne) | 365,2425 | **365,25** (année julienne) |
| 1 semaine → min | 10080 | 10080 | 10080 |
| 1 mile → m | 1609,344 | 1609,344 | 1609,344 |

Entre parenthèses : écart relatif. **Premier passage à 10 chiffres** : nous moins précis qu'eux sur 6 lignes (ex. 1 atm → psi, 3,1e-10 contre 3,5e-11) → **moyen adopté** : afficher plus de chiffres (12, les facteurs étant exacts) → écart ≤ 3e-12 partout.

## 4. Convertisseur de couleurs

- **HSV/HSB** et **CMYK** ajoutés, modifiables (taper C=100 M=0 J=0 N=0 donne #00ffff, H=120 S=100 V=100 donne #00ff00), chacun avec son bouton Copier. CMYK = formule standard (K = 1 − max(R,V,B)), dite telle dans la FAQ (pas un profil d'imprimante).
- HEX à 3 ou 6 chiffres, avec ou sans `#` ; invalide → message, la dernière couleur valide reste affichée.
- **Face à RapidTables**, 7 couleurs (#3b82f6, #ff0000, #00ff7f, #808080, #000000, #123456, #7f7f80) : CMYK **identique 7/7**. HSV comparé à la formule indépendante du test seulement : la page RVB→HSV de RapidTables, pilotée de la même façon, répondait V = 100 % pour #808080 (ses champs HEX et R/V/B interagissent) — non retenue comme référence.

## 5. Suites

`scripts/browser-tests/unit-color-converter.mjs <origine> [--browser=firefox] [--refs]` : 14 conversions à 12 chiffres contre les définitions, 4 saisies (dont refus), zéro absolu, 7 couleurs en HSL/HSV/CMYK contre des formules écrites dans le test, HEX invalide, HEX court, saisie CMYK et HSV. **Build de production locale : Chromium 30/30, Firefox 30/30.**

## 6. Non fait / à décider

- Pas d'alpha (RGBA/HSLA), pas de noms CSS, pas de Lab/XYZ (ColorHexa les a ; RapidTables non) — non demandés par le plan.
- Moins d'unités par catégorie qu'unitconverters.net (57 unités de pression chez eux) : les unités courantes seulement.
