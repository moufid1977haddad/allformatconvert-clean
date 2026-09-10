# Rapport — TIFF Microsoft Paint / fichiers mal étiquetés (tiff-to-jpg, tiff-to-png, image-converter)

Date : 2026-09-09. Déclenché par un signalement de défaut en production : "Could not decode this TIFF
file: Failed to construct 'OffscreenCanvas': Value is not of type 'unsigned long'." sur un fichier
`.tiff` exporté par Microsoft Paint (Windows 11).

## 1. Cause exacte

| Élément | Détail |
|---|---|
| Fichier réellement en cause (`scripts/audit/fixtures/files/test.tiff`, initialement fourni) | PNG valide et complet (signature `89 50 4E 47 0D 0A 1A 0A`, IHDR 428×551, IEND en fin de fichier exact), pas un TIFF — malgré l'extension `.tiff`. |
| Ce que fait `UTIF.decode()` + `UTIF.decodeImage()` (utif2) sur des octets non-TIFF | Ne lève **aucune exception**. `decodeImage()` (node_modules/utif2/UTIF.js:105) fait `if (img["t256"]==null) return;` — sans le tag 256 (ImageWidth), il sort silencieusement sans jamais fixer `.width`/`.height`, qui restent `undefined`. |
| Ce que faisait `app/lib/tiffDecode.js::decodeTiff()` avant correctif | Renvoyait `{width: undefined, height: undefined, rgba: Uint8Array(0)}` sans erreur — confirmé par test direct (`decodeTiff()` sur les octets PNG ci-dessus → `NO THROW. result: undefined undefined 0`). |
| Ce que faisaient les 3 workers avec ce résultat | `tiffToJpg.worker.js` / `tiffToPng.worker.js` : `new OffscreenCanvas(undefined, undefined)` — le constructeur est `[EnforceRange]`, donc `undefined`/`NaN` déclenche un `TypeError` brut du navigateur au lieu d'un 0×0 silencieux. `imageConverter.worker.js` : même chemin `decodeTiff()`, puis `new ImageData(..., undefined, undefined)` — même classe de défaut, message brut différent. |
| Conclusion sur la bibliothèque vs notre code | **Notre code**, pas UTIF2 : UTIF2 documente et respecte son propre contrat ("no width => probably not an image", retour silencieux) ; c'est `tiffDecode.js` et les 3 workers qui ne vérifiaient jamais ce cas avant de passer les valeurs à `OffscreenCanvas`/`ImageData`. Aucun bug de décodage TIFF n'était en cause pour ce fichier précis — c'est un fichier PNG utilisé comme entrée du mauvais outil. |

## 2. Producteurs de TIFF testés et résultat

