import type { PpspsGenerationMode } from "@/lib/skills/ppsps-generation-modes";
import type {
  PpspsDetailLevel,
  PpspsFormInput,
  PpspsSessionDetail,
  PpspsSessionSummary,
} from "@/lib/skills/ppsps-types";
import { prisma } from "@/lib/prisma";

type SessionMeta = {
  refines?: { instruction: string; at: string }[];
};

export type PersistPpspsSessionInput = {
  userId: string;
  form: PpspsFormInput;
  extractedContext: string | null;
  resultMarkdown: string;
  usedLlm: boolean;
  notice?: string;
  projectId?: string | null;
  generationMode?: PpspsGenerationMode;
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

function parseMeta(raw: unknown): SessionMeta {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as SessionMeta;
  }
  return {};
}

function parseFormSnapshot(raw: unknown): PpspsFormInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.site || typeof o.site !== "object") return null;
  return raw as PpspsFormInput;
}

function mapSessionSummary(
  r: {
    id: string;
    siteName: string | null;
    siteAddress: string | null;
    detailLevel: string;
    generationMode: string;
    formSnapshot: unknown;
    createdAt: Date;
    usedLlm: boolean;
    resultMarkdown: string | null;
    linkedDocumentId: string | null;
    project: { id: string; title: string } | null;
    meta?: unknown;
  },
): PpspsSessionSummary {
  const form = parseFormSnapshot(r.formSnapshot);
  const meta = parseMeta(r.meta);
  return {
    id: r.id,
    siteName: r.siteName,
    siteAddress: r.siteAddress,
    detailLevel: (r.detailLevel as PpspsDetailLevel) || "standard",
    generationMode: (r.generationMode as PpspsGenerationMode) || "analyse_risques",
    createdAt: r.createdAt.toISOString(),
    usedLlm: r.usedLlm,
    hasResult: Boolean(r.resultMarkdown?.trim()),
    taskCount: form?.selectedRiskTaskIds?.length ?? 0,
    project: r.project ? { id: r.project.id, title: r.project.title } : null,
    linkedDocumentId: r.linkedDocumentId,
    refineCount: meta.refines?.length ?? 0,
  };
}

const sessionSelect = {
  id: true,
  siteName: true,
  siteAddress: true,
  detailLevel: true,
  generationMode: true,
  formSnapshot: true,
  createdAt: true,
  usedLlm: true,
  resultMarkdown: true,
  linkedDocumentId: true,
  meta: true,
  project: { select: { id: true, title: true } },
} as const;

