import type {
  DpgfAnalysisComprehensionLevel,
  DpgfAnalysisSheetSource,
  WorkItemStatus,
} from "@prisma/client";
import { suggestFamilyCodeFromWorkItem } from "@/lib/bework-devis-family-codes";
import { computeContentFlags } from "./content-utils";
import type { DpgfAnalysisSheetContent, DpgfAnalysisSheetLinks } from "./types";

/** Clés interdites (chiffrage / prix) — refusées à l'import. */
const FORBIDDEN_PRICE_KEYS = new Set([
  "prix",
  "cout",
  "coût",
  "fourniture_pose",
  "pose_seule",
  "fourniture_seule",
  "montant",
  "total",
  "price",
  "cost",
  "unitprice",
  "unit_price",
  "prix_unitaire",
  "prix_ht",
  "prix_ttc",
]);

const REQUIRED_PATHS: { path: string; label: string }[] = [
  { path: "fiche_mere.code", label: "fiche_mere.code" },
  { path: "fiche_mere.lot", label: "fiche_mere.lot" },
  { path: "fiche_mere.famille", label: "fiche_mere.famille" },
  { path: "fiche_mere.designation_dpgf_origine", label: "fiche_mere.designation_dpgf_origine" },
  { path: "fiche_mere.designation_simplifiee", label: "fiche_mere.designation_simplifiee" },
  { path: "fiche_mere.unite", label: "fiche_mere.unite" },
  { path: "comprehension.explication_simple", label: "comprehension.explication_simple" },
  { path: "documents_a_verifier", label: "documents_a_verifier" },
  { path: "points_de_vigilance", label: "points_de_vigilance" },
  { path: "questions_a_poser", label: "questions_a_poser" },
  { path: "erreurs_frequentes_novice", label: "erreurs_frequentes_novice" },
  { path: "resume_a_retenir.idee_principale", label: "resume_a_retenir.idee_principale" },
];

export type DpgfJsonDuplicateMode = "ignore" | "replace" | "new_version";

export type DpgfJsonPreviewRow = {
  index: number;
  code: string;
  simplifiedDesignation: string;
  originalDesignation: string;
  lot: string;
  familyName: string;
  unit: string;
  level: string;
  status: string;
  source: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  duplicateInFile: boolean;
  existsInDb: boolean;
};

export type DpgfJsonPreviewResult = {
  totalFiches: number;
  lots: string[];
  families: string[];
  validCount: number;
  incompleteCount: number;
  duplicateCodesInFile: string[];
  priceFieldsRejected: string[];
  structureErrors: string[];
  detectedFormat: string | null;
  rows: DpgfJsonPreviewRow[];
  canImport: boolean;
};

export type ParsedDpgfJsonSheet = {
  codeSheet: string;
  lot: string;
  tradeCode: string | null;
  familyName: string;
  ouvrageType: string | null;
  originalDesignation: string;
  simplifiedDesignation: string;
  unit: string;
  source: DpgfAnalysisSheetSource;
  status: WorkItemStatus;
  comprehensionLevel: DpgfAnalysisComprehensionLevel;
  content: DpgfAnalysisSheetContent;
  links: DpgfAnalysisSheetLinks;
  flags: ReturnType<typeof computeContentFlags>;
  pedagogicalObjective?: string;
};

function stripCodeFence(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/im.exec(t);
  if (fence) t = fence[1].trim();
  return t;
}

function getAtPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function hasNonEmptyValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function normalizeKey(k: string): string {
  return k
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function collectForbiddenPriceKeys(obj: unknown, prefix = "", out: string[] = []): string[] {
  if (obj == null || typeof obj !== "object") return out;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => collectForbiddenPriceKeys(item, `${prefix}[${i}]`, out));
    return out;
  }
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const nk = normalizeKey(key);
    const path = prefix ? `${prefix}.${key}` : key;
    if (FORBIDDEN_PRICE_KEYS.has(nk)) out.push(path);
    collectForbiddenPriceKeys(val, path, out);
  }
  return out;
}

function validateRequired(fiche: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const { path, label } of REQUIRED_PATHS) {
    const v = getAtPath(fiche, path);
    if (!hasNonEmptyValue(v)) errors.push(`Champ obligatoire manquant : ${label}`);
  }
  return errors;
}

