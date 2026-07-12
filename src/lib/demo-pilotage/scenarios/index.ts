import type { DemoScenario, DemoScenarioId } from "../types";
import { SCENARIO_GO_LOGEMENTS } from "./main";

function cloneMain(overrides: Partial<DemoScenario> & Pick<DemoScenario, "id" | "label" | "pitch" | "commercialAngle">): DemoScenario {
  return {
    ...SCENARIO_GO_LOGEMENTS,
    ...overrides,
    actors: { ...SCENARIO_GO_LOGEMENTS.actors, ...(overrides.actors ?? {}) },
    obligations: overrides.obligations ?? SCENARIO_GO_LOGEMENTS.obligations,
    documents: overrides.documents ?? SCENARIO_GO_LOGEMENTS.documents,
    actions: overrides.actions ?? SCENARIO_GO_LOGEMENTS.actions,
    plans: overrides.plans ?? SCENARIO_GO_LOGEMENTS.plans,
    milestones: overrides.milestones ?? SCENARIO_GO_LOGEMENTS.milestones,
    blockers: overrides.blockers ?? SCENARIO_GO_LOGEMENTS.blockers,
    subcontractors: overrides.subcontractors ?? SCENARIO_GO_LOGEMENTS.subcontractors,
    situations: overrides.situations ?? SCENARIO_GO_LOGEMENTS.situations,
    extraWorks: overrides.extraWorks ?? SCENARIO_GO_LOGEMENTS.extraWorks,
    doeItems: overrides.doeItems ?? SCENARIO_GO_LOGEMENTS.doeItems,
    report: overrides.report ?? SCENARIO_GO_LOGEMENTS.report,
    healthReasons: overrides.healthReasons ?? SCENARIO_GO_LOGEMENTS.healthReasons,
  };
}

const SCENARIO_RENOVATION = cloneMain({
  id: "renovation-tertiaire",
  label: "Marché privé — Rénovation tertiaire",
  pitch: "Rénovation d’un bâtiment tertiaire — Lots structure & clos",
  commercialAngle: "Mettre en avant interfaces lots et validations MOE en marché privé.",
  clientName: "Entreprise Démo Construction",
  worksiteTitle: "Rénovation bâtiment tertiaire Démo — Structure",
  location: "Zone fictive — Parc d’activités Démo",
  lot: "Structure / rénovation",
  marketType: "Marché privé",
  amountHt: "640 000 € HT",
  healthLabel: "A_SURVEILLER",
  healthScore: 72,
  healthReasons: ["2 documents à corriger", "1 visa en attente"],
  adminProgressPct: 64,
  doeProgressPct: 38,
  blockers: [
    {
      id: "b-r1",
      title: "Diagnostic amiante complémentaire attendu",
      severity: "Important",
      consequence: "Zone R+2 non libérée pour intervention.",
      impactedMilestone: "Démarrage zone R+2",
      internalOwner: "Camille Durand (fictif)",
      externalDecider: "MOA / diagnostiqueur (fictifs)",
      nextAction: "Relancer transmission du rapport",
      daysOpen: 7,
      status: "Ouvert",
    },
  ],
});

const SCENARIO_VRD = cloneMain({
  id: "vrd-lotissement",
  label: "Terrassement et VRD — Lotissement",
  pitch: "Aménagement d’un lotissement fictif — VRD",
  commercialAngle: "Montrer le suivi des contrôles (compactage, essais) et des interfaces réseaux.",
  worksiteTitle: "Lotissement Démo — Terrassement et VRD",
  lot: "Terrassement et VRD",
  marketType: "Marché public",
  amountHt: "980 000 € HT",
  healthLabel: "A_SURVEILLER",
  healthScore: 68,
  healthReasons: ["Contrôles de compactage manquants", "1 relance concessionnaire"],
  adminProgressPct: 55,
  doeProgressPct: 30,
});

const SCENARIO_ELEC = cloneMain({
  id: "electricite-public",
  label: "Électricité CFO/CFA — Bâtiment public",
  pitch: "Équipements électriques — bâtiment public fictif",
  commercialAngle: "Illustrer visas plans d’exécution et DOE techniques.",
  worksiteTitle: "Équipement public Démo — Lot Électricité CFO/CFA",
  lot: "Électricité CFO/CFA",
  marketType: "Marché public",
  amountHt: "420 000 € HT",
  healthLabel: "CONFORME",
  healthScore: 86,
  healthReasons: ["Aucun risque administratif majeur détecté"],
  adminProgressPct: 78,
  doeProgressPct: 52,
  blockers: [],
  actions: SCENARIO_GO_LOGEMENTS.actions.map((a) => ({ ...a, overdue: false, status: a.overdue ? "En cours" : a.status })),
});

