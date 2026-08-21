import { NextResponse } from "next/server";
import { getPlatformAdminOrNull } from "@/lib/platform-admin/authz";
import { endSupportSession } from "@/lib/platform-admin/support";

export async function POST() {
  const admin = await getPlatformAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

  const { organizationId } = await endSupportSession(admin.userId);
  const redirectTo = organizationId
    ? `/admin/organisations/${organizationId}`
    : "/admin/organisations";
  return NextResponse.json({ ok: true, redirectTo });
}
