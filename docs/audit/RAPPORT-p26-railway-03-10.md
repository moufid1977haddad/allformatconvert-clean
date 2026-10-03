# RAPPORT P26 — services Railway : sécurité Gotenberg, PDF/A 2u/3u/2a/3a, DOC, gros RTF (03/10)

Demandé par le propriétaire (prompt P26), mises en production comprises, y compris en son absence. Branche
`p26-railway`, repère de restauration `restauration-avant-p26-03-10` = `11910e7a` (master avant P26). Autorisation
Railway de ce chantier : Gotenberg, pdf-tools, service média, leurs réglages et variables de lancement nécessaires,
version précédente notée, nouveau comportement vérifié en ligne avant de brancher les pages, aucune autre variable,
aucun nouveau service payant. Rapport complété après chaque lot.

Outils : Railway par la CLI officielle déjà connectée (`npx @railway/cli`, compte du propriétaire), lecture de l'API
Railway (mêmes droits) ; aucun identifiant affiché ni écrit (les scripts lisent les variables en mémoire).

## 0. Récapitulatif

| Lot | Contenu | État |
|---|---|---|
| 1 | Gotenberg : adresses privées interdites (+ webhook, downloadFrom) | ✅ **en production** (Railway `gotenberg-v2` déploiement `930bc129`, 03/10 23 h 54 UTC) |
| 2 | E2 : PDF/A 2u, 3u, 2a, 3a | en cours |
| 3 | E1 : DOC, RTF > 4 Mo | à faire |

## 1. Lot 1 — Gotenberg : un fichier HTML déposé ne peut plus faire charger une adresse interne

