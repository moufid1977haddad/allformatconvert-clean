# RAPPORT — Croissance, 29/09 (travail seul, en local)

## En bref — un point par ligne

| Point | État | Pourquoi |
|---|---|---|
| 1 — réserve Firefox du déploiement 2 (HTML, EPUB, MOBI → PDF) | **levée : le déploiement 2 est sûr sur ces 3 outils** | réponse vide **non reproduite** en 5 configurations ; route identique à la production ; aucun correctif de code nécessaire |
| 2 — kit Product Hunt | **prêt** (`docs/lancement/product-hunt.md`) | règles relues en direct, 4 lancements comparables et leur moyen, textes anglais, **galerie de 8 images 1270×760** depuis le build local |
| 3 — domaines référents | **24 cibles classées** (`docs/lancement/sources-de-liens.md`) | moyen des concurrents relevé ; suivi/nofollow **lu dans le HTML** ; textes prêts à coller ; rien soumis |
| 4 — pages qui peuvent se classer | **10 pages faites** sur `croissance-29-09` | demande réelle + concurrence battable + outil au niveau ; données structurées (le site n'en avait aucune) ; 60/60 contrôles ×3 moteurs |
| Trouvé en route | **2 défauts corrigés** (SQL to CSV) + **5 textes faux** corrigés | un INSERT multi-lignes perdait toutes ses lignes sauf la première, sans le dire |
| 5 — plan | **mis à jour** | P5 préparé, P10-P12 ajoutées, OBJECTIF (sources de liens), bloquant 1 (les 10 pages), P7 (réserve levée) |
| 6 — nettoyage | fait | aucun serveur, relais ni shell restant |

**Rien en production, rien poussé, aucune préversion, aucun compte, aucun envoi, aucune dépense.**

## Ce que toi seul dois faire, dans l'ordre

1. **Déploiement 2** (`licence-ameliorations`, P7) : me le demander dans ce terminal — préversion, fusion **sans poussée forcée** (repère de retour `restauration-avant-deploiement2-28-09` = `03f34e53`).
2. **Vérification sur www**, avec moi : 238 pages ×3, les suites, **Firefox sur HTML/EPUB/MOBI → PDF** (`scripts/browser-tests/html-pdf-response-probe.mjs`).
3. **Tests Safari 9 à 30** (`claude/tests-safari-proprietaire.md`), puis retest 1a, 1b, 1c, 1e (P1).
4. **Purge SQL** de `tool_errors` (P9).
5. **Décision Gotenberg** : 3 réplicas le jour du lancement, ≈ +16 $/mois tant qu'ils tournent (P8).
6. **Relecture du kit Product Hunt** : premier commentaire, passages ⟦…⟧ (P10).
7. **Soumissions de liens**, dans l'ordre de P11 (Show HN d'abord).
8. **Déploiement de `croissance-29-09`** après le déploiement 2, puis **demande d'indexation des 10 pages** (P12, liste au bloquant 1).

---

## 1. Réserve Firefox du déploiement 2 — diagnostic

**Le constat d'origine (28/09) :** à travers mon relais de test, sur la préversion `lwawb2a6h`, HTML, EPUB et MOBI vers PDF avaient rendu un fichier vide sous Firefox (7/10 outils corrects après 65 s), alors que Chromium et www allaient bien.

**Ce que j'ai mesuré** — nouvelle sonde `scripts/browser-tests/html-pdf-response-probe.mjs`, qui lit ce que **la page** reçoit de `/api/convert-html-to-pdf` (statut, taille, signature `%PDF-`), par une enveloppe de `fetch` (la lecture du corps par Playwright s'est révélée peu fiable : 0 octet sous Chromium alors que la page recevait bien le PDF) :

