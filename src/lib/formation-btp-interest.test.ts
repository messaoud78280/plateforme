import assert from "node:assert/strict";
import {
  FORMATION_BTP_DOMAIN_OPTIONS,
  FORMATION_BTP_LOCATION_OPTIONS,
  FORMATION_BTP_PARTICIPANT_OPTIONS,
  labelFormationBtpDomain,
  labelFormationBtpLocation,
  labelFormationBtpParticipants,
} from "./formation-btp-interest";

assert.ok(FORMATION_BTP_DOMAIN_OPTIONS.some((o) => o.value === "modes_operatoires"));
assert.ok(FORMATION_BTP_DOMAIN_OPTIONS.some((o) => o.value === "techniques_tp_vrd"));
assert.equal(
  labelFormationBtpDomain("conduite_travaux"),
  "Conduite de travaux",
);
assert.equal(labelFormationBtpParticipants("2_5"), "2 à 5 participants");
assert.equal(labelFormationBtpLocation("sur_chantier"), "Sur chantier");
assert.equal(FORMATION_BTP_LOCATION_OPTIONS.length, 3);
assert.equal(FORMATION_BTP_PARTICIPANT_OPTIONS.length, 4);

// Garde-fou commercial : pas de mention Qualiopi / CPF dans les libellés.
const allLabels = [
  ...FORMATION_BTP_DOMAIN_OPTIONS,
  ...FORMATION_BTP_PARTICIPANT_OPTIONS,
  ...FORMATION_BTP_LOCATION_OPTIONS,
]
  .map((o) => o.label.toLowerCase())
  .join(" ");
assert.equal(allLabels.includes("qualiopi"), false);
assert.equal(allLabels.includes("cpf"), false);

console.log("formation-btp-interest.test.ts: OK");
