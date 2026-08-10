/**
 * PLATFORM-ISOLATION-V1 — configuration de plateforme par organisation.
 *
 * BeWork = éditeur de plateformes métier BTP.
 * CORE commun + config par org + données isolées.
 *
 * DEMO_BRAND (SETRIM) = template de *création* pour la démo SETRIM,
 * jamais un fallback runtime pour BeWork interne ou un autre client.
 */

import { DEMO_BRAND } from "@/lib/demo-environment/brand";

/** Clés stables — jamais le libellé affiché (companyName). */
export type PlatformKey =
  | "bework_internal"
  | "setrim"
  | "client_test"
  | "generic_demo";

export type PlatformFeatures = {
  assistantIa: boolean;
  facturation: boolean;
  purchaseOrders: boolean;
  suppliers: boolean;
  pilotage: boolean;
  commercialTour: boolean;
  demoViewAs: boolean;
  /** Outils Assistant IA activables (ids catalogue) — filtre futur. */
  aiTools: string[] | "all";
};

export type PlatformBranding = {
  displayName: string;
  shortName: string;
  logo: string | null;
  productSecondaryLabel: string;
  contactRoleLabel: string;
};

export type PlatformConfig = {
  organizationId: string | null;
  key: PlatformKey;
  branding: PlatformBranding;
  demoMode: boolean;
  internalPlatform: boolean;
  commercialDemo: boolean;
  features: PlatformFeatures;
};

const BEWORK_AI_ALL = "all" as const;

const SETRIM_AI_TOOLS = [
  "analyser-marche-prive",
  "obligations-delais",
  "risques-marche",
  "travaux-supplementaires",
  "synthese-dossier",
  "cr-vers-actions",
  "controler-doe",
  "rediger-courrier",
] as const;

export const BEWORK_INTERNAL_FEATURES: PlatformFeatures = {
  assistantIa: true,
  facturation: true,
  purchaseOrders: true,
  suppliers: true,
  pilotage: true,
  commercialTour: false,
  demoViewAs: false,
  aiTools: BEWORK_AI_ALL,
};

export const SETRIM_DEMO_FEATURES: PlatformFeatures = {
  assistantIa: true,
  facturation: true,
  purchaseOrders: true,
  suppliers: true,
  pilotage: true,
  commercialTour: true,
  demoViewAs: true,
  aiTools: [...SETRIM_AI_TOOLS],
};

/** Fixture minimale — prouve multi-config sans polluer l’UI. */
export const CLIENT_TEST_FEATURES: PlatformFeatures = {
  assistantIa: true,
  facturation: false,
  purchaseOrders: false,
  suppliers: false,
  pilotage: true,
  commercialTour: false,
  demoViewAs: false,
  aiTools: ["controler-doe", "cr-vers-actions"],
};

export const BEWORK_INTERNAL_CONFIG: PlatformConfig = {
  organizationId: null,
  key: "bework_internal",
  branding: {
    displayName: "BeWork",
    shortName: "BeWork",
    logo: null,
    productSecondaryLabel: "BeWork",
    contactRoleLabel: "",
  },
  demoMode: false,
  internalPlatform: true,
  commercialDemo: false,
  features: BEWORK_INTERNAL_FEATURES,
};

/** Template SETRIM — création / reset démo commerciale uniquement. */
export const SETRIM_PLATFORM_TEMPLATE: PlatformConfig = {
  organizationId: null,
  key: "setrim",
  branding: {
    displayName: DEMO_BRAND.companyDisplayName,
    shortName: DEMO_BRAND.companyName,
    logo: DEMO_BRAND.logoPath,
    productSecondaryLabel: DEMO_BRAND.productSecondaryLabel,
    contactRoleLabel: DEMO_BRAND.contactRoleLabel,
  },
  demoMode: true,
  internalPlatform: false,
  commercialDemo: true,
  features: SETRIM_DEMO_FEATURES,
};

export const CLIENT_TEST_PLATFORM_CONFIG: PlatformConfig = {
  organizationId: null,
  key: "client_test",
  branding: {
    displayName: "Client Test",
    shortName: "ClientTest",
    logo: null,
    productSecondaryLabel: "Démonstration BeWork",
    contactRoleLabel: "Direction",
  },
  demoMode: true,
  internalPlatform: false,
  commercialDemo: false,
  features: CLIENT_TEST_FEATURES,
};

