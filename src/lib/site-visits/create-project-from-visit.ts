/**
 * Création d’un chantier depuis une visite existante (CAS B).
 * Transaction : Project + scopes + SiteVisit.projectId — données visite préservées.
 */
import { prisma } from "@/lib/prisma";
import { mapChantierToProjectStatus } from "@/lib/chantier-lifecycle";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import {
  codeFromScopeName,
  ensureProjectScope,
} from "@/lib/chantier/project-workspace";
import { findOrCreateExternalOrganization } from "@/lib/equipe-acces/external-org";
import { ensureProjectChannel } from "@/lib/messagerie/project-channels";
import { parseVisitPrep } from "@/lib/site-visits/types";
import { getSiteVisit } from "@/lib/site-visits/service";

export type CreateProjectFromVisitDraft = {
  visitId: string;
  clientName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  siteAddress: string;
  zipCode: string | null;
  city: string | null;
  worksDescription: string | null;
  lots: string[];
  proposedTitle: string;
  proposedScopes: string[];
  responsibleId: string | null;
  responsibleName: string | null;
  clientExternalOrgId: string | null;
  alreadyLinked: boolean;
  existingProjectId: string | null;
};

export function proposeProjectTitle(input: {
  clientName: string;
  lots?: string[] | null;
  clientNeed?: string | null;
  subject?: string | null;
}): string {
  const client = input.clientName.trim() || "Client";
  const lots = (input.lots ?? [])
    .map((l) => l.trim())
    .filter((l) => l && l.toLowerCase() !== "autre");
  if (lots.length === 1) {
    return `Travaux de ${lots[0]!.toLowerCase()} — ${client}`;
  }
  if (lots.length > 1) {
    return `${lots.slice(0, 3).join(" / ")} — ${client}`;
  }
  const need = input.clientNeed?.trim();
  if (need) {
    const short = need.length > 64 ? `${need.slice(0, 61)}…` : need;
    return `${short} — ${client}`;
  }
  const subject = input.subject?.trim();
  if (subject && !/^compte rendu/i.test(subject)) {
    return `${subject.slice(0, 64)} — ${client}`;
  }
  return `Chantier — ${client}`;
}

/** Extrait CP / ville depuis une adresse libre ou prep. */
export function splitVisitAddress(input: {
  siteAddress: string;
  prepZip?: string | null;
  prepCity?: string | null;
}): { addressLine: string; zipCode: string | null; city: string | null } {
  const zipCode = input.prepZip?.trim() || null;
  const city = input.prepCity?.trim() || null;
  const raw = input.siteAddress.trim();
  if (zipCode || city) {
    // Retirer CP/ville de la ligne si déjà séparés
    let addressLine = raw;
    if (zipCode) addressLine = addressLine.replace(new RegExp(`\\b${zipCode}\\b`, "g"), "");
    if (city) {
      addressLine = addressLine.replace(new RegExp(`,?\\s*${city}\\s*$`, "i"), "");
    }
    addressLine = addressLine.replace(/,\s*,/g, ",").replace(/,\s*$/, "").trim();
    return { addressLine: addressLine || raw, zipCode, city };
  }
  const m = raw.match(/^(.*?)[,\s]+(\d{5})\s+([^,]+)$/);
  if (m) {
    return {
      addressLine: m[1]!.trim().replace(/,$/, ""),
      zipCode: m[2]!,
      city: m[3]!.trim(),
    };
  }
  return { addressLine: raw, zipCode: null, city: null };
}

function parseLotsJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function buildCreateProjectFromVisitDraft(opts: {
  organizationId: string;
  visitId: string;
}): Promise<CreateProjectFromVisitDraft | null> {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: opts.visitId, organizationId: opts.organizationId },
    select: {
      id: true,
      clientName: true,
      contactPhone: true,
      contactName: true,
      siteAddress: true,
      clientNeed: true,
      subject: true,
      lotsJson: true,
      prepJson: true,
      projectId: true,
      clientExternalOrgId: true,
      responsibleId: true,
      responsible: { select: { id: true, name: true, email: true } },
    },
  });
  if (!visit) return null;

  const prep = parseVisitPrep(visit.prepJson);
  const lots = parseLotsJson(visit.lotsJson);
  const addr = splitVisitAddress({
    siteAddress: visit.siteAddress,
    prepZip: prep.zipCode,
    prepCity: prep.city,
  });

  return {
    visitId: visit.id,
    clientName: visit.clientName,
    contactPhone: visit.contactPhone,
    contactEmail: prep.contactEmail ?? null,
    siteAddress: addr.addressLine,
    zipCode: addr.zipCode,
    city: addr.city,
    worksDescription: visit.clientNeed,
    lots,
    proposedTitle: proposeProjectTitle({
      clientName: visit.clientName,
      lots,
      clientNeed: visit.clientNeed,
      subject: visit.subject,
    }),
    proposedScopes: lots.filter((l) => l.toLowerCase() !== "autre"),
    responsibleId: visit.responsibleId,
    responsibleName:
      visit.responsible?.name || visit.responsible?.email || null,
    clientExternalOrgId: visit.clientExternalOrgId,
    alreadyLinked: Boolean(visit.projectId),
    existingProjectId: visit.projectId,
  };
}

export type CreateProjectFromVisitInput = {
  organizationId: string;
  visitId: string;
  actorUserId: string;
  title: string;
  description?: string | null;
  siteAddress?: string | null;
  siteCity?: string | null;
  zipCode?: string | null;
  /** Métiers / scopes confirmés par l’utilisateur. */
  scopes?: string[] | null;
  assignedToId?: string | null;
};

export type CreateProjectFromVisitResult = {
  action: "created" | "already_linked";
  projectId: string;
  projectTitle: string;
  projectHref: string;
  visit: NonNullable<Awaited<ReturnType<typeof getSiteVisit>>>;
  scopesCreated: string[];
  clientExternalOrgId: string | null;
  clientCreated: boolean;
};

async function resolveOrgOwnerUserId(organizationId: string): Promise<string> {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId },
    select: { ownerUserId: true },
  });
  if (!org?.ownerUserId) throw new Error("Propriétaire organisation introuvable");
  return org.ownerUserId;
}

/**
 * Crée le Project + rattache la visite dans une transaction.
 * Idempotent si la visite est déjà liée.
 */
