# Planning — disponibilités (dette future)

> **Statut :** non implémenté.  
> **PLANNING-V2B :** wording « Sans affectation » uniquement — **pas** de fausse disponibilité.  
> **PLANNING-V2B.1 :** filtre UI « Équipe terrain » (`CONDUCTEUR` | `CHEF_CHANTIER`) vs « Toute l'équipe » — Direction / Administratif restent planifiables, masqués par défaut si un profil terrain existe.  
> **PLANNING-V2C :** zone « À organiser » (AgendaEvent sans `responsibleId`), suggestions déterministes (`evaluatePlanningAssigneeSuggestions`), charge planifiée (nb + durée, jamais % capacité), optimistic UI sans `router.refresh`.

## Problème

Sans données d’absences / horaires, déduire :


```
aucune AgendaEvent → disponible
```

est faux (congés, arrêt, autre chantier hors BeWork, etc.).

## Cible V2 (hors scope)

Source unique d’indisponibilités (congés, RTT, maladie, formation, horaires)  
→ projection Planning + Agenda, **sans** table d’affectation parallèle.

Aucune migration tant que le modèle métier n’est pas validé.

## Filtre ressources (V2B.1)

- `isPlanifiableUser` = toute l’équipe interne active (hors client / fournisseur / sous-traitant).
- Vue défaut « Équipe terrain » = profils `CONDUCTEUR` + `CHEF_CHANTIER` uniquement (pas d’autres rôles inventés).
- « Toute l’équipe » = Direction, Administratif, etc.
- Fallback : si aucun terrain, le board affiche toute l’équipe.
