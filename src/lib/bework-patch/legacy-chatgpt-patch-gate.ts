/**
 * Phase A — neutralisation des écritures ChatGPT legacy (quote/prep patch ciblés).
 *
 * FALSE par défaut : les routes …/chatgpt-patch/commit|undo refusent toute écriture.
 * Ne concerne PAS : bundle devis, VisitChiffrage, SiteDoc chatgpt, pipeline universel.
 *
 * Réactivation exceptionnelle (tests locaux uniquement) :
 * LEGACY_CHATGPT_PATCH_WRITES_ENABLED=true
 */

export const LEGACY_CHATGPT_PATCH_DISABLED_CODE =
  "LEGACY_CHATGPT_PATCH_DISABLED" as const;

/**
 * Écritures legacy chatgpt-patch (commit + undo quote/prep).
 * Désactivées en production normale.
 */
export function isLegacyChatgptPatchWritesEnabled(): boolean {
  return process.env.LEGACY_CHATGPT_PATCH_WRITES_ENABLED === "true";
}

export function legacyChatgptPatchDisabledBody(kind: "quote" | "prep") {
  const section = kind === "quote" ? "QUOTE" : "TAKEOFF";
  return {
    error:
      "Ancien pipeline ChatGPT désactivé. Utilisez le correcteur BeWork (bework_patch_v1 → commitUniversalPatch).",
    code: LEGACY_CHATGPT_PATCH_DISABLED_CODE,
    section,
    writePerformed: false as const,
  };
}
