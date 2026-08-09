import { sendEmail } from "@/lib/email";
import { PERMISSION_PROFILE_LABELS, type PermissionProfileKey } from "./types";

/** E-mail d’invitation Équipe — best-effort (ne bloque pas si Brevo absent). */
export async function sendEquipeInvitationEmail(opts: {
  to: string;
  inviteeName?: string | null;
  companyName?: string | null;
  permissionProfile?: string | null;
  acceptUrl: string;
  expiresAt: Date;
}): Promise<{ sent: boolean; reason?: string }> {
  const roleLabel =
    opts.permissionProfile && opts.permissionProfile in PERMISSION_PROFILE_LABELS
      ? PERMISSION_PROFILE_LABELS[opts.permissionProfile as PermissionProfileKey]
      : "Membre";
  const org = opts.companyName?.trim() || "votre entreprise";
  const name = opts.inviteeName?.trim() || "Bonjour";
  const exp = opts.expiresAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = `Invitation BeWork — ${org}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h1 style="font-size:20px;color:#1e3a5f">${name}, bienvenue</h1>
      <p>Vous êtes invité(e) à rejoindre <strong>${escape(org)}</strong> sur BeWork.</p>
      <p>Votre rôle : <strong>${escape(roleLabel)}</strong></p>
      <p style="margin:24px 0">
        <a href="${opts.acceptUrl}" style="background:#1d4ed8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Activer mon compte
        </a>
      </p>
      <p style="font-size:13px;color:#64748b">Ce lien expire le ${exp}. Si vous n’êtes pas à l’origine de cette invitation, ignorez cet e-mail.</p>
    </div>
  `;

  const result = await sendEmail({ to: opts.to, subject, html });
  if (result.ok) return { sent: true };
  return { sent: false, reason: result.reason };
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
