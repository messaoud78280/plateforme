/**
 * Tests parse bework_site_report_v1 / bework_ppsps_v1
 * Usage: node --import tsx scripts/test-site-documents-parse.ts
 */
import { parsePpspsJson, parseSiteReportJson } from "../src/lib/site-documents/parse";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else console.log("OK:", msg);
}

{
  const r = parseSiteReportJson(`{
    "format": "bework_site_report_v1",
    "import_id": "import_demo_001",
    "report": {
      "title": "CR visite",
      "report_number": "CR-001",
      "date": "2026-09-18",
      "summary": "Avancement dalle",
      "participants": [{ "name": "Dupont", "company": "BeWork", "role": "Conducteur" }],
      "work_completed": ["Dalle terminée"],
      "issues": ["Regard EP trop haut"],
      "decisions": ["Déplacement caniveau 50 cm"],
      "next_steps": [{ "action": "Décaissement", "responsible": "Équipe", "due_date": "demain" }]
    }
  }`);
  assert(r.ok === true, "CR JSON valide");
  if (r.ok) {
    assert(r.report.workCompleted[0] === "Dalle terminée", "travaux réalisés");
    assert(r.report.participants[0]?.name === "Dupont", "participant");
    assert(r.importId === "import_demo_001", "import_id");
  }
}

{
  const r = parseSiteReportJson('{ "format": "bework_quote_bundle_v1" }');
  assert(r.ok === false, "refus format devis");
}

{
  const r = parsePpspsJson(`{
    "format": "bework_ppsps_v1",
    "ppsps": {
      "title": "PPSPS VRD",
      "risks": [{
        "activity": "Terrassement",
        "hazard": "Engins",
        "prevention": "Balisage et plan de circulation",
        "category": "terrassement"
      }],
      "ppe": ["Casque", "Chaussures de sécurité"]
    }
  }`);
  assert(r.ok === true, "PPSPS JSON valide");
  if (r.ok) {
    assert(r.ppsps.risks[0]?.activity === "Terrassement", "risque");
    assert(r.ppsps.ppe.length === 2, "epi");
  }
}

{
  const r = parseSiteReportJson("{ not json");
  assert(r.ok === false, "JSON invalide");
}

if (failed) {
  console.error(`\n${failed} échec(s)`);
  process.exit(1);
}
console.log("\nTous les tests site-documents OK");
