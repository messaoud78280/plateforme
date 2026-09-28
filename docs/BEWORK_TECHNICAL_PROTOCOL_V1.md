# BeWork Technical Protocol V1

> Contrat technique universel **ChatGPT (externe) → BeWork**.
> Format canonique : `bework_technical_bundle_v1`.
>
> **Statut : Phases A–G livrées (parser / preview / commit / date / compat / tests structurels).**  
> Aucune migration DB. Aucune API IA. ChatGPT reste hors plateforme.

---

## 0. Objectif produit

Quelle que soit la source (visite, plan, photos, devis, notes, combinaison) :

```
SOURCE(S)
  → ANALYSE (ChatGPT externe)
  → bework_technical_bundle_v1
  → BeWork (parse → preview → commit)
  → MÉTRÉ (PrepStudy)
  → DEVIS (passerelle existante)
  → PLANNING (PrepSchedulePlan)
  → SUIVI / CR / NOTICE / DOSSIER
```

Le chantier change. La méthode ne change plus.

---

## 1. Architecture existante (audit)

### 1.1 Formats d’échange déjà en production

| Format | Rôle | Emplacement |
|---|---|---|
| `bework_prep_bundle_v1` | Métré + paramètres + workflow + schedule + resources | `src/lib/preparation/` + `docs/preparation/BEWORK-PREP-BUNDLE-V1-SPEC.md` |
| `bework_quote_bundle_v1` | Création / import devis commercial | `src/lib/commercial/chatgpt-bundle/` |
| `bework_prep_patch_v1` | Patch ciblé sur PrepStudy | `src/lib/preparation/chatgpt-patch/` |
| `bework_foundations_demo_bundle_v1` | Legacy fondations → adapté | `bundle/adapt-legacy.ts` |

### 1.2 Modèles Prisma réutilisés (ne pas dupliquer)

| Modèle | Usage |
|---|---|
| `PrepStudy` | Étude de métré (workflowJson, scheduleJson, resourcesJson, bundleId…) |
| `PrepParameter` | Paramètres techniques + provenance |
| `PrepTakeoffLine` | Lignes de métré |
| `PrepImport` | Journal d’import + idempotence |
| `PrepQuoteTransfer` / `PrepQuoteLink` | Passerelle métré → devis |
| `PrepSchedulePlan` / `PrepScheduleTask` / `PrepScheduleDependency` | Planning |
| `PrepScheduleTakeoffLink` / `PrepScheduleQuoteLink` | Liens tâches ↔ métré / devis |
| `PrepScheduleEvent` | Historique planning |
| `ProjectScope` | Lot / phase / filtre — **pas** un nouveau PrepStudy obligatoire |
| `SiteVisit` / `SiteVisitMeasurement` / `SiteVisitMedia` | Visite terrain |
| `ChantierFile` / `SiteDocument` | Documents / plans / photos uniques |
| `FollowUpSheet` | Suivi (à brancher sur tâches planning existantes) |
| `CommercialQuote` | Devis — jamais créé silencieusement à l’import technique |

### 1.3 Moteurs à conserver

- Parse / preview / commit prep : `bundle/parse.ts`, `service.ts`
- Calcul quantités : `engine/compute.ts`
- Schedule preview / commit : `schedule/compute.ts`, `schedule/transfer.ts`
- Quote bridge : `quote-bridge/transfer.ts`
- Adapt legacy : `bundle/adapt-legacy.ts`

### 1.4 Problème identifié (corrigé Phase A)

`schedule/compute.ts` utilisait `1970-01-01` comme ancre lorsque `start_date` était null, puis persistait ces dates sur les tâches.  
**Correction :** ancre relative interne non exposée ; dates civiles `null` ; UI « Date de démarrage à définir ».

---

## 2. Composants réutilisés vs nouveau

### Réutiliser (couche existante)

- Tout le moteur PrepStudy / takeoff / workflow / schedule / quote transfer
- Provenances actuelles (`RELEVE`, `RELEVE_A_VERIFIER`, `HYPOTHESE`, `SAISIE_MANUELLE`, `CALCULE`)
- Idempotence `bundle_id` + `PrepImport` / clés transfer
- ProjectScope = filtre (jamais masquer les données globales)

