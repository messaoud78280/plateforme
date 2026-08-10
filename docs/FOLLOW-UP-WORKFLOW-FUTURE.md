# Follow-up — évolution workflow (piste future)

> **Statut :** non implémenté. Document de cadrage uniquement.
> **Gel V2B.1 :** le workflow linéaire actuel (`CHANTIER_STANDARD`) reste en place.
> **Aucune migration** tant que la piste n’est pas validée métier.

## Diagnostic confirmé (V2B)

Le board mélange aujourd’hui dans **une seule progression** :

| Dimension | Exemples d’étapes actuelles |
|-----------|-----------------------------|
| **A — État principal du dossier** | Commande/OS reçu → À analyser → À planifier → Planifié → Préparation → Intervention → Travaux terminés → Clos |
| **B — Sous-processus / événements** | Commande fournisseur · Commande passée · Attente fournisseur · Avenant · CR · À facturer · Facturé · Attente règlement |

Une fiche peut être **en préparation / en intervention** tout en ayant une commande fournisseur ouverte, un avenant, ou une facturation à préparer. Forcer un déplacement de colonne pour chaque sous-processus brouille la lecture « dossier + post-it ».

## Piste cible (future)

```
ÉTAT PRINCIPAL (colonnes Kanban)
  REÇU → À ANALYSER → À PLANIFIER → PRÉPARATION → INTERVENTION → TRAVAUX TERMINÉS → À FINALISER → CLOS

+ indicateurs liés (carte / fiche, pas des colonnes obligatoires)
  · Commande (fournisseur / livraison)
  · Avenant
  · Facturation
```

Principes :

1. **Un état principal** compréhensible par un novice.
2. Les sous-processus **n’obligent pas** à quitter l’état opérationnel.
3. Affichage discret sur la carte (déjà amorcé V2B via chips statut B).
4. Pas de second moteur de statut « en double » sans validation conducteur.
5. Migration / seed : uniquement après recette métier SETRIM + non-régression BeWork Internal.

## Hors scope immédiat

- Simplification destructive des `WorkflowStep` existants
- Migration Prisma
- Remplacement du template `CHANTIER_STANDARD` en production sans plan de bascule
