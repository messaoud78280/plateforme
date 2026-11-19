/**
 * Options du formulaire d’intérêt formation professionnelle BTP.
 * Aucune affirmation Qualiopi / CPF / certification — à valider avant publication commerciale.
 */

export const FORMATION_BTP_DOMAIN_OPTIONS = [
  {
    value: "conduite_travaux",
    label: "Conduite de travaux",
  },
  {
    value: "encadrement_chantier",
    label: "Encadrement de chantier",
  },
  {
    value: "techniques_tp_vrd",
    label: "Techniques TP / VRD",
  },
  {
    value: "lecture_plans",
    label: "Lecture de plans",
  },
  {
    value: "modes_operatoires",
    label: "Modes opératoires et exigences techniques d’ouvrages",
  },
  {
    value: "preparation_chantier",
    label: "Préparation de chantier",
  },
  {
    value: "autre",
    label: "Autre besoin formation BTP",
  },
] as const;

export const FORMATION_BTP_PARTICIPANT_OPTIONS = [
  { value: "1", label: "1 participant" },
  { value: "2_5", label: "2 à 5 participants" },
  { value: "6_10", label: "6 à 10 participants" },
  { value: "11_plus", label: "Plus de 10 participants" },
] as const;

export const FORMATION_BTP_LOCATION_OPTIONS = [
  { value: "sur_chantier", label: "Sur chantier" },
  { value: "locaux_entreprise", label: "Dans les locaux de l’entreprise" },
  { value: "a_definir", label: "À définir ensemble" },
] as const;

export type FormationBtpDomainId =
  (typeof FORMATION_BTP_DOMAIN_OPTIONS)[number]["value"];
export type FormationBtpParticipantId =
  (typeof FORMATION_BTP_PARTICIPANT_OPTIONS)[number]["value"];
export type FormationBtpLocationId =
  (typeof FORMATION_BTP_LOCATION_OPTIONS)[number]["value"];

export function labelFormationBtpDomain(value: string): string {
  return (
    FORMATION_BTP_DOMAIN_OPTIONS.find((o) => o.value === value)?.label ?? value
  );
}

export function labelFormationBtpParticipants(value: string): string {
  return (
    FORMATION_BTP_PARTICIPANT_OPTIONS.find((o) => o.value === value)?.label ??
    value
  );
}

export function labelFormationBtpLocation(value: string): string {
  return (
    FORMATION_BTP_LOCATION_OPTIONS.find((o) => o.value === value)?.label ??
    value
  );
}
