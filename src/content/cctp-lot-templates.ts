import type { CctpGenerationMode } from "@/lib/skills/cctp-generation-modes";

/** Modèles de contexte par lot — accélèrent la saisie et enrichissent le prompt. */
export type CctpLotTemplate = {
  id: string;
  label: string;
  lot: string;
  projectType: string;
  constraints: string;
  suggestedNorms: string[];
  sampleRequest: string;
  generationMode: CctpGenerationMode;
};

export const CCTP_LOT_TEMPLATES: readonly CctpLotTemplate[] = [
  {
    id: "go",
    label: "Gros œuvre",
    lot: "Gros œuvre",
    projectType: "Construction neuve / extension",
    constraints: "Coactivité, reprises en sous-œuvre, contrôles béton",
    suggestedNorms: ["dtu-go", "feu-acoustique"],
    sampleRequest: "Rédiger les prescriptions gros œuvre (fondations, élévation, reprises).",
    generationMode: "redaction",
  },
  {
    id: "platre",
    label: "Plâtrerie — cloisons",
    lot: "Plâtrerie — cloisons doublages",
    projectType: "Rénovation tertiaire",
    constraints: "Site occupé, performances acoustiques, DTU plâtrerie",
    suggestedNorms: ["dtu-second-oeuvre", "feu-acoustique"],
    sampleRequest: "Rédiger un article CCTP cloisons / doublages avec performances acoustiques.",
    generationMode: "redaction",
  },
  {
    id: "electricite",
    label: "Électricité CFO/CFA",
    lot: "Électricité CFO / CFA",
    projectType: "Local commercial",
    constraints: "NF C 15-100, tableaux, essais de réception",
    suggestedNorms: ["dtu-electricite"],
    sampleRequest: "Sommaire CCTP lot électricité pour local commercial.",
    generationMode: "sommaire",
  },
  {
    id: "cvc",
    label: "CVC",
    lot: "Chauffage — ventilation — climatisation",
    projectType: "Logements collectifs",
    constraints: "RE2020, régulation, équilibrage, maintenance",
    suggestedNorms: ["dtu-cvc", "feu-acoustique"],
    sampleRequest: "Article CCTP production et distribution chauffage.",
    generationMode: "redaction",
  },
  {
    id: "etancheite",
    label: "Étanchéité — couverture",
    lot: "Étanchéité — couverture — zinguerie",
    projectType: "Réhabilitation toiture",
    constraints: "Travaux en hauteur, garanties décennale, relevés",
    suggestedNorms: ["dtu-charpente"],
    sampleRequest: "Audit des manques d'un CCTP étanchéité de toiture terrasse.",
    generationMode: "audit",
  },
  {
    id: "vrd",
    label: "VRD",
    lot: "VRD — voirie et réseaux",
    projectType: "Aménagement de lotissement",
    constraints: "Réseaux enterrés, récolement, réception",
    suggestedNorms: ["dtu-vrd"],
    sampleRequest: "Trame CCTP VRD avec coordination réseaux secs / humides.",
    generationMode: "coordination",
  },
] as const;

export function getCctpLotTemplate(id: string): CctpLotTemplate | undefined {
  return CCTP_LOT_TEMPLATES.find((t) => t.id === id);
}
