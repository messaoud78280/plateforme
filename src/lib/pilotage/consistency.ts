/**
 * Contrôles de cohérence — alertes explicables, non bloquantes par défaut.
 */

export type ConsistencyIssue = {
  code: string;
  title: string;
  explanation: string;
  severity: "À surveiller" | "Important" | "Critique";
  entityType: string;
  entityId?: string;
  entityLabel: string;
};

export type ConsistencyInput = {
  actions: { id: string; title: string; status: string; dueDate: Date | null }[];
  obligations: { id: string; title: string; status: string; dueDate: Date | null }[];
  plans: { id: string; reference: string; title: string; status: string; indice: string }[];
  extraWorks: {
    id: string;
    reference: string | null;
    description: string;
    writtenValidation: boolean;
    startedWithoutValidation: boolean;
    status: string;
  }[];
  doeItems: { id: string; title: string; status: string; isMandatory: boolean }[];
  situations: { id: string; number: string; status: string; requestedHt: unknown; validatedHt: unknown; paidHt: unknown }[];
  milestones: { id: string; title: string; status: string }[];
  subcontractors: { id: string; companyName: string; approvalStatus: string; dossierStatus: string }[];
  delayEvents: { id: string; title: string; status: string; endedAt: Date | null }[];
  nonConformities: { id: string; description: string; status: string; proofCorrection: string | null }[];
};

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function runConsistencyChecks(input: ConsistencyInput): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  for (const e of input.extraWorks) {
    if (e.startedWithoutValidation && !e.writtenValidation) {
      issues.push({
        code: "ts-sans-validation",
        title: "Travaux supplémentaires sans validation écrite",
        explanation: "Des travaux sont signalés démarrés sans validation écrite enregistrée.",
        severity: "Critique",
        entityType: "extraWork",
        entityId: e.id,
        entityLabel: e.reference ?? e.description.slice(0, 60),
      });
    }
    if (["Facturé", "Payé"].includes(e.status) && !e.writtenValidation) {
      issues.push({
        code: "ts-facture-sans-validation",
        title: "TS facturé / payé sans validation écrite",
        explanation: "Le statut financier avance alors que la validation écrite n’est pas cochée.",
        severity: "Critique",
        entityType: "extraWork",
        entityId: e.id,
        entityLabel: e.reference ?? e.description.slice(0, 60),
      });
    }
  }

  const overdueObl = input.obligations.filter(
    (o) =>
      o.dueDate &&
      o.dueDate < new Date() &&
      !["Validée", "Non applicable"].includes(o.status),
  );
  for (const o of overdueObl.slice(0, 8)) {
    const linkedDone = input.actions.some(
      (a) => a.status === "Terminée" && a.title.toLowerCase().includes(o.title.slice(0, 12).toLowerCase()),
    );
    if (linkedDone) {
      issues.push({
        code: "obligation-retard-action-terminee",
        title: "Obligation en retard alors qu’une action liée semble terminée",
        explanation: "Vérifier si l’obligation doit être clôturée ou si l’action est incomplète.",
        severity: "Important",
        entityType: "obligation",
        entityId: o.id,
        entityLabel: o.title,
      });
    }
  }

  const mandatoryMissing = input.doeItems.filter(
    (d) => d.isMandatory && ["Manquant", "À demander"].includes(d.status),
  );
  if (mandatoryMissing.length >= 3) {
    issues.push({
      code: "doe-incomplet",
      title: "DOE : pièces obligatoires manquantes",
      explanation: `${mandatoryMissing.length} éléments DOE obligatoires encore manquants ou à demander.`,
      severity: "Important",
      entityType: "doe",
      entityLabel: `${mandatoryMissing.length} pièces`,
    });
  }

  for (const s of input.situations) {
    const paid = num(s.paidHt);
    const validated = num(s.validatedHt);
    if (paid != null && validated != null && paid > validated + 0.01) {
      issues.push({
        code: "situation-paye-gt-valide",
        title: "Situation : montant payé supérieur au validé",
        explanation: "Écart financier à justifier ou corriger (aide au pilotage, pas une comptabilité).",
        severity: "Critique",
        entityType: "situation",
        entityId: s.id,
        entityLabel: s.number,
      });
    }
  }

  const blockedPrereq = input.milestones.filter((m) => m.status === "Bloqué");
  const reached = input.milestones.filter((m) => m.status === "Atteint");
  if (blockedPrereq.length > 0 && reached.length > 0) {
    const lastReached = reached[reached.length - 1];
    issues.push({
      code: "jalon-atteint-prerequis-bloques",
      title: "Jalon atteint alors que d’autres jalons sont bloqués",
      explanation: "Vérifier la cohérence de la timeline (prérequis / enchaînement).",
      severity: "À surveiller",
      entityType: "milestone",
      entityId: lastReached?.id,
      entityLabel: lastReached?.title ?? "Jalons",
    });
  }

  for (const st of input.subcontractors) {
    if (
      ["En intervention", "Actif"].includes(st.approvalStatus) === false &&
      st.dossierStatus === "Incomplet" &&
      st.approvalStatus !== "Agréé"
    ) {
      // soft: incomplete dossier always worth a watch if not complete
    }
    if (st.dossierStatus === "Incomplet") {
      issues.push({
        code: "st-dossier-incomplet",
        title: "Sous-traitant : dossier administratif incomplet",
        explanation: "Alerte administrative uniquement — ne bloque pas techniquement l’intervention réelle.",
        severity: "Important",
        entityType: "subcontractor",
        entityId: st.id,
        entityLabel: st.companyName,
      });
    }
  }

  for (const d of input.delayEvents) {
    if (["Clôturé", "Résolu"].includes(d.status) && !d.endedAt) {
      issues.push({
        code: "retard-cloture-sans-fin",
        title: "Retard clôturé sans date de fin",
        explanation: "Renseigner la date de fin pour sécuriser la chronologie.",
        severity: "À surveiller",
        entityType: "delayEvent",
        entityId: d.id,
        entityLabel: d.title,
      });
    }
  }

  for (const nc of input.nonConformities) {
    if (["Corrigée", "Clôturée"].includes(nc.status) && !nc.proofCorrection) {
      issues.push({
        code: "nc-cloturee-sans-preuve",
        title: "Non-conformité clôturée sans preuve de correction",
        explanation: "Joindre une preuve avant de considérer la correction comme acquise.",
        severity: "Important",
        entityType: "nonConformity",
        entityId: nc.id,
        entityLabel: nc.description.slice(0, 60),
      });
    }
  }

  for (const p of input.plans) {
    if (p.status === "Bon pour exécution" && (!p.indice || p.indice === "—")) {
      issues.push({
        code: "plan-bpe-sans-indice",
        title: "Plan BPE sans indice clairement renseigné",
        explanation: "L’indice permet d’éviter l’exécution d’une version obsolète.",
        severity: "Important",
        entityType: "plan",
        entityId: p.id,
        entityLabel: p.reference,
      });
    }
  }

  return issues.slice(0, 40);
}
