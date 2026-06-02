export * from "@/lib/bework-work-item-codification/lexicon";
export * from "@/lib/bework-work-item-codification/normalize";
export * from "@/lib/bework-work-item-codification/classify";
export * from "@/lib/bework-work-item-codification/generate";
export * from "@/lib/bework-work-item-codification/proposals";

export const CODIFICATION_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  auto: "Auto",
  a_verifier: "À vérifier",
  valide: "Validé",
};
