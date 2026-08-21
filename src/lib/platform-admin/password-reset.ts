/**
 * Réinitialisation mot de passe — Administration BeWork uniquement.
 * Tokens stockés hashés dans VerificationToken (identifier platform-admin-reset:email).
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { canonicalRequestOrigin } from "@/lib/site";
import { isPlatformAdminRole } from "@/lib/platform-admin/role";
import { logPlatformAdminAction } from "@/lib/platform-admin/audit";

const RESET_TTL_MS = 24 * 60 * 60 * 1000;

function resetIdentifier(email: string): string {
  return `platform-admin-reset:${email.trim().toLowerCase()}`;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPlatformAdminPasswordReset(input: {
  email: string;
  baseUrl?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Email requis." };

  // Réponse uniforme (anti-énumération)
  const softOk = { ok: true as const };

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, name: true, platformRole: true },
  });

  if (!user || !isPlatformAdminRole(user.platformRole)) {
    return softOk;
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const identifier = resetIdentifier(user.email);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: tokenHash, expires },
  });

  const origin = canonicalRequestOrigin(input.baseUrl);
  const url = `${origin}/admin/reinitialiser-mot-de-passe?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.55;color:#0f172a;padding:24px;">
  <h1 style="font-size:20px;margin:0 0 12px;">Réinitialisation — Administration BeWork</h1>
  <p style="font-size:14px;color:#334155;">Bonjour ${(user.name || "").split(" ")[0] || ""},</p>
  <p style="font-size:14px;color:#334155;">Cliquez pour définir un nouveau mot de passe administrateur (lien valable 24 h).</p>
  <p style="margin:18px 0;">
    <a href="${url}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;">
      Définir mon mot de passe
    </a>
  </p>
  <p style="font-size:12px;color:#64748b;">Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.</p>
</body></html>`.trim();

  const sent = await sendEmail({
    to: user.email,
    subject: "BeWork Admin — réinitialisation du mot de passe",
    html,
  });

  if (!sent.ok) {
    console.error("[platform-admin] reset email failed:", sent.reason);
    // Token créé : l’admin peut encore utiliser un lien déjà communiqué hors bande
  }

  await logPlatformAdminAction({
    actorUserId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    context: "email_sent_attempt",
  });

  return softOk;
}

export async function completePlatformAdminPasswordReset(input: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const token = input.token.trim();
  const newPassword = input.newPassword;

  if (!email || !token) return { ok: false, error: "Lien invalide." };
  if (newPassword.length < 12) {
    return { ok: false, error: "Mot de passe trop court (12 caractères min.)." };
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, platformRole: true },
  });
  if (!user || !isPlatformAdminRole(user.platformRole)) {
    return { ok: false, error: "Lien invalide ou expiré." };
  }

  const identifier = resetIdentifier(user.email);
  const tokenHash = hashToken(token);
  const row = await prisma.verificationToken.findFirst({
    where: { identifier, token: tokenHash },
  });
  if (!row || row.expires.getTime() < Date.now()) {
    return { ok: false, error: "Lien invalide ou expiré." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 12),
        mustChangePassword: false,
      },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier } }),
  ]);

  await logPlatformAdminAction({
    actorUserId: user.id,
    action: "PASSWORD_RESET_COMPLETED",
    context: null,
  });

  return { ok: true };
}
