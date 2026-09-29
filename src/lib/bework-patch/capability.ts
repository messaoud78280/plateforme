/**
 * Capacités patch par section — Phase C.
 * AVAILABLE = commit legacy branché
 * PREVIEW_ONLY = parse + preview, pas d’appliquer
 * UNAVAILABLE = disabled + raison
 */
import type { BeworkPatchSection } from "@/lib/bework-patch/types";

export type PatchCapabilityMode = "AVAILABLE" | "PREVIEW_ONLY" | "UNAVAILABLE";

export type SectionPatchCapability = {
  mode: PatchCapabilityMode;
  /** Message visible (PREVIEW_ONLY / UNAVAILABLE). */
  label: string | null;
};

export const SECTION_PATCH_CAPABILITY: Record<
  BeworkPatchSection,
  SectionPatchCapability
> = {
  QUOTE: {
    mode: "AVAILABLE",
    label: null,
  },
  TAKEOFF: {
    mode: "AVAILABLE",
    label: null,
  },
  PLANNING: {
    mode: "PREVIEW_ONLY",
    label: "Modification planning : preview uniquement pour le moment.",
  },
  VISIT: {
    mode: "PREVIEW_ONLY",
    label: "Modification visite : preview uniquement pour le moment.",
  },
  FOLLOW_UP: {
    mode: "PREVIEW_ONLY",
    label: "Modification suivi : preview uniquement pour le moment.",
  },
  REPORT: {
    mode: "PREVIEW_ONLY",
    label: "Modification compte rendu : preview uniquement pour le moment.",
  },
  NOTICE: {
    mode: "PREVIEW_ONLY",
    label: "Modification notice : preview uniquement pour le moment.",
  },
};

export function getSectionCapability(
  section: BeworkPatchSection,
): SectionPatchCapability {
  return SECTION_PATCH_CAPABILITY[section];
}
