import type { DpgfAnalysisComprehensionLevel, DpgfAnalysisSheetSource } from "@prisma/client";
import { WORK_ITEM_STATUS_LABELS } from "@/lib/be-work-devis-labels";

export const DPGF_ANALYSIS_SOURCE_LABELS: Record<DpgfAnalysisSheetSource, string> = {
  dpgf: "DPGF",
  bpu: "BPU",
  cctp: "CCTP",
  manuel: "Manuel",
  import: "Import JSON",
};

export const DPGF_ANALYSIS_LEVEL_LABELS: Record<DpgfAnalysisComprehensionLevel, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

export { WORK_ITEM_STATUS_LABELS as DPGF_ANALYSIS_STATUS_LABELS };

export function isDpgfAnalysisSource(v: string): v is DpgfAnalysisSheetSource {
  return ["dpgf", "bpu", "cctp", "manuel", "import"].includes(v);
}

export function isDpgfAnalysisLevel(v: string): v is DpgfAnalysisComprehensionLevel {
  return ["debutant", "intermediaire", "confirme"].includes(v);
}
