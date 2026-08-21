import { NextResponse } from "next/server";
import { requestPlatformAdminPasswordReset } from "@/lib/platform-admin/password-reset";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const result = await requestPlatformAdminPasswordReset({
    email: body.email ?? "",
    baseUrl: new URL(request.url).origin,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Toujours le même message (anti-énumération)
  return NextResponse.json({
    ok: true,
    message:
      "Si un compte administrateur correspond, un email de réinitialisation a été envoyé.",
  });
}
