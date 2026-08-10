/**
 * ASSISTANT-IA-V1A — statut provider (sans SDK, sans clé).
 */

import { isFeatureEnabled } from "@/lib/feature-flags";

export type AIProviderStatus = {
  featuresFlagEnabled: boolean;
  /** Toujours false en V1A — aucun provider branché. */
  configured: boolean;
  statusLabel: string;
  providerName: string | null;
};

/**
 * Aucune lecture de variables de clés fournisseurs :
 * la V1A ne doit ni exiger ni détecter de clé.
 */
export function getAIProviderStatus(): AIProviderStatus {
  const featuresFlagEnabled = isFeatureEnabled("aiFeaturesEnabled");
  const configured = false;
  return {
    featuresFlagEnabled,
    configured,
    statusLabel: configured
      ? "IA active"
      : "Disponible sur activation",
    providerName: null,
  };
}

export function canExecuteAssistantIaTools(): boolean {
  const s = getAIProviderStatus();
  return s.featuresFlagEnabled && s.configured;
}
