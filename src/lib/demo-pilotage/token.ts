import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { DemoPersonalization, DemoScenarioId } from "./types";

export function generateDemoToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAccessCode(code: string, token: string): string {
  return createHash("sha256").update(`${token}:${code.trim()}`).digest("hex");
}

export function verifyAccessCode(code: string, token: string, hash: string | null | undefined): boolean {
  if (!hash) return true;
  const computed = hashAccessCode(code, token);
  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

export type DemoLinkCreateInput = {
  scenarioId: DemoScenarioId;
  prospectName?: string;
  prospectCompany?: string;
  expiresInDays?: number;
  maxViews?: number | null;
  accessCode?: string | null;
  personalization?: DemoPersonalization;
  createdById?: string | null;
};

export const DEMO_INTEREST_OPTIONS = [
  { id: "appels-offres", label: "Appels d’offres" },
  { id: "analyse-contractuelle", label: "Analyse contractuelle" },
  { id: "preparation-chantier", label: "Préparation de chantier" },
  { id: "suivi-documentaire", label: "Suivi documentaire" },
  { id: "assistance-conducteur", label: "Assistance conducteur" },
  { id: "plans-visas", label: "Plans et visas" },
  { id: "situations", label: "Situations" },
  { id: "travaux-supplementaires", label: "Travaux supplémentaires" },
  { id: "doe", label: "DOE" },
  { id: "rapports", label: "Rapports" },
] as const;

export const DEMO_TOUR_STEPS = [
  {
    id: "vue",
    title: "Vue générale du chantier",
    text: "En un coup d’œil : santé, urgences, prochain jalon et avancement administratif.",
  },
  {
    id: "obligations",
    title: "Obligations extraites du marché",
    text: "BeWork transforme les exigences du marché en éléments concrets à suivre.",
  },
  {
    id: "actions",
    title: "Actions du jour",
    text: "La file de travail concentre retards, validations et relances.",
  },
  {
    id: "plans",
    title: "Plans et visas",
    text: "Chaque version, envoi, observation et visa reste tracé.",
  },
  {
    id: "blocages",
    title: "Centre des blocages",
    text: "Les décisions attendues sont visibles avant qu’elles ne deviennent des retards.",
  },
  {
    id: "jalons",
    title: "Jalons",
    text: "La timeline montre où le marché en est — et ce qui bloque la suite.",
  },
  {
    id: "financier",
    title: "Suivi financier administratif",
    text: "Situations et travaux supplémentaires suivis sans confusion avec la comptabilité.",
  },
  {
    id: "doe",
    title: "DOE progressif",
    text: "Le DOE est constitué progressivement, pas recherché à la fin du chantier.",
  },
  {
    id: "rapport",
    title: "Rapport hebdomadaire",
    text: "La direction reçoit une synthèse claire sans devoir ouvrir tous les tableaux.",
  },
  {
    id: "resultat",
    title: "Résultat pour l’entreprise",
    text: "Moins d’oublis, plus de preuves, une vision partagée pour piloter le marché.",
  },
] as const;

export const DEMO_VALUE_TIPS: Record<string, string> = {
  obligations: "BeWork transforme les exigences du marché en éléments concrets à suivre.",
  plans: "Chaque version, envoi, observation et visa reste tracé.",
  blocages: "Les décisions attendues sont visibles avant qu’elles ne deviennent des retards de chantier.",
  doe: "Le DOE est constitué progressivement, au lieu d’être recherché à la fin du chantier.",
  rapport: "La direction reçoit une synthèse claire sans devoir consulter tous les tableaux.",
  actions: "Chaque action a un responsable, une échéance et un historique.",
  jalons: "Les jalons relient documents, validations et avancement du marché.",
};
