/**
 * Statut d'une ligne de métré (source unique UI + éligibilité dossier).
 */
import { quantitiesDiffer, type EngineNode } from "@/lib/preparation/engine/compute";

export type PrepLineStatus = "error" | "indicator" | "validated" | "revalidate" | "theoretical";

export function prepLineStatus(
  line: { role: string; validatedQuantity: number | null },
  node: EngineNode | undefined,
): PrepLineStatus {
  if (node?.error) return "error";
  if (line.role === "indicator") return "indicator";
  if (line.validatedQuantity !== null) {
    return node?.value !== null &&
      node?.value !== undefined &&
      quantitiesDiffer(node.value, line.validatedQuantity)
      ? "revalidate"
      : "validated";
  }
  return "theoretical";
}
