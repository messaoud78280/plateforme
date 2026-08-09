import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  issueDocumentSignedUrl,
  resolveDocumentAccess,
} from "@/lib/ged/resolve-document-access";

/** GET — Téléchargement legacy Document après ACL GED-V2A.1 (pas de fallback public). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const access = await resolveDocumentAccess(
    {
      id: session.user.id,
      role: session.user.role,
      personType: session.user.personType ?? null,
      permissionProfile: session.user.permissionProfile ?? null,
      isDemo: Boolean(session.user.isDemo),
      demoRootUserId: session.user.demoRootUserId ?? null,
    },
    { kind: "LEGACY_DOCUMENT", id },
  );

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const signed = await issueDocumentSignedUrl(access, 15 * 60);
  if ("error" in signed) {
    return NextResponse.json({ error: signed.error }, { status: signed.status });
  }

  return NextResponse.redirect(signed.url);
}