export async function persistPpspsSession(data: PersistPpspsSessionInput): Promise<string> {
  const mode = data.generationMode ?? data.form.generationMode ?? "analyse_risques";
  const projectId = data.projectId ?? data.form.projectId ?? null;

  const session = await prisma.skillPpspsSession.create({
    data: {
      userId: data.userId,
      projectId,
      siteName: data.form.site.siteName.trim() || null,
      siteAddress: data.form.site.siteAddress.trim() || null,
      detailLevel: data.form.detailLevel,
      generationMode: mode,
      formSnapshot: { ...data.form, generationMode: mode, projectId } as object,
      extractedContext: data.extractedContext,
      resultMarkdown: data.resultMarkdown,
      usedLlm: data.usedLlm,
      notice: data.notice ?? null,
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

export async function updatePpspsSessionAfterRefine(
  userId: string,
  sessionId: string,
  data: {
    resultMarkdown: string;
    refineInstruction: string;
    usedLlm: boolean;
    notice?: string;
  },
): Promise<boolean> {
  const existing = await prisma.skillPpspsSession.findFirst({
    where: { id: sessionId, userId },
    select: { meta: true },
  });
  if (!existing) return false;

  const meta = parseMeta(existing.meta);
  const refines = meta.refines ?? [];
  refines.push({ instruction: data.refineInstruction, at: new Date().toISOString() });

  await prisma.skillPpspsSession.update({
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

export async function getPpspsSessionGenerationContext(
  userId: string,
  sessionId: string,
): Promise<{
  form: PpspsFormInput;
  extractedContext: string | null;
  resultMarkdown: string | null;
  generationMode: PpspsGenerationMode;
} | null> {
  const row = await prisma.skillPpspsSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!row) return null;
  const form = parseFormSnapshot(row.formSnapshot);
  if (!form) return null;
  return {
    form,
    extractedContext: row.extractedContext,
    resultMarkdown: row.resultMarkdown,
    generationMode: (row.generationMode as PpspsGenerationMode) || "analyse_risques",
  };
}

export async function listPpspsSessionsForUser(userId: string, limit = 20): Promise<PpspsSessionSummary[]> {
  const rows = await prisma.skillPpspsSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: sessionSelect,
  });
  return rows.map(mapSessionSummary);
}

export async function listPpspsSessionsForProject(
  projectId: string,
  userId: string,
  limit = 15,
): Promise<PpspsSessionSummary[]> {
  const rows = await prisma.skillPpspsSession.findMany({
    where: { projectId, userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: sessionSelect,
  });
  return rows.map(mapSessionSummary);
}

export async function duplicatePpspsSession(
  userId: string,
  sessionId: string,
): Promise<{ id: string } | null> {
  const source = await prisma.skillPpspsSession.findFirst({
    where: { id: sessionId, userId },
    select: {
      projectId: true,
      siteName: true,
      siteAddress: true,
      detailLevel: true,
      generationMode: true,
      formSnapshot: true,
      extractedContext: true,
      resultMarkdown: true,
      usedLlm: true,
      notice: true,
    },
  });
  if (!source) return null;

  const form = parseFormSnapshot(source.formSnapshot);
  if (!form) return null;

  const copy = await prisma.skillPpspsSession.create({
    data: {
      userId,
      projectId: source.projectId,
      siteName: source.siteName,
      siteAddress: source.siteAddress,
      detailLevel: source.detailLevel,
      generationMode: source.generationMode,
      formSnapshot: source.formSnapshot as object,
      extractedContext: source.extractedContext,
      resultMarkdown: source.resultMarkdown,
      usedLlm: source.usedLlm,
      notice: source.notice ? `${source.notice} (copie)` : "Copie d'une session existante.",
      meta: { refines: [], duplicatedFrom: sessionId },
    },
    select: { id: true },
  });

  return { id: copy.id };
}

export async function getPpspsSessionForUser(userId: string, sessionId: string): Promise<PpspsSessionDetail | null> {
  const row = await prisma.skillPpspsSession.findFirst({
    where: { id: sessionId, userId },
    select: {
      ...sessionSelect,
      projectId: true,
      notice: true,
      extractedContext: true,
      meta: true,
      files: {
        select: { id: true, kind: true, fileName: true, fileSize: true, mimeType: true, storageUrl: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!row) return null;
  const form = parseFormSnapshot(row.formSnapshot);
  if (!form) return null;

  const summary = mapSessionSummary(row);
  const meta = parseMeta(row.meta);

  return {
    ...summary,
    projectId: row.projectId,
    form,
    resultMarkdown: row.resultMarkdown,
    notice: row.notice,
    extractedContext: row.extractedContext,
    files: row.files,
    refines: meta.refines ?? [],
  };
}

export async function getPpspsSessionMarkdownForExport(
  userId: string,
  sessionId: string,
): Promise<{ markdown: string; siteName: string | null; siteAddress: string | null } | null> {
  const row = await prisma.skillPpspsSession.findFirst({
    where: { id: sessionId, userId },
    select: { resultMarkdown: true, siteName: true, siteAddress: true },
  });
  if (!row?.resultMarkdown?.trim()) return null;
  return {
    markdown: row.resultMarkdown,
    siteName: row.siteName,
    siteAddress: row.siteAddress,
  };
}
