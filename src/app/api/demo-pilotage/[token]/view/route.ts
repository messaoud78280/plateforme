import { NextResponse } from "next/server";
import { recordDemoView, resolveDemoLinkAccess } from "@/lib/demo-pilotage/access";

export const dynamic = "force-dynamic";

/** Enregistre une consultation de section — pas d’accès aux données métier. */
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

  let section: string | undefined;
  try {
    const body = (await req.json()) as { section?: string };
    section = typeof body.section === "string" ? body.section.slice(0, 40) : undefined;
  } catch {
    /* ignore */
  }

  await recordDemoView(token, section);
  return NextResponse.json({ ok: true });
}