### 1.1 État lu avant de toucher (règle zéro, corollaire 5)
- Railway, projet `fortunate-manifestation`, environnement `production` : `gotenberg-v2` (production : les journaux
  montrent les appels de Vercel ; 1 réplica ; image `gotenberg/gotenberg:8.36.0@sha256:87c16b9f…` de
  `services/gotenberg/Dockerfile`, déploiement `515a1679` du 22/09) et `gotenberg-fonts` (même dossier, même image ;
  ne reçoit que les appels de la machine locale — bancs —, c'est le filet de repli de 2026-09-18).
- Variables de `gotenberg-v2` : valeurs propres (aucune référence vers `gotenberg-fonts`, vérifié par l'API).
- Version la plus récente de Gotenberg : 8.37.0 (11/09). Drapeaux vérifiés **dans le code source de 8.36.0** (pas
  seulement dans la documentation, qui suit la dernière version) : `chromium-deny-private-ips`,
  `libreoffice-deny-private-ips`, `webhook-deny-private-ips`, `api-download-from-deny-private-ips`, `webhook-disable`,
  `api-disable-download-from` existent tous.

### 1.2 Mesure de la faille (avant, sur `gotenberg-fonts`, configuration identique à la production)
`scripts/p26/gotenberg-probe.mjs` envoie à Gotenberg, comme nos routes, une page HTML « déposée » qui contient une
iframe vers une adresse, puis lit le texte du PDF. **Avant** : le PDF imprimait la réponse de `127.0.0.1:3000`,
`localhost`, `[::1]`, `[::ffff:127.0.0.1]`, `0.0.0.0`, `gotenberg-v2.railway.internal`, `gotenberg-fonts.railway.internal`,
**pdf-tools** (`allformatconvert-clean.railway.internal:8080/health` : versions de Ghostscript, qpdf, veraPDF) et le
**service média** (`media-processing.railway.internal:8080/health`). `169.254.169.254` : délai dépassé. Un webhook
vers la boucle locale était accepté (204). Le constat de P25 est donc confirmé par l'expérience.

### 1.3 Ce qui est activé (variables de lancement, l'équivalent des drapeaux, sur les deux Gotenberg)
| Variable | Rôle |
|---|---|
| `CHROMIUM_DENY_PRIVATE_IPS=true` | Chromium refuse toute navigation ou ressource dont l'adresse résolue n'est pas publique (boucle locale, RFC 1918, lien local, IPv6 locales, IPv4 cachées dans IPv6) ; depuis 8.32 un mandataire interne résout le nom une fois et se connecte à l'adresse vérifiée (pas de « DNS rebinding ») |
| `LIBREOFFICE_DENY_PRIVATE_IPS=true` | même règle pour ce que LibreOffice irait chercher depuis un document Office |
| `WEBHOOK_DENY_PRIVATE_IPS=true`, `API_DOWNLOAD_FROM_DENY_PRIVATE_IPS=true` | les deux autres modules sortants (configuration recommandée par la documentation de Gotenberg pour un service exposé : les quatre) |
| `WEBHOOK_DISABLE=true`, `API_DISABLE_DOWNLOAD_FROM=true` | ces deux fonctions ne servent pas au site (aucun usage dans le code, vérifié) : fermées |
| `CHROMIUM_DENY_LIST=^file:(?!//\/tmp/).*,^[a-z]+://([^/]*@)?(100\.(6[4-9]\|[7-9][0-9]\|1[01][0-9]\|12[0-7])\|198\.1[89])\.` | la règle par défaut de Gotenberg (`file://` hors du dossier de la conversion) **gardée**, plus les plages 100.64.0.0/10 et 198.18.0.0/15 écrites en clair, que 8.36.0 ne classe pas encore comme internes (8.37.0 le fait) |

**Pourquoi pas la 8.37.0 maintenant** : elle change Chromium (152) et LibreOffice (26.8) — le résultat des conversions
ne serait plus le même, contraire à la demande. Ce qui reste ouvert en 8.36.0 (revue indépendante, gravité moyenne) :
un nom DNS public qui ne pointerait que sur une adresse 100.64/10 ou 198.18/15 (Railway ne documente pas sa plage IPv4
interne ; les noms `*.railway.internal` ont aussi une adresse IPv6 interne et sont refusés, mesuré). **À faire dans un
chantier à part** : passer à 8.37.0 sur `gotenberg-fonts` d'abord, banc des 18 documents au pixel, puis production.

### 1.4 Mise en ligne sans coupure
Suivant `RAPPORT-gotenberg-versionne.md` (nouvelle version d'abord à côté de la production, ancienne gardée en repli,
production en dernier) : le service « à côté » est `gotenberg-fonts`, déjà existant et sans trafic de production ; pas
de nouveau service (aucun coût en plus) ni de variable Vercel touchée.
1. `gotenberg-fonts` : variables posées → redéploiement `08ac2455` puis `55fa4c41` (liste de refus).
2. Mesure complète sur `gotenberg-fonts` (ci-dessous), revue indépendante (§1.6), puis
3. `gotenberg-v2` : mêmes variables → Railway construit, attend le `/health`, puis bascule (`930bc129`, 23 h 54 UTC).
**Retour arrière prêt** : Railway → `gotenberg-v2` → déploiement `515a1679` → « Rollback » (restaure l'image ET les
variables d'avant) ; ou retirer les 7 variables.

### 1.5 Preuves (après)
- **Refus** (`gotenberg-fonts` puis `gotenberg-v2` en production) : les 13 adresses — les 10 ci-dessus + 100.64.0.1,
  198.18.0.1, `file:///etc/hostname` — ne sont plus imprimées ; les journaux de Gotenberg disent « targets a non-public
  address » ou « matches the expression from the denied list ». 169.254.169.254 est refusé tout de suite (plus d'attente
  de 60 s). Webhook : ignoré (PDF rendu directement) ; downloadFrom : ignoré.
- **Le public marche toujours** : `example.com` en iframe, une police Google Fonts et une image publique chargées.
- **Mêmes résultats qu'avant** (`scripts/p26/compare-pdfs.mjs` : nombre et taille des pages, texte `pdftotext`, chaque
  page rendue à 72 dpi **au pixel près** ; méthode d'abord vérifiée sur deux passages « avant » identiques) :
  - 18 conversions directes — Word (docx ×3, odt, rtf), Excel (xlsx ×4, xls), PowerPoint (pptx ×3), HTML ×3 (dont celui
    du banc de fidélité et un fichier qui charge police et image publiques), le HTML que nos pages EPUB et MOBI
    construisent (capturé par `capture-book-html.mjs`) : **18/18 identiques** sur `gotenberg-fonts` et sur `gotenberg-v2` ;
  - **www**, une vraie conversion par outil par les pages (`gotenberg-tools-www.mjs`) : Word (.odt), Excel, PowerPoint,
    HTML déposé, EPUB, MOBI, URL → PDF : **7/7 réussies et identiques** à la référence prise avant le changement.
- Le contrôle cron `/health` appelle Gotenberg directement (pas par Chromium) : non concerné, `/health` répond `up`.

**Dépense imprévue, signalée** : la première référence www de Word to PDF a été faite avec un `.docx` — en production
le `.docx` passe par **ConvertAPI** (`CONVERTAPI_ENABLED`), pas par Gotenberg : **1 conversion ConvertAPI (≈ 0,01 $)**.
Le banc utilise désormais un `.odt` (Gotenberg).

### 1.6 Revue indépendante (sécurité, obligatoire)
Verdict : feu vert, aucun point critique. Points retenus et traités : liste de refus de Chromium pour 100.64/10 et
198.18/15 en gardant la règle `file://` par défaut (fait, vérifié) ; vérifier que `gotenberg-v2` n'avait pas bougé avec
`gotenberg-fonts` et n'utilise pas de références (vérifié) ; même image après reconstruction (prouvé par les 18 + 7
documents identiques au pixel). Points restants, mineurs : JavaScript reste actif dans Chromium (les envois UDP de
WebRTC ne passent pas par le mandataire, mais aucune réponse ne peut être imprimée ; couper JavaScript pourrait changer
des pages déposées, non fait) ; montée en 8.37.0 (§1.3).

### 1.7 Facture Railway
Aucun service ajouté. Mesure mémoire / processeur : §6.
