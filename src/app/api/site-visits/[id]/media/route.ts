import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import { prisma } from "@/lib/prisma";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import {
  deleteSiteVisitMedia,
  updateSiteVisitMedia,
  uploadSiteVisitMedia,
} from "@/lib/site-visits/media";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  DOCUMENTS_BUCKET,
  downloadStorageObject,
  extractStoragePathFromUrl,
} from "@/lib/storage/supabase-object";

export const dynamic = "force-dynamic";

async function gate() {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  const access = decideApiAccess(
    "/api/site-visits",
    session.user.personType,
    session.user.permissionProfile,
  );
  if (!access.ok) {
    return { error: NextResponse.json({ error: access.error }, { status: access.status }) };
  }
  if (!canAccessSiteVisits(session.user)) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
  }
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) {
    return { error: NextResponse.json({ error: "Organisation introuvable" }, { status: 404 }) };
  }
  return { session, orgId };
}

/** Aperçu authentifié : fileUrl est une référence storage://, pas une URL navigateur. */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const g = await gate();
  if ("error" in g && g.error) return g.error;
  const { orgId } = g as { orgId: string };
  const { id } = await ctx.params;
  const mediaId = new URL(req.url).searchParams.get("mediaId") || "";
  if (!mediaId) {
    return NextResponse.json({ error: "mediaId requis" }, { status: 400 });
  }

  const media = await prisma.siteVisitMedia.findFirst({
    where: { id: mediaId, visitId: id, organizationId: orgId },
    select: {
      storagePath: true,
      fileUrl: true,
      mimeType: true,
      name: true,
    },
  });
  if (!media) {
    return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
  }

  const path =
    media.storagePath ||
    (media.fileUrl ? extractStoragePathFromUrl(media.fileUrl, DOCUMENTS_BUCKET) : null);
  if (!path) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 500 });
  }
  const downloaded = await downloadStorageObject(supabase, DOCUMENTS_BUCKET, path);
  if (!downloaded) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const bytes = Buffer.from(await downloaded.blob.arrayBuffer());
  const type = media.mimeType || downloaded.contentType || "application/octet-stream";
  const filename = (media.name || "photo").replace(/["\r\n]/g, "");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const g = await gate();
  if ("error" in g && g.error) return g.error;
  const { session, orgId } = g as {
    session: { user: { id: string } };
    orgId: string;
  };
  const { id } = await ctx.params;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }
    const kindRaw = String(form.get("kind") ?? "PHOTO").toUpperCase();
    const kind = kindRaw === "DOCUMENT" ? "DOCUMENT" : "PHOTO";
    const visit = await uploadSiteVisitMedia({
      organizationId: orgId,
      visitId: id,
      actorUserId: session.user.id,
      file,
      kind,
      caption: String(form.get("caption") ?? "") || null,
      measurementId: String(form.get("measurementId") ?? "") || null,
      zone: String(form.get("zone") ?? "") || null,
      name: String(form.get("name") ?? "") || null,
      category: String(form.get("category") ?? "") || null,
      observation: String(form.get("observation") ?? "") || null,
      hypothesis: String(form.get("hypothesis") ?? "") || null,
    });
    return NextResponse.json({ visit }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const g = await gate();
  if ("error" in g && g.error) return g.error;
  const { orgId } = g as { orgId: string };
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const mediaId = String(body.mediaId ?? "");
    if (!mediaId) {
      return NextResponse.json({ error: "mediaId requis" }, { status: 400 });
    }
    const visit = await updateSiteVisitMedia({
      organizationId: orgId,
      visitId: id,
      mediaId,
      caption: body.caption,
      observation: body.observation,
      zone: body.zone,
      category: body.category,
      hypothesis: body.hypothesis,
      origin: body.origin,
    });
    return NextResponse.json({ visit });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const g = await gate();
  if ("error" in g && g.error) return g.error;
  const { orgId } = g as { orgId: string };
  const { id } = await ctx.params;
  try {
    const url = new URL(req.url);
    let mediaId = url.searchParams.get("mediaId") || "";
    if (!mediaId) {
      const body = await req.json().catch(() => null);
      mediaId = String(body?.mediaId ?? "");
    }
    if (!mediaId) {
      return NextResponse.json({ error: "mediaId requis" }, { status: 400 });
    }
    const visit = await deleteSiteVisitMedia({
      organizationId: orgId,
      visitId: id,
      mediaId,
    });
    return NextResponse.json({ visit });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
