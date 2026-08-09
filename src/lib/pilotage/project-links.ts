/**
 * PILOTAGE-V2A.1 — URLs Project-first pour le suivi contractuel.
 * WorksitePilotage = extension, jamais un deuxième dossier chantier.
 */
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";

/** Cockpit chantier → onglet Suivi contractuel */
export function projectContractuelTabHref(projectId: string): string {
  return `/dashboard/projets/${projectId}#tab-contractuel`;
}

/** Section spécialisée (obligations, blocages, visas, DOE…) rattachée au chantier */
export function projectContractuelSectionHref(
  projectId: string,
  onglet?: string | null,
): string {
  const q = onglet && onglet !== "vue" ? `?onglet=${encodeURIComponent(onglet)}` : "";
  return `/dashboard/projets/${projectId}/suivi-contractuel${q}`;
}

/** @deprecated Prefer projectContractuelSectionHref — legacy WorksitePilotage id URL */
export function legacyPilotageDetailHref(pilotageId: string, onglet?: string | null): string {
  const q = onglet ? `?onglet=${encodeURIComponent(onglet)}` : "";
  return `${PILOTAGE_LIST_PATH}/${pilotageId}${q}`;
}
