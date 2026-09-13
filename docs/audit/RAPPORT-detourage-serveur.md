# Détourage d'image — faisabilité d'un service d'inférence ONNX sur Railway

**Date : 13 septembre 2026**
**Périmètre : mesure uniquement. Rien n'est déployé sur Railway, aucun fichier applicatif modifié, aucun compte créé, `/api/remove-bg` non touché.**

## 0. Contexte

Le [rapport précédent](RAPPORT-detourage-comparaison.md) a établi que trois modèles sont juridiquement utilisables commercialement (Apache-2.0 / MIT) : U²-Net, IS-Net general-use et BiRefNet-general-lite — mais que le repli WASM dans le navigateur (14,2 s mesurés pour une seule photo) les rend impraticables pour une partie des visiteurs. Ces mêmes licences autorisant un déploiement côté serveur, et Railway hébergeant déjà Gotenberg sur ce projet, la question posée ici est : **un service d'inférence ONNX sur Railway est-il viable, techniquement et financièrement ?**

**Aléa de méthode signalé immédiatement :** Docker n'est installé ni en tant que Docker Desktop, ni via Podman, ni via WSL sur la machine de mesure. Après validation avec le propriétaire du site, la mesure a été faite avec le code de service exact (Python + onnxruntime pur, sans rembg) exécuté comme process natif — équivalent CPU/mémoire fidèle à ce que verrait le conteneur, à l'exception de la taille d'image Docker elle-même, qui est donc une **estimation calculée**, pas une mesure `docker images`. Chaque chiffre ci-dessous est marqué **[MESURÉ]** ou **[ESTIMÉ]** — jamais les deux mélangés.

## 1. Ce qui a été construit

Un service HTTP minimal (`infer_core.py` + `service.py`, non commité — seuls le rapport et les images de sortie le sont, conformément à la consigne) :

