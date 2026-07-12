/**
 * Feature flags — activation progressive de l’UI Command Center.
 * Sources : env NEXT_PUBLIC_FF_* puis override local (staff) optionnel.
 */

export type FeatureFlagKey =
  | "commandCenterUi"
  | "roleOnboarding"
  | "uiPreferences"
  | "uxTelemetry"
  | "legacyUiFallback"
  | "clientDeliverableValidation"
  | "secureStorageSignedUrls"
  | "gedLinkWithoutCopy"
  | "organizationMultiUser";

const DEFAULTS: Record<FeatureFlagKey, boolean> = {
  commandCenterUi: true,
  roleOnboarding: true,
  uiPreferences: true,
  uxTelemetry: false,
  legacyUiFallback: false,
  clientDeliverableValidation: true,
  /** Téléchargements via URL signée (TTL) ; fallback URL stockée si échec */
  secureStorageSignedUrls: true,
  /** Mission → classeur : référence le même objet Storage (pas de copie binaire) */
  gedLinkWithoutCopy: true,
  /** Organisation multi-users — schéma pas encore déployé */
  organizationMultiUser: false,
};

function envBool(name: string): boolean | undefined {
  const v = process.env[name]?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "on") return true;
  if (v === "0" || v === "false" || v === "off") return false;
  return undefined;
}

const ENV_KEYS: Record<FeatureFlagKey, string> = {
  commandCenterUi: "NEXT_PUBLIC_FF_COMMAND_CENTER_UI",
  roleOnboarding: "NEXT_PUBLIC_FF_ROLE_ONBOARDING",
  uiPreferences: "NEXT_PUBLIC_FF_UI_PREFERENCES",
  uxTelemetry: "NEXT_PUBLIC_FF_UX_TELEMETRY",
  legacyUiFallback: "NEXT_PUBLIC_FF_LEGACY_UI_FALLBACK",
  clientDeliverableValidation: "NEXT_PUBLIC_FF_CLIENT_DELIVERABLE_VALIDATION",
  secureStorageSignedUrls: "NEXT_PUBLIC_FF_SECURE_STORAGE_SIGNED_URLS",
  gedLinkWithoutCopy: "NEXT_PUBLIC_FF_GED_LINK_WITHOUT_COPY",
  organizationMultiUser: "NEXT_PUBLIC_FF_ORGANIZATION_MULTI_USER",
};

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  const fromEnv = envBool(ENV_KEYS[flag]);
  if (typeof fromEnv === "boolean") return fromEnv;
  return DEFAULTS[flag];
}

export const FEATURE_FLAG_DOCS = [
  "Activation par environnement : variables NEXT_PUBLIC_FF_* sur Railway / Vercel.",
  "Validation livrable client : NEXT_PUBLIC_FF_CLIENT_DELIVERABLE_VALIDATION (défaut on).",
  "URLs signées : NEXT_PUBLIC_FF_SECURE_STORAGE_SIGNED_URLS (défaut on).",
  "GED sans copie : NEXT_PUBLIC_FF_GED_LINK_WITHOUT_COPY (défaut on).",
  "Organisation multi-users : NEXT_PUBLIC_FF_ORGANIZATION_MULTI_USER (défaut off — plan dans lib/organization/plan.ts).",
  "Retour arrière : désactiver le flag concerné ou NEXT_PUBLIC_FF_LEGACY_UI_FALLBACK=true.",
] as const;
