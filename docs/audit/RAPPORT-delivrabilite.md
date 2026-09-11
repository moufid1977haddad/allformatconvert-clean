# Audit de délivrabilité — onlineconvertools.com

Diagnostic réalisé le 2026-09-10 via résolveur DNS public (Google DoH, `dns.google/resolve`), indépendant du cache DNS local. Déclencheur : alerte `alerts@onlineconvertools.com` → `contact@onlineconvertools.com` classée spam le 2026-09-01.

## 1. État DNS constaté

### Domaine racine `onlineconvertools.com`

| Enregistrement | Type | Valeur trouvée |
|---|---|---|
| SPF | TXT | `v=spf1 include:_spf.google.com ~all` |
| DKIM Google (`google._domainkey`) | TXT | **absent** (NXDOMAIN) |
| DKIM Resend (`resend._domainkey`) | TXT | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCtWpuV7b46pR93/msLiIyhSkKFwq8YJP4wj36JsRAqZqpfOLeLm+/TlW0uknfeQeIbcZdKXNC1DuJ1lbPXdUj7cB+ur/ysqU8ROggi9FUuMB7E1Mx2/R87oX5iylbT4DjSEkX7i6LR5w2Po6wYZ4GIsawlFyUHzOxPc+X4/vPLHwIDAQAB` (présent, RSA valide) |
| DMARC (`_dmarc`) | TXT | `v=DMARC1; p=none; rua=mailto:contact@onlineconvertools.com; fo=1` |
| MX | MX | `1 aspmx.l.google.com`, `5 alt1.aspmx.l.google.com`, `5 alt2.aspmx.l.google.com`, `10 alt3.aspmx.l.google.com`, `10 alt4.aspmx.l.google.com` |

### Sous-domaine `send.onlineconvertools.com` (config Resend partielle, orpheline)

| Enregistrement | Type | Valeur trouvée |
|---|---|---|
| SPF | TXT | `v=spf1 include:amazonses.com ~all` |
| MX | MX | `10 feedback-smtp.us-east-1.amazonses.com` |
| DKIM Resend (`resend._domainkey.send.onlineconvertools.com`) | TXT | **absent** (NXDOMAIN) |

### Code applicatif (référence, pas du DNS)

`lib/alert.js` et `app/api/contact/route.js` envoient tous les deux via Resend avec `from: alerts@${RESEND_EMAIL_DOMAIN}` / `contact@${RESEND_EMAIL_DOMAIN}`. D'après l'adresse réelle observée dans l'alerte du 1er septembre (`alerts@onlineconvertools.com`), `RESEND_EMAIL_DOMAIN` est positionné sur le domaine **racine**, pas sur `send.onlineconvertools.com`.

## 2. Ce qui cloche

| Constat | Impact |
|---|---|
| Le SPF du domaine racine n'autorise que `_spf.google.com`. Resend envoie via Amazon SES (IP hors de cette plage) → **échec SPF** sur tout mail envoyé par `alerts@` / `contact@onlineconvertools.com`. | Signal négatif fort pour les filtres anti-spam (Gmail, etc.), même si le DKIM aligné compense côté DMARC. |
| Le DKIM Resend existe côté racine (`resend._domainkey.onlineconvertools.com`) — donc le domaine racine a bien été vérifié directement dans Resend, indépendamment du sous-domaine `send.*`. | La signature DKIM passe et aligne avec le From (`onlineconvertools.com`), donc DMARC passe déjà **par DKIM seul**. Mais un SPF cassé reste un signal négatif indépendant du verdict DMARC. |
| Un sous-domaine `send.onlineconvertools.com` porte un SPF + MX Amazon SES corrects (configuration Resend "sous-domaine dédié" classique) mais **sans son propre DKIM** — configuration commencée puis abandonnée, ou domaine Resend jamais retiré du tableau de bord. | Config orpheline : inoffensive telle quelle (rien n'envoie depuis ce sous-domaine), mais source de confusion et incomplète si jamais réactivée. |
| DMARC en `p=none` : mode observation seul, aucune politique de rejet/mise en quarantaine appliquée par les serveurs qui respectent DMARC. | N'aggrave pas le problème mais ne protège pas non plus — normal en phase de stabilisation, à durcir une fois le SPF corrigé et les rapports agrégés propres pendant 1–2 semaines. |
| Aucun enregistrement `google._domainkey` (DKIM Google Workspace) trouvé au niveau racine. | N'affecte pas Resend, mais signifie que le courrier humain envoyé depuis Gmail/Workspace ne signe pas non plus en DKIM — dépend uniquement du SPF Google pour l'alignement DMARC. Point distinct, à corriger dans la console Google Workspace (Authentification des e-mails → activer DKIM), hors du périmètre Resend. |

## 3. Comparaison à la documentation Resend

Sources consultées : [documentation domaines Resend](https://resend.com/docs/dashboard/domains/introduction), et une synthèse à jour de leurs pré-requis DNS ([GetFluxly — Resend domain verification](https://www.getfluxly.com/blog/resend-domain-verification-dns), [GetFluxly — sélecteur DKIM Resend](https://www.getfluxly.com/blog/resend-dkim-selector), [dmarc.wiki/resend](https://dmarc.wiki/resend)).

- Resend recommande explicitement d'envoyer depuis **un ou plusieurs sous-domaines dédiés** (ex. `send.example.com`) plutôt que depuis le domaine racine, "pour isoler la réputation d'envoi" (citation de leur doc : *"We recommend sending your emails from one or more subdomains ... instead of your root domain"*).
- Le schéma "classique" Resend (celui observé ici) exige, **sur le sous-domaine choisi** : un MX vers `feedback-smtp.<région>.amazonses.com` (priorité 10), un TXT SPF `v=spf1 include:amazonses.com ~all`, et un TXT DKIM `resend._domainkey.<sous-domaine>` avec la clé fournie par leur tableau de bord.
- Constat exact ici : le sous-domaine `send.onlineconvertools.com` a le MX et le SPF de ce schéma, **mais pas le DKIM au bon endroit** — celui-ci a été publié sur la racine à la place. Autrement dit, deux vérifications Resend ont eu lieu (une sur la racine, une sur le sous-domaine), et seule celle de la racine est complète.

## 4. Comparaison au marché (courrier humain + transactionnel sur un même domaine)

- **Google Workspace / Google Postmaster** recommande d'aligner SPF, DKIM et DMARC pour *tout* expéditeur utilisant le domaine, humain ou automatisé, et insiste sur le fait qu'un domaine qui échoue SPF/DKIM pour une partie de son trafic dégrade la réputation globale du domaine — y compris pour le courrier humain légitime envoyé depuis Workspace.
- **Resend, Postmark, SendGrid et Mailgun** convergent tous sur la même recommandation : isoler l'envoi transactionnel/automatisé sur un sous-domaine dédié (`mail.`, `send.`, `notifications.`, etc.), précisément pour qu'un incident de réputation (plaintes, bounces, mauvais contenu) sur le canal automatisé n'affecte jamais le domaine racine qui porte la messagerie humaine — et inversement.
- **Dans ce cas précis**, le domaine racine est déjà correctement vérifié côté Resend (DKIM présent, fonctionnel) — la faille n'est qu'un SPF incomplet. Compléter le SPF racine résout l'incident immédiatement, sans changer d'adresse d'expédition ni toucher au code. C'est le correctif recommandé **à court terme**.
- **À moyen terme**, migrer vers `send.onlineconvertools.com` (déjà à moitié configuré) reste la meilleure pratique du marché pour séparer durablement la réputation "conversation humaine" (Workspace) de la réputation "alertes techniques/notifications" (Resend). Ce n'est pas urgent : ça demande une clé DKIM neuve à récupérer dans le tableau de bord Resend (impossible à deviner depuis le DNS public) et un changement de `RESEND_EMAIL_DOMAIN` + adresses `from` dans le code.

## 5. Enregistrements DNS à créer/modifier chez Cloudflare

| Action | Type | Nom | Valeur | Priorité | Corrige quoi |
|---|---|---|---|---|---|
| **Modifier** | TXT | `onlineconvertools.com` (root) | `v=spf1 include:_spf.google.com include:amazonses.com ~all` | — | Autorise Amazon SES (infrastructure de Resend) à envoyer pour le domaine racine → le SPF ne rate plus pour `alerts@` et `contact@onlineconvertools.com`. Remplace l'enregistrement SPF actuel (un seul TXT `v=spf1...` doit exister par domaine — ne pas en ajouter un second). |

Aucun autre enregistrement n'est requis pour corriger l'incident du 1er septembre : le DKIM racine est déjà correct, le DMARC existant (`p=none`) reste adapté le temps de confirmer que le SPF passe proprement.

**Optionnel, non bloquant** — nettoyage du sous-domaine orphelin `send.onlineconvertools.com` : soit le supprimer du DNS (MX + TXT SPF) si le projet Resend correspondant est abandonné dans leur tableau de bord, soit le compléter plus tard (DKIM à récupérer dans Resend) si vous décidez de migrer l'envoi transactionnel dessus. Aucune valeur ne peut être devinée pour cette deuxième option — elle est générée par Resend au moment où vous ajoutez/re-vérifiez ce domaine dans leur dashboard.

**Hors périmètre Resend, à votre discrétion** — activer le DKIM Google Workspace (console admin Google → Applications → Gmail → Authentification des e-mails) pour que le courrier humain envoyé depuis Workspace signe aussi en DKIM, pas seulement en SPF.

## 6. Contenu des e-mails (code)

| Point vérifié | Constat | Action |
|---|---|---|
| Cohérence nom affiché / adresse réelle | `OnlineConverTools Alerts <alerts@domaine>`, `OnlineConverTools Contact <contact@domaine>` — nom et domaine cohérents, pas d'usurpation apparente. | Aucune correction nécessaire. |
| Ratio texte/HTML | Tous les envois (`lib/alert.js`, `app/api/contact/route.js`) sont en texte brut pur, sans HTML. Un e-mail 100% texte, court, sans lien suspect ni pièce jointe pour les alertes, n'est pas un facteur aggravant pour un volume transactionnel/interne comme celui-ci. | Aucune correction nécessaire. |
| `List-Unsubscribe` | Absent sur toutes les routes. Pertinent surtout pour l'envoi en masse (seuil Gmail/Yahoo : ≥5000 messages/jour) ou les newsletters ; ici il s'agit d'alertes internes 1:1 et de réponses de formulaire de contact — pas un cas d'usage "liste de diffusion". L'ajouter sans mécanisme de désabonnement réel serait un ajout artificiel. | Pas d'ajout — hors périmètre au volume actuel. |
| `Reply-To` | Notification propriétaire : `replyTo: email` (visiteur) ; accusé de réception visiteur : `replyTo: ownerEmail`. Alertes techniques : pas de `replyTo` (adresse système, comportement correct). | Aucune correction nécessaire. |
| Sujets avec emoji | Un seul emoji de statut en tête de sujet (`✅`, `🚨`, `⚠️`, `🔴`, `📊`, `🧪`) — usage modéré et informatif, pas un pattern connu pour faire monter un score spam à lui seul. | Aucune correction nécessaire. |

**Aucune correction de code n'a été appliquée** : la revue de contenu ne révèle rien qui contribue à l'incident du 1er septembre. La cause est intégralement le SPF racine incomplet (§2).

## 7. Procédure de vérification (à votre charge)

| Étape | Comment |
|---|---|
| 1. Appliquer le changement SPF | Dans Cloudflare, modifier le TXT existant à la racine par la valeur du §5. Ne pas créer de second enregistrement SPF. |
| 2. Attendre la propagation | TTL actuel 3600s (1h) — patientez au moins ce délai avant de tester. |
| 3. Vérifier la syntaxe SPF | [mxtoolbox.com/spf.aspx](https://mxtoolbox.com) → entrer `onlineconvertools.com` → confirmer qu'un seul enregistrement SPF est vu et qu'il "passe" la validation syntaxique, et que le compteur de lookups DNS reste bien en dessous de 10 (attendu : 5). |
| 4. Test d'envoi réel contrôlé | Envoyer un e-mail de test vers un compte [mail-tester.com](https://www.mail-tester.com) depuis Resend en utilisant exactement `alerts@onlineconvertools.com` (ex. déclencher `sendAlert('test', 'ok')` une seule fois, manuellement, pas en boucle). Viser un score **9/10 ou 10/10** ; vérifier dans le détail du rapport que SPF, DKIM et DMARC sont tous les trois au vert. |
| 5. Test réel en conditions de production | Déclencher une alerte réelle (ou soumettre le formulaire de contact) et vérifier qu'elle arrive dans la boîte de réception `contact@onlineconvertools.com`, pas dans "Indésirables". Dans Gmail, ouvrir le message reçu → "Afficher l'original" → confirmer `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`. |
| 6. Suivi DMARC (optionnel, sur 1–2 semaines) | Les rapports agrégés arrivent par e-mail à `contact@onlineconvertools.com` (`rua=mailto:contact@...`). Un outil comme [dmarcian's XML viewer](https://dmarcian.com/xml-viewer/) permet de les lire sans les décoder à la main. Une fois SPF/DKIM constatés systématiquement au vert, envisager de faire passer `p=none` à `p=quarantine` pour un vrai apport de protection anti-usurpation. |
