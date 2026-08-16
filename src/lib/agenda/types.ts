/**
 * Types d’événements Agenda BTP — extensible sans migration enum si besoin côté UI.
 * Les valeurs Prisma `AgendaEventType` restent la source de vérité en base.
 */

export const AGENDA_EVENT_TYPES = [
  { id: "REUNION_CHANTIER", label: "Réunion chantier", colorKey: "reunion" },
  { id: "VISITE_CHANTIER", label: "Visite chantier", colorKey: "chantier" },
  { id: "RDV_CLIENT", label: "Rendez-vous client", colorKey: "reunion" },
  { id: "RDV_FOURNISSEUR", label: "Rendez-vous fournisseur", colorKey: "livraison" },
  { id: "LIVRAISON", label: "Livraison", colorKey: "livraison" },
  { id: "INTERVENTION", label: "Intervention", colorKey: "chantier" },
  { id: "ECHEANCE", label: "Échéance", colorKey: "echeance" },
  { id: "ADMINISTRATIF", label: "Administratif", colorKey: "admin" },
  { id: "COMMANDE", label: "Commande", colorKey: "admin" },
  { id: "FACTURATION", label: "Facturation", colorKey: "admin" },
  { id: "SITUATION", label: "Situation de travaux", colorKey: "echeance" },
  { id: "RECEPTION", label: "Réception", colorKey: "chantier" },
  { id: "LEVEE_RESERVES", label: "Levée de réserves", colorKey: "chantier" },
  { id: "CONTROLE", label: "Contrôle", colorKey: "echeance" },
  { id: "FORMATION", label: "Formation", colorKey: "interne" },
  { id: "CONGE", label: "Congé / absence", colorKey: "personnel" },
  { id: "INTERNE", label: "Événement interne", colorKey: "interne" },
  { id: "AUTRE", label: "Autre", colorKey: "admin" },
] as const;

export type AgendaEventTypeId = (typeof AGENDA_EVENT_TYPES)[number]["id"];

/** Couleurs fonctionnelles — DESIGN-SYSTEM-2 (Agenda / Planning). */
export const AGENDA_COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  reunion: { bg: "#f3f0ff", border: "#7c5ce6", text: "#4c1d95" },
  chantier: { bg: "#e6f7fb", border: "#13a6c8", text: "#0e7490" },
  livraison: { bg: "#fff7ed", border: "#d97706", text: "#9a3412" },
  echeance: { bg: "#fef2f2", border: "#c2413a", text: "#9f2a24" },
  admin: { bg: "#e8eef5", border: "#173b67", text: "#132f4c" },
  interne: { bg: "#e8f0fe", border: "#2563eb", text: "#1d4ed8" },
  personnel: { bg: "#f3f0ff", border: "#7c5ce6", text: "#5b21b6" },
};

export function agendaTypeMeta(type: string) {
  const found = AGENDA_EVENT_TYPES.find((t) => t.id === type) ?? AGENDA_EVENT_TYPES[AGENDA_EVENT_TYPES.length - 1];
  const colors = AGENDA_COLOR_MAP[found.colorKey] ?? AGENDA_COLOR_MAP.admin;
  return { ...found, colors };
}

export const AGENDA_REMINDER_OPTIONS = [
  { minutes: 0, label: "À l’heure" },
  { minutes: 5, label: "5 min avant" },
  { minutes: 15, label: "15 min avant" },
  { minutes: 30, label: "30 min avant" },
  { minutes: 60, label: "1 heure avant" },
  { minutes: 120, label: "2 heures avant" },
  { minutes: 1440, label: "1 jour avant" },
] as const;

export const AGENDA_RECURRENCE_OPTIONS = [
  { id: "NONE", label: "Aucune" },
  { id: "DAILY", label: "Tous les jours" },
  { id: "WEEKLY", label: "Toutes les semaines" },
  { id: "MONTHLY", label: "Tous les mois" },
  { id: "YEARLY", label: "Tous les ans" },
  { id: "CUSTOM", label: "Personnalisé" },
] as const;

export type AgendaScope = "mine" | "team" | "all";
