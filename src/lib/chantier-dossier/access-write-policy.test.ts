import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canOrganizationMemberModifyChantier } from "./access";

const activeMember = { role: "MEMBER", status: "ACTIVE" };

assert.equal(
  canOrganizationMemberModifyChantier(
    {
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
      accessStatus: "ACTIVE",
    },
    activeMember,
  ),
  true,
  "Un membre interne actif doit pouvoir préparer son chantier",
);
assert.equal(
  canOrganizationMemberModifyChantier(
    {
      personType: null,
      permissionProfile: null,
      accessStatus: "ACTIVE",
    },
    activeMember,
  ),
  true,
  "Un membre legacy actif reste autorisé",
);

for (const identity of [
  {
    personType: "CLIENT_EXT",
    permissionProfile: "CLIENT",
    accessStatus: "ACTIVE",
  },
  {
    personType: "SUPPLIER",
    permissionProfile: "FOURNISSEUR",
    accessStatus: "ACTIVE",
  },
  {
    personType: "SUBCONTRACTOR",
    permissionProfile: "SOUS_TRAITANT",
    accessStatus: "ACTIVE",
  },
]) {
  assert.equal(
    canOrganizationMemberModifyChantier(identity, activeMember),
    false,
    `${identity.personType} ne doit pas modifier le socle technique`,
  );
}

assert.equal(
  canOrganizationMemberModifyChantier(
    {
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
      accessStatus: "ACTIVE",
    },
    { role: "VIEWER", status: "ACTIVE" },
  ),
  false,
  "Un VIEWER reste en lecture seule",
);
assert.equal(
  canOrganizationMemberModifyChantier(
    {
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
      accessStatus: "SUSPENDED",
    },
    activeMember,
  ),
  false,
  "Un compte suspendu ne doit pas écrire",
);
assert.equal(
  canOrganizationMemberModifyChantier(
    {
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
      accessStatus: "ACTIVE",
    },
    null,
  ),
  false,
  "Un simple ProjectAccess sans membership ne donne pas l'écriture technique",
);

const routesRequiringTechnicalWrite = [
  "src/app/api/projets/[id]/planning-create/commit/route.ts",
  "src/app/api/projets/[id]/planning-v2/commit/route.ts",
  "src/app/api/projets/[id]/takeoff-create/commit/route.ts",
  "src/app/api/projets/[id]/quote-create/commit/route.ts",
  "src/app/api/projets/[id]/scopes/classify/route.ts",
  "src/app/api/projets/[id]/scopes/route.ts",
  "src/app/api/projets/[id]/scopes/from-quote/route.ts",
  "src/app/api/projets/[id]/global-prep/route.ts",
  "src/app/api/projets/[id]/planning-suivi/route.ts",
  "src/app/api/projets/[id]/link-mission/route.ts",
  "src/app/api/chantier/files/placeholder/route.ts",
];

for (const relativePath of routesRequiringTechnicalWrite) {
  const source = readFileSync(join(process.cwd(), relativePath), "utf8");
  assert.match(
    source,
    /canModifyChantierProject/,
    `${relativePath} doit utiliser le droit d'écriture chantier`,
  );
}

const quoteCommit = readFileSync(
  join(
    process.cwd(),
    "src/app/api/projets/[id]/quote-create/commit/route.ts",
  ),
  "utf8",
);
assert.doesNotMatch(
  quoteCommit,
  /session\.user\.role === "CLIENT"/,
  "Le rôle CLIENT ne doit pas bloquer le propriétaire interne du tenant",
);

const uploadRoute = readFileSync(
  join(process.cwd(), "src/app/api/chantier/files/upload/route.ts"),
  "utf8",
);
assert.match(uploadRoute, /userHasProjectScope/);
assert.match(uploadRoute, /"documents"/);

console.log("access-write-policy.test.ts: OK");
