import { NextResponse } from "next/server";
import { resolveDemoLinkAccess } from "@/lib/demo-pilotage/access";
import { verifyAccessCode } from "@/lib/demo-pilotage/token";

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
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = (await req.json()) as { code?: string };
  const code = typeof body.code === "string" ? body.code : "";
  if (!verifyAccessCode(code, token, access.link.accessCodeHash)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(`demo_pilotage_${token}`, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/demo/pilotage-travaux",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
