/**
 * Export PDF canonique dossier chantier — une entrée, sections typées.
 * Réutilise les générateurs existants (visite, devis, CR/notice) + pdf métré/planning/suivi.
 */
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { getUserOrganizationIds } from "@/lib/organization/access";
import { isBeworkStaff } from "@/lib/authz";
import {
  resolveCurrentSchedulePlan,
  resolvePrepStudyForWorkspace,
} from "@/lib/chantier/resolve-workspace-entities";
import { buildSectionPdfFilename } from "@/lib/chantier/pdf/filename";
import { generateTakeoffPdf } from "@/lib/chantier/pdf/takeoff-pdf";
import { generatePlanningPdf } from "@/lib/chantier/pdf/planning-pdf";
import { generateFollowUpPdf } from "@/lib/chantier/pdf/follow-up-pdf";
import { generateSiteReportPdf } from "@/lib/site-documents/pdf";
import type { SiteReportPayload } from "@/lib/site-documents/types";
import { generateCurrentQuotePdfPreview } from "@/lib/commercial/accepted-snapshot";
import { fmtDate } from "@/lib/commercial/pdf/format";
import {
  generateSiteSurveyPdf,
  type SurveyVisitInput,
} from "@/lib/site-visits/survey-export";
import { createServiceRoleClient } from "@/lib/supabase";
import { getSiteVisit } from "@/lib/site-visits/service";

export type ProjectPdfSection =
  | "VISIT"
  | "TAKEOFF"
  | "QUOTE"
  | "PLANNING"
  | "FOLLOW_UP"
  | "REPORT"
  | "NOTICE";

export type ExportProjectSectionPdfResult =
  | {
      ok: true;
      bytes: Uint8Array;
      filename: string;
      contentType: "application/pdf" | "application/zip";
    }
  | { ok: false; status: number; error: string };

async function loadProjectMeta(projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      siteAddress: true,
      siteCity: true,
      organizationId: true,
      clientId: true,
      archivedAt: true,
      client: { select: { name: true, company: true } },
      organization: { select: { name: true } },
    },
  });
}

async function assertProjectPdfAccess(
  user: { id: string; role?: string | null },
  projectId: string,
): Promise<
  | { ok: true; project: NonNullable<Awaited<ReturnType<typeof loadProjectMeta>>> }
  | { ok: false; status: number; error: string }
> {
  const access = await canAccessChantierProject(user, projectId);
  if (!access.ok || !access.project) {
    return { ok: false, status: 403, error: "Accès chantier refusé." };
  }
  const project = await loadProjectMeta(projectId);
  if (!project) {
    return { ok: false, status: 404, error: "Chantier introuvable." };
  }
  if (project.organizationId && !isBeworkStaff(user)) {
    const orgs = await getUserOrganizationIds(user.id);
    if (!orgs.includes(project.organizationId)) {
      return {
        ok: false,
        status: 403,
        error: "Ce chantier appartient à une autre organisation.",
      };
    }
  }
  return { ok: true, project };
}

function clientLabel(project: NonNullable<Awaited<ReturnType<typeof loadProjectMeta>>>) {
  return project.client.company?.trim() || project.client.name?.trim() || null;
}

