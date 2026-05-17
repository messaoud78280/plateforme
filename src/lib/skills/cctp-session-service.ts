import type { CctpDetailLevel, CctpProjectContext, CctpSessionDetail, CctpSessionSummary } from "@/lib/skills/cctp-redaction-types";
import type { CctpGenerationMode, CctpMarketProfile } from "@/lib/skills/cctp-generation-modes";
import { prisma } from "@/lib/prisma";

type SessionMeta = {
  refines?: { instruction: string; at: string }[];
};

export type PersistCctpSessionInput = {
  userId: string;
  request: string;
  context: CctpProjectContext;
  normReferences: string[];
  extractedContext: string | null;
  resultMarkdown: string;
  usedLlm: boolean;
  notice?: string;
  generationMode?: CctpGenerationMode;
  marketProfile?: CctpMarketProfile | null;
  files: {
    kind: string;
    fileName: string;
    mimeType: string | null;
    fileSize: number;
    extractedText: string | null;
    storagePath?: string | null;
    storageUrl?: string | null;
  }[];
};

function parseNormRefs(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  return [];
}

function parseMeta(raw: unknown): SessionMeta {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as SessionMeta;
  }
  return {};
}

export async function persistCctpSession(data: PersistCctpSessionInput): Promise<string> {
  const session = await prisma.skillCctpSession.create({
    data: {
      userId: data.userId,
      requestText: data.request,
      projectType: data.context.projectType || null,
      lot: data.context.lot || null,
      location: data.context.location || null,
      constraints: data.context.constraints || null,
      detailLevel: data.context.detailLevel,
      availableDocuments: data.context.availableDocuments || null,
      normReferences: data.normReferences.length ? data.normReferences : undefined,
      extractedContext: data.extractedContext,
      resultMarkdown: data.resultMarkdown,
      usedLlm: data.usedLlm,
      notice: data.notice ?? null,
      generationMode: data.generationMode ?? "redaction",
      marketProfile: data.marketProfile ?? null,
      meta: { refines: [] },
      files: {
        create: data.files.map((f) => ({
          kind: f.kind,
          fileName: f.fileName,
          mimeType: f.mimeType,
          fileSize: f.fileSize,
          extractedText: f.extractedText,
          storagePath: f.storagePath ?? null,
          storageUrl: f.storageUrl ?? null,
        })),
      },
    },
    select: { id: true },
  });
  return session.id;
}

export async function updateCctpSessionAfterRefine(
  userId: string,
  sessionId: string,
  data: {
    resultMarkdown: string;
    refineInstruction: string;
    usedLlm: boolean;
    notice?: string;
  },
): Promise<boolean> {
  const existing = await prisma.skillCctpSession.findFirst({
    where: { id: sessionId, userId },
    select: { meta: true },
  });
  if (!existing) return false;

  const meta = parseMeta(existing.meta);
  const refines = meta.refines ?? [];
  refines.push({ instruction: data.refineInstruction, at: new Date().toISOString() });

  await prisma.skillCctpSession.update({
    where: { id: sessionId },
    data: {
      resultMarkdown: data.resultMarkdown,
      usedLlm: data.usedLlm,
      notice: data.notice ?? null,
      meta: { refines },
      updatedAt: new Date(),
    },
  });
  return true;
}

export async function getCctpSessionGenerationContext(
  userId: string,
  sessionId: string,
): Promise<{
  context: CctpProjectContext;
  normReferences: string[];
  extractedContext: string | null;
  resultMarkdown: string | null;
  generationMode: string | null;
  marketProfile: string | null;
  requestText: string;
} | null> {
  const row = await prisma.skillCctpSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!row) return null;
  return {
    requestText: row.requestText,
    context: {
      projectType: row.projectType ?? "",
      lot: row.lot ?? "",
      location: row.location ?? "",
      constraints: row.constraints ?? "",
      detailLevel: (row.detailLevel as CctpDetailLevel) || "standard",
      availableDocuments: row.availableDocuments ?? "",
    },
    normReferences: parseNormRefs(row.normReferences),
    extractedContext: row.extractedContext,
    resultMarkdown: row.resultMarkdown,
    generationMode: row.generationMode,
    marketProfile: row.marketProfile,
  };
}

export async function listCctpSessionsForUser(userId: string, limit = 20): Promise<CctpSessionSummary[]> {
  const rows = await prisma.skillCctpSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      requestText: true,
      lot: true,
      projectType: true,
      createdAt: true,
      usedLlm: true,
      resultMarkdown: true,
      generationMode: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    requestText: r.requestText,
    lot: r.lot,
    projectType: r.projectType,
    createdAt: r.createdAt.toISOString(),
    usedLlm: r.usedLlm,
    hasResult: Boolean(r.resultMarkdown?.trim()),
    generationMode: r.generationMode,
  }));
}

export async function getCctpSessionForUser(userId: string, sessionId: string): Promise<CctpSessionDetail | null> {
  const row = await prisma.skillCctpSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      files: {
        select: { id: true, kind: true, fileName: true, fileSize: true, mimeType: true, storageUrl: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    requestText: row.requestText,
    lot: row.lot,
    projectType: row.projectType,
    createdAt: row.createdAt.toISOString(),
    usedLlm: row.usedLlm,
    hasResult: Boolean(row.resultMarkdown?.trim()),
    generationMode: row.generationMode,
    location: row.location,
    constraints: row.constraints,
    detailLevel: (row.detailLevel as CctpDetailLevel) || "standard",
    availableDocuments: row.availableDocuments,
    normReferences: parseNormRefs(row.normReferences),
    marketProfile: row.marketProfile,
    resultMarkdown: row.resultMarkdown,
    notice: row.notice,
    extractedContext: row.extractedContext,
    files: row.files,
  };
}

export async function getCctpSessionMarkdownForExport(
  userId: string,
  sessionId: string,
): Promise<{ markdown: string; lot: string | null; requestText: string } | null> {
  const row = await prisma.skillCctpSession.findFirst({
    where: { id: sessionId, userId },
    select: { resultMarkdown: true, lot: true, requestText: true },
  });
  if (!row?.resultMarkdown?.trim()) return null;
  return { markdown: row.resultMarkdown, lot: row.lot, requestText: row.requestText };
}
