# P28 — corpus d'équations Word (`corpus/`)

| Fichier | Origine | Licence |
|---|---|---|
| `word-omml.{docx,docm,dotx,rtf,odt,doc}` | écrits **par Microsoft Word 16** (COM, `make-word.ps1`) : 7 équations Office Math (OMML) — fraction et racine, exposant, somme, intégrale, limite, matrice, nabla/dérivées partielles ; un même document enregistré dans chaque format Word que notre page Word to PDF envoie à Gotenberg (le `.docx` passe par ConvertAPI en production) | fait par nous |
| `lomath-from-word.odt` | `word-omml.docx` ouvert puis enregistré en ODT par **LibreOffice 26** (objets LibreOffice Math, avec images de secours) | fait par nous |
| `lo-mathtype.docx`, `lo-2_MathType3.docx` | fichiers de test de LibreOffice (`sw/qa/extras/ooxmlexport/data/mathtype.docx`, `sw/qa/extras/odfexport/data/2_MathType3.docx`) : objets **Equation Editor 3.0** (`Equation.3`, format MTEF de MathType) | MPL-2.0 |
| `dsmt4-mathtype6.docx` | `lo-mathtype.docx` dont l'objet OLE est remplacé par un vrai objet **MathType 6** (`Equation.DSMT4`, `oleObject1.bin` de github.com/yangjiao398-commits/word-math-md `tests/fixtures`) ; l'image d'aperçu reste celle d'origine | MPL-2.0 / dépôt public |
| `lo-math-mso2k7.docx`, `lo-math-matrix.docx`, `lo-math-nary.docx`, `lo-math-rad.docx`, `lo-EquationAsScientificNumbering.docx` | fichiers de test de LibreOffice (`sw/qa/extras/ooxmlexport/data/`) : Office Math écrit par Word 2007 et suivants | MPL-2.0 |
| `poi-lomath.doc` | fichier de test d'Apache POI (`test-data/document/equation.doc`) : un `.doc` contenant un objet **LibreOffice Math** (`opendocument.MathDocument.1`) | Apache-2.0 |

Référence visuelle : `ref-word.ps1` (PDF de Word lui-même, un fichier par Word). Word reste bloqué sur `lo-mathtype.docx` et
`dsmt4-mathtype6.docx` (objets Equation 3.0 sans l'éditeur installé) : la référence est alors l'image d'aperçu intégrée.
