import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { nextAuthEmailVerificationTokenHash } from "@/lib/nextauth-verification-hash";
import { absoluteUrl, canonicalRequestOrigin } from "@/lib/site";

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

function isValidEmail(email: string): boolean {
  const e = email.trim();
  if (!e) return false;
  // Validation simple et robuste (pas de RFC complète, mais évite les cas évidents)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(e);
}

function hasBrevoApiKey(): boolean {
  return Boolean((process.env.BREVO_API_KEY ?? "").trim());
}

function getEmailFrom(): { email: string; name?: string } {
  const email = (process.env.EMAIL_FROM ?? "").trim();
  if (!email) throw new Error("Missing EMAIL_FROM");
  const name = (process.env.EMAIL_FROM_NAME ?? "BeWork").trim();
  return { email, name: name || undefined };
}

function truncate(s: string, max = 1200): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export type SendEmailResult =
  | { ok: true; provider: "brevo"; messageId?: string }
  | { ok: false; provider: "brevo"; reason: string; status?: number };

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const apiKey = (process.env.BREVO_API_KEY ?? "").trim();
  if (!apiKey) {
    console.error("[Email] Brevo: BREVO_API_KEY manquant.");
    return { ok: false, provider: "brevo", reason: "missing_brevo_api_key" };
  }

  let from: { email: string; name?: string };
  try {
    from = getEmailFrom();
  } catch (e) {
    console.error("[Email] Brevo: expéditeur invalide. Configurez EMAIL_FROM (+ EMAIL_FROM_NAME).", e);
    return { ok: false, provider: "brevo", reason: "missing_email_from" };
  }

  const toList = (Array.isArray(params.to) ? params.to : [params.to])
    .map((e) => e.trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  if (toList.length === 0) {
    console.error("[Email] Brevo: destinataire vide.");
    return { ok: false, provider: "brevo", reason: "missing_recipient" };
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.BREVO_API_TIMEOUT_MS || "20000");
  const t = setTimeout(() => controller.abort(), timeoutMs);

  const payload = {
    sender: from,
    to: toList,
    subject: params.subject,
    htmlContent: params.html,
    ...(params.replyTo ? { replyTo: { email: params.replyTo } } : {}),
  };

  try {
    console.info("[Email] Brevo API → envoi", {
      to: toList.map((x) => x.email),
      subject: params.subject,
      timeoutMs,
      from: from.email,
    });

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.toLowerCase().includes("application/json");
    const bodyText = await res.text().catch(() => "");
    const bodyJson = isJson ? (JSON.parse(bodyText || "null") as unknown) : null;

    if (!res.ok) {
      console.error("[Email] Brevo API refus", {
        status: res.status,
        body: truncate(typeof bodyJson === "object" && bodyJson ? JSON.stringify(bodyJson) : bodyText),
      });
      return { ok: false, provider: "brevo", reason: "brevo_refused", status: res.status };
    }

    const messageId =
      typeof bodyJson === "object" && bodyJson !== null && "messageId" in bodyJson
        ? String((bodyJson as { messageId?: unknown }).messageId ?? "")
        : undefined;

    console.info("[Email] Brevo API ← envoyé", { to: toList.map((x) => x.email), messageId });
    return { ok: true, provider: "brevo", messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[Email] Brevo API exception", { message: msg, to: toList.map((x) => x.email) }, e);
    return { ok: false, provider: "brevo", reason: "brevo_exception" };
  } finally {
    clearTimeout(t);
  }
}

export type SendWelcomeEmailResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function sendWelcomeEmail(
  user: { email: string; name?: string | null },
  opts?: { baseUrl?: string }
): Promise<SendWelcomeEmailResult> {
  if (!isValidEmail(user.email)) {
    console.warn("[sendWelcomeEmail] email invalide:", user.email);
    return { ok: false, reason: "invalid_email" };
  }
  if (!hasBrevoApiKey()) {
    console.warn("[sendWelcomeEmail] ignoré : BREVO_API_KEY manquant.");
    return { ok: false, reason: "no_mail_provider" };
  }

  const firstName = (user.name ?? "").trim();

  // Même identifiant que dans l’URL du mail (minuscules). L’utilisateur en base est retrouvé même avec une autre casse via l’adaptateur Auth.
  const existing = await prisma.user.findFirst({
    where: { email: { equals: user.email.trim(), mode: "insensitive" } },
    select: { email: true },
  });
  const to = (existing?.email ?? user.email).trim().toLowerCase();

  // Toujours le même domaine dans le mail (sinon localhost vs 127.0.0.1 casse cookie + hash secret).
  const origin = canonicalRequestOrigin(opts?.baseUrl);

  if (!(process.env.NEXTAUTH_SECRET ?? "").trim()) {
    console.warn("[sendWelcomeEmail] NEXTAUTH_SECRET manquant : le bouton « Accéder à mon espace » échouera côté NextAuth.");
  }

  // Lien officiel NextAuth (Email provider) -> session réellement valide
  // On stocke le token hashé en base (VerificationToken) et on met le token brut dans l'URL.
  let loginUrl = `${origin}/connexion/clients`;
  try {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = nextAuthEmailVerificationTokenHash(rawToken, origin);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: to,
        token: tokenHash,
        expires,
      },
    });

    const callbackUrl = `${origin}/dashboard`;
    const url = new URL("/api/auth/callback/email", origin);
    url.searchParams.set("token", rawToken);
    url.searchParams.set("email", to);
    url.searchParams.set("callbackUrl", callbackUrl);
    loginUrl = url.toString();
  } catch (e) {
    // Si la table n'est pas encore en place ou DB KO, on garde un lien de secours vers la page connexion.
    console.error("Magic link generation failed (VerificationToken):", e);
  }
  const subject = "Bienvenue sur BeWork — votre espace est prêt";

  const greeting = firstName ? `Bonjour ${escapeHtml(firstName)},` : "Bonjour,";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bienvenue sur BeWork</title>
