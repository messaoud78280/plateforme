/**
 * Phase B1 — garde stale import document + snapshot undo (sans écriture BDD).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeReportContextVersion } from "@/lib/bework-context/report-context-version";
import { computeSiteDocumentContentVersionFromRow } from "@/lib/site-documents/document-content-version";
import {
  DOCUMENT_IMPORT_STALE_CODE,
  DOCUMENT_IMPORT_STALE_MESSAGE,
  DOCUMENT_UNDO_STALE_CODE,
  DOCUMENT_UNDO_STALE_MESSAGE,
  buildImportSnapshotBefore,
  buildImportSummaryJson,
  buildUndoDataFromSnapshot,
  isImportSnapshotV2,
  readImportSummaryMeta,
} from "@/lib/site-documents/chatgpt-import-snapshot";

const root = process.cwd();

function docRow(partial?: {
  title?: string;
  summary?: string;
  kind?: string;
  quickNotes?: string | null;
}) {
  return {
    id: "doc_1",
    kind: partial?.kind ?? "COMPTE_RENDU",
    title: partial?.title ?? "CR A",
    status: "DRAFT",
    quickNotes: partial?.quickNotes ?? null,
    payloadJson: {
      title: partial?.title ?? "CR A",
      summary: partial?.summary ?? "Résumé A",
      workCompleted: [] as string[],
      mediaRefs: [] as unknown[],
    },
    visitDate: new Date("2026-03-01"),
    visitTime: "09:00",
    weather: "Beau",
    authorName: "Ali",
    sourceFormat: null as string | null,
  };
}

// --- Version mutualisée ---
{
  const row = docRow();
  const a = computeSiteDocumentContentVersionFromRow(row);
  const b = computeReportContextVersion({
    id: row.id,
    kind: row.kind,
    title: row.title,
    status: row.status,
    quickNotes: row.quickNotes,
    payload: row.payloadJson,
  });
  assert.equal(a, b, "helper document = empreinte REPORT");
  const afterEdit = computeSiteDocumentContentVersionFromRow(
    docRow({ title: "CR B", summary: "Résumé B" }),
  );
  assert.notEqual(a, afterEdit, "changement contenu → version différente");
  console.log("A — version mutualisée: ok");
}

// --- Snapshot V2 complet ---
{
  const row = docRow();
  const snap = buildImportSnapshotBefore(row);
  assert.ok(isImportSnapshotV2(snap));
  assert.equal(snap.title, "CR A");
  assert.equal(snap.visitDate, "2026-03-01");
  assert.equal(snap.weather, "Beau");
  assert.equal(snap.authorName, "Ali");
  assert.deepEqual(snap.payloadJson, row.payloadJson);
  const undo = buildUndoDataFromSnapshot(snap);
  assert.equal(undo.title, "CR A");
  assert.ok(undo.visitDate instanceof Date);
  assert.equal(undo.weather, "Beau");
  assert.equal(undo.authorName, "Ali");
  assert.deepEqual(undo.payloadJson, row.payloadJson);
  console.log("B — snapshot V2 + undo complet: ok");
}

// --- Ancien snapshot (payload seul) ---
{
  const legacyPayload = {
    title: "Ancien",
    summary: "S",
    workCompleted: ["x"],
  };
  assert.equal(isImportSnapshotV2(legacyPayload), false);
  const undo = buildUndoDataFromSnapshot(legacyPayload);
  assert.deepEqual(undo.payloadJson, legacyPayload);
  assert.equal(undo.title, undefined, "ne pas écraser title absent");
  assert.equal(undo.weather, undefined);
  assert.equal(undo.authorName, undefined);
  console.log("C — ancien snapshot rétrocompatible: ok");
}

// --- summaryJson meta ---
{
  const summary = buildImportSummaryJson({
    kind: "COMPTE_RENDU",
    format: "bework_site_report_v1",
    documentBaseVersion: 111,
    versionAfter: 222,
  });
  const meta = readImportSummaryMeta(summary);
  assert.equal(meta.documentBaseVersion, 111);
  assert.equal(meta.versionAfter, 222);
  const legacy = readImportSummaryMeta({ kind: "PPSPS", format: "bework_ppsps_v1" });
  assert.equal(legacy.versionAfter, null);
  console.log("D — summaryJson base/after: ok");
}

// --- Stale algorithm ---
{
  const base = computeSiteDocumentContentVersionFromRow(docRow());
  const current = computeSiteDocumentContentVersionFromRow(
    docRow({ summary: "modifié universel" }),
  );
  assert.notEqual(base, current);
  assert.equal(
    current !== base,
    true,
    "import basé sur base doit être refusé si current diverge",
  );
  assert.equal(DOCUMENT_IMPORT_STALE_CODE, "DOCUMENT_IMPORT_STALE");
  assert.match(DOCUMENT_IMPORT_STALE_MESSAGE, /modifié depuis la préparation/i);
  assert.equal(DOCUMENT_UNDO_STALE_CODE, "DOCUMENT_UNDO_STALE");
  assert.match(DOCUMENT_UNDO_STALE_MESSAGE, /n’est plus disponible/i);
  console.log("E — stale import/undo messages: ok");
}

// --- NOTICE / PPSPS kinds share helper ---
{
  const notice = computeSiteDocumentContentVersionFromRow(
    docRow({ kind: "NOTICE", title: "Notice A" }),
  );
  const ppsps = computeSiteDocumentContentVersionFromRow({
    ...docRow({ kind: "PPSPS", title: "PPSPS A" }),
    payloadJson: { title: "PPSPS A", risks: [] },
  });
  assert.ok(Number.isFinite(notice) && notice > 0);
  assert.ok(Number.isFinite(ppsps) && ppsps > 0);
  assert.notEqual(notice, ppsps);
  console.log("F — NOTICE/PPSPS version: ok");
}

// --- Routes : documentBaseVersion + stale codes ---
{
  const importRoute = readFileSync(
    join(
      root,
      "src/app/api/projets/[id]/site-documents/[docId]/chatgpt/import/route.ts",
    ),
    "utf8",
  );
  assert.match(importRoute, /documentBaseVersion/);
  assert.match(importRoute, /DOCUMENT_IMPORT_STALE/);
  assert.match(importRoute, /Aucune modification n’est encore enregistrée/);
  assert.doesNotMatch(importRoute, /forceVersionMismatch|force=true|ignoreVersion/);

  const prepareRoute = readFileSync(
    join(
      root,
      "src/app/api/projets/[id]/site-documents/[docId]/chatgpt/prepare/route.ts",
    ),
    "utf8",
  );
  assert.match(prepareRoute, /documentBaseVersion/);
  assert.match(prepareRoute, /writePerformed:\s*false/);

  const undoRoute = readFileSync(
    join(
      root,
      "src/app/api/projets/[id]/site-documents/[docId]/chatgpt/undo/route.ts",
    ),
    "utf8",
  );
  assert.match(undoRoute, /DOCUMENT_UNDO_STALE/);
  console.log("G — routes prepare/import/undo: ok");
}

// --- Service : TX stale + snapshot V2 ---
{
  const service = readFileSync(
    join(root, "src/lib/site-documents/service.ts"),
    "utf8",
  );
  assert.match(service, /documentBaseVersion/);
  assert.match(service, /buildImportSnapshotBefore/);
  assert.match(service, /buildUndoDataFromSnapshot/);
  assert.match(service, /versionAfter/);
  assert.match(service, /\$transaction/);
  console.log("H — service apply/undo: ok");
}

// --- UX libellés distincts (textes utilisateur visibles) ---
{
  const editor = readFileSync(
    join(root, "src/components/site-documents/SiteDocumentEditor.tsx"),
    "utf8",
  );
  assert.match(editor, /Modifier un élément avec ChatGPT/);
  assert.match(editor, /Générer \/ compléter le document/);
  assert.match(editor, /Générer \/ compléter la notice/);
  assert.match(editor, /Générer \/ compléter le PPSPS/);
  assert.match(editor, /Importer le document généré/);
  assert.doesNotMatch(editor, /Préparer pour ChatGPT/);
  // Textes d’aide utilisateur : pas de jargon technique
  const userHelpSnippets = [
    ...editor.matchAll(/helpText="([^"]+)"/g),
    ...editor.matchAll(/className="[^"]*text-slate-500[^"]*"[^>]*>\s*([^<]+)/g),
  ].map((m) => m[1]);
  for (const snippet of userHelpSnippets) {
    assert.doesNotMatch(snippet, /\blegacy\b/i);
    assert.doesNotMatch(snippet, /\buniversel\b/i);
    assert.doesNotMatch(snippet, /\bpayload\b/i);
    assert.doesNotMatch(snippet, /\bpatch\b/i);
  }

  const modal = readFileSync(
    join(root, "src/components/site-documents/SiteDocChatGptModal.tsx"),
    "utf8",
  );
  assert.match(modal, /Aucune modification n’est encore enregistrée/);
  assert.match(modal, /Analyser de nouveau/);
  assert.match(modal, /documentBaseVersion/);
  assert.doesNotMatch(modal, /forceVersionMismatch/);
  console.log("I — UX REPORT/NOTICE/PPSPS: ok");
}

console.log("\nchatgpt-import-guards Phase B1: ALL PASS");