| Producteur | Fichier | Test effectué | Résultat |
|---|---|---|---|
| Microsoft Paint, Windows 11 (`scripts/audit/fixtures/files/test-paint.tif`, fourni par le propriétaire, reproduit le signalement d'origine) | LZW (Compression=5) + Predictor=2 (différenciation horizontale) + RGBA 8 bits/canal (BitsPerSample=[8,8,8,8], SamplesPerPixel=4, ExtraSamples=2) + PlanarConfiguration=1 (chunky) + 1 seule bande (RowsPerStrip=551) | Octets de l'en-tête et de l'IFD lus manuellement (byte order `II`, 16 tags, tous standards) ; `decodeTiff()` exécuté directement (Node) ; sortie RGBA comparée **octet par octet** à un second décodeur indépendant (libvips/libtiff via `sharp`) ; rendu visuel vérifié (3 traits diagonaux) ; puis testé de bout en bout dans le navigateur réel sur les 3 outils (tiff-to-jpg, tiff-to-png, image-converter) | **Décode correctement, pixel pour pixel identique à libtiff** (943 312 octets comparés, 0 différence). Les 3 outils produisent une image visuellement et byte-for-byte correcte. **Ce fichier n'a jamais été le problème** — le vrai défaut était le fichier PNG mal étiqueté envoyé séparément (section 1). |
| GIMP, Photoshop, Windows Fax and Scan, aperçu macOS, scanners de bureau | — | **Non testé** | Voir section 3. |

## 3. Ce qui reste non couvert, et pourquoi

| Producteur / cas | Pourquoi non couvert ici |
|---|---|
| GIMP | Aucun fichier réel produit par GIMP fourni ou localisé de façon attribuable avec certitude pendant cette session. La consigne du chantier ("fichiers réels uniquement, jamais fabriqués par toi") interdit d'improviser un substitut. |
| Photoshop | Idem — aucun échantillon réel disponible en session. |
| Windows Fax and Scan | Idem. |
| Aperçu macOS | Idem — pas d'accès à une machine macOS dans cet environnement. |
| Scanners de bureau | Idem — aucun échantillon réel de scanner fourni. |
| Autres variantes Microsoft Paint (ex. images en niveaux de gris, sans canal alpha, tailles très différentes) | Un seul fichier Paint réel a été fourni ; il valide la combinaison de tags que Paint écrit pour une image RGBA typique, pas toutes les variantes possibles que Paint pourrait produire pour d'autres types d'image source. |
| Corpus libtiff déjà audité (`docs/audit/RAPPORT-tiff-scaling-bits.md`) | Ce corpus couvre déjà une large gamme de profondeurs de bits, compressions et configurations planar/CMYK avec de vrais fichiers de test — mais ce sont des fichiers de conformité libtiff, pas attribuables à un logiciel grand public précis, donc ils ne répondent pas à la question "un logiciel grand public réel" posée ici. |

Sur la base du seul test réel disponible, la réponse à la question d'origine est : **oui, pour la
configuration que Microsoft Paint (Windows 11) écrit réellement** (LZW + Predictor horizontal + RGBA
8 bits, chunky, une seule bande), les 3 outils décodent correctement, vérifié par comparaison
octet-exacte à libtiff. Cela ne peut pas être généralisé à GIMP/Photoshop/Fax and Scan/aperçu
macOS/scanners sans échantillon réel de chacun.

## 4. Comparaison marché — traitement d'un fichier à l'extension trompeuse

Testé en direct (upload réel d'un PNG renommé en `.tiff` sur les deux sites, navigateur) avant de
rédiger le texte affiché sur ce site, comme demandé.

| Service | Comportement observé |
|---|---|
| CloudConvert (cloudconvert.com/tiff-to-png) | Aucun message d'écart. Convertit silencieusement le fichier en se basant sur son contenu réel (détection interne indépendante de l'extension) et livre un PNG "FINISHED" sans jamais indiquer à l'utilisateur que son fichier n'était pas un vrai TIFF. |
| Convertio (convertio.co/tiff-png) | Même comportement : "Conversion completed!", aucun avertissement sur l'écart extension/contenu. |
| Ce site (après correctif) | tiff-to-jpg / tiff-to-png (outils à nom de format unique) : message explicite nommant le format réel détecté + lien direct vers le bon outil (ou "déjà au bon format, aucune conversion nécessaire" si le format détecté est justement le format de sortie). image-converter (outil multi-format) : aligné sur le comportement de CloudConvert/Convertio — convertit silencieusement avec succès si le format réel est un format qu'il sait déjà lire nativement. |

## 5. Messages d'erreur — avant / après

| Situation | Avant (affiché au visiteur) | Après (affiché au visiteur) | Détail technique (remonté à `tool_errors`, jamais à l'écran) |
|---|---|---|---|
| Fichier réellement autre chose qu'un TIFF (ex. PNG en `.tiff`), format reconnu, un outil dédié existe | "Could not decode this TIFF file: Failed to construct 'OffscreenCanvas': Value is not of type 'unsigned long'." | "This isn't actually a TIFF file — its data is PNG." + lien "Use PNG to JPG instead" | `error_message` conserve le détail exact ("Header bytes do not match the TIFF format (detected: png)"), `ext`="tiff", `detected_ext`="png" |
| Idem, mais le format détecté est déjà le format de sortie demandé | (idem message brut ci-dessus) | "This isn't actually a TIFF file — it's already PNG. No conversion needed." (aucun lien) | idem |
| Idem, format reconnu mais sans outil dédié sur le site (ex. BMP → sortie JPG) | (idem message brut ci-dessus) | "This isn't actually a TIFF file — its data is BMP." + lien "Try Image Converter instead" | idem |
| Octets totalement non reconnus (aucune signature connue) | (idem message brut ci-dessus) | "This doesn't look like a valid TIFF file — its content doesn't match any format this tool recognizes. Double-check you selected the right file." | `detected_ext`=null (rien de fiable à logger) |
| Vrai TIFF (signature correcte) mais décodage impossible pour une autre raison (IFD corrompu/tronqué) | Message brut de l'exception JS/UTIF2 | "This TIFF file couldn't be read. It may be corrupted, or use a rare TIFF variant this tool doesn't support. Try re-saving it with different settings (e.g. Deflate/ZIP compression) in an image editor, or try a different file." | `error_message` conserve le détail brut d'origine |
| Crash du Worker lui-même (hors try/catch interne) | "Could not decode this TIFF file: " + message brut du navigateur | "Something went wrong while converting this file. Please try again, or try a different file." | `error_message` conserve `err.message` brut |
| image-converter — fichier réellement décodable nativement (PNG/JPEG/GIF/BMP/WebP/ICO/AVIF), quel que soit son extension | Selon le cas : succès accidentel, ou message brut "Failed to decode ... corrupted or in an unsupported format" si l'extension déclarait `.tif/.tiff` | **Aucun message — conversion réussie silencieusement**, comme CloudConvert/Convertio (section 4) : le routage se fait désormais sur les octets réels, plus sur l'extension | — (pas d'erreur) |
| image-converter — fichier illisible même par le décodeur natif du navigateur | "Failed to decode "name". It may be corrupted or in an unsupported format." (toujours, même si le vrai format était identifiable) | "Failed to decode "name". Its content is {FORMAT}, which this tool couldn't read." quand le format est identifié, sinon message générique inchangé | `detected_ext` renseigné quand disponible et différent de l'extension déclarée |
| image-converter — échec de décodage HEIC/HEIF | "{name}: Failed to decode this HEIC/HEIF file ({message brut de heic2any})" | "{name}: Failed to decode this HEIC/HEIF file. It may be corrupted or use a variant this tool doesn't support." | `error_message` conserve le message brut de heic2any |

Remontée vérifiée en conditions réelles (navigateur, `navigator.sendBeacon` intercepté) : un upload PNG
renommé `.tiff` sur tiff-to-jpg produit bien `{"tool":"tiff-to-jpg","source":"browser","ext":"tiff",
"detectedExt":"png","sizeBucket":"0-1MB","errorType":"Error","errorMessage":"Header bytes do not
match the TIFF format (detected: png)","browser":"Chrome 152"}` vers `/api/report-error`.

**Action requise côté propriétaire avant déploiement** : la colonne `detected_ext` est nouvelle
(`supabase/tool_errors.sql` mis à jour avec `alter table tool_errors add column if not exists
detected_ext text;`). Cette migration n'a pas été exécutée par l'agent (règle absolue du projet :
la clé de service Supabase ne doit jamais transiter par l'environnement agent) — à exécuter dans
l'éditeur SQL Supabase avant que les nouveaux rapports d'erreur ne l'utilisent.

## 6. Tests manuels qui reviennent au propriétaire

| # | Test | Pourquoi |
|---|---|---|
| 1 | Exécuter `alter table tool_errors add column if not exists detected_ext text;` dans l'éditeur SQL Supabase (contenu déjà dans `supabase/tool_errors.sql`) | Sans ça, `detected_ext` ne sera jamais enregistré en production — l'agent ne peut pas le faire lui-même (règle absolue). |
| 2 | Après déploiement, uploader un fichier PNG/JPG/GIF/BMP/WebP réel renommé en `.tiff` sur tiff-to-jpg et tiff-to-png en production | Vérifier que le message "This isn't actually a TIFF file — its data is X" et le lien vers le bon outil s'affichent bien en conditions réelles (testé ici seulement en local). |
| 3 | Uploader ce même type de fichier sur image-converter | Vérifier qu'il convertit silencieusement avec succès (aucune erreur), comme observé en local. |
| 4 | Reconvertir `scripts/audit/fixtures/files/test-paint.tif` (le vrai fichier Paint fourni, maintenant committé comme fixture de non-régression) sur les 3 outils en production | Confirmer que la correction n'a pas cassé le cas normal — vérifié ici en local (byte-exact vs libtiff, puis navigateur réel), à reconfirmer une fois déployé. |
| 5 | Si un TIFF produit par GIMP, Photoshop, l'aperçu macOS, Windows Fax and Scan ou un scanner est disponible, le fournir pour un test réel | Ce sont les seuls producteurs de la liste d'origine non couverts par cette session (section 3) — aucun ne peut être validé sans fichier réel. |
| 6 | Consulter la table `tool_errors` après le test #2 | Confirmer que la ligne porte bien `ext`="tiff" et `detected_ext` = le vrai format détecté (ex. "png"), pas seulement `ext`. |
