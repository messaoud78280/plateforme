"use server";

import { revalidatePath } from "next/cache";
import type {
  SiteResourceConfidence,
  SiteResourceExtractedFrom,
  SiteResourceGroupingProposalType,
  SiteResourceStatus,
  SiteResourceType,
} from "@prisma/client";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { extractCandidatesFromWorkItem } from "@/lib/chantier-resources/extract-from-work-item";
import {
  bucketProposals,
  normalizeAndGroupResources,
  type GroupingProposalDraft,
} from "@/lib/chantier-resources/normalize-and-group";
import { normalizeResourceLabel } from "@/lib/chantier-resources/normalize-label";
import { suggestTaxonomyFromText } from "@/lib/chantier-resources/taxonomy";
import { prisma } from "@/lib/prisma";

const REVALIDATE = ["/dashboard/devis/ressources-chantier", "/dashboard/devis/ressources-chantier/extraction"];

async function loadExistingResourceIndex() {
  const rows = await prisma.siteResource.findMany({
    where: { status: { not: "fusionne" }, mergedIntoId: null },
    select: {
      id: true,
      shortName: true,
      orderUnit: true,
      aliases: { select: { label: true, normalizedLabel: true } },
    },
  });
  return rows;
}

export async function fetchChantierResourcesList(filters?: {
  type?: SiteResourceType;
  family?: string;
  subFamily?: string;
  q?: string;
  status?: SiteResourceStatus;
}) {
  await requireBeWorkDevisSession();
  const q = filters?.q?.trim();
  return prisma.siteResource.findMany({
    where: {
      mergedIntoId: null,
      ...(filters?.type ? { resourceType: filters.type } : {}),
      ...(filters?.family ? { family: filters.family } : {}),
      ...(filters?.subFamily ? { subFamily: filters.subFamily } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(q
        ? {
            OR: [
              { shortName: { contains: q, mode: "insensitive" } },
              { fullDescription: { contains: q, mode: "insensitive" } },
              { aliases: { some: { label: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { aliases: true, variants: true, workItemLinks: true } },
    },
    orderBy: [{ resourceType: "asc" }, { family: "asc" }, { shortName: "asc" }],
    take: 500,
  });
}

export async function fetchChantierResourceDetail(id: string) {
  await requireBeWorkDevisSession();
  return prisma.siteResource.findUnique({
    where: { id },
    include: {
      aliases: { orderBy: { createdAt: "desc" } },
      variants: { orderBy: { updatedAt: "desc" } },
      workItemLinks: {
        include: {
          workItem: { select: { id: true, code: true, title: true, lot: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      mergedInto: { select: { id: true, shortName: true } },
    },
  });
}

export async function createExtractionPreview(opts?: { workItemLimit?: number; lot?: string }) {
  await requireBeWorkDevisSession();
  const limit = Math.min(opts?.workItemLimit ?? 200, 500);

  const workItems = await prisma.workItem.findMany({
    where: {
      status: { not: "archive" },
      ...(opts?.lot?.trim() ? { lot: { equals: opts.lot.trim(), mode: "insensitive" } } : {}),
    },
    select: {
      id: true,
      code: true,
      title: true,
      unit: true,
      lot: true,
      includedItems: true,
      fullDescription: true,
      shortDescription: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const existing = await loadExistingResourceIndex();
  const allCandidates: GroupingProposalDraft[] = [];

  for (const wi of workItems) {
    const candidates = extractCandidatesFromWorkItem(wi);
    if (!candidates.length) continue;
    const proposals = normalizeAndGroupResources({
      candidates,
      existingResources: existing,
      sourceWorkItemId: wi.id,
    });
    allCandidates.push(...proposals);
  }

  const run = await prisma.siteResourceExtractionRun.create({
    data: {
      label: `Extraction ${new Date().toLocaleDateString("fr-FR")}`,
      status: "preview",
      workItemCount: workItems.length,
      candidateCount: allCandidates.length,
      proposalCount: allCandidates.length,
      meta: { buckets: bucketProposals(allCandidates) },
    },
  });

  if (allCandidates.length) {
    await prisma.siteResourceGroupingProposal.createMany({
      data: allCandidates.map((p) => ({
        extractionRunId: run.id,
        proposalType: p.proposalType,
        status: "pending",
        similarityScore: p.similarityScore,
        sourceLabel: p.sourceLabel,
        normalizedSourceLabel: p.normalizedSourceLabel,
        targetSiteResourceId: p.targetSiteResourceId,
        sourceWorkItemId: p.sourceWorkItemId,
        sourceField: p.sourceField,
        sourceSnippet: p.sourceSnippet,
        matchReasons: p.matchReasons,
      })),
    });
  }

  revalidatePath("/dashboard/devis/ressources-chantier/extraction");
  return { runId: run.id, proposalCount: allCandidates.length, workItemCount: workItems.length };
}

export async function fetchExtractionRun(runId: string) {
  await requireBeWorkDevisSession();
  return prisma.siteResourceExtractionRun.findUnique({
    where: { id: runId },
    include: {
      proposals: {
        where: { status: "pending" },
        orderBy: [{ similarityScore: "desc" }, { sourceLabel: "asc" }],
        take: 500,
        include: {
          targetSiteResource: { select: { id: true, shortName: true } },
          sourceWorkItem: { select: { id: true, code: true, title: true } },
        },
      },
    },
  });
}

function defaultFullDescription(shortName: string): string {
  return `${shortName}, caractéristiques exactes à vérifier selon fournisseur ou CCTP.`;
}

async function createSiteResourceFromCandidate(
  p: GroupingProposalDraft,
  status: SiteResourceStatus = "a_verifier",
) {
  const tax = p.candidate.taxonomy;
  return prisma.siteResource.create({
    data: {
      shortName: p.candidate.suggestedShortName,
      fullDescription: defaultFullDescription(p.candidate.suggestedShortName),
      resourceType: tax.resourceType,
      family: tax.family,
      subFamily: tax.subFamily,
      orderUnit: p.candidate.suggestedUnit,
      siteUsage: "Usage chantier à préciser selon ouvrages liés.",
      characteristicsToVerify: "Dimensions, norme, conditionnement, fournisseur.",
      confidenceLevel: p.similarityScore >= 90 ? "eleve" : p.similarityScore >= 70 ? "moyen" : "faible",
      status,
      aliases: {
        create: {
          label: p.sourceLabel,
          normalizedLabel: p.normalizedSourceLabel,
          aliasKind: "extraction_ouvrage",
          sourceWorkItemId: p.sourceWorkItemId ?? undefined,
          sourceField: p.sourceField,
          sourceSnippet: p.sourceSnippet,
          confidenceScore: p.similarityScore,
        },
      },
    },
  });
}

async function linkWorkItemToResource(
  workItemId: string,
  siteResourceId: string,
  p: GroupingProposalDraft,
  extractionRunId?: string,
) {
  const snippet = p.sourceSnippet ?? "";
  await prisma.workItemSiteResource.upsert({
    where: {
      workItemId_siteResourceId_extractedFrom_sourceSnippet: {
        workItemId,
        siteResourceId,
        extractedFrom: p.sourceField,
        sourceSnippet: snippet,
      },
    },
    create: {
      workItemId,
      siteResourceId,
      extractedFrom: p.sourceField,
      sourceSnippet: snippet,
      extractionRunId,
      confidenceScore: p.similarityScore,
      linkRole: "fourniture",
    },
    update: { confidenceScore: p.similarityScore, extractionRunId },
  });
}

export async function approveGroupingProposal(proposalId: string) {
  await requireBeWorkDevisSession();
  const proposal = await prisma.siteResourceGroupingProposal.findUnique({
    where: { id: proposalId },
  });
  if (!proposal || proposal.status !== "pending") {
    return { ok: false as const, error: "Proposition introuvable ou déjà traitée." };
  }

  const draft: GroupingProposalDraft = {
    proposalType: proposal.proposalType,
    similarityScore: proposal.similarityScore,
    sourceLabel: proposal.sourceLabel,
    normalizedSourceLabel: proposal.normalizedSourceLabel,
    targetSiteResourceId: proposal.targetSiteResourceId,
    sourceWorkItemId: proposal.sourceWorkItemId,
    sourceField: proposal.sourceField ?? "includedItems",
    sourceSnippet: proposal.sourceSnippet ?? "",
    matchReasons: Array.isArray(proposal.matchReasons) ? (proposal.matchReasons as string[]) : [],
    candidate: {
      label: proposal.sourceLabel,
      normalizedLabel: proposal.normalizedSourceLabel,
      sourceField: proposal.sourceField ?? "includedItems",
      sourceSnippet: proposal.sourceSnippet ?? "",
      suggestedShortName: proposal.sourceLabel.slice(0, 48),
      suggestedUnit: "u",
      taxonomy: suggestTaxonomyFromText(proposal.sourceLabel),
    },
  };

  let resourceId = proposal.targetSiteResourceId;

  if (proposal.proposalType === "merge_as_alias" && resourceId) {
    await prisma.siteResourceAlias.create({
      data: {
        siteResourceId: resourceId,
        label: proposal.sourceLabel,
        normalizedLabel: proposal.normalizedSourceLabel,
        aliasKind: "extraction_ouvrage",
        sourceWorkItemId: proposal.sourceWorkItemId ?? undefined,
        sourceField: proposal.sourceField ?? undefined,
        sourceSnippet: proposal.sourceSnippet ?? undefined,
        confidenceScore: proposal.similarityScore,
      },
    });
  } else if (proposal.proposalType === "create_variant" && resourceId) {
    await prisma.siteResourceVariant.create({
      data: {
        siteResourceId: resourceId,
        shortName: proposal.sourceLabel,
        fullDescription: defaultFullDescription(proposal.sourceLabel),
        distinguishingAttributes: proposal.matchReasons ? JSON.stringify(proposal.matchReasons) : null,
        orderUnit: draft.candidate.suggestedUnit,
        confidenceLevel: proposal.similarityScore >= 80 ? "moyen" : "faible",
        status: "a_verifier",
      },
    });
    await prisma.siteResourceAlias.create({
      data: {
        siteResourceId: resourceId,
        label: proposal.sourceLabel,
        normalizedLabel: proposal.normalizedSourceLabel,
        aliasKind: "variante_libelle",
        sourceWorkItemId: proposal.sourceWorkItemId ?? undefined,
        sourceField: proposal.sourceField ?? undefined,
        sourceSnippet: proposal.sourceSnippet ?? undefined,
        confidenceScore: proposal.similarityScore,
      },
    });
  } else if (proposal.proposalType === "new_resource" || proposal.proposalType === "keep_separate") {
    const created = await createSiteResourceFromCandidate(draft, "a_verifier");
    resourceId = created.id;
    await prisma.siteResourceGroupingProposal.update({
      where: { id: proposalId },
      data: { createdSiteResourceId: created.id },
    });
  }

  if (resourceId && proposal.sourceWorkItemId) {
    await linkWorkItemToResource(proposal.sourceWorkItemId, resourceId, draft, proposal.extractionRunId ?? undefined);
  }

  await prisma.siteResourceGroupingProposal.update({
    where: { id: proposalId },
    data: { status: "approved", reviewedAt: new Date() },
  });

  for (const p of REVALIDATE) revalidatePath(p);
  if (resourceId) revalidatePath(`/dashboard/devis/ressources-chantier/${resourceId}`);
  return { ok: true as const, resourceId };
}

export async function rejectGroupingProposal(proposalId: string, note?: string) {
  await requireBeWorkDevisSession();
  await prisma.siteResourceGroupingProposal.update({
    where: { id: proposalId },
    data: { status: "rejected", reviewedAt: new Date(), reviewNote: note?.trim() || null },
  });
  for (const p of REVALIDATE) revalidatePath(p);
  return { ok: true as const };
}

export async function approveAllMergeAliasProposals(runId: string) {
  await requireBeWorkDevisSession();
  const pending = await prisma.siteResourceGroupingProposal.findMany({
    where: { extractionRunId: runId, status: "pending", proposalType: "merge_as_alias", similarityScore: { gte: 90 } },
    select: { id: true },
  });
  let ok = 0;
  for (const p of pending) {
    const res = await approveGroupingProposal(p.id);
    if (res.ok) ok += 1;
  }
  return { ok, total: pending.length };
}

export async function createManualSiteResource(formData: FormData) {
  await requireBeWorkDevisSession();
  const shortName = String(formData.get("shortName") ?? "").trim();
  const fullDescription = String(formData.get("fullDescription") ?? "").trim();
  const resourceType = String(formData.get("resourceType") ?? "materiaux") as SiteResourceType;
  const family = String(formData.get("family") ?? "divers-materiaux").trim();
  const subFamily = String(formData.get("subFamily") ?? "").trim() || null;
  const orderUnit = String(formData.get("orderUnit") ?? "u").trim();

  if (!shortName || !fullDescription) {
    return { ok: false as const, error: "Nom court et désignation complète requis." };
  }

  const created = await prisma.siteResource.create({
    data: {
      shortName,
      fullDescription,
      resourceType,
      family,
      subFamily,
      orderUnit,
      status: "brouillon",
      confidenceLevel: "moyen",
      aliases: {
        create: {
          label: shortName,
          normalizedLabel: normalizeResourceLabel(shortName),
          aliasKind: "synonyme",
        },
      },
    },
  });

  revalidatePath("/dashboard/devis/ressources-chantier");
  return { ok: true as const, id: created.id };
}

export async function addAliasToSiteResource(siteResourceId: string, label: string) {
  await requireBeWorkDevisSession();
  const t = label.trim();
  if (!t) return { ok: false as const, error: "Alias vide." };
  await prisma.siteResourceAlias.create({
    data: {
      siteResourceId,
      label: t,
      normalizedLabel: normalizeResourceLabel(t),
      aliasKind: "synonyme",
    },
  });
  revalidatePath(`/dashboard/devis/ressources-chantier/${siteResourceId}`);
  return { ok: true as const };
}

export async function mergeSiteResources(sourceId: string, targetId: string) {
  await requireBeWorkDevisSession();
  if (sourceId === targetId) return { ok: false as const, error: "Même fiche." };

  await prisma.$transaction(async (tx) => {
    const aliases = await tx.siteResourceAlias.findMany({ where: { siteResourceId: sourceId } });
    for (const a of aliases) {
      await tx.siteResourceAlias.create({
        data: {
          siteResourceId: targetId,
          label: a.label,
          normalizedLabel: a.normalizedLabel,
          aliasKind: a.aliasKind,
          sourceWorkItemId: a.sourceWorkItemId,
          sourceField: a.sourceField,
          sourceSnippet: a.sourceSnippet,
          confidenceScore: a.confidenceScore,
        },
      });
    }
    const links = await tx.workItemSiteResource.findMany({ where: { siteResourceId: sourceId } });
    for (const l of links) {
      await tx.workItemSiteResource.upsert({
        where: {
          workItemId_siteResourceId_extractedFrom_sourceSnippet: {
            workItemId: l.workItemId,
            siteResourceId: targetId,
            extractedFrom: l.extractedFrom,
            sourceSnippet: l.sourceSnippet ?? "",
          },
        },
        create: {
          workItemId: l.workItemId,
          siteResourceId: targetId,
          extractedFrom: l.extractedFrom,
          sourceSnippet: l.sourceSnippet ?? "",
          linkRole: l.linkRole,
          confidenceScore: l.confidenceScore,
        },
        update: {},
      });
    }
    await tx.siteResource.update({
      where: { id: sourceId },
      data: { status: "fusionne", mergedIntoId: targetId },
    });
  });

  revalidatePath("/dashboard/devis/ressources-chantier");
  revalidatePath(`/dashboard/devis/ressources-chantier/${targetId}`);
  return { ok: true as const };
}

export async function fetchChantierResourceStats() {
  await requireBeWorkDevisSession();
  const [total, pendingProposals, byType] = await Promise.all([
    prisma.siteResource.count({ where: { mergedIntoId: null, status: { not: "fusionne" } } }),
    prisma.siteResourceGroupingProposal.count({ where: { status: "pending" } }),
    prisma.siteResource.groupBy({
      by: ["resourceType"],
      where: { mergedIntoId: null, status: { not: "fusionne" } },
      _count: true,
    }),
  ]);
  return { total, pendingProposals, byType };
}
