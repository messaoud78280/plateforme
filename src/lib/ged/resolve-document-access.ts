/**
 * GED-V2A.1 — Resolver d’accès documentaire central.
 * ACL métier avant toute URL signée / stream. Pas de fallback public après ACL.
 */
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { canAccessGedFile } from "@/lib/ged/org-scope";
import { canAccessDocument } from "@/lib/documents/access";
import {
  isSharedVisibility,
  userHasProjectScope,
} from "@/lib/equipe-acces/project-access";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import {
  canListPurchaseOrders,
  isSupplierPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
  type PurchaseOrderSessionUser,
} from "@/lib/purchase-orders/access";
import {
  canAccessMessagerieMedia,
  type MessagerieMessageKind,
} from "@/lib/messagerie/media-acl";
import {
  isMessagerieMediaPath,
  MESSAGERIE_MEDIA_BUCKET,
  parseMessagerieStorageRef,
} from "@/lib/messagerie/media-storage";
import {
  DOCUMENTS_BUCKET,
  downloadStorageObject,
  extractStoragePathFromUrl,
} from "@/lib/storage/supabase-object";

export type DocumentAccessKind =
  | "CHANTIER_FILE"
  | "PURCHASE_ORDER_DOCUMENT"
  | "LEGACY_DOCUMENT"
  | "MESSAGERIE_MEDIA";

export type DocumentAccessUser = PurchaseOrderSessionUser & {
  role?: string | null;
};

export type DocumentAccessSource =
  | { kind: "CHANTIER_FILE"; id: string }
  | { kind: "PURCHASE_ORDER_DOCUMENT"; id: string }
  | { kind: "LEGACY_DOCUMENT"; id: string }
  | {
      kind: "MESSAGERIE_MEDIA";
      messageKind: MessagerieMessageKind;
      messageId: string;
      fileUrl: string;
    };

export type DocumentAccessOk = {
  ok: true;
  kind: DocumentAccessKind;
  resourceId: string;
  bucket: string;
  path: string;
  fileName: string;
  mimeType: string | null;
  storedUrl: string;
};

export type DocumentAccessDenied = {
  ok: false;
  status: number;
  error: string;
};

export type DocumentAccessResult = DocumentAccessOk | DocumentAccessDenied;

const SIGNED_TTL_SEC = 15 * 60;

function deny(status: number, error: string): DocumentAccessDenied {
  return { ok: false, status, error };
}

async function loadUserPersonType(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { personType: true, permissionProfile: true, role: true },
  });
}

