/**
 * Seed / rattachement C-01 → ProjectScope Fondations.
 * npx tsx scripts/seed-c01-project-scope.ts
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });
config({ path: ".env" });

const STUDY_ID = "cmuh6cy4c000y1423lqo85g5v";
const PROJECT_ID = "cmuh69adc00011423ry0hhj7s";
const ORG_ID = "cmt2nx23j00021k6btoov39gr";

async function main() {
  const { ensureProjectScope, attachStudyToScope, getProjectWorkspace } =
    await import("../src/lib/chantier/project-workspace");
  const { prisma } = await import("../src/lib/prisma");

  const { id: scopeId, created } = await ensureProjectScope({
    orgId: ORG_ID,
    projectId: PROJECT_ID,
    code: "FONDATIONS",
    name: "Fondations",
    description:
      "Périmètre fondations superficielles — scénario C-01 (plan, métré, devis, planning).",
    displayOrder: 10,
  });
  console.log(created ? "Scope créé" : "Scope existant", scopeId);

  await attachStudyToScope({
    orgId: ORG_ID,
    scopeId,
    studyId: STUDY_ID,
    setAsReference: true,
  });
  console.log("Étude + planning rattachés, baselines posées");

  const ws = await getProjectWorkspace(ORG_ID, PROJECT_ID);
  console.log(
    JSON.stringify(
      {
        title: ws?.title,
        scopes: ws?.scopes.map((s) => ({
          code: s.code,
          name: s.name,
          href: s.href,
          cards: s.cards.map((c) => ({
            kind: c.kind,
            title: c.title,
            sync: c.syncState,
            ref: c.isReference,
          })),
          alerts: s.alerts,
        })),
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
