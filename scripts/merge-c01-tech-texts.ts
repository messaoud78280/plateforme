/**
 * Fusionne les fiches techniques C-01 dans docs/preparation/exemples/c01-fondations.prep.json
 * sans toucher aux formules ni quantités.
 *
 *   node --import tsx scripts/merge-c01-tech-texts.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { C01_LINE_TEXT_ENRICHMENTS } from "../src/lib/preparation/enrichment/c01-fondations-texts";

const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "docs/preparation/exemples/c01-fondations.prep.json");

const data = JSON.parse(readFileSync(FILE, "utf8")) as {
  takeoff?: { items?: Record<string, unknown>[] };
  schema_version?: string;
};

if (!data.takeoff?.items) throw new Error("takeoff.items manquant");

let updated = 0;
for (const item of data.takeoff.items) {
  const id = String(item.id ?? "");
  const enrich = C01_LINE_TEXT_ENRICHMENTS[id];
  if (!enrich) continue;
  item.designation = enrich.designation;
  item.technical_description = enrich.technicalDescription;
  // Conservé pour compatibilité ascendante des lecteurs qui ne connaissent que description.
  item.description = enrich.technicalDescription;
  item.included_services = enrich.includedServices;
  item.technical_references = enrich.technicalReferences;
  item.execution_notes = enrich.executionNotes;
  item.quality_controls = enrich.qualityControls;
  item.technical_reservations = enrich.technicalReservations;
  updated++;
}

data.schema_version = "1.1";

writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`OK — ${updated} ligne(s) enrichie(s) dans ${path.relative(ROOT, FILE)}`);
