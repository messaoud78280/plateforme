import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  issueDocumentSignedUrl,
  resolveDocumentAccessByStoredUrl,
} from "@/lib/ged/resolve-document-access";
import {
  isMessagerieMediaPath,
  parseMessagerieStorageRef,
} from "@/lib/messagerie/media-storage";
import { canAccessMessagerieMedia, type MessagerieMessageKind } from "@/lib/messagerie/media-acl";

/**
 * POST — URL signée temporaire.
 * GED-V2A.1 : plus de signature « URL seule » sur documents.
 * ACL via résolution ressource DB (ou messagerie messageKind/messageId).
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    url?: string;
    bucket?: string;
    expiresIn?: number;
    messageKind?: string;
    messageId?: string;
    resourceKind?: string;
    resourceId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const url = String(body.url ?? "").trim();
  if (!url) return NextResponse.json({ error: "URL requise" }, { status: 400 });

  const user = {
    id: session.user.id,
    role: session.user.role,
    personType: session.user.personType ?? null,
    permissionProfile: session.user.permissionProfile ?? null,
    isDemo: Boolean(session.user.isDemo),
    demoRootUserId: session.user.demoRootUserId ?? null,
  };

  const expiresIn = Math.min(20 * 60, Math.max(60, Number(body.expiresIn ?? 15 * 60)));

  // Chemin messagerie explicite (compat MessagerieSecureMedia)
  const parsed = parseMessagerieStorageRef(url);
  if (parsed && isMessagerieMediaPath(parsed.bucket, parsed.path)) {
    const messageKind = body.messageKind as MessagerieMessageKind | undefined;
    const messageId = String(body.messageId ?? "").trim();
    if (messageKind && messageId && ["TASK", "DIRECT", "PROJECT"].includes(messageKind)) {
      const access = await canAccessMessagerieMedia(
        { id: session.user.id, role: session.user.role },
        { messageKind, messageId, fileUrl: url },
      );
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
      }
      const supabase = createServiceRoleClient();
      if (!supabase) {
        return NextResponse.json({ error: "Stockage indisponible" }, { status: 503 });
      }
      const { data, error } = await supabase.storage
        .from(access.bucket)
        .createSignedUrl(access.path, expiresIn);
      if (error || !data?.signedUrl) {
        return NextResponse.json({ error: "Signature impossible" }, { status: 500 });
      }
      return NextResponse.json({
        signedUrl: data.signedUrl,
        fallback: false,
        signed: true,
      });
    }
  }

  const access = await resolveDocumentAccessByStoredUrl(user, url, {
    messageKind: body.messageKind as MessagerieMessageKind | undefined,
    messageId: body.messageId ? String(body.messageId) : undefined,
  });

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const signed = await issueDocumentSignedUrl(access, expiresIn);
  if ("error" in signed) {
    return NextResponse.json({ error: signed.error }, { status: signed.status });
  }

  return NextResponse.json({
    signedUrl: signed.url,
    fallback: false,
    signed: true,
    kind: access.kind,
    resourceId: access.resourceId,
  });
}