### Nouveau (couche universelle au-dessus)

| Élément | Rôle |
|---|---|
| `bework_technical_bundle_v1` | Enveloppe unique multi-sources |
| Adapter `bework_prep_bundle_v1` → technical | Compatibilité |
| Adapter partiel quote / visite → technical | Entrées futures |
| Parser + preview + commit technique | Orchestration (Phases B–D) |
| `planning_settings` explicite | start_date null-safe |
| Classification données étendue | MEASURED / ASSUMED / UNKNOWN… |
| Quantités multi-rôles (préparées) | geometric / technical / procurement / quote / planning |

**Aucune deuxième plateforme.** Le commit technique peuplera les modèles Prisma existants.

---

## 3. Schéma `bework_technical_bundle_v1`

Référence TypeScript : `src/lib/technical-engine/schema.ts`.

```json
{
  "format": "bework_technical_bundle_v1",
  "schema_version": "1.0",
  "bundle_id": "tech-morel-terrassement-001",
  "source_revision": 1,
  "mode": "professional",

  "meta": {
    "language": "fr",
    "generated_at": "2026-09-28",
    "generator": "chatgpt-external",
    "title": "Terrassement maison R+1 — MOREL"
  },

  "project": {
    "external_ref": null,
    "title": "…",
    "address": "…",
    "trade_hints": ["terrassement"],
    "client_name": null
  },

  "sources": [],
  "facts": [],
  "measurements": [],
  "assumptions": [],
  "unknowns": [],
  "lots": [],

  "takeoff": {
    "parameters": [],
    "items": []
  },

  "workflow": { "steps": [] },
  "schedule": { "tasks": [], "note": null },

  "planning_settings": {
    "start_date": null,
    "desired_start_period": null,
    "start_date_confidence": null,
    "start_date_source": null,
    "working_days": ["MON", "TUE", "WED", "THU", "FRI"],
    "calendar": "FR"
  },

  "quote_transfer": {
    "create_quote": false,
    "selected_codes": null,
    "note": null
  },

  "documents": { "plan_refs": [], "file_refs": [] },
  "media": [],
  "controls": [],
  "warnings": [],
  "disclaimers": []
}
```

### 3.1 Blocs conceptuels

| Bloc | Obligatoire | Contenu |
|---|---|---|
| `meta` | oui | Titre, langue, générateur |
| `project` | oui | Identification chantier (sans inventer d’IDs BeWork) |
| `sources` | oui (≥0) | Preuves / documents / visites |
| `facts` | non | Constats classés |
| `measurements` | non | Relevés terrain / plan |
| `assumptions` | non | Hypothèses nommées |
| `unknowns` | non | Inconnus **sans** les remplacer |
| `lots` | non | Découpage lots |
| `takeoff` | oui | Paramètres + lignes (noyau prep) |
| `workflow` | non | Mode opératoire générique |
| `schedule` | non | Tâches + dépendances (sans inventer de dates) |
| `planning_settings` | oui si schedule | start_date null-safe |
| `quote_transfer` | non | Intention de transfert — pas de création auto |
| `documents` / `media` | non | Références, pas de duplication binaire |
| `controls` / `warnings` | non | Points de contrôle / alertes |

### 3.2 Provenance & confiance

Chaque donnée technique peut porter :

```json
{
  "source": "field_measurement",
  "source_ref": "SRC-VISIT-01",
  "confidence": "confirmed",
  "classification": "MEASURED"
}
```

**Types de source :**  
`site_visit` · `field_measurement` · `plan` · `photo` · `client_statement` · `technical_document` · `quote` · `user_input` · `calculation` · `assumption`

**Classifications :**  
`MEASURED` · `OBSERVED` · `DECLARED` · `CALCULATED` · `ESTIMATED` · `ASSUMED` · `TO_CONFIRM` · `UNKNOWN` · `NOT_APPLICABLE`

