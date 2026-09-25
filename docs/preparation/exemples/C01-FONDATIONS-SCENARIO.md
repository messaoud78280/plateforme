# Scénario C-01 — Fondations (démonstration)

> **DÉMONSTRATION — NON CONTRACTUEL**
> Fichier source : [`c01-fondations.prep.json`](./c01-fondations.prep.json), au format `bework_prep_bundle_v1`.
> Valeurs recalculées à partir des paramètres par un script de vérification hors plateforme : les 8 contrôles sont conformes.
> Les hypothèses ne prouvent ni la conformité technique, ni la recevabilité d'une entreprise, ni la conformité à l'étude géotechnique.

---

## B. Métré

### B.1 Paramètres

| Clé | Valeur | Provenance | Justification |
|---|---|---|---|
| `sf1.longueur` | 76 m | Hypothèse | H-01 — cotes de longueur illisibles sur le document raster |
| `sf1.largeur` | 0,50 m | **Relevé** | « SF1 50 x 25 » lu sur le plan C-01 |
| `sf1.hauteur` | 0,25 m | **Relevé** | Idem |
| `sf1.fouille_largeur` | 0,60 m | Hypothèse | H-03 |
| `fouille.profondeur_commune` | 0,80 m | Hypothèse | H-04 — niveau d'assise non lisible |
| `sf1.fouille_profondeur` | = `fouille.profondeur_commune` | Calculé | Paramètre dérivé |
| `sf1.proprete_largeur` | = `sf1.fouille_largeur` | Calculé | Propreté sur toute la largeur de fouille (H-05) |
| `s1.nombre` | 8 | Hypothèse | H-02 |
| `s1.longueur` × `s1.largeur` × `s1.hauteur` | 0,80 × 0,80 × 0,25 m | **Relevé à vérifier** | « S1 80 x 80 x 25 », lecture incertaine |
| `s1.fouille_longueur` × `s1.fouille_largeur` | 1,00 × 1,00 m | Hypothèse | H-03 |
| `s1.fouille_profondeur` | = `fouille.profondeur_commune` | Calculé | |
| `s2.nombre` | 2 | Hypothèse | H-02 |
| `s2.longueur` × `s2.largeur` × `s2.hauteur` | 1,00 × 1,00 × 0,30 m | Hypothèse | H-02 |
| `s2.fouille_longueur` × `s2.fouille_largeur` | 1,20 × 1,20 m | Hypothèse | H-03 |
| `s2.fouille_profondeur` | = `fouille.profondeur_commune` | Calculé | |
| `proprete.epaisseur` | 0,05 m | Hypothèse | H-05 |
| `aciers.masse_forfaitaire` | 740 kg | Hypothèse | H-06 — **fictif**, aucun plan de ferraillage |
| `implantation.nombre_chaises` | 16 | Hypothèse | H-07 |
| `deblais.foisonnement` | 1,25 | Hypothèse | H-08 |
| `deblais.taux_reemploi` | 0 (évacuation totale) | Hypothèse | H-09 — décision D-03 ouverte |
| `camion.capacite_m3` / `toupie.capacite_m3` | 10 m³ / 7 m³ | Hypothèse | H-10 — à confirmer avec le transporteur et la centrale |

Hypothèse transversale H-11 : aucune intersection de fouilles ni de semelles n'est déduite. Les volumes sont bruts théoriques.

### B.2 Quantités

Rôle **Devis** = transférable au devis. **Indicateur** et **Logistique** = jamais transférés.

