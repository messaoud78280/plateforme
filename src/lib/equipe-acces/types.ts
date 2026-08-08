/** Types métier — Équipe & partenaires V1 */

export const PERSON_TYPES = [
  "INTERNAL",
  "CLIENT_EXT",
  "SUPPLIER",
  "SUBCONTRACTOR",
  "MOE",
  "CONTROL_OFFICE",
  "PARTNER",
] as const;

export type PersonType = (typeof PERSON_TYPES)[number];

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  INTERNAL: "Personnel interne",
  CLIENT_EXT: "Client",
  SUPPLIER: "Fournisseur",
  SUBCONTRACTOR: "Sous-traitant",
  MOE: "Maîtrise d’œuvre",
  CONTROL_OFFICE: "Bureau de contrôle",
  PARTNER: "Autre partenaire",
};

export const ACCESS_STATUSES = ["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const ACCESS_STATUS_LABELS: Record<AccessStatus, string> = {
  ACTIVE: "Actif",
  INVITED: "Invitation en attente",
  SUSPENDED: "Suspendu",
  DISABLED: "Désactivé",
};

export const PERMISSION_PROFILES = [
  "DIRECTION",
  "ADMINISTRATIF",
  "CONDUCTEUR",
  "CHEF_CHANTIER",
  "CLIENT",
  "FOURNISSEUR",
  "SOUS_TRAITANT",
  "PARTENAIRE",
] as const;

export type PermissionProfileKey = (typeof PERMISSION_PROFILES)[number];

export const PERMISSION_PROFILE_LABELS: Record<PermissionProfileKey, string> = {
  DIRECTION: "Direction",
  ADMINISTRATIF: "Administratif",
  CONDUCTEUR: "Conducteur de travaux",
  CHEF_CHANTIER: "Chef de chantier",
  CLIENT: "Client",
  FOURNISSEUR: "Fournisseur",
  SOUS_TRAITANT: "Sous-traitant",
  PARTENAIRE: "Partenaire",
};

/** Profil par défaut selon le type d’utilisateur. */
export function defaultProfileForPersonType(type: PersonType): PermissionProfileKey {
  switch (type) {
    case "INTERNAL":
      return "CONDUCTEUR";
    case "CLIENT_EXT":
      return "CLIENT";
    case "SUPPLIER":
      return "FOURNISSEUR";
    case "SUBCONTRACTOR":
      return "SOUS_TRAITANT";
    case "MOE":
    case "CONTROL_OFFICE":
    case "PARTNER":
      return "PARTENAIRE";
    default:
      return "PARTENAIRE";
  }
}

export function profilesForPersonType(type: PersonType): PermissionProfileKey[] {
  if (type === "INTERNAL") {
    return ["DIRECTION", "ADMINISTRATIF", "CONDUCTEUR", "CHEF_CHANTIER"];
  }
  if (type === "CLIENT_EXT") return ["CLIENT"];
  if (type === "SUPPLIER") return ["FOURNISSEUR"];
  if (type === "SUBCONTRACTOR") return ["SOUS_TRAITANT"];
  return ["PARTENAIRE"];
}

export type ProjectAccessScopes = {
  messages?: boolean;
  documents?: boolean;
  agenda?: boolean;
  deliveries?: boolean;
};

export const DEFAULT_SCOPES_BY_PROFILE: Record<PermissionProfileKey, ProjectAccessScopes> = {
  DIRECTION: { messages: true, documents: true, agenda: true, deliveries: true },
  ADMINISTRATIF: { messages: true, documents: true, agenda: true, deliveries: true },
  CONDUCTEUR: { messages: true, documents: true, agenda: true, deliveries: true },
  CHEF_CHANTIER: { messages: true, documents: true, agenda: true, deliveries: false },
  CLIENT: { messages: true, documents: true, agenda: true, deliveries: false },
  FOURNISSEUR: { messages: true, documents: true, agenda: false, deliveries: true },
  SOUS_TRAITANT: { messages: true, documents: true, agenda: true, deliveries: false },
  PARTENAIRE: { messages: true, documents: true, agenda: true, deliveries: false },
};

export type EquipeTab =
  | "tous"
  | "personnel"
  | "clients"
  | "fournisseurs"
  | "sous-traitants"
  | "partenaires"
  | "invitations";

export function personTypesForTab(tab: EquipeTab): PersonType[] | null {
  switch (tab) {
    case "personnel":
      return ["INTERNAL"];
    case "clients":
      return ["CLIENT_EXT"];
    case "fournisseurs":
      return ["SUPPLIER"];
    case "sous-traitants":
      return ["SUBCONTRACTOR"];
    case "partenaires":
      return ["MOE", "CONTROL_OFFICE", "PARTNER"];
    default:
      return null;
  }
}
