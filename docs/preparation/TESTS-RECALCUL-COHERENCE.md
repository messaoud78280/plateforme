# Tests — recalcul automatique et cohérence (`bework_prep_bundle_v1`)

> Proposition de tests à implémenter en phase 1 (tests unitaires sur les fonctions pures, sans base de données).
> Données de référence : [`exemples/c01-fondations.prep.json`](./exemples/c01-fondations.prep.json).
> Les valeurs attendues ci-dessous ont été vérifiées par un script de contrôle hors plateforme.

Tolérance de comparaison : `max(0,001 ; 0,1 %)`, sauf mention contraire.

---

## 1. Analyseur de formules (sécurité)

| # | Entrée | Attendu |
|---|---|---|
| F-01 | `sf1.longueur * sf1.fouille_largeur * sf1.fouille_profondeur` | Accepté, 3 références |
| F-02 | `TE-01 + TE-02 + TE-03` | Accepté, 3 références de lignes |
| F-03 | `TE-01-TE-02` | Lu comme `TE-01 − TE-02` |
| F-04 | `ceil(EV-03 / camion.capacite_m3)` | Accepté |
| F-05 | `round(1.23456, 2)` | 1,23 |
| F-06 | `-(2 + 3) * 2` | −10 |
| F-07 | `76 * ` | Rejeté : fin de formule inattendue |
| F-08 | `alert(1)` / `process.exit()` / `require('fs')` | Rejeté : fonction non autorisée ou caractère invalide |
| F-09 | `a[0]`, `x.constructor`, `"abc"`, `1;2` | Rejeté : caractère invalide ou référence inconnue |
| F-10 | `(1 + 2` | Rejeté : parenthèse fermante attendue |
| F-11 | `1 / 0` | Quantité vide, statut « Erreur de calcul — à vérifier », sans plantage |
| F-12 | Formule de 501 caractères | Rejetée (longueur) |
| F-13 | 33 niveaux de parenthèses | Rejetée (imbrication) |
| F-14 | `max(1)`, `round(1, 2, 3)` | `max(1)` accepté ; `round` à 3 arguments rejeté |
| F-15 | Vérification statique | Le module d'évaluation ne contient ni `eval`, ni `new Function`, ni `with` (test de non-régression par recherche dans le code source) |

## 2. Graphe de dépendances

| # | Cas | Attendu |
|---|---|---|
| G-01 | Import C-01 | Tri topologique complet, 0 cycle |
| G-02 | `X-01 = X-02 + 1` et `X-02 = X-01 * 2` | Import bloqué, « Dépendance circulaire : X-01, X-02 » |
| G-03 | Autoréférence `A-01 = A-01 + 1` | Bloqué (cycle) |
| G-04 | Référence inconnue `TE-99` | Bloqué, ligne et référence citées |
| G-05 | Paramètre dérivé en chaîne (`a = b`, `b = c`, `c = 2`) | `a` = 2 |
| G-06 | Identifiant dupliqué (deux `TE-01`) | Bloqué |
| G-07 | Paramètre avec `value` **et** `formula` | Bloqué |
| G-08 | Descendants de `fouille.profondeur_commune` | `sf1/s1/s2.fouille_profondeur`, `TE-01..03`, `EV-01..05`, `RE-01`, `LOG-01` ; **pas** `TE-04`, `BP-*`, `BE-*` |

## 3. Valeurs de référence C-01 (scénario de base)

| Ligne | Attendu | Ligne | Attendu |
|---|---|---|---|
| TE-01 | 36,48 | BP-01 | 2,28 |
| TE-02 | 6,40 | BP-02 | 0,40 |
| TE-03 | 2,304 | BP-03 | 0,144 |
| TE-04 | 56,48 | TOT-01 | 2,824 |
| EV-01 | 45,184 | BE-01 | 9,50 |
| EV-02 | 56,48 | BE-02 | 1,28 |
| EV-03 | 56,48 | BE-03 | 0,60 |
| EV-04 | 0 | TOT-02 | 11,38 |
| EV-05 | −30,98 | TOT-03 | 14,204 |
| RE-01 | 30,98 | TOT-04 | 65,026 (740 / 11,38 = 65,02636…) |
| LOG-01 | 6 | LOG-02 / LOG-03 | 1 / 2 |
| IM-03 / IM-04 / IM-05 | 16 / 76 / 10 | AR-01 | 740 |

