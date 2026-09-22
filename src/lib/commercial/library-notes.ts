/**
 * Notes datées sur ouvrages commerciaux.
 * Les notes INTERNAL ne doivent jamais être poussées automatiquement dans un devis.
 */
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { recordLibraryHistoryEvent } from "@/lib/commercial/library";

export const LIBRARY_NOTE_KINDS = [
  "INTERNAL",
  "IMPLEMENTATION",
  "VIGILANCE",
  "SUPPLIER",
  "COMMENT",
  "OTHER",
] as const;

export type LibraryNoteKind = (typeof LIBRARY_NOTE_KINDS)[number];

export const LIBRARY_NOTE_KIND_LABELS: Record<LibraryNoteKind, string> = {
  INTERNAL: "Note interne",
  IMPLEMENTATION: "Conseil de mise en œuvre",
  VIGILANCE: "Point de vigilance",
  SUPPLIER: "Information fournisseur",
  COMMENT: "Commentaire",
  OTHER: "Autre",
};

/** Ne jamais inclure dans snapshots devis / PDF client. */
export function isClientSafeNoteKind(kind: string): boolean {
  return kind !== "INTERNAL";
}

function assertKind(kind: string): LibraryNoteKind {
  if ((LIBRARY_NOTE_KINDS as readonly string[]).includes(kind)) {
    return kind as LibraryNoteKind;
  }
  throw new Error("Catégorie de note invalide");
}

async function assertWorkItem(orgId: string, workItemId: string) {
  const wi = await prisma.commercialWorkItem.findFirst({
    where: { id: workItemId, organizationId: orgId },
    select: { id: true },
  });
  if (!wi) throw new Error("Ouvrage introuvable");
}

export async function listLibraryNotes(orgId: string, workItemId: string) {
  await assertWorkItem(orgId, workItemId);
  return prisma.commercialLibraryNote.findMany({
    where: { organizationId: orgId, workItemId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true } } },
  });
}

export async function createLibraryNote(opts: {
  orgId: string;
  workItemId: string;
  kind: string;
  body: string;
  createdById?: string | null;
}) {
  await assertWorkItem(opts.orgId, opts.workItemId);
  const kind = assertKind(opts.kind);
  const body = opts.body.trim();
  if (!body) throw new Error("Contenu de la note requis");

  const note = await prisma.commercialLibraryNote.create({
    data: {
      id: `cln_${randomBytes(12).toString("hex")}`,
      organizationId: opts.orgId,
      workItemId: opts.workItemId,
      kind,
      body,
      createdById: opts.createdById ?? null,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  await recordLibraryHistoryEvent(opts.orgId, opts.workItemId, {
    label: `Note ajoutée (${LIBRARY_NOTE_KIND_LABELS[kind]})`,
    detail: body.slice(0, 200),
    toStatus: "note_added",
    actorUserId: opts.createdById ?? null,
  });

  return note;
}

export async function updateLibraryNote(opts: {
  orgId: string;
  workItemId: string;
  noteId: string;
  kind?: string;
  body?: string;
  actorUserId?: string | null;
}) {
  await assertWorkItem(opts.orgId, opts.workItemId);
  const existing = await prisma.commercialLibraryNote.findFirst({
    where: {
      id: opts.noteId,
      organizationId: opts.orgId,
      workItemId: opts.workItemId,
    },
  });
  if (!existing) throw new Error("Note introuvable");

  const kind = opts.kind !== undefined ? assertKind(opts.kind) : undefined;
  const body = opts.body !== undefined ? opts.body.trim() : undefined;
  if (body !== undefined && !body) throw new Error("Contenu de la note requis");

  const note = await prisma.commercialLibraryNote.update({
    where: { id: opts.noteId },
    data: {
      ...(kind !== undefined ? { kind } : {}),
      ...(body !== undefined ? { body } : {}),
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  await recordLibraryHistoryEvent(opts.orgId, opts.workItemId, {
    label: "Note modifiée",
    detail: note.body.slice(0, 200),
    toStatus: "note_updated",
    actorUserId: opts.actorUserId ?? null,
  });

  return note;
}

export async function deleteLibraryNote(opts: {
  orgId: string;
  workItemId: string;
  noteId: string;
  actorUserId?: string | null;
}) {
  await assertWorkItem(opts.orgId, opts.workItemId);
  const existing = await prisma.commercialLibraryNote.findFirst({
    where: {
      id: opts.noteId,
      organizationId: opts.orgId,
      workItemId: opts.workItemId,
    },
  });
  if (!existing) throw new Error("Note introuvable");

  await prisma.commercialLibraryNote.delete({ where: { id: opts.noteId } });

  await recordLibraryHistoryEvent(opts.orgId, opts.workItemId, {
    label: "Note supprimée",
    detail: existing.body.slice(0, 120),
    toStatus: "note_deleted",
    actorUserId: opts.actorUserId ?? null,
  });

  return { deleted: true as const };
}
