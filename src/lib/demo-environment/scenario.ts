/**
 * SETRIM-DEMO-V2 — scénario métier de démonstration (données fictives).
 *
 * Séparé de DEMO_BRAND (identité / logo / Denis).
 * Activités inspirées du site setrim.fr (vérifiable) — clients / adresses / BC fictifs.
 *
 * Pipeline technique inchangé : BC-2026-043 · fournisseur · OS-4587 · Attention · Agenda.
 */

export type DemoScenarioProjectKey = "primary" | "waiting" | "study" | "calm";

/** Numéro BC du scénario commercial — source unique. */
export const DEMO_SCENARIO_ORDER_NUMBER = "BC-2026-043";

export type DemoScenarioProject = {
  key: DemoScenarioProjectKey;
  /** Titre court affiché (liste Chantiers). */
  title: string;
  /** Jeton pour finders Prisma / includes — stable. */
  matchToken: string;
  /** Anciens jetons (démos non reset) — finders OR. */
  legacyMatchTokens: readonly string[];
  description: string;
  workObject: string;
  siteAddress: string;
  siteCity: string;
  /** Rôle narratif commercial. */
  role: string;
};

export type DemoScenarioConfig = {
  version: "setrim-v2";
  /** Sources métier vérifiées (site) — pour rapport / doc interne. */
  verifiedActivities: readonly string[];
  verifiedClientTypes: readonly string[];
  orderNumber: string;
  osNumber: string;
  supplierName: string;
  client: {
    name: string;
    shortLabel: string;
  };
  materials: {
    /** Libellé commande / PO. */
    subject: string;
    /** Quantité commande. */
    quantity: number;
    unitLabel: string;
    lineLabel: string;
  };
  delivery: {
    requestedLabel: string;
    locationHint: string;
  };
  projects: Record<DemoScenarioProjectKey, DemoScenarioProject>;
};

/**
 * Vocabulaire issu de setrim.fr (accueil + réalisations) — pas d’invention hors site.
 * Client / adresses / BC = fictifs pour la démo.
 */
export const DEMO_SCENARIO: DemoScenarioConfig = {
  version: "setrim-v2",
  verifiedActivities: [
    "Étanchéité bitume, résine, asphalte",
    "Isolation",
    "Toitures / terrasses accessibles et inaccessibles",
    "Balcons, douches, bassins, piscines",
    "Parking, murs enterrés",
    "Entretien annuel ou ponctuel",
    "Recherche de fuites (fumigène, sondages, mise en eau)",
    "Sécurisation (garde-corps, ligne de vie)",
    "Maçonnerie",
  ],
  verifiedClientTypes: ["architectes", "syndics d'immeubles", "entreprises", "collectivités"],
  orderNumber: DEMO_SCENARIO_ORDER_NUMBER,
  osNumber: "4587",
  supplierName: "ProMat IDF",
  client: {
    name: "Copropriete Horizon",
    shortLabel: "Horizon",
  },
  materials: {
    subject: "40 rouleaux membrane bitume autoprotégée",
    quantity: 40,
    unitLabel: "rouleaux",
    lineLabel: "Membrane bitume autoprotégée — rouleau",
  },
  delivery: {
    requestedLabel: "mardi 7h30",
    locationHint: "aire livraison côté rue",
  },
  projects: {
    primary: {
      key: "primary",
      title: "Residence Horizon",
      matchToken: "Horizon",
      legacyMatchTokens: ["Les Lilas", "Victor Hugo"],
      description:
        "Réfection étanchéité terrasse inaccessible (bitume) et points singuliers — données fictives de démonstration.",
      workObject: "Réfection étanchéité terrasse inaccessible",
      siteAddress: "18 rue du Chantier",
      siteCity: "Aubervilliers",
      role: "Scénario principal — commande fournisseur / livraison",
    },
    waiting: {
      key: "waiting",
      title: "Parking Centre-ville",
      matchToken: "Centre-ville",
      legacyMatchTokens: ["République"],
      description: "Étanchéité parking sous enrobé — accès / validation en attente — données fictives.",
      workObject: "Étanchéité parking",
      siteAddress: "8 place du Centre",
      siteCity: "Pantin",
      role: "En attente — tâche / validation bloquée",
    },
    study: {
      key: "study",
      title: "Balcons Rivage — Résine",
      matchToken: "Rivage",
      legacyMatchTokens: ["Alpha"],
      description: "Étude résine sur balcons — phase étude calme — données fictives.",
      workObject: "Résine étanchéité balcons",
      siteAddress: "22 avenue de la République",
      siteCity: "Saint-Denis",
      role: "Étude — peu d’alertes",
    },
    calm: {
      key: "calm",
      title: "Les Jardins — Entretien",
      matchToken: "Jardins",
      legacyMatchTokens: ["Les Jardins"],
      description: "Entretien annuel étanchéité / relevés — chantier sans alerte — données fictives.",
      workObject: "Entretien annuel étanchéité",
      siteAddress: "5 allée des Jardins",
      siteCity: "Bobigny",
      role: "Aucun problème — contraste Pilotage",
    },
  },
};

export function demoScenarioProject(key: DemoScenarioProjectKey): DemoScenarioProject {
  return DEMO_SCENARIO.projects[key];
}

/** true si le titre projet correspond au chantier scénario (y compris legacy). */
export function matchesDemoProjectTitle(
  title: string | null | undefined,
  key: DemoScenarioProjectKey,
): boolean {
  if (!title) return false;
  const p = DEMO_SCENARIO.projects[key];
  if (title.includes(p.matchToken)) return true;
  return p.legacyMatchTokens.some((t) => title.includes(t));
}

/** Filtre Prisma `title` pour un chantier scénario. */
export function demoProjectTitleWhere(key: DemoScenarioProjectKey): {
  OR: { title: { contains: string } }[];
} {
  const p = DEMO_SCENARIO.projects[key];
  const tokens = [p.matchToken, ...p.legacyMatchTokens];
  return { OR: tokens.map((t) => ({ title: { contains: t } })) };
}

export function demoPrimaryProjectTitleContains(): string {
  return DEMO_SCENARIO.projects.primary.matchToken;
}

export function isDemoPrimaryOrderTitle(title: string): boolean {
  const n = DEMO_SCENARIO.orderNumber;
  const supplier = DEMO_SCENARIO.supplierName.toUpperCase();
  return (
    title.includes(n) ||
    (title.toUpperCase().includes(supplier) &&
      (matchesDemoProjectTitle(title, "primary") || title.includes("POINT.P")))
  );
}

export function demoOrderSubjectLine(): string {
  return `${DEMO_SCENARIO.orderNumber} — ${DEMO_SCENARIO.materials.subject}`;
}

export function demoPrimarySheetTitle(): string {
  return `${DEMO_SCENARIO.projects.primary.title} — OS-${DEMO_SCENARIO.osNumber}`;
}
