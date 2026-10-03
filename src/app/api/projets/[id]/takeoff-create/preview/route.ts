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
import { mapProvenanceKind } from "@/lib/bework-context/provenance";

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
      return NextResponse.json(result, { status: 422 });
    }

    const params = result.preview.params;
    const lines = result.preview.lines;
    const provenanceSummary = {
      measure: params.filter((p) => mapProvenanceKind({ provenance: p.provenance }) === "MEASURE")
        .length,
      plan: params.filter((p) => mapProvenanceKind({ provenance: p.provenance }) === "PLAN")
        .length,
      manual: params.filter((p) => mapProvenanceKind({ provenance: p.provenance }) === "MANUAL")
        .length,
      calculation: params.filter(
        (p) => mapProvenanceKind({ provenance: p.provenance, formula: p.formula }) === "CALCULATION",
      ).length,
      hypothesis:
        params.filter((p) => mapProvenanceKind({ provenance: p.provenance }) === "HYPOTHESIS")
          .length + result.preview.hypotheses.length,
      toConfirm: [
        ...params.filter((p) => p.value == null),
        ...lines.filter((l) => l.toVerifyCount > 0),
      ].length,
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
      return NextResponse.json(
        { ok: false, error: e.message, issues: e.issues ?? [] },
        { status: e.status },
      );
    }
    const err = e as { message?: string; status?: number; code?: string };
    return NextResponse.json(
      { ok: false, error: err.message ?? "Prévisualisation impossible", code: err.code },
      { status: err.status ?? 500 },
    );
  }
}