function mapStatus(raw: unknown): WorkItemStatus {
  const s = String(raw ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
  if (s.includes("valid")) return "valide";
  if (s.includes("complet")) return "a_completer";
  if (s.includes("brouillon")) return "brouillon";
  return "a_verifier";
}

function mapLevel(raw: unknown): DpgfAnalysisComprehensionLevel {
  const s = String(raw ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
  if (s.includes("confirm")) return "confirme";
  if (s.includes("inter")) return "intermediaire";
  if (s.includes("debut") || s.includes("début")) return "debutant";
  return "intermediaire";
}

function mapSource(raw: unknown): DpgfAnalysisSheetSource {
  const s = String(raw ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
  if (s === "bpu") return "bpu";
  if (s === "cctp") return "cctp";
  if (s === "dpgf") return "dpgf";
  if (s === "manuel") return "manuel";
  if (s === "json" || s === "import") return "import";
  return "import";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => {
    if (typeof x === "string") return x.trim();
    if (x && typeof x === "object" && "terme" in x) return String((x as { terme: string }).terme).trim();
    return String(x).trim();
  }).filter(Boolean);
}

function formatTechnicalTerms(v: unknown): string {
  if (!Array.isArray(v)) return "";
  return v
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        const t = x as { terme?: string; definition?: string };
        if (t.terme && t.definition) return `${t.terme} : ${t.definition}`;
        if (t.terme) return t.terme;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function mapDocumentsToCheck(docs: string[]): DpgfAnalysisSheetContent["documentsToCheck"] {
  const joined = docs.join("\n");
  const has = (needle: string) => docs.some((d) => d.toLowerCase().includes(needle));
  return {
    cctp: has("cctp") ? "À consulter (import JSON)" : "",
    dpgf: has("dpgf") ? "À consulter (import JSON)" : "",
    bpu: has("bpu") ? "À consulter (import JSON)" : "",
    architectPlans: has("architecte") || has("architect") ? "À consulter (import JSON)" : "",
    technicalPlans: has("technique") ? "À consulter (import JSON)" : "",
    sectionDetails: has("coupe") || has("détail") || has("detail") ? "À consulter (import JSON)" : "",
    joineryBook: has("menuiser") ? "À consulter (import JSON)" : "",
    manufacturerSheets: has("fabricant") || has("fiche technique") ? "À consulter (import JSON)" : "",
    notices: has("notice") ? "À consulter (import JSON)" : "",
    dtuRules: has("dtu") || has("règle") || has("regle") ? "À consulter (import JSON)" : "",
    sitePhotos: has("photo") || has("visite") ? "À consulter (import JSON)" : "",
    ...(joined && !has("cctp") ? { dpgf: joined } : {}),
  };
}

function mapModeOperatoire(v: unknown): DpgfAnalysisSheetContent["modeOperatoire"] {
  if (!Array.isArray(v)) return [];
  return v.map((item, i) => {
    if (typeof item === "string") {
      return { order: i + 1, title: item, description: "", whyImportant: "" };
    }
    const o = item as { etape?: string; explication?: string; title?: string; description?: string; whyImportant?: string };
    return {
      order: i + 1,
      title: o.etape ?? o.title ?? `Étape ${i + 1}`,
      description: o.explication ?? o.description ?? "",
      whyImportant: o.whyImportant ?? "",
    };
  });
}

export function parseDpgfAnalysisJsonRoot(text: string): {
  root: Record<string, unknown>;
  fiches: Record<string, unknown>[];
  detectedFormat: string;
} {
  const cleaned = stripCodeFence(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const startObj = cleaned.indexOf("{");
    const endObj = cleaned.lastIndexOf("}");
    const startArr = cleaned.indexOf("[");
    const endArr = cleaned.lastIndexOf("]");
    if (startObj !== -1 && endObj > startObj) {
      parsed = JSON.parse(cleaned.slice(startObj, endObj + 1));
    } else if (startArr !== -1 && endArr > startArr) {
      parsed = JSON.parse(cleaned.slice(startArr, endArr + 1));
    } else {
      throw new Error("JSON invalide — vérifiez les accolades, crochets et guillemets.");
    }
  }

  // Tableau racine : [ { fiche_mere… }, … ]
  if (Array.isArray(parsed)) {
    const fiches = parsed.filter((f): f is Record<string, unknown> => f != null && typeof f === "object");
    if (fiches.length === 0) throw new Error("Le tableau JSON ne contient aucune fiche valide.");
    const root = (fiches[0]?.fiche_mere && typeof fiches[0].fiche_mere === "object"
      ? {}
      : {}) as Record<string, unknown>;
    return { root, fiches, detectedFormat: "tableau de fiches" };
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON attendu : objet ou tableau de fiches d'analyse DPGF.");
  }

  const root = parsed as Record<string, unknown>;

  // Fiche unique à la racine : { fiche_mere, comprehension, … }
  if (root.fiche_mere && typeof root.fiche_mere === "object") {
    return { root: {}, fiches: [root], detectedFormat: "fiche unique" };
  }

  const arrayKeys = [
    "fiches_analyse_dpgf",
    "fiches_analyse",
    "fiches",
    "fiches_dpgf",
    "analyses",
    "items",
    "data",
  ] as const;

  for (const key of arrayKeys) {
    const raw = root[key];
    if (Array.isArray(raw) && raw.length > 0) {
      const fiches = raw.filter((f): f is Record<string, unknown> => f != null && typeof f === "object");
      if (fiches.length > 0) {
        return { root, fiches, detectedFormat: `objet.${key}` };
      }
    }
  }

  throw new Error(
    "Format JSON non reconnu. Attendu : { \"fiches_analyse_dpgf\": […] }, un tableau […], ou une fiche unique avec \"fiche_mere\".",
  );
}

export function mapJsonFicheToSheet(
  fiche: Record<string, unknown>,
  root: Record<string, unknown>,
): ParsedDpgfJsonSheet {
  const mere = (fiche.fiche_mere ?? {}) as Record<string, unknown>;
  const comprehension = (fiche.comprehension ?? {}) as Record<string, unknown>;
  const analyse = (fiche.analyse_designation ?? {}) as Record<string, unknown>;
  const resume = (fiche.resume_a_retenir ?? {}) as Record<string, unknown>;

  const lot = String(mere.lot ?? root.lot ?? "").trim();
  const familyName = String(mere.famille ?? root.famille ?? "").trim();
  const originalDesignation = String(mere.designation_dpgf_origine ?? "").trim();
  const simplifiedDesignation = String(mere.designation_simplifiee ?? "").trim();
  const codeSheet = String(mere.code ?? "").trim();

  const docs = asStringArray(fiche.documents_a_verifier);
  const inclusions = asStringArray(fiche.inclusions_possibles);
  const exclusions = asStringArray(fiche.exclusions_ou_points_a_verifier);
  const pointsReperer = asStringArray(analyse.ce_qu_il_faut_reperer);
  const pointsEclaircir = asStringArray(analyse.points_a_eclaircir);

  const content: DpgfAnalysisSheetContent = {
    translation: {
      meaning: String(comprehension.explication_simple ?? "").trim(),
      beginnerLanguage: String(comprehension.explication_simple ?? "").trim(),
      technicalTerms: formatTechnicalTerms(comprehension.mots_techniques),
      concreteExample: String(comprehension.exemple_concret ?? "").trim(),
    },
    realWorld: {
      whatIsIt: pointsReperer.join(" · ") || String(comprehension.explication_simple ?? "").trim(),
      purpose: String(comprehension.a_quoi_ca_sert ?? "").trim(),
      whereOnSite: String(comprehension.ou_on_le_trouve ?? "").trim(),
      whoDoesIt: String(mere.corps_metier ?? "").trim(),
      whenInProject: "",
      linkedLots: String(mere.lot_nom ?? root.lot_nom ?? "").trim(),
    },
    included: {
      supply: inclusions.find((x) => /fourniture/i.test(x)) ?? "",
      installation: inclusions.find((x) => /pose/i.test(x)) ?? "",
      accessories: inclusions.find((x) => /accessoire/i.test(x)) ?? "",
      fixings: inclusions.find((x) => /fixation/i.test(x)) ?? "",
      preparation: inclusions.find((x) => /préparation|preparation/i.test(x)) ?? "",
      cuts: inclusions.find((x) => /découpe|decoupe/i.test(x)) ?? "",
      adjustments: inclusions.find((x) => /réglage|reglage/i.test(x)) ?? "",
      cleaning: inclusions.find((x) => /nettoyage/i.test(x)) ?? "",
      protection: inclusions.find((x) => /protection/i.test(x)) ?? "",
      minorItems: inclusions.filter((x) => !/fourniture|pose|accessoire|fixation|préparation|preparation|découpe|decoupe|réglage|reglage|nettoyage|protection/i.test(x)).join("\n"),
    },
    excluded: {
      demolition: exclusions.find((x) => /dépose|depose/i.test(x)) ?? "",
      wasteEvacuation: exclusions.find((x) => /évacuation|evacuation|déchet|dechet/i.test(x)) ?? "",
      substrateRepair: exclusions.find((x) => /support|reprise/i.test(x)) ?? "",
      specialTreatment: exclusions.find((x) => /traitement|contrainte/i.test(x)) ?? "",
      finishing: exclusions.find((x) => /finition/i.test(x)) ?? "",
      painting: exclusions.find((x) => /peinture/i.test(x)) ?? "",
      studies: exclusions.find((x) => /étude|etude|plan d'exécution/i.test(x)) ?? "",
      executionPlans: exclusions.find((x) => /plan/i.test(x)) ?? "",
      accessMeans: exclusions.find((x) => /accès|acces|moyen/i.test(x)) ?? "",
      difficultHandling: exclusions.find((x) => /manutention/i.test(x)) ?? "",
      penetrations: exclusions.find((x) => /réservation|reservation|percement/i.test(x)) ?? "",
      lotCoordination: exclusions.filter((x) => !/dépose|depose|évacuation|evacuation|finition|peinture|accès|acces|réservation|reservation/i.test(x)).join("\n"),
    },
    documentsToCheck: mapDocumentsToCheck(docs),
    cctpChecks: [...asStringArray(fiche.points_cctp), ...pointsEclaircir],
    planChecks: asStringArray(fiche.points_plans),
    modeOperatoire: mapModeOperatoire(fiche.mode_operatoire_comprehension),
    vigilancePoints: asStringArray(fiche.points_de_vigilance),
    questionsBeforeValidation: asStringArray(fiche.questions_a_poser),
    noviceErrors: asStringArray(fiche.erreurs_frequentes_novice),
    summary: {
      meaning: String(resume.idee_principale ?? "").trim(),
      mustVerify: docs.slice(0, 3).join(", ") || "CCTP et plans",
      mainRisk: String(resume.risque_principal ?? "").trim(),
      priorityDocument: String(resume.document_prioritaire ?? "CCTP").trim(),
      keyQuestion: String(resume.question_cle ?? "").trim(),
    },
  };

  const tradeCode =
    suggestFamilyCodeFromWorkItem({
      lot: String(mere.lot_nom ?? root.lot_nom ?? lot),
      family: familyName,
      title: originalDesignation,
    }) ?? null;

  const importDate = new Date().toISOString();
  const links: DpgfAnalysisSheetLinks = {
    lotNote: String(mere.lot_nom ?? root.lot_nom ?? "").trim() || undefined,
    internalNote: `Import JSON ${importDate}${mere.objectif_pedagogique ? ` — ${mere.objectif_pedagogique}` : ""}`,
  };

  return {
    codeSheet,
    lot,
    tradeCode,
    familyName,
    ouvrageType: String(mere.famille ?? "").trim() || null,
    originalDesignation,
    simplifiedDesignation,
    unit: String(mere.unite ?? mere.unit ?? "u").trim(),
    source: mere.source ? mapSource(mere.source) : "import",
    status: mere.statut ? mapStatus(mere.statut) : "a_verifier",
    comprehensionLevel: mere.niveau ? mapLevel(mere.niveau) : "intermediaire",
    content,
    links,
    flags: computeContentFlags(content),
    pedagogicalObjective: String(mere.objectif_pedagogique ?? "").trim() || undefined,
  };
}

export function buildDpgfJsonPreview(
  text: string,
  existingCodes: Set<string>,
): DpgfJsonPreviewResult {
  const structureErrors: string[] = [];
  let root: Record<string, unknown>;
  let fiches: Record<string, unknown>[];
  let detectedFormat: string | null = null;

  try {
    const parsed = parseDpgfAnalysisJsonRoot(text);
    root = parsed.root;
    fiches = parsed.fiches;
    detectedFormat = parsed.detectedFormat;
  } catch (e) {
    return {
      totalFiches: 0,
      lots: [],
      families: [],
      validCount: 0,
      incompleteCount: 0,
      duplicateCodesInFile: [],
      priceFieldsRejected: [],
      structureErrors: [e instanceof Error ? e.message : "Erreur structure JSON"],
      detectedFormat: null,
      rows: [],
      canImport: false,
    };
  }

  const priceFieldsRejected = collectForbiddenPriceKeys(root);
  if (priceFieldsRejected.length > 0) {
    structureErrors.push(
      `Champs prix/chiffrage interdits détectés : ${priceFieldsRejected.slice(0, 5).join(", ")}${priceFieldsRejected.length > 5 ? "…" : ""}`,
    );
  }

  const codeCounts = new Map<string, number>();
  const rows: DpgfJsonPreviewRow[] = fiches.map((fiche, index) => {
    const mere = (fiche.fiche_mere ?? {}) as Record<string, unknown>;
    const code = String(mere.code ?? "").trim() || `(fiche ${index + 1})`;
    codeCounts.set(code, (codeCounts.get(code) ?? 0) + 1);

    const requiredErrors = validateRequired(fiche);
    const fichePriceKeys = collectForbiddenPriceKeys(fiche);
    const errors = [...requiredErrors];
    if (fichePriceKeys.length > 0) {
      errors.push(`Champs prix interdits : ${fichePriceKeys.join(", ")}`);
    }

    const warnings: string[] = [];
    if (!mere.statut) warnings.push("Statut absent → « à vérifier » par défaut");
    if (!mere.source) warnings.push("Source absente → « Import JSON » par défaut");

    return {
      index: index + 1,
      code,
      simplifiedDesignation: String(mere.designation_simplifiee ?? "").trim(),
      originalDesignation: String(mere.designation_dpgf_origine ?? "").trim(),
      lot: String(mere.lot ?? root.lot ?? "").trim(),
      familyName: String(mere.famille ?? root.famille ?? "").trim(),
      unit: String(mere.unite ?? mere.unit ?? "").trim(),
      level: String(mere.niveau ?? "intermédiaire"),
      status: String(mere.statut ?? "à vérifier"),
      source: String(mere.source ?? "JSON"),
      valid: errors.length === 0,
      errors,
      warnings,
      duplicateInFile: false,
      existsInDb: code !== `(fiche ${index + 1})` && existingCodes.has(code),
    };
  });

  const duplicateCodesInFile = [...codeCounts.entries()]
    .filter(([, c]) => c > 1)
    .map(([code]) => code);

  for (const row of rows) {
    if (duplicateCodesInFile.includes(row.code)) row.duplicateInFile = true;
  }

  const validCount = rows.filter((r) => r.valid && !r.duplicateInFile).length;
  const incompleteCount = rows.filter((r) => !r.valid).length;

  const lots = [...new Set(rows.map((r) => r.lot).filter(Boolean))];
  const families = [...new Set(rows.map((r) => r.familyName).filter(Boolean))];

  const canImport =
    structureErrors.length === 0 &&
    priceFieldsRejected.length === 0 &&
    incompleteCount === 0 &&
    duplicateCodesInFile.length === 0 &&
    validCount > 0;

  return {
    totalFiches: fiches.length,
    lots,
    families,
    validCount,
    incompleteCount,
    duplicateCodesInFile,
    priceFieldsRejected,
    structureErrors,
    detectedFormat,
    rows,
    canImport,
  };
}

export async function resolveImportCodeSheet(
  baseCode: string,
  mode: DpgfJsonDuplicateMode,
  existingCodes: Set<string>,
): Promise<{ code: string; action: "create" | "replace" | "skip" }> {
  if (!existingCodes.has(baseCode)) return { code: baseCode, action: "create" };

  if (mode === "ignore") return { code: baseCode, action: "skip" };
  if (mode === "replace") return { code: baseCode, action: "replace" };

  let n = 2;
  while (existingCodes.has(`${baseCode}-v${n}`)) n += 1;
  return { code: `${baseCode}-v${n}`, action: "create" };
}
