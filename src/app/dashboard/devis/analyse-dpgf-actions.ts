"use server";

import { revalidatePath } from "next/cache";
import type {
  DpgfAnalysisComprehensionLevel,
  DpgfAnalysisSheetSource,
  WorkItemStatus,
} from "@prisma/client";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { isWorkItemStatus } from "@/lib/be-work-devis-labels";
import { suggestFamilyCodeFromWorkItem } from "@/lib/bework-devis-family-codes";
import {
  computeContentFlags,
  emptyDpgfAnalysisContent,
  generateNextDpgfSheetCode,
  parseDpgfAnalysisContent,
  parseLinesField,
} from "@/lib/dpgf-analysis/content-utils";
import { generateDpgfAnalysisFromLine, isDpgfAnalysisAiAvailable } from "@/lib/dpgf-analysis/generate-sheet";
import { isDpgfAnalysisLevel, isDpgfAnalysisSource } from "@/lib/dpgf-analysis/labels";
import type { DpgfAnalysisSheetContent, DpgfAnalysisSheetLinks } from "@/lib/dpgf-analysis/types";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const REVALIDATE_PATHS = [
  "/dashboard/devis/analyse-dpgf",
  "/dashboard/devis/analyse-dpgf/nouveau",
];

function revalidateDpgf() {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

function revalidateSheet(id: string) {
  revalidateDpgf();
  revalidatePath(`/dashboard/devis/analyse-dpgf/${id}`);
  revalidatePath(`/dashboard/devis/analyse-dpgf/${id}/modifier`);
}

function parseLinks(raw: FormData): DpgfAnalysisSheetLinks {
  return {
    cctpReference: String(raw.get("linkCctp") ?? "").trim() || undefined,
    planReference: String(raw.get("linkPlan") ?? "").trim() || undefined,
    dcePieceNote: String(raw.get("linkDcePiece") ?? "").trim() || undefined,
    lotNote: String(raw.get("linkLotNote") ?? "").trim() || undefined,
    internalNote: String(raw.get("linkInternalNote") ?? "").trim() || undefined,
  };
}

function parseContentFromForm(raw: FormData): DpgfAnalysisSheetContent {
  const base = emptyDpgfAnalysisContent();
  const get = (k: string) => String(raw.get(k) ?? "").trim();

  const content: DpgfAnalysisSheetContent = {
    translation: {
      meaning: get("trMeaning"),
      beginnerLanguage: get("trBeginner"),
      technicalTerms: get("trTerms"),
      concreteExample: get("trExample"),
    },
    realWorld: {
      whatIsIt: get("rwWhat"),
      purpose: get("rwPurpose"),
      whereOnSite: get("rwWhere"),
      whoDoesIt: get("rwWho"),
      whenInProject: get("rwWhen"),
      linkedLots: get("rwLinkedLots"),
    },
    included: {
      supply: get("incSupply"),
      installation: get("incInstall"),
      accessories: get("incAccessories"),
      fixings: get("incFixings"),
      preparation: get("incPrep"),
      cuts: get("incCuts"),
      adjustments: get("incAdjust"),
      cleaning: get("incClean"),
      protection: get("incProtect"),
      minorItems: get("incMinor"),
    },
    excluded: {
      demolition: get("excDemo"),
      wasteEvacuation: get("excWaste"),
      substrateRepair: get("excSubstrate"),
      specialTreatment: get("excTreatment"),
      finishing: get("excFinish"),
      painting: get("excPaint"),
      studies: get("excStudies"),
      executionPlans: get("excPlans"),
      accessMeans: get("excAccess"),
      difficultHandling: get("excHandling"),
      penetrations: get("excPenetrations"),
      lotCoordination: get("excCoord"),
    },
    documentsToCheck: {
      cctp: get("docCctp"),
      dpgf: get("docDpgf"),
      bpu: get("docBpu"),
      architectPlans: get("docArch"),
      technicalPlans: get("docTech"),
      sectionDetails: get("docSections"),
      joineryBook: get("docJoinery"),
      manufacturerSheets: get("docManufacturer"),
      notices: get("docNotices"),
      dtuRules: get("docDtu"),
      sitePhotos: get("docPhotos"),
    },
    cctpChecks: parseLinesField(get("listCctpChecks")),
    planChecks: parseLinesField(get("listPlanChecks")),
    modeOperatoire: base.modeOperatoire.map((step, i) => ({
      order: i + 1,
      title: get(`moTitle${i + 1}`) || step.title,
      description: get(`moDesc${i + 1}`),
      whyImportant: get(`moWhy${i + 1}`),
    })),
    vigilancePoints: parseLinesField(get("listVigilance")),
    questionsBeforeValidation: parseLinesField(get("listQuestions")),
    noviceErrors: parseLinesField(get("listNoviceErrors")),
    summary: {
      meaning: get("sumMeaning"),
      mustVerify: get("sumMustVerify"),
      mainRisk: get("sumMainRisk"),
      priorityDocument: get("sumPriorityDoc"),
      keyQuestion: get("sumKeyQuestion"),
    },
  };

  return content;
}

function parseIdentification(raw: FormData) {
  const lot = String(raw.get("lot") ?? "").trim();
  const originalDesignation = String(raw.get("originalDesignation") ?? "").trim();
  const unit = String(raw.get("unit") ?? "").trim() || "u";
  if (!lot) throw new Error("Le lot est obligatoire.");
  if (!originalDesignation) throw new Error("La désignation DPGF d'origine est obligatoire.");

  const tradeRaw = String(raw.get("tradeCode") ?? "").trim().toUpperCase();
  const tradeCode =
    tradeRaw ||
    suggestFamilyCodeFromWorkItem({ lot, family: String(raw.get("familyName") ?? ""), title: originalDesignation }) ||
    null;

  const sourceRaw = String(raw.get("source") ?? "manuel");
  const source: DpgfAnalysisSheetSource = isDpgfAnalysisSource(sourceRaw) ? sourceRaw : "manuel";

  const statusRaw = String(raw.get("status") ?? "brouillon");
  const status: WorkItemStatus = isWorkItemStatus(statusRaw) ? statusRaw : "brouillon";

  const levelRaw = String(raw.get("comprehensionLevel") ?? "intermediaire");
  const comprehensionLevel: DpgfAnalysisComprehensionLevel = isDpgfAnalysisLevel(levelRaw)
    ? levelRaw
    : "intermediaire";

  return {
    lot,
    originalDesignation,
    unit,
    tradeCode,
    simplifiedDesignation: String(raw.get("simplifiedDesignation") ?? "").trim() || null,
    familyName: String(raw.get("familyName") ?? "").trim() || null,
    ouvrageType: String(raw.get("ouvrageType") ?? "").trim() || null,
    source,
    status,
    comprehensionLevel,
    dceFillSessionId: String(raw.get("dceFillSessionId") ?? "").trim() || null,
    dceLineIndex: raw.get("dceLineIndex") ? Number(raw.get("dceLineIndex")) : null,
    workItemId: String(raw.get("workItemId") ?? "").trim() || null,
    quoteDocumentId: String(raw.get("quoteDocumentId") ?? "").trim() || null,
  };
}

export async function createDpgfAnalysisSheet(formData: FormData): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireBeWorkDevisSession();
    const session = await getServerSession(authOptions);
    const idFields = parseIdentification(formData);
    const content = parseContentFromForm(formData);
    const flags = computeContentFlags(content);
    const codeSheet = await generateNextDpgfSheetCode();

    const row = await prisma.dpgfAnalysisSheet.create({
      data: {
        codeSheet,
        ...idFields,
        content,
        links: parseLinks(formData),
        ...flags,
        createdByUserId: session?.user?.id ?? null,
      },
    });

    revalidateSheet(row.id);
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur création fiche." };
  }
}

