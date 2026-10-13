import assert from "node:assert/strict";
import { evaluateDirectMessageAcl, type DirectAclUser } from "@/lib/messaging/direct-acl";
import {
  canAccessTaskThread,
  taskMessageVisibilityRelationWhere,
  taskMessagerieWhere,
} from "@/lib/messaging/access";

const task = { id: "t1", clientId: "client-1", assignedToId: "agent-1" };

function person(partial: Partial<DirectAclUser> & Pick<DirectAclUser, "id" | "role">): DirectAclUser {
  return {
    personType: null,
    permissionProfile: null,
    accessStatus: "ACTIVE",
    email: null,
    organizationIds: [],
    externalHostOrganizationId: null,
    ...partial,
  };
}

assert.deepEqual(taskMessagerieWhere({ id: "m1", role: "MANAGER", personType: null }), {});
assert.deepEqual(
  taskMessagerieWhere({ id: "m2", role: "MANAGER", personType: "CLIENT_EXT" }),
  { clientId: "m2" },
);
assert.deepEqual(
  taskMessagerieWhere({ id: "a1", role: "AGENT", personType: "INTERNAL" }),
  { assignedToId: "a1" },
);
assert.deepEqual(
  taskMessagerieWhere({ id: "a2", role: "AGENT", personType: "SUPPLIER" }),
  { clientId: "a2" },
);
assert.deepEqual(taskMessagerieWhere({ id: "c1", role: "CLIENT" }), { clientId: "c1" });

assert.deepEqual(
  taskMessageVisibilityRelationWhere({ id: "c1", role: "CLIENT" }),
  { isInternal: false },
);
assert.deepEqual(
  taskMessageVisibilityRelationWhere({ id: "x1", role: "MANAGER", personType: "CLIENT_EXT" }),
  { isInternal: false },
);
assert.deepEqual(
  taskMessageVisibilityRelationWhere({ id: "m1", role: "MANAGER", personType: null }),
  {},
);

async function assertThreadAccess() {
  assert.equal(
    await canAccessTaskThread({ id: "m1", role: "MANAGER", personType: null }, task),
    true,
  );
  assert.equal(
    await canAccessTaskThread(
      { id: "other", role: "MANAGER", personType: "CLIENT_EXT" },
      task,
    ),
    false,
  );
  assert.equal(
    await canAccessTaskThread(
      { id: "client-1", role: "MANAGER", personType: "CLIENT_EXT" },
      task,
    ),
    true,
  );
  assert.equal(
    await canAccessTaskThread({ id: "agent-1", role: "AGENT", personType: "INTERNAL" }, task),
    true,
  );
  assert.equal(
    await canAccessTaskThread({ id: "other", role: "AGENT", personType: "INTERNAL" }, task),
    false,
  );
}

const outsider = person({ id: "outsider", role: "CLIENT", personType: "CLIENT_EXT" });
const clientSideManager = person({
  id: "fake-staff",
  role: "MANAGER",
  personType: "CLIENT_EXT",
});
const realManager = person({ id: "staff", role: "MANAGER", personType: null });

assert.equal(evaluateDirectMessageAcl(clientSideManager, outsider).ok, false);
assert.equal(evaluateDirectMessageAcl(realManager, outsider).ok, true);

assertThreadAccess()
  .then(() => {
    console.log("messaging R7 access tests OK");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
