import { NextResponse } from "next/server";
import { getPlatformAdminOrNull } from "@/lib/platform-admin/authz";
import { adminApproveSaasTrial } from "@/lib/platform-admin/actions";
import { publicAppOriginForEmails } from "@/lib/site";

/** POST — Valider un essai SaaS (compte PENDING + démarrage 14 j + email accès). */
export async function POST(request: Request) {
  const admin = await getPlatformAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
  };
  if (!body.organizationId) {
    return NextResponse.json({ error: "organizationId requis" }, { status: 400 });
  }

  const result = await adminApproveSaasTrial({
    actorUserId: admin.userId,
    organizationId: body.organizationId,
    baseUrl: publicAppOriginForEmails(new URL(request.url).origin),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({
    ok: true,
    email: result.email,
    alreadyApproved: result.alreadyApproved,
  });
}
