/**
 * Formats JSON documents de chantier — sans API IA.
 * bework_site_report_v1 | bework_ppsps_v1
 */

export const BEWORK_SITE_REPORT_FORMAT = "bework_site_report_v1" as const;
export const BEWORK_PPSPS_FORMAT = "bework_ppsps_v1" as const;

export type SiteReportParticipant = {
  name: string;
  company?: string | null;
  role?: string | null;
};

export type SiteReportNextStep = {
  action: string;
  responsible?: string | null;
  dueDate?: string | null;
};

export type SiteReportPayload = {
  title: string;
  reportNumber: string;
  date: string;
  time?: string | null;
  weather?: string | null;
  author?: string | null;
  summary?: string | null;
  participants: SiteReportParticipant[];
  workCompleted: string[];
  workInProgress: string[];
  progressPercent?: number | null;
  observations: string[];
  issues: string[];
  constraints: string[];
  delayNote?: string | null;
  decisions: string[];
  clientValidations: string[];
  clientRequests: string[];
  requestedChanges: string[];
  safetyObservations: string[];
  safetyAnomaly?: string | null;
  correctiveActions: string[];
  nextSteps: SiteReportNextStep[];
  plannedWorks: string[];
  reservations: string[];
  additionalNotes?: string | null;
  nextMeeting?: string | null;
};

export type PpspsRisk = {
  activity: string;
  hazard: string;
  personsExposed?: string | null;
  level?: string | null;
  prevention: string;
  category?: string | null;
};

export type PpspsParticipant = {
  company: string;
  responsible?: string | null;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type PpspsPayload = {
  title: string;
  versionLabel?: string | null;
  project: {
    name?: string | null;
    address?: string | null;
    plannedStart?: string | null;
    plannedEnd?: string | null;
    workforce?: string | null;
    contact?: string | null;
  };
  company: {
    name?: string | null;
    responsible?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  participants: PpspsParticipant[];
  workDescription: string[];
  workMethods: string[];
  workPhases: string[];
  equipment: string[];
  risks: PpspsRisk[];
  ppe: string[];
  siteOrganization: {
    access?: string | null;
    circulation?: string | null;
    storage?: string | null;
    delivery?: string | null;
    marking?: string | null;
    workZone?: string | null;
    sanitation?: string | null;
    waste?: string | null;
  };
  emergency: {
    procedure?: string | null;
    assemblyPoint?: string | null;
    firstAid?: string | null;
    kit?: string | null;
    responsible?: string | null;
  };
  coactivity: string[];
  environment: string[];
  additionalNotes: string[];
};

export function emptySiteReportPayload(
  partial?: Partial<SiteReportPayload>,
): SiteReportPayload {
  return {
    title: "",
    reportNumber: "",
    date: new Date().toISOString().slice(0, 10),
    time: null,
    weather: null,
    author: null,
    summary: null,
    participants: [],
    workCompleted: [],
    workInProgress: [],
    progressPercent: null,
    observations: [],
    issues: [],
    constraints: [],
    delayNote: null,
    decisions: [],
    clientValidations: [],
    clientRequests: [],
    requestedChanges: [],
    safetyObservations: [],
    safetyAnomaly: null,
    correctiveActions: [],
    nextSteps: [],
    plannedWorks: [],
    reservations: [],
    additionalNotes: null,
    nextMeeting: null,
    ...partial,
  };
}

export function emptyPpspsPayload(partial?: Partial<PpspsPayload>): PpspsPayload {
  return {
    title: "PPSPS",
    versionLabel: "Version 1",
    project: {},
    company: {},
    participants: [],
    workDescription: [],
    workMethods: [],
    workPhases: [],
    equipment: [],
    risks: [],
    ppe: [
      "Casque",
      "Chaussures de sécurité",
      "Gants",
      "Lunettes de protection",
      "Vêtement haute visibilité",
    ],
    siteOrganization: {},
    emergency: {},
    coactivity: [],
    environment: [],
    additionalNotes: [],
    ...partial,
  };
}

export const PPSPS_RISK_CATEGORIES = [
  "circulation engins / piétons",
  "terrassement",
  "réseaux enterrés",
  "chute de hauteur",
  "chute de plain-pied",
  "manutention",
  "levage",
  "électricité",
  "poussières",
  "bruit",
  "machines",
  "produits",
  "coactivité",
  "incendie",
  "autre",
] as const;

export const PPSPS_EQUIPMENT_PRESETS = [
  "Mini-pelle",
  "Pelle",
  "Nacelle",
  "Échafaudage",
  "Camion",
  "Compacteur",
  "Outillage électrique",
] as const;

export const SITE_REPORT_PHOTO_CATEGORIES = [
  "avant",
  "travaux",
  "anomalie",
  "apres",
  "autre",
] as const;
