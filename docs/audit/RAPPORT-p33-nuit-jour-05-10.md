# RAPPORT FINAL — nuit et jour du 05/10 (P33 + lots B et C)

Propriétaire absent ; aucune question posée ; décisions renvoyées au plan (`claude/plan-de-travail.md`, sections P33, P34, lot C).

## En production (fin de séance)
- **Vercel `onlineconvertools-h9vbm07hj`** = master `6887a0b1` (+ `362ece7f`, rapport seul) ; **pdf-tools** `0f9fc564` (même
  service que `281dada4` : Tesseract, 102 langues). www-light **29/29** après chaque mise en ligne.
- Étapes : pdf-tools seul (`281dada4`, `85aa2c7b`) → préversion `jwfybpxst` (OCR 21/21 avec le vrai service) → site P33
  `81c98da8` (`6j94la1q7`) → correctif Redact après relecture n° 3 `a90439d1` (`f2vxs809j`, préversion `765nely91`) → lot B
  `6887a0b1` (`h9vbm07hj`). **Aucun retour arrière.** Retour arrière prêt : promouvoir `onlineconvertools-f2vxs809j`.

## Lot A — P33 (`RAPPORT-p33-redact-ocr-05-10.md`)
1. PDF to JPG du 04/10 au soir : **le téléphone a dessiné les pages lui-même** (aucune requête de rendu, journaux Vercel et
   pdf-tools) ; secours serveur gardé.
2. PDF Redact : panne iPhone non reproduite ; interface qui répond toujours (progression par page, étape bloquée nommée,
   « No match found for … », résultat ramené à l'écran). **Vraie suppression** : trois relectures indépendantes ont trouvé
   **24 fuites** et **1 faux refus** (PDF à sommaire), toutes présentes en production avant P33, toutes corrigées et
   rejouées (31 PDF piégés + corpus réel). Limites dites : texte dans une image ou un motif de remplissage.
3. PDF OCR : une seule liste avec recherche (1-3 langues, langue du navigateur) ; iPhone/iPad : 20 s sans progrès ou échec →
   OCR serveur (Tesseract, 102 langues — OCRmyPDF écarté, raisons au rapport) ; revue de sécurité « GO avec conditions »,
   appliquées ; seul outil d'OCR du site.
4. Limites téléphone : 48 Mpx partout, « Reduce to 48 MP » dans JPG/Image to PDF, HEIC/AVIF bornés.
Mini-passe iPhone de 4 vérifications : rapport P33 §6.

## Lot B — P34 (`RAPPORT-p34-non-regression-05-10.md`)
≈ 190 lancements locaux, fournisseurs simulés (0 appel payant, rien dans Supabase, aucune alerte) : **aucune régression
d'outil** (solidité 522/522 ×3 moteurs). Corrigé : exemple et réponses de CSV to SQL, date de la politique de
confidentialité. ≈ 20 bancs remis à jour. Non lancés (www, payant, ffprobe absent) : listés.

## Lot C — audit SEO + AdSense (`AUDIT-SEO-ADSENSE-05-10.md`, lecture seule)
Constat chiffré et 13 lots proposés (S1-S11, A1-A2). Priorités : S1 (8 titres cassés, canonical, H1 — ≈ 1 h), S2 (liens
entre outils), S3 (JSON-LD), **A1 (CMP + Consent Mode : Analytics pose aujourd'hui des cookies sans consentement pour l'UE)**.

## Ce qui a échoué / reste ouvert
- Les deux pannes iPhone (Redact, OCR) **ne sont pas reproduites** : statut « corrigé, à confirmer sur iPhone ».
- Entre ≈ 04 h 05 et 04 h 45 UTC, la version en ligne refusait (sans fichier faux) les PDF à sommaire dans Redact — corrigé.
- Le sous-agent du point 4 a tenté de copier `.env.local` dans sa copie de travail : **bloqué par les permissions** ; aucune clé
  utilisée.

## Décisions du propriétaire
P33 D1-D4 (OCR : verrou par IP ou 2 créneaux ; `MEDIA_SERVICE_URL` en réseau privé ? ; texte sélectionnable des pages
noircies ; confirmation avant envoi) ; lot C : S1-S11, A1-A2 ; mini-passe iPhone P33 §6.

## Dépense
**0 $ hors forfait** (aucun fournisseur payant appelé ; Railway : reconstructions de pdf-tools sur le forfait ; Vercel Pro :
une préversion par cycle).
