# bework_prep_patch_v1 — modification d'une étude de métré existante

> Distinct de `bework_prep_bundle_v1` (import complet).  
> Aucune API OpenAI : ChatGPT prépare le JSON hors BeWork ; vous le collez dans **✨ Modifier avec ChatGPT**.

## Structure minimale

```json
{
  "format": "bework_prep_patch_v1",
  "patch_id": "patch_c01_001",
  "target": {
    "base_version": 2,
    "bundle_id": "c01-fondations-demo-v1"
  },
  "operations": []
}
```

- `patch_id` : identifiant stable (idempotence — un même id ne s'applique qu'une fois).
- `target.base_version` : version de l'étude au moment de la génération (recommandé).
- Cibler toujours par **clé** (`parameters.key`) ou **code** (`TE-01`), jamais par position.

## Opérations

| `op` | Cible | Effet |
|------|--------|--------|
| `update_parameter` | `key` | Modifie valeur / libellé / note → **recalcul automatique** |
| `update_line` | `code` | Désignation, description, références, prestations, quantité forfaitaire… |
| `add_line` | `line.id` | Ajoute une prestation |
| `delete_line` | `code` | Retire une prestation |
| `update_hypothesis` | `id` | Met à jour une hypothèse |
| `update_study` | — | Titre / trade / description |
| `update_workflow` | — | Fusionne le mode opératoire |
| `update_resources` | — | Fusionne ressources / rendements |

## Exemple — profondeur 0,80 → 0,90 m

```json
{
  "format": "bework_prep_patch_v1",
  "patch_id": "patch_c01_depth_090",
  "target": { "base_version": 2 },
  "operations": [
    {
      "op": "update_parameter",
      "key": "fouille.profondeur_commune",
      "changes": { "value": 0.9 }
    }
  ]
}
```

BeWork recalcule TE-01 : 36,48 m³ → 41,04 m³ (et volumes dépendants).

## Exemple — désignation / fiche technique

```json
{
  "format": "bework_prep_patch_v1",
  "patch_id": "patch_c01_te01_texts",
  "target": { "base_version": 2 },
  "operations": [
    {
      "op": "update_line",
      "code": "TE-01",
      "changes": {
        "designation": "Terrassement mécanique en rigoles pour fondations superficielles SF1",
        "technical_description": "…",
        "included_services": ["Terrassement mécanique", "Finitions manuelles"],
        "technical_references": [
          { "label": "NF DTU 13.1", "kind": "INDICATIVE", "note": "Selon domaine d'application — à confirmer." }
        ]
      }
    }
  ]
}
```

Une modification purement textuelle **ne change aucune quantité**.
