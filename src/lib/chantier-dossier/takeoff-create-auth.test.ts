/**
 * Tests auth CREATE métré — pure (aucune DB).
 * node --import tsx src/lib/chantier-dossier/takeoff-create-auth.test.ts
 */
import assert from "node:assert/strict";
import { takeoffCreateCommitForbiddenReason } from "./takeoff-create-auth";

function run() {
  // A — utilisateur autorisé (y compris role CLIENT org) + accès chantier
  {
    const r = takeoffCreateCommitForbiddenReason({
      hasProjectWriteAccess: true,
      role: "CLIENT",
    });
    assert.equal(r.forbidden, false, "A CLIENT+accès → CREATE OK");
    assert.equal(r.code, null);
  }

  // B — utilisateur non autorisé
  {
    const r = takeoffCreateCommitForbiddenReason({
      hasProjectWriteAccess: false,
      role: "CLIENT",
    });
    assert.equal(r.forbidden, true, "B sans accès → 403");
    assert.equal(r.code, "FORBIDDEN");
    assert.ok(r.reason?.includes("non autorisée"));
  }

  // C — autre org = pas d'accès chantier
  {
    const r = takeoffCreateCommitForbiddenReason({
      hasProjectWriteAccess: false,
      role: "AGENCE",
    });
    assert.equal(r.forbidden, true, "C autre org → refus");
  }

  // Régression : ne plus bloquer CLIENT seul (ancien bug ROCKMAN)
  {
    const r = takeoffCreateCommitForbiddenReason({
      hasProjectWriteAccess: true,
      role: "CLIENT",
    });
    assert.equal(
      r.forbidden,
      false,
      "role CLIENT ne doit plus produire « Modification non autorisée »",
    );
  }

  // Staff avec accès
  {
    const r = takeoffCreateCommitForbiddenReason({
      hasProjectWriteAccess: true,
      role: "AGENCE",
    });
    assert.equal(r.forbidden, false);
  }

  console.log("takeoff-create-auth.test.ts: ok (A–C + anti-régression CLIENT)");
}

run();