export type ResolvePlatformInput = {
  organizationId?: string | null;
  isDemo?: boolean;
  /** Nom stocké sur DemoEnvironment / session — pas une clé de comportement. */
  companyName?: string | null;
  logoUrl?: string | null;
  /** Si fourni explicitement (futur DB), prioritaire. */
  platformKey?: PlatformKey | null;
};

function isSetrimCompanyName(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  const n = name.trim();
  if (n === DEMO_BRAND.companyName || n === DEMO_BRAND.companyDisplayName) return true;
  return DEMO_BRAND.legacyCompanyNames.some((legacy) => legacy === n);
}

/**
 * Résout la config plateforme.
 * Priorité : platformKey explicite → démo SETRIM (nom) → démo générique → BeWork interne.
 */
export function getPlatformConfigForOrganization(
  input: ResolvePlatformInput = {},
): PlatformConfig {
  const orgId = input.organizationId?.trim() || null;

  if (
    input.platformKey === "bework_internal" ||
    (!input.isDemo && !input.platformKey)
  ) {
    return { ...BEWORK_INTERNAL_CONFIG, organizationId: orgId };
  }

  if (input.platformKey === "client_test") {
    return {
      ...CLIENT_TEST_PLATFORM_CONFIG,
      organizationId: orgId,
      branding: {
        ...CLIENT_TEST_PLATFORM_CONFIG.branding,
        displayName: input.companyName?.trim() || CLIENT_TEST_PLATFORM_CONFIG.branding.displayName,
        logo: input.logoUrl?.trim() || null,
      },
    };
  }

  if (input.platformKey === "setrim" || (input.isDemo && isSetrimCompanyName(input.companyName))) {
    const display =
      input.companyName?.trim() && !DEMO_BRAND.legacyCompanyNames.includes(input.companyName.trim())
        ? input.companyName.trim()
        : DEMO_BRAND.companyDisplayName;
    return {
      ...SETRIM_PLATFORM_TEMPLATE,
      organizationId: orgId,
      branding: {
        ...SETRIM_PLATFORM_TEMPLATE.branding,
        displayName: display,
        shortName: display,
        logo: input.logoUrl?.trim() || DEMO_BRAND.logoPath,
      },
    };
  }

  if (input.isDemo || input.platformKey === "generic_demo") {
    const display = input.companyName?.trim() || "Démonstration";
    return {
      organizationId: orgId,
      key: "generic_demo",
      branding: {
        displayName: display,
        shortName: display,
        logo: input.logoUrl?.trim() || null,
        productSecondaryLabel: "Démonstration BeWork",
        contactRoleLabel: "Direction",
      },
      demoMode: true,
      internalPlatform: false,
      commercialDemo: false,
      features: {
        ...SETRIM_DEMO_FEATURES,
        commercialTour: false,
      },
    };
  }

  return { ...BEWORK_INTERNAL_CONFIG, organizationId: orgId };
}

/** Alias lisible pour le runtime session / layout. */
export function getCurrentPlatformConfig(
  input: ResolvePlatformInput,
): PlatformConfig {
  return getPlatformConfigForOrganization(input);
}

export function isInternalBeworkPlatform(
  config: PlatformConfig | ResolvePlatformInput,
): boolean {
  const cfg =
    "key" in config && "features" in config
      ? (config as PlatformConfig)
      : getPlatformConfigForOrganization(config);
  return cfg.internalPlatform && cfg.key === "bework_internal";
}

export function isCommercialDemoPlatform(
  config: PlatformConfig | ResolvePlatformInput,
): boolean {
  const cfg =
    "key" in config && "features" in config
      ? (config as PlatformConfig)
      : getPlatformConfigForOrganization(config);
  return cfg.commercialDemo;
}

export function isSetrimPlatform(
  config: PlatformConfig | ResolvePlatformInput,
): boolean {
  const cfg =
    "key" in config && "features" in config
      ? (config as PlatformConfig)
      : getPlatformConfigForOrganization(config);
  return cfg.key === "setrim";
}

/** Libellé hôte neutre — jamais SETRIM en fallback core. */
export function resolveHostCompanyLabel(
  hostCompanyName?: string | null,
  fallback = "Équipe",
): string {
  const t = hostCompanyName?.trim();
  return t || fallback;
}
