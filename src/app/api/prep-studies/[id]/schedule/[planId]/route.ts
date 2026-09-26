import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { PrepError } from "@/lib/preparation/service";
import {
  buildPrepSchedulePlanPayload,
  linkPrepScheduleQuote,
  updatePrepScheduleHoldPoint,
} from "@/lib/preparation/schedule/transfer";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; planId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id: studyId, planId } = await ctx.params;
    const plan = await buildPrepSchedulePlanPayload(guard.ctx.orgId, planId);
    if (!plan || plan.study.id !== studyId) {
      throw new PrepError("Planning introuvable", 404);
    }
    return NextResponse.json({ plan });
  } catch (e) {
    if (e instanceof PrepError) return prepErrorResponse(e);
    return prepErrorResponse(e);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id: studyId, planId } = await ctx.params;
    const body = await readJsonBody(req);
    if (!body || typeof body !== "object") {
      throw new PrepError("Corps JSON invalide", 400);
    }
    const o = body as Record<string, unknown>;

    // Vérifie rattachement étude
    const existing = await buildPrepSchedulePlanPayload(guard.ctx.orgId, planId);
    if (!existing || existing.study.id !== studyId) {
      throw new PrepError("Planning introuvable", 404);
    }

    if ("holdPointStatus" in o && "taskId" in o) {
      const status = o.holdPointStatus;
      const taskId = typeof o.taskId === "string" ? o.taskId : "";
      if (
        status !== "A_CONTROLER" &&
        status !== "VALIDE" &&
        status !== "RESERVES"
      ) {
        throw new PrepError("État point d'arrêt invalide", 422);
      }
      const plan = await updatePrepScheduleHoldPoint({
        orgId: guard.ctx.orgId,
        planId,
        taskId,
        holdPointStatus: status,
        userId: guard.ctx.userId,
      });
      return NextResponse.json({ plan });
    }

    if ("quoteId" in o) {
      const quoteId =
        o.quoteId === null || o.quoteId === ""
          ? null
          : typeof o.quoteId === "string"
            ? o.quoteId
            : null;
      if (o.quoteId != null && o.quoteId !== "" && quoteId == null) {
        throw new PrepError("Identifiant devis invalide", 422);
      }
      const plan = await linkPrepScheduleQuote({
        orgId: guard.ctx.orgId,
        planId,
        quoteId,
        userId: guard.ctx.userId,
      });
      return NextResponse.json({ plan });
    }

    throw new PrepError("Aucune action reconnue (quoteId ou holdPointStatus)", 400);
  } catch (e) {
    if (e instanceof PrepError) return prepErrorResponse(e);
    return prepErrorResponse(e);
  }
}
