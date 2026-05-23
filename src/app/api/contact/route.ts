import { NextRequest, NextResponse } from "next/server";
import { labelMainNeed, labelMarketType } from "@/lib/contact-form-options";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

function envTrim(s: string | undefined | null): string {
  return typeof s === "string" ? s.trim() : "";
}

/** Une ou plusieurs adresses séparées par virgule ou point-virgule */
function parseEmailRecipients(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.includes("@") && s.length > 4);
}

const PLACEHOLDER_CONTACT_EMAILS = new Set([
  "contact@votredomaine.fr",
  "contact@example.com",
  "contact@yourdomain.com",
]);

function resolveContactRecipients(): string[] {
  const raw = envTrim(process.env.CONTACT_EMAIL);
  const parsed = raw ? parseEmailRecipients(raw) : [];
  const usable = parsed.filter((e) => !PLACEHOLDER_CONTACT_EMAILS.has(e.toLowerCase()));
  if (usable.length > 0) return usable;
  return parseEmailRecipients("contact@bework.fr");
}

const contactRecipients = resolveContactRecipients();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

/** Limite simple par IP (fenêtre glissante en mémoire). */
const rateLimitWindowMs = 60 * 60 * 1000;
const rateLimitMax = 8;
const rateLimitByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateLimitByIp.get(ip) ?? []).filter((t) => now - t < rateLimitWindowMs);
  if (hits.length >= rateLimitMax) {
    rateLimitByIp.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateLimitByIp.set(ip, hits);
  return false;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }

  let body: {
    companyName?: string;
    email?: string;
    phone?: string;
    marketType?: string;
    tradeActivity?: string;
    mainNeed?: string;
    message?: string;
    consent?: boolean;
    source?: string;
    website?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (String(body.website ?? "").trim()) {
    return NextResponse.json({ ok: true });
  }

  const companyName = String(body.companyName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const marketType = String(body.marketType ?? "").trim();
  const tradeActivity = String(body.tradeActivity ?? "").trim();
  const mainNeed = String(body.mainNeed ?? "").trim();
  const message = String(body.message ?? "").trim().slice(0, 2000);
  const source = String(body.source ?? "homepage_contact_form").trim().slice(0, 120) || "homepage_contact_form";
  const consent = body.consent === true;

  if (!companyName || !email || !marketType || !mainNeed) {
    return NextResponse.json(
      { error: "Nom / entreprise, email, type de marché et besoin principal sont requis." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  if (!consent) {
    return NextResponse.json({ error: "Le consentement est obligatoire." }, { status: 400 });
  }

  const createdAt = new Date();

  try {
    await prisma.contactRequest.create({
      data: {
        structure: companyName,
        contactName: companyName,
        email,
        phone: phone || null,
        marketType,
        tradeActivity: tradeActivity || null,
        mainNeed,
        message: message || null,
        consent,
        source,
      },
    });
  } catch (e) {
    console.error("[contact] ContactRequest create error");
    return NextResponse.json(
      { error: "Erreur lors de l’enregistrement de la demande." },
      { status: 500 }
    );
  }

  const dateLabel = createdAt.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "long",
    timeStyle: "short",
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Nouvelle demande de contact BeWork</title></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0f172a;">Nouvelle demande de contact</h1>
  <p>Une demande a été envoyée depuis le formulaire BeWork.</p>

  <ul style="list-style: none; padding: 0;">
    <li><strong>Nom / entreprise :</strong> ${escapeHtml(companyName)}</li>
    <li><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></li>
    ${phone ? `<li><strong>Téléphone :</strong> ${escapeHtml(phone)}</li>` : ""}
    <li><strong>Type de marché :</strong> ${escapeHtml(labelMarketType(marketType))}</li>
    <li><strong>Corps d'état / activité :</strong> ${escapeHtml(tradeActivity || "—")}</li>
    <li><strong>Besoin principal :</strong> ${escapeHtml(labelMainNeed(mainNeed))}</li>
    <li><strong>Date de demande :</strong> ${escapeHtml(dateLabel)}</li>
    <li><strong>Source :</strong> ${escapeHtml(source)}</li>
  </ul>

  ${
    message
      ? `<h2 style="color: #1d4ed8; font-size: 1.1em; margin-top: 24px;">Message</h2>
  <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>`
      : ""
  }

  <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e4ea; font-size: 0.9em; color: #64748b;">
    Répondez à <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> pour recontacter le prospect.
  </p>
</body>
</html>
  `.trim();

  let emailSent = false;
  let providerErrorMessage: string | null = null;

  if (contactRecipients.length === 0) {
    console.warn("[contact] CONTACT_EMAIL vide ou invalide (ex. contact@bework.fr).");
  } else {
    try {
      const r = await sendEmail({
        to: contactRecipients,
        replyTo: email,
        subject: `[BeWork] Demande de contact – ${companyName}`,
        html,
      });
      if (!r.ok) {
        providerErrorMessage = `${r.reason}${r.status ? ` (status ${r.status})` : ""}`;
        console.error("[contact] Email refusé:", r.reason);
      } else {
        emailSent = true;
        console.info("[contact] Notification envoyée →", contactRecipients.join(", "));
      }
    } catch {
      providerErrorMessage = "send_failed";
      console.error("[contact] Erreur envoi email");
    }
  }

  return NextResponse.json({
    ok: true,
    emailNotificationSent: emailSent,
    ...(providerErrorMessage ? { emailError: providerErrorMessage } : {}),
  });
}
