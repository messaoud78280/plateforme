import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  issueDocumentSignedUrl,
  resolveDocumentAccess,
  streamDocumentBytes,
} from "@/lib/ged/resolve-document-access";

/**
 * GET /api/ged/files/purchase-order-document/[id]
 * Preview / download BL & pièces commande — ACL org / fournisseur.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const download = new URL(request.url).searchParams.get("download") === "1";
  const asRedirect = new URL(request.url).searchParams.get("redirect") === "1";

  const access = await resolveDocumentAccess(
    {
      id: session.user.id,
      role: session.user.role,
      personType: session.user.personType ?? null,
      permissionProfile: session.user.permissionProfile ?? null,
      isDemo: Boolean(session.user.isDemo),
      demoRootUserId: session.user.demoRootUserId ?? null,
    },
    { kind: "PURCHASE_ORDER_DOCUMENT", id },
  );

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (asRedirect) {
    const signed = await issueDocumentSignedUrl(access);
    if ("error" in signed) {
      return NextResponse.json({ error: signed.error }, { status: signed.status });
    }
    return NextResponse.redirect(signed.url);
  }

  const downloaded = await streamDocumentBytes(access);
  if (!downloaded) {
    return NextResponse.json({ error: "Lecture impossible" }, { status: 502 });
  }

  const safe = access.fileName.replace(/[^\w.\- àâäéèêëïîôùûüç]/gi, "_").slice(0, 180);
  return new NextResponse(downloaded.blob, {
    status: 200,
    headers: {
      "Content-Type": access.mimeType || downloaded.contentType || "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safe}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
