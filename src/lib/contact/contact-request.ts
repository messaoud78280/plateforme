/**
 * Validation et assemblage des demandes de contact / devis BTP.
 * Isolé pour tests sans appeler Brevo ni Prisma.
 */

export type ContactFormBody = {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  marketType?: string;
  tradeActivity?: string;
  mainNeed?: string;
  projectStage?: string;
  message?: string;
  consent?: boolean;
  source?: string;
  website?: string;
  formKind?: string;
};

export type NormalizedContactRequest = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  marketType: string;
  tradeActivity: string;
  mainNeed: string;
  projectStage: string;
  rawMessage: string;
  message: string;
  consent: boolean;
  source: string;
  formKind: string;
  isIdea: boolean;
  isBtpDevis: boolean;
  isTrainingInterest: boolean;
};

export function isValidContactEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

export function isHoneypotTriggered(body: ContactFormBody): boolean {
  return Boolean(String(body.website ?? "").trim());
}

export function parseEmailRecipients(raw: string): string[] {
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

export function resolveContactRecipients(rawContactEmail: string | undefined): string[] {
  const parsed = rawContactEmail ? parseEmailRecipients(rawContactEmail.trim()) : [];
  const usable = parsed.filter((e) => !PLACEHOLDER_CONTACT_EMAILS.has(e.toLowerCase()));
  if (usable.length > 0) return usable;
  return parseEmailRecipients("contact@bework.fr");
}

/** Rate-limit mémoire — window 1 h, max 8. */
export function createIpRateLimiter(windowMs = 60 * 60 * 1000, max = 8) {
  const byIp = new Map<string, number[]>();
  return function isRateLimited(ip: string, now = Date.now()): boolean {
    const hits = (byIp.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (hits.length >= max) {
      byIp.set(ip, hits);
      return true;
    }
    hits.push(now);
    byIp.set(ip, hits);
    return false;
  };
}

export type ContactValidationResult =
  | { ok: true; data: NormalizedContactRequest }
  | { ok: false; error: string };

export function validateContactBody(body: ContactFormBody): ContactValidationResult {
  const companyName = String(body.companyName ?? "").trim();
  const contactNameRaw = String(body.contactName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const formKind = String(body.formKind ?? "").trim();
  const source =
    String(body.source ?? "homepage_contact_form").trim().slice(0, 120) ||
    "homepage_contact_form";
  const isIdea = formKind === "idea";
  const isBtpDevis = formKind === "btp_devis" || source === "btp_devis_form";
  const marketType = String(body.marketType ?? "").trim() || (isIdea || isBtpDevis ? "autre" : "");
  const tradeActivity = String(body.tradeActivity ?? "").trim();
  const mainNeed =
    String(body.mainNeed ?? "").trim() || (isIdea ? "ne_sais_pas_encore" : "");
  const projectStage = String(body.projectStage ?? "").trim();
  const rawMessage = String(body.message ?? "").trim();
  const consent = body.consent === true;
  const contactName = contactNameRaw || companyName;
  const isTrainingInterest = source === "formation_interest";

  if (!companyName || !email || !marketType || !mainNeed) {
    return {
      ok: false,
      error: isBtpDevis
        ? "Entreprise, e-mail et prestation sont requis."
        : "Nom / entreprise, email, type de marché et besoin principal sont requis.",
    };
  }

  if ((isIdea || isBtpDevis) && !rawMessage) {
    return {
      ok: false,
      error: isBtpDevis
        ? "Décrivez votre chantier ou votre besoin."
        : "Décrivez votre besoin ou votre idée.",
    };
  }

  if (isBtpDevis && !contactNameRaw) {
    return { ok: false, error: "Le nom du contact est requis." };
  }

  if (isBtpDevis && !phone) {
    return { ok: false, error: "Le téléphone est requis." };
  }

  if (!isValidContactEmail(email)) {
    return { ok: false, error: "Adresse email invalide." };
  }

  if (!consent) {
    return { ok: false, error: "Le consentement est obligatoire." };
  }

  return {
    ok: true,
    data: {
      companyName,
      contactName,
      email,
      phone,
      marketType,
      tradeActivity,
      mainNeed,
      projectStage,
      rawMessage,
      message: rawMessage.slice(0, 4000),
      consent,
      source,
      formKind,
      isIdea,
      isBtpDevis,
      isTrainingInterest,
    },
  };
}