**Règle :** `UNKNOWN ≠ ASSUMED`. Une inconnue ne doit jamais être remplie artificiellement.

#### Mapping vers provenances PrepStudy existantes

| Classification / source | Provenance Prep stockée |
|---|---|
| MEASURED + plan/photo avec evidence | `RELEVE` |
| MEASURED / OBSERVED sans evidence solide | `RELEVE_A_VERIFIER` |
| ASSUMED / ESTIMATED | `HYPOTHESE` |
| CALCULATED (formule) | dérivé `CALCULE` |
| DECLARED client | `RELEVE_A_VERIFIER` (+ note) |
| UNKNOWN | **pas de valeur** — entrée dans `unknowns[]` |
| Saisie UI BeWork | `SAISIE_MANUELLE` |

### 3.3 Takeoff — quantités multi-rôles (progressif)

```json
{
  "code": "TER-03",
  "lot": "TERR",
  "designation": "Terrassement fouilles de fondations",
  "unit": "m3",
  "formula": "54 * 0.60 * 0.80",
  "quantities": {
    "geometric": 25.92,
    "technical": 25.92,
    "procurement": null,
    "quote": 25.92,
    "planning": 25.92
  },
  "classification": "CALCULATED",
  "confidence": "to_confirm",
  "warnings": ["Largeur et profondeur à confirmer"]
}
```

En V1 d’import, `technical` (ou quantité nette retenue) alimente `PrepTakeoffLine` comme aujourd’hui. Les autres rôles sont conservés en JSON / notes sans casser le modèle.

### 3.4 Planning — règle absolue des dates

```json
"planning_settings": {
  "start_date": null,
  "desired_start_period": "2026-10",
  "working_days": ["MON", "TUE", "WED", "THU", "FRI"],
  "calendar": "FR"
}
```

| Situation | Comportement BeWork |
|---|---|
| `start_date = null` | Aucune date civile sur tâches ; durées relatives OK ; UI « à définir » |
| `start_date = "2026-10-05"` + confiance | Dates calculées |
| Période floue seule (`desired_start_period`) | `start_date` reste null |
| Jamais | `new Date(0)`, `1970-01-01`, date serveur arbitraire |

Recalcul ultérieur (« Définir la date de démarrage ») : **Phase E** — met à jour les dates sans recréer tâches / métré / devis.

### 3.5 Quote transfer

`quote_transfer.create_quote` défaut `false`.  
L’import technique **ne crée pas** de `CommercialQuote`. La passerelle existante (preview → sélection → commit) reste le seul chemin.

### 3.6 Statuts validation (réutiliser / étendre)

| Intention protocol | Équivalent existant |
|---|---|
| DRAFT | étude fraîche / import preview |
| TO_REVIEW | `PRO_A_VALIDER` |
| TECHNICALLY_VALIDATED | `PRO_VALIDE` |
| READY_FOR_QUOTE | lignes rôle `quote` validées |
| USED_IN_QUOTE | présence `PrepQuoteLink` |

---

## 4. Mapping JSON → modèles Prisma

| Bloc bundle | Cible |
|---|---|
| `bundle_id` / `source_revision` | `PrepStudy.bundleId` + `PrepImport` |
| `meta` / `project` | `PrepStudy.title`, `trade`, `description` ; rattachement `projectId` UI |
| `sources` | `PrepStudy.sourcesJson` + liens `SiteDocument` / `ChantierFile` si refs connues |
| `assumptions` | `hypothesesJson` |
| `unknowns` / `warnings` | `decisionsJson` / disclaimers / preview |
| `takeoff.parameters` | `PrepParameter` |
| `takeoff.items` | `PrepTakeoffLine` |
| `lots` | `lotsJson` |
| `workflow` | `workflowJson` |
| `schedule` + `planning_settings` | `scheduleJson` (`start_date` normalisé) |
| `quote_transfer` | **aucune écriture devis** à l’import ; intention UI |
| `media` / `documents` | refs vers `ChantierFile` / `SiteVisitMedia` existants |
| Génération planning | `schedule-preview` → `schedule-commit` → `PrepSchedulePlan*` |

