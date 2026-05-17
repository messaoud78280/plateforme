import type { CctpDetailLevel, CctpProjectContext, CctpSessionDetail, CctpSessionSummary } from "@/lib/skills/cctp-redaction-types";
import { prisma } from "@/lib/prisma";

export type PersistCctpSessionInput = {
  userId: string;
  request: string;
  context: CctpProjectContext;
  normReferences: string[];
  extractedContext: string | null;
  resultMarkdown: string;
  usedLlm: boolean;
  notice?: string;
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

  const normRefs = Array.isArray(row.normReferences)
    ? (row.normReferences as string[])
    : typeof row.normReferences === "object" && row.normReferences !== null
      ? Object.values(row.normReferences as Record<string, string>)
      : [];

  return {
    id: row.id,
    requestText: row.requestText,
    lot: row.lot,
    projectType: row.projectType,
    createdAt: row.createdAt.toISOString(),
    usedLlm: row.usedLlm,
    hasResult: Boolean(row.resultMarkdown?.trim()),
    location: row.location,
    constraints: row.constraints,
    detailLevel: (row.detailLevel as CctpDetailLevel) || "standard",
    availableDocuments: row.availableDocuments,
    normReferences: normRefs.filter((x): x is string => typeof x === "string"),
    resultMarkdown: row.resultMarkdown,
    notice: row.notice,
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
