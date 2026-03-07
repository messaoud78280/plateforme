/**
 * Types partagés – alignés sur le schéma Prisma et le brief
 */

export type UserRole = "CLIENT" | "AGENCE" | "MANAGER";

/** Vrai si l'utilisateur est agence ou gérant (accès côté agence) */
export const isAgenceOrManager = (role: string) => role === "AGENCE" || role === "MANAGER";

export type TaskStatus = "EN_COURS" | "COMPLETE" | "EN_ATTENTE";
export type DocumentCategory = "FACTURE" | "CONTRAT" | "RH" | "FISCAL" | "AUTRE";
export type DocumentStatus = "EN_ATTENTE" | "EN_TRAITEMENT" | "TRAITE" | "ARCHIVE";
export type AlertLevel = "INFO" | "WARNING" | "URGENT";
export type ProjectStatus = "NOUVEAU" | "EN_COURS" | "EN_ATTENTE" | "TERMINE";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  clientId: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  fileUrl: string;
  fileSize: number;
  mimeType: string | null;
  status: DocumentStatus;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  clientId: string;
  createdAt: Date;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  level: AlertLevel;
  read: boolean;
  createdAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Labels pour affichage */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  EN_COURS: "En cours",
  COMPLETE: "Terminée",
  EN_ATTENTE: "En attente",
};

/** Libellés orientés client pour le dashboard */
export const CLIENT_TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  EN_ATTENTE: "Reçue",
  EN_COURS: "En cours",
  COMPLETE: "Terminée",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  FACTURE: "Facture",
  CONTRAT: "Contrat",
  RH: "RH",
  FISCAL: "Fiscal",
  AUTRE: "Autre",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  EN_ATTENTE: "En attente",
  EN_TRAITEMENT: "En traitement",
  TRAITE: "Traité",
  ARCHIVE: "Archivé",
};

export const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  INFO: "Info",
  WARNING: "Attention",
  URGENT: "Urgent",
};
