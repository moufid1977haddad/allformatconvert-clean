# Détourage d'image — comparaison au marché avant toute construction

**Date : 12 septembre 2026**
**Périmètre : comparaison uniquement. Aucun code applicatif modifié, aucun modèle branché, `/api/remove-bg` et la page `/tools/ai-tools/background-remover` non touchés.**

## 0. Pourquoi ce chantier

Le compte remove.bg est à zéro crédit. L'outil Background Remover échoue en production sur une image valide, et la page est indexée par Google : un visiteur peut tomber sur une panne à tout moment. Avant de recharger des crédits ou de changer de fournisseur, la question posée était : **existe-t-il un modèle de détourage qui tourne dans le navigateur du visiteur, avec une qualité suffisante et une licence compatible avec un site monétisé ?** Si oui, on élimine le quota, le coût et le fournisseur d'un coup, et on renforce l'argument confidentialité du site (l'image ne quitte jamais la machine du visiteur).

Ce document ne recommande pas d'implémentation. Il livre un verdict chiffré, avec les images réelles à l'appui.

## 1. Découverte critique en cours de route : remove.bg lui-même s'arrête

En vérifiant les tarifs actuels de remove.bg (page officielle chargée dans un vrai navigateur le 12/09/2026), le site affiche ce bandeau :

> *« remove.bg's background removal is moving to Canva. The standalone website will no longer be available from 1 December 2026 at 9:00am CET. »*