const SCENARIO_MULTI_ST = cloneMain({
  id: "multi-st",
  label: "Chantier avec plusieurs sous-traitants",
  pitch: "Gros œuvre — coordination sous-traitance (fictif)",
  commercialAngle: "Montrer agréments, dossiers incomplets et alertes administratives ST.",
  worksiteTitle: "Résidence Démo — Gros œuvre multi-ST",
  subcontractors: [
    ...SCENARIO_GO_LOGEMENTS.subcontractors,
    {
      id: "s3",
      companyName: "Béton Pompe Démo (fictif)",
      prestation: "Pompage béton",
      approvalStatus: "Agréé",
      dossierStatus: "Complet",
    },
    {
      id: "s4",
      companyName: "Étaiement Pro Démo (fictif)",
      prestation: "Étaiement",
      approvalStatus: "Refusé / à reprendre",
      dossierStatus: "Incomplet",
    },
  ],
  healthLabel: "A_SURVEILLER",
  healthScore: 61,
  healthReasons: ["2 dossiers ST incomplets", "1 agrément à reprendre"],
});

const SCENARIO_DIFFICULTE = cloneMain({
  id: "en-difficulte",
  label: "Chantier en difficulté — blocages et retards",
  pitch: "Marché sous tension — démonstration des alertes",
  commercialAngle: "Montrer la valeur du centre des blocages et de la santé chantier.",
  healthLabel: "CRITIQUE",
  healthScore: 28,
  healthReasons: ["2 blocages critiques", "5 actions en retard", "Jalons bloqués"],
  adminProgressPct: 34,
  doeProgressPct: 22,
  blockers: [
    ...SCENARIO_GO_LOGEMENTS.blockers.map((b) => ({ ...b, severity: "Critique" as const, daysOpen: b.daysOpen + 10 })),
    {
      id: "b-d3",
      title: "Situation contestée par la MOE",
      severity: "Critique",
      consequence: "Trésorerie chantier et planning de paiement impactés.",
      impactedMilestone: "Situation mensuelle",
      internalOwner: "Direction Démo (fictif)",
      externalDecider: "MOE (fictif)",
      nextAction: "Réunion contradictoire + pièces justificatives",
      daysOpen: 18,
      status: "Ouvert",
    },
  ],
});

const SCENARIO_RECEPTION = cloneMain({
  id: "proche-reception",
  label: "Chantier maîtrisé — proche réception",
  pitch: "Gros œuvre proche réception — DOE et réserves",
  commercialAngle: "Montrer un chantier bien tenu et un DOE déjà avancé.",
  healthLabel: "CONFORME",
  healthScore: 91,
  healthReasons: ["Aucun risque administratif majeur détecté"],
  adminProgressPct: 92,
  doeProgressPct: 78,
  blockers: [],
  milestones: [
    { id: "m1", title: "Notification du marché", category: "Administratif", status: "Atteint", plannedLabel: "01/06/2025", sortOrder: 10 },
    { id: "m2", title: "Hors d’eau", category: "Travaux", status: "Atteint", plannedLabel: "01/02/2026", sortOrder: 70 },
    { id: "m3", title: "Réception prévisionnelle", category: "Réception", status: "En cours", plannedLabel: "30/06/2026", sortOrder: 80 },
    { id: "m4", title: "DOE", category: "DOE", status: "En cours", plannedLabel: "15/07/2026", sortOrder: 90 },
    { id: "m5", title: "Levée de réserves / DGD", category: "Réception", status: "À préparer", plannedLabel: "30/08/2026", sortOrder: 100 },
  ],
  actions: SCENARIO_GO_LOGEMENTS.actions.slice(0, 4).map((a) => ({
    ...a,
    overdue: false,
    status: "En cours",
    dueLabel: "Cette semaine",
  })),
});

export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoScenario> = {
  "go-logements-public": SCENARIO_GO_LOGEMENTS,
  "renovation-tertiaire": SCENARIO_RENOVATION,
  "vrd-lotissement": SCENARIO_VRD,
  "electricite-public": SCENARIO_ELEC,
  "multi-st": SCENARIO_MULTI_ST,
  "en-difficulte": SCENARIO_DIFFICULTE,
  "proche-reception": SCENARIO_RECEPTION,
};

export const DEMO_SCENARIO_LIST = Object.values(DEMO_SCENARIOS);

export function getDemoScenario(id: string | null | undefined): DemoScenario {
  if (id && id in DEMO_SCENARIOS) return DEMO_SCENARIOS[id as DemoScenarioId];
  return SCENARIO_GO_LOGEMENTS;
}

export { SCENARIO_GO_LOGEMENTS };
