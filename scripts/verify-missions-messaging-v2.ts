/**
 * Vérifie helpers priorité + présence données messagerie démo.
 * Usage: npx tsx scripts/verify-missions-messaging-v2.ts
 */
import assert from "node:assert/strict";
import {
  coerceTaskPriority,
  normalizeTaskPriority,
  priorityRank,
  sortByPriorityThenDate,
  taskPriorityLabel,
} from "../src/lib/tasks/priority";
import { prisma } from "../src/lib/prisma";

async function main() {
  assert.equal(normalizeTaskPriority("urgent"), "URGENT");
  assert.equal(normalizeTaskPriority(""), null);
  assert.equal(coerceTaskPriority(null), "STANDARD");
  assert.equal(taskPriorityLabel("PRIORITAIRE"), "Prioritaire");
  assert.ok(priorityRank("URGENT") < priorityRank("STANDARD"));

  const sorted = sortByPriorityThenDate([
    { priority: "STANDARD", createdAt: new Date("2026-01-01") },
    { priority: "URGENT", createdAt: new Date("2026-01-02") },
    { priority: "PRIORITAIRE", createdAt: new Date("2026-01-03") },
  ]);
  assert.equal(sorted[0]?.priority, "URGENT");
  assert.equal(sorted[1]?.priority, "PRIORITAIRE");
  console.log("OK helpers priorité");

  const demo = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: "bework-demo" },
    select: { rootUserId: true, companyName: true },
  });
  if (!demo) {
    console.log("SKIP données démo (bework-demo absent)");
    return;
  }

  const [tasks, dms, staff] = await Promise.all([
    prisma.task.count({ where: { clientId: demo.rootUserId } }),
    prisma.directMessage.count({
      where: {
        OR: [{ senderId: demo.rootUserId }, { receiverId: demo.rootUserId }],
      },
    }),
    prisma.user.count({
      where: {
        email: {
          in: [
            "sophie.martin.demo@bework.internal",
            "karim.benali.demo@bework.internal",
            "laura.bernard.demo@bework.internal",
          ],
        },
      },
    }),
  ]);

  console.log("Démo:", demo.companyName);
  console.log("Missions:", tasks);
  console.log("DM:", dms);
  console.log("Contacts staff démo:", staff);

  assert.ok(tasks >= 1, "au moins 1 mission");
  assert.ok(dms >= 3, "au moins 3 messages directs");
  assert.ok(staff === 3, "3 contacts staff");
  console.log("OK données messagerie démo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
