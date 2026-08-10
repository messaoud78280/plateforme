# Assistant IA BTP — Roadmap

> Catalogue V1 livré sans clé API ni appel LLM.  
> L’IA propose ; l’utilisateur valide. Permissions BeWork inchangées.

## Principes

- **Outils métier BTP**, pas un ChatGPT générique.
- Marchés **privés** (contrat, devis accepté, CCTP, conditions particulières, CR…).
- Sélection **explicite** des documents à analyser.
- L’IA ne contourne jamais `organizationId`, ProjectAccess, GED ACL, messagerie ACL.
- Pas d’affirmation juridique définitive (« points à examiner »).
- Pas d’envoi / création silencieuse.

## PHASE 1 — Marché privé / synthèse

- Analyser un marché privé
- Obligations & délais
- Risques du marché (points à examiner)
- Traçabilité minimale des analyses (utilisateur, date, sources, résultat)

## PHASE 2 — CR → Actions / DOE / rédaction

- Compte rendu → Actions (validation case par case)
- Contrôler un DOE
- Rédiger un courrier (brouillon uniquement)
- Travaux supplémentaires & avenants (préparation justificatifs)

## PHASE 3 — Assistant contextuel connecté BeWork

Boutons contextuels (hors V1) :

- Depuis un chantier : analyser / synthétiser
- Depuis Documents : analyser la sélection
- Depuis un CR : transformer en actions
- Champ « Demandez à BeWork » (secondaire aux outils)

## PHASE 4 — Automatisations IA contrôlées

- Quotas organisation / taille documents / coûts
- Logs, rétention, politique provider
- Automatisations uniquement après validation humaine

## Provider (remplaçable)

Architecture future légère :

```
AIProvider (interface)
  → OpenAI
  → autre provider éventuel
```

Pas de SDK dans le bundle tant que `configured === false`.  
Flag : `NEXT_PUBLIC_FF_AI_FEATURES` (défaut off).

## Sécurité future (obligatoire avant activation)

- Données privées / minimisation
- Isolation tenant
- ACL BeWork strictes
- Logs d’analyse + actions acceptées / rejetées
- Rétention et localisation des données (UE selon exigences)
- Politique du provider

## Coûts (à définir à l’activation)

- Limites d’usage et taille de documents
- Estimation coût / analyse
- Quotas par organisation
- Aucun billing IA dans la V1 catalogue
