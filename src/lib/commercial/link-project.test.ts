import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(process.cwd(), "src/lib/commercial/link-project.ts"),
  "utf8",
);

assert.match(
  source,
  /const project = await prisma\.\$transaction/,
  "La création chantier et le rattachement du devis doivent partager une transaction",
);
assert.match(
  source,
  /commercialQuote\.updateMany/,
  "Le devis doit être réclamé avec une condition de concurrence",
);
assert.match(source, /status: "ACCEPTED"/);
assert.match(source, /projectId: null/);
assert.match(source, /linked\.count !== 1/);

const transactionStart = source.indexOf(
  "const project = await prisma.$transaction",
);
const projectCreate = source.indexOf("tx.project.create", transactionStart);
const quoteLink = source.indexOf(
  "tx.commercialQuote.updateMany",
  projectCreate,
);
const transactionEnd = source.indexOf(
  "await ensureChantierFolders",
  quoteLink,
);

assert.ok(transactionStart >= 0);
assert.ok(projectCreate > transactionStart);
assert.ok(quoteLink > projectCreate);
assert.ok(transactionEnd > quoteLink);

console.log("link-project.test.ts: OK");