export async function exportProjectSectionPdf(opts: {
  projectId: string;
  section: ProjectPdfSection;
  entityId?: string | null;
  user: { id: string; role?: string | null };
}): Promise<ExportProjectSectionPdfResult> {
  const gate = await assertProjectPdfAccess(opts.user, opts.projectId);
  if (!gate.ok) return gate;
  const { project } = gate;
  const orgId = project.organizationId;
  if (!orgId) {
    return { ok: false, status: 400, error: "Organisation chantier manquante." };
  }

  const meta = {
    projectTitle: project.title,
    clientLabel: clientLabel(project),
    siteAddress: project.siteAddress,
    siteCity: project.siteCity,
    companyLabel: project.organization?.name ?? null,
    editedAt: new Date(),
  };

  switch (opts.section) {
    case "VISIT": {
      const visitRow = opts.entityId
        ? await prisma.siteVisit.findFirst({
            where: { id: opts.entityId, organizationId: orgId, projectId: project.id },
            select: { id: true },
          })
        : await prisma.siteVisit.findFirst({
            where: { organizationId: orgId, projectId: project.id },
            orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
            select: { id: true },
          });
      if (!visitRow) {
        return { ok: false, status: 404, error: "Aucune visite liée à ce chantier." };
      }
      const full = await getSiteVisit(orgId, visitRow.id);
      if (!full) {
        return { ok: false, status: 404, error: "Visite introuvable." };
      }
      const prep = full.prep ?? {};
      const input: SurveyVisitInput = {
        id: full.id,
        clientName: full.clientName,
        siteName: full.siteName,
        siteAddress: full.siteAddress,
        contactName: full.contactName,
        contactPhone: full.contactPhone,
        contactEmail: prep.contactEmail ?? null,
        responsibleName: full.responsibleName ?? null,
        zipCode: prep.zipCode ?? null,
        city: prep.city ?? null,
        subject: full.subject,
        clientNeed: full.clientNeed,
        scheduledAt: full.scheduledAt
          ? typeof full.scheduledAt === "string"
            ? full.scheduledAt
            : new Date(full.scheduledAt as string | number | Date).toISOString()
          : null,
        status: full.status,
        lots: full.lots ?? [],
        zones: full.zones ?? [],
        constraints: full.constraints as SurveyVisitInput["constraints"],
        findings: (full.findings ?? []) as SurveyVisitInput["findings"],
        proposedWorks: (full.proposedWorks ?? []) as SurveyVisitInput["proposedWorks"],
        commercial: (full.commercial ?? {}) as SurveyVisitInput["commercial"],
        lotSheets: prep.lotSheets ?? {},
        comments: full.comments ?? null,
        fieldNotes: prep.fieldNotes ?? null,
        measurements: full.measurements.map((m) => ({
          id: m.id,
          zone: m.zone,
          label: m.label,
          measureType: m.measureType,
          lengthM: m.lengthM,
          widthM: m.widthM,
          heightM: m.heightM,
          quantityValue: m.quantityValue,
          unit: m.unit,
          computedQuantity: m.computedQuantity,
          grossQuantity: m.grossQuantity,
          observation: m.observation,
          lot: m.lot ?? null,
        })),
        missingInfos: full.missingInfos.map((i) => ({
          id: i.id,
          label: i.label,
          comment: i.comment ?? null,
          open: i.open,
          checkStatus: i.checkStatus ?? null,
          category: i.category ?? null,
        })),
        medias: full.medias.map((m) => ({
          id: m.id,
          zone: m.zone ?? null,
          kind: m.kind,
          name: m.name,
          caption: m.caption,
          category: m.category ?? null,
          observation: m.observation ?? null,
          hypothesis: m.hypothesis ?? null,
          measurementId: m.measurementId ?? null,
          fileUrl: m.fileUrl ?? null,
          storagePath: m.storagePath ?? null,
        })),
      };
      // Max 8 photos pour perf — ratio conservé par le générateur existant.
      const photoBytes: Array<{ caption: string; bytes: Uint8Array }> = [];
      const supabase = createServiceRoleClient();
      if (supabase) {
        for (const m of input.medias.filter((x) => x.kind === "PHOTO").slice(0, 8)) {
          if (!m.storagePath) continue;
          try {
            const { data, error } = await supabase.storage
              .from("documents")
              .download(m.storagePath);
            if (error || !data) continue;
            photoBytes.push({
              caption: [m.zone, m.caption].filter(Boolean).join(" — ") || m.name,
              bytes: new Uint8Array(await data.arrayBuffer()),
            });
          } catch {
            /* skip */
          }
        }
      }
      const bytes = generateSiteSurveyPdf(input, { photoBytes });
      const day = full.scheduledAt
        ? String(full.scheduledAt).slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      return {
        ok: true,
        bytes,
        filename: buildSectionPdfFilename({
          projectTitle: project.title,
          sectionLabel: "Visite",
          suffix: day,
        }),
        contentType: "application/pdf",
      };
    }

    case "TAKEOFF": {
      const studies = await prisma.prepStudy.findMany({
        where: { projectId: project.id, organizationId: orgId, archivedAt: null },
        select: { id: true, scopeId: true, sourcesJson: true, version: true, dossierStatus: true },
      });
      const scopes = await prisma.projectScope.findMany({
        where: { projectId: project.id, organizationId: orgId },
        select: {
          id: true,
          referenceStudyId: true,
          referenceQuoteId: true,
          referenceSchedulePlanId: true,
        },
      });
      const study =
        (opts.entityId
          ? studies.find((s) => s.id === opts.entityId) ?? null
          : null) ?? resolvePrepStudyForWorkspace({ studies, scopes });
      if (!study) {
        return { ok: false, status: 404, error: "Aucun métré CURRENT pour ce chantier." };
      }
      const lines = await prisma.prepTakeoffLine.findMany({
        where: { studyId: study.id, organizationId: orgId },
        orderBy: [{ lot: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
        select: {
          code: true,
          lot: true,
          designation: true,
          unit: true,
          provenance: true,
          declaredQuantity: true,
          computedQuantity: true,
          validatedQuantity: true,
          notes: true,
        },
      });
      const bytes = generateTakeoffPdf({
        meta: { ...meta, revisionLabel: `v${study.version}` },
        versionLabel: `v${study.version}`,
        statusLabel: study.dossierStatus,
        lines: lines.map((l) => ({
          code: l.code,
          lot: l.lot,
          designation: l.designation,
          quantity:
            l.validatedQuantity != null
              ? Number(l.validatedQuantity)
              : l.computedQuantity != null
                ? Number(l.computedQuantity)
                : l.declaredQuantity != null
                  ? Number(l.declaredQuantity)
                  : null,
          unit: l.unit,
          provenance: l.provenance,
          notes: l.notes,
        })),
      });
      return {
        ok: true,
        bytes,
        filename: buildSectionPdfFilename({
          projectTitle: project.title,
          sectionLabel: "Metre",
          suffix: `v${study.version}`,
        }),
        contentType: "application/pdf",
      };
    }

    case "QUOTE": {
      const quote = opts.entityId
        ? await prisma.commercialQuote.findFirst({
            where: { id: opts.entityId, organizationId: orgId, projectId: project.id },
            select: { id: true, number: true },
          })
        : await prisma.commercialQuote.findFirst({
            where: { organizationId: orgId, projectId: project.id },
            orderBy: { updatedAt: "desc" },
            select: { id: true, number: true },
          });
      if (!quote) {
        return { ok: false, status: 404, error: "Aucun devis lié à ce chantier." };
      }
      const preview = await generateCurrentQuotePdfPreview(orgId, quote.id);
      if (!preview) {
        return { ok: false, status: 404, error: "Impossible de générer le PDF devis." };
      }
      return {
        ok: true,
        bytes: new Uint8Array(preview.buffer),
        filename: buildSectionPdfFilename({
          projectTitle: project.title,
          sectionLabel: "Devis",
          suffix: quote.number,
        }),
        contentType: "application/pdf",
      };
    }

    case "PLANNING": {
      const studies = await prisma.prepStudy.findMany({
        where: { projectId: project.id, organizationId: orgId, archivedAt: null },
        select: { id: true, scopeId: true, sourcesJson: true },
      });
      const scopes = await prisma.projectScope.findMany({
        where: { projectId: project.id, organizationId: orgId },
        select: {
          id: true,
          referenceStudyId: true,
          referenceQuoteId: true,
          referenceSchedulePlanId: true,
        },
      });
      const study = resolvePrepStudyForWorkspace({ studies, scopes });
      const plans = await prisma.prepSchedulePlan.findMany({
        where: {
          projectId: project.id,
          organizationId: orgId,
          ...(study ? { studyId: study.id } : {}),
        },
        select: {
          id: true,
          studyId: true,
          scopeId: true,
          status: true,
          revisionKind: true,
          revisionNumber: true,
          createdAt: true,
          startDate: true,
          endDateBase: true,
          endDateWithConditional: true,
        },
      });
      const plan =
        (opts.entityId ? plans.find((p) => p.id === opts.entityId) : null) ??
        resolveCurrentSchedulePlan(plans);
      if (!plan) {
        return { ok: false, status: 404, error: "Aucun planning CURRENT pour ce chantier." };
      }
      const tasks = await prisma.prepScheduleTask.findMany({
        where: { planId: plan.id, organizationId: orgId, includeInBase: true },
        orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
        select: {
          name: true,
          lot: true,
          kind: true,
          startDate: true,
          endDate: true,
          durationDays: true,
          holdPoint: true,
          holdPointStatus: true,
          crewJson: true,
        },
      });
      const alerts = tasks
        .filter((t) => t.holdPoint && t.holdPointStatus !== "VALIDE")
        .map((t) => `Point d’arrêt : ${t.name}`)
        .slice(0, 12);
      const rev = `rev${plan.revisionNumber ?? 1}`;
      const planEnd = plan.endDateWithConditional ?? plan.endDateBase;
      const bytes = generatePlanningPdf({
        meta: { ...meta, revisionLabel: rev },
        revisionLabel: rev,
        startDate: plan.startDate,
        endDate: planEnd,
        alerts,
        tasks: tasks.map((t) => {
          const crew = t.crewJson as { label?: string; name?: string } | null;
          return {
            name: t.name,
            lot: t.lot,
            team: crew?.label || crew?.name || null,
            startDate: t.startDate,
            endDate: t.endDate,
            durationDays: t.durationDays != null ? Number(t.durationDays) : null,
            kind: t.kind,
            alert: t.holdPoint && t.holdPointStatus !== "VALIDE" ? "hold" : null,
          };
        }),
      });
      return {
        ok: true,
        bytes,
        filename: buildSectionPdfFilename({
          projectTitle: project.title,
          sectionLabel: "Planning",
          suffix: rev,
        }),
        contentType: "application/pdf",
      };
    }

    case "FOLLOW_UP": {
      const sheet = opts.entityId
        ? await prisma.followUpSheet.findFirst({
            where: { id: opts.entityId, organizationId: orgId, projectId: project.id },
          })
        : await prisma.followUpSheet.findFirst({
            where: { organizationId: orgId, projectId: project.id },
            orderBy: { updatedAt: "desc" },
          });
      if (!sheet) {
        return { ok: false, status: 404, error: "Aucune fiche de suivi pour ce chantier." };
      }
      const bytes = generateFollowUpPdf({
        meta,
        sheetTitle: sheet.title || "Suivi chantier",
        statusLabel: String(sheet.status),
        observations: sheet.notes ? [sheet.notes] : [],
        nextActions: sheet.nextAction ? [sheet.nextAction] : [],
      });
      const day = (sheet.updatedAt ?? new Date()).toISOString().slice(0, 10);
      return {
        ok: true,
        bytes,
        filename: buildSectionPdfFilename({
          projectTitle: project.title,
          sectionLabel: "Suivi",
          suffix: day,
        }),
        contentType: "application/pdf",
      };
    }

    case "REPORT":
    case "NOTICE": {
      const kind = opts.section === "REPORT" ? "COMPTE_RENDU" : "NOTICE";
      const doc = opts.entityId
        ? await prisma.siteDocument.findFirst({
            where: {
              id: opts.entityId,
              organizationId: orgId,
              projectId: project.id,
              kind,
            },
          })
        : await prisma.siteDocument.findFirst({
            where: { organizationId: orgId, projectId: project.id, kind },
            orderBy: { updatedAt: "desc" },
          });
      if (!doc) {
        return {
          ok: false,
          status: 404,
          error:
            opts.section === "REPORT"
              ? "Aucun compte rendu pour ce chantier."
              : "Aucune notice explicative pour ce chantier.",
        };
      }
      const bytes = generateSiteReportPdf({
        meta: {
          projectTitle: project.title,
          siteAddress: [project.siteAddress, project.siteCity].filter(Boolean).join(", "),
          clientLabel: clientLabel(project),
          companyLabel: project.organization?.name ?? null,
          number: doc.number,
          status: doc.status,
        },
        payload: doc.payloadJson as unknown as SiteReportPayload,
      });
      const label = opts.section === "REPORT" ? "Compte-rendu" : "Notice";
      const day = (doc.updatedAt ?? new Date()).toISOString().slice(0, 10);
      return {
        ok: true,
        bytes,
        filename: buildSectionPdfFilename({
          projectTitle: project.title,
          sectionLabel: label,
          suffix: opts.section === "NOTICE" ? null : day,
        }),
        contentType: "application/pdf",
      };
    }

    default:
      return { ok: false, status: 400, error: "Section PDF inconnue." };
  }
}

export const PROJECT_PDF_SECTIONS: ProjectPdfSection[] = [
  "VISIT",
  "TAKEOFF",
  "QUOTE",
  "PLANNING",
  "FOLLOW_UP",
  "REPORT",
  "NOTICE",
];

/** Export multi-sections (ZIP) — dossier synthétique sans usine à gaz. */
export async function exportProjectDossierZip(opts: {
  projectId: string;
  user: { id: string; role?: string | null };
  sections?: ProjectPdfSection[];
}): Promise<ExportProjectSectionPdfResult> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const sections = opts.sections ?? PROJECT_PDF_SECTIONS;
  let added = 0;
  for (const section of sections) {
    const result = await exportProjectSectionPdf({
      projectId: opts.projectId,
      section,
      user: opts.user,
    });
    if (result.ok) {
      zip.file(result.filename, result.bytes);
      added += 1;
    }
  }
  if (added === 0) {
    return {
      ok: false,
      status: 404,
      error: "Aucune section exportable pour ce chantier.",
    };
  }
  const project = await loadProjectMeta(opts.projectId);
  const buf = await zip.generateAsync({ type: "uint8array" });
  return {
    ok: true,
    bytes: buf,
    filename: buildSectionPdfFilename({
      projectTitle: project?.title ?? "Chantier",
      sectionLabel: "Dossier",
      suffix: fmtDate(new Date()).replace(/\//g, "-"),
    }).replace(/\.pdf$/i, ".zip"),
    contentType: "application/zip",
  };
}
