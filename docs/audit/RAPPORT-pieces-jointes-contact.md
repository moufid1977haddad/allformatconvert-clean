# Rapport final — Pièces jointes du formulaire de contact

## Limites retenues et justification marché

| Limite | Valeur | Justification |
|---|---|---|
| Nombre de fichiers max | 3 | Demandé explicitement ; plus strict que la limite de 5 fichiers de Zendesk pour les formulaires web non authentifiés |
| Taille par fichier | 3 Mo | Initialement fixée à 5 Mo (convention GitHub pour les images jointes), abaissée après mesure du plafond réel de la plateforme (voir section suivante) |
| Taille totale | 4 Mo | Initialement fixée à 10 Mo (large marge sous le plafond de 40 Mo post-base64/≈28-30 Mo bruts de Resend), abaissée pour la même raison |
| Formats acceptés | PNG, JPEG, GIF, WebP | Formats de capture d'écran réels, rendus en pièce jointe par tout client mail ; vérifiés sur les octets réels via `app/lib/detectFileFormat.js`, jamais sur l'extension ni le type MIME déclaré |
| Limitation de débit | 5/heure, 15/jour par IP hachée | Compartiment dédié `contact_rate:`, séparé de `ip_rate:` et `tool_error_rate:` — cette route envoie un vrai e-mail sortant à chaque succès |
| Sites du marché consultés | GitHub (issues), Zendesk (formulaire web), Resend (docs API), Intercom (e-mails entrants), Jira | Base de comparaison initiale pour fixer les ordres de grandeur, avant que la mesure du plafond réel (ci-dessous) ne devienne le facteur contraignant |

## Plafond réel de la fonction Vercel (mesuré en production)

| Constat | Détail |
|---|---|
| Plafond mesuré | Entre 4,4 Mo et 4,7 Mo de corps de requête total avant que la fonction serverless ne rejette elle-même la requête (`FUNCTION_PAYLOAD_TOO_LARGE`, HTTP 413), avant même que le code de la route ne s'exécute |
| Écart avec la documentation | Ni le plafond « classique » de 4,5 Mo habituellement documenté pour Vercel, ni les 100 Mo annoncés pour Fluid Compute ne correspondent à ce qui a été mesuré sur ce projet déployé |
| Conséquence | Limite par fichier abaissée de 5 Mo à 3 Mo, limite totale de 10 Mo à 4 Mo, pour laisser une marge réelle sous le plafond mesuré (overhead multipart + champs texte) |
| Référence pour l'avenir | **Le plafond réel du corps de requête d'une fonction serverless de ce projet, mesuré empiriquement en production, se situe entre 4,4 Mo et 4,7 Mo — pas au 4,5 Mo classique ni aux 100 Mo Fluid Compute documentés ; toute route future acceptant des fichiers doit être conçue avec cette contrainte de plateforme, pas avec les chiffres génériques de la documentation** |

## Validations appliquées côté serveur (`app/api/contact/route.js`)

| Validation | Mécanisme |
|---|---|
| Limitation de débit | `checkContactRateLimit` vérifiée en tout premier, avant tout autre traitement |
| Rejet rapide sur `Content-Length` | Rejet immédiat si l'en-tête annonce plus que `MAX_REQUEST_BYTES` — optimisation, pas la vraie limite |
| Plafond réel du corps | `readBodyCapped` compte les octets en flux au fur et à mesure qu'ils arrivent et annule le stream dès que le total dépasse `MAX_REQUEST_BYTES`, indépendamment de ce que le client a déclaré ou de l'encodage utilisé |
| Champs autorisés | Liste blanche stricte (`name`, `email`, `subject`, `message`, `attachments`) — toute autre clé dans le `FormData` rejette la requête |
| Champs requis | `name`, `email`, `subject`, `message` doivent être non vides |
| Nombre de fichiers | Rejeté au-delà de 3 fichiers |
| Taille par fichier | Rejeté si un fichier est vide ou dépasse `MAX_CONTACT_ATTACHMENT_BYTES` |
| Type réel du fichier | Détecté sur les octets réels via `sniffFormat` (`app/lib/detectFileFormat.js`) — jamais sur l'extension ni le `Content-Type` déclaré par le navigateur |
| Taille totale cumulée | Recalculée fichier par fichier pendant la validation, rejetée si elle dépasse `MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES` |
| Stockage | Le message texte est sauvegardé dans Supabase avant toute tentative d'e-mail ; les pièces jointes ne sont jamais écrites en base, jamais sur disque, jamais dans un espace de stockage — lues en mémoire et transmises directement à Resend, puis abandonnées à la fin de la requête |
| Résilience de la notification | Un échec Resend (notification propriétaire ou accusé de réception visiteur) n'affecte jamais la réponse de succès déjà acquise par le visiteur ; le drapeau `notified` distingue ce cas pour l'UI |

## Bug trouvé par le réviseur indépendant et sa correction

| Constat | Correction |
|---|---|
| La vérification par le seul en-tête `Content-Length` pouvait être contournée par un encodage chunked ou un client malhonnête, laissant passer un corps de requête plus gros que prévu jusqu'au parsing | Ajout de `readBodyCapped` : comptage d'octets en flux qui plafonne le corps de la requête indépendamment de l'en-tête déclaré, en annulant le stream dès que `MAX_REQUEST_BYTES` est dépassé |

## Réserves signalées hors périmètre (préexistantes, non introduites par cette fonctionnalité)

| Réserve | Détail |
|---|---|
| IP potentiellement usurpable | La détection de l'IP cliente lit le premier segment de l'en-tête `X-Forwarded-For`, qui peut être falsifié par un client malhonnête — partagé avec `ipRateLimit.js` |
| Compensation non atomique | Le décrément du compteur horaire en cas de dépassement du quota journalier (`decrementCounter`) n'est pas atomique avec l'incrément correspondant ; une erreur réseau rare entre les deux peut désynchroniser légèrement le compteur — partagé avec `toolErrorRateLimit.js` |

## Tests manuels qui reviennent au propriétaire

| Test | Pourquoi il ne peut pas être fait par l'agent |
|---|---|
| Lecture de l'e-mail de notification reçu (propriétaire) pour confirmer qu'une pièce jointe réelle s'ouvre et s'affiche correctement dans un client mail | Aucun accès à la boîte mail du propriétaire |
| Confirmation de réception de l'e-mail d'accusé de réception (visiteur) | Aucun accès à la boîte mail utilisée pour les tests |
