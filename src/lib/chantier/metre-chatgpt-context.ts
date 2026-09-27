/**
 * Contexte métré pour ChatGPT — export JSON à coller dans le prompt.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";

export async function buildMetreChatgptContext(input: {
  orgId: string;
  projectId: string;
  quoteId?: string | null;
  studyId?: string | null;
}): Promise<{
  format: "bework_metre_chatgpt_context_v1";
  project: Record<string, unknown>;
  visit: Record<string, unknown> | null;
  study: Record<string, unknown> | null;
  quote: Record<string, unknown> | null;
  instructions: string[];
}> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.orgId },
    select: {
      id: true,
      title: true,
      siteAddress: true,
      siteCity: true,
      description: true,
      client: { select: { name: true, company: true, email: true, phone: true } },
    },
  });
  if (!project) throw new Error("Chantier introuvable");

  const visit = await prisma.siteVisit.findFirst({
    where: {
      organizationId: input.orgId,
      OR: [
        { projectId: input.projectId },
        ...(input.quoteId ? [{ commercialQuoteId: input.quoteId }] : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      clientNeed: true,
      comments: true,
      status: true,
      zonesJson: true,
      findingsJson: true,
      proposedWorksJson: true,
      lotsJson: true,
      prepJson: true,
      constraintsJson: true,
      measurements: {
        select: {
          zone: true,
          label: true,
          measureType: true,
          lengthM: true,
          widthM: true,
          heightM: true,
          quantityValue: true,
          computedQuantity: true,
          unit: true,
          lot: true,
        },
      },
      medias: {
        take: 30,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          observation: true,
          category: true,
          kind: true,
          fileUrl: true,
          storagePath: true,
        },
      },
    },
  });

  const study = input.studyId
    ? await prisma.prepStudy.findFirst({
        where: {
          id: input.studyId,
          organizationId: input.orgId,
          projectId: input.projectId,
        },
        select: {
          id: true,
          title: true,
          version: true,
          trade: true,
          hypothesesJson: true,
          sourcesJson: true,
          parameters: {
            orderBy: { sortOrder: "asc" },
            select: {
              key: true,
              label: true,
              unit: true,
              value: true,
              provenance: true,
              note: true,
            },
          },
          lines: {
            orderBy: { sortOrder: "asc" },
            select: {
              code: true,
              lot: true,
              designation: true,
              unit: true,
              declaredQuantity: true,
              computedQuantity: true,
              provenance: true,
              role: true,
            },
          },
        },
      })
    : await prisma.prepStudy.findFirst({
        where: {
          organizationId: input.orgId,
          projectId: input.projectId,
          archivedAt: null,
          scopeId: null,
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          version: true,
          trade: true,
          hypothesesJson: true,
          sourcesJson: true,
          parameters: {
            orderBy: { sortOrder: "asc" },
            select: {
              key: true,
              label: true,
              unit: true,
              value: true,
              provenance: true,
              note: true,
            },
          },
          lines: {
            orderBy: { sortOrder: "asc" },
            select: {
              code: true,
              lot: true,
              designation: true,
              unit: true,
              declaredQuantity: true,
              computedQuantity: true,
              provenance: true,
              role: true,
            },
          },
        },
      });

  const quote = input.quoteId
    ? await prisma.commercialQuote.findFirst({
        where: { id: input.quoteId, organizationId: input.orgId },
        select: {
          id: true,
          number: true,
          subject: true,
          totalSellHt: true,
          currentVersionId: true,
        },
      })
    : await prisma.commercialQuote.findFirst({
        where: { organizationId: input.orgId, projectId: input.projectId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          number: true,
          subject: true,
          totalSellHt: true,
          currentVersionId: true,
        },
      });

  let quoteSections: unknown[] = [];
  if (quote?.currentVersionId) {
    const sections = await prisma.commercialQuoteSection.findMany({
      where: { versionId: quote.currentVersionId, organizationId: input.orgId },
      orderBy: { sortOrder: "asc" },
      include: {
        lines: {
          orderBy: { sortOrder: "asc" },
          select: {
            designation: true,
            description: true,
            unit: true,
            quantity: true,
            kind: true,
          },
        },
      },
    });
    quoteSections = sections.map((s) => ({
      title: s.title,
      lines: s.lines.map((l) => ({
        designation: l.designation,
        description: l.description,
        unit: l.unit,
        quantity: d(l.quantity),
        kind: l.kind,
      })),
    }));
  }

  return {
    format: "bework_metre_chatgpt_context_v1",
    project: {
      id: project.id,
      title: project.title,
      address: [project.siteAddress, project.siteCity].filter(Boolean).join(", "),
      description: project.description,
      client: project.client,
    },
    visit: visit
      ? {
          id: visit.id,
          subject: visit.subject,
          clientNeed: visit.clientNeed,
          comments: visit.comments,
          status: visit.status,
          zonesJson: visit.zonesJson,
          findingsJson: visit.findingsJson,
          proposedWorksJson: visit.proposedWorksJson,
          lotsJson: visit.lotsJson,
          prepJson: visit.prepJson,
          constraintsJson: visit.constraintsJson,
          field_notes: (() => {
            const prep =
              visit.prepJson && typeof visit.prepJson === "object"
                ? (visit.prepJson as Record<string, unknown>)
                : null;
            const fromPrep =
              typeof prep?.fieldNotes === "string" ? prep.fieldNotes.trim() : "";
            if (fromPrep) return fromPrep;
            return [visit.clientNeed, visit.comments, visit.subject]
              .filter(Boolean)
              .join("\n\n");
          })(),
          measurements: visit.measurements,
          photos: visit.medias.map((m) => ({
            id: m.id,
            caption: m.observation ?? m.name ?? null,
            category: m.category,
            kind: m.kind,
            fileUrl: m.fileUrl,
            storagePath: m.storagePath,
          })),
        }
      : null,
    study: study
      ? {
          id: study.id,
          title: study.title,
          version: study.version,
          trade: study.trade,
          hypothesesJson: study.hypothesesJson,
          sourcesJson: study.sourcesJson,
          parameters: study.parameters.map((p) => ({
            ...p,
            value: p.value != null ? d(p.value) : null,
          })),
          lines: study.lines.map((l) => ({
            ...l,
            declaredQuantity:
              l.declaredQuantity != null ? d(l.declaredQuantity) : null,
            computedQuantity:
              l.computedQuantity != null ? d(l.computedQuantity) : null,
          })),
        }
      : null,
    quote: quote
      ? {
          id: quote.id,
          number: quote.number,
          subject: quote.subject,
          totalSellHt: d(quote.totalSellHt),
          sections: quoteSections,
        }
      : null,
    instructions: [
      "Produis un JSON bework_prep_bundle_v1 (ou bework_takeoff_bundle_v1 legacy).",
      "Conserve les provenances : mesuré / calculé / projeté / estimé / à confirmer.",
      "Ne transforme jamais une hypothèse ou dimension projetée en mesure relevée.",
      "Structure par zones (Cuisine, Salle de bain, …) et ouvrages.",
      "N’invente pas de montants de devis — le devis existant reste la référence financière.",
    ],
  };
}
