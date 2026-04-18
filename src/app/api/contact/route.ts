import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

export async function POST(request: NextRequest) {
  let body: {
    structure?: string;
    denominationSociale?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    formule?: string;
    message?: string;
    rdvDate?: string;
    rdvTime?: string;
    sector?: string;
    howKnown?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const structure = String(body.structure ?? "").trim();
  const contactName = String(body.contactName ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (!structure || !contactName || !email) {
    return NextResponse.json(
      { error: "Structure, nom du contact et email sont requis." },
      { status: 400 }
    );
  }

  const denominationSociale = String(body.denominationSociale ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const formule = String(body.formule ?? "").trim();
  const message = String(body.message ?? "").trim();
  const rdvDate = String(body.rdvDate ?? "").trim();
  const rdvTime = String(body.rdvTime ?? "").trim();
  const sector = String(body.sector ?? "").trim();
  const howKnown = String(body.howKnown ?? "").trim();

  const rdvDateOnly = rdvDate ? new Date(rdvDate + "T00:00:00.000Z") : null;

  try {
    await prisma.contactRequest.create({
      data: {
        structure,
        denominationSociale: denominationSociale || null,
        contactName,
        email,
        phone: phone || null,
        formule: formule || null,
        message: message || null,
        rdvDate: rdvDateOnly,
        rdvTime: rdvTime || null,
        sector: sector || null,
        howKnown: howKnown || null,
      },
    });
  } catch (e) {
    console.error("ContactRequest create error:", e);
    return NextResponse.json(
      { error: "Erreur lors de l’enregistrement de la demande." },
      { status: 500 }
    );
  }

  const rdvLabel =
    rdvDate && rdvTime
      ? `${rdvDate} à ${rdvTime.replace(":", "h")}`
      : rdvDate
        ? rdvDate
        : "Non indiqué";

  const howKnownLabels: Record<string, string> = {
    recherche: "Recherche internet",
    recommandation: "Recommandation",
    reseau: "Réseaux sociaux",
    salon: "Salon / événement",
    autre: "Autre",
  };

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Nouvelle demande de contact BeWork</title></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0f172a;">Nouvelle demande de contact</h1>
  <p>Une nouvelle demande a été envoyée depuis le formulaire de contact BeWork.</p>

  <h2 style="color: #1d4ed8; font-size: 1.1em; margin-top: 24px;">Structure</h2>
  <ul style="list-style: none; padding: 0;">
    <li><strong>Nom de la structure :</strong> ${escapeHtml(structure)}</li>
    ${denominationSociale ? `<li><strong>Dénomination sociale :</strong> ${escapeHtml(denominationSociale)}</li>` : ""}
  </ul>

  <h2 style="color: #1d4ed8; font-size: 1.1em; margin-top: 24px;">Contact</h2>
  <ul style="list-style: none; padding: 0;">
    <li><strong>Nom :</strong> ${escapeHtml(contactName)}</li>
    <li><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></li>
    ${phone ? `<li><strong>Téléphone :</strong> ${escapeHtml(phone)}</li>` : ""}
  </ul>

  <h2 style="color: #1d4ed8; font-size: 1.1em; margin-top: 24px;">Formule et rendez-vous</h2>
  <ul style="list-style: none; padding: 0;">
    ${formule ? `<li><strong>Formule choisie :</strong> ${escapeHtml(formule)}</li>` : ""}
    <li><strong>Créneau demandé :</strong> ${escapeHtml(rdvLabel)}</li>
    <p style="margin-top: 8px; color: #64748b; font-size: 0.95em;">Lors du premier RDV en visioconférence, vous pourrez expliquer le mode opératoire et les conditions.</p>
  </ul>

  ${message ? `
  <h2 style="color: #1d4ed8; font-size: 1.1em; margin-top: 24px;">Message</h2>
  <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
  ` : ""}

  ${(sector || howKnown) ? `
  <h2 style="color: #1d4ed8; font-size: 1.1em; margin-top: 24px;">Compléments</h2>
  <ul style="list-style: none; padding: 0;">
    ${sector ? `<li><strong>Secteur d'activité :</strong> ${escapeHtml(sector)}</li>` : ""}
    ${howKnown ? `<li><strong>Comment nous a-t-il connu :</strong> ${howKnownLabels[howKnown] || howKnown}</li>` : ""}
  </ul>
  ` : ""}

  <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e4ea; font-size: 0.9em; color: #64748b;">
    Répondez à <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> pour confirmer le rendez-vous et envoyer le lien de visioconférence.
  </p>
</body>
</html>
  `.trim();

  let emailSent = false;
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.warn(
      "[contact] Aucun RESEND_API_KEY : la demande est enregistrée en base mais aucun mail d’alerte n’est envoyé. Configurez Resend sur Railway (voir .env.example)."
    );
  } else if (!CONTACT_EMAIL?.trim()) {
    console.warn(
      "[contact] CONTACT_EMAIL (ou RESEND_FROM_EMAIL) manquant : précisez l’adresse qui doit recevoir les demandes."
    );
  } else if (resend) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const fromName = process.env.RESEND_FROM_NAME || "BeWork Contact";
    try {
      const { error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [CONTACT_EMAIL.trim()],
        replyTo: email,
        subject: `[BeWork] Demande de contact – ${structure} – ${contactName}`,
        html,
      });
      if (error) {
        console.error("Resend error:", error);
      } else {
        emailSent = true;
      }
    } catch (e) {
      console.error("Contact email error:", e);
    }
  }

  return NextResponse.json({ ok: true, emailNotificationSent: emailSent });
}
