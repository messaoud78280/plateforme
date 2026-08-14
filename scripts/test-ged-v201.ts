/**
 * GED V2.0.1 — recette déterministe (sans DB).
 * Run: npx tsx scripts/test-ged-v201.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isDurableDocument,
  isMediaAttachment,
  parseAttachmentsJson,
} from "../src/lib/ged/durable-file";
import { originFromLinks, originHref } from "../src/lib/ged/origin";
import {
  GED_UNIQUE_SOURCE_TYPES,
  gedIndexOwnsStorage,
  messageAttachmentEntityId,
  parseMessageAttachmentEntityId,
  poKindToGedMeta,
} from "../src/lib/ged/source-identity";

function tIdentity() {
  const url = "storage://messagerie/abc/Fiche-technique-membrane.pdf";
  const id = messageAttachmentEntityId("PROJECT", "msg1", url);
  assert.equal(id.startsWith("PROJECT:msg1:"), true);
  const parsed = parseMessageAttachmentEntityId(id);
  assert.equal(parsed?.kind, "PROJECT");
  assert.equal(parsed?.messageId, "msg1");
  assert.equal(GED_UNIQUE_SOURCE_TYPES.includes("message_attachment"), true);
  assert.equal(GED_UNIQUE_SOURCE_TYPES.includes("commercial_quote"), false);
  console.log("ok identité source");
}

function tPoMeta() {
  assert.equal(poKindToGedMeta("BL").documentType, "BL");
  assert.equal(poKindToGedMeta("BC").folderCode, "02");
  assert.equal(poKindToGedMeta("FACTURE").documentType, "FACTURE");
  assert.equal(poKindToGedMeta("AUTRE").classificationStatus, "A_CLASSER");
  console.log("ok classification commande");
}

function tStorageOwnership() {
  assert.equal(
    gedIndexOwnsStorage({
      fileUrl: "storage://documents/chantiers/p1/00/file.pdf",
      projectId: "p1",
      hasPrimarySourceLink: false,
    }),
    true,
  );
  assert.equal(
    gedIndexOwnsStorage({
      fileUrl: "storage://documents/chantiers/p1/00/file.pdf",
      projectId: "p1",
      hasPrimarySourceLink: true,
    }),
    false,
  );
  assert.equal(
    gedIndexOwnsStorage({
      fileUrl: "storage://messagerie/x/file.pdf",
      projectId: "p1",
      hasPrimarySourceLink: false,
    }),
    false,
  );
  assert.equal(
    gedIndexOwnsStorage({
      fileUrl: "/api/commercial/quotes/q1/pdf",
      projectId: "p1",
    }),
    false,
  );
  console.log("ok propriété storage");
}

function tDurableParse() {
  const atts = parseAttachmentsJson([
    { name: "BL-4582.pdf", fileUrl: "storage://documents/x.pdf", mimeType: "application/pdf" },
    { name: "photo.jpg", fileUrl: "storage://messagerie/p.jpg", mimeType: "image/jpeg", kind: "image" },
  ]);
  assert.equal(atts.length, 2);
  assert.equal(isDurableDocument(atts[0]!), true);
  assert.equal(isDurableDocument(atts[1]!), false);
  assert.equal(isMediaAttachment(atts[1]!), true);
  console.log("ok PJ durables");
}

function tProvenance() {
  const msg = originFromLinks({
    links: [{ entityType: "message_attachment", entityLabel: "Point.P — Victor Hugo" }],
  });
  assert.equal(msg.origin, "MESSAGERIE");
  assert.equal(msg.actionLabel, "Voir la conversation");
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
  assert.equal(devis.actionLabel, "Voir le devis");
  const fac = originFromLinks({
    links: [{ entityType: "commercial_invoice", entityId: "i1", entityLabel: "FAC-2026-001" }],
  });
  assert.equal(fac.actionLabel, "Voir la facture");
  const href = originHref({
    origin: "DEVIS",
    links: [{ entityType: "commercial_invoice", entityId: "inv1" }],
    projectId: "p1",
  });
  assert.equal(href, "/dashboard/devis-facturation/factures/inv1");
  console.log("ok provenance + retour source");
}

function tNoFourthTable() {
  const root = process.cwd();
  assert.equal(existsSync(join(root, "src/lib/ged/index-source-document.ts")), true);
  assert.equal(existsSync(join(root, "scripts/backfill-document-index.ts")), true);
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert.equal(schema.includes("model GedDocument"), false);
  assert.equal(schema.includes("model DocumentIndex"), false);
  const hub = readFileSync(join(root, "src/lib/ged/document-hub.ts"), "utf8");
  assert.ok(hub.includes("projectWhereForClientUser"));
  console.log("ok pas de 4e table — ChantierFile");
}

function tBackfillIdempotentContract() {
  const src = readFileSync(join(process.cwd(), "src/lib/ged/index-source-document.ts"), "utf8");
  assert.ok(src.includes("already_linked"));
  assert.ok(src.includes("findGedFileIdByIdentities"));
  const sql = readFileSync(
    join(process.cwd(), "prisma/migrations/add-ged-v201-source-identity.sql"),
    "utf8",
  );
  assert.ok(sql.includes("ChantierFileLink_primary_source_uidx"));
  assert.ok(!sql.includes("'commercial_quote'"));
  console.log("ok contrat idempotence");
}

tIdentity();
tPoMeta();
tStorageOwnership();
tDurableParse();
tProvenance();
tNoFourthTable();
tBackfillIdempotentContract();
console.log("GED V2.0.1 recette OK");