Le produit remove.bg autonome ferme dans moins de trois mois. Le crédit qu'on rechargerait aujourd'hui pour patcher la panne serait donc, de toute façon, une solution à horizon courte durée. Il faudra choisir entre suivre la migration vers Canva/Leonardo.ai (nouveau point d'entrée API annoncé sur la page de tarifs), passer à un concurrent (PhotoRoom, Slazzer, Pixian…), ou faire aboutir la piste navigateur. Ce fait ne change rien à la méthode de ce rapport, mais il doit peser dans la décision finale du propriétaire.

## 2. Le marché : qui fait quoi, et par quel moyen technique

| Service | Technique | Détail |
|---|---|---|
| remove.bg | Appel serveur (API) | Kaleido AI ; ferme le 1er déc. 2026, migre vers Canva/Leonardo.ai |
| Canva (Background Remover) | Appel serveur | Va absorber remove.bg ; traitement cloud, pas de modèle côté client |
| Adobe Express | Appel serveur | Identification automatique du sujet côté cloud (Adobe Sensei/Firefly) |
| PhotoRoom | Appel serveur (web) | Le site web appelle une API cloud ; PhotoRoom a par ailleurs un SDK mobile on-device (iOS/Android, Core ML/TFLite), mais c'est un produit séparé, pas le détourage web |
| Slazzer | Appel serveur, + option « on-premise » entreprise | « On-premise » = serveur déployé chez le client, **pas** un modèle exécuté dans le navigateur du visiteur final — à ne pas confondre |
| Pixian.ai | Appel serveur (API compatible remove.bg) | Rien d'indiqué ni d'observé qui tourne réellement côté client |
| Erase.bg | Appel serveur | — |

**Aucun de ces acteurs commerciaux grand public ne fait tourner son modèle de production dans le navigateur du visiteur.** Le seul exemple sérieux et documenté d'un détourage réellement exécuté côté client, en dehors de démonstrations académiques, est la bibliothèque open-source **`@imgly/background-removal`** (IMG.LY) — cf. §3, éliminée pour raison de licence.

## 3. Modèles exécutables dans le navigateur — recensement

| Modèle | Licence | Poids réel (.onnx) | Moteur | Repli sans WebGPU | Portée |
|---|---|---|---|---|---|
| `@imgly/background-removal` (npm) | **AGPL-3.0** — licence commerciale sur devis (contact IMG.LY, tarif non public) | Paquet de données > 150 Mo (plusieurs variantes) | onnxruntime-web (WASM), pas de retour officiel sur WebGPU | WASM | Général |
| `briaai/RMBG-2.0` (Bria AI, utilisé par de nombreuses démos transformers.js) | **CC BY-NC 4.0 — non commercial**, licence commerciale payante obligatoire sinon | ~977 Mo (`.onnx`) | onnxruntime-web / transformers.js, WebGPU si dispo | WASM (lent vu la taille) | Général |
| MediaPipe Selfie Segmentation (Google) | Apache 2.0 — commercial OK | Quelques Mo | MediaPipe/TF.js, WASM ou WebGL | WASM | **Humains uniquement** — ne segmente pas un animal, une plante ou un produit |
| **U²-Net** (`u2net.onnx`) | **Apache 2.0** — commercial OK | 168 Mo | onnxruntime-web, WASM/WebGL | WASM | Général |
| **IS-Net general-use** (`isnet-general-use.onnx`, projet DIS) | **Apache 2.0** — commercial OK | 170 Mo | onnxruntime-web, WASM/WebGL | WASM | Général |
| **BiRefNet-general-lite** (swin-tiny) | **MIT** — commercial OK | 214 Mo | onnxruntime-web | WASM | Général |
| BiRefNet-general (poids complets) | MIT — commercial OK | **928 Mo** | onnxruntime-web | WASM | Général, mais taille disqualifiante pour un site public |

**La licence est éliminatoire, exactement comme pour Wingdings.** Les deux modèles qui produisent visuellement le résultat le plus proche de remove.bg (`@imgly/background-removal` et Bria RMBG-2.0) sont tous les deux verrouillés : AGPL-3.0 pour le premier (obligation de réciprocité incompatible avec un site propriétaire monétisé, sauf achat d'une licence dont le prix n'est même pas public), non-commercial strict pour le second. Ils sont écartés indépendamment de leur qualité.

Restent trois modèles réellement utilisables commercialement pour un usage général (pas seulement portrait humain) : **U²-Net, IS-Net general-use et BiRefNet-general-lite**, tous les trois issus de recherche publiée sous Apache-2.0/MIT sans restriction commerciale. Ce sont les trois retenus pour les tests ci-dessous.

## 4. Méthode de test

Six vraies photographies (aucune image générée), chacune choisie pour déclencher un mode d'échec classique du détourage, toutes sous licence réutilisable commercialement (détail et attribution complète : [`SOURCES-photos.md`](detourage-comparaison/SOURCES-photos.md)) :

1. Portrait, cheveux fins/bouclés
2. Animal à poil (chien)
3. Objet à bords fins/complexes (fil barbelé)
4. Objet transparent/réfléchissant (bouteille en verre)
5. Sujet sur fond de couleur proche (grenouille verte sur feuille verte)
6. Produit sur fond blanc studio

Chaque photo a été redimensionnée à ~2000 px de grand côté puis passée dans les trois modèles retenus via `rembg` (bibliothèque MIT qui implémente fidèlement le pré/post-traitement officiel de chaque modèle — resize, normalisation, seuillage min-max, upscale du masque), sur onnxruntime CPU natif. Machine de test : Intel Core i7-1065G7 (portable, 2020, sans GPU dédié) — plus lent qu'un poste récent, donc les temps ci-dessous sont un plafond, pas un plancher.

**Résultats complets image par image (grille originale + 3 modèles, fond damier = zones transparentes) :**
[`resultats/`](detourage-comparaison/resultats/)

### Temps mesurés (CPU natif, secondes par image, image ~2000 px)

| Modèle | Portrait | Animal | Bords fins | Transparent | Faible contraste | Produit | Moyenne |
|---|---|---|---|---|---|---|---|
| u2net | 0.96 | 1.03 | 0.66 | 0.73 | 0.81 | 0.79 | **0.83 s** |
| isnet-general-use | 2.03 | 2.15 | 1.67 | 1.71 | 1.73 | 1.69 | **1.83 s** |
| birefnet-general-lite | 13.13 | 13.06 | 14.24 | 12.57 | 12.29 | 12.78 | **13.01 s** |

(Chargement du modèle en mémoire, une seule fois par session : 5.4 s / 6.0 s / 11.0 s respectivement — non compté ci-dessus.)

### Mesure réelle **dans le navigateur** (pas une extrapolation)

Pour vérifier que ces modèles tournent vraiment côté client et quantifier le repli WASM demandé, j'ai construit une page HTML minimale chargeant `onnxruntime-web` depuis un CDN, servie en local, ouverte dans un vrai Chrome, forcée sur le moteur **WASM mono-thread** (le repli garanti sans WebGPU ni isolation cross-origin) — même modèle (`isnet-general-use.onnx`), même prétraitement, même image portrait (2000 px) :

- Session ONNX Runtime Web prête : **1.3 s**
- Prétraitement (resize + normalisation) : **96 ms**
- **Inférence réelle dans le navigateur : 14.2 s** (vs 2.03 s en CPU natif pour la même image — le repli WASM mono-thread est ~7× plus lent que l'exécution native ici)

Ce chiffre est réel, pas déduit. Il confirme que le repli WASM (le seul chemin garanti sur 100 % des navigateurs, WebGPU n'étant pas universel) transforme un modèle « rapide » sur le papier en une attente de 14 secondes pour une seule photo — largement au-dessus de ce qu'un visiteur tolère, et sans même parler de BiRefNet (qui serait proportionnellement bien plus lent). Le WebGPU accélérerait nettement ce chiffre, mais n'a pas pu être mesuré de façon fiable dans cet environnement, et n'est de toute façon pas disponible chez 100 % des visiteurs — un mode WASM correct doit rester le scénario de référence pour un outil grand public.

## 5. Ce que montrent les images réelles

*(voir les grilles complètes dans [`resultats/`](detourage-comparaison/resultats/) — original + u2net + isnet-general-use + birefnet-general-lite, fond damier = alpha)*

| Cas | u2net | isnet-general-use | birefnet-general-lite |
|---|---|---|---|
| **1. Portrait / cheveux** | **Échec net** : le bras et une partie du pull sont purement et simplement coupés, halo flou et translucide très visible autour des cheveux | Bon : cheveux et silhouette entière conservés, léger halo résiduel mineur | Excellent : mèches de cheveux fines conservées, bord le plus propre des trois |
| **2. Animal à poil** | **Échec** : corps coupé sous la mâchoire, collier disparu, poitrail semi-transparent | Correct mais imparfait : garde le cou/collier mais avec des trous en forme de « morsures » près de la main/laisse | Bon : tête + cou + collier conservés proprement, meilleur rendu du poil fin des trois |
| **3. Bords fins (fil barbelé)** | **Échec** : traînée floue façon flou de bougé tout le long du fil | Bon : fil fin bien conservé, halo minime | Excellent : fil le plus net et le plus fin des trois |
| **4. Transparent/réfléchissant** | Correct sur le contour, mais **aucun des trois modèles ne restitue la transparence réelle du verre** — la bouteille ressort comme un aplat opaque, pas comme du verre translucide | Idem | Idem, bords d'étiquette légèrement plus nets |
| **5. Faible contraste (grenouille/feuille)** | Excellent | Excellent | Excellent |
| **6. Produit / fond blanc** | Excellent | Excellent | Excellent |

**Constat important sur le cas transparent** : aucun des trois modèles — ni, à notre connaissance, remove.bg lui-même sur ce type de sujet — ne fait de la vraie matte alpha optique (préserver le voir-au-travers d'un verre). C'est une limite structurelle des réseaux de segmentation par saillance, pas un défaut propre au navigateur ; à ne pas compter contre l'option navigateur spécifiquement.

**Constat sur le cas le plus fréquent en usage réel (produit sur fond blanc) et sur le faible contraste** : les trois modèles, y compris le plus rapide (u2net), s'en sortent très bien. Les échecs se concentrent sur les cheveux/poils/bords fins — exactement les cas que la consigne visait.

## 6. Verdict, une phrase par option

- **`@imgly/background-removal` (AGPL-3.0)** — insuffisant tel quel : licence bloquante pour un site propriétaire monétisé, licence commerciale à négocier au cas par cas, prix non public.
- **Bria RMBG-1.4 / RMBG-2.0 (non commercial)** — insuffisant : licence non-commerciale stricte, accord payant Bria obligatoire pour tout usage commercial, quelle que soit la qualité (très bonne au demeurant).
- **MediaPipe Selfie Segmentation (Apache 2.0)** — insuffisant pour ce produit : licence pourtant idéale, mais ne segmente que des humains — ne traite ni animal, ni objet, ni produit, donc hors sujet pour un « Background Remover » généraliste.
- **U²-Net (Apache 2.0)** — insuffisant pour la mise en ligne : trop d'échecs visibles et grossiers sur cheveux, poils et bords fins, malgré une vitesse excellente (0.8 s CPU natif).
- **IS-Net general-use (Apache 2.0)** — qualité suffisante pour la majorité des cas (produits, faible contraste, cheveux) mais pas encore au niveau sur le poil animal, et surtout **trop lent en repli WASM réel (14.2 s mesurés)** pour servir tous les visiteurs sans WebGPU garanti.
- **BiRefNet-general-lite (MIT)** — la meilleure qualité des trois testés, suffisante pour rivaliser visuellement avec un service payant, mais son coût CPU (13 s natif) laisse anticiper un repli WASM largement au-delà de la minute par image — inutilisable en pratique tant que WebGPU n'est pas garanti chez 100 % des visiteurs.

**Verdict global : aucune option navigateur commercialement licenciée n'est aujourd'hui prête à remplacer purement et simplement un appel serveur pour tous les visiteurs.** IS-Net general-use est la plus proche d'être viable, mais seulement dans une architecture qui détecterait WebGPU et proposerait un repli (serveur, ou message d'attente explicite) pour les navigateurs qui ne l'ont pas — ce qui est un choix d'architecture, pas une simple bascule, et sort du périmètre « comparaison » de ce chantier.

## 7. Le coût de l'option payante — remove.bg, tarifs réels au 12/09/2026

Vérifiés en direct sur `remove.bg/pricing` (prix affichés en CAD selon la géolocalisation du test ; conversion indicative au taux du jour, 1 USD ≈ 1,386 CAD) :

| Formule | Crédits | Prix (CAD) | ≈ Prix (USD) |
|---|---|---|---|
| Pay-as-you-go | 3 crédits | CA$4 | ~US$2.89 |
| Abonnement | 40 crédits/mois | CA$12/mois | ~US$8.66/mois |
| Abonnement | 200 crédits/mois | CA$49/mois | ~US$35.35/mois |
| Abonnement | 500 crédits/mois | CA$119/mois | ~US$85.86/mois |
| Abonnement | 1200 crédits/mois | CA$249/mois | ~US$179.65/mois |
| Entreprise | >100 000 images/an | Sur devis | — |

1 crédit = 1 image traitée en HD. **Rappel : ces crédits expirent le 1er décembre 2026, date de fermeture du service standalone** (cf. §1) — tout rechargement doit être vu comme une solution de 2-3 mois, pas une solution durable, indépendamment du présent chantier navigateur.

## 8. Ce qui n'a pas été fait (hors périmètre, par consigne)

- Aucun modèle n'a été branché dans `/api/remove-bg` ni dans la page de l'outil.
- Aucun fichier applicatif n'a été modifié.
- Aucun second compte remove.bg n'a été créé.
- Le WebGPU n'a pas pu être mesuré de façon fiable dans cet environnement de test (limite méthodologique assumée et signalée, pas un chiffre inventé).
- La décision (payer, migrer vers Canva/Leonardo.ai, changer de fournisseur, ou investir dans une architecture hybride WebGPU/serveur) appartient au propriétaire du site.
