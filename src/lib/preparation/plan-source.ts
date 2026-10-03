import { prisma } from "@/lib/prisma";
import type { PrepSource } from "@/lib/preparation/types";

export const PREP_STUDY_FILE_LINK = "PREP_STUDY";

export type ResolvedPlanSourceFile = {
  id: string;
  name: string;
  fileUrl: string | null;
  mimeType: string | null;
  status: string;
  documentType: string | null;
  versionLabel: string | null;
  indice: string | null;
  documentDate: string | null;
  category: string | null;
  isCurrentVersion: boolean;
  previewHref: string;
};

export type ResolvedPlanSource = {
  source: PrepSource;
  file: ResolvedPlanSourceFile | null;
  /** Métadonnée présente mais aucun fichier GED rattaché. */
  fileMissing: boolean;
  displayTitle: string;
  revisionLabel: string | null;
};

function asSources(raw: unknown): PrepSource[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    const o = item && typeof item === "object" && !Array.isArray(item)
      ? (item as Record<string, unknown>)
      : {};
    const str = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim() : null;
    return {
      id: str(o.id) ?? `SRC-${i + 1}`,
      filename: str(o.filename),
      planNumber: str(o.planNumber) ?? str(o.plan_number),
      title: str(o.title),
      revision: str(o.revision),
      scale: str(o.scale),
      page: typeof o.page === "number" ? o.page : null,
      isRaster: typeof o.isRaster === "boolean" ? o.isRaster : typeof o.is_raster === "boolean" ? o.is_raster : null,
      legibility: str(o.legibility),
      note: str(o.note),
      chantierFileId: str(o.chantierFileId) ?? str(o.chantier_file_id),
    };
  });
}

export function normalizePrepSources(raw: unknown): PrepSource[] {
  return asSources(raw);
}

export function primaryPrepSource(raw: unknown): PrepSource | null {
  return asSources(raw)[0] ?? null;
}

export function planSourceDisplayTitle(source: PrepSource): string {
  if (source.planNumber && source.title) {
    return `Plan d'exécution ${source.planNumber}`;
  }
  if (source.planNumber) return `Plan d'exécution ${source.planNumber}`;
  if (source.title) return source.title;
  if (source.filename) return source.filename;
  return "Plan source";
}

export function planSourceRevisionLabel(source: PrepSource, file: ResolvedPlanSourceFile | null): string | null {
  if (source.revision) return source.revision;
  if (file?.indice) return file.indice;
  if (file?.versionLabel && file.versionLabel !== "1") return file.versionLabel;
  return null;
}

async function loadFile(
  projectId: string,
  fileId: string,
): Promise<ResolvedPlanSourceFile | null> {
  const file = await prisma.chantierFile.findFirst({
    where: { id: fileId, projectId, deletedAt: null },
    select: {
      id: true,
      name: true,
      fileUrl: true,
      mimeType: true,
      status: true,
      documentType: true,
      versionLabel: true,
      indice: true,
      documentDate: true,
      category: true,
      isCurrentVersion: true,
    },
  });
  if (!file) return null;
  return {
    id: file.id,
    name: file.name,
    fileUrl: file.fileUrl,
    mimeType: file.mimeType,
    status: file.status,
    documentType: file.documentType,
    versionLabel: file.versionLabel,
    indice: file.indice,
    documentDate: file.documentDate?.toISOString().slice(0, 10) ?? null,
    category: file.category,
    isCurrentVersion: file.isCurrentVersion,
    previewHref: `/api/chantier/files/${file.id}/preview`,
  };
}

export async function resolvePrepPlanSource(input: {
  projectId: string;
  sourcesJson: unknown;
}): Promise<ResolvedPlanSource | null> {
  const all = await resolveAllPrepPlanSources(input);
  return all[0] ?? null;
}

/** Toutes les sources plan du métré (pas seulement la primaire). */
export async function resolveAllPrepPlanSources(input: {
  projectId: string;
  sourcesJson: unknown;
}): Promise<ResolvedPlanSource[]> {
  const sources = asSources(input.sourcesJson);
  if (sources.length === 0) return [];

  const out: ResolvedPlanSource[] = [];
  for (const source of sources) {
    const file = source.chantierFileId
      ? await loadFile(input.projectId, source.chantierFileId)
      : null;
    out.push({
      source,
      file,
      fileMissing: !file || !file.fileUrl,
      displayTitle: planSourceDisplayTitle(source),
      revisionLabel: planSourceRevisionLabel(source, file),
    });
  }
  return out;
}

/**
 * Détache un document source du métré.
 * Ne supprime pas le fichier GED — uniquement le lien préparation.
 */
