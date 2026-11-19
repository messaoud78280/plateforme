import assert from "node:assert/strict";
import {
  createIpRateLimiter,
  isHoneypotTriggered,
  isValidContactEmail,
  resolveContactRecipients,
  validateContactBody,
} from "./contact-request";

const baseDevis = {
  companyName: "Entreprise Test SARL",
  contactName: "Ali Test",
  email: "test@example.com",
  phone: "0600000000",
  marketType: "autre",
  tradeActivity: "tp_vrd",
  mainNeed: "conducteur_travaux",
  projectStage: "",
  message: "TEST BEWORK — audit formulaire (ne pas traiter).",
  consent: true,
  source: "btp_devis_form",
  formKind: "btp_devis",
  website: "",
};

// --- E-mail ---
assert.equal(isValidContactEmail("a@b.co"), true);
assert.equal(isValidContactEmail("invalid"), false);
assert.equal(isValidContactEmail("a@b"), false);
assert.equal(isValidContactEmail(""), false);

// --- Honeypot ---
assert.equal(isHoneypotTriggered({ website: "" }), false);
assert.equal(isHoneypotTriggered({ website: "   " }), false);
assert.equal(isHoneypotTriggered({ website: "http://spam.test" }), true);

// --- Destinataires ---
assert.deepEqual(resolveContactRecipients("contact@bework.fr"), ["contact@bework.fr"]);
assert.deepEqual(
  resolveContactRecipients("ops@bework.fr; contact@bework.fr"),
  ["ops@bework.fr", "contact@bework.fr"],
);
assert.deepEqual(
  resolveContactRecipients("contact@votredomaine.fr"),
  ["contact@bework.fr"],
  "placeholder → fallback contact@bework.fr",
);
assert.deepEqual(
  resolveContactRecipients(undefined),
  ["contact@bework.fr"],
  "CONTACT_EMAIL absent → fallback contact@bework.fr",
);

// --- Validation devis BTP ---
{
  const ok = validateContactBody(baseDevis);
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.data.isBtpDevis, true);
    assert.equal(ok.data.email, "test@example.com");
    assert.match(ok.data.message, /TEST BEWORK/);
  }
}

{
  const missingPhone = validateContactBody({ ...baseDevis, phone: "" });
  assert.equal(missingPhone.ok, false);
  if (!missingPhone.ok) assert.match(missingPhone.error, /téléphone/i);
}

{
  const missingContact = validateContactBody({ ...baseDevis, contactName: "" });
  assert.equal(missingContact.ok, false);
  if (!missingContact.ok) assert.match(missingContact.error, /contact/i);
}

{
  const badEmail = validateContactBody({ ...baseDevis, email: "pas-un-email" });
  assert.equal(badEmail.ok, false);
  if (!badEmail.ok) assert.match(badEmail.error, /email/i);
}

{
  const noConsent = validateContactBody({ ...baseDevis, consent: false });
  assert.equal(noConsent.ok, false);
  if (!noConsent.ok) assert.match(noConsent.error, /consentement/i);
}

{
  const noMessage = validateContactBody({ ...baseDevis, message: "" });
  assert.equal(noMessage.ok, false);
  if (!noMessage.ok) assert.match(noMessage.error, /chantier|besoin/i);
}

// --- Rate limit (simulé, sans réseau) ---
{
  const limited = createIpRateLimiter(60_000, 3);
  assert.equal(limited("1.1.1.1"), false);
  assert.equal(limited("1.1.1.1"), false);
  assert.equal(limited("1.1.1.1"), false);
  assert.equal(limited("1.1.1.1"), true, "4e hit → limité");
  assert.equal(limited("2.2.2.2"), false, "autre IP non limitée");
}

console.log("contact-request.test.ts: OK");
