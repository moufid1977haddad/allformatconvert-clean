# Progress — détourage phase 1 (construction + déploiement Railway)

**TERMINÉ le 14/09/2026.** Service déployé, vérifié en production, rapport complété. Voir [RAPPORT-detourage-phase1.md](RAPPORT-detourage-phase1.md) pour le détail complet.

## Fait et poussé (dépôt git)

- `services/background-removal/` créé, commité, poussé — commit `ec74cf96` sur `master`.
- Tag de restauration `pre-detourage-phase1-service` créé et poussé (pointe sur `3975ab10`, avant ce chantier).
- `docs/audit/RAPPORT-detourage-phase1.md` écrit, puis complété avec toutes les mesures de production.
- `fix(background-removal): numpy/scipy pins incompatibles avec Python 3.11.6` — commit `f4ea6419`. Corrige `numpy==2.5.3`→`2.4.6` et `scipy==1.18.1`→`1.17.1` (les deux versions d'origine exigeaient Python ≥3.12, incompatible avec le 3.11.6 épinglé dans le Dockerfile — jamais détecté avant faute de build Docker réel en local).
- `fix(background-removal): SHA256 du modele tronque d'un caractere` — commit `46c8a563`. Le digest du modèle codé en dur dans `Dockerfile` et `README.md` faisait 63 caractères hex au lieu de 64 (`a` final manquant) — corrigé après recalcul local (`sha256sum`) sur le fichier réellement téléchargé.

## Railway — toutes les étapes terminées

Projet `fortunate-manifestation`, service `allformatconvert-clean` (id `e5522a95-c93f-4279-979f-7e7f3346cf7b`) :

1. ✅ Gotenberg (`gotenberg-fonts`) → Watch Paths réglé à `/services/gotenberg/**` (était vide). Aucun autre réglage touché.
2. ✅ Service `allformatconvert-clean` existant, Root Directory = `services/background-removal`.
3. ✅ Watch Paths = `/services/background-removal/**` (unique, propre).
4. ✅ Healthcheck Path = `/health` (n'était en fait PAS encore enregistré au début de cette session malgré ce que la session précédente pensait — corrigé et confirmé).
5. ✅ Serverless activé (« Enable Serverless », libellé exact confirmé).
6. ✅ Déployé — 3ᵉ tentative réussie après correction des deux bugs ci-dessus (les tentatives 1 et 2 ont échoué proprement, aucun OOM/Killed rencontré à aucun moment).
7. ✅ Builder confirmé = **Dockerfile, Automatically Detected** (jamais Nixpacks).
8. ✅ Domaine public généré : **`allformatconvert-clean-production-337b.up.railway.app`** (port 8080).

## Vérification en production — faite

Voir RAPPORT §5 pour le détail complet. Résumé :

- 6/6 photos de test → `200`, PNG RGBA valides, découpage conforme aux références locales (une différence avec l'ancienne référence sur la photo 04 est **intentionnelle** : le filtre plus-grande-région, ajouté après cette référence, retire bien la mire de couleurs comme prévu).
- `/health` chaud : 249 ms.
- `/remove-background` chaud : 6,7–9,9 s/image — **3 à 4× plus lent qu'en local (~2,4 s/image)**, écart réel non anticipé, cause probable = CPU Railway moins puissant pour ce calcul intensif. Non diagnostiqué plus loin (hors périmètre mesure).
- Mémoire observée (Metrics Railway) : palier ~1,6 Go, cohérent avec l'estimation locale de ~1,7 Go.
- 4 cas d'erreur testés (corps vide, octets invalides, route inexistante, mauvaise méthode) : 4/4 JSON propre, jamais de trace technique.
- **Non mesuré** : le réveil après une veille réelle (5-10 min d'inactivité) — nécessiterait une attente active (minuteur, boucle, `sleep` long), explicitement et strictement interdite par consigne utilisateur pour ce chantier. Seule donnée disponible : le tout premier appel après déploiement (démarrage conteneur + modèle inclus) = 9,29 s.

## Observation hors périmètre (signalée, non traitée)

Le service `pdf-tools` du même projet Railway s'est aussi redéployé lors des pushes de cette session (ses propres Watch Paths, non modifiés ici, semblent couvrir tout le dépôt). Aucune action prise — hors du périmètre de ce chantier (phase 1 ne touche que Gotenberg Watch Paths et le nouveau service background-removal).

## Prochaine étape (phase 2, hors périmètre de ce chantier)

Brancher `/api/remove-bg` sur ce service, mettre à jour la page de l'outil, gérer les quotas. Rien de tout cela n'a été touché ici.
