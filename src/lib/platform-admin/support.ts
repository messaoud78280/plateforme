/**
 * Sessions support Admin → tenant.
 * Cookie httpOnly signé + ligne DB. Pas d’impersonation User.
 */

import crypto from "crypto";
import { cookies } from "next/headers";
import { PlatformSupportMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logPlatformAdminAction } from "@/lib/platform-admin/audit";
import { isPlatformAdminRole } from "@/lib/platform-admin/role";

export const SUPPORT_COOKIE = "bework_platform_support";
export const SUPPORT_DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 h

function supportSecret(): string {
  const s =
    process.env.PLATFORM_SUPPORT_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (!s) throw new Error("PLATFORM_SUPPORT_SECRET ou NEXTAUTH_SECRET requis");
  return s;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", supportSecret()).update(value).digest("base64url");
}

export function encodeSupportCookie(sessionId: string): string {
  const sig = sign(sessionId);
  return Buffer.from(`${sessionId}.${sig}`).toString("base64url");
}

export function decodeSupportCookie(raw: string): string | null {
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot <= 0) return null;
    const sessionId = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const expected = sign(sessionId);
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
    return sessionId;
  } catch {
    return null;
  }
}

export type ActiveSupportContext = {
  sessionId: string;
  organizationId: string;
  organizationName: string;
  mode: PlatformSupportMode;
  reason: string;
  endsAt: Date;
  adminUserId: string;
};

export async function getActiveSupportSessionForAdmin(
  adminUserId: string,
): Promise<ActiveSupportContext | null> {
  const jar = await cookies();
  const raw = jar.get(SUPPORT_COOKIE)?.value;
  if (!raw) return null;
  const sessionId = decodeSupportCookie(raw);
  if (!sessionId) return null;

  const session = await prisma.platformSupportSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      adminUserId: true,
      organizationId: true,
      mode: true,
      reason: true,
      endsAt: true,
      endedAt: true,
      organization: { select: { name: true } },
    },
  });

  if (!session || session.adminUserId !== adminUserId || session.endedAt) {
    return null;
  }
  if (session.endsAt.getTime() <= Date.now()) {
    await prisma.platformSupportSession
      .update({
        where: { id: session.id },
        data: { endedAt: new Date(), endedByUserId: adminUserId },
      })
      .catch(() => undefined);
    return null;
  }

  return {
    sessionId: session.id,
    organizationId: session.organizationId,
    organizationName: session.organization.name,
    mode: session.mode,
    reason: session.reason,
    endsAt: session.endsAt,
    adminUserId: session.adminUserId,
  };
}

export async function startSupportSession(input: {
  adminUserId: string;
  organizationId: string;
  mode: PlatformSupportMode;
  reason: string;
  ttlMs?: number;
}): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const admin = await prisma.user.findUnique({
    where: { id: input.adminUserId },
    select: { platformRole: true },
  });
  if (!admin || !isPlatformAdminRole(admin.platformRole)) {
    return { ok: false, error: "Non autorisé." };
  }

  const reason = input.reason.trim();
  if (reason.length < 12) {
    return { ok: false, error: "Motif obligatoire (12 caractères min.)." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { id: true, name: true, kind: true },
  });
  if (!org) return { ok: false, error: "Organisation introuvable." };

  // Clôturer sessions ouvertes de cet admin
  await prisma.platformSupportSession.updateMany({
    where: { adminUserId: input.adminUserId, endedAt: null },
    data: { endedAt: new Date(), endedByUserId: input.adminUserId },
  });

  const endsAt = new Date(Date.now() + (input.ttlMs ?? SUPPORT_DEFAULT_TTL_MS));
  const session = await prisma.platformSupportSession.create({
    data: {
      adminUserId: input.adminUserId,
      organizationId: org.id,
      mode: input.mode,
      reason,
      endsAt,
    },
    select: { id: true },
  });

  const jar = await cookies();
  jar.set(SUPPORT_COOKIE, encodeSupportCookie(session.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor((input.ttlMs ?? SUPPORT_DEFAULT_TTL_MS) / 1000),
  });

  await logPlatformAdminAction({
    actorUserId: input.adminUserId,
    organizationId: org.id,
    action:
      input.mode === "INTERVENTION"
        ? "SUPPORT_INTERVENTION_OPEN"
        : "SUPPORT_READ_ONLY_OPEN",
    context: reason,
  });

  return { ok: true, sessionId: session.id };
}

export async function endSupportSession(adminUserId: string): Promise<{
  organizationId: string | null;
}> {
  const active = await getActiveSupportSessionForAdmin(adminUserId);
  const jar = await cookies();
  jar.delete(SUPPORT_COOKIE);

  if (!active) return { organizationId: null };

  await prisma.platformSupportSession.update({
    where: { id: active.sessionId },
    data: { endedAt: new Date(), endedByUserId: adminUserId },
  });

  await logPlatformAdminAction({
    actorUserId: adminUserId,
    organizationId: active.organizationId,
    action: "SUPPORT_CLOSED",
    context: `mode=${active.mode}`,
  });

  return { organizationId: active.organizationId };
}