/** ACL ChantierFile : chantier + scope documents + visibilité pour externes. */
async function resolveChantierFile(
  user: DocumentAccessUser,
  id: string,
): Promise<DocumentAccessResult> {
  const file = await prisma.chantierFile.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      fileUrl: true,
      mimeType: true,
      visibility: true,
      deletedAt: true,
      projectId: true,
      organizationId: true,
      clientId: true,
      project: {
        select: { id: true, clientId: true, organizationId: true, assignedToId: true },
      },
    },
  });
  if (!file || file.deletedAt || !file.fileUrl) {
    return deny(404, "Document introuvable.");
  }

  const access = await canAccessGedFile(user, file);
  if (!access.ok) return deny(403, "Non autorisé.");

  const dbUser = await loadUserPersonType(user.id);
  const personType = user.personType ?? dbUser?.personType ?? null;
  const permissionProfile = user.permissionProfile ?? dbUser?.permissionProfile ?? null;
  const external = isExternalPortalUser(personType);
  const isSupplier =
    personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";

  if (external) {
    if (!file.project) return deny(403, "Document interne — non partagé.");
    const scopeOk = await userHasProjectScope(user.id, file.project, "documents");
    if (!scopeOk) return deny(403, "Scope documents refusé.");

    if (isSupplier) {
      const vis = (file.visibility ?? "").toLowerCase();
      const intervenantShare =
        vis.includes("intervenant") ||
        vis.includes("temporaire") ||
        vis === "partage" ||
        vis === "partagé";
      if (!intervenantShare) {
        const u = await prisma.user.findUnique({
          where: { id: user.id },
          select: { externalOrganizationId: true },
        });
        if (!u?.externalOrganizationId) {
          return deny(403, "Document non partagé avec ce fournisseur.");
        }
        const supplierLink = await prisma.chantierFileLink.findFirst({
          where: {
            fileId: file.id,
            entityType: "supplier",
            entityId: u.externalOrganizationId,
          },
          select: { id: true },
        });
        if (!supplierLink) {
          const orderIds = (
            await prisma.purchaseOrder.findMany({
              where: {
                externalOrganizationId: u.externalOrganizationId,
                projectId: file.projectId,
              },
              select: { id: true },
              take: 80,
            })
          ).map((o) => o.id);
          const poLink =
            orderIds.length > 0
              ? await prisma.chantierFileLink.findFirst({
                  where: {
                    fileId: file.id,
                    entityType: "purchase_order",
                    entityId: { in: orderIds },
                  },
                  select: { id: true },
                })
              : null;
          if (!poLink) {
            return deny(403, "Document non partagé avec ce fournisseur.");
          }
        }
      }
    } else if (!isSharedVisibility(file.visibility)) {
      return deny(403, "Document interne — non partagé.");
    }
  }

  const parsedMsg = parseMessagerieStorageRef(file.fileUrl);
  if (parsedMsg && isMessagerieMediaPath(parsedMsg.bucket, parsedMsg.path)) {
    return {
      ok: true,
      kind: "CHANTIER_FILE",
      resourceId: file.id,
      bucket: parsedMsg.bucket,
      path: parsedMsg.path,
      fileName: file.name,
      mimeType: file.mimeType,
      storedUrl: file.fileUrl,
    };
  }

  const path = extractStoragePathFromUrl(file.fileUrl, DOCUMENTS_BUCKET);
  if (!path) return deny(400, "Référence stockage invalide.");

  return {
    ok: true,
    kind: "CHANTIER_FILE",
    resourceId: file.id,
    bucket: DOCUMENTS_BUCKET,
    path,
    fileName: file.name,
    mimeType: file.mimeType,
    storedUrl: file.fileUrl,
  };
}

async function resolvePurchaseOrderDocument(
  user: DocumentAccessUser,
  id: string,
): Promise<DocumentAccessResult> {
  if (!canListPurchaseOrders(user)) {
    return deny(403, "Non autorisé.");
  }

  const doc = await prisma.purchaseOrderDocument.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      fileUrl: true,
      orderId: true,
      order: {
        select: {
          id: true,
          organizationId: true,
          sharedWithSupplier: true,
          externalOrganizationId: true,
          projectId: true,
        },
      },
    },
  });
  if (!doc?.fileUrl) return deny(404, "Document introuvable.");

  const orgId = await resolvePurchaseOrderOrgId(user);
  if (!orgId || doc.order.organizationId !== orgId) {
    return deny(403, "Non autorisé.");
  }

  if (isSupplierPurchaseOrderActor(user)) {
    const u = await prisma.user.findUnique({
      where: { id: user.id },
      select: { externalOrganizationId: true },
    });
    if (
      !doc.order.sharedWithSupplier ||
      !u?.externalOrganizationId ||
      u.externalOrganizationId !== doc.order.externalOrganizationId
    ) {
      return deny(403, "Document non partagé avec ce fournisseur.");
    }
  }

  const path = extractStoragePathFromUrl(doc.fileUrl, DOCUMENTS_BUCKET);
  if (!path) return deny(400, "Référence stockage invalide.");

  return {
    ok: true,
    kind: "PURCHASE_ORDER_DOCUMENT",
    resourceId: doc.id,
    bucket: DOCUMENTS_BUCKET,
    path,
    fileName: doc.name,
    mimeType: null,
    storedUrl: doc.fileUrl,
  };
}

async function resolveLegacyDocument(
  user: DocumentAccessUser,
  id: string,
): Promise<DocumentAccessResult> {
  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      fileUrl: true,
      mimeType: true,
      clientId: true,
      projectId: true,
      task: { select: { clientId: true, assignedToId: true } },
    },
  });
  if (!doc?.fileUrl) return deny(404, "Document introuvable.");

  if (!canAccessDocument(user, doc)) {
    return deny(403, "Non autorisé.");
  }

  // Externe : si lié à un chantier, exiger scope + ne pas exposer sans partage explicite
  // (legacy Document n’a pas de visibility — refusé pour CLIENT_EXT / SUPPLIER)
  const dbUser = await loadUserPersonType(user.id);
  if (isExternalPortalUser(user.personType ?? dbUser?.personType)) {
    return deny(403, "Document legacy non accessible aux portails externes.");
  }

  const path = extractStoragePathFromUrl(doc.fileUrl, DOCUMENTS_BUCKET);
  if (!path) return deny(400, "Référence stockage invalide.");

  return {
    ok: true,
    kind: "LEGACY_DOCUMENT",
    resourceId: doc.id,
    bucket: DOCUMENTS_BUCKET,
    path,
    fileName: doc.name,
    mimeType: doc.mimeType,
    storedUrl: doc.fileUrl,
  };
}

