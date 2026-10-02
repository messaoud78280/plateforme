/**
 * Tests commit dépendances PLANNING — batch tx + atomicité (sans écriture MOREL).
 *
 * npx tsx src/lib/bework-patch/commit/planning-dependency-commit.test.ts
 */
import assert from "node:assert/strict";
import { detectDependencyCycle } from "@/lib/preparation/schedule/dependencies";
import { flushDependencyWritesInTx } from "@/lib/bework-patch/commit/planning-ops";
import { normalizeDependsOnJson } from "@/lib/bework-patch/operation-contracts";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";

type FakeCall = { model: string; method: string; args: unknown };

function makeFakeTx() {
  const calls: FakeCall[] = [];
  let closed = false;
  const tx = {
    get closed() {
      return closed;
    },
    close() {
      closed = true;
    },
    assertOpen(method: string) {
      if (closed) {
        throw new Error(
          `Transaction API error: Transaction not found (call after close: ${method})`,
        );
      }
    },
    prepScheduleTask: {
      async update(args: unknown) {
        tx.assertOpen("prepScheduleTask.update");
        calls.push({ model: "prepScheduleTask", method: "update", args });
        return {};
      },
    },
    prepScheduleDependency: {
      async deleteMany(args: unknown) {
        tx.assertOpen("prepScheduleDependency.deleteMany");
        calls.push({
          model: "prepScheduleDependency",
          method: "deleteMany",
          args,
        });
        return { count: 0 };
      },
      async create(args: unknown) {
        tx.assertOpen("prepScheduleDependency.create");
        calls.push({ model: "prepScheduleDependency", method: "create", args });
        return {};
      },
      async createMany(args: unknown) {
        tx.assertOpen("prepScheduleDependency.createMany");
        calls.push({
          model: "prepScheduleDependency",
          method: "createMany",
          args,
        });
        return {
          count: Array.isArray((args as { data?: unknown[] }).data)
            ? (args as { data: unknown[] }).data.length
            : 0,
        };
      },
    },
  };
  return {
    tx: tx as unknown as Parameters<typeof flushDependencyWritesInTx>[0],
    calls,
    close: () => tx.close(),
  };
}

function morelLikeOps(n: number) {
  const tasks = Array.from({ length: n }, (_, i) => ({
    id: `task_${i + 1}`,
    stepCode: `S-Q${String(i + 1).padStart(2, "0")}-01`,
  }));
  const ops = tasks.map((t, i) => {
    const preds =
      i === 0
        ? []
        : [
            {
              step_id: tasks[i - 1]!.stepCode,
              type: "FS" as const,
              lag_days: 0,
            },
          ];
    return {
      taskId: t.id,
      stepCode: t.stepCode,
      dependsOn: preds.map((p) => ({
        stepId: p.step_id,
        type: p.type,
        lagDays: p.lag_days,
      })),
    };
  });
  return { tasks, ops };
}

