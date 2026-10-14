import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const routePath = join(
  process.cwd(),
  "src/app/api/prep-studies/[id]/plan-source/route.ts",
);
const source = readFileSync(routePath, "utf8");

function count(pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0;
}

assert.equal(
  count(/const guard = await requirePrepApiContext\(\);/g),
  3,
  "GET, PATCH et DELETE doivent tous utiliser le garde-fou préparation",
);
assert.equal(
  count(/organizationId: guard\.ctx\.orgId/g),
  3,
  "Chaque chargement d'étude doit être borné à l'organisation de la session",
);
assert.equal(
  count(/actorUserId: guard\.ctx\.userId/g),
  2,
  "Les deux mutations doivent journaliser l'utilisateur autorisé",
);
assert.doesNotMatch(
  source,
  /getServerSession|authOptions/,
  "La route ne doit pas revenir à une simple vérification de session",
);
assert.match(
  source,
  /detachPrepStudyPlanSource/,
  "Le détachement local préexistant doit être conservé",
);

console.log("plan-source-route-access.test.ts: OK");
