import { mergePpsps, mergeSiteReport } from "@/lib/site-documents/parse";
import {
  emptyPpspsPayload,
  emptySiteReportPayload,
  type PpspsPayload,
  type SiteReportPayload,
} from "@/lib/site-documents/types";
import { nextSiteDocumentNumber } from "@/lib/site-documents/access";
import { prisma } from "@/lib/prisma";
import type { Prisma, SiteDocumentKind } from "@prisma/client";

export async function listSiteDocuments(orgId: string, projectId: string, kind?: SiteDocumentKind) {
  return prisma.siteDocument.findMany({
    where: {
      organizationId: orgId,
      projectId,
      ...(kind ? { kind } : {}),
    },
    orderBy: [{ kind: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      kind: true,
      number: true,
      versionNumber: true,
      status: true,
      title: true,
      visitDate: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function getSiteDocument(orgId: string, projectId: string, docId: string) {
  return prisma.siteDocument.findFirst({
    where: { id: docId, organizationId: orgId, projectId },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      chatgptImports: {
        where: { status: "APPLIED" },
        orderBy: { appliedAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function createSiteDocument(input: {
  orgId: string;
  projectId: string;
  kind: SiteDocumentKind;
  userId: string;
  title?: string;
  seed?: {
    clientLabel?: string | null;
    companyLabel?: string | null;
    siteAddress?: string | null;
    siteCity?: string | null;
    description?: string | null;
    manager?: string | null;
  };
}) {
  const number = await nextSiteDocumentNumber(input.projectId, input.kind);
  const address = [input.seed?.siteAddress, input.seed?.siteCity].filter(Boolean).join(", ");

  let payload: SiteReportPayload | PpspsPayload;
  let title: string;

  if (input.kind === "COMPTE_RENDU") {
    payload = emptySiteReportPayload({
      reportNumber: number,
      title: input.title ?? `Compte rendu — ${number}`,
      author: input.seed?.manager ?? null,
    });
    title = payload.title;
  } else {
    payload = emptyPpspsPayload({
      title: input.title ?? `PPSPS — ${number}`,
      versionLabel: "Version 1",
      project: {
        name: undefined,
        address: address || null,
        contact: input.seed?.clientLabel ?? null,
      },
      company: {
        name: input.seed?.companyLabel ?? null,
        responsible: input.seed?.manager ?? null,
      },
    });
    if (input.seed?.description) {
      payload.workDescription = [input.seed.description];
    }
    title = payload.title;
  }

  return prisma.siteDocument.create({
    data: {
      organizationId: input.orgId,
      projectId: input.projectId,
      kind: input.kind,
      number,
      versionNumber: 1,
      status: "DRAFT",
      title,
      authorName: input.seed?.manager ?? null,
      payloadJson: payload as unknown as Prisma.InputJsonValue,
      createdById: input.userId,
      updatedById: input.userId,
    },
  });
}

export async function updateSiteDocument(input: {
  orgId: string;
  projectId: string;
  docId: string;
  userId: string;
  title?: string;
  status?: string;
  visitDate?: string | null;
  visitTime?: string | null;
  weather?: string | null;
  authorName?: string | null;
  quickNotes?: string | null;
  payload?: SiteReportPayload | PpspsPayload;
}) {
  const existing = await getSiteDocument(input.orgId, input.projectId, input.docId);
  if (!existing) return null;

  return prisma.siteDocument.update({
    where: { id: existing.id },
    data: {
      ...(input.title != null ? { title: input.title } : {}),
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.visitDate !== undefined
        ? { visitDate: input.visitDate ? new Date(input.visitDate) : null }
        : {}),
      ...(input.visitTime !== undefined ? { visitTime: input.visitTime } : {}),
      ...(input.weather !== undefined ? { weather: input.weather } : {}),
      ...(input.authorName !== undefined ? { authorName: input.authorName } : {}),
      ...(input.quickNotes !== undefined ? { quickNotes: input.quickNotes } : {}),
      ...(input.payload
        ? { payloadJson: input.payload as unknown as Prisma.InputJsonValue }
        : {}),
      updatedById: input.userId,
    },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      chatgptImports: {
        where: { status: "APPLIED" },
        orderBy: { appliedAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function duplicateSiteDocument(input: {
  orgId: string;
  projectId: string;
  docId: string;
  userId: string;
}) {
  const src = await getSiteDocument(input.orgId, input.projectId, input.docId);
  if (!src) return null;
  const number = await nextSiteDocumentNumber(input.projectId, src.kind);
  const versionNumber =
    src.kind === "PPSPS"
      ? (await prisma.siteDocument.count({
          where: { projectId: input.projectId, kind: "PPSPS" },
        })) + 1
      : 1;

  let payload = src.payloadJson as unknown as SiteReportPayload | PpspsPayload;
  if (src.kind === "COMPTE_RENDU") {
    payload = {
      ...(payload as SiteReportPayload),
      reportNumber: number,
      title: `${(payload as SiteReportPayload).title || src.title} (copie)`,
    };
  } else {
    payload = {
      ...(payload as PpspsPayload),
      versionLabel: `Version ${versionNumber}`,
      title: `${(payload as PpspsPayload).title || src.title} (copie)`,
    };
  }

  return prisma.siteDocument.create({
    data: {
      organizationId: input.orgId,
      projectId: input.projectId,
      kind: src.kind,
      number,
      versionNumber,
      status: "DRAFT",
      title: typeof payload === "object" && "title" in payload ? String(payload.title) : src.title,
      visitDate: src.visitDate,
      visitTime: src.visitTime,
      weather: src.weather,
      authorName: src.authorName,
      quickNotes: src.quickNotes,
      payloadJson: payload as unknown as Prisma.InputJsonValue,
      createdById: input.userId,
      updatedById: input.userId,
    },
  });
}

export async function deleteSiteDocument(orgId: string, projectId: string, docId: string) {
  const existing = await getSiteDocument(orgId, projectId, docId);
  if (!existing) return false;
  await prisma.siteDocument.delete({ where: { id: existing.id } });
  return true;
}

export async function applyChatgptImport(input: {
  orgId: string;
  projectId: string;
  docId: string;
  userId: string;
  importId: string;
  format: string;
  incoming: SiteReportPayload | PpspsPayload;
  replaceAll?: boolean;
}) {
  const existing = await getSiteDocument(input.orgId, input.projectId, input.docId);
  if (!existing) return { ok: false as const, error: "Document introuvable" };

  const already = await prisma.siteDocumentChatgptImport.findUnique({
    where: {
      siteDocumentId_importId: {
        siteDocumentId: existing.id,
        importId: input.importId,
      },
    },
  });
  if (already?.status === "APPLIED") {
    return { ok: false as const, error: "Cette réponse ChatGPT a déjà été importée." };
  }

  const before = existing.payloadJson;
  let merged: SiteReportPayload | PpspsPayload;
  if (existing.kind === "COMPTE_RENDU") {
    const cur = before as unknown as SiteReportPayload;
    const inc = input.incoming as SiteReportPayload;
    merged = input.replaceAll ? { ...emptySiteReportPayload(), ...inc } : mergeSiteReport(cur, inc);
  } else {
    const cur = before as unknown as PpspsPayload;
    const inc = input.incoming as PpspsPayload;
    merged = input.replaceAll ? { ...emptyPpspsPayload(), ...inc } : mergePpsps(cur, inc);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const doc = await tx.siteDocument.update({
      where: { id: existing.id },
      data: {
        payloadJson: merged as unknown as Prisma.InputJsonValue,
        sourceFormat: input.format,
        title: "title" in merged && merged.title ? String(merged.title) : existing.title,
        visitDate:
          existing.kind === "COMPTE_RENDU" && (merged as SiteReportPayload).date
            ? new Date((merged as SiteReportPayload).date)
            : existing.visitDate,
        visitTime:
          existing.kind === "COMPTE_RENDU"
            ? (merged as SiteReportPayload).time ?? existing.visitTime
            : existing.visitTime,
        weather:
          existing.kind === "COMPTE_RENDU"
            ? (merged as SiteReportPayload).weather ?? existing.weather
            : existing.weather,
        authorName:
          existing.kind === "COMPTE_RENDU"
            ? (merged as SiteReportPayload).author ?? existing.authorName
            : existing.authorName,
        updatedById: input.userId,
      },
    });
    await tx.siteDocumentChatgptImport.create({
      data: {
        organizationId: input.orgId,
        siteDocumentId: existing.id,
        importId: input.importId,
        format: input.format,
        status: "APPLIED",
        summaryJson: {
          kind: existing.kind,
          format: input.format,
        },
        snapshotBeforeJson: before as Prisma.InputJsonValue,
        appliedById: input.userId,
      },
    });
    return doc;
  });

  return { ok: true as const, document: updated };
}

export async function undoLastChatgptImport(input: {
  orgId: string;
  projectId: string;
  docId: string;
}) {
  const existing = await getSiteDocument(input.orgId, input.projectId, input.docId);
  if (!existing) return { ok: false as const, error: "Document introuvable" };

  const last = existing.chatgptImports[0];
  if (!last) return { ok: false as const, error: "Aucun import ChatGPT à annuler." };

  await prisma.$transaction(async (tx) => {
    await tx.siteDocument.update({
      where: { id: existing.id },
      data: {
        payloadJson: last.snapshotBeforeJson as Prisma.InputJsonValue,
      },
    });
    await tx.siteDocumentChatgptImport.update({
      where: { id: last.id },
      data: { status: "UNDONE", undoneAt: new Date() },
    });
  });

  return { ok: true as const };
}

export async function buildProjectPromptSeed(projectId: string, orgId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    include: {
      client: { select: { name: true, company: true } },
      organization: { select: { name: true } },
      commercialQuotes: {
        where: { status: { in: ["ACCEPTED", "SENT", "DRAFT"] } },
        select: { number: true, status: true },
        orderBy: { updatedAt: "desc" },
        take: 8,
      },
    },
  });
  if (!project) return null;

  const clientLabel: string | null =
    project.client.company || project.client.name || null;

  return {
    projectTitle: project.title,
    projectId: project.id,
    siteAddress: project.siteAddress,
    siteCity: project.siteCity,
    clientLabel,
    companyLabel: project.organization?.name ?? null,
    description: project.description,
    quoteNumbers: project.commercialQuotes.map((q) => q.number),
    manager: project.internalManager,
  };
}