| Id | Désignation | Formule | Quantité | Rôle | Dépend de |
|---|---|---|---|---|---|
| IM-01 | Installation et préparation du chantier | — (forfait) | 1 forfait | Devis | Hypothèse |
| IM-02 | Implantation générale et repères altimétriques | — (forfait) | 1 forfait | Devis | Hypothèse |
| IM-03 | Chaises d'implantation et cordeaux | `implantation.nombre_chaises` | 16 u | Devis | Hypothèse |
| IM-04 | Traçage des semelles filantes SF1 | `sf1.longueur` | 76 ml | Devis | Hypothèse |
| IM-05 | Traçage des semelles isolées S1 et S2 | `s1.nombre + s2.nombre` | 10 u | Devis | Hypothèses |
| TE-01 | Fouilles en rigoles SF1 | `sf1.longueur × sf1.fouille_largeur × sf1.fouille_profondeur` | **36,48 m³** | Devis | 3 hypothèses |
| TE-02 | Fouilles en puits S1 | `s1.nombre × s1.fouille_longueur × s1.fouille_largeur × s1.fouille_profondeur` | **6,40 m³** | Devis | Hypothèses |
| TE-03 | Fouilles en puits S2 | idem S2 | **2,304 m³** | Devis | Hypothèses |
| TE-04 | Réglage des fonds de fouille (brut) | somme des emprises de fouille | **56,48 m²** | Devis | Hypothèses |
| EV-01 | Déblais en place | `TE-01 + TE-02 + TE-03` | **45,184 m³** | Indicateur | Hypothèses |
| EV-02 | Déblais foisonnés si tout transporté | `EV-01 × deblais.foisonnement` | 56,48 m³ | Indicateur | Hypothèses |
| EV-03 | Évacuation des déblais excédentaires (foisonnés) | `EV-01 × (1 − deblais.taux_reemploi) × deblais.foisonnement` | **56,48 m³** | Devis | Hypothèses · décision D-03 |
| EV-04 | Terres conservées pour réemploi (en place) | `EV-01 × deblais.taux_reemploi` | 0 m³ | Indicateur | D-03 |
| EV-05 | Bilan des terres (négatif = apport à prévoir) | `EV-04 − RE-01` | **−30,98 m³** | Indicateur | D-03 |
| BP-01 | Béton de propreté SF1 | `sf1.longueur × sf1.proprete_largeur × proprete.epaisseur` | 2,28 m³ | Devis | Hypothèses |
| BP-02 | Béton de propreté S1 | `s1.nombre × s1.fouille_longueur × s1.fouille_largeur × proprete.epaisseur` | 0,40 m³ | Devis | Hypothèses |
| BP-03 | Béton de propreté S2 | idem S2 | 0,144 m³ | Devis | Hypothèses |
| TOT-01 | Total béton de propreté | `BP-01 + BP-02 + BP-03` | **2,824 m³** | Indicateur | Hypothèses |
| AR-01 | Aciers HA (quantité de test) | `aciers.masse_forfaitaire` | 740 kg | Devis | Hypothèse **fictive** · D-04 |
| BE-01 | Béton semelles SF1 | `sf1.longueur × sf1.largeur × sf1.hauteur` | 9,50 m³ | Devis | 1 hypothèse + 2 relevés |
| BE-02 | Béton semelles S1 | `s1.nombre × s1.longueur × s1.largeur × s1.hauteur` | 1,28 m³ | Devis | 1 hypothèse + 3 relevés à vérifier |
| BE-03 | Béton semelles S2 | idem S2 | 0,60 m³ | Devis | Hypothèses |
| TOT-02 | Total béton des semelles | `BE-01 + BE-02 + BE-03` | **11,38 m³** | Indicateur | Mixte |
| TOT-03 | Total béton | `TOT-01 + TOT-02` | **14,204 m³** | Indicateur | Mixte |
| TOT-04 | Ratio aciers / béton des semelles | `AR-01 / TOT-02` | 65,03 kg/m³ | Indicateur | Contrôle de vraisemblance uniquement |
| CO-01 | Contrôle avant bétonnage | — (forfait) | 1 forfait | Devis | Hypothèse |
| CO-02 | Cure et protection du béton | — (forfait) | 1 forfait | Devis | Hypothèse |
| RE-01 | Vide théorique à remblayer | `EV-01 − TOT-01 − TOT-02` | **30,98 m³** | Indicateur | Mixte · D-03 |
| RE-02 | Nettoyage et repli | — (forfait) | 1 forfait | Devis | Hypothèse |
| LOG-01 | Rotations de camion benne | `ceil(EV-03 / camion.capacite_m3)` | 6 rotations | Logistique | Hypothèses |
| LOG-02 | Toupies — propreté | `ceil(TOT-01 / toupie.capacite_m3)` | 1 | Logistique | Hypothèses |
| LOG-03 | Toupies — semelles | `ceil(TOT-02 / toupie.capacite_m3)` | 2 | Logistique | Mixte |