- **onnxruntime pur, aucune dépendance à rembg.** Le pré/post-traitement (normalisation, sigmoid pour BiRefNet, seuillage min-max, compositing alpha) a été relu dans le code source public de rembg *à titre documentaire* pendant le chantier précédent, jamais importé. Correctness vérifiée par comparaison pixel avec la sortie navigateur (§4).
- Dépendances retenues, avec leur licence : **onnxruntime** (MIT), **numpy** (BSD-3), **Pillow** (licence libre de type MIT/HPND), **Flask** + **gunicorn** (BSD-3 / MIT) pour le serveur HTTP. Aucune n'impose de restriction commerciale — pas de nouvelle vérification de licence à faire puisque rembg n'a pas été utilisé.
- Un `Dockerfile` complet et prêt à builder (`python:3.11-slim`, poids des modèles copiés dans l'image, `CMD gunicorn`) — non buildé, faute de Docker.

## 2. Mesures — temps de traitement (froid puis chaud)

Exécuté comme process persistant (modèles chargés une fois, requêtes HTTP séquentielles), sur les **6 mêmes photographies déjà commitées** dans `docs/audit/detourage-comparaison/photos-test/`. Machine : Intel Core i7-1065G7 (4 cœurs / 8 threads), la même que pour le chantier précédent.

**[MESURÉ]**

| Modèle | Image | Statut | Temps serveur (s) |
|---|---|---|---|
| isnet-general-use | 01 portrait | FROID | 2.295 |
| isnet-general-use | 02 animal | CHAUD | 2.132 |
| isnet-general-use | 03 bords fins | CHAUD | 2.155 |
| isnet-general-use | 04 transparent | CHAUD | 2.215 |
| isnet-general-use | 05 faible contraste | CHAUD | 2.718 |
| isnet-general-use | 06 produit | CHAUD | 2.716 |
| birefnet-general-lite | 01 portrait | FROID | 15.140 |
| birefnet-general-lite | 02 animal | CHAUD | 14.485 |
| birefnet-general-lite | 03 bords fins | CHAUD | 13.667 |
| birefnet-general-lite | 04 transparent | CHAUD | 13.374 |
| birefnet-general-lite | 05 faible contraste | CHAUD | 11.370 |
| birefnet-general-lite | 06 produit | CHAUD | 11.044 |

Moyennes : **isnet-general-use ≈ 2.4 s/image** ; **birefnet-general-lite ≈ 13.2 s/image**. Pas d'écart franc froid/chaud ici (contrairement au navigateur) : les deux sessions ONNX Runtime sont déjà compilées au démarrage, la seule différence froid/chaud restante est un effet de cache disque/OS mineur.

**Démarrage à froid, modèles chargés (process spawn → les deux modèles prêts) : 6.741 s [MESURÉ]**

## 3. Mesures — mémoire (le résultat qui change le verdict)

**[MESURÉ]**, avec le compteur officiel Windows `peak_wset` (pic de mémoire de travail cumulé du process, interrogé via un endpoint dédié du service — pas un sondage externe sujet aux ratés d'échantillonnage), **reproduit deux fois indépendamment** (13 999,5 Mo puis 14 078,4 Mo) :

| Configuration | Mémoire au repos (modèles chargés, 0 requête) | Mémoire en régime établi (après plusieurs appels) |
|---|---|---|
| isnet-general-use seul | 438,1 Mo | **≈ 1 670 Mo**, stable après 2 appels |
| birefnet-general-lite seul | 478,8 Mo | **≈ 12 691 Mo (12,7 Go)**, stable après 2 appels |
| Les deux modèles chargés dans le même process | 679,2 Mo | **14 078,4 Mo (14,08 Go)** après les 12 requêtes du banc de test |

**BiRefNet-general-lite consomme à lui seul près de 13 Go de RAM en régime établi sur du CPU**, contre ~1,7 Go pour IS-Net general-use — un facteur ~7,5. Ce n'est pas une fuite qui grossit indéfiniment : la mémoire plafonne après les deux premiers appels (l'allocateur d'arène d'ONNX Runtime grossit jusqu'au pic de besoin de l'opérateur le plus gourmand du graphe Swin, puis réutilise ce bloc — mais ne le restitue jamais à l'OS). C'est un comportement par défaut d'ONNX Runtime CPU ; un réglage d'arène plus strict (`arena_extend_strategy`, ou `enable_cpu_mem_arena=False`) pourrait réduire ce chiffre, mais n'a pas été testé ici (hors budget de ce chantier) — à explorer avant toute décision de garder BiRefNet en production.

**Confrontation aux limites du plan Railway actuel (Hobby, vérifié en direct le 13/09/2026 sur la page de tarifs, session connectée au compte du projet) : jusqu'à 48 vCPU / 48 Go de RAM par service.** Le pic mesuré (14,08 Go) **ne dépasse pas** cette limite — capacité techniquement suffisante. Mais « ça rentre » et « c'est rentable » sont deux questions différentes : voir §5.

## 4. Qualité de sortie — identique au navigateur ?

Comparaison pixel par pixel entre le masque calculé par le service et celui calculé en vrai navigateur (Chrome, onnxruntime-web, WASM) sur la **même image** (portrait, isnet-general-use), les deux masques ramenés à la même résolution :

- **Différence absolue moyenne : 0,634 / 255 (≈ 0,25 %)**
- **Différence absolue maximale : 34 / 255**, localisée à quelques pixels de bord — cohérent avec le fait que le redimensionnement 1024×1024 est fait par deux moteurs différents (`canvas.drawImage` du navigateur vs `PIL.Image.resize` côté serveur), pas par le modèle lui-même.
- **2 670 000 pixels comparés.**

**[MESURÉ] — qualité effectivement identique**, l'écart résiduel étant un artefact d'interpolation d'image, pas une différence de comportement du modèle. Vérification visuelle croisée avec les sorties du premier chantier : mêmes défauts, mêmes réussites (voir composites dans [`resultats/`](detourage-serveur/resultats/)).

**Découverte annexe, décisive pour le navigateur :** en tentant de faire tourner **BiRefNet-general-lite** dans le même harnais navigateur (WASM) pour compléter cette comparaison, la page a **planté** après ~33 secondes avec une erreur WASM de bas niveau (abandon sans message, typique d'un dépassement de la mémoire linéaire WASM). Vu que ce même modèle consomme ~12,7 Go de RAM native (§3), et que la mémoire linéaire WASM est plafonnée bien en dessous de ça dans un navigateur standard, ce n'est pas une surprise : **BiRefNet-general-lite ne peut probablement pas tourner dans le navigateur du tout**, pas seulement lentement. IS-Net general-use, lui, a tourné et produit un résultat identique au serveur (ci-dessus).

## 5. Coût réel — Railway vs Leonardo.Ai, et le volume d'équilibre

### Tarifs Railway, vérifiés en direct le 13/09/2026 (session connectée, plan **Hobby** confirmé comme plan actuel du projet)

- Facturation à l'usage réel : **CPU actif $0,00000772 / vCPU·seconde**, **RAM $0,00000386 / Go·seconde**.
- Plan Hobby : 5 $/mois d'usage minimum (crédit inclus, partagé par tous les services du compte — Gotenberg et pdf-tools tournent déjà dessus), jusqu'à 48 vCPU / 48 Go par service.

### Tarifs Leonardo.Ai, vérifiés en direct le 13/09/2026 (documentation officielle de migration remove.bg → Leonardo)

**Détourage : 0,1047 $ par image, tarif plat, quel que soit le volume** (API Pay-as-you-go ; remove.bg est littéralement revendu sous ce tarif depuis leur rachat).

| Volume/mois | Coût Leonardo.Ai |
|---|---|
| 1 000 images | **104,70 $** |
| 10 000 images | **1 047,00 $** |
| 100 000 images | **10 470,00 $** |

### Coût Railway — [ESTIMÉ à partir des mesures §2/§3, tarifs eux-mêmes MESURÉS]

Deux architectures possibles, dont les coûts diffèrent d'un facteur ~8 à cause du §3 :

**A — IS-Net general-use seul (recommandé)** : RAM 1,7 Go maintenue 24 h/24 ≈ **17,01 $/mois** fixes + CPU mesuré (5,8 vCPU·s/image) ≈ 0,0000448 $/image.

| Volume/mois | Coût Railway (A) |
|---|---|
| 1 000 | 17,06 $ |
| 10 000 | 17,46 $ |
| 100 000 | 21,49 $ |

**B — Les deux modèles chargés en permanence (le périmètre initial de ce chantier)** : RAM 14,08 Go 24 h/24 ≈ **140,85 $/mois** fixes + CPU (5,8 à 44 vCPU·s/image selon le modèle appelé).

| Volume/mois | Coût Railway (B) |
|---|---|
| 1 000 | ≈ 141 $ |
| 10 000 | ≈ 141–144 $ |
| 100 000 | ≈ 145–175 $ |

Dans les deux architectures, Railway reste moins cher que Leonardo.Ai à tous les volumes testés — mais l'écart est radicalement différent : **A est ~490× moins cher que Leonardo à 100 000 images/mois ; B ne l'est que ~60 à ~70×**, à cause du coût de RAM de BiRefNet.

### Le chiffre qui décide vraiment — volume d'équilibre

| Architecture | Coût fixe/mois | Volume d'équilibre vs Leonardo.Ai (0,1047 $/image) |
|---|---|---|
| **A — IS-Net seul** | 17,01 $ | **≈ 163 images/mois** |
| **B — Les deux modèles** | 140,85 $ | **≈ 1 346 images/mois** |

Le site n'a aujourd'hui aucun trafic — mais même à quelques dizaines d'images par jour (bien en dessous de 163/mois serait le seul cas où Leonardo.Ai gagnerait), Railway est déjà rentable avec l'architecture A. Payer à l'image ne serait la meilleure option que dans un scénario de trafic quasi nul et durable, ce qui contredirait l'objectif même d'avoir un outil public.

## 6. Taille de l'image Docker — [ESTIMATION calculée, pas une mesure `docker images`]

Calculée à partir de tailles réelles de chaque composant (aucun chiffre inventé), Docker n'ayant pas pu produire de mesure directe :

| Composant | Taille réelle utilisée | Source |
|---|---|---|
| `python:3.11-slim` (linux/amd64) | 48,51 Mo (compressé) | docker-library/repo-info, vérifié en direct |
| onnxruntime (wheel manylinux) | 23,6 Mo | PyPI, wheel officielle |
| numpy (wheel manylinux) | 16,7 Mo | PyPI, wheel officielle |
| Pillow (wheel manylinux) | 6,9 Mo | PyPI, wheel officielle |
| Flask + gunicorn + dépendances transitives | 0,9 Mo | PyPI, wheels officielles |
| isnet-general-use.onnx | 178,65 Mo | taille exacte du fichier utilisé pour les mesures |
| BiRefNet-general-lite.onnx | 224,01 Mo | taille exacte du fichier utilisé pour les mesures |

**Image A (IS-Net seul, recommandée) ≈ 275,3 Mo [ESTIMÉ]**
**Image B (les deux modèles) ≈ 499,3 Mo [ESTIMÉ]**

Écart probable avec une vraie image buildée : plutôt à la hausse (couches Debian non dédupliquées, cache pip si `--no-cache-dir` est oublié) — ces chiffres sont un plancher réaliste, pas un plafond.

## 7. Verdict

**Oui, un service Railway est viable — mais seulement en servant IS-Net general-use seul (architecture A) : environ 17 à 21 $/mois selon le volume, contre 105 à 10 470 $/mois chez Leonardo.Ai pour 1 000 à 100 000 images, un volume d'équilibre d'à peine ~163 images/mois, une mémoire crête (14 Go dans le pire cas testé) largement sous la limite de 48 Go du plan Hobby, et une qualité de sortie vérifiée pixel-identique au navigateur.** BiRefNet-general-lite, tel que testé par défaut, est disqualifié : ~12,7 Go de RAM par instance de modèle (facteur ~8 sur la facture), et un plantage pur et simple côté navigateur — à ne reconsidérer que si un réglage de l'arène mémoire d'ONNX Runtime en réduit significativement l'empreinte, ce qui n'a pas été mesuré ici.

## 8. Ce qui n'a pas été fait (hors périmètre, par consigne)

- Aucun `docker build` / `docker run` réel (Docker absent de la machine — signalé avant de commencer, méthode alternative validée avec le propriétaire).
- Aucun fichier applicatif modifié, aucun déploiement Railway, aucun compte créé.
- Le réglage de l'arène mémoire d'ONNX Runtime pour réduire l'empreinte de BiRefNet n'a pas été exploré (constat, pas une correction).
- La décision d'implémenter l'architecture A appartient au propriétaire du site.
