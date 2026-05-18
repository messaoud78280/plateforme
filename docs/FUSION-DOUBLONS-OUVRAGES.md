# Fusion des doublons — Bibliothèque ouvrages

## Principe

- **Aucune suppression** : les ouvrages fusionnés restent en base (`mergeStatus = merged`).
- **Réversible** : bouton « Séparer cette variante » sur la fiche canonique.
- **Liste principale** : n’affiche que les fiches `unique` ou `canonical` (les variantes sont masquées).

## Migration base (obligatoire avant usage)

Exécuter sur Supabase **après relecture** :

`prisma/migrations/add-work-item-duplicate-merge.sql`

Puis : `npx prisma generate`

## Utilisation

1. **Bibliothèque ouvrages** → **Fusionner les doublons**
2. Résumé : analysées, groupes exacts, fusionnées auto, propositions à vérifier
3. **Propositions de fusion** : `/dashboard/devis/bibliotheque/fusions`

## Seuils

| Similarité | Action |
|------------|--------|
| Clé normalisée identique | Fusion automatique |
| ≥ 90 % (sans bloqueur technique) | Fusion automatique |
| 75–89 % | Proposition à valider |
| < 75 % | Ignoré |

## Garde-fous

Béton C25/30 ≠ C30/37, épaisseurs différentes, BA13 ≠ hydro, baignoire simple ≠ balnéo, sections câble, diamètres gaines, etc.

## Fichiers clés

- `src/lib/work-item-merge/` — normalisation, détection, choix canonique
- `src/app/dashboard/devis/work-item-merge-actions.ts` — actions serveur
- `src/components/devis/WorkItemMergeAnalyzeButton.tsx` — bouton analyse
- `src/app/dashboard/devis/bibliotheque/fusions/page.tsx` — propositions

## Test manuel (baignoire)

1. Créer 10 ouvrages avec la même désignation (codes différents)
2. Lancer **Fusionner les doublons**
3. Vérifier : **1 seule ligne** en liste avec badge « Fusionné — 10 variantes »
4. Ouvrir la fiche → 10 variantes listées, prix conservés

## Limites / suite

- Comparaison optimisée par lot + préfixe (pas toutes × toutes au-delà de ~15k lignes)
- Import futur : rattachement auto à prévoir dans `importWorkItemsBulk`
- Matériaux (`SiteResource`) : système séparé déjà en place (ressources chantier)
