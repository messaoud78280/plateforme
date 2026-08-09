/**
 * Tests UTILISATEURS-ACCES-V2A — profils, gates, last admin, parser capacités.
 */
import assert from "node:assert/strict";
import { canManageEquipe } from "../src/lib/equipe-acces/nav-by-persona";
import { isEquipeAdminProfile } from "../src/lib/equipe-acces/last-admin";
import {
  ADD_PERSON_KINDS,
  INTERNAL_JOB_OPTIONS,
  PROFILE_CAPABILITIES,
} from "../src/lib/equipe-acces/profile-capabilities";
import {
  ACCESS_STATUS_LABELS,
  PERMISSION_PROFILE_LABELS,
  personTypesForTab,
  defaultProfileForPersonType,
} from "../src/lib/equipe-acces/types";

function test() {
  assert.equal(canManageEquipe("INTERNAL", "DIRECTION"), true);
  assert.equal(canManageEquipe("INTERNAL", "ADMINISTRATIF"), true);
  assert.equal(canManageEquipe("INTERNAL", "CONDUCTEUR"), false);
  assert.equal(canManageEquipe("CLIENT_EXT", "CLIENT"), false);
  assert.equal(canManageEquipe("SUPPLIER", "FOURNISSEUR"), false);
  assert.equal(canManageEquipe("INTERNAL", null), true);

  assert.equal(isEquipeAdminProfile("DIRECTION"), true);
  assert.equal(isEquipeAdminProfile("CONDUCTEUR"), false);

  assert.deepEqual(personTypesForTab("personnel"), ["INTERNAL"]);
  assert.ok(!personTypesForTab("personnel")!.includes("SUPPLIER"));
  assert.ok(!personTypesForTab("personnel")!.includes("CLIENT_EXT"));

  assert.equal(defaultProfileForPersonType("SUPPLIER"), "FOURNISSEUR");
  assert.equal(PERMISSION_PROFILE_LABELS.CONDUCTEUR, "Conducteur de travaux");
  assert.equal(ACCESS_STATUS_LABELS.DISABLED, "Désactivé");
  assert.equal(ACCESS_STATUS_LABELS.INVITED, "Invitation envoyée");

  assert.ok(ADD_PERSON_KINDS.some((k) => k.key === "collaborateur"));
  assert.ok(ADD_PERSON_KINDS.some((k) => k.key === "fournisseur"));
  assert.ok(INTERNAL_JOB_OPTIONS.some((j) => j.key === "CHARGE_AFFAIRES"));

  const dirCaps = PROFILE_CAPABILITIES.DIRECTION;
  assert.ok(dirCaps.some((c) => c.label.includes("équipes") && c.allowed));
  const fourCaps = PROFILE_CAPABILITIES.FOURNISSEUR;
  assert.ok(fourCaps.some((c) => c.label.includes("Planning") && !c.allowed));

  console.log("✓ test-equipe-acces-v2a OK");
}

test();
