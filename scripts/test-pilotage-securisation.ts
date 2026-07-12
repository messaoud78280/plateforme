/**
 * Tests — risque contractuel, cohérence, qualité des données.
 * Exécution : npx tsx scripts/test-pilotage-securisation.ts
 */
import assert from "node:assert/strict";
import { computeContractRisk, CONTRACT_RISK_DISCLAIMER } from "../src/lib/pilotage/contractRisk";
import { runConsistencyChecks } from "../src/lib/pilotage/consistency";
import { detectDataQualityIssues } from "../src/lib/pilotage/dataQuality";
import { HANDOVER_CHECKLIST_DEFAULT, TRAINING_NOTIONS } from "../src/lib/pilotage/methodLibrary";

function run() {
  const faible = computeContractRisk({
    tsWithoutWrittenValidation: 0,
    overdueCriticalObligations: 0,
    openCriticalBlockers: 0,
    contestedSituations: 0,
    incompleteSubcontractors: 0,
    overdueSensitiveDeadlines: 0,
    openNonConformitiesCritical: 0,
    openDelayEvents: 0,
    doeMissingNearReception: 0,
    unconfirmedAssumptions: 0,
  });
  assert.equal(faible.label, "FAIBLE");
  assert.equal(faible.score, 0);
  assert.ok(faible.disclaimer.includes("Vérification contractuelle"));
  assert.equal(CONTRACT_RISK_DISCLAIMER, faible.disclaimer);

  const eleve = computeContractRisk({
    tsWithoutWrittenValidation: 2,
    overdueCriticalObligations: 1,
    openCriticalBlockers: 1,
    contestedSituations: 0,
    incompleteSubcontractors: 1,
    overdueSensitiveDeadlines: 1,
    openNonConformitiesCritical: 0,
    openDelayEvents: 1,
    doeMissingNearReception: 0,
    unconfirmedAssumptions: 2,
  });
  assert.ok(["ELEVE", "CRITIQUE", "MODERE"].includes(eleve.label));
  assert.ok(eleve.score >= 20);
  assert.ok(eleve.reasons.length >= 1);
  assert.ok(eleve.recommendations.length >= 1);

  const issues = runConsistencyChecks({
    actions: [{ id: "a1", title: "Relancer visa", status: "Terminée", dueDate: null }],
    obligations: [
      {
        id: "o1",
        title: "Relancer visa plan",
        status: "En retard",
        dueDate: new Date("2020-01-01"),
      },
    ],
    plans: [{ id: "p1", reference: "GO-01", title: "Plan", status: "Bon pour exécution", indice: "A" }],
    extraWorks: [
      {
        id: "e1",
        reference: "TS-1",
        description: "Plus-value",
        writtenValidation: false,
        startedWithoutValidation: true,
        status: "En cours",
      },
    ],
    doeItems: [{ id: "d1", title: "PV", status: "Manquant", isMandatory: true }],
    situations: [],
    milestones: [{ id: "m1", title: "Réception", status: "Atteint" }],
    subcontractors: [{ id: "s1", companyName: "ST", approvalStatus: "En attente", dossierStatus: "Incomplet" }],
    delayEvents: [{ id: "de1", title: "Retard béton", status: "Clôturé", endedAt: null }],
    nonConformities: [
      { id: "n1", description: "Réservation manquante", status: "Clôturée", proofCorrection: null },
    ],
  });
  assert.ok(issues.some((i) => i.code === "ts-sans-validation"));
  assert.ok(issues.some((i) => i.code === "nc-sans-preuve" || i.code.includes("nc") || i.code.includes("retard") || i.code.includes("st") || i.code.includes("obligation")));

  const quality = detectDataQualityIssues({
    actions: [{ id: "a1", title: "Action orpheline", status: "À faire", dueDate: null, assigneeName: null }],
    obligations: [],
    requiredDocuments: [],
    plans: [{ id: "p1", reference: "X", status: "Envoyé", indice: "" }],
    blockers: [{ id: "b1", title: "Décision MOE", status: "Ouvert", nextAction: null }],
    doeItems: [],
    extraWorks: [],
  });
  assert.ok(quality.some((q) => q.code === "action-sans-responsable"));
  assert.ok(quality.some((q) => q.code === "blocage-sans-action"));

  assert.ok(HANDOVER_CHECKLIST_DEFAULT.length >= 8);
  assert.ok(TRAINING_NOTIONS.some((n) => n.id === "visa"));

  console.log("OK — test-pilotage-securisation");
}

run();
