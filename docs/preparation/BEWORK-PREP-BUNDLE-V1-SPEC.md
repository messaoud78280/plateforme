# Spécification `bework_prep_bundle_v1`

> Format d'échange JSON **ChatGPT → BeWork** pour le module **Métré & Préparation de chantier**.
> Aucune API d'intelligence artificielle : le JSON est produit hors plateforme puis collé ou téléversé dans BeWork.
>
> Statut : **Phase 0 — spécification**. Aucune table ni aucun écran n'est encore développé.
> Exemple de référence : [`exemples/c01-fondations.prep.json`](./exemples/c01-fondations.prep.json).

---

## 1. Principes

1. **Les calculs détaillés sont la seule source de vérité.** BeWork recalcule toutes les quantités à partir des paramètres et des formules. Aucun total déclaré n'est jamais repris tel quel.
2. **Chaque valeur a une provenance.** Une hypothèse n'est jamais présentée comme une mesure relevée. Une quantité calculée hérite des provenances de ses entrées.
3. **Une référence de plan ne prouve rien à elle seule.** Une valeur `RELEVE` exige une preuve de lecture (`evidence`). Sans preuve, elle est rétrogradée en `RELEVE_A_VERIFIER`.
4. **Pas d'exécution de code.** Les formules sont interprétées par un analyseur dédié, limité à l'arithmétique et à une courte liste de fonctions. Pas de `eval()`, pas de `Function()`, pas d'accès aux objets JavaScript.
5. **Prévisualisation avant enregistrement.** Un import n'écrase rien sans confirmation et peut être annulé.
6. **Séparation des responsabilités.**
   - Le **métré** porte les quantités.
   - Le **mode opératoire** porte les interventions.
   - Les **ressources** portent les moyens et les rendements.
   - Le **planning** porte les dates et les enchaînements, en citant les identifiants des interventions sans les recopier.
   - Le **devis existant** porte les prix, les marges et la TVA.
7. **Les variantes ne modifient jamais le scénario de base.** Elles ne font que surcharger des paramètres pour comparaison.

---

