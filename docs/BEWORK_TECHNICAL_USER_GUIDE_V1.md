# Import analyse technique BeWork

## Flux

1. Dans ChatGPT (externe) : coller le [prompt maître](./BEWORK_CHATGPT_MASTER_PROMPT_V1.md) + dossier (visite / plan / photos / devis / notes).
2. Récupérer le JSON `bework_technical_bundle_v1`.
3. BeWork :
   - `POST /api/technical-engine/preview` — aperçu, **aucune écriture**
   - Contrôler exceptions (hypothèses, inconnues, calculs)
   - `POST /api/technical-engine/import` — crée / met à jour `PrepStudy` uniquement

## Ce que l’import ne fait pas

- Pas de devis
- Pas de `PrepSchedulePlan` civil
- Pas de suivi / CR / notice

## Ensuite

| Action | Comment |
|---|---|
| Métré | Ouvrir l’étude |
| Devis | Passerelle métré → devis existante |
| Planning | Générer depuis workflow/schedule de l’étude |
| Date de démarrage | Bouton « Définir la date de démarrage » ou `POST /api/prep-studies/:id/set-start-date` |

## Idempotence (sans nouvelle colonne)

| Clé | Où |
|---|---|
| `bundle_id` | `PrepStudy.bundleId` + `PrepImport.bundleId` |
| fingerprint | `PrepImport.fingerprint` |
| `source_revision` | `PrepImport.summaryJson.sourceRevision` |

Réimport exact → `IDENTICAL` (pas de doublon).  
Même bundle, contenu différent → preview diff + `confirmReplace`.

## Dates

Sans date réelle : **Date de démarrage à définir**. Jamais 1970.
