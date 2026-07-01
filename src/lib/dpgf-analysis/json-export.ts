import type { DpgfAnalysisSheet } from "@prisma/client";
import { parseDpgfAnalysisContent } from "./content-utils";
import { modeOperatoireDetailleToJson } from "./mode-operatoire-detaille";
import type { DpgfAnalysisSheetContent, DpgfAnalysisSheetLinks } from "./types";

function mapModeOperatoireComprehensionToJson(content: DpgfAnalysisSheetContent): unknown[] {
  return content.modeOperatoire
    .filter((s) => s.title.trim())
    .map((s) => {
      if (!s.description.trim() && !s.whyImportant.trim()) return s.title;
      return {
        etape: s.title,
        explication: s.description,
        ...(s.whyImportant.trim() ? { whyImportant: s.whyImportant } : {}),
      };
    });
}

function splitTechnicalTermsToJson(technicalTerms: string): unknown[] | undefined {
  if (!technicalTerms.trim()) return undefined;
  const lines = technicalTerms.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const colonIdx = line.search(/\s*:\s+/);
    if (colonIdx > 0) {
      return {
        terme: line.slice(0, colonIdx).trim(),
        definition: line.slice(colonIdx).replace(/^\s*:\s*/, "").trim(),
      };
    }
    return line;
  });
}

/** Reconstruit une fiche au format JSON pédagogique import/export. */
export function mapDpgfAnalysisSheetToJsonFiche(sheet: DpgfAnalysisSheet): Record<string, unknown> {
  const content = parseDpgfAnalysisContent(sheet.content);
  const links = (sheet.links ?? {}) as DpgfAnalysisSheetLinks;
  const comprehension: Record<string, unknown> = {
    explication_simple: content.translation.meaning,
    traduction_debutant: content.translation.beginnerLanguage || undefined,
    exemple_concret: content.translation.concreteExample || undefined,
    a_quoi_ca_sert: content.realWorld.purpose || undefined,
    ou_on_le_trouve: content.realWorld.whereOnSite || undefined,
    qui_le_realise: (sheet.intervenantConcerne ?? content.realWorld.whoDoesIt) || undefined,
  };

  const terms = splitTechnicalTermsToJson(content.translation.technicalTerms);
  if (terms) comprehension.mots_techniques_a_expliquer = terms;

  const fiche: Record<string, unknown> = {
    fiche_mere: {
      code: sheet.codeSheet,
      lot: sheet.lot,
      lot_nom: links.lotNote || undefined,
      famille: sheet.familyName ?? sheet.ouvrageType ?? undefined,
      designation_dpgf_origine: sheet.originalDesignation,
      designation_simplifiee: sheet.simplifiedDesignation ?? undefined,
      unite: sheet.unit,
      source: sheet.source,
      statut: sheet.status,
      niveau: sheet.comprehensionLevel,
      corps_metier_code: sheet.tradeCode ?? undefined,
      numero_dpgf: links.numeroDpgf || undefined,
    },
    comprehension,
    analyse_designation: {
      ce_qu_il_faut_reperer: content.realWorld.whatIsIt
        ? content.realWorld.whatIsIt.split(" · ").filter(Boolean)
        : undefined,
    },
    inclusions_possibles: Object.values(content.included).filter(Boolean),
    exclusions_ou_points_a_verifier: Object.values(content.excluded).filter(Boolean),
    documents_a_verifier: Object.values(content.documentsToCheck).filter(Boolean),
    points_cctp: content.cctpChecks.length > 0 ? content.cctpChecks : undefined,
    points_plans: content.planChecks.length > 0 ? content.planChecks : undefined,
    mode_operatoire_comprehension: mapModeOperatoireComprehensionToJson(content),
    points_de_vigilance: content.vigilancePoints.length > 0 ? content.vigilancePoints : undefined,
    questions_a_poser: content.questionsBeforeValidation.length > 0 ? content.questionsBeforeValidation : undefined,
    erreurs_frequentes_novice: content.noviceErrors.length > 0 ? content.noviceErrors : undefined,
    resume_a_retenir: {
      idee_principale: content.summary.meaning || undefined,
      risque_principal: content.summary.mainRisk || undefined,
      document_prioritaire: content.summary.priorityDocument || undefined,
      question_cle: content.summary.keyQuestion || undefined,
    },
  };

  const modeDetaille = modeOperatoireDetailleToJson(content.modeOperatoireDetaille);
  if (modeDetaille) fiche.mode_operatoire_detaille = modeDetaille;

  if (sheet.manualPriceHt != null) {
    fiche.prix_manuel_ht = Number(sheet.manualPriceHt);
  }

  return stripUndefinedDeep(fiche) as Record<string, unknown>;
}

export function exportDpgfAnalysisSheetsJson(sheets: DpgfAnalysisSheet[]): string {
  const fiches = sheets.map(mapDpgfAnalysisSheetToJsonFiche);
  if (fiches.length === 1) return JSON.stringify(fiches[0], null, 2);
  return JSON.stringify({ fiches_analyse_dpgf: fiches }, null, 2);
}

function stripUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep).filter((v) => v !== undefined);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || v === null || v === "") continue;
      const cleaned = stripUndefinedDeep(v);
      if (cleaned === undefined || cleaned === null || cleaned === "") continue;
      if (Array.isArray(cleaned) && cleaned.length === 0) continue;
      if (
        typeof cleaned === "object" &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned as object).length === 0
      ) {
        continue;
      }
      out[k] = cleaned;
    }
    return out;
  }
  return value;
}
