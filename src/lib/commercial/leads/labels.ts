import type { CommercialLeadStatus } from "@prisma/client";

export const COMMERCIAL_LEAD_STATUSES: {
  value: CommercialLeadStatus;
  label: string;
}[] = [
  { value: "NOUVEAU", label: "Nouveau" },
  { value: "CONTACTE", label: "Contacté" },
  { value: "RDV_PLANIFIE", label: "Rendez-vous planifié" },
  { value: "ETUDE_EN_COURS", label: "Étude en cours" },
  { value: "DEVIS_A_PREPARER", label: "Devis à préparer" },
  { value: "DEVIS_ENVOYE", label: "Devis envoyé" },
  { value: "A_RELANCER", label: "À relancer" },
  { value: "GAGNE", label: "Gagné" },
  { value: "PERDU", label: "Perdu" },
];

export function leadDisplayName(lead: {
  firstName: string;
  lastName: string;
}): string {
  return `${lead.firstName} ${lead.lastName}`.trim();
}

export function leadStatusLabel(status: CommercialLeadStatus): string {
  return COMMERCIAL_LEAD_STATUSES.find((s) => s.value === status)?.label ?? status;
}
