# RAPPORT — P36 : certificat HTTPS, contenu exact des 225 pages, pages légales et À propos, Analytics Europe, éditeur PDF arabe (06/10)

Branche `p36`, repère de restauration `restauration-avant-p36-06-10` = `f7f0601e`. Rapport rempli lot par lot.

## Lot 0 — certificat HTTPS (NET::ERR_CERT_AUTHORITY_INVALID signalé le 06/10 vers 15 h 38, heure du Québec)

**Conclusion : rien de faux de notre côté ; l'erreur vient très probablement du poste ou du réseau du visiteur.**

Constat (05/10 au soir, heure du Québec) :
- **Certificats servis** (`openssl s_client -showcerts`, sur les 4 adresses IP de Vercel pour chaque nom) :
  `www.onlineconvertools.com` → feuille `CN=www.onlineconvertools.com`, émise par **Let's Encrypt YR2**, valide du
  **08/08/2026 au 06/11/2026** ; domaine nu → `CN=onlineconvertools.com`, Let's Encrypt YR2, **07/08 → 05/11/2026**.
  Chaîne **complète** envoyée par le serveur : feuille → YR2 → ISRG Root YR (croisée par **ISRG Root X1**). Vérification
  OpenSSL : `0 (ok)` partout. TLS 1.3.
- **SSL Labs** (Qualys, 05/10) : www **A+** (216.150.16.193) et **A** (216.150.1.193), **0 problème de chaîne**, chemin
  de confiance valide dans les magasins **Mozilla, Apple, Android et Java**.
- **crt.sh** (journaux de transparence) : seuls certificats valides pour le domaine : les deux Let's Encrypt YR2 ci-dessus
  (émis par Vercel), plus deux certificats génériques `*.onlineconvertools.com` du **05/08** (Google Trust Services WE1 et
  Let's Encrypt YE2) — ceux que Cloudflare émet pour une zone qu'il gère (« Universal SSL ») ; ils ne sont servis que si
  un enregistrement passe par le proxy Cloudflare, ce qui n'est pas le cas aujourd'hui. Aucun certificat d'un émetteur
  inconnu.
- **DNS** (lu par DNS-over-HTTPS) : NS Cloudflare (`lamar`, `tani`) ; domaine nu `A 216.150.1.193, 216.150.16.193` ;
  www `CNAME 638aeebda7ed56d7.vercel-dns-017.com` → `216.150.1.1, 216.150.16.1` : adresses **Vercel**, donc Cloudflare en
  **DNS seul** (pas de proxy, sinon on verrait des adresses Cloudflare). Pas d'AAAA. **CAA** : aucune sur le domaine nu
  (toute autorité permise) ; sur www, celles de Vercel (letsencrypt.org, pki.goog, sectigo.com, globalsign.com) : rien ne
  bloque l'émission.
- **HSTS** : `max-age=63072000` (2 ans), sans `includeSubDomains` ni `preload`. **Redirections** : https nu → https www
  (308, 1 saut) ; http nu → https nu → www (2 sauts, connu, S7 de l'audit).

Pourquoi le visiteur a pu voir l'erreur : `ERR_CERT_AUTHORITY_INVALID` = Chrome ne reconnaît pas l'autorité de la chaîne
qu'il reçoit. La nôtre est reconnue par tous les magasins actuels ; le même certificat était servi le 06/10 (émis le
08/08). Les causes habituelles, toutes du côté du visiteur : un **antivirus qui inspecte le HTTPS** (Avast, Kaspersky,
ESET, Bitdefender… remplacent le certificat par le leur), un **réseau d'entreprise ou d'école** qui intercepte le trafic,
un **Wi-Fi public avec portail captif** (hôtel, café) avant connexion, ou un appareil très ancien dont le magasin ne
contient pas ISRG Root X1 (Android antérieur à 7.1.1 avec un vieux Chrome). Une horloge fausse donne en général
`ERR_CERT_DATE_INVALID`, pas celle-ci. **Aucune correction à faire chez Vercel, Cloudflare ou dans le DNS.** Si le
propriétaire peut joindre le visiteur : lui demander l'émetteur affiché en cliquant sur « Non sécurisé » → certificat
(le nom de son antivirus ou de son réseau y apparaîtra).

**Ajouté** : le contrôle quotidien (`/api/cron/health-check`, 08 h UTC) vérifie maintenant le certificat de www **et** du
domaine nu (`lib/certCheck.js`) : chaîne non reconnue par le magasin de Node (Mozilla), **expiration à moins de 14
jours**, émetteur autre que Let's Encrypt (un certificat Google Trust Services voudrait dire que le proxy Cloudflare a été
allumé), nom non couvert. Alerte **ntfy + courriel** sur le canal existant, une fois par incident puis au retour à la
normale (`checkStateTransition`). Test `scripts/p36/cert-check.test.mjs` **17/17** : verdicts purs + vraie poignée de main
(nos deux noms : 32 et 30 jours restants ; 4 certificats cassés de badssl.com tous signalés : racine inconnue, expiré, nom
faux, autosigné). À noter : Vercel renouvelle normalement vers 30 jours avant l'échéance ; si l'alerte « 13 days left »
arrive, le renouvellement a échoué.
