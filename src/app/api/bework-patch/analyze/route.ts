import { NextResponse } from "next/server";
import { requirePrepApiContext, prepErrorResponse } from "@/lib/preparation/access";
import { analyzeBeworkPatchInput } from "@/lib/bework-patch/analyze";
import { buildUniversalPatchContext } from "@/lib/bework-patch/build-context";
import { loadImpactSubgraph } from "@/lib/bework-patch/impact/load-subgraph";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";
import { buildCommitPreviewMeta } from "@/lib/bework-patch/commit/commit-universal";
import { BEWORK_PATCH_SECTIONS, type BeworkPatchSection } from "@/lib/bework-patch/types";

export const dynamic = "force-dynamic";

/**
 * POST { raw, projectId?, entityId?, section?, currentVersion? }
 * Analyse + Impact + fingerprint/eligibility — aucune écriture.
 */
export async function POST(req: Request) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;

  try {
    const body = (await req.json().catch(() => null)) as {
      raw?: unknown;
      projectId?: string;
      entityId?: string;
      section?: string;
      currentVersion?: number;
    } | null;

    if (body?.raw == null) {
      return NextResponse.json({ error: "raw requis" }, { status: 422 });
    }

    let context = null;
    const section = body.section?.trim() as BeworkPatchSection | undefined;
    if (
      section &&
      (BEWORK_PATCH_SECTIONS as readonly string[]).includes(section) &&
      body.projectId &&
      body.entityId
    ) {
      context = await buildUniversalPatchContext({
        orgId: guard.ctx.orgId,
        section,
        projectId: body.projectId,
        entityId: body.entityId,
      });
    }

    const snapshot =
      body.projectId &&
      (context?.target.version != null || body.currentVersion != null)
        ? {
            organizationId: guard.ctx.orgId,
            projectId: body.projectId,
            /**
             * CTX-07 : préférer la version live du contexte (DB) plutôt que
             * la version UI potentiellement stale / hardcodée.
             */
            currentVersion: context?.target.version ?? body.currentVersion!,
          }
        : null;

    let subgraph = null;
    const parsed = parseBeworkPatch(body.raw);
    if (
      parsed.ok &&
      body.projectId &&
      (parsed.patch.origin.section === "TAKEOFF" ||
        parsed.patch.origin.section === "QUOTE" ||
        parsed.patch.origin.section === "PLANNING" ||
        parsed.patch.origin.section === "VISIT" ||
        parsed.patch.origin.section === "FOLLOW_UP" ||
        parsed.patch.origin.section === "REPORT")
    ) {
      subgraph = await loadImpactSubgraph({
        orgId: guard.ctx.orgId,
        projectId: body.projectId,
        patch: parsed.patch,
      });
    }

    const result = analyzeBeworkPatchInput({
      raw: body.raw,
      snapshot,
      context,
      subgraph,
    });

    let commitMeta = null;
    if (parsed.ok && result.impact && subgraph) {
      commitMeta = buildCommitPreviewMeta({
        patch: parsed.patch,
        impact: result.impact,
        subgraph,
      });
    }

    return NextResponse.json({
      analysis: result,
      commit: commitMeta,
      meta: {
        simulationOnly: true,
        canPropagate: false,
        phase: "E",
      },
    });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
