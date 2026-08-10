/**
 * Menus adaptés par profil / type (V2).
 * UserRole reste CLIENT (portail) ; le métier filtre ici.
 */

import type { PersonType, PermissionProfileKey } from "./types";

export type PersonaNavKey =
  | "DIRECTION"
  | "ADMINISTRATIF"
  | "CONDUCTEUR"
  | "CHEF_CHANTIER"
  | "CLIENT"
  | "FOURNISSEUR"
  | "SOUS_TRAITANT"
  | "PARTENAIRE"
  | "DEFAULT_INTERNAL";

/** Hrefs autorisés ; null = menu entreprise complet (pas de filtre). */
const ALLOWED_HREFS: Record<PersonaNavKey, string[] | null> = {
  DEFAULT_INTERNAL: null,
  DIRECTION: null,
  ADMINISTRATIF: null,
  CONDUCTEUR: [
    "/dashboard",
    "/dashboard/a-traiter",
    "/dashboard/projets",
    "/dashboard/planning",
    "/dashboard/agenda",
    "/dashboard/messages",
    "/dashboard/taches",
    "/dashboard/commandes",
    "/dashboard/documents",
    "/dashboard/messagerie",
    "/dashboard/fiches-suivi",
    "/dashboard/livraisons",
    "/dashboard/facturation",
    "/dashboard/parametres",
  ],
  CHEF_CHANTIER: [
    "/dashboard",
    "/dashboard/a-traiter",
    "/dashboard/projets",
    "/dashboard/planning",
    "/dashboard/agenda",
    "/dashboard/messages",
    "/dashboard/taches",
    "/dashboard/documents",
    "/dashboard/messagerie",
    "/dashboard/fiches-suivi",
    "/dashboard/facturation",
    "/dashboard/parametres",
  ],
  CLIENT: [
    "/dashboard",
    "/dashboard/projets",
    "/dashboard/agenda",
    "/dashboard/documents",
    "/dashboard/messagerie",
    "/dashboard/taches",
    "/dashboard/parametres",
  ],
  FOURNISSEUR: [
    "/dashboard",
    "/dashboard/commandes",
    "/dashboard/livraisons",
    "/dashboard/messagerie",
    "/dashboard/documents",
    "/dashboard/parametres",
  ],
  SOUS_TRAITANT: [
    "/dashboard",
    "/dashboard/projets",
    "/dashboard/agenda",
    "/dashboard/documents",
    "/dashboard/messagerie",
    "/dashboard/taches",
    "/dashboard/parametres",
  ],
  PARTENAIRE: [
    "/dashboard",
    "/dashboard/projets",
    "/dashboard/documents",
    "/dashboard/messagerie",
    "/dashboard/parametres",
  ],
};

export function resolvePersonaNavKey(
  personType: string | null | undefined,
  permissionProfile: string | null | undefined
): PersonaNavKey {
  if (permissionProfile && permissionProfile in ALLOWED_HREFS) {
    return permissionProfile as PersonaNavKey;
  }
  if (!personType || personType === "INTERNAL") return "DEFAULT_INTERNAL";
  if (personType === "CLIENT_EXT") return "CLIENT";
  if (personType === "SUPPLIER") return "FOURNISSEUR";
  if (personType === "SUBCONTRACTOR") return "SOUS_TRAITANT";
  return "PARTENAIRE";
}

export function isHrefAllowedForPersona(
  href: string,
  personType: string | null | undefined,
  permissionProfile: string | null | undefined
): boolean {
  const key = resolvePersonaNavKey(personType, permissionProfile);
  const allowed = ALLOWED_HREFS[key];
  if (allowed === null) return true;
  // Important : « /dashboard » ne doit PAS matcher « /dashboard/planning » (préfixe).
  return allowed.some((a) => {
    if (a === "/dashboard") return href === "/dashboard" || href === "/dashboard/";
    return href === a || href.startsWith(`${a}/`);
  });
}

export function personaHomeLabel(
  personType: string | null | undefined,
  permissionProfile: string | null | undefined
): string {
  const key = resolvePersonaNavKey(personType, permissionProfile);
  switch (key) {
    case "FOURNISSEUR":
      return "Espace fournisseur";
    case "CLIENT":
      return "Espace client";
    case "SOUS_TRAITANT":
      return "Espace sous-traitant";
    case "PARTENAIRE":
      return "Espace partenaire";
    case "CHEF_CHANTIER":
      return "Espace chef de chantier";
    case "CONDUCTEUR":
      return "Espace conducteur";
    default:
      return "Espace entreprise";
  }
}

export function isExternalPortalUser(personType: string | null | undefined): boolean {
  return Boolean(personType && personType !== "INTERNAL");
}

export function canManageEquipe(
  personType: string | null | undefined,
  permissionProfile: string | null | undefined
): boolean {
  if (isExternalPortalUser(personType)) return false;
  // Owner / legacy sans profil : OK
  if (!permissionProfile) return true;
  // V2A : Direction & Administratif uniquement (pas Conducteur)
  return permissionProfile === "DIRECTION" || permissionProfile === "ADMINISTRATIF";
}

/** Channel messagerie chantier selon le type de personne. */
export type MessageChannel = "INTERNE" | "CLIENT" | "FOURNISSEUR";

export const MESSAGE_CHANNEL_LABELS: Record<MessageChannel, string> = {
  INTERNE: "Interne",
  CLIENT: "Client",
  FOURNISSEUR: "Fournisseur",
};

export function defaultMessageChannelForPerson(
  personType: string | null | undefined
): MessageChannel {
  if (!personType || personType === "INTERNAL") return "INTERNE";
  if (personType === "SUPPLIER") return "FOURNISSEUR";
  if (personType === "CLIENT_EXT") return "CLIENT";
  // ST / MOE / BC / partenaires → fil client (partagé chantier, pas interne)
  return "CLIENT";
}

/** Canaux visibles pour un utilisateur. */
export function visibleMessageChannels(
  personType: string | null | undefined,
  role?: string | null
): MessageChannel[] {
  if (role === "MANAGER" || role === "AGENCE" || role === "AGENT") {
    return ["INTERNE", "CLIENT", "FOURNISSEUR"];
  }
  if (!personType || personType === "INTERNAL") {
    return ["INTERNE", "CLIENT", "FOURNISSEUR"];
  }
  if (personType === "SUPPLIER") return ["FOURNISSEUR"];
  if (personType === "CLIENT_EXT") return ["CLIENT"];
  return ["CLIENT"];
}

export function canPostToMessageChannel(
  personType: string | null | undefined,
  role: string | null | undefined,
  channel: MessageChannel
): boolean {
  return visibleMessageChannels(personType, role).includes(channel);
}

export type { PersonType, PermissionProfileKey };
