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
  | "clientDeliverableValidation";

const DEFAULTS: Record<FeatureFlagKey, boolean> = {
  commandCenterUi: true,
  roleOnboarding: true,
  uiPreferences: true,
  uxTelemetry: false,
  legacyUiFallback: false,
  /** Cycle livré → accepter / réserve / refuser (hub mission) */
  clientDeliverableValidation: true,
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
};

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  const fromEnv = envBool(ENV_KEYS[flag]);
  if (typeof fromEnv === "boolean") return fromEnv;
  return DEFAULTS[flag];
}

export const FEATURE_FLAG_DOCS = [
  "Activation par environnement : variables NEXT_PUBLIC_FF_* sur Railway / Vercel.",
  "Activation par module : un flag par capacité (onboarding, préférences, télémétrie, validation client).",
  "Validation livrable client : NEXT_PUBLIC_FF_CLIENT_DELIVERABLE_VALIDATION (défaut on).",
  "Activation par rôle / org / user : à brancher plus tard sur User.preferences JSON (sans migration destructive).",
  "Retour arrière : NEXT_PUBLIC_FF_LEGACY_UI_FALLBACK=true pendant validation.",
] as const;
