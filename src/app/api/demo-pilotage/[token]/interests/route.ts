import { NextResponse } from "next/server";
import { resolveDemoLinkAccess } from "@/lib/demo-pilotage/access";
import { DEMO_INTEREST_OPTIONS } from "@/lib/demo-pilotage/token";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!token || token.length < 20) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const access = await resolveDemoLinkAccess(token);
  if (!access.ok) {
    return NextResponse.json({ ok: false, reason: access.reason }, { status: 403 });
  }

  const body = (await req.json()) as { interests?: string[]; interestNote?: string };
  const allowed = new Set(DEMO_INTEREST_OPTIONS.map((o) => o.id));
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((id) => typeof id === "string" && allowed.has(id as never)).slice(0, 20)
    : [];
  const interestNote =
    typeof body.interestNote === "string" ? body.interestNote.trim().slice(0, 2000) : null;

  await prisma.demoPilotageLink.update({
    where: { id: access.link.id },
    data: { interests, interestNote },
  });

  return NextResponse.json({ ok: true });
}
