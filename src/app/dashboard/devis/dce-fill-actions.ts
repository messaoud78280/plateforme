"use server";

import { revalidatePath } from "next/cache";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import {
  extractDceLinesWithAi,
  matchDceLinesToCatalog,
  type DceExtractedLine,
  type DceLineMatch,
} from "@/lib/dce-pricing-fill/extract-dce-lines";
import { extractTextFromBuffer } from "@/lib/skills/extract-upload-text";
import { prisma } from "@/lib/prisma";
import { resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";
import { WORK_ITEM_VISIBLE_IN_LIST } from "@/lib/work-item-merge";

const REVALIDATE = ["/dashboard/devis/dce-remplissage"];

function revalidateDce() {
  for (const p of REVALIDATE) revalidatePath(p);
}

export type DceFillSessionRow = {
  id: string;
  title: string;
  targetDocType: string;
  status: string;
  dceFileName: string | null;
  lineCount: number;
  matchedCount: number;
  createdAt: Date;
};

export async function listDceFillSessions(limit = 20): Promise<DceFillSessionRow[]> {
  await requireBeWorkDevisSession();
  const catalogId = await resolveActiveWorkItemCatalogId();
  const rows = await prisma.dcePricingFillSession.findMany({
    where: { catalogId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r) => {
    const lines = Array.isArray(r.lines) ? (r.lines as DceExtractedLine[]) : [];
    const matchReport = Array.isArray(r.matchReport) ? (r.matchReport as DceLineMatch[]) : [];
    return {
      id: r.id,
      title: r.title,
      targetDocType: r.targetDocType,
      status: r.status,
      dceFileName: r.dceFileName,
      lineCount: lines.length,
      matchedCount: matchReport.filter((m) => m.workItemId).length,
      createdAt: r.createdAt,
    };
  });
}

export async function createDceFillSessionFromUpload(formData: FormData): Promise<
  | { ok: true; sessionId: string; lineCount: number; matchedCount: number }
  | { ok: false; error: string }
> {
  await requireBeWorkDevisSession();
  const catalogId = await resolveActiveWorkItemCatalogId();
  const file = formData.get("dceFile");
  const title = String(formData.get("title") ?? "").trim() || "Extraction DCE";
  const targetRaw = String(formData.get("targetDocType") ?? "dpgf").trim();
  const targetDocType = targetRaw === "bpu" ? "bpu" : "dpgf";

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Fichier DCE manquant." };
  }
  if (file.size > 15 * 1024 * 1024) {
    return { ok: false, error: "Fichier trop volumineux (max 15 Mo)." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, warning } = await extractTextFromBuffer(buffer, file.name, file.type || "application/octet-stream");
    if (!text?.trim()) {
      return { ok: false, error: warning ?? "Impossible d'extraire le texte du document." };
    }

    const sessionId = `dce-${Date.now().toString(36)}`;
    await prisma.dcePricingFillSession.create({
      data: {
        id: sessionId,
        catalogId,
        title,
        targetDocType,
        dceFileName: file.name,
        extractedText: text,
        status: "extracting",
      },
    });

    const lines = await extractDceLinesWithAi(text, targetDocType);
    const catalogItems = await prisma.workItem.findMany({
      where: { catalogId, ...WORK_ITEM_VISIBLE_IN_LIST },
      select: {
        id: true,
        code: true,
        codeBework: true,
        title: true,
        normalizedDesignation: true,
      },
      take: 8000,
    });

    const matchReport = matchDceLinesToCatalog(lines, catalogItems);

    await prisma.dcePricingFillSession.update({
      where: { id: sessionId },
      data: {
        lines: lines as object,
        matchReport: matchReport as object,
        status: "ready",
        errorMessage: warning ?? null,
      },
    });

    revalidateDce();
    return {
      ok: true,
      sessionId,
      lineCount: lines.length,
      matchedCount: matchReport.filter((m) => m.workItemId).length,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur extraction DCE.";
    if (/catalogId|WorkItemCatalog|DcePricingFillSession/.test(msg)) {
      return {
        ok: false,
        error: "Migration requise : exécutez prisma/migrations/add-work-item-catalogs.sql sur Supabase.",
      };
    }
    return { ok: false, error: msg };
  }
}

export async function getDceFillSessionDetail(sessionId: string) {
  await requireBeWorkDevisSession();
  const row = await prisma.dcePricingFillSession.findUnique({
    where: { id: sessionId },
    include: { catalog: { select: { name: true, slug: true } } },
  });
  if (!row) return null;

  const lines = Array.isArray(row.lines) ? (row.lines as DceExtractedLine[]) : [];
  const matchReport = Array.isArray(row.matchReport) ? (row.matchReport as DceLineMatch[]) : [];

  return {
    ...row,
    lines,
    matchReport,
  };
}
