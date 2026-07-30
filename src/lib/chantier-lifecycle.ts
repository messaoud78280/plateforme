/**
 * Cycle de vie chantier — une vérité d’affichage.
 *
 * Trois champs coexistent historiquement :
 * - Project.chantierStatus (source de vérité métier chantier)
 * - Project.status (legacy, miroir approximatif)
 * - WorksitePilotage.status (pilotage admin / risques)
 *
 * Ce module centralise les mappings pour éviter des tableaux de bord
 * contradictoires. Aucune migration DB : on aligne à l’écriture et à l’UI.
 */

import type { ChantierStatus, PilotageStatus, ProjectStatus } from "@prisma/client";
import { CHANTIER_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
import { PILOTAGE_STATUS_LABELS } from "@/lib/pilotage/constants";

/** Miroir legacy Project.status ← chantierStatus (création / sync). */
export function mapChantierToProjectStatus(chantierStatus: ChantierStatus): ProjectStatus {
  switch (chantierStatus) {
    case "ETUDE":
      return "NOUVEAU";
    case "EN_COURS":
      return "EN_COURS";
    case "EN_ATTENTE":
      return "EN_ATTENTE";
    case "RECEPTION":
    case "TERMINE":
      return "TERMINE";
    default:
      return "EN_COURS";
  }
}

/**
 * Quand le statut Pilotage change, aligne le chantier (si mapping clair).
 * SOUS_SURVEILLANCE reste EN_COURS (nuance pilotage, pas une autre phase chantier).
 */
export function mapPilotageToChantierStatus(pilotageStatus: PilotageStatus): ChantierStatus | null {
  switch (pilotageStatus) {
    case "A_PREPARER":
      return "ETUDE";
    case "EN_COURS":
    case "SOUS_SURVEILLANCE":
      return "EN_COURS";
    case "BLOQUE":
      return "EN_ATTENTE";
    case "TERMINE":
    case "ARCHIVE":
      return "TERMINE";
    default:
      return null;
  }
}

export function chantierStatusLabel(status: ChantierStatus | string | null | undefined): string {
  if (!status) return "—";
  return CHANTIER_STATUS_LABELS[status as ChantierStatus] ?? String(status);
}

export function pilotageStatusLabel(status: PilotageStatus | string | null | undefined): string {
  if (!status) return "—";
  return PILOTAGE_STATUS_LABELS[String(status)] ?? String(status);
}

/** Tone Badge UI pour fiche client / listes. */
export function chantierStatusBadgeTone(
  status: ChantierStatus | string | null | undefined,
): "ok" | "info" | "watch" | "neutral" {
  switch (status) {
    case "TERMINE":
      return "ok";
    case "EN_COURS":
    case "RECEPTION":
      return "info";
    case "EN_ATTENTE":
      return "watch";
    default:
      return "neutral";
  }
}

/**
 * Données à écrire sur Project quand on change chantierStatus
 * (garde Project.status synchronisé).
 */
export function projectLifecycleWrite(chantierStatus: ChantierStatus): {
  chantierStatus: ChantierStatus;
  status: ProjectStatus;
} {
  return {
    chantierStatus,
    status: mapChantierToProjectStatus(chantierStatus),
  };
}
