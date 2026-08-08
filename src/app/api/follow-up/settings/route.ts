import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveFollowUpOwnerUserId } from "@/lib/follow-up/access";
import { getFollowUpSettings, saveFollowUpSettings } from "@/lib/follow-up/settings";
import type { AlertRuleConfig, EscalateConfig, UrgencyThresholds } from "@/lib/follow-up/types";

/** GET /api/follow-up/settings */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const ownerUserId = await resolveFollowUpOwnerUserId(session.user.id);
  const settings = await getFollowUpSettings(ownerUserId);
  return NextResponse.json(settings);
}

/** PUT /api/follow-up/settings */
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const ownerUserId = await resolveFollowUpOwnerUserId(session.user.id);
  const body = (await request.json()) as {
    thresholds?: UrgencyThresholds;
    rules?: AlertRuleConfig[];
    escalate?: EscalateConfig;
  };
  await saveFollowUpSettings(ownerUserId, body);
  const settings = await getFollowUpSettings(ownerUserId);
  return NextResponse.json(settings);
}
