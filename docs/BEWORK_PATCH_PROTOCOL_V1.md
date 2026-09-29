# BeWork Patch Protocol V1

> **Créer** une étude / un devis → `bework_technical_bundle_v1` / `bework_quote_bundle_v1`  
> **Modifier** un chantier existant → `bework_patch_v1`  
> ChatGPT propose. BeWork valide, recalcule et synchronise (phases ultérieures).

Phase B (cette version) : **schéma + parser + validation + adapters legacy**.  
Aucune écriture DB, aucune propagation, aucune migration.

---

## 1. Rôles des formats

| Format | Rôle |
|---|---|
| `bework_technical_bundle_v1` | Créer / importer une étude technique |
| `bework_quote_bundle_v1` | Créer un devis |
| `bework_quote_patch_v1` | Patch devis historique (conservé) |
| `bework_prep_patch_v1` | Patch métré historique (conservé) |
| **`bework_patch_v1`** | Patch universel (façade) |
| **`bework_chatgpt_context_v1`** | Contexte exporté pour ChatGPT |

---

## 2. Origin ≠ Target

`origin` = où l’utilisateur se trouvait (ex. `QUOTE`).  
Chaque `operation.target` désigne explicitement l’entité à modifier.  
Le parser **ne déduit jamais** le target depuis l’origin.

---

## 3. change_intent

| Intent | Usage |
|---|---|
| `TECHNICAL_CORRECTION` | Correction technique (mesure, paramètre) |
| `COMMERCIAL_ADJUSTMENT` | Prix, marge, libellé commercial |
| `FIELD_UPDATE` | Visite / terrain |
| `PLANNING_ADJUSTMENT` | Durée, crew, deps, dates |
| `PROGRESS_UPDATE` | Suivi / réalisé |
| `DOCUMENT_EDIT` | CR / Notice / texte |
| `ADMINISTRATIVE_UPDATE` | Meta admin |
| `TECHNICAL_OVERRIDE` | Override volontaire documenté |

Opération + intent incompatibles → `INTENT_OPERATION_MISMATCH`.

---

## 4. Canonical resolution

| Status | Signification |
|---|---|
| `EXACT` | Paramètre / donnée source précisément connue |
| `PARTIAL` | Lien takeoff (ex. `PrepQuoteLink`) sans paramètre certain |
| `NONE` | Aucune relation fiable |

**Interdit** : inventer `trench.length` par similarité de libellé.

Message PARTIAL :

> Ligne de métré liée retrouvée, mais la donnée source précise ne peut pas être déterminée automatiquement.

---

## 5. Versioning (strict)

`origin.base_version` doit égaler la version actuelle.  
Mismatch → `VERSION_CONFLICT` (pas de `force=true` en V1).

---

## 6. Pipeline Phase B

```
JSON → parseBeworkPatch (pur)
     → validatePatchContext (snapshot)
     → [adapters legacy quote/prep si ops locales]
```

Pas de commit universel en Phase B.

---

## 7. Compatibilité legacy

- Ops devis seules → `toLegacyQuotePatch()` → moteur `bework_quote_patch_v1`
- Ops métré seules → `toLegacyPrepPatch()` → moteur `bework_prep_patch_v1`
- Les parsers historiques restent inchangés et acceptent toujours leurs formats.

---

## 8. Erreurs / warnings

Voir `src/lib/bework-patch/errors.ts`  
(`INVALID_JSON`, `VERSION_CONFLICT`, `PARTIAL_CANONICAL_RESOLUTION`, …)

---

## 9. Module code

`src/lib/bework-patch/`

- `types.ts` — schémas
- `parse.ts` — parser pur
- `validate-context.ts` — validation contextuelle
- `operations-catalog.ts` — ops × intents × sections
- `context.ts` — helpers contexte
- `adapters/quote.ts` / `adapters/prep.ts` — délégation
