/**
 * Smoke CTX-01 — lecture seule URBAN AMÉNAGEMENTS (aucun seed / write).
 * Usage: node --import tsx scripts/test-bework-project-context.ts
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { buildProjectContext } from "../src/lib/bework-context";

const URBAN_ORG = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";

async function fingerprint(projectId: string, orgId: string) {
  const [p, studies, quotes, plans, visits] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
      select: { updatedAt: true },
    }),
    prisma.prepStudy.findMany({
      where: { projectId, organizationId: orgId },
      select: { id: true, updatedAt: true, version: true },
      orderBy: { id: "asc" },
    }),
    prisma.commercialQuote.findMany({
      where: { projectId, organizationId: orgId },
      select: { id: true, updatedAt: true, status: true },
      orderBy: { id: "asc" },
    }),
    prisma.prepSchedulePlan.findMany({
      where: { projectId, organizationId: orgId },
      select: { id: true, updatedAt: true, revisionNumber: true },
      orderBy: { id: "asc" },
    }),
    prisma.siteVisit.findMany({
      where: { projectId, organizationId: orgId },
      select: { id: true, updatedAt: true },
      orderBy: { id: "asc" },
    }),
  ]);
  return JSON.stringify({ p, studies, quotes, plans, visits });
}

async function main() {
  const org = await prisma.organization.findFirst({
    where: { id: URBAN_ORG },
    select: { id: true, name: true },
  });
  assert.ok(org, "URBAN introuvable");
  console.log("Org:", org.name);

  const before = await fingerprint(C01, URBAN_ORG);

  // E — org mismatch ⇒ null
  const denied = await buildProjectContext(C01, "org-does-not-exist");
  assert.equal(denied, null, "E: mismatch org doit retourner null");
  console.log("E sécurité org mismatch: ok");

  // A/B/C/D — snapshot C-01
  const snap = await buildProjectContext(C01, URBAN_ORG);
  assert.ok(snap, "C-01 doit produire un contexte");
  assert.equal(snap!.type, "bework_project_context_v1");
  assert.equal(snap!.organization.id, URBAN_ORG);
  assert.equal(snap!.project.id, C01);
  assert.ok(Array.isArray(snap!.scopes));
  assert.ok(Array.isArray(snap!.takeoffs));
  assert.ok(Array.isArray(snap!.quotes));
  assert.ok(Array.isArray(snap!.schedules));
  assert.ok(Array.isArray(snap!.visits));
  assert.ok(Array.isArray(snap!.sources));
  assert.ok(snap!.documents);

  console.log(
    JSON.stringify(
      {
        project: snap!.project.title,
        scopes: snap!.scopes.length,
        sources: snap!.sources.length,
        visits: snap!.visits.length,
        takeoffs: snap!.takeoffs.map((t) => ({
          id: t.id,
          version: t.version,
          scopeId: t.scopeId,
          lines: t.lines.length,
          params: t.parameters.length,
        })),
        quotes: snap!.quotes.map((q) => ({
          number: q.number,
          status: q.status,
          scopeId: q.scopeId,
          isScopeReference: q.isScopeReference,
          version: q.versionNumber,
          transferStudyVersion: q.transfer?.studyVersion ?? null,
        })),
        schedules: snap!.schedules.map((s) => ({
          id: s.id,
          revision: s.revisionNumber,
          studyVersionAtGeneration: s.studyVersionAtGeneration,
          tasks: s.tasks.length,
        })),
        followUps: snap!.followUps.length,
        notices: snap!.documents.notices.length,
        reports: snap!.documents.reports.length,
        versionNoteVisits: snap!.visits[0]?.contextVersionNote ?? null,
      },
      null,
      2,
    ),
  );

  // Multi-scope : scopes distincts si présents
  const scopeIds = new Set(snap!.scopes.map((s) => s.id));
  assert.equal(scopeIds.size, snap!.scopes.length);
  console.log("C multi-scope ids uniques: ok");

  // Multi-devis référence
  const refs = snap!.quotes.filter((q) => q.isScopeReference);
  console.log("D devis référence count:", refs.length);

  // F — aucune écriture
  const after = await fingerprint(C01, URBAN_ORG);
  assert.equal(after, before, "F: buildProjectContext ne doit rien modifier");
  console.log("F aucune écriture: ok");

  console.log("test-bework-project-context.ts: ok");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
