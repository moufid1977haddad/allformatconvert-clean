# Plan de travail

> Document unique de suivi des tâches. Il n'existait pas dans le dépôt avant le
> 2026-09-19 ; créé pendant le chantier de fidélité Office → PDF. Aucun autre
> document de tâches ne doit être créé : mettre à jour celui-ci.
> Les décisions de fond sont dans les rapports `docs/audit/RAPPORT-*.md`.

## Chantier fidélité Office → PDF (branche `audit-fidelite-office-pdf`)

Rapport : `docs/audit/RAPPORT-fidelite-office.md`.

| Étape | État |
|---|---|
| 0. Réconciliation Railway | Fait (2026-09-18) |
| 1. Corpus de 6 fixtures | Fait |
| 2. Mesure via la production | Fait ; 06 requalifié en « dégradé » (2026-09-19) |
| 3. Comparaison marché | Fait, **partielle** : FreeConvert + Online2PDF ; CloudConvert bloqué (quota 10/jour), iLovePDF non téléchargeable en automatisation |
| 4. Promesses des 5 outils (word/excel/ppt-to-pdf, pdf-to-word, html-to-pdf) | Fait : chaque phrase (page, SeoContent, title/description SEO) tracée à une mesure |
| 5. Défauts chiffrés | Fait (D1–D8 dans le rapport) |
| Déploiement | Voir la fin du rapport (section 7) |

## À faire — nécessite une décision de l'utilisateur

Aucune de ces actions n'a été faite : elles touchent le code, l'infrastructure
ou la politique produit.

1. **D1 (priorité 1)** — police du gras dans Excel → PDF (Caladea au lieu de
   Carlito). Piste : règle fontconfig « Calibri » dans
   `services/gotenberg/fonts.conf`, hypothèse à vérifier ; passage par le
   déploiement bleu/vert de `RAPPORT-gotenberg-versionne.md` ; retester 03/04 ;
   retirer ensuite la divulgation « bold serif » des pages excel-to-pdf.
2. **D2 (priorité 2)** — Segoe UI absente : titre replié et masqué (06). Piste :
   police métriquement compatible (Selawik à évaluer), **licence à vérifier**
   avant ajout ; retester 06 ; alléger la divulgation de ppt-to-pdf.
3. **D7** — mesurer le repli `.docx` → LibreOffice et les formats non mesurés
   (`.doc .xls .ppt .csv .ods`) avant toute coupure de `CONVERTAPI_ENABLED`.
4. **D6** — repli silencieux de `pdf-to-word` vers l'extraction de texte brut si
   `PDF_TO_WORD_CONVERTAPI_ENABLED` est coupé : message visible ou retrait du repli.
5. **D8** — limites (25 Mo, 5 conversions/utilisateur par défaut, 10/h et 30/jour
   par IP) plus strictes que les concurrents gratuits testés : décision produit.
6. **Railway** — supprimer `gotenberg-fonts` (~2 $/mois, aucun trafic réel) :
   décision de l'utilisateur ; envisager la veille Serverless de `pdf-tools`
   (actif 24h/24 pour deux outils « Coming Soon »).
7. Compléter la comparaison marché avec un troisième convertisseur exploitable
   (CloudConvert demain, quand son quota se réinitialise, en manuel) si le
   critère « trois concurrents » doit être tenu.
8. Supprimer à la main `Downloads\fidelite-01..06.pdf` (verrouillés par Chrome).

## Règles permanentes de ce chantier

- Aucun agent de fond pour le travail navigateur (un agent a réécrit 3 pages
  sans autorisation le 2026-09-18).
- Aucune promesse de fidélité sans mesure écrite dans le rapport ; aucun
  « professional-quality » ni comparaison non mesurée.
- Ne jamais supprimer ni renommer un outil sans accord explicite.
- Jamais `.env`/`.env.local` ni sortie pouvant contenir un secret ; aucune valeur
  de repli silencieuse en production ; aucune boucle de surveillance.
