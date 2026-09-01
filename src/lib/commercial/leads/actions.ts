/**
 * Actions leads commerciaux (tenant-scoped).
 */
import type { CommercialLeadStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { leadDisplayName } from "@/lib/commercial/leads/labels";

export type LeadInput = {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  postalCode?: string | null;
  addressLine1?: string | null;
  needDescription?: string | null;
  workType?: string | null;
  sourceSite?: string | null;
  sourcePage?: string | null;
  status?: CommercialLeadStatus;
  notes?: string | null;
};

function clean(s: string | null | undefined): string | null {
  const t = (s ?? "").trim();
  return t.length ? t : null;
}

export async function createCommercialLead(opts: {
  organizationId: string;
  createdById: string;
  data: LeadInput;
}) {
  const firstName = opts.data.firstName.trim();
  const lastName = opts.data.lastName.trim();
  if (!firstName || !lastName) {
    throw new Error("Prénom et nom requis.");
  }

  return prisma.commercialLead.create({
    data: {
      organizationId: opts.organizationId,
      createdById: opts.createdById,
      firstName,
      lastName,
      phone: clean(opts.data.phone),
      email: clean(opts.data.email)?.toLowerCase() ?? null,
      city: clean(opts.data.city),
      postalCode: clean(opts.data.postalCode),
      addressLine1: clean(opts.data.addressLine1),
      needDescription: clean(opts.data.needDescription),
      workType: clean(opts.data.workType),
      sourceSite: clean(opts.data.sourceSite),
      sourcePage: clean(opts.data.sourcePage),
      status: opts.data.status ?? "NOUVEAU",
      notes: clean(opts.data.notes),
    },
  });
}

export async function updateCommercialLead(opts: {
  organizationId: string;
  leadId: string;
  data: Partial<LeadInput>;
}) {
  const existing = await prisma.commercialLead.findFirst({
    where: { id: opts.leadId, organizationId: opts.organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error("Lead introuvable.");

  const data: Prisma.CommercialLeadUpdateInput = {};
  if (opts.data.firstName != null) data.firstName = opts.data.firstName.trim();
  if (opts.data.lastName != null) data.lastName = opts.data.lastName.trim();
  if (opts.data.phone !== undefined) data.phone = clean(opts.data.phone);
  if (opts.data.email !== undefined)
    data.email = clean(opts.data.email)?.toLowerCase() ?? null;
  if (opts.data.city !== undefined) data.city = clean(opts.data.city);
  if (opts.data.postalCode !== undefined) data.postalCode = clean(opts.data.postalCode);
  if (opts.data.addressLine1 !== undefined)
    data.addressLine1 = clean(opts.data.addressLine1);
  if (opts.data.needDescription !== undefined)
    data.needDescription = clean(opts.data.needDescription);
  if (opts.data.workType !== undefined) data.workType = clean(opts.data.workType);
  if (opts.data.sourceSite !== undefined) data.sourceSite = clean(opts.data.sourceSite);
  if (opts.data.sourcePage !== undefined) data.sourcePage = clean(opts.data.sourcePage);
  if (opts.data.status != null) data.status = opts.data.status;
  if (opts.data.notes !== undefined) data.notes = clean(opts.data.notes);

  return prisma.commercialLead.update({ where: { id: opts.leadId }, data });
}

export async function scheduleLeadAppointment(opts: {
  organizationId: string;
  leadId: string;
  ownerUserId: string;
  startAt: Date;
  endAt: Date;
  location?: string | null;
  notes?: string | null;
  title?: string | null;
}) {
  const lead = await prisma.commercialLead.findFirst({
    where: { id: opts.leadId, organizationId: opts.organizationId },
  });
  if (!lead) throw new Error("Lead introuvable.");

  const title =
    opts.title?.trim() ||
    `RDV — ${leadDisplayName(lead)}${lead.city ? ` (${lead.city})` : ""}`;

  const location =
    clean(opts.location) ||
    [lead.addressLine1, lead.postalCode, lead.city].filter(Boolean).join(", ") ||
    null;

  const event = await prisma.agendaEvent.create({
    data: {
      organizationId: opts.organizationId,
      ownerUserId: opts.ownerUserId,
      createdById: opts.ownerUserId,
      title,
      description: clean(opts.notes) || lead.needDescription,
      location,
      type: "RDV_CLIENT",
      status: "PLANIFIE",
      startAt: opts.startAt,
      endAt: opts.endAt,
      commercialLeadId: lead.id,
    },
  });

  await prisma.commercialLead.update({
    where: { id: lead.id },
    data: {
      nextAppointmentAt: opts.startAt,
      status:
        lead.status === "NOUVEAU" || lead.status === "CONTACTE"
          ? "RDV_PLANIFIE"
          : lead.status,
    },
  });

  return event;
}

/** Convertit un lead gagné en client ExternalOrganization (sans doublon). */
export async function convertLeadToClient(opts: {
  organizationId: string;
  leadId: string;
}) {
  const lead = await prisma.commercialLead.findFirst({
    where: { id: opts.leadId, organizationId: opts.organizationId },
  });
  if (!lead) throw new Error("Lead introuvable.");
  if (lead.externalOrganizationId) {
    return { clientId: lead.externalOrganizationId, created: false };
  }

  const name = leadDisplayName(lead);
  const client = await prisma.externalOrganization.create({
    data: {
      hostOrganizationId: opts.organizationId,
      name,
      type: "CLIENT_EXT",
      status: "ACTIVE",
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      zipCode: lead.postalCode,
      address: lead.addressLine1,
      notes: [lead.needDescription, lead.notes].filter(Boolean).join("\n\n") || null,
      activity: lead.workType,
    },
  });

  await prisma.commercialLead.update({
    where: { id: lead.id },
    data: {
      externalOrganizationId: client.id,
      status: "GAGNE",
    },
  });

  return { clientId: client.id, created: true };
}
