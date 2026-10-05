import { NextResponse } from "next/server";
import { requirePrepApiContext, prepErrorResponse } from "@/lib/preparation/access";
import { buildUniversalPatchContext } from "@/lib/bework-patch/build-context";
import { contextToClipboardText } from "@/lib/bework-patch/context";
import { BEWORK_PATCH_SECTIONS, type BeworkPatchSection } from "@/lib/bework-patch/types";
import { getSectionCapability } from "@/lib/bework-patch/capability";

export const dynamic = "force-dynamic";

/**
 * POST { section, projectId, entityId }
 * → bework_chatgpt_context_v1 + text clipboard
 */
export async function POST(req: Request) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;

  try {
    const body = (await req.json().catch(() => null)) as {
      section?: string;
      projectId?: string;
      entityId?: string;
      purpose?: string;
    } | null;

    const section = body?.section?.trim() as BeworkPatchSection | undefined;
    const projectId = body?.projectId?.trim() || null;
    const entityId = body?.entityId?.trim();
    const purposeRaw = body?.purpose?.trim();
    const purpose =
      purposeRaw === "enrich_tech_sheets" ? "enrich_tech_sheets" : "modify";
    const visitStandalone = section === "VISIT";

    if (
      !section ||
      !(BEWORK_PATCH_SECTIONS as readonly string[]).includes(section) ||
      !entityId ||
      (!visitStandalone && !projectId)
    ) {
      return NextResponse.json(
        {
          error: visitStandalone
            ? "section et entityId (visite) requis"
            : "section, projectId et entityId requis",
        },
        { status: 422 },
      );
    }

    const context = await buildUniversalPatchContext({
      orgId: guard.ctx.orgId,
      section,
      projectId,
      entityId,
      purpose,
    });
    if (!context) {
      return NextResponse.json(
        { error: "Contexte introuvable (projet / entité / organisation)" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      context,
      text: contextToClipboardText(context),
      capability: getSectionCapability(section),
    });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
