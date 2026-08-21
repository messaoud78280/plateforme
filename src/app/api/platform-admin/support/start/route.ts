import { NextResponse } from "next/server";
import { PlatformSupportMode } from "@prisma/client";
import { getPlatformAdminOrNull } from "@/lib/platform-admin/authz";
import { startSupportSession } from "@/lib/platform-admin/support";

export async function POST(request: Request) {
  const admin = await getPlatformAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    mode?: string;
    reason?: string;
  };
  if (!body.organizationId || !body.reason) {
    return NextResponse.json({ error: "organizationId et reason requis" }, { status: 400 });
  }

  const mode =
    body.mode === "INTERVENTION"
      ? PlatformSupportMode.INTERVENTION
      : PlatformSupportMode.READ_ONLY;

  const result = await startSupportSession({
    adminUserId: admin.userId,
    organizationId: body.organizationId,
    mode,
    reason: body.reason,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({
    ok: true,
    sessionId: result.sessionId,
    redirectTo: "/dashboard",
  });
}
