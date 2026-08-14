/**
 * DF-6D — Sous-traitance simple (suivi contractuel interne).
 * Aucun impact devis / TVA / situations / RG / acompte / prorata / facture / encaissement / CA.
 */
import type { CommercialSubcontractStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  SUBCONTRACT_STATUS_LABELS,
  canDeleteSubcontract,
  isSubcontractStatus,
  parseAmountHt,
  parseProgressPercent,
  realizedHtFromProgress,
  type SubcontractDto,
  type SubcontractInput,
  type SubcontractStatus,
} from "@/lib/commercial/subcontract-types";

export {
  SUBCONTRACT_STATUSES,
  SUBCONTRACT_STATUS_LABELS,
  canDeleteSubcontract,
  parseAmountHt,
  parseProgressPercent,
  realizedHtFromProgress,
  type SubcontractDto,
  type SubcontractInput,
  type SubcontractStatus,
} from "@/lib/commercial/subcontract-types";

function dateOrNull(v: string | null | undefined): Date | null {
  if (!v?.trim()) return null;
  const dte = new Date(`${v.trim()}T00:00:00.000Z`);
  if (Number.isNaN(dte.getTime())) throw new Error("Date invalide");
  return dte;
}

function isoDate(v: Date | null | undefined): string | null {
  if (!v) return null;
  return v.toISOString().slice(0, 10);
}

const includeCompany = {
  externalOrganization: {
    select: { id: true, name: true, tradeName: true },
  },
  contact: {
    select: { id: true, firstName: true, lastName: true },
  },
} satisfies Prisma.CommercialSubcontractInclude;

type Row = Prisma.CommercialSubcontractGetPayload<{ include: typeof includeCompany }>;

function toDto(row: Row): SubcontractDto {
  const amount = d(row.contractAmountHt);
  const progress =
    row.progressPercent == null ? null : d(row.progressPercent);
  const status = row.status as SubcontractStatus;
  return {
    id: row.id,
    projectId: row.projectId,
    externalOrganizationId: row.externalOrganizationId,
    companyName:
      row.externalOrganization.tradeName || row.externalOrganization.name,
    scope: row.scope,
    contractAmountHt: amount,
    status,
    statusLabel: SUBCONTRACT_STATUS_LABELS[status],
    contractRef: row.contractRef,
    contractDate: isoDate(row.contractDate),
    startDate: isoDate(row.startDate),
    endDate: isoDate(row.endDate),
    contactId: row.contactId,
    contactName: row.contact
      ? `${row.contact.firstName} ${row.contact.lastName}`.trim()
      : null,
    notes: row.notes,
    progressPercent: progress,
    realizedHt: realizedHtFromProgress(amount, progress),
    canDelete: canDeleteSubcontract(row),
  };
}

async function assertProjectInOrg(orgId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Chantier introuvable");
  return project;
}

async function assertExternalOrgInHost(orgId: string, externalOrganizationId: string) {
  const ext = await prisma.externalOrganization.findFirst({
    where: { id: externalOrganizationId, hostOrganizationId: orgId },
    select: { id: true },
  });
  if (!ext) throw new Error("Entreprise externe introuvable");
  return ext;
}

async function assertContactBelongs(
  orgId: string,
  contactId: string | null | undefined,
  externalOrganizationId: string,
) {
  if (!contactId) return;
  const c = await prisma.externalOrgContact.findFirst({
    where: {
      id: contactId,
      externalOrganizationId,
      externalOrganization: { hostOrganizationId: orgId },
    },
    select: { id: true },
  });
  if (!c) throw new Error("Contact introuvable pour cette entreprise");
}

export async function listSubcontracts(
  orgId: string,
  projectId: string,
): Promise<SubcontractDto[]> {
  await assertProjectInOrg(orgId, projectId);
  const rows = await prisma.commercialSubcontract.findMany({
    where: { organizationId: orgId, projectId },
    include: includeCompany,
    orderBy: { createdAt: "desc" },
  });
  const rank: Record<string, number> = {
    IN_PROGRESS: 0,
    PREPARATION: 1,
    COMPLETED: 2,
  };
  return rows
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
    .map(toDto);
}

export async function getSubcontract(
  orgId: string,
  id: string,
): Promise<SubcontractDto | null> {
  const row = await prisma.commercialSubcontract.findFirst({
    where: { id, organizationId: orgId },
    include: includeCompany,
  });
  return row ? toDto(row) : null;
}

export async function createSubcontract(opts: {
  orgId: string;
  projectId: string;
  data: SubcontractInput;
}): Promise<SubcontractDto> {
  await assertProjectInOrg(opts.orgId, opts.projectId);
  await assertExternalOrgInHost(opts.orgId, opts.data.externalOrganizationId);
  await assertContactBelongs(
    opts.orgId,
    opts.data.contactId,
    opts.data.externalOrganizationId,
  );

  const scope = opts.data.scope.trim();
  if (!scope) throw new Error("Lot / objet requis");
  const amount = parseAmountHt(opts.data.contractAmountHt);
  if (amount <= 0) throw new Error("Montant du contrat requis");
  const status: CommercialSubcontractStatus = isSubcontractStatus(opts.data.status)
    ? opts.data.status
    : "PREPARATION";
  const progress = parseProgressPercent(opts.data.progressPercent ?? null);

  const row = await prisma.commercialSubcontract.create({
    data: {
      organizationId: opts.orgId,
      projectId: opts.projectId,
      externalOrganizationId: opts.data.externalOrganizationId,
      scope,
      contractAmountHt: amount,
      status,
      contractRef: opts.data.contractRef?.trim() || null,
      contractDate: dateOrNull(opts.data.contractDate),
      startDate: dateOrNull(opts.data.startDate),
      endDate: dateOrNull(opts.data.endDate),
      contactId: opts.data.contactId || null,
      notes: opts.data.notes?.trim() || null,
      progressPercent: progress,
    },
    include: includeCompany,
  });
  return toDto(row);
}

