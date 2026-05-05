import { NextResponse } from "next/server";
import crypto from "crypto";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const url = process.env.NEXTAUTH_URL ?? "";
  const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookieName = useSecureCookies ? "__Secure-next-auth.session-token" : "next-auth.session-token";

  return NextResponse.json({
    hasSecret: Boolean(secret),
    secretLen: secret.length,
    secretSha256: secret ? sha256(secret) : null,
    nextAuthUrl: url || null,
    useSecureCookies,
    cookieName,
  });
}

