import assert from "node:assert/strict";
import {
  CREATE_CHANTIER_STAFF_MISSING_CLIENT_ERROR,
  staffRequiresClientId,
} from "./create-chantier-contract";

assert.equal(staffRequiresClientId(true), true);
assert.equal(staffRequiresClientId(false), false);
assert.equal(
  CREATE_CHANTIER_STAFF_MISSING_CLIENT_ERROR,
  "Sélectionnez un client pour ce chantier.",
);

console.log("create-chantier-contract tests OK");
