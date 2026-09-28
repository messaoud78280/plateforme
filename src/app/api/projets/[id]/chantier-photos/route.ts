import { NextResponse } from "next/server";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import { listChantierPhotos } from "@/lib/site-visits/chantier-photo-library";

type Ctx = { params: Promise<{ id: string }> };

/** Photos déjà stockées (visite) réutilisables dans le dossier, sans nouvel upload. */
export async function GET(_req: Request, ctx: Ctx) {
  const { id: projectId } = await ctx.params;
  const auth = await requireSiteDocumentAccess(projectId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const photos = await listChantierPhotos({
    organizationId: auth.orgId,
    projectId,
  });
  return NextResponse.json({ photos });
}
