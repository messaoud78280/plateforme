/** Personas démo ABC Étanchéité (specs 158–196). */

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

export const DEMO_PERSONAS: Record<DemoPersonaKey, DemoPersonaDef> = {
  direction: {
    key: "direction",
    label: "Direction",
    name: "Marc Dupont",
    company: "ABC Étanchéité",
    jobTitle: "Directeur",
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
    emailSuffix: null,
  },
  conducteur: {
    key: "conducteur",
    label: "Conducteur de travaux",
    name: "Karim Benali",
    company: "ABC Étanchéité",
    jobTitle: "Conducteur de travaux",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
    emailSuffix: "karim",
  },
  administratif: {
    key: "administratif",
    label: "Administratif",
    name: "Julie Martin",
    company: "ABC Étanchéité",
    jobTitle: "Responsable administratif",
    personType: "INTERNAL",
    permissionProfile: "ADMINISTRATIF",
    emailSuffix: "julie",
  },
  client: {
    key: "client",
    label: "Client",
    name: "Sophie Martin",
    company: "ABC Promotion",
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
            { label: "Chantiers partagés (ex. Victor Hugo)", allowed: true },
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