export async function updateSubcontract(opts: {
  orgId: string;
  id: string;
  data: Partial<SubcontractInput>;
}): Promise<SubcontractDto> {
  const existing = await prisma.commercialSubcontract.findFirst({
    where: { id: opts.id, organizationId: opts.orgId },
    select: { id: true, externalOrganizationId: true },
  });
  if (!existing) throw new Error("Sous-traitant introuvable");

  const nextOrgId =
    opts.data.externalOrganizationId ?? existing.externalOrganizationId;
  if (opts.data.externalOrganizationId) {
    await assertExternalOrgInHost(opts.orgId, opts.data.externalOrganizationId);
  }
  const contactId =
    opts.data.contactId === undefined ? undefined : opts.data.contactId;
  if (contactId !== undefined) {
    await assertContactBelongs(opts.orgId, contactId, nextOrgId);
  }

  const data: Prisma.CommercialSubcontractUpdateInput = {};
  if (opts.data.scope != null) {
    const scope = opts.data.scope.trim();
    if (!scope) throw new Error("Lot / objet requis");
    data.scope = scope;
  }
  if (opts.data.contractAmountHt != null) {
    const amount = parseAmountHt(opts.data.contractAmountHt);
    if (amount <= 0) throw new Error("Montant du contrat requis");
    data.contractAmountHt = amount;
  }
  if (opts.data.status != null) {
    if (!isSubcontractStatus(opts.data.status)) throw new Error("Statut invalide");
    data.status = opts.data.status;
  }
  if (opts.data.contractRef !== undefined) {
    data.contractRef = opts.data.contractRef?.trim() || null;
  }
  if (opts.data.contractDate !== undefined) {
    data.contractDate = dateOrNull(opts.data.contractDate);
  }
  if (opts.data.startDate !== undefined) {
    data.startDate = dateOrNull(opts.data.startDate);
  }
  if (opts.data.endDate !== undefined) {
    data.endDate = dateOrNull(opts.data.endDate);
  }
  if (opts.data.notes !== undefined) {
    data.notes = opts.data.notes?.trim() || null;
  }
  if (opts.data.progressPercent !== undefined) {
    data.progressPercent = parseProgressPercent(opts.data.progressPercent);
  }
  if (opts.data.externalOrganizationId) {
    data.externalOrganization = {
      connect: { id: opts.data.externalOrganizationId },
    };
  }
  if (contactId !== undefined) {
    data.contact = contactId
      ? { connect: { id: contactId } }
      : { disconnect: true };
  }

  const row = await prisma.commercialSubcontract.update({
    where: { id: existing.id },
    data,
    include: includeCompany,
  });
  return toDto(row);
}

export async function deleteSubcontract(orgId: string, id: string): Promise<void> {
  const row = await prisma.commercialSubcontract.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, status: true, progressPercent: true },
  });
  if (!row) throw new Error("Sous-traitant introuvable");
  if (!canDeleteSubcontract(row)) {
    throw new Error(
      "Ce suivi a un historique — passez-le en Terminé plutôt que de le supprimer",
    );
  }
  await prisma.commercialSubcontract.delete({ where: { id: row.id } });
}

export async function completeSubcontract(
  orgId: string,
  id: string,
): Promise<SubcontractDto> {
  return updateSubcontract({
    orgId,
    id,
    data: { status: "COMPLETED" },
  });
}

export async function getExternalOrgForSubcontract(opts: {
  orgId: string;
  id: string;
}) {
  return prisma.externalOrganization.findFirst({
    where: {
      id: opts.id,
      hostOrganizationId: opts.orgId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      activity: true,
      city: true,
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }],
        take: 8,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isPrimary: true,
        },
      },
    },
  });
}

export async function searchExternalOrgsForSubcontract(opts: {
  orgId: string;
  query: string;
}) {
  const q = opts.query.trim();
  return prisma.externalOrganization.findMany({
    where: {
      hostOrganizationId: opts.orgId,
      status: "ACTIVE",
      type: { in: ["SUBCONTRACTOR", "SUPPLIER", "PARTNER"] },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { tradeName: { contains: q, mode: "insensitive" } },
              { activity: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      activity: true,
      city: true,
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }],
        take: 8,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isPrimary: true,
        },
      },
    },
    orderBy: { name: "asc" },
    take: 20,
  });
}

export async function quickCreateSubcontractorOrg(opts: {
  orgId: string;
  name: string;
}) {
  const name = opts.name.trim();
  if (!name) throw new Error("Nom d’entreprise requis");
  const existing = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: opts.orgId,
      name: { equals: name, mode: "insensitive" },
      type: { in: ["SUBCONTRACTOR", "SUPPLIER", "PARTNER"] },
    },
    select: { id: true, name: true, tradeName: true, type: true },
  });
  if (existing) return existing;
  return prisma.externalOrganization.create({
    data: {
      hostOrganizationId: opts.orgId,
      name,
      type: "SUBCONTRACTOR",
      status: "ACTIVE",
    },
    select: { id: true, name: true, tradeName: true, type: true },
  });
}
