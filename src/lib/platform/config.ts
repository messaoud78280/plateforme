/**
 * PLATFORM-ISOLATION-V1.1 — configuration de plateforme par organisation.
 *
 * Identité stable (priorité) :
 * 1. platformKey explicite
 * 2. loginIdentifier (DemoEnvironment) via registre connu
 * 3. isDemo → generic_demo neutre
 * 4. organisation client non-démo inconnue → NEUTRAL_CLIENT
 * 5. BeWork interne → uniquement si !isDemo et pas d’org client / clé interne
 *
 * INTERDIT comme clé de comportement : companyName / displayName.
 * DEMO_BRAND = template création SETRIM uniquement.
 */

import { DEMO_BRAND } from "@/lib/demo-environment/brand";

/** Clés stables — jamais le libellé affiché (companyName). */
export type PlatformKey =
  | "bework_internal"
  | "setrim"
  | "client_test"
  | "generic_demo"
  | "neutral_client";

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

/** Ids catalogue Assistant IA — SETRIM (marchés privés + chantier). */
export const SETRIM_AI_TOOL_IDS = [
  "analyser-marche-prive",
  "obligations-delais",
  "risques-marche",
  "travaux-supplementaires",
  "synthese-dossier",
  "cr-vers-actions",
  "controler-doe",
  "rediger-courrier",
] as const;

/** Fixture Client Test — DOE / CR (pas d’analyse marché privée). */
export const CLIENT_TEST_AI_TOOL_IDS = [
  "controler-doe",
  "cr-vers-actions",
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
  aiTools: [...SETRIM_AI_TOOL_IDS],
};

export const CLIENT_TEST_FEATURES: PlatformFeatures = {
  assistantIa: true,
  facturation: false,
  purchaseOrders: false,
  suppliers: false,
  pilotage: true,
  commercialTour: false,
  demoViewAs: false,
  aiTools: [...CLIENT_TEST_AI_TOOL_IDS],
};

/** Démo inconnue — CORE neutre, jamais SETRIM. */
export const GENERIC_DEMO_FEATURES: PlatformFeatures = {
  assistantIa: true,
  facturation: true,
  purchaseOrders: true,
  suppliers: true,
  pilotage: true,
  commercialTour: false,
  demoViewAs: true,
  aiTools: BEWORK_AI_ALL,
};

