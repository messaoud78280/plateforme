import { NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { ClientAccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isClientLoginAllowed } from "@/lib/client-account-approval";
import {
  createNextAuthSessionToken,
  getNextAuthSessionCookieName,
  nextAuthSessionCookieOptions,
} from "@/lib/auth-session-cookie";
import { isAgentRole, isClient, isManager } from "@/types";
import type { TeamLoginGate } from "@/lib/auth-team-login";
import { safeTeamLoginRedirect } from "@/lib/auth-team-login";

function gateAllows(role: string, gate: TeamLoginGate): boolean {
  if (gate === "gerante") return isManager(role);
  if (gate === "agents") return isAgentRole(role);
  return isClient(role);
}

function gateDeniedMessage(gate: TeamLoginGate): string {
  if (gate === "gerante") {
    return "Cet espace est réservé à la gérante et aux managers.";
  }
  if (gate === "agents") {
    return "Cet espace est réservé aux agents.";
  }
  return "Cet espace est réservé aux clients.";
}

function gateLoginPath(gate: TeamLoginGate, error?: string, callbackUrl?: string): string {
  const q = new URLSearchParams();
  if (callbackUrl && callbackUrl !== "/dashboard") q.set("callbackUrl", callbackUrl);
  if (error) q.set("error", error);
  const qs = q.toString();
  return `/connexion/${gate}${qs ? `?${qs}` : ""}`;
}

async function parseLoginBody(request: Request): Promise<{
  email: string;
  password: string;
  gate: TeamLoginGate | null;
  callbackUrl: string;
}> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      gate?: TeamLoginGate;
      callbackUrl?: string;
    };
    return {
      email: (body.email ?? "").trim().toLowerCase(),
      password: (body.password ?? "").trim(),
      gate: body.gate ?? null,
      callbackUrl: (body.callbackUrl ?? "/dashboard").trim() || "/dashboard",
    };
  }

  const fd = await request.formData();
  const gateRaw = String(fd.get("gate") ?? "").trim();
  const gate =
    gateRaw === "gerante" || gateRaw === "agents" || gateRaw === "clients" ? gateRaw : null;
  return {
    email: String(fd.get("email") ?? "").trim().toLowerCase(),
    password: String(fd.get("password") ?? "").trim(),
    gate,
    callbackUrl: String(fd.get("callbackUrl") ?? "/dashboard").trim() || "/dashboard",
  };
}

function loginErrorRedirect(
  baseUrl: string,
  gate: TeamLoginGate,
  code: string,
  callbackUrl: string,
): NextResponse {
  return NextResponse.redirect(
    new URL(gateLoginPath(gate, code, callbackUrl), baseUrl),
  );
}

/**
 * Connexion email/mot de passe avec contrôle du portail (gérante / agents / clients).
 * Redirection HTTP 302 + cookie session NextAuth (salt vide, compatible getServerSession).
 */
export async function POST(request: Request) {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  const baseUrl = new URL(request.url).origin;

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Configuration serveur incomplète (NEXTAUTH_SECRET)." },
      { status: 500 },
    );
  }

  let email = "";
  let password = "";
  let gate: TeamLoginGate | null = null;
  let callbackUrl = "/dashboard";

  try {
    const parsed = await parseLoginBody(request);
    email = parsed.email;
    password = parsed.password;
    gate = parsed.gate;
    callbackUrl = safeTeamLoginRedirect(parsed.callbackUrl);
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  if (!gate) {
    return NextResponse.redirect(new URL("/connexion?error=invalid_gate", baseUrl));
  }

  if (!email || !password) {
    return loginErrorRedirect(baseUrl, gate, "missing_fields", callbackUrl);
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
      return loginErrorRedirect(baseUrl, gate, "invalid_credentials", callbackUrl);
    }

    if (!gateAllows(user.role, gate)) {
      return loginErrorRedirect(baseUrl, gate, "wrong_gate", callbackUrl);
    }

    if (user.role === UserRole.CLIENT && !isClientLoginAllowed(user.accountStatus)) {
      const err =
        user.accountStatus === ClientAccountStatus.REJECTED ? "account_rejected" : "account_pending";
      return NextResponse.redirect(new URL(`/connexion/clients?error=${err}`, baseUrl));
    }

    const secure = baseUrl.startsWith("https://");
    const cookieName = getNextAuthSessionCookieName(secure);

    const sessionJwt = await createNextAuthSessionToken(secret, {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      contractStatus: user.contractStatus,
      accountStatus: user.accountStatus,
    } as JWT);

    const res = NextResponse.redirect(new URL(callbackUrl, baseUrl));
    res.cookies.set(cookieName, sessionJwt, nextAuthSessionCookieOptions(secure));
    return res;
  } catch (e) {
    console.error("[team-login]", e);
    return loginErrorRedirect(baseUrl, gate, "server_error", callbackUrl);
  }
}
