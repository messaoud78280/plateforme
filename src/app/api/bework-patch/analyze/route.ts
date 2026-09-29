import { NextResponse } from "next/server";
import { requirePrepApiContext, prepErrorResponse } from "@/lib/preparation/access";
import { analyzeBeworkPatchInput } from "@/lib/bework-patch/analyze";
import { buildUniversalPatchContext } from "@/lib/bework-patch/build-context";
import { BEWORK_PATCH_SECTIONS, type BeworkPatchSection } from "@/lib/bework-patch/types";

export const dynamic = "force-dynamic";

/**
 * POST { raw, projectId?, entityId?, section?, currentVersion? }
 * Analyse universelle — aucune écriture.
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
      body.projectId && body.currentVersion != null
        ? {
            organizationId: guard.ctx.orgId,
            projectId: body.projectId,
            currentVersion: body.currentVersion,
          }
        : null;

    const result = analyzeBeworkPatchInput({
      raw: body.raw,
      snapshot,
      context,
    });

    return NextResponse.json({ analysis: result });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
