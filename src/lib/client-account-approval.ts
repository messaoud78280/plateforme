import crypto from "crypto";
import { ClientAccountStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendClientAccountApprovedEmail, sendWelcomeEmail } from "@/lib/email";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function approvalSecret(): string {
  const s = process.env.CLIENT_APPROVAL_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (!s) throw new Error("CLIENT_APPROVAL_SECRET ou NEXTAUTH_SECRET requis");
  return s;
}

export function isClientLoginAllowed(status: ClientAccountStatus): boolean {
  return status === ClientAccountStatus.APPROVED;
}

export function createClientApprovalToken(userId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", approvalSecret()).update(payload).digest("base64url");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyClientApprovalToken(
  token: string
): { userId: string } | { error: string } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot <= 0) return { error: "Token invalide" };
    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const expected = crypto.createHmac("sha256", approvalSecret()).update(payload).digest("base64url");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return { error: "Signature invalide" };
    }
    const [userId, expStr] = payload.split(".");
    const exp = Number(expStr);
    if (!userId || !Number.isFinite(exp) || Date.now() > exp) {
      return { error: "Lien expiré ou invalide" };
    }
    return { userId };
  } catch {
    return { error: "Token invalide" };
  }
}

export type ApproveClientResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: number; error: string };

/** Valide un compte client (inscription publique). */
export async function approveClientAccount(
  clientId: string,
  approvedById: string | null,
  options?: { baseUrl?: string; notifyWelcome?: boolean }
): Promise<ApproveClientResult> {
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accountStatus: true,
    },
  });

  if (!client || client.role !== UserRole.CLIENT) {
    return { ok: false, status: 404, error: "Client introuvable" };
  }

  if (client.accountStatus === ClientAccountStatus.APPROVED) {
    return { ok: true, userId: client.id, email: client.email };
  }

  if (client.accountStatus === ClientAccountStatus.REJECTED) {
    return { ok: false, status: 400, error: "Cette inscription a été refusée." };
  }

  try {
    await prisma.user.update({
      where: { id: clientId },
      data: {
        accountStatus: ClientAccountStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: approvedById ?? undefined,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("approveClientAccount:", e);
    }
    return { ok: false, status: 500, error: "Impossible de valider le compte." };
  }

  const baseUrl = options?.baseUrl;
  if (baseUrl) {
    sendClientAccountApprovedEmail({ email: client.email, name: client.name }, { baseUrl }).catch(
      (err) => console.error("sendClientAccountApprovedEmail:", err)
    );
    if (options?.notifyWelcome !== false) {
      sendWelcomeEmail({ email: client.email, name: client.name }, { baseUrl }).catch((err) =>
        console.error("sendWelcomeEmail after approve:", err)
      );
    }
  }

  return { ok: true, userId: client.id, email: client.email };
}

export async function rejectClientAccount(
  clientId: string,
  rejectedById: string | null
): Promise<ApproveClientResult> {
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { id: true, email: true, role: true, accountStatus: true },
  });

  if (!client || client.role !== UserRole.CLIENT) {
    return { ok: false, status: 404, error: "Client introuvable" };
  }

  if (client.accountStatus === ClientAccountStatus.REJECTED) {
    return { ok: true, userId: client.id, email: client.email };
  }

  await prisma.user.update({
    where: { id: clientId },
    data: {
      accountStatus: ClientAccountStatus.REJECTED,
      approvedAt: new Date(),
      approvedById: rejectedById ?? undefined,
    },
  });

  return { ok: true, userId: client.id, email: client.email };
}
