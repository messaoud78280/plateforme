/**
 * Smoke liaison devis sur planning existant C-01.
 * npx tsx scripts/smoke-prep-schedule-quote-link.ts
 * npx tsx scripts/smoke-prep-schedule-quote-link.ts --restore
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });
config({ path: ".env" });

import assert from "node:assert/strict";

const PLAN_ID = process.env.SMOKE_PLAN_ID ?? "cmui103dx0002scx8q99joufl";
const STUDY_ID = process.env.SMOKE_STUDY_ID ?? "cmuh6cy4c000y1423lqo85g5v";
const QUOTE_NUMBER = process.env.SMOKE_QUOTE_NUMBER ?? "DEMO-2026-0002";
const restore = process.argv.includes("--restore");

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { linkPrepScheduleQuote } = await import(
    "../src/lib/preparation/schedule/transfer"
  );

  const plan = await prisma.prepSchedulePlan.findUnique({
    where: { id: PLAN_ID },
    select: {
      id: true,
      organizationId: true,
      studyId: true,
      quoteId: true,
      createdById: true,
    },
  });
  assert.ok(plan, "planning introuvable");
  assert.equal(plan.studyId, STUDY_ID);

  const quote = await prisma.commercialQuote.findFirst({
    where: {
      organizationId: plan.organizationId,
      number: QUOTE_NUMBER,
      sourcePrepStudyId: STUDY_ID,
    },
    select: { id: true, number: true },
  });
  assert.ok(quote, `devis ${QUOTE_NUMBER} introuvable`);

  const beforeTasks = await prisma.prepScheduleTask.findMany({
    where: { planId: PLAN_ID },
    select: { stepCode: true, startDate: true, durationDays: true },
    orderBy: { sortOrder: "asc" },
  });

  const actor = plan.createdById ?? "smoke-script";
  const linked = await linkPrepScheduleQuote({
    orgId: plan.organizationId,
    planId: PLAN_ID,
    quoteId: quote.id,
    userId: actor,
  });

  assert.equal(linked.quote?.number, QUOTE_NUMBER);
  assert.ok(linked.linkedSellHtTotal != null && linked.linkedSellHtTotal > 0);

  const afterTasks = await prisma.prepScheduleTask.findMany({
    where: { planId: PLAN_ID },
    select: { stepCode: true, startDate: true, durationDays: true },
    orderBy: { sortOrder: "asc" },
  });
  for (let i = 0; i < beforeTasks.length; i++) {
    assert.equal(
      afterTasks[i]!.startDate?.toISOString().slice(0, 10),
      beforeTasks[i]!.startDate?.toISOString().slice(0, 10),
    );
    assert.equal(String(afterTasks[i]!.durationDays), String(beforeTasks[i]!.durationDays));
  }

  console.log(
    "OK liaison",
    QUOTE_NUMBER,
    "total HT",
    linked.linkedSellHtTotal,
    "tasks avec HT",
    linked.tasks.filter((t) => t.sellHtSnapshot != null).length,
  );

  if (restore) {
    await linkPrepScheduleQuote({
      orgId: plan.organizationId,
      planId: PLAN_ID,
      quoteId: null,
      userId: actor,
    });
    console.log("OK restore sans devis");
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
