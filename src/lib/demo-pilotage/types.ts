/** Types de l’espace démo Pilotage — aucune relation avec les tables métier réelles. */

export type DemoScenarioId =
  | "go-logements-public"
  | "renovation-tertiaire"
  | "vrd-lotissement"
  | "electricite-public"
  | "multi-st"
  | "en-difficulte"
  | "proche-reception";

export type DemoPersonalization = {
  prospectName?: string;
  prospectCompany?: string;
  corpsEtat?: string;
  marketType?: string;
  chantierCountApprox?: string;
  mainPain?: string;
  commercialName?: string;
  meetingDate?: string;
  /** Logo uniquement si autorisation explicite (URL fournie). */
  logoUrl?: string;
  logoAuthorized?: boolean;
};

export type DemoObligation = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  dueLabel: string;
  responsible: string;
};

export type DemoDocument = {
  id: string;
  name: string;
  category: string;
  status: string;
  mandatory: boolean;
  fictionMark: true;
};

export type DemoAction = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  dueLabel: string;
  overdue?: boolean;
};

export type DemoPlan = {
  id: string;
  reference: string;
  title: string;
  indice: string;
  status: string;
  visaDueLabel: string;
  overdue?: boolean;
};

export type DemoMilestone = {
  id: string;
  title: string;
  category: string;
  status: string;
  plannedLabel: string;
  sortOrder: number;
};

export type DemoBlocker = {
  id: string;
  title: string;
  severity: string;
  consequence: string;
  impactedMilestone: string;
  internalOwner: string;
  externalDecider: string;
  nextAction: string;
  daysOpen: number;
  status: string;
};

export type DemoSubcontractor = {
  id: string;
  companyName: string;
  prestation: string;
  approvalStatus: string;
  dossierStatus: string;
};

export type DemoSituation = {
  id: string;
  number: string;
  periodLabel: string;
  requestedHt: string;
  validatedHt: string;
  paidHt: string;
  status: string;
};

export type DemoExtraWork = {
  id: string;
  reference: string;
  description: string;
  estimatedHt: string;
  writtenValidation: boolean;
  startedWithoutValidation: boolean;
  status: string;
};

export type DemoDoeItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  mandatory: boolean;
};

export type DemoReport = {
  id: string;
  title: string;
  periodLabel: string;
  summary: string[];
};

export type DemoScenario = {
  id: DemoScenarioId;
  label: string;
  pitch: string;
  commercialAngle: string;
  clientName: string;
  worksiteTitle: string;
  location: string;
  lot: string;
  marketType: string;
  amountHt: string;
  healthLabel: "CONFORME" | "A_SURVEILLER" | "EN_DIFFICULTE" | "CRITIQUE" | "TERMINE";
  healthScore: number;
  healthReasons: string[];
  adminProgressPct: number;
  doeProgressPct: number;
  serviceLevel: string;
  actors: {
    conducteur: string;
    assistant: string;
    moa: string;
    moe: string;
    bc: string;
    sps: string;
  };
  obligations: DemoObligation[];
  documents: DemoDocument[];
  actions: DemoAction[];
  plans: DemoPlan[];
  milestones: DemoMilestone[];
  blockers: DemoBlocker[];
  subcontractors: DemoSubcontractor[];
  situations: DemoSituation[];
  extraWorks: DemoExtraWork[];
  doeItems: DemoDoeItem[];
  report: DemoReport;
};
