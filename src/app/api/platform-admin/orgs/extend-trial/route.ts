import { NextResponse } from "next/server";
import { getPlatformAdminOrNull } from "@/lib/platform-admin/authz";
import { adminExtendTrial } from "@/lib/platform-admin/actions";

export async function POST(request: Request) {
  const admin = await getPlatformAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    days?: number;
  };
  if (!body.organizationId) {
    return NextResponse.json({ error: "organizationId requis" }, { status: 400 });
  }

  const result = await adminExtendTrial({
    actorUserId: admin.userId,
    organizationId: body.organizationId,
    days: body.days ?? 7,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, trialEndsAt: result.trialEndsAt.toISOString() });
}
