# Plan de travail — chantier fidélité Office → PDF

> ## ⚠ ATTENTION — ce fichier n'est PAS le document de pilotage du projet
>
> Le document de pilotage décrit par l'utilisateur (RÈGLE ZÉRO, liste des
> bloquants, interdits permanents, trois annexes) est **introuvable** dans ce
> dépôt : aucune version dans l'historique git (toutes branches), aucun stash,
> aucun objet orphelin, aucune occurrence de « RÈGLE ZÉRO » dans l'arbre ni dans
> les 400 dernières révisions, rien dans l'historique local de VS Code, rien sur
> le disque (voir `docs/audit/RAPPORT-fidelite-corrections.md` § 1). Ce fichier
> a été **créé le 2026-09-19** (commit `4d00c2f4`) sous ce nom par une session
> Claude ; il n'a **rien écrasé** (le chemin était vide). Il ne contient que le
> suivi du chantier de fidélité Office → PDF.
>
> **À faire par l'utilisateur :** fournir l'original (autre machine, sauvegarde).
> Il faudra alors le restaurer tel quel dans `claude/` et y **fusionner** le suivi
> ci-dessous, sans perdre une ligne de l'original. Ne pas reconstituer la
> RÈGLE ZÉRO de mémoire.

Rapports : `docs/audit/RAPPORT-fidelite-office.md` (mesure + comparaison marché)
et `docs/audit/RAPPORT-fidelite-corrections.md` (D1/D2/D6, plafond D8).

## État des défauts

| # | Défaut | État (2026-09-19) |
|---|---|---|
| D1 | Gras Excel en police à empattements | **Corrigé et vérifié en production** (cause réelle : polices `<font>` sans `<name>` ; `lib/xlsxDefaultFont.js`). `.xlsx` seulement ; `.xls/.ods/.csv` non mesurés. |
| D2 | Segoe UI → police plus large | **Selawik ajoutée** (OFL 1.1, empreintes vérifiées) ; largeurs identiques à Segoe UI (93/93). **Objectif « titre 06 sur une ligne » NON atteint** : la cause réelle est D9. |
| D3 | TOC Word non recalculée | Non corrigeable ; identique chez les concurrents ; divulguée |
| D4 | Feuilles Excel larges découpées | Comportement par défaut ; divulgué |
| D5 | Graphique Excel rendu différemment des concurrents | Ouvert, gravité inconnue |
| D6 | pdf-to-word : repli silencieux vers texte brut | **Corrigé** (503 + message clair ; testé en local) ; non testé en navigateur |
| **D7** | **Repli LibreOffice pour `.docx` (si `CONVERTAPI_ENABLED` est coupé) et formats `.doc`, `.xls`, `.ppt`, `.csv`, `.ods` : JAMAIS MESURÉS** | **OUVERT — non traité dans cette passe.** À mesurer avant toute coupure de ConvertAPI (mêmes fixtures via un Gotenberg de test). |
| D8 | Plafond de taille | **Mesuré, rien modifié** : plafond réel ≈ **4,4 Mo** de fichier (`FUNCTION_PAYLOAD_TOO_LARGE`, Vercel), pas 25 Mo ; concurrents 150 Mo (Online2PDF) et 1 Go (FreeConvert), affichés |
| D9 | LibreOffice replie les zones `wrap="none"` plus étroites que leur texte (texte masqué possible) | **Nouveau, ouvert** ; fréquence réelle inconnue ; pas de correctif testé |
| D10 | Un 413 de plateforme s'affiche « Conversion failed. Please try again. » | **Nouveau, ouvert** ; correctif A (contrôle côté navigateur + message) recommandé en premier |

## À faire — nécessite une décision de l'utilisateur

1. **Retrouver/fournir le vrai document de pilotage** (voir l'avertissement ci-dessus).
2. **D8 — plafond** : décider entre A (message clair, faible coût), B (envoi via
   Vercel Blob, 1–2 jours, risque non mesuré sur la taille de la réponse PDF),
   C (sortir les routes de Vercel, 2–4 jours). Estimations, non vérifiées.
3. **D9** : décider si on évalue un prétraitement des `.pptx` (comme D1).
4. **D7** : mesurer le repli et les formats non mesurés.
5. **Quotas** : les valeurs de production sont 5 conversions/mois/utilisateur
   (routes `.docx` et pdf-to-word uniquement), 30/heure et 100/jour par IP,
   plafond de dépense 20 $ ; xlsx/pptx/etc. n'ont **ni quota ni limite par IP**.
   Décision produit si cela doit changer.
6. **Railway** : supprimer `gotenberg-fonts` (~2 $/mois, aucun trafic réel) ;
   envisager la veille Serverless de `pdf-tools` (actif 24h/24, outils « Coming Soon »).
7. Hygiène : l'API Vercel signale « readable-secret » pour `RESEND_API_KEY` et
   `GOTENBERG_PASSWORD` (type « encrypted » lisible plutôt que « sensitive »).
8. Supprimer à la main `Downloads\fidelite-01..06.pdf` (verrouillés par Chrome).

## Règles permanentes de ce chantier

- Aucun agent de fond pour le travail navigateur (un agent a réécrit 3 pages sans
  autorisation le 2026-09-18).
- Aucune promesse de fidélité sans mesure écrite dans un rapport ; les
  hypothèses non vérifiées sont écrites comme telles (trois d'entre elles se sont
  révélées fausses le 2026-09-19 : D1, D2, valeurs de quota).
- Ne jamais supprimer ni renommer un outil ou un service sans accord explicite.
- Jamais `.env`/`.env.local` ni sortie pouvant contenir un secret ; aucune valeur
  de repli silencieuse en production ; aucune boucle de surveillance ni réveil planifié.
- Branche + balise de restauration avant le premier commit.
