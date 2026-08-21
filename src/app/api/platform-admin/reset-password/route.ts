import { NextResponse } from "next/server";
import { completePlatformAdminPasswordReset } from "@/lib/platform-admin/password-reset";

export async function POST(request: Request) {
  let body: { email?: string; token?: string; password?: string };
  try {
    body = (await request.json()) as {
      email?: string;
      token?: string;
      password?: string;
    };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const result = await completePlatformAdminPasswordReset({
    email: body.email ?? "",
    token: body.token ?? "",
    newPassword: body.password ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