**Aucune quantité n'est « fiable » dans ce scénario** : toutes dépendent d'au moins une hypothèse. C'est le comportement attendu d'un dossier de démonstration.

### B.3 Points relevés en tant que conducteur de travaux

- **TE-04 et EV-02 valent tous deux 56,48**, par coïncidence : 0,80 m × 1,25 = 1,00. Les deux grandeurs divergent dès que la profondeur ou le foisonnement change. L'interface doit afficher clairement l'unité (m² contre m³).
- **Une évacuation totale implique un apport de remblai** : le bilan des terres EV-05 vaut −30,98 m³. C'est un poste souvent oublié au devis.
- **Les 740 kg d'aciers sont fixes** : ils ne suivent pas le volume de béton. Le ratio de 65 kg/m³ n'est qu'un repère de vraisemblance. Il ne valide aucun ferraillage.

---

## C. Mode opératoire complet

| Ordre | Intervention | Type | Lignes de métré | Équipe | Matériel | Conditions avant démarrage | Contrôles avant l'étape suivante |
|---|---|---|---|---|---|---|---|
| P01 | Installation et balisage du chantier | Travaux | IM-01 | Chef d'équipe, manœuvre | Balisage | DT/DICT faites et récépissés reçus (à vérifier) · accès et zone de livraison définis · plan d'installation | Réseaux repérés et marqués · accès engins vérifiés |
| P02 | Implantation des axes, niveaux, chaises et traçage | Travaux | IM-02 à IM-05 | Chef d'équipe, manœuvre | Niveau laser / station | Plan d'implantation indicé et validé · repères de référence connus | Équerrage et diagonales · cotes d'axes · niveau de référence reporté |
| P03 | Terrassement mécanique et gestion des déblais | Travaux | TE-01 à TE-03, EV-03 | Conducteur d'engin, manœuvre, chauffeur PL | Pelle, camion benne, protection des fouilles | Implantation contrôlée · prescriptions géotechniques lues (sans en inventer les résultats) · scénario de déblais décidé (D-03) | Profondeur et largeur des fouilles · stabilité des parois |
| P04 | Réglage et contrôle des fonds de fouille | Travaux | TE-04 | Maçon, manœuvre | Niveau laser | Fouilles stables et sécurisées | Niveau d'assise · réception du fond de fouille selon mission géotechnique (G3/G4 indicatif, à vérifier) |
| P05 | Béton de propreté | Travaux | BP-01 à BP-03 | Maçon, manœuvre | Toupie, goulotte ou pompe | Fonds réceptionnés · commande béton confirmée | Niveaux du béton de propreté |
| P06 | Pose et calage des armatures | Travaux | AR-01 | 2 ferrailleurs | — | Plans de ferraillage indicés (D-04) · aciers livrés | Enrobage, recouvrements, attentes |
| P07 | **Contrôle avant bétonnage — point d'arrêt** | Contrôle | CO-01 | Conducteur de travaux, chef d'équipe | Niveau laser | Ferraillage terminé | Implantation, dimensions, armatures · réservations réseaux (à vérifier) · liaison de terre selon le lot électricité (à vérifier) |
| P08 | Coulage, vibration et finition | Travaux | BE-01 à BE-03 | Chef d'équipe, maçon, manœuvre | Toupie, mise en place, vibreur, protection | Point d'arrêt P07 levé · cadence de livraison confirmée · météo compatible | Bons de livraison conformes · protection en place |
| P09 | Cure et protection | **Attente** (calendaire) | CO-02 | — | Bâches / produit de cure | — | Autorisation de solliciter les semelles |
| P10 | Remblaiement **conditionnel** | Travaux | RE-01 (indicateur) | Conducteur d'engin, manœuvre | Pelle, plaque vibrante | **Conditions** : soubassements réalisés, réemploi validé (D-03), méthode de compactage définie | Compactage contrôlé |
| P11 | Nettoyage et repli | Travaux | RE-02 | Chef d'équipe, manœuvre | — | — | Évacuation effective des déblais selon le scénario validé |

Mesures de sécurité intégrées :

- risque d'effondrement des fouilles (talutage ou blindage selon terrain) ;
- aucun poste de travail humain prévu en fond de fouille de 60 cm ;
- circulation engins et piétons séparée ;
- arrêt immédiat en cas de réseau non repéré ;
- zone de manœuvre des toupies balisée.

