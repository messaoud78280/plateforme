/**
 * GED V2 — recette déterministe (sans DB).
 * Run: npx tsx scripts/test-ged-v2.ts
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { isDurableDocument, isMediaAttachment } from "../src/lib/ged/durable-file";
import { originFromLinks, originHref, folderDisplayLabel } from "../src/lib/ged/origin";
import { hubViewsForPersona, hubGroupsForPersona, recentDayLabel } from "../src/lib/ged/document-hub-ui";
import { namesLookLikeSameDocument } from "../src/lib/ged/fulfill-placeholder";

function tDurable() {
  assert.equal(isDurableDocument({ name: "Fiche-technique-membrane.pdf", mimeType: "application/pdf" }), true);
  assert.equal(isDurableDocument({ name: "BL-4582.pdf" }), true);
  assert.equal(isDurableDocument({ name: "plan.dwg" }), true);
  assert.equal(isDurableDocument({ name: "photo-facade.jpg", mimeType: "image/jpeg", kind: "image" }), false);
  assert.equal(isMediaAttachment({ name: "selfie.png", kind: "image" }), true);
  assert.equal(isDurableDocument({ name: "note.m4a", kind: "audio" }), false);
  console.log("ok durable vs media");
}

function tOrigin() {
  const msg = originFromLinks({
    links: [{ entityType: "message_attachment", entityLabel: "Point.P — Plans terrasse" }],
  });
  assert.equal(msg.origin, "MESSAGERIE");
  const po = originFromLinks({
    links: [
      { entityType: "purchase_order", entityId: "po1", entityLabel: "BC-2026-043" },
      { entityType: "supplier", entityLabel: "Point.P" },
    ],
  });
  assert.equal(po.origin, "COMMANDE");
  assert.ok(po.refLabel?.includes("BC-2026-043"));
  const devis = originFromLinks({
    links: [{ entityType: "commercial_quote", entityId: "q1", entityLabel: "DEV-2026-0014" }],
  });
  assert.equal(devis.origin, "DEVIS");
  const href = originHref({
    origin: "COMMANDE",
    links: [{ entityType: "purchase_order", entityId: "abc" }],
    projectId: "p1",
  });
  assert.equal(href, "/dashboard/commandes/abc?focus=documents");
  const msgHref = originHref({
    origin: "MESSAGERIE",
    links: [],
    projectId: "vh",
  });
  assert.ok(msgHref?.includes("messagerie"));
  console.log("ok provenance");
}

function tFolderLabel() {
  assert.equal(folderDisplayLabel("Plans & pièces techniques", "03"), "Plans & pièces techniques");
  assert.equal(folderDisplayLabel("03 Plans", "03"), "Plans");
  console.log("ok libellés sans numéros");
}

function tPlaceholderMatch() {
  assert.equal(namesLookLikeSameDocument("Fiche technique membrane", "Fiche-technique-membrane.pdf"), true);
  assert.equal(namesLookLikeSameDocument("Attestation décennale", "plan-terrasse.pdf"), false);
  console.log("ok rattachement attendu");
}

function tHubViews() {
  const internal = hubViewsForPersona("INTERNAL", "DIRECTION");
  assert.ok(internal.some((v) => v.id === "missing"));
  assert.ok(internal.some((v) => v.id === "favorites"));
  const supplier = hubViewsForPersona("SUPPLIER", "FOURNISSEUR");
  assert.ok(!supplier.some((v) => v.id === "missing"));
  const groups = hubGroupsForPersona("SUPPLIER", "FOURNISSEUR");
  assert.deepEqual(
    groups.map((g) => g.id),
    ["all", "commandes", "fournisseurs"],
  );
  console.log("ok vues hub");
}

function tRecentDays() {
  const now = new Date("2026-08-14T12:00:00Z");
  assert.equal(recentDayLabel("2026-08-14T08:00:00Z", now), "Aujourd’hui");
  assert.equal(recentDayLabel("2026-08-13T08:00:00Z", now), "Hier");
  console.log("ok récents");
}

function tNoFourthGed() {
  const root = process.cwd();
  assert.equal(existsSync(join(root, "src/lib/ged/document-hub.ts")), true);
  assert.equal(existsSync(join(root, "src/app/api/chantier/files/[id]/favorite/route.ts")), true);
  assert.equal(existsSync(join(root, "src/lib/ged/ingest-message-durable.ts")), true);
  console.log("ok pas de 4e GED — hub ChantierFile");
}

function tIsolationPattern() {
  const hubSrc = require("node:fs").readFileSync(
    join(process.cwd(), "src/lib/ged/document-hub.ts"),
    "utf8",
  );
  assert.ok(hubSrc.includes("projectWhereForClientUser"), "hub filtre par org/chantier serveur");
  assert.ok(hubSrc.includes("searchTokens"), "recherche multi-termes serveur");
  console.log("ok recherche serveur + isolation");
}

tDurable();
tOrigin();
tFolderLabel();
tPlaceholderMatch();
tHubViews();
tRecentDays();
tNoFourthGed();
tIsolationPattern();
console.log("GED V2 recette OK");
