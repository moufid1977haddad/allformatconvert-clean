# Product Hunt — ce que font les lancements réussis (recherche du 28/09/2026, nuit)

**Brouillon pour relecture, rien publié.** Faits relevés sur les pages Product Hunt et recoupés avec hunted.space (archive des tableaux de bord de lancement). Limite de méthode : le fil de commentaires de Product Hunt est rendu en JavaScript et ne se lit pas entièrement hors navigateur ; sur les anciennes pages, les libellés « votes » et « commentaires » sont parfois inversés à l'extraction (corrigés quand une seconde source le confirme).

## 1. Lancements étudiés

| Produit | Date | Résultat | Tagline | Premier commentaire (structure) | Galerie | Topics | Argument |
|---|---|---|---|---|---|---|---|
| remove.bg | 17/12/2018 (lundi) | n° 1 du jour, de la semaine, du mois ; Golden Kitty 2018 ; ≈ 1 900 votes | « Remove the background of any image 100% automatically » | bénéfice → contraste avec la méthode manuelle → « sélectionnez, téléchargez » | 6 éléments | Design Tools, Productivity, Photography | un seul geste, « 100 % », automatique |
| CloudConvert | 19/01/2015 (lundi) | n° 1 du jour, 212 points | « Convert anything to anything » | non lu | non lu | (aujourd'hui) File storage, PDF Editor, Video editing | l'étendue des formats |
| Photopea | 08/04/2020 (mercredi) | n° 2 du jour, 481 votes | « An online, free, photoshop alternative that anyone can use » | non lu (publié par un hunter extérieur) | 3 images | Photo editing, Graphic design | gratuit, face à un nom connu |
| 10015 Tools | 21/06/2024 (vendredi) | n° 4 du jour, 307 points | « All-in-one toolbox for your most used tools » | (source tierce) problème personnel → boîte à outils faite pour soi → chiffres d'audience | non lu | Screenshots, Interface design, Code editors | l'interface soignée |
| CompressImage.io | 18/08/2022 (jeudi) | n° 4 du jour, 254 votes | « Reduce Image Size upto 90% in seconds. Free & Works Offline! » | ce que fait l'outil → différences (local, hors ligne, sans limite, WebP) → « essayez » | 3 images | Productivity, Developer Tools | aucun envoi sur serveur, vitesse, gratuit |
| TabTasker | 31/05/2026 (dimanche) | n° 4 du jour, 236 points | « Zero servers. Total privacy. Your new favorite toolbox. » | problème personnel (coller ses données sur des sites inconnus) → technique (WebAssembly, modèles dans le navigateur) → **preuve vérifiable : l'onglet Réseau ne montre aucun envoi** → gratuit parce que sans serveur | 5 captures, une par outil | Productivity, Privacy, Artificial Intelligence | la vie privée, prouvée |
| ezGIF | 06/11/2015 (vendredi) | n° 5 du jour, ≈ 160 votes | « Resize, crop, and edit GIFs in your browser » | non lu | non lu | Video Editing, Photo Editing | « dans votre navigateur » |
| Kapwing Smart Cut | 03/02/2022 (jeudi) | n° 4 du jour | « Edit videos 10x faster by auto removing silences » | non lu | non lu | non lu | un chiffre de vitesse |

**Échecs relevés** (pour mémoire) : Smallpdf (2014, 11 votes), Convertio (2016 et 2020, quelques votes), TinyWow (1 point), Clideo (1 point), PDFgear (≈ 110 votes). **Les géants du secteur n'ont jamais eu de lancement réussi sur Product Hunt.**

## 2. Règles officielles de Product Hunt (lues le 28/09/2026)

Sources : `producthunt.com/launch/preparing-for-launch` (A), `help.producthunt.com/en/articles/479557-how-to-post-a-product` (B), `producthunt.com/launch` (C).

| Élément | Règle |
|---|---|
| Galerie | **1270 × 760 px** recommandé (A, B) ; au moins 2 images (A) ; GIF animés acceptés (A) ; vidéo : **YouTube** seulement (B) ; ≈ 53 % des « produits du jour » depuis 2021 avaient une vidéo (A) |
| Vignette | carrée, **240 × 240** ; toute image **< 3 Mo** (A, B) |
| Tagline | **60 caractères** au plus (A) |
| Description | **500** caractères (A) ou **260** (B) : les deux pages officielles se contredisent → **écrire en 260 au plus** pour tenir dans les deux |
| Topics | jusqu'à **3** (A) |
| Premier commentaire | fonctionnalités, public, histoire, objectifs, prix, demande de retours (A) ; 70 % des produits du jour/semaine/mois en avaient un (A) |
| Heure | le classement repart à 0 h, heure du Pacifique ; lancer à **00 h 01 PST** (A, B, C) ; jour : « celui où vous êtes prêt » (C) ; le week-end apporte 15 % de clics « Visit » en plus (A) |

## 3. Ce que les succès ont en commun (faits)

1. Tagline < 60 caractères qui nomme **le résultat**, souvent avec un chiffre (« 100% », « 90% », « 10x »).
2. Les deux succès récents d'outils « dans le navigateur » (CompressImage 2022, TabTasker 2026) font du **traitement local** l'argument principal, jusque dans la tagline ; TabTasker propose au lecteur **une vérification** (onglet Réseau).
3. Les très gros scores font **une seule chose en un geste** ; les collections multi-outils plafonnent vers la **4ᵉ place et 240-310 votes**.
4. Premier commentaire : **problème personnel → ce qui est différent → invitation à essayer**.
5. Galerie de **3 à 6 visuels**, surtout des captures d'interface, **un outil par image**.
6. Topics larges et fréquentés (Productivity, Developer Tools, Design Tools), plus « Privacy » pour TabTasker.
7. Aucun jour de lancement dominant.
8. Positionnement face à un nom connu (Photopea / Photoshop ; TabTasker / les sites où l'on colle ses données).

## 4. Conséquences pour notre brouillon (à relire)

- Notre catalogue est une **collection** (222 outils) : l'historique place ce type de lancement vers la 4ᵉ place. Pour viser plus haut, la tagline et la première image doivent porter **quelques résultats mesurés**, pas le nombre d'outils seul.
- **Attention à l'argument « tout est local »** : il est vrai pour ≈ 198 pages, **faux** pour la vidéo, l'Opus, l'Office, le détourage, l'agrandisseur et l'IA (notre audit de confidentialité l'a vérifié : zéro contradiction sur le site). La tagline ne peut donc pas dire « Zero servers » : elle doit dire ce qui est vrai (« most tools run in your browser; the rest are deleted after download ») — voir `03-textes-en.md`.
