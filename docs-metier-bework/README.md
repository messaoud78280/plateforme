# Documentation métier BeWork

Référentiel terrain pour l’assistant travaux : analyse DCE, CCTP, DOE, devis, vigilance chantier.

## Arborescence

| Dossier | Rôle |
|---------|------|
| [`ASSISTANT-ANALYSE-DOSSIER.md`](./ASSISTANT-ANALYSE-DOSSIER.md) | Méthode d’analyse et format de réponse |
| [`CCTP/`](./CCTP/) | Structure 14 rubriques, modèles |
| [`DOE/`](./DOE/) | Conventions nommage, listes livrables |
| [`DTU/`](./DTU/) | Règles d’usage (sans invention) |
| [`DEVIS/`](./DEVIS/) | Contrôles devis / DPGF |
| [`FICHES-TECHNIQUES/`](./FICHES-TECHNIQUES/) | Lecture FT et cohérence |
| [`EXEMPLES-CHANTIER/`](./EXEMPLES-CHANTIER/) | Exemples commentés (bardage, etc.) |
| [`dossiers/`](./dossiers/) | Analyses opérations (ex. HELIOS) |

## Lien produit

- Skill : `/dashboard/skills/cctp`
- Code : `src/lib/skills/cctp-assistant-intelligence.ts`
- Règle Cursor : `.cursor/rules/bework-conducteur-travaux.mdc`
