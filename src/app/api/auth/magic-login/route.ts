import { NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";
import { decode, encode } from "next-auth/jwt";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isClientLoginAllowed } from "@/lib/client-account-approval";

import { getNextAuthSessionCookieName } from "@/lib/auth-session-cookie";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  const next = (url.searchParams.get("next") ?? "/dashboard").trim() || "/dashboard";
  const baseUrl = url.origin;
  const cookieName = getNextAuthSessionCookieName(baseUrl.startsWith("https://"));

  if (!token) {
    return NextResponse.redirect(new URL("/connexion/clients?error=magic_link_invalid", baseUrl));
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/connexion/clients?error=server_config", baseUrl));
  }

  // Vérifier le magic token (JWT signé) et générer un JWT de session NextAuth
  const decoded = await decode({ secret, token });
  const userId = (decoded?.id || decoded?.sub) as string | undefined;
  const email = decoded?.email as string | undefined;
  const name = decoded?.name as string | undefined;
  const role = decoded?.role as string | undefined;
  const contractStatus = decoded?.contractStatus as string | undefined;

  if (!userId || !email) {
    return NextResponse.redirect(new URL("/connexion/clients?error=magic_link_invalid", baseUrl));
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, accountStatus: true },
  });
  if (
    dbUser?.role === UserRole.CLIENT &&
    !isClientLoginAllowed(dbUser.accountStatus)
  ) {
    const err =
      dbUser.accountStatus === "REJECTED" ? "account_rejected" : "account_pending";
    return NextResponse.redirect(new URL(`/connexion/clients?error=${err}`, baseUrl));
  }

  const sessionJwt = await encode({
    secret,
    // NextAuth JWT utilise un salt lié au nom du cookie de session
    salt: cookieName,
    token: {
      sub: userId,
      id: userId,
      email,
      name,
      role,
      contractStatus,
    } as JWT,
  });

  const res = NextResponse.redirect(new URL(next.startsWith("/") ? next : "/dashboard", baseUrl));

  res.cookies.set(cookieName, sessionJwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: baseUrl.startsWith("https://"),
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  });

  return res;
}