Les 8 contrôles `CHK-01` à `CHK-08` doivent être **conformes**.

## 4. Recalcul après modification d'un paramètre

| # | Modification | Attendu |
|---|---|---|
| R-01 | `sf1.fouille_largeur` 0,60 → 0,70 | TE-01 = 42,56 · TE-04 = 64,08 · EV-01 = 51,264 · EV-03 = 64,08 · TOT-01 = 3,204 · RE-01 = 36,68 · EV-05 = −36,68 · LOG-01 = 7 · BE-* inchangés |
| R-02 | `fouille.profondeur_commune` 0,80 → 0,90 | TE-01 = 41,04 · TE-02 = 7,20 · TE-03 = 2,592 · EV-01 = 50,832 · EV-03 = 63,54 · RE-01 = 36,628 · LOG-01 = 7 · **TE-04 inchangé** (56,48) |
| R-03 | `deblais.taux_reemploi` 0 → 0,65 | EV-03 = 19,768 · EV-04 = 29,3696 · EV-05 = −1,6104 · LOG-01 = 2 · EV-01 et RE-01 inchangés |
| R-04 | `s1.nombre` 8 → 10 | TE-02 = 8,00 · BE-02 = 1,60 · BP-02 = 0,50 · IM-05 = 12 · TOT-02 = 11,70 |
| R-05 | `deblais.foisonnement` 1,25 → 1,30 | EV-02 = 58,7392 · TE-04 **inchangé** : la coïncidence TE-04 = EV-02 disparaît |
| R-06 | Modification puis retour à la valeur initiale | Toutes les quantités identiques au scénario de base (pas de dérive d'arrondi) |
| R-07 | Modification d'un paramètre | Seuls ses descendants sont recalculés ; la liste des lignes impactées est présentée **avant** l'enregistrement |
| R-08 | `camion.capacite_m3` = 0 | LOG-01 en « Erreur de calcul », les autres lignes restent calculées |

## 5. Provenance et propagation

| # | Cas | Attendu |
|---|---|---|
| P-01 | TE-01 | Calculé · dépend de 3 hypothèses |
| P-02 | BE-01 | Calculé · 1 hypothèse + 2 relevés |
| P-03 | BE-02 | Calculé · 1 hypothèse + 3 relevés à vérifier |
| P-04 | Paramètre `RELEVE` sans `evidence` | Rétrogradé en `RELEVE_A_VERIFIER` + avertissement |
| P-05 | `RELEVE` avec `source_ref` seul (sans `evidence`) | Rétrogradé : une référence de plan ne suffit pas |
| P-06 | JSON contenant `SAISIE_MANUELLE` ou `CALCULE` sur une valeur | Converti en `HYPOTHESE` + avertissement |
| P-07 | Modification manuelle de `sf1.longueur` | Provenance `SAISIE_MANUELLE` ; ancienne valeur, auteur et date conservés ; TE-01 affiche « dépend d'une saisie manuelle et de 2 hypothèses » |
| P-08 | Hypothèse H-04 acceptée | Les lignes dépendantes affichent « hypothèse acceptée par X le … » ; la provenance d'origine reste visible |
| P-09 | Valeur surchargée par une variante | Provenance `VARIANTE`, jamais transférable au devis |

## 6. Rôles et totaux

| # | Cas | Attendu |
|---|---|---|
| T-01 | Liste des lignes transférables | Uniquement `role = quote` (EV-01, EV-02, TOT-*, RE-01, LOG-* exclues) |
| T-02 | Total déclaré différent du recalcul (`CHK-05` attendu 12) | Avertissement d'écart ; le recalcul (11,38) prévaut |
| T-03 | `declared_quantity` d'une ligne avec formule différente du recalcul | Avertissement ; la valeur recalculée est retenue |
| T-04 | Ligne sans `formula` ni `declared_quantity` | Import bloqué |
| T-05 | `justification` = « hypothèse forfaitaire » | Jamais interprétée comme une formule |

## 7. Durées et planning

| # | Cas | Attendu |
|---|---|---|
| D-01 | P03 (EV-01 ÷ 24) | Brut 1,8827 → 2 j |
| D-02 | P06 (740 ÷ 370) | 2,0 → 2 j (pas d'arrondi supérieur parasite) |
| D-03 | P08 (11,38 ÷ 12) | Brut 0,9483 → 1 j |
| D-04 | `parallel_units` = 2 sur P03 | 0,94 → 1 j ; avertissement si une seule pelle est prévue |
| D-05 | Durée forcée de P03 à 3 j, puis modification de la profondeur | Reste 3 j ; BeWork affiche « calculé : 2,5 j — forcé : 3 j » |
| D-06 | Planning de base, départ le 05/10/2026 | P08 le 16/10 (aligné le matin) ; P09 jusqu'au 19/10 soir ; P11 le 19/10 matin ; **durée de base 10,5 j ouvrés** |
| D-07 | Variante V-01 | P03 = 2,5 j ; fin inchangée (10,5 j) : la demi-journée est absorbée avant le coulage |
| D-08 | Attente calendaire de 3 j après un coulage le vendredi | Fin le lundi soir (week-end compté) |
| D-09 | Jour férié dans la période (départ le 09/11/2026, le 11/11 étant férié) | Le 11/11 est sauté ; fin décalée d'un jour ouvré |
| D-10 | P10 `include_in_base: false` | Exclu de la durée de base ; durée « avec conditionnelles » publiée séparément |
| D-11 | Lien `SS` entre deux tâches | Démarrage simultané (parallélisme) |
| D-12 | Cycle entre tâches | Planning refusé, tâches citées |
| D-13 | `start_date` null | Affichage en jours relatifs (J1…) sans erreur |
| D-14 | Tâche du planning absente du mode opératoire | Import bloqué |

## 8. Variantes

| # | Cas | Attendu |
|---|---|---|
| V-01 | Calcul des 3 variantes C-01 | Valeurs du §4 (R-01, R-02, R-03) ; scénario de base **inchangé** après calcul |
| V-02 | Surcharge d'une clé inexistante | Rejetée avec message |
| V-03 | Surcharge d'un paramètre dérivé (`sf1.fouille_profondeur` = 1,0) | Autorisée ; seul SF1 est modifié ; `fouille.profondeur_commune` inchangé |
| V-04 | « Retenir » V-03 | `deblais.taux_reemploi` passe en `SAISIE_MANUELLE` sur la base, avec note « Issue de la variante V-03 » et historique |
| V-05 | Coût d'une variante sans prix | « Coût non disponible — prix absents » (aucun 0 € affiché) |

## 9. Modes de dossier

| # | Cas | Attendu |
|---|---|---|
| M-01 | Import `mode: demonstration` | Statut « Dossier de démonstration » ; tous les exports portent « DÉMONSTRATION — NON CONTRACTUEL » |
| M-02 | Dossier de démonstration avec décisions bloquantes | Recalcul, planning, variantes et transfert vers un devis de démonstration **autorisés**, avec avertissements |
| M-03 | Tentative de validation professionnelle d'un dossier de démonstration | Refusée ; proposition de duplication |
| M-04 | Duplication en professionnel | `RELEVE` → `RELEVE_A_VERIFIER` ; hypothèses « non acceptées » ; statut « professionnel à valider » |
| M-05 | Validation professionnelle avec un `RELEVE_A_VERIFIER` sur une ligne `quote` | Refusée, ligne citée |
| M-06 | Import `mode: professional` | Toujours « à valider », jamais « validé » directement |

## 10. Adaptateur et non-régression

| # | Cas | Attendu |
|---|---|---|
| A-01 | JSON d'origine `bework_foundations_demo_bundle_v1` | Converti ; formules numériques signalées « non paramétrées » ; « hypothèse forfaitaire » déplacée en `justification` ; EV-01, EV-02 et RE-01 proposés en `indicator` ; étapes `workflow`/`schedule` fusionnées sans divergence |
| A-02 | Unités `FT`, `M3`, `ML`, `KG` | Normalisées en `forfait`, `m3`, `ml`, `kg` |
| A-03 | Import `bework_quote_bundle_v1` | Traité par l'importeur de devis actuel, **comportement strictement inchangé** |
| A-04 | Import `bework_quote_patch_v1`, `bework_site_report_v1`, `bework_ppsps_v1` | Inchangés |
| A-05 | Même JSON importé deux fois | Doublon détecté (empreinte), aucune seconde écriture |
| A-06 | Annulation du dernier import | Retour exact à l'état antérieur |
| A-07 | Accès à une étude d'une autre organisation | Refusé (isolation entre organisations) |
