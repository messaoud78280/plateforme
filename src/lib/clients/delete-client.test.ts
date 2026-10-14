import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { clientDeletionBlockersFromCounts } from "./delete-client";

assert.deepEqual(
  clientDeletionBlockersFromCounts({ accounts: 1, sessions: 2 }),
  [],
  "Les seules relations NextAuth ne doivent pas bloquer un compte vierge",
);

const blockers = clientDeletionBlockersFromCounts({
  accounts: 1,
  sessions: 0,
  projects: 2,
  commercialInvoicesCreated: 1,
  reportsAuthored: 3,
});
assert.deepEqual(
  blockers.map((blocker) => blocker.relation).sort(),
  ["commercialInvoicesCreated", "projects", "reportsAuthored"].sort(),
);
assert.equal(
  blockers.reduce((sum, blocker) => sum + blocker.count, 0),
  6,
);

assert.deepEqual(
  clientDeletionBlockersFromCounts(
    { accounts: 1, sessions: 1 },
    { hasFollowUpAlertSettings: true },
  ),
  [
    {
      relation: "followUpAlertSettings",
      label: "paramétrage de suivi",
      count: 1,
    },
  ],
);

const route = readFileSync(
  join(process.cwd(), "src/app/api/clients/[clientId]/route.ts"),
  "utf8",
);
assert.match(route, /prisma\.\$transaction/);
assert.match(route, /isolationLevel: "Serializable"/);
assert.match(route, /_count: true/);
assert.match(route, /CLIENT_HAS_BUSINESS_DATA/);
assert.doesNotMatch(
  route,
  /deleteClientStorageFiles|createServiceRoleClient/,
  "Aucun effacement Storage ne doit précéder la validation DB",
);

console.log("delete-client.test.ts: OK");
