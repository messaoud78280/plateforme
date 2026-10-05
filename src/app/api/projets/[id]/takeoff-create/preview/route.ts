/**
 * Preview CREATE métré — parse bework_prep_bundle_v1 + vérif sources fingerprint.
 * Aucune écriture.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { prisma } from "@/lib/prisma";
import { previewPrepImport, PrepError } from "@/lib/preparation/service";
import { loadCurrentTakeoffCreateSourcesFingerprint } from "@/lib/bework-context/adapt-takeoff-create";
import { summarizePrepPreviewFailure } from "@/lib/preparation/preview-error";
import { summarizeCreateProvenance } from "@/lib/preparation/import-provenance";

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
    visitId?: string;
  };
  const raw = typeof body.raw === "string" ? body.raw : "";
  if (!raw.trim()) {
    return NextResponse.json({ error: "Collez le JSON bework_prep_bundle_v1" }, { status: 422 });
  }

  try {
    const current = await loadCurrentTakeoffCreateSourcesFingerprint({
      orgId: project.organizationId,
      projectId,
      visitId: typeof body.visitId === "string" ? body.visitId : null,
    });

    const expectedFp =
      typeof body.sourcesFingerprint === "string" ? body.sourcesFingerprint.trim() : "";
    if (expectedFp && expectedFp !== current.fingerprint) {
      return NextResponse.json(
        {
          ok: false,
          code: "PREVIEW_STALE",
          error:
            "Les données du chantier ont changé. Copiez un nouveau contexte et analysez de nouveau la proposition.",
          sourcesFingerprint: current.fingerprint,
        },
        { status: 409 },
      );
    }

    const result = await previewPrepImport({
      orgId: project.organizationId,
      projectId,
      raw,
      targetStudyId: null,
    });
    if (!result.ok) {
      const summary = summarizePrepPreviewFailure({
        issues: result.issues,
        code: "PREP_PARSE_FAILED",
      });
      return NextResponse.json(
        {
          ok: false,
          code: "PREP_PARSE_FAILED",
          error: summary.title,
          message: summary.title,
          issues: result.issues,
          details: summary.details,
        },
        { status: 422 },
      );
    }

    const params = result.preview.params;
    const lines = result.preview.lines;
    const counts = summarizeCreateProvenance([
      ...params.map((p) => ({
        provenanceKind: p.provenanceKind,
        provenance: p.provenance,
        formula: p.formula,
        missingValue: p.value == null && !p.formula,
      })),
      ...lines.map((l) => ({
        provenanceKind: l.provenanceKind,
        provenance: l.provenance,
        formula: l.formula,
        // À confirmer seulement si quantité vraiment absente — pas RELEVE_A_VERIFIER/PLAN
        missingValue:
          l.declaredQuantity == null && !l.formula && (l.computed == null || !Number.isFinite(l.computed)),
      })),
    ]);
    const provenanceSummary = {
      measure: counts.measure,
      plan: counts.plan,
      manual: counts.manual,
      calculation: counts.calculation,
      hypothesis: counts.hypothesis + result.preview.hypotheses.length,
      unknown: counts.unknown,
      toConfirm: counts.toConfirm,
      lines: lines.length,
      params: params.length,
    };

    return NextResponse.json({
      ok: true,
      preview: result.preview,
      provenanceSummary,
      sourcesFingerprint: current.fingerprint,
      visitId: current.visitId,
    });
  } catch (e) {
    if (e instanceof PrepError) {
      const summary = summarizePrepPreviewFailure({
        error: e.message,
        issues: e.issues ?? [],
        code: "PREP_ERROR",
      });
      return NextResponse.json(
        {
          ok: false,
          code: "PREP_ERROR",
          error: summary.title,
          message: summary.title,
          issues: e.issues ?? [],
          details: summary.details,
        },
        { status: e.status },
      );
    }
    const err = e as { message?: string; status?: number; code?: string };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Prévisualisation impossible",
        message: err.message ?? "Prévisualisation impossible",
        code: err.code,
        issues: [],
      },
      { status: err.status ?? 500 },
    );
  }
}
