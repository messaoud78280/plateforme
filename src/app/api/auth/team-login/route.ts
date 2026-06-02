import { NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";
import { encode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { ClientAccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isClientLoginAllowed } from "@/lib/client-account-approval";
import { getNextAuthSessionCookieName } from "@/lib/auth-session-cookie";
import { isAgentRole, isClient, isManager } from "@/types";

import type { TeamLoginGate } from "@/lib/auth-team-login";

function gateAllows(role: string, gate: TeamLoginGate): boolean {
  if (gate === "gerante") return isManager(role);
  if (gate === "agents") return isAgentRole(role);
  return isClient(role);
}

function gateDeniedMessage(gate: TeamLoginGate): string {
  if (gate === "gerante") {
    return "Cet espace est réservé à la gérante et aux managers. Utilisez l’accès Gérante ou un compte autorisé.";
  }
  if (gate === "agents") {
    return "Cet espace est réservé aux agents. Utilisez l’accès Agents ou un compte agent.";
  }
  return "Cet espace est réservé aux clients.";
}

/**
 * Connexion email/mot de passe avec contrôle du portail (gérante / agents / clients).
 * Pose directement le cookie de session NextAuth (évite les échecs getSession() côté client).
 */
export async function POST(request: Request) {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Configuration serveur incomplète (NEXTAUTH_SECRET)." },
      { status: 500 },
    );
  }

  let body: { email?: string; password?: string; gate?: TeamLoginGate; callbackUrl?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = (body.password ?? "").trim();
  const gate = body.gate;
  const callbackRaw = (body.callbackUrl ?? "/dashboard").trim() || "/dashboard";
  const callbackUrl = callbackRaw.startsWith("/") ? callbackRaw : "/dashboard";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Email et mot de passe requis." }, { status: 400 });
  }
  if (gate !== "gerante" && gate !== "agents" && gate !== "clients") {
    return NextResponse.json({ ok: false, error: "Portail de connexion invalide." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        contractStatus: true,
        accountStatus: true,
      },
    });

    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ ok: false, error: "Email ou mot de passe incorrect." }, { status: 401 });
    }

    if (!gateAllows(user.role, gate)) {
      return NextResponse.json({ ok: false, error: gateDeniedMessage(gate) }, { status: 403 });
    }

    if (user.role === UserRole.CLIENT && !isClientLoginAllowed(user.accountStatus)) {
      const err =
        user.accountStatus === ClientAccountStatus.REJECTED ? "account_rejected" : "account_pending";
      return NextResponse.json(
        {
          ok: false,
          error:
            err === "account_rejected"
              ? "Votre demande d’accès a été refusée."
              : "Votre compte est en attente de validation.",
          redirect: `/connexion/clients?error=${err}`,
        },
        { status: 403 },
      );
    }

    const baseUrl = new URL(request.url).origin;
    const secure = baseUrl.startsWith("https://");
    const cookieName = getNextAuthSessionCookieName(secure);

    const sessionJwt = await encode({
      secret,
      salt: cookieName,
      token: {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        contractStatus: user.contractStatus,
        accountStatus: user.accountStatus,
      } as JWT,
    });

    const res = NextResponse.json({ ok: true, redirect: callbackUrl });
    res.cookies.set(cookieName, sessionJwt, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (e) {
    console.error("[team-login]", e);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur lors de la connexion. Réessayez dans un instant." },
      { status: 500 },
    );
  }
}