export async function updateDpgfAnalysisSheet(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireBeWorkDevisSession();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("Identifiant fiche manquant.");

    const idFields = parseIdentification(formData);
    const content = parseContentFromForm(formData);
    const flags = computeContentFlags(content);

    await prisma.dpgfAnalysisSheet.update({
      where: { id },
      data: {
        ...idFields,
        content,
        links: parseLinks(formData),
        ...flags,
      },
    });

    revalidateSheet(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur mise à jour fiche." };
  }
}

export async function duplicateDpgfAnalysisSheet(id: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireBeWorkDevisSession();
    const session = await getServerSession(authOptions);
    const source = await prisma.dpgfAnalysisSheet.findUnique({ where: { id } });
    if (!source) throw new Error("Fiche introuvable.");

    const codeSheet = await generateNextDpgfSheetCode();
    const content = parseDpgfAnalysisContent(source.content);

    const row = await prisma.dpgfAnalysisSheet.create({
      data: {
        codeSheet,
        lot: source.lot,
        tradeCode: source.tradeCode,
        familyName: source.familyName,
        ouvrageType: source.ouvrageType,
        originalDesignation: source.originalDesignation,
        simplifiedDesignation: source.simplifiedDesignation,
        unit: source.unit,
        source: source.source,
        status: "brouillon",
        comprehensionLevel: source.comprehensionLevel,
        content,
        links: source.links ?? undefined,
        dceFillSessionId: source.dceFillSessionId,
        dceLineIndex: source.dceLineIndex,
        workItemId: source.workItemId,
        quoteDocumentId: source.quoteDocumentId,
        ...computeContentFlags(content),
        createdByUserId: session?.user?.id ?? null,
      },
    });

    revalidateSheet(row.id);
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur duplication." };
  }
}

