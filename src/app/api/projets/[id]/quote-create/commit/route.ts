/**
 * Commit CREATE devis — atomique via commitQuoteCreateFromBundle.
 * Pas de planning auto. Multi-tenant + PREVIEW_STALE.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { prisma } from "@/lib/prisma";
import { commitQuoteCreateFromBundle } from "@/lib/bework-context/adapt-quote-create";
import { PrepError } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (session.user.role === "CLIENT") {
    return NextResponse.json({ error: "Modification non autorisée" }, { status: 403 });
  }
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    raw?: string;
    sourcesFingerprint?: string;
    studyId?: string;
    acceptQuantityDrifts?: boolean;
    allowDuplicate?: boolean;
  };
  const raw = typeof body.raw === "string" ? body.raw : "";
  const expectedFp =
    typeof body.sourcesFingerprint === "string" ? body.sourcesFingerprint.trim() : "";
  if (!raw.trim()) {
    return NextResponse.json({ error: "JSON manquant" }, { status: 422 });
  }
  if (!expectedFp) {
    return NextResponse.json(
      { error: "Empreinte sources manquante — relancez la prévisualisation." },
      { status: 422 },
    );
  }

  try {
    const result = await commitQuoteCreateFromBundle({
      orgId: project.organizationId,
      projectId,
      userId: session.user.id,
      raw,
      sourcesFingerprint: expectedFp,
      studyId: typeof body.studyId === "string" ? body.studyId : null,
      acceptQuantityDrifts: body.acceptQuantityDrifts === true,
      allowDuplicate: body.allowDuplicate === true,
    });

    return NextResponse.json({
      ...result,
      nextActions: {
        open: result.href,
        preparePlanning: "Préparer le planning avec ChatGPT (manuel — pas automatique)",
      },
    });
  } catch (e) {
    if (e instanceof PrepError) {
      return NextResponse.json(
        { ok: false, error: e.message, issues: e.issues ?? [], code: "PREP_ERROR" },
        { status: e.status },
      );
    }
    const err = e as {
      message?: string;
      status?: number;
      code?: string;
      sourcesFingerprint?: string;
      quantityDrifts?: unknown;
      quoteId?: string;
    };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Création impossible",
        code: err.code,
        sourcesFingerprint: err.sourcesFingerprint,
        quantityDrifts: err.quantityDrifts,
        quoteId: err.quoteId,
      },
      { status: err.status ?? 500 },
    );
  }
}
