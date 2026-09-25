import { NextResponse } from "next/server";
import { prepErrorResponse, requirePrepApiContext } from "@/lib/preparation/access";
import { PrepError } from "@/lib/preparation/service";
import { getPrepSchedulePlanView } from "@/lib/preparation/schedule/transfer";
import { d } from "@/lib/commercial/decimal";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; planId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { planId } = await ctx.params;
    const plan = await getPrepSchedulePlanView(guard.ctx.orgId, planId);
    if (!plan) throw new PrepError("Planning introuvable", 404);
    return NextResponse.json({
      plan: {
        ...plan,
        baseDurationWorkingDays:
          plan.baseDurationWorkingDays != null ? d(plan.baseDurationWorkingDays) : null,
        withConditionalWorkingDays:
          plan.withConditionalWorkingDays != null ? d(plan.withConditionalWorkingDays) : null,
        tasks: plan.tasks.map((t) => ({
          ...t,
          durationDays: d(t.durationDays),
          quantitySnapshot: t.quantitySnapshot != null ? d(t.quantitySnapshot) : null,
          rateValue: t.rateValue != null ? d(t.rateValue) : null,
          sellHtSnapshot: t.sellHtSnapshot != null ? d(t.sellHtSnapshot) : null,
          costHtSnapshot: t.costHtSnapshot != null ? d(t.costHtSnapshot) : null,
        })),
      },
    });
  } catch (e) {
    if (e instanceof PrepError) return prepErrorResponse(e);
    return prepErrorResponse(e);
  }
}
