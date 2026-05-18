import type { CctpGenerationMode } from "@/lib/skills/cctp-generation-modes";

export type SkillCctpQuickPrompt = {
  text: string;
  mode: CctpGenerationMode;
};

/** Raccourcis — texte + mode pré-sélectionné pour un parcours efficace. */
export const SKILL_CCTP_QUICK_PROMPTS: readonly SkillCctpQuickPrompt[] = [
  { text: "Établir un plan de travail en 6 étapes pour mon CCTP (lot gros œuvre)", mode: "methode" },
  { text: "Checklist des documents à rassembler avant de rédiger le CCTP", mode: "checklist_documents" },
  { text: "Créer un sommaire de CCTP complet pour une maison individuelle", mode: "sommaire" },
  { text: "Rédiger une fiche ouvrage : mur blocs béton creux 20 cm", mode: "fiche_ouvrage" },
  { text: "Rédiger un article CCTP pour un dallage béton (fourniture et pose)", mode: "redaction" },
  { text: "Vérifier la cohérence entre mon CCTP et le DPGF", mode: "coherence_dpgf" },
  { text: "Lister les limites de prestation à préciser pour le lot plomberie", mode: "coordination" },
  { text: "Corriger et enrichir un article de CCTP trop vague", mode: "enrichissement" },
  { text: "Audit des manques et incohérences dans mon CCTP existant", mode: "audit" },
  { text: "Matrice de coordination entre lots (réservations et rebouchages)", mode: "coordination" },
] as const;