Le commit technique (Phase C) s’appuiera sur le service prep existant après **normalisation** technical → prep_bundle_v1 (noyau takeoff/workflow/schedule).

---

## 5. Stratégie de compatibilité

```
bework_technical_bundle_v1  ──parse──► TechnicalBundle
                                         │
bework_prep_bundle_v1 ──adapter──►───────┤
                                         ▼
                              normalize → prep engine
                                         │
bework_quote_bundle_v1  (inchangé) —— devis commercial
```

- Les imports `bework_prep_bundle_v1` existants continuent de fonctionner.
- Un adapter `prep → technical` permet d’unifier l’UI d’import plus tard.
- C-01, Cuisine/SDB, MOREL, électricité : **aucune réécriture** des études déjà validées.
- Interdit : règles hardcodées métier (Fondations, Cuisine, MOREL, C-01, n° devis).

---

## 6. Versioning & idempotence — stockage verrouillé (sans nouvelle colonne)

### 6.1 Où sont persistées les clés

| Clé | Stockage (existant) | Rôle |
|---|---|---|
| `bundle_id` | `PrepStudy.bundleId` + `PrepImport.bundleId` | Identifiant logique du dossier technique |
| `fingerprint` | `PrepImport.fingerprint` | Empreinte SHA-256 tronquée du JSON canonique |
| `source_revision` | `PrepImport.summaryJson.sourceRevision` (nombre) | Révision déclarée par ChatGPT / source |
| format | `PrepImport.format` + `PrepStudy.sourceFormat` | `bework_technical_bundle_v1` |
| meta technique | `PrepImport.summaryJson.technical` | `{ bundleId, fingerprint, sourceRevision, startDate, desiredStartPeriod }` |

**Aucune colonne Prisma ajoutée.**  
Source de vérité durable = table `PrepImport` (déjà indexée `(organizationId, projectId, fingerprint)`), pas la mémoire du parser.

### 6.2 Comportements

| Cas | Détection | Résultat |
|---|---|---|
| Réimport exact (même fingerprint) | `PrepImport` APPLIED même org/projet | `duplicate.identical` — aucune création |
| Même `bundle_id`, fingerprint différent | `PrepStudy.bundleId` + dernier import | `duplicate.revision` — preview diff + confirmation |
| Nouveau `bundle_id` | — | CREATE étude |
| Remplacement explicite | `targetStudyId` + `confirmReplace` | REPLACE versionnée + snapshot |

### 6.3 Empreinte

Calculée sur le JSON technique **canonique** (clés triées), via le même utilitaire que le métré (`prepBundleFingerprint`).

---

## 7. Gestion `start_date` null — Prisma vérifié

### 7.1 Schéma réel (nullable)

| Modèle | Champ | Nullable |
|---|---|---|
| `PrepSchedulePlan` | `startDate`, `endDateBase`, `endDateWithConditional` | **oui** (`DateTime?`) |
| `PrepScheduleTask` | `startDate`, `endDate`, `actualStartDate`, `actualEndDate` | **oui** |
| `PrepScheduleEvent` | pas de date métier (seulement `createdAt`) | — |

→ **Aucune date fictive n’est nécessaire pour satisfaire Prisma.**

### 7.2 Règles produit

1. `normalizeCivilStartDate()` rejette null, invalide, `≤ 1970-01-01`.
2. Sans date réelle : ordre / dépendances / durées / charge / positions relatives **OK** ; dates civiles **null**.
3. UI : « Date de démarrage à définir ».
4. `workflowJson` + `scheduleJson` (relatifs) restent dans `PrepStudy` à l’import.
5. Commit calendrier civil (`PrepSchedulePlan`) seulement après action utilisateur « Définir la date de démarrage » **ou** si `planning_settings.start_date` est une date civile valide confirmée (Phase E).
6. Jamais : `new Date(0)`, `1970-01-01`, date du jour inventée.

---

## 8. Fichiers à modifier (par phase)

