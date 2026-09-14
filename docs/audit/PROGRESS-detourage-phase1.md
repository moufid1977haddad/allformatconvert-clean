# Progress — détourage phase 1 (construction + déploiement Railway)

**Arrêté sur consigne explicite de l'utilisateur (« Limite atteinte. N'entreprends plus rien. »). Aucune action Railway supplémentaire n'a été tentée après ce point.**

## Fait et poussé (dépôt git)

- `services/background-removal/` créé, commité, poussé — commit `ec74cf96` sur `master`.
- Tag de restauration `pre-detourage-phase1-service` créé et poussé (pointe sur `3975ab10`, avant ce chantier).
- `docs/audit/RAPPORT-detourage-phase1.md` écrit et poussé (construction + décision modèle + instructions Railway détaillées ; sa section « Vérification en production » est encore marquée EN ATTENTE — non complétée, voir ci-dessous).

## Où en sont exactement les 10 étapes Railway (pilotage direct dans le navigateur de l'utilisateur, rien commité côté Railway par git)

1. ✅ **Fait** — Projet Railway `fortunate-manifestation` ouvert.
2. ✅ **Fait** — Service Gotenberg (`gotenberg-fonts`) ouvert → Settings → Watch Paths : **était vide**, confirmé par capture d'écran ET par l'historique de déploiements (un commit `docs(detourage)` sans rapport avait déclenché un rebuild Gotenberg quelques minutes plus tôt). Rempli avec `/services/gotenberg/**`, bouton **Deploy** cliqué, changement appliqué avec succès (badge « Edited »/« 1 Change » disparu, service repassé « Online »). Aucun autre réglage Gotenberg touché.
3. ✅ **Fait** — Nouveau service créé via **"+ New" → "GitHub Repository" → `moufid1977haddad/allformatconvert-clean`**. Nom du service : `allformatconvert-clean`, id `e5522a95-c93f-4279-979f-7e7f3346cf7b`.
4. ✅ **Fait** — **Root Directory** réglé à `services/background-removal`, confirmé affiché dans le champ (changement en attente d'application, pas encore déployé).
5. ✅ **Fait** — **Watch Paths** réglé à `/services/background-removal/**`. Un doublon sans slash initial (`services/background-removal/**`, artefact de saisie) a été créé puis supprimé — un seul motif propre reste dans le champ, vérifié par capture d'écran après suppression.
6. 🟡 **Probablement fait, à re-vérifier en premier** — **Healthcheck Path** : `/health` tapé et confirmé présent dans le champ (lu directement via l'état du champ). Le clic final sur la coche de confirmation a été suivi d'un timeout de capture d'écran puis de l'instruction d'arrêt — **le résultat de ce dernier clic n'a pas été revérifié**. À contrôler en premier à la reprise.
7. ❌ **Non fait** — Activer **"Enable Serverless"** (Settings → Deploy → section Serverless). Le bouton était visible et cliquable au dernier écran vu, non cliqué.
8. ❌ **Non fait** — Lancer le déploiement (bouton **"Deploy"** en haut, actuellement « Apply 5 changes » ou « 6 » selon si l'étape 6 a bien été confirmée) et lire les **Deploy Logs**.
9. ❌ **Non fait** — Générer le domaine public (Settings → Networking → Public Networking → **"Generate Domain"**).
10. ❌ **Non fait** — Vérifier dans les logs de build que **"Using detected Dockerfile!"** apparaît (et non Nixpacks). Dépend du déploiement (étape 8).

**Incident mineur corrigé pendant la manipulation, sans conséquence :** un clic mal placé a brièvement activé un **Cron Schedule** (fréquence « Daily ») sur le nouveau service, ce qui bloquait le toggle Serverless (« Serverless is not available for services that have a cron schedule »). Corrigé immédiatement — le sélecteur a été ramené à **« No schedule »**, confirmé par capture d'écran montrant le bouton **"+ Add Schedule"** (état non configuré) de retour. Aucune trace de ce cron ne devrait subsister, mais à confirmer visuellement en réouvrant Settings → Deploy à la reprise.

## URL publique du service

**Non générée.** Le service n'a jamais été déployé (« There is no active deployment for this service » confirmé à l'écran) — l'étape 9 (Generate Domain) ne peut de toute façon pas produire d'URL fonctionnelle avant un déploiement réussi.

## Ce qui reste à vérifier en production (points 5 et 6 du prompt initial — rien de tout cela n'a été fait)

- Les 6 mêmes photos de `docs/audit/detourage-serveur/` contre le service réel.
- Temps de réponse à chaud et après veille.
- Pic de mémoire réellement observé sur Railway.
- `/health` après un réveil.

Rien de ceci n'est possible tant que le service n'est pas déployé et son domaine généré (étapes 8-9 encore à faire).

## Premier geste de la prochaine session

Rouvrir le service **`allformatconvert-clean`** dans le projet Railway `fortunate-manifestation` → **Settings → Deploy**, et dans l'ordre :
1. Vérifier/re-confirmer que **Healthcheck Path = `/health`** est bien enregistré (pas seulement affiché dans un champ en édition).
2. Vérifier qu'aucun Cron Schedule ne traîne (doit afficher « + Add Schedule », pas un sélecteur de fréquence).
3. Activer **"Enable Serverless"**.
4. Cliquer **"Deploy"**, lire les **Deploy Logs** en direct — s'arrêter immédiatement et signaler si `Killed`, `OOM` ou `out of memory` apparaît, ou si Nixpacks est utilisé à la place de `"Using detected Dockerfile!"`.
5. Une fois déployé : **Settings → Networking → Public Networking → "Generate Domain"**, noter l'URL.
6. Enchaîner avec les vérifications de production (points 5-6 du prompt initial) et compléter `docs/audit/RAPPORT-detourage-phase1.md`.
