import type { TaskStatus } from "@/types";

export const BC_STEPS = [
  { key: "demande", label: "Demande" },
  { key: "a_valider", label: "À valider" },
  { key: "valide", label: "Validé" },
  { key: "commande", label: "Commandé" },
  { key: "livraison", label: "Livraison" },
  { key: "livre", label: "Livré" },
] as const;

export type BcStepKey = (typeof BC_STEPS)[number]["key"];

export function isBonDeCommandeCategory(category?: string | null): boolean {
  return (category ?? "").toLowerCase().includes("bon de commande");
}

export function mapTaskStatusToBcStep(status: TaskStatus): BcStepKey {
  switch (status) {
    case "NOUVEAU":
    case "EN_ATTENTE":
      return "demande";
    case "A_VALIDER":
      return "a_valider";
    case "ASSIGNEE":
      return "valide";
    case "EN_ANALYSE":
    case "EN_COURS":
      return "commande";
    case "EN_ATTENTE_INFO":
      return "livraison";
    case "COMPLETE":
      return "livre";
    default:
      return "demande";
  }
}

export function nextBcStatus(current: TaskStatus): TaskStatus | null {
  const step = mapTaskStatusToBcStep(current);
  const order: BcStepKey[] = ["demande", "a_valider", "valide", "commande", "livraison", "livre"];
  const idx = order.indexOf(step);
  if (idx < 0 || idx >= order.length - 1) return null;
  const next = order[idx + 1]!;
  const map: Record<BcStepKey, TaskStatus> = {
    demande: "EN_ATTENTE",
    a_valider: "A_VALIDER",
    valide: "ASSIGNEE",
    commande: "EN_COURS",
    livraison: "EN_ATTENTE_INFO",
    livre: "COMPLETE",
  };
  return map[next];
}

export function extractAmountHint(description?: string | null): string | null {
  if (!description) return null;
  const m = description.match(/(\d[\d\s]*[,.]?\d*)\s*€/);
  return m ? `${m[1]!.replace(/\s/g, "\u202f")} € HT` : null;
}

export function parseSuppliersJson(raw: unknown): { name?: string; contact?: string }[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter((x) => x && typeof x === "object") as { name?: string; contact?: string }[];
}
