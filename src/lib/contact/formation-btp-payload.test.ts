/**
 * Garde-fou : le payload formation BTP doit embarquer tous les champs métier
 * dans le message Prisma/Brevo, sans vocabulaire IA 7 h / 14 h.
 */
import assert from "node:assert/strict";
import {
  labelFormationBtpDomain,
  labelFormationBtpLocation,
  labelFormationBtpParticipants,
} from "../formation-btp-interest";
import { validateContactBody } from "./contact-request";

const prenom = "Ali";
const nom = "Test";
const contactName = `${prenom} ${nom}`;
const companyName = "Entreprise TP Test";
const tradeActivity = "Chef d’équipe VRD";
const domain = "modes_operatoires";
const participants = "2_5";
const location = "sur_chantier";
const needs = "Renforcer les modes opératoires canalisations sur chantier.";

const messageParts = [
  "Demande d’intérêt — formation professionnelle BTP",
  `Domaine souhaité : ${labelFormationBtpDomain(domain)}`,
  `Nombre de participants : ${labelFormationBtpParticipants(participants)}`,
  `Lieu envisagé : ${labelFormationBtpLocation(location)}`,
  `Métier / fonction : ${tradeActivity}`,
  `Besoins techniques : ${needs}`,
];

const validated = validateContactBody({
  companyName,
  contactName,
  email: "ops@example.com",
  phone: "0600000000",
  marketType: "autre",
  tradeActivity,
  mainNeed: "autre",
  projectStage: location,
  message: messageParts.join("\n"),
  consent: true,
  source: "formation_interest",
  formKind: "standard",
  website: "",
});

assert.equal(validated.ok, true);
if (validated.ok) {
  assert.equal(validated.data.isTrainingInterest, true);
  assert.equal(validated.data.companyName, companyName);
  assert.equal(validated.data.contactName, contactName);
  assert.equal(validated.data.phone, "0600000000");
  assert.equal(validated.data.tradeActivity, tradeActivity);
  assert.equal(validated.data.projectStage, location);
  assert.match(validated.data.message, /formation professionnelle BTP/i);
  assert.match(validated.data.message, /Modes opératoires/i);
  assert.match(validated.data.message, /2 à 5 participants/);
  assert.match(validated.data.message, /Sur chantier/);
  assert.match(validated.data.message, /canalisations/);
  assert.equal(/7\s*h|14\s*h|300\s*€|600\s*€|Essentiel|Avancé/i.test(validated.data.message), false);
}

const subject = `[BeWork] Formation BTP – ${companyName} – ${contactName}`;
assert.match(subject, /Formation BTP/);
assert.equal(/Demande de place|7 h|14 h/i.test(subject), false);

console.log("formation-btp-payload.test.ts: OK");
