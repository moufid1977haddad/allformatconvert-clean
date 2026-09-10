# Progress — Pièces jointes du formulaire de contact

Statut : code fusionné dans `master` (commit `7257e87f`) et déployé en production (dpl_AsfigzvNbnG7pBUYAuYrA9LHoHo4, READY). Tests en cours.

## Fait et prouvé (tests réels contre www.onlineconvertools.com)

| Test | Résultat |
|---|---|
| Fichier à fausse extension (octets PDF réels nommés `.png`) | Rejeté par le serveur, HTTP 400, message clair — confirmé que le sniff sur les octets réels fonctionne, pas sur l'extension |
| Fichier de 3 Mo, 4 Mo, 4,4 Mo (contenu factice après un en-tête PNG réel) | Acceptés, HTTP 200, e-mail envoyé (`notified:true`) — **3 vrais e-mails de test déjà envoyés à la boîte du propriétaire** avec des pièces jointes factices (en-tête PNG valide + octets aléatoires, donc l'image ne s'affichera pas correctement à l'ouverture — normal, c'était voulu pour ce test de taille) |
| Fichier de 6 Mo | Rejeté, mais **par la plateforme Vercel elle-même** (`FUNCTION_PAYLOAD_TOO_LARGE`, HTTP 413), avant même d'atteindre notre code | Voir décision à trancher ci-dessous |
| Build + typecheck | Propres, aucune erreur |

## Modifié mais pas encore testé

| Point | Détail |
|---|---|
| Interface (bouton, glisser-déposer, collage presse-papiers) | Codée, jamais ouverte dans un navigateur dans cette session |
| Rejet à 4 fichiers (limite de compte) | Codé et relu, pas encore déclenché par une vraie requête |
| Envoi sans pièce jointe (non-régression) | Codé, pas encore vérifié en conditions réelles |
| Fichier exactement à 5 Mo (notre propre limite par fichier) | Fichier de test créé, requête pas encore envoyée au moment de cette sauvegarde |
| Lecture de l'e-mail reçu pour confirmer qu'une pièce jointe est lisible | Aucun accès à la boîte mail du propriétaire — reste un test qui revient à l'utilisateur |
| Limitation de débit (5/heure) | Pas explicitement déclenchée ; environ 4-5 requêtes de test déjà envoyées dans la dernière heure, donc la marge restante est faible |

## Pas commencé

- Rapport final `docs/audit/RAPPORT-pieces-jointes-contact.md` (tableaux : limites retenues, validations serveur, non traité, tests manuels)
- Vérification navigateur (collage, glisser-déposer, affichage des limites avant sélection)
- Décision finale sur la limite de taille par fichier compte tenu du plafond de la plateforme Vercel découvert pendant les tests (voir ci-dessous)

## Décision à trancher : plafond de la plateforme Vercel

Le plafond réel du corps de requête accepté par la fonction serverless de ce projet se situe entre 4,4 Mo (accepté) et 6 Mo (rejeté par Vercel avant notre code) — pas au 4,5 Mo « classique » habituellement documenté pour Vercel, ni au 100 Mo annoncé pour Fluid Compute. Notre propre limite annoncée de 5 Mo par fichier est donc peut-être partiellement inatteignable en pratique pour un fichier proche de ce plafond, une fois l'overhead multipart ajouté. Le test à 5 Mo pile (en cours au moment de cette sauvegarde) doit trancher : si 5 Mo échoue au niveau plateforme, la limite par fichier sera abaissée à une valeur sûre sous le plafond réel mesuré, avec le message affiché au visiteur mis à jour en conséquence.

## Décisions déjà prises

| Décision | Valeur | Justification |
|---|---|---|
| Nombre de fichiers max | 3 | Demandé explicitement ; plus strict que la limite de 5 fichiers de Zendesk pour les formulaires web non authentifiés |
| Taille par fichier | 5 Mo (à confirmer, voir ci-dessus) | Convention GitHub pour les images jointes |
| Taille totale | 10 Mo | Large marge sous le plafond réel de Resend (40 Mo après encodage base64, ≈28-30 Mo bruts) |
| Formats acceptés | PNG, JPEG, GIF, WebP | Formats de capture d'écran réels, rendus en pièce jointe par tout client mail ; vérifiés sur les octets réels via `app/lib/detectFileFormat.js`, jamais sur l'extension ni le type MIME déclaré |
| Sites du marché consultés | GitHub (issues), Zendesk (formulaire web), Resend (docs API), Intercom (e-mails entrants), Jira | Voir citations complètes dans le rapport final à venir |
| Limitation de débit dédiée | 5/heure, 15/jour par IP hachée | Nouveau compartiment séparé de `ip_rate:` et `tool_error_rate:` — cette route envoie désormais un vrai e-mail sortant avec pièces jointes à chaque succès |
| Relecture indépendante (validation serveur + limitation d'abus uniquement) | Effectuée avant le commit | Un point réel trouvé et corrigé : la vérification par `Content-Length` seule pouvait être contournée par un encodage chunked ou un client malhonnête ; corrigé par un comptage d'octets en flux (`readBodyCapped`) qui plafonne le corps de la requête indépendamment de l'en-tête. Deux points signalés comme préexistants et hors périmètre (partagés avec `ipRateLimit.js`/`toolErrorRateLimit.js`, non introduits par cette fonctionnalité) : lecture du premier segment de `X-Forwarded-For` (potentiellement usurpable), et une compensation incrément/décrément non atomique en cas d'erreur réseau rare |
