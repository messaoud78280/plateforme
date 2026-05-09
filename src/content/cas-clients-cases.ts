export const CAS_CLIENT_CASES = [
  {
    title: "Relances devis : plus de réponses, moins d’oubli",
    before: "Devis envoyés mais peu relancés, décisions client floues.",
    after: "Rythme de relance + statuts + prochaines étapes, réponses plus rapides.",
    kpis: ["Suivi J+2/J+7/J+14", "Traçabilité des réponses", "Décisions client clarifiées"],
  },
  {
    title: "Trésorerie : factures et impayés mieux pilotés",
    before: "Facturation en retard, relances irrégulières, stress sur l’encaissement.",
    after: "Calendrier de relance + preuves + reporting, trésorerie plus stable.",
    kpis: ["Relances cadrées", "Pièces classées par chantier", "Reporting impayés"],
  },
  {
    title: "Chantier : dossier propre (situations, avenants, DT/DICT)",
    before: "Pièces dispersées, délais qui glissent, relances faites au dernier moment.",
    after: "Process simple : préparation, suivi, classement, validations au bon moment.",
    kpis: ["Tableau de suivi", "Checklists pièces", "Validation des points sensibles"],
  },
] as const;
