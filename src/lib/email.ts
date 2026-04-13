"use server";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function parseList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendNewTaskEmail(params: {
  taskId: string;
  taskTitle: string;
  clientName: string;
  clientEmail?: string | null;
}) {
  if (!resend) return;
  const to =
    parseList(process.env.NEW_TASK_EMAIL_TO).length > 0
      ? parseList(process.env.NEW_TASK_EMAIL_TO)
      : (
          await prisma.user.findMany({
            where: { role: "MANAGER", email: { not: "" } },
            select: { email: true },
          })
        )
          .map((u) => u.email)
          .filter(Boolean);

  if (to.length === 0) return;

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME || "BeWork";

  const missionUrl = absoluteUrl(`/dashboard/taches/${params.taskId}`);

  const subject = `[BeWork] Nouvelle demande – ${params.clientName} – ${params.taskTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Nouvelle demande BeWork</title></head>
<body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5; color: #0f172a; max-width: 640px; margin: 0 auto; padding: 20px;">
  <h1 style="margin:0 0 12px 0;">Nouvelle demande client</h1>
  <p style="margin:0 0 16px 0; color:#334155;">
    <strong>${escapeHtml(params.clientName)}</strong> a déposé une nouvelle mission.
  </p>
  <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px 16px; background:#f8fafc;">
    <p style="margin:0; font-size:14px; color:#475569;">Titre</p>
    <p style="margin:6px 0 0 0; font-size:16px;"><strong>${escapeHtml(params.taskTitle)}</strong></p>
    ${
      params.clientEmail
        ? `<p style="margin:10px 0 0 0; font-size:14px; color:#475569;">Email client : <a href="mailto:${escapeHtml(
            params.clientEmail
          )}" style="color:#1d4ed8; text-decoration:none;">${escapeHtml(params.clientEmail)}</a></p>`
        : ""
    }
  </div>

  <p style="margin:18px 0 0 0;">
    <a href="${missionUrl}" style="display:inline-block; background:#1d4ed8; color:#fff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:600;">
      Ouvrir la mission
    </a>
  </p>

  <p style="margin:18px 0 0 0; font-size:12px; color:#64748b;">
    Lien direct : <a href="${missionUrl}" style="color:#1d4ed8;">${missionUrl}</a>
  </p>
</body>
</html>
  `.trim();

  const replyTo = params.clientEmail?.trim() ? params.clientEmail.trim() : undefined;

  try {
    const { error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) console.error("Resend error:", error);
  } catch (e) {
    console.error("sendNewTaskEmail error:", e);
  }
}

