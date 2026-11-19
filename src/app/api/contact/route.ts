import { NextRequest, NextResponse } from "next/server";
import { labelBtpServiceNeed } from "@/lib/bework-btp-services";
import { labelMainNeed, labelMarketType, labelProjectStage } from "@/lib/contact-form-options";
import {
  createIpRateLimiter,
  isHoneypotTriggered,
  resolveContactRecipients,
  validateContactBody,
} from "@/lib/contact/contact-request";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const contactRecipients = resolveContactRecipients(process.env.CONTACT_EMAIL);
const isRateLimited = createIpRateLimiter();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  // Honeypot anti-spam : réponse neutre, aucune écriture.
  if (isHoneypotTriggered(body)) {
    return NextResponse.json({ ok: true, emailNotificationSent: true, honeypot: true });
  }

  const validated = validateContactBody(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const data = validated.data;
  const stageLine = data.projectStage
    ? `Étape : ${labelProjectStage(data.projectStage)}`
    : "";
  const message = [stageLine, data.rawMessage].filter(Boolean).join("\n\n").slice(0, 4000);
  const needLabel = data.isBtpDevis
    ? labelBtpServiceNeed(data.mainNeed)
    : labelMainNeed(data.mainNeed);

  const createdAt = new Date();
  let requestId: string | null = null;

  try {
    const created = await prisma.contactRequest.create({
      data: {
        structure: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone || null,
        marketType: data.marketType,
        tradeActivity: data.tradeActivity || null,
        mainNeed: data.mainNeed,
        message: message || null,
        consent: data.consent,
        source: data.source,
      },
      select: { id: true },
    });
    requestId = created.id;
  } catch {
    console.error("[contact] ContactRequest create error");
    return NextResponse.json(
      { error: "Erreur lors de l’enregistrement de la demande." },
      { status: 500 },
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
<head><meta charset="utf-8"><title>${data.isTrainingInterest ? "Nouvelle demande de place BeWork" : "Nouvelle demande de contact BeWork"}</title></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0f172a;">${
    data.isTrainingInterest
      ? "Nouvelle demande de place"
      : data.isBtpDevis
        ? "Nouvelle demande de devis BTP"
        : "Nouvelle demande de contact"
  }</h1>
  <p>${
    data.isTrainingInterest
      ? "Une demande concerne la formation BeWork."
      : data.isBtpDevis
        ? "Une demande de devis prestations BTP a été envoyée."
        : "Une demande a été envoyée depuis le formulaire BeWork."
  }</p>

  <ul style="list-style: none; padding: 0;">
    ${requestId ? `<li><strong>Référence :</strong> ${escapeHtml(requestId)}</li>` : ""}
    ${data.isTrainingInterest ? "" : `<li><strong>Entreprise :</strong> ${escapeHtml(data.companyName)}</li>`}
    <li><strong>Contact :</strong> ${escapeHtml(data.contactName)}</li>
    <li><strong>Email :</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></li>
    ${data.phone ? `<li><strong>Téléphone :</strong> ${escapeHtml(data.phone)}</li>` : ""}
    ${data.isTrainingInterest || data.isBtpDevis ? "" : `<li><strong>Effectif :</strong> ${escapeHtml(labelMarketType(data.marketType))}</li>`}
    ${data.tradeActivity ? `<li><strong>Activité / opération :</strong> ${escapeHtml(data.tradeActivity)}</li>` : ""}
    ${data.isTrainingInterest ? "" : `<li><strong>Besoin principal :</strong> ${escapeHtml(needLabel)}</li>`}
    ${data.projectStage && !data.isTrainingInterest ? `<li><strong>Avancement du projet :</strong> ${escapeHtml(labelProjectStage(data.projectStage))}</li>` : ""}
    <li><strong>Date de demande :</strong> ${escapeHtml(dateLabel)}</li>
    <li><strong>Source :</strong> ${escapeHtml(data.source)}</li>
  </ul>

  ${
    message
      ? `<h2 style="color: #1d4ed8; font-size: 1.1em; margin-top: 24px;">Message</h2>
  <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>`
      : ""
  }

  <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e4ea; font-size: 0.9em; color: #64748b;">
    Répondez à <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a> pour recontacter le prospect.
  </p>
</body>
</html>
  `.trim();

  let emailSent = false;
  let providerErrorMessage: string | null = null;

  if (contactRecipients.length === 0) {
    console.warn("[contact] CONTACT_EMAIL vide ou invalide.");
    providerErrorMessage = "missing_contact_email";
  } else {
    try {
      const r = await sendEmail({
        to: contactRecipients,
        replyTo: data.email,
        subject: data.isTrainingInterest
          ? `[BeWork] Demande de place – ${data.contactName}`
          : data.isBtpDevis
            ? `[BeWork] Devis BTP – ${needLabel} – ${data.companyName}`
            : `[BeWork] Demande de contact – ${data.companyName}`,
        html,
      });
      if (!r.ok) {
        providerErrorMessage = `${r.reason}${r.status ? ` (status ${r.status})` : ""}`;
        console.error("[contact] Email refusé:", r.reason);
      } else {
        emailSent = true;
        console.info("[contact] Notification envoyée → destinataires configurés");
      }
    } catch {
      providerErrorMessage = "send_failed";
      console.error("[contact] Erreur envoi email");
    }
  }

  // Demande bien enregistrée, mais sans notification : ne pas simuler un succès total.
  if (!emailSent) {
    return NextResponse.json(
      {
        ok: false,
        id: requestId,
        emailNotificationSent: false,
        error:
          "Votre demande est enregistrée, mais la notification e-mail a échoué. Écrivez-nous à contact@bework.fr en indiquant la référence.",
        ...(providerErrorMessage ? { emailError: providerErrorMessage } : {}),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: requestId,
    emailNotificationSent: true,
  });
}
