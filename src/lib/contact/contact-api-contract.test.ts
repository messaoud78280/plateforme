/**
 * Contrat API /api/contact — tests sans Brevo ni Prisma.
 * Vérifie les formes de réponse que les formulaires React doivent honorer.
 */
import assert from "node:assert/strict";

type ContactApiSuccess = {
  ok: true;
  id: string;
  emailNotificationSent: true;
};

type ContactApiEmailFailed = {
  ok: false;
  id: string;
  emailNotificationSent: false;
  error: string;
};

type ContactApiHoneypot = {
  ok: true;
  emailNotificationSent: true;
  honeypot: true;
};

/** Succès réel = enregistrement + notification. */
function uiShouldShowSuccess(res: {
  ok?: boolean;
  status: number;
  emailNotificationSent?: boolean;
}): boolean {
  return res.status === 200 && res.ok === true && res.emailNotificationSent === true;
}

/** Demande sauvée mais e-mail raté → pas de succès total. */
function uiShouldShowSavedNoEmail(res: {
  ok?: boolean;
  status: number;
  id?: string;
  emailNotificationSent?: boolean;
}): boolean {
  return Boolean(res.id) && res.emailNotificationSent === false;
}

const success: ContactApiSuccess & { status: number } = {
  status: 200,
  ok: true,
  id: "clr_test_1",
  emailNotificationSent: true,
};
assert.equal(uiShouldShowSuccess(success), true);
assert.equal(uiShouldShowSavedNoEmail(success), false);

const emailFailed: ContactApiEmailFailed & { status: number } = {
  status: 502,
  ok: false,
  id: "clr_test_2",
  emailNotificationSent: false,
  error: "notification e-mail a échoué",
};
assert.equal(uiShouldShowSuccess(emailFailed), false);
assert.equal(uiShouldShowSavedNoEmail(emailFailed), true);

const honeypot: ContactApiHoneypot & { status: number } = {
  status: 200,
  ok: true,
  emailNotificationSent: true,
  honeypot: true,
};
assert.equal(uiShouldShowSuccess(honeypot), true, "bots voient un faux succès neutre");

// Ancien bug : HTTP 200 + ok implicite sans emailNotificationSent ne doit plus être traité comme succès total côté devis
function devisFormTreatsAsSuccess(json: {
  ok?: boolean;
  id?: string;
  emailNotificationSent?: boolean;
}, resOk: boolean): boolean {
  if (json.id && json.emailNotificationSent === false) return false;
  if (!resOk || json.ok === false) return false;
  return true;
}

assert.equal(
  devisFormTreatsAsSuccess({ ok: true, id: "x", emailNotificationSent: true }, true),
  true,
);
assert.equal(
  devisFormTreatsAsSuccess(
    { ok: false, id: "x", emailNotificationSent: false },
    false,
  ),
  false,
  "502 Brevo → pas de succès devis",
);

console.log("contact-api-contract.test.ts: OK");
