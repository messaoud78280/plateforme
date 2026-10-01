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
    mode: "AVAILABLE",
    label: null,
  },
  VISIT: {
    mode: "AVAILABLE",
    label: null,
  },
  FOLLOW_UP: {
    mode: "AVAILABLE",
    label: null,
  },
  REPORT: {
    mode: "AVAILABLE",
    label: null,
  },
  NOTICE: {
    mode: "AVAILABLE",
    label: null,
  },
};

export function getSectionCapability(
  section: BeworkPatchSection,
): SectionPatchCapability {
  return SECTION_PATCH_CAPABILITY[section];
}