### Déjà touchés (Phase A — bug 1970)

- `src/lib/preparation/schedule/calendar.ts`
- `src/lib/preparation/schedule/compute.ts`
- `src/lib/preparation/schedule/parse.ts`
- `src/lib/preparation/schedule/transfer.ts`
- `src/components/preparation/PrepSchedulePlanView.tsx`
- `src/components/preparation/PrepScheduleTransferModal.tsx`
- `src/components/preparation/PrepScheduleTaskPanel.tsx`

### Phase A (docs / schéma — sans migration)

- `docs/BEWORK_TECHNICAL_PROTOCOL_V1.md` *(ce fichier)*
- `docs/BEWORK_CHATGPT_MASTER_PROMPT_V1.md`
- `src/lib/technical-engine/schema.ts`

### Phases B–G (après validation)

- `src/lib/technical-engine/parse.ts`, `preview.ts`, `commit.ts`, `adapt-prep.ts`
- Routes API import technique + UI preview
- Fixtures tests C-01 / MOREL / élec / Cuisine-SDB
- Phase E : API recalcul dates planning
- Documentation utilisateur courte

### Migrations DB

**Aucune en Phase A.**  
Éventuelles colonnes additives (`sourceRevision`, JSON multi-quantités) uniquement après validation explicite — additive, documentée, réversible si possible.

---

## 9. Migrations éventuellement nécessaires (futures)

| Besoin | Proposition | Risque |
|---|---|---|
| Multi-quantités persistées | JSON sur `PrepTakeoffLine` ou colonnes optionnelles | Faible si additive |
| `sourceRevision` sur PrepImport | Colonne Int? | Faible |
| Distinction date confirmée / indicative | Champs dans `scheduleJson` / plan summary | Nul (JSON) |
| Lien media unique multi-modules | Réutiliser `ChantierFile` + links | Faible |

**Interdit :** reset, seed destructif, deleteMany prod, rewrite massive `scopeId`, écrasement C-01 / plannings existants.

---

## 10. Risques identifiés

| Risque | Mitigation |
|---|---|
| Deuxième moteur parallèle | Adapter → prep engine uniquement |
| Doublons PrepStudy | Idempotence bundle_id + preview |
| Dates 1970 déjà en base | Sanitize à la lecture (`normalizeCivilStartDate`) |
| ScopeId masque des données | Conserver resolve global + scoped |
| Import crée devis / planning | `create_quote: false` ; planning = action séparée |
| Hardcode métier | Packs métier futurs hors core ; format unique |
| Perf gros JSON | Parse serveur ; limites bytes comme prep |
| Perte données validées | Diff + confirmation ; jamais overwrite silencieux |

---

## 11. Phases de livraison

| Phase | Contenu | État |
|---|---|---|
| **A** | Audit + architecture + schéma + fix 1970 | **En cours de validation** |
| B | Parser + validation + preview | Après OK |
| C | Import PrepStudy / takeoff | Après OK |
| D | Workflow + schedule | Après OK |
| E | Date planning + recalcul | Après OK |
| F | Compatibilité anciens bundles | Après OK |
| G | Tests C-01 / MOREL / Élec / Cuisine-SDB | Après OK |

---

## 12. Mode « travailler par exceptions » (préparé)

Le preview d’import affichera une synthèse :

- N ouvrages
- sans anomalie / calculs à contrôler / hypothèses / manquants
- liste « À vérifier »

Implémentation UI progressive (Phase B+).

---

## 13. Packs métier (futur)

```
CORE (bework_technical_bundle_v1)
  + pack terrassement | carrelage | électricité | …
```

Un pack apporte unités, formules types, rendements, contrôles, vocabulaire.  
**Le format reste identique.**

---

## 14. Confirmation de principes

- Aucune API OpenAI / IA dans BeWork
- Aucun cas hardcodé métier
- Aucune duplication silencieuse
- Aucun métré / planning écrasé sans confirmation
- Aucune donnée historique volontairement perdue
- ProjectScope = filtre, pas un silo invisible