export async function createProjectFromVisit(
  input: CreateProjectFromVisitInput,
): Promise<CreateProjectFromVisitResult> {
  const title = input.title.trim();
  if (!title) throw new Error("Le nom du chantier est obligatoire");

  const visit = await prisma.siteVisit.findFirst({
    where: { id: input.visitId, organizationId: input.organizationId },
    select: {
      id: true,
      projectId: true,
      clientName: true,
      clientNeed: true,
      siteAddress: true,
      clientExternalOrgId: true,
      lotsJson: true,
      prepJson: true,
      responsibleId: true,
      organizationId: true,
    },
  });
  if (!visit) throw new Error("Visite introuvable");
  if (visit.organizationId !== input.organizationId) {
    throw new Error("Organisation incompatible");
  }

  if (visit.projectId) {
    const linked = await getSiteVisit(input.organizationId, visit.id);
    if (!linked) throw new Error("Visite introuvable");
    return {
      action: "already_linked",
      projectId: visit.projectId,
      projectTitle: linked.projectTitle || title,
      projectHref: linked.projectHref || `/dashboard/projets/${visit.projectId}`,
      visit: linked,
      scopesCreated: [],
      clientExternalOrgId: visit.clientExternalOrgId,
      clientCreated: false,
    };
  }

  const prep = parseVisitPrep(visit.prepJson);
  const addr = splitVisitAddress({
    siteAddress: input.siteAddress?.trim() || visit.siteAddress,
    prepZip: input.zipCode ?? prep.zipCode,
    prepCity: input.siteCity ?? prep.city,
  });

  const scopeNames = (input.scopes ?? parseLotsJson(visit.lotsJson))
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== "autre");

  const description =
    (input.description?.trim() ||
      visit.clientNeed?.trim() ||
      null) ?? null;

  let assignedToId: string | null = input.assignedToId?.trim() || null;
  if (!assignedToId && visit.responsibleId) {
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: visit.responsibleId,
        status: "ACTIVE",
      },
      select: { userId: true },
    });
    if (member) assignedToId = member.userId;
  }

  const clientUserId = await resolveOrgOwnerUserId(input.organizationId);

  // Client CRM : réutiliser si déjà lié, sinon find-or-create par nom (pas de doublon).
  let clientExternalOrgId = visit.clientExternalOrgId;
  let clientCreated = false;
  if (clientExternalOrgId) {
    const existing = await prisma.externalOrganization.findFirst({
      where: {
        id: clientExternalOrgId,
        hostOrganizationId: input.organizationId,
      },
      select: { id: true },
    });
    if (!existing) clientExternalOrgId = null;
  }
  if (!clientExternalOrgId && visit.clientName.trim()) {
    const before = await prisma.externalOrganization.findFirst({
      where: {
        hostOrganizationId: input.organizationId,
        name: { equals: visit.clientName.trim(), mode: "insensitive" },
        type: { in: ["CLIENT_EXT", "CLIENT"] },
      },
      select: { id: true },
    });
    if (before) {
      clientExternalOrgId = before.id;
    } else {
      clientExternalOrgId = await findOrCreateExternalOrganization({
        hostOrganizationId: input.organizationId,
        name: visit.clientName.trim(),
        personType: "CLIENT_EXT",
      });
      clientCreated = Boolean(clientExternalOrgId);
    }
  }

  let createdInThisCall = false;
  const projectId = await prisma.$transaction(async (tx) => {
    // Re-check race (double clic / double requête)
    const fresh = await tx.siteVisit.findFirst({
      where: { id: visit.id, organizationId: input.organizationId },
      select: { projectId: true },
    });
    if (fresh?.projectId) return fresh.projectId;

    const project = await tx.project.create({
      data: {
        title,
        description,
        clientId: clientUserId,
        organizationId: input.organizationId,
        siteAddress: addr.addressLine || visit.siteAddress,
        siteCity: addr.city,
        chantierStatus: "ETUDE",
        status: mapChantierToProjectStatus("ETUDE"),
        assignedToId,
        internalManager: null,
        notes: `Créé depuis la visite ${visit.id}`,
      },
      select: { id: true },
    });

    const linked = await tx.siteVisit.updateMany({
      where: { id: visit.id, organizationId: input.organizationId, projectId: null },
      data: { projectId: project.id },
    });

    if (linked.count === 0) {
      // Course : une autre requête a déjà rattaché — rollback du Project orphelin.
      await tx.project.delete({ where: { id: project.id } });
      const winner = await tx.siteVisit.findFirst({
        where: { id: visit.id },
        select: { projectId: true },
      });
      if (!winner?.projectId) {
        throw new Error("Rattachement visite impossible");
      }
      return winner.projectId;
    }

    createdInThisCall = true;
    return project.id;
  });

  // Scopes + dossiers hors transaction courte (idempotents)
  const scopesCreated: string[] = [];
  for (let i = 0; i < scopeNames.length; i++) {
    const name = scopeNames[i]!;
    const ensured = await ensureProjectScope({
      orgId: input.organizationId,
      projectId,
      code: codeFromScopeName(name).slice(0, 32) || `M${i + 1}`,
      name,
      displayOrder: i,
    });
    if (ensured.created) scopesCreated.push(name);
  }

  await ensureChantierFolders(projectId).catch(() => null);

  if (clientExternalOrgId) {
    await ensureProjectChannel({
      projectId,
      type: "CLIENT",
      externalOrganizationId: clientExternalOrgId,
    }).catch(() => null);
  }

  const serialized = await getSiteVisit(input.organizationId, visit.id);
  if (!serialized?.projectId) {
    throw new Error("Chantier créé mais visite non rattachée — contactez le support");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: input.organizationId },
    select: { id: true, title: true },
  });

  return {
    action: createdInThisCall ? "created" : "already_linked",
    projectId,
    projectTitle: project?.title || title,
    projectHref: `/dashboard/projets/${projectId}`,
    visit: serialized,
    scopesCreated: createdInThisCall ? scopesCreated : [],
    clientExternalOrgId,
    clientCreated: createdInThisCall ? clientCreated : false,
  };
}
