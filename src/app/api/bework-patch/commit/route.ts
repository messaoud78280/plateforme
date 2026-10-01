import { NextResponse } from "next/server";
import { requirePrepApiContext, prepErrorResponse } from "@/lib/preparation/access";
import { commitUniversalPatch } from "@/lib/bework-patch/commit/commit-universal";

export const dynamic = "force-dynamic";

/**
 * POST { raw, projectId, previewFingerprint }
 * Commit atomique FULL_SYNC / SAFE_PARTIAL_SYNC / QUOTE_ONLY.
 */
export async function POST(req: Request) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;

  try {
    const body = (await req.json().catch(() => null)) as {
      raw?: unknown;
      projectId?: string;
      previewFingerprint?: string;
    } | null;

    const projectId = body?.projectId?.trim();
    const previewFingerprint = body?.previewFingerprint?.trim();
    if (body?.raw == null || !projectId || !previewFingerprint) {
      return NextResponse.json(
        { error: "raw, projectId et previewFingerprint requis" },
        { status: 422 },
      );
    }

    const result = await commitUniversalPatch({
      orgId: guard.ctx.orgId,
      projectId,
      userId: guard.ctx.userId,
      raw: body.raw,
      previewFingerprint,
    });

    if (!result.ok) {
      const status =
        result.code === "DUPLICATE_PATCH" || result.code === "PREVIEW_STALE"
          ? 409
          : result.code === "PROTECTED_ENTITY"
            ? 403
            : 422;
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          impact: result.impact ?? null,
        },
        { status },
      );
    }

    return NextResponse.json({
      ok: true,
      syncMode: result.syncMode,
      patchRecordId: result.patchRecordId,
      versionsBefore: result.versionsBefore,
      versionsAfter: result.versionsAfter,
      summary: result.summary,
      message:
        result.syncMode === "SAFE_PARTIAL_SYNC"
          ? "Modifications autorisées appliquées. Devis contractuel conservé."
          : result.syncMode === "PLANNING_ONLY"
            ? "Modification planning appliquée."
            : result.syncMode === "VISIT_ONLY"
              ? "Modification visite appliquée."
              : "Modification appliquée et synchronisée.",
    });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
