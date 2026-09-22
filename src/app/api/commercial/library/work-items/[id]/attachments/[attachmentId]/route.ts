import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  deleteLibraryAttachment,
  getLibraryAttachmentSignedUrl,
  updateLibraryAttachment,
} from "@/lib/commercial/library-media";

type Ctx = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id, attachmentId } = await ctx.params;
  const url = new URL(req.url);
  const expiresIn = Number(url.searchParams.get("expiresIn") || 900);
  try {
    const signed = await getLibraryAttachmentSignedUrl(
      auth.orgId,
      id,
      attachmentId,
      expiresIn,
    );
    return NextResponse.json(signed);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id, attachmentId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    const attachment = await updateLibraryAttachment(
      auth.orgId,
      id,
      attachmentId,
      {
        name: body.name !== undefined ? String(body.name) : undefined,
        caption:
          body.caption !== undefined
            ? body.caption
              ? String(body.caption)
              : null
            : undefined,
        category: body.category !== undefined ? String(body.category) : undefined,
        clientVisible:
          body.clientVisible !== undefined ? Boolean(body.clientVisible) : undefined,
        isPrimary: body.isPrimary !== undefined ? Boolean(body.isPrimary) : undefined,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      },
      auth.session.user.id,
    );
    return NextResponse.json({ attachment });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id, attachmentId } = await ctx.params;
  try {
    await deleteLibraryAttachment(
      auth.orgId,
      id,
      attachmentId,
      auth.session.user.id,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
