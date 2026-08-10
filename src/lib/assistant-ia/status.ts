/**
 * ASSISTANT-IA-V1 — statut provider (sans SDK, sans clé).
 * L’exécution LLM n’est pas branchée tant que configured === false.
 */

import { isFeatureEnabled } from "@/lib/feature-flags";

export type AIProviderStatus = {
  /** Feature flag catalogue / future exécution. */
  featuresFlagEnabled: boolean;
  /** Un provider LLM est configuré (clés, endpoint). Toujours false en V1. */
  configured: boolean;
  /** Libellé UI discret. */
  statusLabel: string;
  providerName: string | null;
};

/**
 * Aucune lecture de variables de clés fournisseurs ici volontairement :
 * la V1 ne doit ni exiger ni détecter de clé pour fonctionner.
 */
export function getAIProviderStatus(): AIProviderStatus {
  const featuresFlagEnabled = isFeatureEnabled("aiFeaturesEnabled");
  const configured = false;
  return {
    featuresFlagEnabled,
    configured,
    statusLabel: configured
      ? "IA active"
      : "Fonctions IA prêtes à être activées",
    providerName: null,
  };
}

/** Exécution réelle d’un outil : réservé V2+ quand configured. */
export function canExecuteAssistantIaTools(): boolean {
  const s = getAIProviderStatus();
  return s.featuresFlagEnabled && s.configured;
}
