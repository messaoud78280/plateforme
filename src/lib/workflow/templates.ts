import type { FollowUpSheetStatus } from "@prisma/client";

export type WorkflowTemplateStep = {
  statusKey: FollowUpSheetStatus;
  label: string;
  colorKey: string;
  sortOrder: number;
  visibleOnBoard: boolean;
  defaultRole?: string;
  delayHours?: number;
  reminderHours?: number;
  alertOrangeHours?: number;
  alertRedHours?: number;
  escalateHours?: number;
  nextActionLabel?: string;
  nextActionDelayHours?: number;
};

export type WorkflowTemplate = {
  templateKey: string;
  name: string;
  description: string;
  steps: WorkflowTemplateStep[];
};

/** Template ABC Étanchéité / chantier standard — clés = FollowUpSheetStatus. */
export const TEMPLATE_CHANTIER_STANDARD: WorkflowTemplate = {
  templateKey: "CHANTIER_STANDARD",
  name: "Chantier standard",
  description:
    "Processus OS → planification → fournisseur → intervention → facturation → clôture. Couleurs post-it indépendantes de l’urgence.",
  steps: [
    {
      statusKey: "NOUVEAU",
      label: "Commande / OS reçu",
      colorKey: "bleu",
      sortOrder: 10,
      visibleOnBoard: true,
      defaultRole: "ADMINISTRATIF",
      delayHours: 48,
      reminderHours: 24,
      alertOrangeHours: 48,
      nextActionLabel: "Analyser le dossier / OS",
      nextActionDelayHours: 24,
    },
    {
      statusKey: "A_ANALYSER",
      label: "À analyser",
      colorKey: "bleu",
      sortOrder: 20,
      visibleOnBoard: true,
      defaultRole: "ADMINISTRATIF",
      delayHours: 48,
      nextActionLabel: "Programmer l’intervention",
      nextActionDelayHours: 48,
    },
    {
      statusKey: "A_PLANIFIER",
      label: "À planifier",
      colorKey: "jaune",
      sortOrder: 30,
      visibleOnBoard: true,
      defaultRole: "CONDUCTEUR",
      delayHours: 48,
      reminderHours: 24,
      alertOrangeHours: 48,
      alertRedHours: 72,
      escalateHours: 96,
      nextActionLabel: "Confirmer la date d’intervention",
      nextActionDelayHours: 24,
    },
    {
      statusKey: "PLANIFIE",
      label: "Planifié",
      colorKey: "jaune",
      sortOrder: 40,
      visibleOnBoard: true,
      defaultRole: "CONDUCTEUR",
      delayHours: 168,
      nextActionLabel: "Préparer l’intervention",
      nextActionDelayHours: 48,
    },
    {
      statusKey: "INTERVENTION_PREVUE",
      label: "Préparation",
      colorKey: "orange",
      sortOrder: 50,
      visibleOnBoard: true,
      defaultRole: "CONDUCTEUR",
      delayHours: 72,
      nextActionLabel: "Passer / confirmer commande fournisseur",
      nextActionDelayHours: 24,
    },
    {
      statusKey: "COMMANDE_FOURNISSEUR",
      label: "Commande fournisseur",
      colorKey: "orange",
      sortOrder: 60,
      visibleOnBoard: true,
      defaultRole: "ACHATS",
      delayHours: 24,
      reminderHours: 12,
      alertOrangeHours: 24,
      nextActionLabel: "Confirmer la commande fournisseur",
      nextActionDelayHours: 24,
    },
    {
      statusKey: "COMMANDE_PASSEE",
      label: "Commande passée",
      colorKey: "orange",
      sortOrder: 65,
      visibleOnBoard: false,
      defaultRole: "ACHATS",
      nextActionLabel: "Suivre la livraison fournisseur",
      nextActionDelayHours: 48,
    },
    {
      statusKey: "ATTENTE_FOURNISSEUR",
      label: "En attente fournisseur",
      colorKey: "orange",
      sortOrder: 70,
      visibleOnBoard: true,
      defaultRole: "ACHATS",
      delayHours: 48,
      alertOrangeHours: 24,
      nextActionLabel: "Préparer l’intervention",
      nextActionDelayHours: 24,
    },
    {
      statusKey: "EN_COURS",
      label: "Intervention",
      colorKey: "orange",
      sortOrder: 80,
      visibleOnBoard: true,
      defaultRole: "CONDUCTEUR",
      nextActionLabel: "Clôturer les travaux",
      nextActionDelayHours: 0,
    },
    {
      statusKey: "TRAVAUX_TERMINES",
      label: "Travaux terminés",
      colorKey: "vert",
      sortOrder: 90,
      visibleOnBoard: true,
      defaultRole: "CONDUCTEUR",
      delayHours: 48,
      nextActionLabel: "Préparer la facturation",
      nextActionDelayHours: 48,
    },
    {
      statusKey: "CR_A_RECUPERER",
      label: "CR à récupérer",
      colorKey: "vert",
      sortOrder: 95,
      visibleOnBoard: false,
      defaultRole: "ADMINISTRATIF",
      nextActionLabel: "Préparer la facturation",
      nextActionDelayHours: 48,
    },
    {
      statusKey: "AVENANT",
      label: "Avenant en cours",
      colorKey: "violet",
      sortOrder: 100,
      visibleOnBoard: true,
      defaultRole: "ADMINISTRATIF",
      delayHours: 120,
      reminderHours: 120,
      alertOrangeHours: 168,
      escalateHours: 192,
      nextActionLabel: "Relancer validation client",
      nextActionDelayHours: 72,
    },
    {
      statusKey: "A_FACTURER",
      label: "À facturer",
      colorKey: "vert",
      sortOrder: 110,
      visibleOnBoard: true,
      defaultRole: "COMPTABILITE",
      delayHours: 72,
      reminderHours: 24,
      alertOrangeHours: 72,
      alertRedHours: 120,
      escalateHours: 168,
      nextActionLabel: "Préparer la facture",
      nextActionDelayHours: 48,
    },
    {
      statusKey: "FACTURE",
      label: "Facturé",
      colorKey: "vert",
      sortOrder: 120,
      visibleOnBoard: true,
      defaultRole: "COMPTABILITE",
      nextActionLabel: "Suivre le règlement",
      nextActionDelayHours: 720,
    },
    {
      statusKey: "ATTENTE_REGLEMENT",
      label: "En attente règlement",
      colorKey: "vert",
      sortOrder: 130,
      visibleOnBoard: false,
      defaultRole: "COMPTABILITE",
      nextActionLabel: "Clôturer le dossier",
      nextActionDelayHours: 168,
    },
    {
      statusKey: "TERMINE",
      label: "Clos",
      colorKey: "vert",
      sortOrder: 140,
      visibleOnBoard: true,
      defaultRole: "DIRECTION",
    },
    {
      statusKey: "ARCHIVE",
      label: "Archivé",
      colorKey: "vert",
      sortOrder: 150,
      visibleOnBoard: false,
    },
  ],
};

export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  CHANTIER_STANDARD: TEMPLATE_CHANTIER_STANDARD,
};

export const WORKFLOW_DEFAULT_ROLES = [
  { key: "DIRECTION", label: "Direction" },
  { key: "ADMINISTRATIF", label: "Administratif" },
  { key: "CONDUCTEUR", label: "Conducteur de travaux" },
  { key: "ACHATS", label: "Achats" },
  { key: "COMPTABILITE", label: "Comptabilité" },
] as const;