async function main() {
  {
    const { tx, calls } = makeFakeTx();
    const r = await flushDependencyWritesInTx(tx, {
      orgId: "org",
      planId: "plan",
      allTasks: [
        { id: "t2", stepCode: "B" },
        { id: "t1", stepCode: "A" },
      ],
      pending: [
        {
          taskId: "t2",
          stepCode: "B",
          dependsOn: [{ stepId: "A", type: "FS", lagDays: 0 }],
        },
      ],
    });
    assert.equal(r.tasksUpdated, 1);
    assert.equal(r.edgesCreated, 1);
    assert.equal(calls.filter((c) => c.method === "createMany").length, 1);
    assert.equal(calls.filter((c) => c.method === "create").length, 0);
    console.log("A — 1 update_dependency batch: ok");
  }

  {
    const { tx, calls } = makeFakeTx();
    const r = await flushDependencyWritesInTx(tx, {
      orgId: "org",
      planId: "plan",
      allTasks: [
        { id: "t1", stepCode: "A" },
        { id: "t2", stepCode: "B" },
        { id: "t3", stepCode: "C" },
      ],
      pending: [
        {
          taskId: "t2",
          stepCode: "B",
          dependsOn: [{ stepId: "A", type: "FS", lagDays: 0 }],
        },
        {
          taskId: "t3",
          stepCode: "C",
          dependsOn: [
            { stepId: "A", type: "FS", lagDays: 0 },
            { stepId: "B", type: "FS", lagDays: 1 },
          ],
        },
      ],
    });
    assert.equal(r.tasksUpdated, 2);
    assert.equal(r.edgesCreated, 3);
    const del = calls.find((c) => c.method === "deleteMany");
    assert.ok(del);
    const delArgs = del!.args as { where: { successorId: { in: string[] } } };
    assert.deepEqual(delArgs.where.successorId.in.sort(), ["t2", "t3"]);
    console.log("B — plusieurs update_dependency: ok");
  }

  {
    const { tasks, ops } = morelLikeOps(32);
    const { tx, calls } = makeFakeTx();
    const r = await flushDependencyWritesInTx(tx, {
      orgId: "org",
      planId: "plan_morel",
      allTasks: tasks.map((t) => ({ id: t.id, stepCode: t.stepCode })),
      pending: ops,
    });
    assert.equal(r.tasksUpdated, 32);
    assert.equal(r.edgesCreated, 31);
    assert.equal(calls.length, 34, `round-trips=${calls.length}`);
    assert.ok(calls.length < 32 * 4);
    console.log("C — 32 dépendances batch (34 round-trips): ok", {
      tasksUpdated: r.tasksUpdated,
      edgesCreated: r.edgesCreated,
      calls: calls.length,
    });
  }

  {
    const { tx, calls, close } = makeFakeTx();
    await flushDependencyWritesInTx(tx, {
      orgId: "org",
      planId: "plan",
      allTasks: [
        { id: "t1", stepCode: "A" },
        { id: "t2", stepCode: "B" },
      ],
      pending: [
        {
          taskId: "t2",
          stepCode: "B",
          dependsOn: [{ stepId: "A", type: "FS", lagDays: 0 }],
        },
      ],
    });
    const before = calls.length;
    close();
    let threw = false;
    try {
      await flushDependencyWritesInTx(tx, {
        orgId: "org",
        planId: "plan",
        allTasks: [
          { id: "t3", stepCode: "C" },
          { id: "t1", stepCode: "A" },
        ],
        pending: [
          {
            taskId: "t3",
            stepCode: "C",
            dependsOn: [{ stepId: "A", type: "FS", lagDays: 0 }],
          },
        ],
      });
    } catch (e) {
      threw = true;
      assert.match(String(e), /Transaction not found|Transaction API error/);
    }
    assert.equal(threw, true);
    assert.equal(calls.length, before);
    console.log("D — échec milieu / tx fermée refusée: ok");
  }

  {
    const { tasks, ops } = morelLikeOps(32);
    const depsMap = new Map<string, Array<{ step_id: string }>>();
    for (const t of tasks) depsMap.set(t.stepCode, []);
    for (const o of ops) {
      depsMap.set(
        o.stepCode,
        o.dependsOn.map((d) => ({ step_id: d.stepId })),
      );
    }
    assert.equal(detectDependencyCycle(depsMap).hasCycle, false);

    const patch = parseBeworkPatch({
      type: "bework_patch_v1",
      schema_version: 1,
      patch_id: "patch_dep_32_test",
      origin: {
        section: "PLANNING",
        project_id: "proj",
        entity_id: "plan",
        base_version: 3,
      },
      change_intent: "PLANNING_ADJUSTMENT",
      reason: "test",
      operations: ops.slice(0, 3).map((o) => ({
        op: "update_dependency",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: "plan",
          task_id: o.taskId,
          step_code: o.stepCode,
        },
        changes: {
          depends_on: normalizeDependsOnJson(
            o.dependsOn.map((d) => ({
              step_id: d.stepId,
              type: d.type,
              lag_days: d.lagDays,
            })),
          ),
        },
      })),
    });
    assert.equal(patch.ok, true);
    console.log("E — graphe 32 FS acyclique + parse: ok");
  }

  {
    const { tx, calls } = makeFakeTx();
    await flushDependencyWritesInTx(tx, {
      orgId: "org",
      planId: "plan",
      allTasks: Array.from({ length: 5 }, (_, i) => ({
        id: `t${i}`,
        stepCode: `S${i}`,
      })),
      pending: Array.from({ length: 5 }, (_, i) => ({
        taskId: `t${i}`,
        stepCode: `S${i}`,
        dependsOn:
          i === 0
            ? []
            : [{ stepId: `S${i - 1}`, type: "FS" as const, lagDays: 0 }],
      })),
    });
    assert.equal(calls.filter((c) => c.method === "create").length, 0);
    assert.equal(calls.filter((c) => c.method === "createMany").length, 1);
    console.log("F — createMany only / pas de tx post-callback: ok");
  }

  console.log("\nALL planning-dependency-commit tests passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
