# Rapport — Remontée automatique des échecs

Branche : `feat/error-reporting`. Plan : `docs/superpowers/plans/2026-09-08-error-reporting.md`. Suivi de reprise détaillé : `docs/audit/PROGRESS-remontee-erreurs.md`.

## Solution retenue et pourquoi

| Critère | Sentry (offre gratuite) | Point de collecte maison (retenu) |
|---|---|---|
| Confidentialité | Tiers qui reçoit le payload avant toute possibilité de nettoyage côté SDK garanti ; scrubbing configurable mais le service reste un data processor externe (US par défaut, résidence EU en option payante/complexe) | Aucune donnée ne quitte l'infrastructure déjà nommée dans la politique de confidentialité (Vercel + Supabase) |
| Coût | Palier gratuit = 5 000 événements/mois, coupure nette au-delà (pas de dépassement silencieux, mais plan payant à partir de $26/mois pour 50k événements) | $0 marginal — réutilise la table Supabase, `lib/alert.js` (Resend + ntfy) et le cron existants, déjà payés |
| Effort | Le travail difficile (ne jamais transmettre nom de fichier/contenu) doit être réécrit à la main de toute façon pour ffmpeg.wasm/UTIF2/Tesseract.js — Sentry ne le fait pas pour nous | Même travail de sanitisation, mais un seul système au lieu de deux (Sentry + Supabase aurait quand même été nécessaire pour le point 5 du cahier des charges) |