export async function generateDpgfAnalysisSheetWithAi(formData: FormData): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  try {
    await requireBeWorkDevisSession();
    if (!isDpgfAnalysisAiAvailable()) {
      return { ok: false, error: "OPENAI_API_KEY non configurée — génération IA indisponible." };
    }

    const session = await getServerSession(authOptions);
    const originalDesignation = String(formData.get("originalDesignation") ?? "").trim();
    if (!originalDesignation) return { ok: false, error: "Collez une désignation DPGF." };

    const lot = String(formData.get("lot") ?? "").trim() || "Lot à préciser";
    const unit = String(formData.get("unit") ?? "").trim() || "u";
    const context = String(formData.get("context") ?? "").trim();

    const generated = await generateDpgfAnalysisFromLine({ originalDesignation, lot, unit, context });
    const flags = computeContentFlags(generated.content);
    const codeSheet = await generateNextDpgfSheetCode();

    const sourceRaw = String(formData.get("source") ?? "dpgf");
    const source: DpgfAnalysisSheetSource = isDpgfAnalysisSource(sourceRaw) ? sourceRaw : "dpgf";

    const row = await prisma.dpgfAnalysisSheet.create({
      data: {
        codeSheet,
        lot,
        unit,
        originalDesignation,
        simplifiedDesignation: generated.simplifiedDesignation,
        tradeCode: generated.tradeCode,
        familyName: generated.familyName,
        ouvrageType: generated.ouvrageType,
        source,
        status: "a_verifier",
        comprehensionLevel: generated.comprehensionLevel,
        content: generated.content,
        links: parseLinks(formData),
        dceFillSessionId: String(formData.get("dceFillSessionId") ?? "").trim() || null,
        dceLineIndex: formData.get("dceLineIndex") ? Number(formData.get("dceLineIndex")) : null,
        workItemId: String(formData.get("workItemId") ?? "").trim() || null,
        quoteDocumentId: String(formData.get("quoteDocumentId") ?? "").trim() || null,
        ...flags,
        createdByUserId: session?.user?.id ?? null,
      },
    });

    revalidateSheet(row.id);
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur génération IA." };
  }
}

export async function deleteDpgfAnalysisSheet(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireBeWorkDevisSession();
    await prisma.dpgfAnalysisSheet.delete({ where: { id } });
    revalidateDpgf();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur suppression." };
  }
}
