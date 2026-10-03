/**
 * Preview CREATE devis — parse bework_quote_bundle_v1 + fingerprint sources.
 * Aucune écriture.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { prisma } from "@/lib/prisma";
import { previewQuoteCreateFromBundle } from "@/lib/bework-context/adapt-quote-create";

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
  };
  const raw = typeof body.raw === "string" ? body.raw : "";
  if (!raw.trim()) {
    return NextResponse.json(
      { error: "Collez le JSON bework_quote_bundle_v1" },
      { status: 422 },
    );
  }

  try {
    const result = await previewQuoteCreateFromBundle({
      orgId: project.organizationId,
      projectId,
      raw,
      sourcesFingerprint:
        typeof body.sourcesFingerprint === "string" ? body.sourcesFingerprint : "",
      studyId: typeof body.studyId === "string" ? body.studyId : null,
    });
    return NextResponse.json(result);
  } catch (e) {
    const err = e as {
      message?: string;
      code?: string;
      status?: number;
      sourcesFingerprint?: string;
      issues?: unknown;
      quantityDrifts?: unknown;
    };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Prévisualisation impossible",
        code: err.code,
        sourcesFingerprint: err.sourcesFingerprint,
        issues: err.issues,
        quantityDrifts: err.quantityDrifts,
      },
      { status: err.status ?? 500 },
    );
  }
}
