/**
 * Anti-régression : le Gantt ne doit plus monter de fiche tâche flottante
 * (createPortal + PlanningTaskHoverCard). Le détail = PrepScheduleTaskPanel seul.
 *
 * npx tsx src/components/preparation/PrepScheduleGantt.no-floating-card.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const gantt = readFileSync(
  join(root, "src/components/preparation/PrepScheduleGantt.tsx"),
  "utf8",
);
const planView = readFileSync(
  join(root, "src/components/preparation/PrepSchedulePlanView.tsx"),
  "utf8",
);

// Gantt : aucun portal / hover card riche / état floating
assert.equal(
  gantt.includes("createPortal"),
  false,
  "PrepScheduleGantt ne doit pas importer createPortal",
);
assert.equal(
  gantt.includes("PlanningTaskHoverCard"),
  false,
  "PrepScheduleGantt ne doit pas rendre PlanningTaskHoverCard",
);
assert.equal(
  /openFloating|setFloating|floatDetails/.test(gantt),
  false,
  "PrepScheduleGantt ne doit plus avoir d’état floating",
);
assert.ok(
  gantt.includes("hoveredTaskId"),
  "hoveredTaskId conserve les highlights (sans fiche)",
);
assert.ok(
  gantt.includes("selectedTaskId"),
  "selectedTaskId pilote la sélection → panneau latéral parent",
);

// Plan view : panneau latéral conservé, pas de HoverCard riche dans le tableau
assert.ok(
  planView.includes("PrepScheduleTaskPanel"),
  "PrepScheduleTaskPanel (drawer droit) doit rester",
);
assert.equal(
  planView.includes("PlanningTaskHoverCard"),
  false,
  "PrepSchedulePlanView ne doit plus monter PlanningTaskHoverCard",
);
assert.equal(
  /popover=\{?\s*<PlanningTaskHoverCard/.test(planView),
  false,
);

console.log("OK — Gantt: floating card = 0 · panneau latéral = conservé");