## 2. Enveloppe (racine)

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `format` | `"bework_prep_bundle_v1"` | oui | Identifiant du format. L'alias `type` est accepté à la lecture. |
| `schema_version` | chaîne | oui | `"1.0"` pour cette spécification. |
| `bundle_id` | chaîne, 6 à 80 caractères `[a-z0-9-]` | oui | Identifiant stable. Il sert, avec l'empreinte du contenu, à éviter les doubles imports. |
| `mode` | `"demonstration"` \| `"professional"` | oui | Voir §15. |
| `study` | objet | oui | `title` (obligatoire), `trade` (corps d'état, ex. `fondations`, `gros_oeuvre`, `vrd`, `electricite`, `plomberie`), `description`, `language` (`fr`). |
| `sources` | tableau | oui (≥ 1) | Documents analysés (§4). |
| `parameters` | tableau | oui | Paramètres techniques (§5). |
| `hypotheses` | tableau | non | Hypothèses nommées (§6). |
| `elements` | tableau | non | Ouvrages identifiés sur plan (§7). |
| `takeoff` | objet | oui | `lots[]` et `items[]` du métré (§8). |
| `checks` | tableau | non | Valeurs attendues à comparer au recalcul (§9). |
| `resources` | objet | non | Main-d'œuvre, matériel, fournitures, rendements (§10). |
| `workflow` | objet | non | `steps[]` du mode opératoire (§11). |
| `schedule` | objet | non | Calendrier et enchaînements (§12). |
| `decisions` | tableau | non | Décisions techniques restant à valider (§13). |
| `variants` | tableau | non | Variantes de métré (§14). |
| `disclaimers` | tableau de chaînes | non | Avertissements affichés et imprimés. |

Tout champ inconnu est **conservé** dans le journal d'import, signalé en avertissement et **ignoré** par les calculs.

---

## 3. Conventions

### 3.1 Identifiants

| Objet | Motif | Exemples |
|---|---|---|
| Clé de paramètre | `^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$` (minuscules, points pour hiérarchiser) | `sf1.longueur`, `fouille.profondeur_commune` |
| Ligne de métré | `^[A-Z][A-Z0-9]*-[0-9]{1,4}$` (majuscules, tiret, chiffres) | `TE-01`, `TOT-02`, `LOG-01` |
| Source | `SRC-…` | `SRC-C01` |
| Hypothèse | `H-…` | `H-04` |
| Élément | `EL-…` | `EL-SF1` |
| Intervention | `P` + chiffres | `P03` |
| Main-d'œuvre / matériel / fourniture / rendement | `L-…` / `EQ-…` / `SU-…` / `R-…` | `L-FERR`, `EQ-PELLE`, `R-TERR` |
| Décision / variante / contrôle | `D-…` / `V-…` / `CHK-…` | `D-03`, `V-01`, `CHK-05` |

Chaque identifiant est **unique dans son espace**. Une clé de paramètre et un identifiant de ligne ne peuvent jamais se confondre : les paramètres sont en minuscules, les lignes en majuscules.

### 3.2 Nombres

- Point décimal (`0.60`), jamais de virgule ni de séparateur de milliers.
- Longueurs en **mètres**. Pas de centimètres implicites : 60 cm s'écrit `0.6` avec l'unité `m`.

### 3.3 Unités canoniques

`m`, `ml`, `m2`, `m3`, `u`, `kg`, `t`, `forfait`, `h`, `j`, `rotation`, `coef`, `kg/m3`, `m3/j`, `m2/j`, `ml/j`, `kg/j`, `u/j`.

L'adaptateur normalise les variantes courantes :

| Variante reçue | Unité canonique |
|---|---|
| `FT`, `FFT`, `ENS` | `forfait` |
| `M3`, `m³` | `m3` |
| `M2`, `m²` | `m2` |
| `ML`, `m.l` | `ml` |
| `U`, `pce` | `u` |
| `KG` | `kg` |

L'unité est contrôlée à titre indicatif en V1 : une incohérence évidente, comme une formule `longueur × largeur` déclarée en `m3`, produit un **avertissement**, pas un blocage.

---

## 4. Sources

```json
{ "id": "SRC-C01", "filename": "plan de fondation.pdf", "plan_number": "C-01",
  "title": "Plan Niveau Fondations", "revision": null, "date": null, "scale": "1:50",
  "page": 1, "is_raster": true, "legibility": "partielle", "note": "…" }
```

`legibility` prend l'une des valeurs `bonne`, `partielle` ou `mauvaise`. Un `revision` à `null` déclenche le point à vérifier « Indice de révision non identifié ».

---

## 5. Paramètres

Un paramètre est soit une **valeur**, soit une **formule** (paramètre dérivé), jamais les deux.

| Champ | Obligatoire | Description |
|---|---|---|
| `key` | oui | Clé unique (§3.1). |
| `label` | oui | Libellé métier lisible. |
| `value` | l'un des deux | Nombre. |
| `formula` | l'un des deux | Expression (§8.3). Le paramètre prend alors la provenance `CALCULE`. |
| `unit` | oui | Unité canonique. |
| `provenance` | oui si `value` | Voir §5.1. |
| `source_ref` | oui si `RELEVE` ou `RELEVE_A_VERIFIER` | Identifiant de source. |
| `evidence` | oui si `RELEVE` | `{ kind, location, quote }`. `kind` vaut `cote_lue`, `texte_lu` ou `comptage_visuel`. `location` indique où la valeur a été lue. `quote` reproduit le texte ou la cote lus. |
| `hypothesis_id` | recommandé si `HYPOTHESE` | Lien vers §6. |
| `note` | non | Commentaire. |

Les paramètres dérivés servent à **factoriser** sans figer de valeurs. Exemple : `sf1.fouille_profondeur = fouille.profondeur_commune`. Modifier la profondeur commune recalcule alors les trois familles de fouilles.

### 5.1 Provenance

| Code | Libellé affiché | Qui l'attribue | Règle |
|---|---|---|---|
| `RELEVE` | Relevé sur document | JSON | Exige `source_ref` **et** `evidence`. Sinon, rétrogradé en `RELEVE_A_VERIFIER` avec avertissement. |
| `RELEVE_A_VERIFIER` | Relevé à vérifier | JSON | Lecture incertaine, document raster, cote partiellement lisible. |
| `HYPOTHESE` | Hypothèse technique | JSON | Valeur supposée. Doit être explicable (`hypothesis_id` ou `note`). |
| `CALCULE` | Calculé | **BeWork uniquement** | Attribué automatiquement à toute valeur issue d'une formule. |
| `SAISIE_MANUELLE` | Saisi ou modifié manuellement | **BeWork uniquement** | Attribué quand un utilisateur modifie une valeur. Conserve l'ancienne valeur, l'auteur et la date. |

Si un JSON contient `CALCULE` ou `SAISIE_MANUELLE` sur une valeur, BeWork le **rejette** pour cette valeur, la convertit en `HYPOTHESE` et lève un avertissement. Une IA externe ne peut pas se déclarer auteur d'une saisie manuelle.

### 5.2 Propagation

Toute quantité calculée porte l'**ensemble des provenances de ses entrées de base**, en suivant les dépendances à travers les paramètres dérivés et les lignes intermédiaires. L'interface affiche par exemple :

- `TE-01` — Calculé · **dépend de 3 hypothèses** (`sf1.longueur`, `sf1.fouille_largeur`, `fouille.profondeur_commune`)
- `BE-01` — Calculé · dépend de 1 hypothèse et de 2 relevés
- `BE-02` — Calculé · dépend de 1 hypothèse et de **3 relevés à vérifier**

Une quantité n'est affichée « fiable » que si toutes ses entrées sont `RELEVE` ou `SAISIE_MANUELLE`, ou des hypothèses **acceptées** par un utilisateur habilité (§15.3).

---

## 6. Hypothèses

```json
{ "id": "H-04", "statement": "Profondeur de fouille commune 0,80 m sous terrain de référence.",
  "reason": "Niveau d'assise non lisible…", "to_confirm_with": "Étude géotechnique…" }
```

BeWork calcule lui-même la liste des paramètres et lignes affectés, via `hypothesis_id` et la propagation. Une hypothèse peut être **acceptée** (nom, date, commentaire) ou **remplacée** par une valeur relevée. Elle n'est jamais supprimée silencieusement.

---

## 7. Éléments (ouvrages identifiés)

```json
{ "id": "EL-SF1", "code": "SF1", "kind": "semelle_filante",
  "label": "Semelles filantes SF1 (50 x 25 cm)", "parameter_prefix": "sf1", "source_ref": "SRC-C01" }
```

`parameter_prefix` regroupe les paramètres de l'ouvrage à l'affichage : fiche « SF1 » avec longueur, largeur, hauteur, fouille. `kind` est libre en V1. Valeurs conseillées : `semelle_filante`, `semelle_isolee`, `longrine`, `radier`, `voile`, `poteau`, `poutre`, `dalle`, `reseau`, `regard`, `tranchee`.

---

## 8. Métré

### 8.1 Lots

`takeoff.lots[]` : `{ code, label }`. Le code est court et en majuscules (`TER`, `BET`). L'ordre du tableau définit l'ordre d'affichage.

### 8.2 Lignes

| Champ | Obligatoire | Description |
|---|---|---|
| `id` | oui | Identifiant de ligne (§3.1). |
| `lot` | oui | Code de lot existant. |
| `sub_lot` | non | Sous-lot libre. |
| `designation` | oui | Libellé court exploitable sur chantier et en devis. |
| `description` | non | Alias historique de `technical_description`. |
| `technical_description` | non | Description technique développée (fiche poste / type CCTP). |
| `included_services` | non | Prestations comprises (`string[]` ou texte multiligne). |
| `technical_references` | non | Références techniques : `{ label, kind, note? }` avec `kind` = `INDICATIVE` \| `DOSSIER` \| `TO_VERIFY`. |
| `execution_notes` | non | Notes d'exécution. |
| `quality_controls` | non | Contrôles à effectuer (`string[]`). |
| `technical_reservations` | non | Points restant à confirmer (`string[]`). |
| `unit` | oui | Unité canonique. |
| `element_ids` | non | Ouvrages concernés. |
| `formula` | non | Expression. Si présente, la quantité est **toujours** recalculée. |
| `declared_quantity` | oui si pas de `formula` | Si `formula` est présente, sert uniquement de **contrôle** : un écart supérieur à la tolérance produit un avertissement. |
| `provenance` | oui si pas de `formula` | `RELEVE`, `RELEVE_A_VERIFIER` ou `HYPOTHESE`. |
| `justification` | recommandé si pas de `formula` | Texte libre (ex. « hypothèse forfaitaire »). **N'est jamais interprété comme une formule.** |
| `role` | oui | Voir ci-dessous. |
| `nature` | non | `en_place`, `foisonne`, `compacte` ou `theorique`. Évite de confondre un volume en place et un volume foisonné, ou de prendre une quantité théorique pour une quantité définitive. |
| `depends_on_decisions` | non | Décisions ouvertes dont dépend la ligne (§13). |
| `notes` | non | Avertissements métier. |

**Rôle d'une ligne** :

- `quote` : quantité **transférable** au devis.
- `indicator` : grandeur de contrôle ou de décision (déblais en place, vide à remblayer, totaux, ratios). **Jamais transférée au devis.**
- `logistics` : moyens estimés (rotations, toupies). Sert au planning et aux variantes. Non transférée au devis.

**Totaux** : un total est **toujours** une ligne `indicator` avec une formule, par exemple `TOT-01 = BP-01 + BP-02 + BP-03`. Il n'existe aucun champ « total » libre.

### 8.3 Grammaire des formules

```text
expression := terme (("+" | "-") terme)*
terme      := facteur (("*" | "/") facteur)*
facteur    := ("+" | "-") facteur | primaire
primaire   := nombre | reference | fonction "(" expression ("," expression)* ")" | "(" expression ")"
nombre     := [0-9]+ ("." [0-9]+)?
reference  := cle_parametre | id_ligne
fonction   := "min" | "max" | "ceil" | "floor" | "round" | "abs"
```

- `round(x, n)` arrondit à `n` décimales, 0 par défaut. `ceil` et `floor` tolèrent un écart de 1e-9 pour neutraliser les erreurs de virgule flottante.
- Les priorités sont usuelles. Les parenthèses sont autorisées.
- `TE-01-TE-02` est lu comme `TE-01 − TE-02`. Écrire des espaces autour des opérateurs reste recommandé.
- **Limites** :
  - 500 caractères par formule ;
  - profondeur d'imbrication maximale de 32 ;
  - toute référence doit exister ;
  - aucune fonction hors liste ;
  - aucun autre caractère accepté : pas de crochets, guillemets, points-virgules ni lettres isolées hors clés.
- **Erreurs non bloquantes pour le reste du métré** :
  - une division par zéro ou une référence sans valeur produit une quantité **vide**, affichée « Erreur de calcul — à vérifier » ;
  - les lignes qui en dépendent passent aussi en erreur.

### 8.4 Moteur de recalcul

1. Construction du graphe « paramètres + lignes », les arêtes allant des références vers les formules.
2. **Détection des cycles** par tri topologique (algorithme de Kahn). Un cycle bloque l'import et désigne les lignes concernées.
3. Évaluation dans l'ordre topologique, en double précision. **Aucun arrondi intermédiaire.**
4. Stockage à 4 décimales. Affichage à 3 décimales maximum, zéros inutiles supprimés.
5. Après la modification d'un paramètre, seuls ses **descendants** sont recalculés. La liste des lignes impactées est présentée **avant** l'enregistrement.
6. Tolérance de comparaison avec `declared_quantity` et `checks` : `max(0,001 ; 0,1 % de la valeur)`.

---

## 9. Contrôles

```json
{ "id": "CHK-05", "label": "Béton des semelles", "target": "TOT-02", "expected": 11.38 }
```

Les contrôles servent **uniquement** à comparer le recalcul aux valeurs annoncées par le document d'analyse. Un écart est signalé en avertissement. Le recalcul prévaut toujours.

---

## 10. Ressources et rendements

```json
"resources": {
  "labor":     [{ "id": "L-FERR", "role": "Ferrailleur", "note": null }],
  "equipment": [{ "id": "EQ-PELLE", "category": "terrassement", "label": "Pelle hydraulique", "note": "…" }],
  "supplies":  [{ "id": "SU-BETON-SEM", "label": "Béton de fondation", "note": "Classe à confirmer…" }],
  "rates":     [{ "id": "R-TERR", "label": "Terrassement en fouilles", "value": 24, "unit": "m3/j",
                  "per": "engin", "provenance": "HYPOTHESE", "note": "…" }]
}
```

- `equipment.category` prend l'une des valeurs `installation`, `implantation`, `terrassement`, `transport`, `levage`, `betonnage`, `securite`, `cure`, `autre`.
- `rates.per` vaut `engin` ou `equipe` : c'est l'unité productive à laquelle s'applique le rendement.
- Les rendements sont **modifiables** dans BeWork. Toute modification passe en `SAISIE_MANUELLE` et relance le calcul des durées.
- Lien facultatif, dans BeWork uniquement, vers les bibliothèques existantes `CommercialLaborResource` et `CommercialEquipmentResource`, pour récupérer des coûts. Aucune copie n'est faite dans la bibliothèque.

---

## 11. Mode opératoire

Le mode opératoire est la **référence des interventions**.

| Champ | Obligatoire | Description |
|---|---|---|
| `id`, `order`, `name` | oui | `order` fixe l'ordre d'affichage, pas l'enchaînement. |
| `lot` | non | Code de lot du métré. |
| `kind` | oui | `work` (travaux), `control` (contrôle) ou `wait` (attente sans équipe : cure, séchage, délai administratif). |
| `description` | non | Texte métier court. |
| `takeoff_ids` | non | Lignes de métré réalisées par l'intervention. Les quantités sont **lues** dans le métré, jamais recopiées. |
| `duration` | oui | Voir §11.1. |
| `crew` | non | `[{ labor_id, count }]`. |
| `equipment` | non | `[{ equipment_id, count }]`. |
| `supplies` | non | `[supply_id]`. |
| `preconditions` | non | Conditions avant démarrage. |
| `controls_before_next` | non | Contrôles avant l'étape suivante. |
| `constraints`, `safety` | non | Contraintes d'exécution, mesures de sécurité. |
| `proofs` | non | Pièces à conserver (photos, bons, PV) : utiles au DOE et aux litiges. |
| `hold_point` | non | `true` = **point d'arrêt**. L'étape suivante ne peut pas être déclarée démarrée sans levée tracée (qui, quand). |
| `conditional` | non | `{ conditions: [...] }` = **tâche conditionnelle**, exclue de la durée de base tant que les conditions ne sont pas levées. |

### 11.1 Durée d'une intervention

Deux modes sont possibles.

**Mode calculé** :

```json
{ "mode": "computed", "driver_item": "EV-01", "rate_id": "R-TERR",
  "parallel_units": 1, "rounding": "ceil_half_day" }
```

La durée brute vaut `quantité(driver_item) ÷ (rendement × parallel_units)`. Elle est ensuite arrondie à la demi-journée supérieure.

- `parallel_units` représente le nombre d'engins ou d'équipes travaillant en parallèle. Il doit rester cohérent avec `crew` et `equipment` : un avertissement est levé si `parallel_units` = 2 alors qu'une seule pelle est prévue.
- Une ligne `logistics` peut servir de `driver_item`.
- Le calcul se relance à chaque changement de quantité, de rendement ou d'effectif.

**Mode fixe** :

```json
{ "mode": "fixed", "days": 1, "calendar": "working", "provenance": "HYPOTHESE" }
```

`calendar` vaut `working` (jours ouvrés) ou `calendar` (jours calendaires, pour les attentes). Le mode fixe est utilisé quand aucun rendement n'est pertinent : installation, contrôle, cure.

**Durée forcée** : dans BeWork, l'utilisateur peut forcer une durée (`SAISIE_MANUELLE`). La valeur forcée **n'est jamais écrasée** par un recalcul. BeWork affiche à côté la durée calculée et l'écart.

---

## 12. Planning

Le planning **cite les identifiants** des interventions. Il ne recopie ni leurs noms, ni leurs durées, ni leurs quantités.

```json
"schedule": {
  "start_date": "2026-10-05", "start_date_provenance": "HYPOTHESE",
  "calendar": { "working_days": [1,2,3,4,5], "holidays": "FR_METROPOLE", "granularity_days": 0.5 },
  "tasks": [
    { "step_id": "P08", "depends_on": [{ "step_id": "P07", "type": "FS", "lag_days": 0, "lag_calendar": "working" }],
      "start_alignment": "day_start" },
    { "step_id": "P10", "depends_on": [{ "step_id": "P09", "type": "FS" }], "include_in_base": false }
  ]
}
```

| Élément | Règle |
|---|---|
| `start_date` | Date ISO ou `null`. Si `null`, le planning est affiché en jours relatifs (J1, J2…). |
| `working_days` | 1 = lundi … 7 = dimanche. |
| `holidays` | `FR_METROPOLE` : jours fériés français calculés, Pâques inclus. Un tableau de dates ISO est aussi accepté. Les congés d'entreprise sont ajoutés dans BeWork. |
| `granularity_days` | 0,5 : demi-journée. |
| `depends_on.type` | `FS` (fin → début, par défaut), `SS` (début → début, pour les **interventions parallèles**), `FF` (fin → fin). |
| `lag_days` / `lag_calendar` | Décalage, positif ou négatif, en jours ouvrés ou calendaires. |
| `start_alignment` | `day_start` : la tâche commence obligatoirement en début de journée. Exemple : un coulage ne commence pas l'après-midi. |
| `include_in_base` | `false` : tâche conditionnelle, affichée hachurée, exclue de la durée de base. |
| Tâche sans dépendance | Démarre au début du planning, ce qui permet le parallélisme. |

**Moteur (V1)** :

1. Tri topologique des tâches. Les cycles sont refusés.
2. Calcul au plus tôt en temps ouvré, à la demi-journée près.
3. Une attente calendaire commence à la fin de la tâche précédente et se termine N jours calendaires plus tard. Le résultat est reconverti en temps ouvré : une cure de 3 jours après un coulage le vendredi se termine le lundi soir.
4. Deux durées sont publiées :
   - la **durée de base**, calculée sur les tâches `work` et `control` avec `include_in_base ≠ false` ;
   - la **durée avec conditionnelles**.
5. Les marges et le chemin critique sont affichés à titre indicatif en V1.

Les **étapes bloquantes** sont les points d'arrêt et les décisions `blocking_for: execution` non levées. Elles restent visibles sur le Gantt avec leur motif. Le planning continue d'être calculé, mais il est marqué « sous réserve ».

---

## 13. Décisions techniques

```json
{ "id": "D-03", "question": "Fixer le scénario de réemploi…",
  "affects": ["deblais.taux_reemploi", "EV-03", "RE-01"],
  "blocking_for": ["validation", "quote_transfer"] }
```

`blocking_for` peut contenir les valeurs suivantes :

- `validation` : empêche le passage en « Dossier professionnel validé ».
- `quote_transfer` : empêche le transfert au devis en mode professionnel.
- `execution` : l'étape concernée est affichée « bloquante » au planning.

Chaque décision a un statut dans BeWork : `OUVERTE`, `EN_ATTENTE`, `TRANCHEE` ou `SANS_OBJET`. Une décision tranchée conserve la réponse, l'auteur, la date et, le cas échéant, le paramètre modifié.

En mode **démonstration**, les blocages sont affichés comme des **avertissements** et n'empêchent pas les tests (§15).

---

## 14. Variantes

```json
{ "id": "V-01", "label": "Fouille SF1 élargie à 70 cm", "description": "…",
  "overrides": { "sf1.fouille_largeur": 0.7 } }
```

- Une variante ne contient **que des surcharges de paramètres**. Elle ne modifie ni les formules, ni le scénario de base, ni les prescriptions validées.
- Les valeurs surchargées portent la provenance `VARIANTE`, un statut réservé aux comparaisons. Une variante ne peut **jamais** être transférée au devis ni exportée comme dossier d'exécution.
- La comparaison présente, pour chaque variante et par rapport à la base :
  - les quantités qui changent et leur écart ;
  - les déblais : en place, à évacuer, réemploi, bilan des terres ;
  - les moyens : rotations, toupies ;
  - la durée de base et les dates décalées ;
  - le **coût**, uniquement si des prix existent (lignes associées à un ouvrage de bibliothèque ou à un devis). Sinon, « Coût non disponible — prix absents ».
- **Retenir une variante** est une action explicite : ses surcharges deviennent des `SAISIE_MANUELLE` sur la base, avec une note « Issue de la variante V-xx », l'auteur et la date. L'ancien état reste consultable dans l'historique.

---

## 15. Modes et statuts de dossier

### 15.1 Statuts

| Statut | Origine | Mention sur tous les documents (écran, PDF, devis) |
|---|---|---|
| **Dossier de démonstration** | Import avec `mode: "demonstration"` | **DÉMONSTRATION — NON CONTRACTUEL** (filigrane et en-tête) |
| **Dossier professionnel à valider** | Import avec `mode: "professional"`, ou duplication d'un dossier de démonstration | « Document de travail — à valider » |
| **Dossier professionnel validé** | Action de validation par un utilisateur habilité | Aucune mention restrictive. Nom et date du validateur imprimés. |

Un import ne produit **jamais** directement un dossier validé.

### 15.2 Ce que permet le mode démonstration

Tout le parcours fonctionne : import, modification des paramètres, recalcul, mode opératoire, planning, variantes, transfert vers un **devis de démonstration**, chiffrage, export PDF.

Garde-fous :

- La mention **DÉMONSTRATION — NON CONTRACTUEL** est imprimée sur chaque page de chaque export et sur le devis issu du transfert.
- Un dossier de démonstration **ne peut pas** passer en « professionnel validé ». Pour un usage réel, il faut le **dupliquer** en « professionnel à valider » :
  - tous les `RELEVE` sont rétrogradés en `RELEVE_A_VERIFIER` ;
  - toutes les hypothèses sont remises « non acceptées ».
- Un devis de démonstration **ne peut pas** être converti en facture ni envoyé comme devis réel. Il est exclu des indicateurs commerciaux.
- Recommandation pour les formations : utiliser une **organisation de démonstration** (`Organization.kind = DEMO` / `DemoEnvironment`, déjà présents dans BeWork). Les devis de démonstration n'y consomment pas la numérotation d'une entreprise réelle. Le traitement d'un devis de démonstration dans une organisation réelle est à arbitrer en phase 2 (§16).

### 15.3 Validation professionnelle

Le passage en « professionnel validé » exige :

- aucune erreur de calcul ;
- aucune décision `blocking_for: validation` ouverte ;
- aucun `RELEVE_A_VERIFIER` sur une ligne `quote` ;
- chaque `HYPOTHESE` impactant une ligne `quote` soit **acceptée** nommément (nom, date, commentaire).

La validation fige une **version** du métré. Toute modification ultérieure crée une nouvelle version.

---

## 16. Passerelle vers le devis existant (rappel de conception, phase 2)

- Seules les lignes `role: "quote"` sont proposées au transfert, regroupées en sections par lot, avec prévisualisation.
- Le transfert utilise les fonctions existantes du module devis : création de devis, ajout de section, ajout de ligne ou de ligne depuis un ouvrage de bibliothèque. Il respecte le contrôle « version modifiable ».
- Le lien métré ↔ devis est tracé dans une table de liaison, **sans modifier les tables de lignes de devis**.
- En cas d'écart après transfert, BeWork affiche l'ancienne quantité, la nouvelle, la différence et l'incidence financière (écart × prix unitaire HT de la ligne du devis). L'utilisateur applique ligne par ligne ou refuse. **Aucune modification silencieuse.**
  - Si le devis est verrouillé ou envoyé, BeWork propose une nouvelle version ou un avenant.
- Point à arbitrer en phase 2 : marquage des devis de démonstration dans une organisation réelle (numérotation, exclusion des indicateurs, blocage de la facturation).

---

## 17. Adaptateur des anciens formats

| Format reçu | Traitement |
|---|---|
| `bework_foundations_demo_bundle_v1` et bundles séparés `bework_takeoff_bundle_v1`, `bework_workflow_bundle_v1`, `bework_resources_bundle_v1`, `bework_schedule_bundle_v1` | Converti en `bework_prep_bundle_v1`, avec un rapport de conversion. |
| `bework_quote_bundle_v1`, `bework_quote_patch_v1`, `bework_site_report_v1`, `bework_ppsps_v1` | **Non concernés** : ils continuent d'être traités par leurs importeurs actuels, **sans aucun changement de comportement**. |

Règles de conversion pour les anciens bundles de préparation :

- Une formule purement numérique (`76 * 0.60 * 0.80`) est conservée, mais signalée « **non paramétrée — recalcul automatique impossible** ». L'utilisateur peut la paramétrer ensuite.
- Une formule textuelle (`hypothèse forfaitaire`) est déplacée dans `justification`, et `quantity` devient `declared_quantity`.
- Correspondance des provenances :

  | Provenance d'origine | Provenance convertie |
  |---|---|
  | `demo_assumption` | `HYPOTHESE` |
  | `calculated_from_*` | `CALCULE` si une formule calculable existe, sinon `HYPOTHESE` |
  | `observed` | `RELEVE_A_VERIFIER` (preuve absente) |

- Les étapes dupliquées entre `workflow` et `schedule` sont fusionnées. En cas de divergence, le mode opératoire l'emporte et l'écart est signalé.
- `duration_work_days_demo` devient `duration: { mode: "fixed", calendar: "working" }`. Pour les étapes de cure, une conversion en jours calendaires est **proposée**, jamais appliquée d'office.
- Le rôle des lignes est déduit prudemment. Par défaut, une ligne vaut `quote`. Elle devient `indicator` si ses notes contiennent « indicateur », « non quantité retenue » ou « pas automatiquement ». Chaque déduction est signalée pour validation.

---

## 18. Parcours d'import (rappel)

1. Coller ou téléverser le JSON.
2. Contrôle du format et adaptation éventuelle.
3. Validation du schéma : erreurs bloquantes ou avertissements.
4. Recalcul complet et comparaison avec les contrôles.
5. **Prévisualisation** :
   - métré par lot avec les provenances ;
   - hypothèses ;
   - décisions ouvertes ;
   - mode opératoire ;
   - planning ;
   - écarts détectés.
6. Choix de l'action : créer une nouvelle étude dans le projet, ou mettre à jour une étude existante. La mise à jour exige une confirmation explicite, avec une copie de l'état antérieur.
7. Enregistrement avec empreinte anti-doublon et journal d'import. **Annulation du dernier import** possible.

Erreurs **bloquantes** :

- format inconnu ;
- JSON invalide ;
- identifiant dupliqué ;
- référence inconnue ;
- cycle de dépendances ;
- formule syntaxiquement invalide ;
- lot inexistant ;
- `value` et `formula` présents ensemble ;
- ni `formula` ni `declared_quantity` sur une ligne.

Tout le reste produit des **avertissements**.
