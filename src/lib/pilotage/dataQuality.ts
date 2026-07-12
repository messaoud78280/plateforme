/**
 * Qualité des données — anomalies structurelles (responsable, échéance, preuve…).
 */

export type DataQualityIssue = {
  code: string;
  title: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  priority: "Basse" | "Normale" | "Haute" | "Critique";
  fixHint: string;
};

export function detectDataQualityIssues(input: {
  actions: { id: string; title: string; status: string; dueDate: Date | null; assigneeName: string | null }[];
  obligations: { id: string; title: string; status: string; dueDate: Date | null; responsibleName: string | null }[];
  requiredDocuments: { id: string; name: string; status: string; dueDate: Date | null; producerName: string | null }[];
  plans: { id: string; reference: string; status: string; indice: string }[];
  blockers: { id: string; title: string; status: string; nextAction: string | null }[];
  doeItems: { id: string; title: string; status: string }[];
  extraWorks: { id: string; reference: string | null; description: string; estimatedHt: unknown; status: string }[];
}): DataQualityIssue[] {
  const out: DataQualityIssue[] = [];

  for (const a of input.actions) {
    if (["Terminée", "Annulée"].includes(a.status)) continue;
    if (!a.assigneeName) {
      out.push({
        code: "action-sans-responsable",
        title: "Action sans responsable",
        entityType: "action",
        entityId: a.id,
        entityLabel: a.title,
        priority: "Haute",
        fixHint: "Affecter un responsable du suivi.",
      });
    }
    if (!a.dueDate) {
      out.push({
        code: "action-sans-echeance",
        title: "Action sans échéance",
        entityType: "action",
        entityId: a.id,
        entityLabel: a.title,
        priority: "Normale",
        fixHint: "Ajouter une date limite.",
      });
    }
  }

  for (const o of input.obligations) {
    if (["Validée", "Non applicable"].includes(o.status)) continue;
    if (!o.responsibleName) {
      out.push({
        code: "obligation-sans-responsable",
        title: "Obligation sans responsable",
        entityType: "obligation",
        entityId: o.id,
        entityLabel: o.title,
        priority: "Haute",
        fixHint: "Désigner un producteur / responsable.",
      });
    }
    if (!o.dueDate) {
      out.push({
        code: "obligation-sans-echeance",
        title: "Obligation sans échéance",
        entityType: "obligation",
        entityId: o.id,
        entityLabel: o.title,
        priority: "Haute",
        fixHint: "Renseigner la date limite contractuelle (à vérifier).",
      });
    }
  }

  for (const d of input.requiredDocuments) {
    if (["Validé", "Non applicable"].includes(d.status)) continue;
    if (!d.producerName) {
      out.push({
        code: "doc-sans-producteur",
        title: "Document sans producteur",
        entityType: "document",
        entityId: d.id,
        entityLabel: d.name,
        priority: "Normale",
        fixHint: "Indiquer qui produit le document.",
      });
    }
  }

  for (const b of input.blockers) {
    if (!["Ouvert", "En cours"].includes(b.status)) continue;
    if (!b.nextAction) {
      out.push({
        code: "blocage-sans-action",
        title: "Blocage sans prochaine action",
        entityType: "blocker",
        entityId: b.id,
        entityLabel: b.title,
        priority: "Critique",
        fixHint: "Définir la prochaine action et le décideur.",
      });
    }
  }

  for (const p of input.plans) {
    if (!p.indice || p.indice.trim() === "") {
      out.push({
        code: "plan-sans-indice",
        title: "Plan sans indice",
        entityType: "plan",
        entityId: p.id,
        entityLabel: p.reference,
        priority: "Haute",
        fixHint: "Renseigner l’indice / version en vigueur.",
      });
    }
  }

  for (const e of input.extraWorks) {
    if (!e.estimatedHt && !["Refusé", "Annulé"].includes(e.status)) {
      out.push({
        code: "ts-sans-montant",
        title: "Travaux supplémentaires sans montant estimé",
        entityType: "extraWork",
        entityId: e.id,
        entityLabel: e.reference ?? e.description.slice(0, 50),
        priority: "Normale",
        fixHint: "Ajouter une estimation HT (indicatif).",
      });
    }
  }

  return out.slice(0, 50);
}