</head>
<body style="margin:0; padding:0; background:#ffffff;">
  <div style="width:100%; background:#ffffff; padding:24px 16px;">
    <div style="max-width:640px; margin:0 auto; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#0f172a; line-height:1.55;">
      <h1 style="margin:0 0 14px 0; font-size:24px; letter-spacing:-0.02em;">Bienvenue sur BeWork</h1>

      <p style="margin:0 0 14px 0; color:#334155; font-size:15px;">${greeting}</p>
      <p style="margin:0 0 16px 0; color:#334155; font-size:15px;">
        Votre compte a bien été créé.
      </p>
      <p style="margin:0 0 18px 0; color:#334155; font-size:15px;">
        Vous pouvez dès maintenant accéder à votre espace sécurisé pour déposer vos demandes et suivre vos échanges.
      </p>

      <div style="margin:22px 0 18px 0;">
        <a href="${loginUrl}" style="display:inline-block; background:#1d4ed8; color:#ffffff; text-decoration:none; padding:12px 16px; border-radius:10px; font-weight:700; font-size:14px;">
          Accéder à mon espace
        </a>
      </div>

      <p style="margin:0 0 8px 0; color:#334155; font-size:15px;">
        Notre équipe est prête à vous accompagner dans la gestion de votre administratif.
      </p>
      <p style="margin:18px 0 0 0; color:#334155; font-size:15px;">
        L’équipe BeWork
      </p>

      <p style="margin:16px 0 0 0; font-size:12px; color:#64748b;">
        Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
        <br>
        <a href="${loginUrl}" style="color:#1d4ed8; text-decoration:none;">${loginUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const sent = await sendEmail({ to, subject, html });
    if (!sent.ok) {
      console.error("[sendWelcomeEmail] échec transport (Brevo).", sent);
      return { ok: false, reason: "transport_failed" };
    }
    return { ok: true };
  } catch (e) {
    console.error("sendWelcomeEmail error:", e);
    return { ok: false, reason: "exception" };
  }
}

export async function sendNewTaskEmail(params: {
  taskId: string;
  taskTitle: string;
  clientName: string;
  clientEmail?: string | null;
}) {
  if (!hasBrevoApiKey()) return;
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
    await sendEmail({ to, subject, html, replyTo });
  } catch (e) {
    console.error("sendNewTaskEmail error:", e);
  }
}

function formatValue(v: string | undefined | null): string {
  const s = (v ?? "").toString().trim();
  return s ? escapeHtml(s) : "Non renseigné";
}

function formatDateTimeFr(d: Date): string {
  try {
    return new Date(d).toLocaleString("fr-FR");
  } catch {
    return String(d);
  }
}

export async function sendAdminNewUserNotification(user: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  createdAt?: Date | string | null;
}) {
  const rawTo = (process.env.ADMIN_NOTIFICATION_EMAIL ?? "").trim();
  if (!rawTo) return;

  const to = parseList(rawTo).filter((e) => isValidEmail(e));
  if (to.length === 0) return;
  if (!hasBrevoApiKey()) return;

  const created =
    user.createdAt instanceof Date
      ? user.createdAt
      : user.createdAt
        ? new Date(user.createdAt)
        : new Date();

  const subject = "Nouvelle inscription client BeWork";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nouvelle inscription</title></head>
<body style="margin:0; padding:0; background:#ffffff;">
  <div style="width:100%; background:#ffffff; padding:20px 16px;">
    <div style="max-width:680px; margin:0 auto; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#0f172a; line-height:1.55;">
      <h1 style="margin:0 0 12px 0; font-size:20px; letter-spacing:-0.01em;">Nouvelle inscription client</h1>
      <p style="margin:0 0 14px 0; color:#334155; font-size:14px;">
        Un nouveau compte client vient d’être créé sur BeWork.
      </p>

      <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px 16px; background:#f8fafc;">
        <p style="margin:0 0 8px 0; font-size:14px;"><strong>Nom :</strong> ${formatValue(user.name)}</p>
        <p style="margin:0 0 8px 0; font-size:14px;"><strong>Email :</strong> ${formatValue(user.email)}</p>
        <p style="margin:0 0 8px 0; font-size:14px;"><strong>Téléphone :</strong> ${formatValue(user.phone)}</p>
        <p style="margin:0 0 8px 0; font-size:14px;"><strong>Type de compte :</strong> ${formatValue(user.role ?? "CLIENT")}</p>
        <p style="margin:0; font-size:14px;"><strong>Date d’inscription :</strong> ${escapeHtml(formatDateTimeFr(created))}</p>
      </div>

      <p style="margin:14px 0 0 0; color:#334155; font-size:14px;">
        <strong>Action :</strong> Contactez rapidement ce prospect pour qualifier son besoin et l’accompagner dans sa première demande.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await sendEmail({ to, subject, html });
  } catch (e) {
    console.error("sendAdminNewUserNotification error:", e);
  }
}

