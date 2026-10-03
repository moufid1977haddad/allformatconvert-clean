# Cas fabriqués par la revue indépendante de P28 (PDF Repair, méthode « page list rebuilt »)

`mk.py` / `mk2.py` les écrivent. Attendu (service P28) :

| Fichier | Piège | Résultat attendu |
|---|---|---|
| `A_inherit_trunc.pdf` | `/Resources` et `/MediaBox` portés par le nœud Pages, perdu | refusé (rien à hériter) |
| `B_order_trunc.pdf` | page 1 = objet 7, page 2 = objet 5, arbre perdu | reconstruit dans l'ordre des objets, **avec** l'avertissement « vérifiez l'ordre » |
| `C_deleted_trunc.pdf` | une page orpheline (supprimée) dans un fichier à une révision, arbre perdu | reconstruite (indiscernable), **avec** l'avertissement « vérifiez qu'aucune page supprimée ne réapparaît » |
| `D_objstm_then_plain.pdf` | page en flux d'objets puis réécrite en clair plus loin | la version la plus récente (« NEW signed version ») |
| `E_userpw.pdf` | chiffré par mot de passe utilisateur | refusé |
