/**
 * GED V2.0.3 — tests déterministes (sans DB).
 * npx tsx scripts/test-ged-v203.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { originHref, originFromLinks } from "../src/lib/ged/origin";
import { classifyDocumentType } from "../src/lib/ged/classify-document";
import { provenanceSummary } from "../src/lib/ged/document-hub-ui";
import { isDurableDocument } from "../src/lib/ged/durable-file";

function tSchemaNullable() {
  const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
  const fileBlock = schema.slice(schema.indexOf("model ChantierFile"), schema.indexOf("model ChantierFileLink"));
  assert.ok(fileBlock.includes("projectId    String?"), "projectId nullable");
  assert.ok(fileBlock.includes("organizationId String?"), "organizationId présent");
  assert.ok(
    existsSync(join(process.cwd(), "prisma/migrations/add-ged-v203-org-scope.sql")),
    "migration SQL",
  );
  console.log("ok schéma sans chantier");
}

function tNoFakeProject() {
  const seed = readFileSync(join(process.cwd(), "scripts/seed-ged-v203-recette.ts"), "utf8");
  assert.ok(!/Sans chantier/.test(seed) || seed.includes("ne pas"), "pas de faux chantier dans le seed");
  assert.ok(seed.includes("DemoEnvironment"), "seed limité à la démo");
  console.log("ok pas de faux chantier");
}

function tOriginSansChantier() {
  const href = originHref({
    origin: "MESSAGERIE",
    links: [{ entityType: "message_attachment" }],
    projectId: null,
  });
  assert.equal(href, "/dashboard/messagerie?view=contacts");
  const origin = originFromLinks({
    links: [{ entityType: "message_attachment", entityLabel: "Martin Étanchéité" }],
  });
  assert.equal(origin.origin, "MESSAGERIE");
  const line = provenanceSummary({
    origin: "MESSAGERIE",
    companyLabel: "Martin Étanchéité",
    projectTitle: null,
  });
  assert.equal(line.includes("Sans chantier"), false);
  assert.ok(line.includes("Martin Étanchéité"));
  assert.ok(line.includes("Messagerie"));
  console.log("ok provenance sans chantier");
}

function tClassifySeedNames() {
  assert.equal(
    classifyDocumentType({ filename: "Fiche-technique-membrane-Soprema.pdf" }).documentType,
    "FICHE_TECHNIQUE",
  );
  assert.equal(
    classifyDocumentType({ filename: "Attestation-assurance-Martin.pdf" }).documentType,
    "ATTESTATION",
  );
  assert.equal(classifyDocumentType({ poKind: "BL" }).documentType, "BON_LIVRAISON");
  assert.equal(classifyDocumentType({ sourceEntityType: "doe_item" }).documentType, "DOE");
  assert.equal(classifyDocumentType({ sourceEntityType: "commercial_quote" }).documentType, "DEVIS");
  console.log("ok classification seed");
}

function tDurable() {
  assert.equal(isDurableDocument({ name: "Attestation-assurance-Martin.pdf", mimeType: "application/pdf" }), true);
  assert.equal(isDurableDocument({ name: "capture.png", mimeType: "image/png" }), false);
  console.log("ok durables vs médias");
}

tSchemaNullable();
tNoFakeProject();
tOriginSansChantier();
tClassifySeedNames();
tDurable();
console.log("GED V2.0.3 unitaires OK");
