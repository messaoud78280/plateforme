import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  deleteLibraryNote,
  updateLibraryNote,
} from "@/lib/commercial/library-notes";

type Ctx = { params: Promise<{ id: string; noteId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id, noteId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    const note = await updateLibraryNote({
      orgId: auth.orgId,
      workItemId: id,
      noteId,
      kind: body.kind !== undefined ? String(body.kind) : undefined,
      body: body.body !== undefined ? String(body.body) : undefined,
      actorUserId: auth.session.user.id,
    });
    return NextResponse.json({ note });
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
  const { id, noteId } = await ctx.params;
  try {
    await deleteLibraryNote({
      orgId: auth.orgId,
      workItemId: id,
      noteId,
      actorUserId: auth.session.user.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