async function resolveMessagerieMedia(
  user: DocumentAccessUser,
  source: Extract<DocumentAccessSource, { kind: "MESSAGERIE_MEDIA" }>,
): Promise<DocumentAccessResult> {
  const access = await canAccessMessagerieMedia(
    { id: user.id, role: user.role },
    {
      messageKind: source.messageKind,
      messageId: source.messageId,
      fileUrl: source.fileUrl,
    },
  );
  if (!access.ok) return deny(access.status, access.error);

  return {
    ok: true,
    kind: "MESSAGERIE_MEDIA",
    resourceId: source.messageId,
    bucket: access.bucket,
    path: access.path,
    fileName: access.path.split("/").pop() || "media",
    mimeType: null,
    storedUrl: source.fileUrl,
  };
}

export async function resolveDocumentAccess(
  user: DocumentAccessUser,
  source: DocumentAccessSource,
): Promise<DocumentAccessResult> {
  switch (source.kind) {
    case "CHANTIER_FILE":
      return resolveChantierFile(user, source.id);
    case "PURCHASE_ORDER_DOCUMENT":
      return resolvePurchaseOrderDocument(user, source.id);
    case "LEGACY_DOCUMENT":
      return resolveLegacyDocument(user, source.id);
    case "MESSAGERIE_MEDIA":
      return resolveMessagerieMedia(user, source);
    default:
      return deny(400, "Type de document inconnu.");
  }
}

/**
 * Retrouve une ressource DB à partir d’une URL stockée (compat SignedFileLink legacy).
 * Si aucune ressource → refus (plus de signature « URL seule »).
 */
export async function resolveDocumentAccessByStoredUrl(
  user: DocumentAccessUser,
  storedUrl: string,
  opts?: {
    messageKind?: MessagerieMessageKind;
    messageId?: string;
  },
): Promise<DocumentAccessResult> {
  const url = storedUrl.trim();
  if (!url) return deny(400, "URL requise.");

  const parsed = parseMessagerieStorageRef(url);
  if (parsed && isMessagerieMediaPath(parsed.bucket, parsed.path)) {
    if (!opts?.messageKind || !opts?.messageId) {
      // ChantierFile peut référencer un média messagerie — chercher le lien
      const cf = await prisma.chantierFile.findFirst({
        where: { fileUrl: url, deletedAt: null },
        select: { id: true },
      });
      if (cf) return resolveChantierFile(user, cf.id);
      return deny(
        403,
        "Média messagerie : messageKind et messageId requis, ou document GED lié.",
      );
    }
    return resolveMessagerieMedia(user, {
      kind: "MESSAGERIE_MEDIA",
      messageKind: opts.messageKind,
      messageId: opts.messageId,
      fileUrl: url,
    });
  }

  const [chantierFile, poDoc, legacy] = await Promise.all([
    prisma.chantierFile.findFirst({
      where: { fileUrl: url, deletedAt: null },
      select: { id: true },
    }),
    prisma.purchaseOrderDocument.findFirst({
      where: { fileUrl: url },
      select: { id: true },
    }),
    prisma.document.findFirst({
      where: { fileUrl: url },
      select: { id: true },
    }),
  ]);

  if (chantierFile) return resolveChantierFile(user, chantierFile.id);
  if (poDoc) return resolvePurchaseOrderDocument(user, poDoc.id);
  if (legacy) return resolveLegacyDocument(user, legacy.id);

  // Annexes (rapports, RDV, pilotage, skills, dico) — même bucket, ACL métier
  const annex = await resolveAnnexByStoredUrl(user, url);
  if (annex) return annex;

  return deny(403, "Fichier non rattaché à une ressource autorisée.");
}