export async function detachPrepStudyPlanSource(input: {
  orgId: string;
  studyId: string;
  sourceId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const study = await prisma.prepStudy.findFirst({
    where: {
      id: input.studyId,
      organizationId: input.orgId,
      archivedAt: null,
    },
    select: { id: true, sourcesJson: true },
  });
  if (!study) return { ok: false, error: "Étude introuvable" };

  const sources = asSources(study.sourcesJson);
  const target = sources.find((s) => s.id === input.sourceId);
  if (!target) return { ok: false, error: "Document source introuvable" };

  const next = sources.filter((s) => s.id !== input.sourceId);
  const fileId = target.chantierFileId;

  await prisma.$transaction(async (tx) => {
    await tx.prepStudy.update({
      where: { id: study.id },
      data: {
        sourcesJson: next as never,
        updatedById: input.actorUserId,
      },
    });
    if (fileId) {
      await tx.chantierFileLink.deleteMany({
        where: {
          fileId,
          entityType: PREP_STUDY_FILE_LINK,
          entityId: study.id,
        },
      });
    }
  });

  return { ok: true };
}

/**
 * Rattache un ChantierFile (révision figée) à la source primaire du métré.
 * N'écrase jamais le fichier historique : on pointe l'id exact.
 */
export async function attachPrepStudyPlanSource(input: {
  orgId: string;
  studyId: string;
  chantierFileId: string;
  sourceId?: string | null;
  actorUserId: string;
  /** Préremplissage / correction métadonnée source. */
  planNumber?: string | null;
  revision?: string | null;
  title?: string | null;
}): Promise<{ ok: true; source: PrepSource } | { ok: false; error: string }> {
  const study = await prisma.prepStudy.findFirst({
    where: {
      id: input.studyId,
      organizationId: input.orgId,
      archivedAt: null,
    },
    select: { id: true, projectId: true, sourcesJson: true, version: true },
  });
  if (!study) return { ok: false, error: "Étude introuvable" };

  const file = await prisma.chantierFile.findFirst({
    where: {
      id: input.chantierFileId,
      projectId: study.projectId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      fileUrl: true,
      indice: true,
      versionLabel: true,
      documentType: true,
    },
  });
  if (!file) return { ok: false, error: "Document introuvable dans le dossier chantier" };
  if (!file.fileUrl) {
    return { ok: false, error: "Ce document n’a pas encore de fichier (pièce manquante)" };
  }

  const planNumber =
    (input.planNumber?.trim() || null) ?? null;
  const revision =
    (input.revision?.trim() || null) ??
    file.indice ??
    (file.versionLabel && file.versionLabel !== "1" ? file.versionLabel : null);
  const titleHint = input.title?.trim() || null;

  const sources = asSources(study.sourcesJson);
  const targetId = input.sourceId?.trim() || sources[0]?.id || "SRC-PLAN";
  let found = false;
  const next = sources.map((s) => {
    if (s.id !== targetId) return s;
    found = true;
    return {
      ...s,
      chantierFileId: file.id,
      filename: s.filename ?? file.name,
      planNumber: planNumber ?? s.planNumber,
      revision: revision ?? s.revision,
      title:
        titleHint ??
        s.title ??
        (s.planNumber || planNumber
          ? `Plan Niveau Fondations`
          : file.documentType || file.name),
    };
  });
  if (!found) {
    next.unshift({
      id: targetId,
      filename: file.name,
      planNumber,
      title: titleHint ?? file.documentType ?? file.name,
      revision,
      scale: null,
      page: null,
      isRaster: null,
      legibility: null,
      note: null,
      chantierFileId: file.id,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.prepStudy.update({
      where: { id: study.id },
      data: {
        sourcesJson: next as never,
        updatedById: input.actorUserId,
      },
    });
    // Figée la révision sur le fichier GED si fournie
    if (revision || planNumber) {
      await tx.chantierFile.update({
        where: { id: file.id },
        data: {
          ...(revision ? { indice: revision } : {}),
          ...(planNumber && !file.documentType
            ? { documentType: `Plan d'exécution ${planNumber}` }
            : {}),
        },
      });
    }
    const existing = await tx.chantierFileLink.findFirst({
      where: {
        fileId: file.id,
        entityType: PREP_STUDY_FILE_LINK,
        entityId: study.id,
      },
      select: { id: true },
    });
    if (!existing) {
      await tx.chantierFileLink.create({
        data: {
          fileId: file.id,
          entityType: PREP_STUDY_FILE_LINK,
          entityId: study.id,
          entityLabel: `Métré · V${study.version}`,
          createdById: input.actorUserId,
        },
      });
    } else {
      await tx.chantierFileLink.update({
        where: { id: existing.id },
        data: { entityLabel: `Métré · V${study.version}` },
      });
    }
  });

  const source = next.find((s) => s.id === targetId) ?? next[0]!;
  return { ok: true, source };
}

export async function listProjectPlanCandidateFiles(input: {
  projectId: string;
  take?: number;
}) {
  return prisma.chantierFile.findMany({
    where: {
      projectId: input.projectId,
      deletedAt: null,
      fileUrl: { not: null },
      OR: [
        { category: { contains: "plan", mode: "insensitive" } },
        { subcategory: { contains: "plan", mode: "insensitive" } },
        { documentType: { contains: "plan", mode: "insensitive" } },
        { name: { contains: "plan", mode: "insensitive" } },
        { mimeType: { startsWith: "application/pdf" } },
        { mimeType: { startsWith: "image/" } },
      ],
    },
    orderBy: [{ isCurrentVersion: "desc" }, { updatedAt: "desc" }],
    take: input.take ?? 30,
    select: {
      id: true,
      name: true,
      documentType: true,
      indice: true,
      versionLabel: true,
      documentDate: true,
      mimeType: true,
      isCurrentVersion: true,
    },
  });
}
