/**
 * Smoke BDD : preview + commit + cleanup planning C-01 URBAN (GOMEZ).
 * Usage: npx tsx --env-file=.env.local tmp/prep-schedule-db-smoke.ts
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  previewPrepSchedule,
  commitPrepSchedule,
} from "../src/lib/preparation/schedule/transfer";

const prisma = new PrismaClient();
const KEEP = process.argv.includes("--keep");

async function main() {
  const org = await prisma.organization.findFirstOrThrow({
    where: { name: "URBAN AMÉNAGEMENTS" },
    select: { id: true, ownerUserId: true },
  });
  const study = await prisma.prepStudy.findFirst({
    where: {
      organizationId: org.id,
      archivedAt: null,
      title: { contains: "Fondations", mode: "insensitive" },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, mode: true },
  });
  assert.ok(study, "Étude Fondations introuvable");
  assert.equal(study.mode, "DEMONSTRATION");
  console.log("OK étude", study.title, study.id);

  const preview = await previewPrepSchedule({ orgId: org.id, studyId: study.id });
  assert.equal(preview.isDemonstration, true);
  assert.ok(preview.watermark?.includes("DÉMONSTRATION"));
  assert.ok(Math.abs((preview.baseDurationWorkingDays ?? 0) - 10.5) < 0.01);
  const p03 = preview.tasks.find((t) => t.stepId === "P03");
  assert.ok(p03 && p03.durationDays === 2);
  assert.ok(p03.driverItem === "EV-01");
  const p10 = preview.tasks.find((t) => t.stepId === "P10");
  assert.ok(p10?.conditional && !p10.includeInBase);
  const p09 = preview.tasks.find((t) => t.stepId === "P09");
  assert.equal(p09?.durationCalendar, "calendar");
  assert.equal(p09?.durationDays, 3);
  console.log("OK preview", preview.tasks.length, "tâches, base", preview.baseDurationWorkingDays, "j");

  const key = `smoke-sched-${Date.now()}`;
  const created = await commitPrepSchedule({
    orgId: org.id,
    studyId: study.id,
    userId: org.ownerUserId,
    idempotencyKey: key,
    selectedStepIds: preview.tasks.map((t) => t.stepId),
  });
  assert.equal(created.action, "created");
  assert.equal(created.isDemonstration, true);
  console.log("OK commit", created.planId, created.href);

  const again = await commitPrepSchedule({
    orgId: org.id,
    studyId: study.id,
    userId: org.ownerUserId,
    idempotencyKey: key,
    selectedStepIds: preview.tasks.map((t) => t.stepId).slice(0, 3),
  });
  assert.equal(again.action, "idempotent");
  assert.equal(again.planId, created.planId);
  console.log("OK idempotence");

  const plan = await prisma.prepSchedulePlan.findUniqueOrThrow({
    where: { id: created.planId },
    include: { tasks: true },
  });
  assert.equal(plan.isDemonstration, true);
  assert.ok(plan.tasks.some((t) => t.stepCode === "P10" && t.conditional && !t.includeInBase));
  assert.ok(plan.tasks.some((t) => t.stepCode === "P09" && t.durationCalendar === "calendar"));
  console.log("OK plan persisté", plan.tasks.length, "tâches");

  if (!KEEP) {
    await prisma.prepScheduleQuoteLink.deleteMany({ where: { planId: created.planId } });
    await prisma.prepScheduleTakeoffLink.deleteMany({ where: { planId: created.planId } });
    await prisma.prepScheduleDependency.deleteMany({ where: { planId: created.planId } });
    await prisma.prepScheduleEvent.deleteMany({ where: { planId: created.planId } });
    await prisma.prepScheduleTask.deleteMany({ where: { planId: created.planId } });
    await prisma.prepSchedulePlan.delete({ where: { id: created.planId } });
    await prisma.prepStudyEvent.deleteMany({
      where: { studyId: study.id, kind: "TRANSFER_TO_SCHEDULE" },
    });
    console.log("OK nettoyage");
  } else {
    console.log("KEEP", created.href);
  }
  console.log("\nPASS schedule DB smoke");
}

main()
  .catch((e) => {
    console.error("FAIL", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
