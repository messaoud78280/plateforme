/**
 * Commit CREATE métré — atomique via commitPrepImport.
 * Vérifie PREVIEW_STALE + multi-tenant. Pas de devis/planning auto.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { prisma } from "@/lib/prisma";
import { commitPrepImport, PrepError } from "@/lib/preparation/service";
import { loadCurrentTakeoffCreateSourcesFingerprint } from "@/lib/bework-context/adapt-takeoff-create";

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
    visitId?: string;
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
    const current = await loadCurrentTakeoffCreateSourcesFingerprint({
      orgId: project.organizationId,
      projectId,
      visitId: typeof body.visitId === "string" ? body.visitId : null,
    });
    if (expectedFp !== current.fingerprint) {
      return NextResponse.json(
        {
          ok: false,
          code: "PREVIEW_STALE",
          error:
            "Les données du chantier ont changé. Analysez de nouveau la proposition.",
          sourcesFingerprint: current.fingerprint,
        },
        { status: 409 },
      );
    }

    const result = await commitPrepImport({
      orgId: project.organizationId,
      projectId,
      userId: session.user.id,
      raw,
      targetStudyId: null,
      allowDuplicate: body.allowDuplicate === true,
    });

    return NextResponse.json({
      ok: true,
      studyId: result.studyId,
      importId: result.importId,
      kind: result.kind,
      href: `/dashboard/visites-metres/etudes/${result.studyId}`,
      nextActions: {
        open: `/dashboard/visites-metres/etudes/${result.studyId}`,
        prepareQuote: "Préparer le devis avec ChatGPT (manuel — pas automatique)",
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
    const err = e as { message?: string; status?: number; code?: string };
    return NextResponse.json(
      { ok: false, error: err.message ?? "Création impossible", code: err.code },
      { status: err.status ?? 500 },
    );
  }
}