| Configuration | Firefox | Chromium | WebKit |
|---|---|---|---|
| www (production) | 3/3 : 200, 13 469 / 13 605 / 196 783 octets, `%PDF-` | 3/3 | 3/3 |
| build local de la branche, direct | 3/3 | 3/3 | — |
| build local, **à travers le relais** | 3/3 | 3/3 | — |
| **préversion `lwawb2a6h` à travers le relais** | 3/3 | 3/3 | — |
| **test d'origine rejoué à l'identique** (`download-ready.mjs`, 10 outils, 65 s d'attente, relais, préversion) | **10/10** | — | — |

**Code :** `app/api/convert-html-to-pdf/route.ts` est **identique** entre la production et la branche ; seule l'interface a changé (bouton « Download »). La route ne renvoie jamais de 204 ; elle refuse elle-même toute réponse de Gotenberg qui n'est pas un PDF.

**Conclusion :** l'échec du 28/09 **ne se reproduit dans aucune configuration**, y compris la sienne ; ce n'est pas le code. Je ne peux pas prouver sa cause exacte (un aléa du relais ou de la préversion à ce moment-là, non reproductible) — je ne l'affirme donc pas. **Le déploiement 2 est sûr sur ces 3 outils**, avec un filet déjà en place : depuis la nuit du 28/09, une réponse vide n'est plus jamais proposée comme un PDF de 0 octet (message d'échec à la place). Firefox sur ces 3 outils reste dans la vérification sur www.

## 2. Kit Product Hunt

Détail complet dans `docs/lancement/product-hunt.md`. L'essentiel :
- **Règles relues en direct** sur les deux pages officielles : tagline ≤ 60, description **500 (page de lancement) ou 260 (centre d'aide)** — toujours contradictoires, donc écrite en 227 ; galerie **1270 × 760**, au moins 2 images ; vignette **240 × 240**, < 3 Mo ; vidéo **YouTube seulement** ; lancement à **00 h 01 PT** ; pas de lien raccourci ni d'UTM ; ne jamais demander de votes.
- **Lancements comparables** : TabTasker (31/05/2026, n° 4, 236 points — le traitement local prouvé par l'onglet Réseau), 10015 Tools (n° 4, 307 points), IT Tools (n° 5, 144), CompressImage (n° 4, 254) ; une collection plafonne vers la 4ᵉ place ; une étude tierce de 50 lancements (6+ images, premier commentaire sincère, réponses à chaque commentaire).
- **Textes** : nom, tagline validée « 225 free tools. Most never upload your file. », description, topics, **premier commentaire** avec les passages personnels marqués ⟦…⟧, 8 légendes avec leur source.
- **Galerie** (`docs/lancement/galerie/`, script `galerie.mjs`) : 8 images 1270×760 + vignette. **Deux chiffres sont mesurés pendant la capture** : le nombre d'outils (compteur `/api/tool-counts` : 225) et la preuve « never upload » (Image Compressor : **0 requête d'envoi** pendant la compression — le script refuse d'écrire l'image si une requête transporte un corps). Les autres chiffres viennent chacun d'un rapport nommé. Photos de tiers écartées (provenance non documentée) : image de test fabriquée.

## 3. Domaines référents

Détail dans `docs/lancement/sources-de-liens.md`. **Méthode et limite :** la liste des domaines référents d'un concurrent n'est pas publique sans compte (Ahrefs public : ezgif DR 81, ≈ 11 000 domaines, sans la liste ; le vérificateur gratuit est derrière une vérification anti-robot, non contournée). J'ai donc retrouvé les pages qui lient les concurrents, par familles, et **lu l'attribut `rel` dans leur HTML** :
- **suivis** : guides de bibliothèques universitaires (UC San Diego → TinyWow, etc.) ; Hacker News **quand le sujet perce** (VERT, 601 points ; Convert.now, 4 points : nofollow) ;
- **nofollow** : GitHub, SaaSHub (**contrairement aux guides qui le disent « dofollow »**), Indie Hackers ;
- **non vérifiables** (bloqués aux robots) : AlternativeTo, Toolify, Fazier.

**Le moyen des concurrents :** des recommandations (bibliothécaires, presse — MakeUseOf sur VERT, le 20/05/2026), déclenchées par de la visibilité. D'où l'ordre : Show HN, bibliothécaires, presse, Reddit, puis fiches et annuaires. **24 cibles**, chacune avec valeur, suivi, compte, règles, délai et texte prêt à coller. Exclus : tout lien acheté, échangé, ou d'annuaire payant.

## 4. Les 10 pages

### Le choix — et ce qui a été écarté

Trois critères, dans cet ordre : **demande réelle** (suggestions Google relevées pour 22 requêtes candidates — toutes ont des variantes « converter / online » ; Search Console pour le pourcentage), **concurrence battable** (qui est en tête : pour les convertisseurs de données, de petits sites d'outils — DevToolLab, CodeShack, ConvertSimple, transform.tools — et non des sites à DR 77), **outil déjà au niveau** des pages en tête (règle « résultat ≥ concurrents » ; interdiction de toucher à un outil qui fonctionne).

| Page | Demande (suggestions / données) | En tête aujourd'hui | Pourquoi nous pouvons y être |
|---|---|---|---|
| percentage-calculator | **seule requête à intention réelle dans Search Console** ; « formula », « increase », « between two numbers », « difference » | Omni, Calculator Soup, Calculator.net (forts) | les 3 calculs de Calculator.net, résultats exacts ; page enrichie des formules et pièges qu'ils expliquent |
| csv-to-sql | « insert », « table », « converter » | TableConvert, CodeShack, ConvertCSV | types INTEGER/DECIMAL déduits, encodage Excel, 500 000 lignes |
| sql-to-csv | « converter online free », « file » | CodeShack, TableConvert, DevToolLab | **au niveau seulement après 2 correctifs du jour** (voir plus bas) |
| csv-to-json | « converter », « online » | ConvertCSV, CSVJSON | nombres typés sans perdre les zéros de tête, encodage Excel |
| toml-to-json / json-to-toml | « converter », « online », « python » | transform.tools, DevToolsDaily, petits sites | analyseur conforme (smol-toml), tables imbriquées, erreurs avec numéro de ligne |
| csv-to-tsv / tsv-to-csv | « converter online free », « excel » | Online CSV Tools, MConverter, petits sites | délimiteur et encodage détectés (CSV→TSV), guillemets justes |
| hash-generator | « sha256 checksum online » | petits outils spécialisés | **mesuré au-dessus** de la référence (17 algorithmes, 760 Mio en 11,7 s contre 31,8 s) |
| barcode-generator | forte demande (longue traîne par type) | TEC-IT et autres générateurs | **mesuré au-dessus** (102/102 codes relus contre 65/68) |

**Écartés :** `json-to-rust` (pas de structures imbriquées ni de snake_case, que JSONLint et transform.tools font), `json-to-php` (la requête dominante est « json to **php array** », l'outil ne produit qu'une classe), `env-to-json` (sans `export`, multi-lignes ni types, que Flavio Copes et DevToolLab gèrent). Les mettre en avant contredirait la règle ; ils demandent d'abord une amélioration du code.

### Ce qui a été fait sur chaque page

- **Titre et description** réécrits (mot-clé en tête, ≤ 60 caractères pour le titre, vrais) ;
- **FAQ** répondant aux questions réellement tapées (formule, entre deux nombres, différence, moteurs SQL, cellules vides, Cargo.toml…) ;
- un bloc **« Example »** : une entrée réelle et la sortie **que l'outil donne vraiment** ;
- un bloc **« Related tools »** (liens internes, 2 à 5 par page, chacun décrit d'après la page cible) ;
- **données structurées** WebApplication + BreadcrumbList + FAQPage — **le site n'en avait aucune** ; rendu par un composant serveur `app/components/ToolJsonLd.tsx`, selon la doc Next.js embarquée (script natif, `<` échappé) ;
- **une seule source par page** (`seo.js`) pour le titre, la description, la FAQ affichée et la FAQ balisée : elles ne peuvent plus diverger (Google exige que la FAQ balisée soit visible).
- `SeoContent` reçoit deux props **facultatives** : les 215 autres pages sont rendues exactement comme avant (238 pages vérifiées).

### Textes faux corrigés en route

| Page | Affirmé | Réalité (code) |
|---|---|---|
| csv-to-sql | « Every column is created as VARCHAR(255) » (FAQ et astuce) | colonnes entièrement numériques en INTEGER ou DECIMAL(18,6) depuis le 28/09 |
| percentage-calculator | « shown to 2 decimal places » | 10 chiffres significatifs depuis le 22/09 |
| csv-to-json (méta) | « parses pasted CSV text » | accepte aussi les fichiers |
| barcode-generator (méta) | « 35 barcode types » | 37 (le nombre vient maintenant de la liste de l'outil) |
| zip-extractor (méta) | « using JSZip », « a ZIP archive » | 7-Zip + zip.js, 40+ formats |

### Deux défauts réels de SQL to CSV — corrigés (`96b99f7b`, `0c798521`)

- **Un INSERT à plusieurs lignes ne gardait que la première, sans le dire.** Mesuré : `VALUES (1,'Ann'), (2,'Bob'), (3,'Cy')` → 1 ligne sur 3. C'est le format de mysqldump et de la plupart des exports. Aussi : noms entre accents graves (`` `users` ``) refusés (« No INSERT statements found »).
- **L'apostrophe échappée à la MySQL (`O\'Brien`) coupait la valeur en colonnes fausses.** Traitée, avec un garde-fou pour le SQL standard où la barre oblique reste littérale (`'C:\'`).
- Analyse sortie dans `sqlToCsv.js` (pure) ; **9 tests unitaires** (`scripts/sql-to-csv-tests/`). CodeShack, en tête, gère ces deux cas.

### Preuves

- `scripts/browser-tests/seo-pages-29-09.mjs` — pour chaque page : titre, description, canonique et **un** JSON-LD valide dans le **HTML brut** ; chaque question balisée **visible** sur la page ; **l'exemple repassé dans le vrai outil** et comparé à la sortie affichée ; chaque lien interne en 200 ; aucune erreur de page. **60/60 sous Chromium, Firefox et WebKit.** (Sorties réelles affichées à part pour 2 exemples : identiques.)
- **Validateur schema.org** (validator.schema.org) : **0 erreur, 0 avertissement** sur les 10 pages.
- **Non-régression** : construction complète réussie (seul avertissement : celui qui existait déjà) ; **238 pages** : Chromium 238/238, Firefox 238/238, WebKit 238/238 ; suite Barcode Generator complète : Chromium et Firefox ; tests unitaires CSV 30/30 et SQL 9/9.
- **Non refait :** la suite complète Hash Generator (elle exige un fichier > 700 Mio et une référence Python) — la logique de l'outil n'a pas changé, et les empreintes de l'exemple (« hello ») sont vérifiées dans l'outil sous les 3 moteurs.

**Aucune promesse chiffrée non mesurée** : chaque chiffre des pages vient du code (limites de lignes, types), d'un calcul vérifié dans l'outil, ou d'un rapport.

**Ce qui n'est pas prouvé et ne peut l'être qu'après déploiement :** l'effet sur le classement. Relever la position de ces 10 pages dans Search Console 4 à 6 semaines après l'indexation, avant d'en travailler d'autres.

## 5. Plan

`claude/plan-de-travail.md` : OBJECTIF (24 sources de liens au-delà de Product Hunt), bloquant 1 (les 10 pages et l'ordre d'indexation), LIGNE D'ARRIVÉE (P5 préparé ; **P10** relecture du premier commentaire ; **P11** soumissions de liens dans l'ordre ; **P12** déploiement de `croissance-29-09` après le déploiement 2 puis indexation), P7 (réserve Firefox levée).

## 6. Règles tenues, écarts

- Aucune poussée, aucune préversion créée, aucune mise en production, aucune fusion. `croissance-29-09` part de `licence-ameliorations` ; le seul commit sur `licence-ameliorations` est la sonde du point 1 (exception prévue).
- Aucun fichier d'environnement lu ni affiché : l'accès à la préversion a réutilisé un dossier de lien existant (identifiants de projet seulement) et le jeton a été obtenu en mémoire par `vercel env run`, jamais affiché.
- Aucun compte, aucun envoi, aucune dépense ; seul appel externe écrivant quelque chose : le validateur public schema.org (contenu public de nos pages).
- Aucune boucle de surveillance, aucun réveil planifié ; pas de sous-agent.
- **Écart assumé :** deux outils ont été modifiés (SQL to CSV) alors que la consigne était de ne toucher à aucun outil qui fonctionne : ils rendaient un résultat faux sans le dire, ce que la doctrine classe au-dessus d'une panne ; correctifs minimaux, testés.
