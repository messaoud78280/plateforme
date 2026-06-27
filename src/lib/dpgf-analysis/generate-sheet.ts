import { chatCompletion } from "@/lib/skills/llm-chat";
import { suggestFamilyCodeFromWorkItem } from "@/lib/bework-devis-family-codes";
import { parseDpgfAnalysisContent } from "./content-utils";
import type { DpgfAnalysisSheetContent } from "./types";

export type GenerateDpgfSheetInput = {
  originalDesignation: string;
  lot?: string;
  unit?: string;
  context?: string;
};

const SYSTEM_PROMPT = `Tu es un conducteur de travaux expérimenté qui forme des collaborateurs BeWork à analyser des lignes de DPGF/BPU.

RÈGLES ABSOLUES :
- Analyse PÉDAGOGIQUE uniquement : compréhension, vigilance, documents à consulter, questions à poser.
- INTERDIT : prix, montants, estimation, chiffrage, bibliothèque tarifaire, fourchettes de coût.
- Ton professionnel BTP, direct, terrain. Indique « à vérifier » quand une info n'est pas certaine.
- Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans commentaire) conforme au schéma demandé.`;

function buildUserPrompt(input: GenerateDpgfSheetInput): string {
  return `Analyse pédagogique de cette ligne DPGF/BPU :

Désignation : ${input.originalDesignation}
Lot : ${input.lot?.trim() || "non précisé"}
Unité : ${input.unit?.trim() || "non précisée"}
Contexte marché : ${input.context?.trim() || "non précisé"}

Retourne un JSON avec cette structure exacte :
{
  "simplifiedDesignation": "string court",
  "tradeCode": "code corps métier 3 lettres si déductible (CLO, CAR, ELE…)",
  "familyName": "famille ouvrage",
  "ouvrageType": "type ouvrage",
  "comprehensionLevel": "debutant|intermediaire|confirme",
  "content": {
    "translation": { "meaning", "beginnerLanguage", "technicalTerms", "concreteExample" },
    "realWorld": { "whatIsIt", "purpose", "whereOnSite", "whoDoesIt (acteur réel : entreprise, bureau de contrôle, commissaire de justice… — jamais le nom du lot ni le corps d'état)", "whenInProject", "linkedLots (lot DPGF rattaché)" },
    "included": { "supply", "installation", "accessories", "fixings", "preparation", "cuts", "adjustments", "cleaning", "protection", "minorItems" },
    "excluded": { "demolition", "wasteEvacuation", "substrateRepair", "specialTreatment", "finishing", "painting", "studies", "executionPlans", "accessMeans", "difficultHandling", "penetrations", "lotCoordination" },
    "documentsToCheck": { "cctp", "dpgf", "bpu", "architectPlans", "technicalPlans", "sectionDetails", "joineryBook", "manufacturerSheets", "notices", "dtuRules", "sitePhotos" },
    "cctpChecks": ["..."],
    "planChecks": ["..."],
    "modeOperatoire": [{ "order": 1, "title": "...", "description": "...", "whyImportant": "..." }],
    "vigilancePoints": ["..."],
    "questionsBeforeValidation": ["..."],
    "noviceErrors": ["..."],
    "summary": { "meaning", "mustVerify", "mainRisk", "priorityDocument", "keyQuestion" }
  }
}`;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON introuvable dans la réponse IA.");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function generateDpgfAnalysisFromLine(input: GenerateDpgfSheetInput): Promise<{
  simplifiedDesignation: string;
  tradeCode: string | null;
  familyName: string | null;
  ouvrageType: string | null;
  comprehensionLevel: "debutant" | "intermediaire" | "confirme";
  content: DpgfAnalysisSheetContent;
}> {
  const raw = await chatCompletion([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(input) },
  ]);

  const parsed = extractJson(raw) as {
    simplifiedDesignation?: string;
    tradeCode?: string;
    familyName?: string;
    ouvrageType?: string;
    comprehensionLevel?: string;
    content?: unknown;
  };

  const content = parseDpgfAnalysisContent(parsed.content);
  const tradeCode =
    parsed.tradeCode?.trim().toUpperCase() ||
    suggestFamilyCodeFromWorkItem({
      lot: input.lot ?? "",
      family: parsed.familyName,
      title: input.originalDesignation,
    }) ||
    null;

  const levelRaw = parsed.comprehensionLevel?.trim();
  const comprehensionLevel =
    levelRaw === "debutant" || levelRaw === "confirme" ? levelRaw : "intermediaire";

  return {
    simplifiedDesignation:
      parsed.simplifiedDesignation?.trim() ||
      input.originalDesignation.slice(0, 120),
    tradeCode,
    familyName: parsed.familyName?.trim() || null,
    ouvrageType: parsed.ouvrageType?.trim() || null,
    comprehensionLevel,
    content,
  };
}

export function isDpgfAnalysisAiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
