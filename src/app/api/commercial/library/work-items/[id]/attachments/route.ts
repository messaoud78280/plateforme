import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  listLibraryAttachments,
  uploadLibraryAttachments,
  reorderLibraryAttachments,
} from "@/lib/commercial/library-media";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  try {
    const attachments = await listLibraryAttachments(auth.orgId, id);
    return NextResponse.json({ attachments });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;

  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { action?: string; orderedIds?: string[] };
      if (body.action === "reorder" && Array.isArray(body.orderedIds)) {
        const attachments = await reorderLibraryAttachments(
          auth.orgId,
          id,
          body.orderedIds.map(String),
        );
        return NextResponse.json({ attachments });
      }
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const form = await req.formData();
    const collected: File[] = [];
    for (const f of form.getAll("files")) {
      if (f instanceof File) collected.push(f);
    }
    const single = form.get("file");
    if (single instanceof File) collected.push(single);
    if (collected.length === 0) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }
    if (collected.length > 20) {
      return NextResponse.json({ error: "Maximum 20 fichiers à la fois" }, { status: 400 });
    }

    const clientVisible = form.get("clientVisible") === "1" || form.get("clientVisible") === "true";
    const prepared = await Promise.all(
      collected.map(async (f) => ({
        buffer: Buffer.from(await f.arrayBuffer()),
        fileName: f.name || "fichier",
        mimeType: f.type || "application/octet-stream",
      })),
    );

    const attachments = await uploadLibraryAttachments({
      orgId: auth.orgId,
      workItemId: id,
      files: prepared,
      createdById: auth.session.user.id,
      clientVisible,
    });
    return NextResponse.json({ attachments }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
