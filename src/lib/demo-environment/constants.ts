/** Domaine technique réservé aux comptes de démonstration (jamais d’email réel). */
export const DEMO_EMAIL_DOMAIN = "demo.bework.local";

export const DEMO_TEMPLATES = {
  PME_BTP: {
    key: "PME_BTP",
    label: "Gestion PME BTP",
    description: "Pilotage quotidien : chantiers, planning, commandes, documents, tâches, alertes.",
  },
  CHANTIER_TERRAIN: {
    key: "CHANTIER_TERRAIN",
    label: "Chantier & terrain",
    description: "Priorité terrain : chantiers, équipes, planning, CR, photos, réserves, DOE.",
  },
  MARCHES_ETUDES: {
    key: "MARCHES_ETUDES",
    label: "Marchés & études",
    description: "DCE, CCTP, DPGF, analyse contractuelle et assistants IA marchés.",
  },
  ENTREPRISE_GENERALE: {
    key: "ENTREPRISE_GENERALE",
    label: "Entreprise générale / PME structurée",
    description: "Combinaison gestion, marchés, chantiers, sous-traitants et pilotage.",
  },
} as const;

export type DemoTemplateKey = keyof typeof DEMO_TEMPLATES;

export const DEMO_MODULE_KEYS = [
  "dashboard",
  "chantiers",
  "planning",
  "taches",
  "alertes",
  "commandes",
  "documents",
  "communication",
  "fournisseurs",
  "sous_traitants",
  "administratif",
  "comptes_rendus",
  "reserves",
  "doe",
  "ia",
  "marches",
  "finance",
  "direction",
] as const;

export type DemoModuleKey = (typeof DEMO_MODULE_KEYS)[number];

export const DEMO_MODULE_LABELS: Record<DemoModuleKey, string> = {
  dashboard: "Tableau de bord",
  chantiers: "Chantiers",
  planning: "Planning",
  taches: "Tâches",
  alertes: "Alertes",
  commandes: "Bons de commande",
  documents: "Documents",
  communication: "Messagerie",
  fournisseurs: "Fournisseurs",
  sous_traitants: "Sous-traitants",
  administratif: "Administratif",
  comptes_rendus: "Comptes rendus",
  reserves: "Réserves",
  doe: "DOE",
  ia: "Intelligence artificielle",
  marches: "Marchés publics et privés",
  finance: "Suivi financier",
  direction: "Direction / Pilotage",
};

/** Modules par défaut selon le template (Marchés désactivé sauf modèles dédiés). */
export function defaultModulesForTemplate(template: DemoTemplateKey): DemoModuleKey[] {
  const base: DemoModuleKey[] = [
    "dashboard",
    "chantiers",
    "planning",
    "taches",
    "alertes",
    "commandes",
    "documents",
    "communication",
    "administratif",
    "fournisseurs",
    "sous_traitants",
    "comptes_rendus",
    "ia",
    "direction",
  ];

  if (template === "CHANTIER_TERRAIN") {
    return [...base, "reserves", "doe"];
  }
  if (template === "MARCHES_ETUDES") {
    return [
      "dashboard",
      "chantiers",
      "documents",
      "taches",
      "alertes",
      "ia",
      "marches",
      "direction",
    ];
  }
  if (template === "ENTREPRISE_GENERALE") {
    return [...base, "reserves", "doe", "marches", "finance"];
  }
  // PME_BTP : pas de marchés par défaut
  return [...base, "reserves", "doe"];
}

export const DEMO_SECTORS = [
  "Étanchéité",
  "Couverture",
  "Gros œuvre",
  "Maçonnerie",
  "Électricité",
  "Plomberie",
  "TP",
  "Entreprise générale",
  "Autre",
] as const;

export type DemoEnvironmentStatus = "ACTIVE" | "DISABLED" | "EXPIRED" | "ARCHIVED";

export function isDemoTemplateKey(value: string): value is DemoTemplateKey {
  return value in DEMO_TEMPLATES;
}

export function toDemoEmail(loginIdentifier: string): string {
  const slug = loginIdentifier.trim().toLowerCase().replace(/@.*$/, "");
  return `${slug}@${DEMO_EMAIL_DOMAIN}`;
}

export function isDemoEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`);
}

export function normalizeLoginIdentifier(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
