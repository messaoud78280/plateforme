/**
 * Personas démo — scopés par plateforme.
 * DEMO_PERSONAS = scénario SETRIM (Denis / Julie / Karim / Sophie / Thomas).
 * BeWork interne n’a pas de « Voir comme » client.
 */

import type { PlatformKey } from "@/lib/platform/config";
import {
  DEMO_BRAND,
  demoBrandContactFullName,
} from "./brand";

export const DEMO_PERSONA_KEYS = [
  "direction",
  "conducteur",
  "administratif",
  "client",
  "fournisseur",
] as const;
export type DemoPersonaKey = (typeof DEMO_PERSONA_KEYS)[number];

export type DemoPersonaDef = {
  key: DemoPersonaKey;
  label: string;
  name: string;
  company: string;
  jobTitle: string;
  personType: "INTERNAL" | "CLIENT_EXT" | "SUPPLIER";
  permissionProfile: "DIRECTION" | "CONDUCTEUR" | "ADMINISTRATIF" | "CLIENT" | "FOURNISSEUR";
  /** Suffixe email : {login}+{suffix}@demo.bework.local — direction = root (pas de suffixe). */
  emailSuffix: string | null;
  externalOrgType?: "CLIENT_EXT" | "SUPPLIER";
};

const HOST_COMPANY = DEMO_BRAND.companyName;

export const DEMO_PERSONAS: Record<DemoPersonaKey, DemoPersonaDef> = {
  direction: {
    key: "direction",
    label: "Direction",
    name: demoBrandContactFullName(),
    company: HOST_COMPANY,
    jobTitle: DEMO_BRAND.contactRoleLabel,
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
    emailSuffix: null,
  },
  conducteur: {
    key: "conducteur",
    label: "Conducteur de travaux",
    name: "Karim Benali",
    company: HOST_COMPANY,
    jobTitle: "Conducteur de travaux",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
    emailSuffix: "karim",
  },
  administratif: {
    key: "administratif",
    label: "Administratif",
    name: "Julie Martin",
    company: HOST_COMPANY,
    jobTitle: "Responsable administratif",
    personType: "INTERNAL",
    permissionProfile: "ADMINISTRATIF",
    emailSuffix: "julie",
  },
  client: {
    key: "client",
    label: "Client",
    name: "Sophie Martin",
    company: "Syndic Horizon Copro",
    jobTitle: "Responsable opérations",
    personType: "CLIENT_EXT",
    permissionProfile: "CLIENT",
    emailSuffix: "sophie",
    externalOrgType: "CLIENT_EXT",
  },
  fournisseur: {
    key: "fournisseur",
    label: "Fournisseur",
    name: "Thomas Bernard",
    company: "Point.P",
    jobTitle: "Commercial chantier",
    personType: "SUPPLIER",
    permissionProfile: "FOURNISSEUR",
    emailSuffix: "thomas",
    externalOrgType: "SUPPLIER",
  },
};

/**
 * Personas pour une plateforme démo.
 * SETRIM → Denis/Julie/Karim/Sophie/Thomas.
 * Autre démo → même rôles, noms génériques + company hôte (pas SETRIM en dur).
 * BeWork interne → aucun persona « Voir comme ».
 */
export function getDemoPersonasForPlatform(
  platformKey: PlatformKey,
  hostCompany?: string | null,
): Record<DemoPersonaKey, DemoPersonaDef> | null {
  if (platformKey === "bework_internal") return null;
  if (platformKey === "setrim") return DEMO_PERSONAS;

  const host = (hostCompany?.trim() || "Démonstration").trim();
  return {
    direction: {
      ...DEMO_PERSONAS.direction,
      name: "Direction",
      company: host,
      jobTitle: "Direction",
    },
    conducteur: {
      ...DEMO_PERSONAS.conducteur,
      name: "Conducteur travaux",
      company: host,
    },
    administratif: {
      ...DEMO_PERSONAS.administratif,
      name: "Administratif",
      company: host,
    },
    client: { ...DEMO_PERSONAS.client },
    fournisseur: { ...DEMO_PERSONAS.fournisseur },
  };
}

export function demoPersonaEmail(loginIdentifier: string, suffix: string | null): string {
  const base = loginIdentifier.trim().toLowerCase().replace(/@.*$/, "");
  if (!suffix) return `${base}@demo.bework.local`;
  return `${base}+${suffix}@demo.bework.local`;
}

export function isDemoPersonaKey(value: string): value is DemoPersonaKey {
  return (DEMO_PERSONA_KEYS as readonly string[]).includes(value);
}

/** Droits lisibles « Qui voit quoi ? » */
export function personaRightsSummary(key: DemoPersonaKey): {
  section: string;
  items: { label: string; allowed: boolean }[];
}[] {
  switch (key) {
    case "direction":
      return [
        {
          section: "Vision",
          items: [
            { label: "Tous les chantiers entreprise", allowed: true },
            { label: "Équipe & partenaires", allowed: true },
            { label: "Pilotage / rapports / IA", allowed: true },
            { label: "Finances / à facturer", allowed: true },
          ],
        },
      ];
    case "conducteur":
      return [
        {
          section: "Terrain",
          items: [
            { label: "Chantiers affectés", allowed: true },
            { label: "Messagerie INTERNE + CLIENT", allowed: true },
            { label: "Documents chantier", allowed: true },
            { label: "Équipe & partenaires", allowed: false },
            { label: "Finances / marges", allowed: false },
          ],
        },
      ];
    case "administratif":
      return [
        {
          section: "Bureau chantier",
          items: [
            { label: "Documents / BL / facturation", allowed: true },
            { label: "Commandes & relances admin", allowed: true },
            { label: "Messagerie INTERNE", allowed: true },
            { label: "Équipe & partenaires", allowed: true },
            { label: "Pilotage terrain (conducteur)", allowed: false },
          ],
        },
      ];
    case "client":
      return [
        {
          section: "Partagé uniquement",
          items: [
            { label: "Chantiers partagés (ex. Résidence Les Lilas)", allowed: true },
            { label: "Conversation CLIENT", allowed: true },
            { label: "Documents partagés", allowed: true },
            { label: "Fil INTERNE / fournisseurs", allowed: false },
            { label: "Autres clients / marges", allowed: false },
          ],
        },
      ];
    case "fournisseur":
      return [
        {
          section: "Commandes & livraisons",
          items: [
            { label: "Voir / confirmer commandes Point.P", allowed: true },
            { label: "Proposer une autre date", allowed: true },
            { label: "Documents partagés / BL", allowed: true },
            { label: "Conversation FOURNISSEUR", allowed: true },
            { label: "Planning interne / finances", allowed: false },
            { label: "Autres fournisseurs", allowed: false },
          ],
        },
      ];
  }
}