/** Org client réelle / inconnue — jamais BeWork interne ni SETRIM. */
export const NEUTRAL_CLIENT_FEATURES: PlatformFeatures = {
  assistantIa: true,
  facturation: true,
  purchaseOrders: true,
  suppliers: true,
  pilotage: true,
  commercialTour: false,
  demoViewAs: false,
  aiTools: BEWORK_AI_ALL,
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

export const GENERIC_DEMO_CONFIG: PlatformConfig = {
  organizationId: null,
  key: "generic_demo",
  branding: {
    displayName: "Démonstration",
    shortName: "Démo",
    logo: null,
    productSecondaryLabel: "Démonstration BeWork",
    contactRoleLabel: "Direction",
  },
  demoMode: true,
  internalPlatform: false,
  commercialDemo: false,
  features: GENERIC_DEMO_FEATURES,
};

export const NEUTRAL_CLIENT_CONFIG: PlatformConfig = {
  organizationId: null,
  key: "neutral_client",
  branding: {
    displayName: "Organisation",
    shortName: "Org",
    logo: null,
    productSecondaryLabel: "Plateforme BeWork",
    contactRoleLabel: "",
  },
  demoMode: false,
  internalPlatform: false,
  commercialDemo: false,
  features: NEUTRAL_CLIENT_FEATURES,
};

/**
 * Registre loginIdentifier → platformKey.
 * Étendre ici à la création d’une nouvelle démo (ex. client-b → setrim|generic|custom).
 * Pas de migration DB requise pour V1.1.
 */
export const PLATFORM_KEY_BY_LOGIN_IDENTIFIER: Readonly<Record<string, PlatformKey>> = {
  "bework-demo": "setrim",
  setrim: "setrim",
  "client-test": "client_test",
  "client_test": "client_test",
};

export type ResolvePlatformInput = {
  organizationId?: string | null;
  isDemo?: boolean;
  /** Affichage uniquement — JAMAIS clé de comportement. */
  companyName?: string | null;
  logoUrl?: string | null;
  /** DemoEnvironment.loginIdentifier — identité démo stable. */
  loginIdentifier?: string | null;
  /** Si fourni (futur DB / tests), prioritaire. */
  platformKey?: PlatformKey | null;
};

export function resolvePlatformKeyFromLoginIdentifier(
  loginIdentifier?: string | null,
): PlatformKey | null {
  const id = loginIdentifier?.trim().toLowerCase();
  if (!id) return null;
  return PLATFORM_KEY_BY_LOGIN_IDENTIFIER[id] ?? null;
}

function withOrg(base: PlatformConfig, orgId: string | null): PlatformConfig {
  return { ...base, organizationId: orgId };
}

function withDisplay(
  base: PlatformConfig,
  input: ResolvePlatformInput,
  opts?: { setrimLogoFallback?: boolean },
): PlatformConfig {
  const display = input.companyName?.trim() || base.branding.displayName;
  const logo =
    input.logoUrl?.trim() ||
    (opts?.setrimLogoFallback ? DEMO_BRAND.logoPath : base.branding.logo);
  return {
    ...base,
    organizationId: input.organizationId?.trim() || null,
    branding: {
      ...base.branding,
      displayName: display,
      shortName: display,
      logo,
    },
  };
}

function configForKey(key: PlatformKey, input: ResolvePlatformInput): PlatformConfig {
  switch (key) {
    case "bework_internal":
      return withOrg(BEWORK_INTERNAL_CONFIG, input.organizationId?.trim() || null);
    case "setrim":
      return withDisplay(SETRIM_PLATFORM_TEMPLATE, input, { setrimLogoFallback: true });
    case "client_test":
      return withDisplay(CLIENT_TEST_PLATFORM_CONFIG, input);
    case "generic_demo":
      return withDisplay(GENERIC_DEMO_CONFIG, input);
    case "neutral_client":
      return withDisplay(NEUTRAL_CLIENT_CONFIG, input);
  }
}

/**
 * Résout la config plateforme — pur, sans cache mutable, sans singleton.
 */
export function getPlatformConfigForOrganization(
  input: ResolvePlatformInput = {},
): PlatformConfig {
  const orgId = input.organizationId?.trim() || null;

  if (input.platformKey) {
    return configForKey(input.platformKey, input);
  }

  const fromLogin = resolvePlatformKeyFromLoginIdentifier(input.loginIdentifier);
  if (fromLogin) {
    return configForKey(fromLogin, input);
  }

  // Démo sans login connu → neutre (jamais SETRIM via companyName)
  if (input.isDemo) {
    return withDisplay(GENERIC_DEMO_CONFIG, { ...input, organizationId: orgId });
  }

  // Org client non-démo sans clé → neutre (jamais BeWork interne par défaut)
  if (orgId) {
    return withDisplay(NEUTRAL_CLIENT_CONFIG, { ...input, organizationId: orgId });
  }

  // Session staff BeWork (pas démo, pas org client)
  return withOrg(BEWORK_INTERNAL_CONFIG, null);
}

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

/** Staff @bework.internal partagés — autorisés uniquement pour SETRIM legacy. */
export function allowsSharedBeworkInternalStaff(config: PlatformConfig): boolean {
  return config.key === "setrim";
}

/** Libellé hôte neutre — jamais SETRIM en fallback core. */
export function resolveHostCompanyLabel(
  hostCompanyName?: string | null,
  fallback = "Équipe",
): string {
  const t = hostCompanyName?.trim();
  return t || fallback;
}

/**
 * Filtre le catalogue Assistant IA selon PlatformConfig.features.aiTools.
 * CORE reste intact ; les moteurs LLM ne sont pas concernés.
 */
export function filterAiToolIdsForPlatform(
  config: PlatformConfig,
  catalogIds: readonly string[],
): string[] {
  const allowed = config.features.aiTools;
  if (allowed === "all") return [...catalogIds];
  const set = new Set(allowed);
  return catalogIds.filter((id) => set.has(id));
}