Pièces à conserver (utiles au DOE et en cas de litige) :

- récépissés DT/DICT ;
- relevé d'implantation ;
- bons d'évacuation des déblais ;
- visa du géotechnicien si prévu ;
- bons de livraison béton et aciers ;
- fiche de contrôle avant coulage signée ;
- photos avant coulage.

---

## D. Ressources et rendements

| Rendement | Valeur | Unité productive | Utilisé par | Durée brute → retenue |
|---|---|---|---|---|
| R-TERR — Terrassement en fouilles | 24 m³/j | par pelle | P03, piloté par EV-01 = 45,184 m³ | 1,88 j → **2 j** |
| R-FERR — Pose des armatures | 370 kg/j | par équipe de 2 | P06, piloté par AR-01 = 740 kg | 2,00 j → **2 j** |
| R-COUL — Coulage et vibration | 12 m³/j | par équipe | P08, piloté par TOT-02 = 11,38 m³ | 0,95 j → **1 j** |

Tous les rendements sont des **hypothèses de démonstration**, modifiables. Le rendement de coulage est en pratique limité par la cadence de livraison du béton, à confirmer avec la centrale.

**Main-d'œuvre** : conducteur de travaux (points d'arrêt), chef d'équipe, maçon coffreur, manœuvre, 2 ferrailleurs, conducteur d'engin, chauffeur poids lourd (peut relever d'un transporteur sous-traitant). L'effectif sur site varie de 2 à 3 personnes selon la phase.

**Matériel** : balisage, niveau laser ou station, pelle hydraulique (gabarit selon accès, sol et profondeur, à vérifier), camion benne, protection des fouilles, toupie, goulotte ou pompe selon accès, aiguille vibrante, plaque vibrante, bâches ou produit de cure.

**Fournitures** : chaises, piquets et cordeaux ; béton de propreté (dosage selon CCTP) ; béton de fondation (classe selon plans BET et CCTP, à confirmer) ; aciers HA façonnés ; cales et distanciers.

**Moyens logistiques estimés** : 6 rotations de camion benne, 1 toupie pour la propreté, 2 toupies pour les semelles.

---

## E. Planning prévisionnel

Démarrage **hypothétique** le lundi 5 octobre 2026. Calendrier du lundi au vendredi, jours fériés français, pas d'une demi-journée.

| Id | Intervention | Durée | Début | Fin | Remarque |
|---|---|---|---|---|---|
| P01 | Installation | 1 j ouvré | lun. 5 oct. matin | lun. 5 oct. soir | |
| P02 | Implantation | 1 j ouvré | mar. 6 oct. | mar. 6 oct. | |
| P03 | Terrassement | 2 j ouvrés (calculé) | mer. 7 oct. | jeu. 8 oct. | |
| P04 | Réglage des fonds | 1 j ouvré | ven. 9 oct. | ven. 9 oct. | |
| P05 | Béton de propreté | 1 j ouvré | lun. 12 oct. | lun. 12 oct. | |
| P06 | Armatures | 2 j ouvrés (calculé) | mar. 13 oct. | mer. 14 oct. | |
| P07 | Contrôle — point d'arrêt | 0,5 j ouvré | jeu. 15 oct. matin | jeu. 15 oct. midi | Après-midi en réserve pour d'éventuelles corrections |
| P08 | Coulage | 1 j ouvré (calculé) | ven. 16 oct. matin | ven. 16 oct. soir | Alignement « début de journée » |
| P09 | Cure (attente) | 3 j calendaires | après le coulage | lun. 19 oct. soir | Couvre sam. 17, dim. 18, lun. 19 · réserve de démo, **pas un délai réglementaire** |
| P11 | Nettoyage et repli | 0,5 j ouvré | lun. 19 oct. matin | lun. 19 oct. midi | **En parallèle** de la cure |
| P10 | Remblaiement | 1 j ouvré | au plus tôt mar. 20 oct. | — | **Conditionnel** : après soubassement, hors durée de base |

**Durée d'intervention de base : 10,5 jours ouvrés** (du 5 octobre au 19 octobre midi).

### Cohérence avec la simulation initiale de 14 jours

La simulation d'origine additionnait toutes les étapes bout à bout en jours ouvrés : 1 + 1 + 2 + 1 + 1 + 2 + 0,5 + 1 + 3 + 1 + 0,5 = 14.

Une fois les durées ouvrées distinguées des attentes calendaires, le calcul devient :

| Correction | Effet |
|---|---|
| La cure devient une attente calendaire de 3 jours qui chevauche le week-end, sans équipe | −3 j |
| Le remblaiement est conditionnel (après soubassement), donc exclu de la durée de base | −1 j |
| Le coulage est aligné en début de journée | +0,5 j |
| **Durée de base** | **10,5 jours ouvrés** |

Si le remblaiement pouvait être réalisé sans attendre les soubassements, ce qui reste à vérifier, la fin interviendrait au plus tôt le mardi 20 octobre.

---

## Variantes (économie du chantier)

| | Base | V-01 Fouille SF1 à 70 cm | V-02 Profondeur 90 cm | V-03 Réemploi 65 % |
|---|---|---|---|---|
| Fouilles SF1 (TE-01) | 36,48 m³ | 42,56 m³ (+6,08) | 41,04 m³ (+4,56) | = |
| Fonds de fouille (TE-04) | 56,48 m² | 64,08 m² (+7,60) | = | = |
| Déblais en place (EV-01) | 45,184 m³ | 51,264 m³ (+6,08) | 50,832 m³ (+5,648) | = |
| Déblais à évacuer, foisonnés (EV-03) | 56,48 m³ | 64,08 m³ (+7,60) | 63,54 m³ (+7,06) | **19,768 m³ (−36,712)** |
| Terres réemployées (EV-04) | 0 | 0 | 0 | 29,37 m³ |
| Bilan des terres (EV-05) | −30,98 m³ | −36,68 m³ | −36,628 m³ | **−1,61 m³** |
| Béton de propreté (TOT-01) | 2,824 m³ | 3,204 m³ (+0,38) | = | = |
| Béton des semelles (TOT-02) | 11,38 m³ | = | = | = |
| Rotations de camion (LOG-01) | 6 | 7 | 7 | **2** |
| Durée de terrassement (P03) | 2 j | 2,5 j | 2,5 j | 2 j |
| Durée de base | 10,5 j | **10,5 j** | **10,5 j** | 10,5 j |
| Coût | Prix absents | Prix absents | Prix absents | Prix absents |

Lecture « conducteur de travaux » :

- **V-01 et V-02** ajoutent une demi-journée de terrassement. Elle est **absorbée** par la réserve prévue avant le coulage, et la date de fin ne bouge pas. Le coût supplémentaire vient des déblais, de l'apport de remblai et, pour V-01, de la propreté.
- **V-02** ne modifie pas la section des semelles. Les 10 cm supplémentaires sont à combler (remblai ou gros béton), décision à prendre selon l'étude géotechnique.
- **V-03** est la variante la plus économique en transport (2 rotations au lieu de 6) et en apport de remblai. Elle suppose que les terres sont **aptes au réemploi**, ce qui reste à vérifier par l'étude géotechnique, et qu'une zone de stockage protégée existe sur site.

Les variantes restent distinctes du scénario de base. Aucune n'est transférable au devis sans être explicitement retenue.

---

## Décisions ouvertes

| Id | Décision | Bloque |
|---|---|---|
| D-01 | Déduire les intersections des fouilles et volumes de béton | Validation |
| D-02 | Distinguer SF1 des éléments 15 x 40 / 15 x 50 | Validation |
| D-03 | Scénario de réemploi, foisonnement, transport, remblaiement | Validation, transfert au devis |
| D-04 | Armatures, profondeurs, méthode en fouille, prescriptions géotechniques | Validation, exécution |
| D-05 | Valider le mapping métré → devis | Transfert au devis |
| D-06 | Réseaux existants (DT/DICT) | Exécution |
| D-07 | Gestion des eaux en fond de fouille | Exécution |
| D-08 | Durée de cure et délai avant sollicitation | Exécution |
| D-09 | Interface avec le lot électricité (liaison de terre) et réservations réseaux | Exécution |

En mode démonstration, ces blocages s'affichent comme des **avertissements** et n'empêchent aucun test.