Sources consultées : [Sentry Pricing 2026 — Last9](https://last9.io/blog/sentry-pricing/), [FreeTier.co — Sentry](https://freetier.co/directory/products/sentry), [Sentry — Protecting User Privacy](https://docs.sentry.io/security-legal-pii/scrubbing/protecting-user-privacy/), [Sentry and Your Data](https://sentry.io/trust/privacy/), [Is Sentry GDPR Compliant? — ComplyDog](https://complydog.com/blog/is-sentry-gdpr-compliant).

## Architecture retenue

| Composant | Fichier | Rôle |
|---|---|---|
| Table Supabase | `supabase/tool_errors.sql` | Stockage, service-role uniquement (RLS activé, aucune policy) |
| Module partagé client+serveur | `app/lib/reportError.js` | Sanitisation (`sanitizeErrorMessage`), tranche de taille (`sizeBucket`), extension (`extOf`), navigateur (`parseBrowserLabel`), envoi non bloquant (`reportToolError`, `sendBeacon`/`fetch keepalive`) |
| Module serveur | `lib/reportError.js` | `insertToolError` (validation stricte + re-sanitisation inconditionnelle), `buildServerToolError` (pour les routes serveur) |
| Rate limiter dédié | `lib/quota/toolErrorRateLimit.js` | Bucket IP-hash séparé du budget des routes payantes |
| Route de collecte | `app/api/report-error/route.js` | Publique, non authentifiée, protégée (rate limit, liste blanche stricte, taille max) — relue indépendamment |
| Agrégation | `app/api/cron/health-check/route.ts` | Ajout à l'intérieur du cron quotidien existant, aucun nouveau job |

## Champs exactement transmis

| Champ | Type / format | Jamais transmis |
|---|---|---|
| `tool` | slug (`^[a-z0-9-]{1,60}$`) | — |
| `source` | `"browser"` (route publique) ou `"server"` (insertion directe) | — |
| `ext` | extension en minuscules, alphanumérique, ≤10 car., ou `null` | — |
| `sizeBucket` | une de `0-1MB`, `1-10MB`, `10-50MB`, `50-200MB`, `200MB+` | Taille exacte de l'octet |
| `errorType` | ex. `"Error"`, `"RangeError"` (≤60 car.) | — |
| `errorMessage` | message nettoyé (chemins/noms de fichiers remplacés par `[path]`/`[file]`), ≤300 car., re-nettoyé côté serveur systématiquement | Nom de fichier réel, contenu du fichier, texte extrait/reconnu par OCR |
| `browser` | nom + version majeure (ex. `"Chrome 129"`) | Chaîne User-Agent complète |
| `created_at` | horodatage, généré par la base | — |
| — | — | Le fichier lui-même, une partie de son contenu, l'adresse IP en clair |

## Outils instrumentés (19 outils navigateur + 5 routes serveur)

| Catégorie | Outils | Mécanisme |
|---|---|---|
| TIFF | tiff-to-png, tiff-to-jpg, image-converter | Worker partagé (`app/lib/tiffDecode.js`), timeout/erreur/onerror |
| HEIC | heic-to-jpg, heic-to-png | `heic2any`, bloc `catch` |
| Audio/vidéo (ffmpeg.wasm) | audio-converter, audio-compressor, audio-booster, audio-splitter, audio-trimmer, audio-merger, video-to-audio, video-watermark, gif-to-mp4 | Bloc `catch` de chaque outil ; `audio-merger` sans fichier unique identifiable (fusion) |
| PDF (client) | pdf-ocr, pdf-to-image, pdf-to-jpg, pdf-extract-text | pdfjs-dist / Tesseract.js ; seule l'erreur de décodage est transmise, jamais le texte extrait/reconnu |
| Archive | zip-extractor | JSZip, bloc `catch` |
| Serveur | pdf-repair, pdf-to-pdfa, convert-html-to-pdf, convert-to-pdf (Gotenberg + ConvertAPI), pdf-to-word | `insertToolError` sur chaque branche d'échec réel (service injoignable, réponse invalide, timeout) |

## Alerte serveur (point 3 du cahier des charges) — routes désormais couvertes

| Route | Mécanisme réutilisé |
|---|---|
| pdf-repair | `alertServerError` (`lib/quota/errorAlerts.js`, déjà existant, throttlé 1/heure/route) |
| pdf-to-pdfa | idem |
| convert-html-to-pdf | idem |
| convert-to-pdf (chemin Gotenberg — le chemin ConvertAPI avait déjà `alertServerError`) | idem |

`pdf-to-word` avait déjà `alertServerError` avant ce chantier ; seule la journalisation `tool_errors` y a été ajoutée.

## Seuil d'alerte et sa justification

| Paramètre | Valeur | Justification |
|---|---|---|
| Fenêtre | 24h glissantes, vérifiée une fois par jour | Le cron Vercel (plan Hobby) ne peut tourner qu'une fois par jour (`vercel.json` : `0 8 * * *`) — réutilise ce cron plutôt que d'en créer un nouveau |
| Seuil | ≥10 échecs / outil / 24h (`TOOL_ERROR_ALERT_THRESHOLD_PER_DAY`, surchargeable par variable d'environnement) | En dessous du volume que produirait un seul visiteur confus qui retente plusieurs fois avant d'abandonner ; largement au-dessus de ce qu'un fichier malchanceux isolé devrait produire sur une journée entière, tous visiteurs confondus |
| Mécanisme anti-répétition | `checkStateTransition` (existant, déjà utilisé pour les dépendances externes) | Une seule alerte à l'entrée en état "problème", une seule au retour à la normale — jamais un email par échec |

## Limitations connues, acceptées sans correction

| Limitation | Où | Pourquoi non corrigée |
|---|---|---|
| Confiance dans le premier maillon de `X-Forwarded-For` | `lib/quota/ipHash.js` (partagé avec `lib/quota/ipRateLimit.js` existant) | Corriger unilatéralement dans le nouveau code créerait une incohérence avec l'infrastructure de rate-limiting déjà en production, sans confirmation du comportement réel de Vercel sur cet en-tête |
| Corps de requête entièrement bufferisé avant le contrôle de taille | `app/api/report-error/route.js` | Risque jugé faible (bornes de charge utile de la plateforme Vercel en amont) ; non corrigé pour rester minimal |

## Ce qui reste non traité

| Point | État | Détail |
|---|---|---|
| ~200 outils navigateur restants (formatters, calculatrices, éditeurs texte/dev, filtres image sur canvas déjà décodé, etc.) | Non instrumentés | Risque de décodage jugé structurellement plus faible que les 19 outils couverts (pas de format de fichier exotique fourni par le visiteur) ; liste complète disponible via `app/lib/toolsRegistry.js` |
| Page admin protégée | Non construite, sur demande explicite du cahier des charges ("ne la construis pas sans accord") | Minimum déjà satisfait : table `tool_errors` lisible directement dans l'éditeur Supabase, colonnes exploitables. Proposition si souhaitée : page réservée à un compte email en liste blanche via `supabase.auth.getUser()` (aucun nouveau système d'authentification), requête en lecture seule sur `tool_errors`, tableau + compteurs par outil/jour. Estimation : environ une demi-journée pour une version minimale ; plus si filtres par date, graphiques, ou détail par outil sont demandés |
| Rotation de la clé service-role Supabase locale | Bloqué, hors de portée de cette session | `.env.local` contient une clé refusée par Supabase ("Legacy API keys are disabled") — empêche toute vérification d'écriture réelle en base et le test de limitation d'abus en local. N'affecte pas la production/preview, qui a ses propres clés |
| Test 5 (limitation d'abus, 21 requêtes → 429) | Non exécuté | Bloqué par la limitation ci-dessus ; procédure fournie pour l'exécuter contre l'URL de prévisualisation/production une fois déployée |

## Tests manuels qui reviennent à l'utilisateur

| Test | Où | Détail complet |
|---|---|---|
| Exécuter `supabase/tool_errors.sql` dans l'éditeur SQL Supabase | Console Supabase | Prérequis à tout test d'écriture réelle |
| Test 1 — la remontée part bien lors d'un échec | `docs/audit/PROGRESS-remontee-erreurs.md`, section "Procédures de test manuel" | zip-extractor + `corrupt-test.zip` |
| Test 2 — rien ne part lors d'un succès | idem | zip-extractor + `valid-test.zip` |
| Test 3 — aucun nom de fichier ni contenu ne fuit | idem | Inspection du payload JSON dans l'onglet Réseau |
| Test 4 — un échec de la remontée ne casse jamais l'outil | idem | Route désactivée temporairement, tiff-to-png doit continuer à fonctionner normalement |
| Test 5 — limitation d'abus (21 requêtes → 429 à la 21e) | idem | Nécessite une base fonctionnelle (locale après rotation de clé, ou preview/prod) |
| Vérifier qu'une ligne apparaît réellement dans la table `tool_errors` après un échec réel | Éditeur de table Supabase | Confirme l'écriture bout-en-bout, au-delà de la simple réponse HTTP |
| Confirmer la réception d'une alerte (email Resend + ntfy) quand le seuil de 10 échecs/24h est dépassé pour un outil | Boîte mail / app ntfy | Ne peut être vérifié qu'en conditions réelles ou en insérant manuellement ≥10 lignes puis en redéclenchant le cron |
