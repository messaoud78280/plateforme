# Planning — disponibilités (dette future)

> **Statut :** non implémenté.  
> **PLANNING-V2B :** wording « Sans affectation » uniquement — **pas** de fausse disponibilité.

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
