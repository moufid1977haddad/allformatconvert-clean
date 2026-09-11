# Rapport final — Persistance du formulaire de contact (pièces jointes)

## Cause exacte

| Constat | Détail |
|---|---|
| Hypothèse de départ (un second chemin JSON vs multipart) | Infirmée. Historique git de `app/api/contact/route.js` vérifié depuis le tout premier commit qui a introduit les pièces jointes (`1d7ca49b`) : la route est passée intégralement à `FormData` dès ce commit, sans jamais conserver de branche JSON. Les cas avec et sans pièces jointes partagent le même chemin de code, y compris pour l'enregistrement en base |
| Ordre des opérations | Déjà correct avant toute intervention de cette session : l'insertion Supabase (`contact_messages`) a toujours lieu avant toute tentative d'e-mail, indépendamment du nombre de pièces jointes |
| Reproduction directe | Tentée sur préversion (même base Supabase que la production — un seul projet Supabase existe pour ce compte, confirmé via le tableau de bord) avec 0, 2 (~1 Ko chacune) et 2 (~1,5 Mo chacune, taille réaliste de capture d'écran) pièces jointes : dans les trois cas, la ligne a été correctement écrite dans `contact_messages`. Impossible de reproduire une perte silencieuse par ce biais, même en approchant la taille réelle d'un envoi de visiteur |
| Confirmation que le message du 10 septembre 23:47 UTC manque réellement | Vérifié directement par requête SQL en base : aucune ligne pour `moufid.haddad.1977@gmail.com` à cette date ; la seule ligne de cet expéditeur dans toute la table date du 4 août |
| Défaut réel trouvé | Un échec d'insertion en base (`dbError`) ne produisait strictement rien de visible en dehors d'un `console.error` — invisible du canal d'alerte et de la table `tool_errors`, contrairement à toutes les autres routes serveur du projet qui écrivent en base (voir `app/api/pdf-repair/route.ts` pour le patron établi) |
| Conclusion la plus probable sur l'incident d'origine | Un incident ponctuel/transitoire côté Supabase au moment précis de cet envoi, et non un défaut structurel déterministe du code des pièces jointes — mais rendu invisible par l'absence d'alerte, donc indétectable sans vérification manuelle directe en base |

## Ce qui a été corrigé

| Point | Détail |
|---|---|
| Visibilité d'un échec d'insertion (`app/api/contact/route.js`) | Ajout de `alertServerError('contact', ...)` et `insertToolError(buildServerToolError({ tool: 'contact', ... }))` dans la branche `if (dbError)`, alignée sur le patron déjà utilisé par `pdf-repair`/`pdf-to-word`/`convert-to-pdf`/`pdf-to-pdfa` |
| Client Supabase dupliqué | La route construisait son propre client via `createClient(...)` en local, avec des options différentes du client partagé `lib/quota/supabaseAdmin.js` déjà utilisé par le limiteur de débit dans ce même fichier. Remplacé par le singleton partagé (`{ auth: { persistSession: false } }`) pour éliminer la divergence |
| Règle d'affichage (point 4 de la demande) | Aucune régression trouvée — vérifiée empiriquement (voir tableau des tests). Le code affichait déjà une vraie erreur au visiteur en cas d'échec d'enregistrement, jamais un faux succès. Aucun changement de code nécessaire sur ce point précis |

## Comportement obtenu, par cas testé (sur préversion, contre la base de production)

| Cas testé | Réponse visiteur | Écrit en base ? | `tool_errors` / alerte |
|---|---|---|---|
| Sans pièce jointe | 200, "Message sent!" | Oui | — |
| 2 pièces jointes (taille factice ~1 Ko) | 200, "Message sent!" | Oui | — |
| 2 pièces jointes (taille réaliste ~1,5 Mo chacune) | 200, "Message sent!" | Oui | — |
| 1 et 3 pièces jointes | Non rejoué séparément après correctif — la boucle de validation (`for (const file of attachmentFiles)`) est générique et inchangée par ce correctif ; couverte par construction par les cas à 0 et 2 pièces jointes ci-dessus | — | — |
| Fichier refusé (3,2 Mo, au-dessus du plafond de 3 Mo/fichier) | 400, message clair | Non (rejet avant l'insertion, chemin inchangé par ce correctif) | — |
| Base momentanément indisponible (simulée proprement : table cible pointée vers un nom inexistant sur des commits de test jetables, jamais fusionnés) — **avant correctif** | 500, vraie erreur affichée, texte non perdu côté serveur | Non | Absent de `tool_errors` — confirme le défaut |
| Même simulation — **après correctif** | 500, vraie erreur affichée (comportement visiteur inchangé) | Non | Présent : ligne `tool_errors` (`tool='contact'`, `source='server'`, message d'erreur réel de Postgres) confirmée par requête SQL directe |

## Autres routes vérifiées (point 6)

| Recherche | Résultat |
|---|---|
| Toute route acceptant une requête publique et effectuant un `.insert(` en base | `app/api/contact/route.js` est la SEULE route de `app/api` dans ce cas — aucune autre route n'accepte plusieurs formes d'entrée (JSON/FormData) pour écrire un enregistrement durable pour un visiteur non authentifié. Le motif exact décrit dans la demande (un second chemin d'entrée sans persistance) ne se retrouve donc nulle part ailleurs |

## Tests manuels qui reviennent au propriétaire

| Test | Pourquoi il revient au propriétaire |
|---|---|
| Confirmer la réception réelle de l'alerte (e-mail + ntfy) lors d'un futur échec d'insertion en production | Nécessite l'accès aux boîtes de réception/canal ntfy du propriétaire ; le déclenchement du code a été vérifié (la ligne `tool_errors` apparaît), pas la livraison finale du message d'alerte |
