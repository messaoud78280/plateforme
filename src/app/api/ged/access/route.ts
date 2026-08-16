import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  issueDocumentSignedUrl,
  resolveDocumentAccess,
  type DocumentAccessKind,
  type DocumentAccessSource,
} from "@/lib/ged/resolve-document-access";
import type { MessagerieMessageKind } from "@/lib/messagerie/media-acl";

/**
 * POST /api/ged/access
 * Body: { kind, id } | { kind: MESSAGERIE_MEDIA, messageKind, messageId, fileUrl }
 * → URL signée courte après ACL métier.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    kind?: string;
    id?: string;
    messageKind?: string;
    messageId?: string;
    fileUrl?: string;
    expiresIn?: number;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const kind = String(body.kind ?? "").trim() as DocumentAccessKind;
  let source: DocumentAccessSource | null = null;

  if (kind === "MESSAGERIE_MEDIA") {
    const messageKind = body.messageKind as MessagerieMessageKind | undefined;
    const messageId = String(body.messageId ?? "").trim();
    const fileUrl = String(body.fileUrl ?? "").trim();
    if (!messageKind || !messageId || !fileUrl) {
      return NextResponse.json({ error: "Paramètres messagerie manquants" }, { status: 400 });
    }
    source = { kind, messageKind, messageId, fileUrl };
  } else if (
    kind === "CHANTIER_FILE" ||
    kind === "PURCHASE_ORDER_DOCUMENT" ||
    kind === "LEGACY_DOCUMENT"
  ) {
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    source = { kind, id };
  } else {
    return NextResponse.json({ error: "kind invalide" }, { status: 400 });
  }

  if (!source) {
    return NextResponse.json({ error: "Paramètres incomplets" }, { status: 400 });
  }

  const access = await resolveDocumentAccess(
    {
      id: session.user.id,
      role: session.user.role,
      personType: session.user.personType ?? null,
      permissionProfile: session.user.permissionProfile ?? null,
      isDemo: Boolean(session.user.isDemo),
      demoRootUserId: session.user.demoRootUserId ?? null,
    },
    source,
  );

  if (!access.ok) {
    return NextResponse.json(
      { error: "Impossible d’ouvrir ce document." },
      { status: access.status === 403 ? 403 : access.status === 404 ? 404 : 400 },
    );
  }

  if (access.appFilePath) {
    return NextResponse.json({
      signedUrl: access.appFilePath,
      expiresIn: 15 * 60,
      fileName: access.fileName,
      mimeType: access.mimeType,
      kind: access.kind,
      resourceId: access.resourceId,
      delivery: "app",
    });
  }

  const signed = await issueDocumentSignedUrl(access, Number(body.expiresIn ?? 15 * 60));
  if ("error" in signed) {
    return NextResponse.json(
      { error: "Impossible d’ouvrir ce document." },
      { status: signed.status },
    );
  }

  return NextResponse.json({
    signedUrl: signed.url,
    expiresIn: signed.expiresIn,
    fileName: access.fileName,
    mimeType: access.mimeType,
    kind: access.kind,
    resourceId: access.resourceId,
  });
}