async function okDocumentsRef(
  user: DocumentAccessUser,
  opts: {
    resourceId: string;
    kind: DocumentAccessKind;
    fileName: string;
    mimeType: string | null;
    storedUrl: string;
    projectId?: string | null;
    allowIf: () => Promise<boolean> | boolean;
  },
): Promise<DocumentAccessResult> {
  if (!(await opts.allowIf())) return deny(403, "Non autorisé.");
  const path = extractStoragePathFromUrl(opts.storedUrl, DOCUMENTS_BUCKET);
  if (!path) return deny(400, "Référence stockage invalide.");
  return {
    ok: true,
    kind: opts.kind,
    resourceId: opts.resourceId,
    bucket: DOCUMENTS_BUCKET,
    path,
    fileName: opts.fileName,
    mimeType: opts.mimeType,
    storedUrl: opts.storedUrl,
  };
}

async function resolveAnnexByStoredUrl(
  user: DocumentAccessUser,
  url: string,
): Promise<DocumentAccessResult | null> {
  const reportAtt = await prisma.reportAttachment.findFirst({
    where: { fileUrl: url },
    select: {
      id: true,
      name: true,
      mimeType: true,
      fileUrl: true,
      report: { select: { projectId: true, authorId: true } },
    },
  });
  if (reportAtt) {
    return okDocumentsRef(user, {
      resourceId: reportAtt.id,
      kind: "LEGACY_DOCUMENT",
      fileName: reportAtt.name,
      mimeType: reportAtt.mimeType,
      storedUrl: reportAtt.fileUrl,
      allowIf: async () => {
        if (reportAtt.report.authorId === user.id) return true;
        const a = await canAccessChantierProject(user, reportAtt.report.projectId);
        return a.ok;
      },
    });
  }

  const apptAtt = await prisma.appointmentAttachment.findFirst({
    where: { fileUrl: url },
    select: {
      id: true,
      name: true,
      mimeType: true,
      fileUrl: true,
      appointment: {
        select: { organizerId: true, clientId: true, projectId: true },
      },
    },
  });
  if (apptAtt) {
    return okDocumentsRef(user, {
      resourceId: apptAtt.id,
      kind: "LEGACY_DOCUMENT",
      fileName: apptAtt.name,
      mimeType: apptAtt.mimeType,
      storedUrl: apptAtt.fileUrl,
      allowIf: async () => {
        const a = apptAtt.appointment;
        if (a.organizerId === user.id || a.clientId === user.id) return true;
        if (user.role === "MANAGER" || user.role === "AGENCE") return true;
        if (a.projectId) {
          const access = await canAccessChantierProject(user, a.projectId);
          return access.ok;
        }
        return false;
      },
    });
  }

  const market = await prisma.pilotageMarketDocument.findFirst({
    where: { fileUrl: url },
    select: {
      id: true,
      title: true,
      fileName: true,
      mimeType: true,
      fileUrl: true,
      chantierFileId: true,
      pilotage: { select: { projectId: true } },
    },
  });
  if (market?.fileUrl) {
    if (market.chantierFileId) return resolveChantierFile(user, market.chantierFileId);
    return okDocumentsRef(user, {
      resourceId: market.id,
      kind: "CHANTIER_FILE",
      fileName: market.fileName || market.title,
      mimeType: market.mimeType,
      storedUrl: market.fileUrl,
      allowIf: async () => (await canAccessChantierProject(user, market.pilotage.projectId)).ok,
    });
  }

  const photo = await prisma.pilotagePhoto.findFirst({
    where: { fileUrl: url },
    select: {
      id: true,
      title: true,
      fileUrl: true,
      pilotage: { select: { projectId: true } },
    },
  });
  if (photo) {
    return okDocumentsRef(user, {
      resourceId: photo.id,
      kind: "CHANTIER_FILE",
      fileName: photo.title || "photo",
      mimeType: null,
      storedUrl: photo.fileUrl,
      allowIf: async () => (await canAccessChantierProject(user, photo.pilotage.projectId)).ok,
    });
  }

  const plan = await prisma.planRegister.findFirst({
    where: { OR: [{ fileUrl: url }, { proofUrl: url }] },
    select: {
      id: true,
      title: true,
      fileUrl: true,
      proofUrl: true,
      pilotage: { select: { projectId: true } },
    },
  });
  if (plan) {
    const stored = plan.fileUrl === url ? plan.fileUrl : plan.proofUrl;
    if (stored) {
      return okDocumentsRef(user, {
        resourceId: plan.id,
        kind: "CHANTIER_FILE",
        fileName: plan.title,
        mimeType: null,
        storedUrl: stored,
        allowIf: async () => (await canAccessChantierProject(user, plan.pilotage.projectId)).ok,
      });
    }
  }

  const doe = await prisma.doeItem.findFirst({
    where: { fileUrl: url },
    select: {
      id: true,
      title: true,
      fileUrl: true,
      pilotage: { select: { projectId: true } },
    },
  });
  if (doe?.fileUrl) {
    return okDocumentsRef(user, {
      resourceId: doe.id,
      kind: "CHANTIER_FILE",
      fileName: doe.title,
      mimeType: null,
      storedUrl: doe.fileUrl,
      allowIf: async () => (await canAccessChantierProject(user, doe.pilotage.projectId)).ok,
    });
  }

  const subDoc = await prisma.pilotageSubcontractorDoc.findFirst({
    where: { fileUrl: url },
    select: {
      id: true,
      docType: true,
      fileUrl: true,
      subcontractor: { select: { pilotage: { select: { projectId: true } } } },
    },
  });
  if (subDoc?.fileUrl) {
    return okDocumentsRef(user, {
      resourceId: subDoc.id,
      kind: "CHANTIER_FILE",
      fileName: subDoc.docType,
      mimeType: null,
      storedUrl: subDoc.fileUrl,
      allowIf: async () =>
        (await canAccessChantierProject(user, subDoc.subcontractor.pilotage.projectId)).ok,
    });
  }

  const cctp = await prisma.skillCctpFile.findFirst({
    where: { storageUrl: url },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      storageUrl: true,
      session: { select: { userId: true } },
    },
  });
  if (cctp?.storageUrl) {
    return okDocumentsRef(user, {
      resourceId: cctp.id,
      kind: "LEGACY_DOCUMENT",
      fileName: cctp.fileName,
      mimeType: cctp.mimeType,
      storedUrl: cctp.storageUrl,
      allowIf: () => cctp.session.userId === user.id || user.role === "MANAGER" || user.role === "AGENCE",
    });
  }

  const ppsps = await prisma.skillPpspsFile.findFirst({
    where: { storageUrl: url },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      storageUrl: true,
      session: { select: { userId: true } },
    },
  });
  if (ppsps?.storageUrl) {
    return okDocumentsRef(user, {
      resourceId: ppsps.id,
      kind: "LEGACY_DOCUMENT",
      fileName: ppsps.fileName,
      mimeType: ppsps.mimeType,
      storedUrl: ppsps.storageUrl,
      allowIf: () =>
        ppsps.session.userId === user.id || user.role === "MANAGER" || user.role === "AGENCE",
    });
  }

  const dico = await prisma.btpDictionaryTerm.findFirst({
    where: { imageUrl: url },
    select: { id: true, term: true, imageUrl: true },
  });
  if (dico?.imageUrl) {
    return okDocumentsRef(user, {
      resourceId: dico.id,
      kind: "LEGACY_DOCUMENT",
      fileName: dico.term,
      mimeType: "image/jpeg",
      storedUrl: dico.imageUrl,
      allowIf: () => Boolean(user.id),
    });
  }

  return null;
}

/** Signed URL courte — jamais de fallback URL publique après ACL. */
export async function issueDocumentSignedUrl(
  access: DocumentAccessOk,
  expiresIn = SIGNED_TTL_SEC,
): Promise<{ url: string; expiresIn: number } | { error: string; status: number }> {
  const supabase = createServiceRoleClient();
  if (!supabase) return { error: "Stockage indisponible", status: 503 };

  const ttl = Math.min(20 * 60, Math.max(60, expiresIn));
  const { data, error } = await supabase.storage
    .from(access.bucket)
    .createSignedUrl(access.path, ttl);

  if (error || !data?.signedUrl) {
    return { error: "Signature impossible", status: 500 };
  }
  return { url: data.signedUrl, expiresIn: ttl };
}

/** Stream binaire après ACL (preview / download). */
export async function streamDocumentBytes(access: DocumentAccessOk) {
  const supabase = createServiceRoleClient();
  if (!supabase) return null;
  return downloadStorageObject(supabase, access.bucket, access.path);
}

export { SIGNED_TTL_SEC, MESSAGERIE_MEDIA_BUCKET, DOCUMENTS_BUCKET };
