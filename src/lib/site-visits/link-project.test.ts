import assert from "node:assert/strict";
import {
  filterLinkableProjects,
  visitProjectCoherenceWarning,
  type LinkableProject,
} from "./link-project";

const base: LinkableProject[] = [
  {
    id: "p1",
    title: "ROCKMAN Kennedy",
    siteAddress: "34 boulevard Kennedy",
    siteCity: "Paris",
    chantierStatus: "EN_COURS",
    statusLabel: "En cours",
    clientName: "ROCKMAN",
  },
  {
    id: "p2",
    title: "Autre chantier Lyon",
    siteAddress: "12 rue Test",
    siteCity: "Lyon",
    chantierStatus: "ETUDE",
    statusLabel: "Étude",
    clientName: "ACME",
  },
];

assert.deepEqual(
  filterLinkableProjects(base, "rockman").map((p) => p.id),
  ["p1"],
);
assert.deepEqual(
  filterLinkableProjects(base, "kennedy paris").map((p) => p.id),
  ["p1"],
);
assert.deepEqual(
  filterLinkableProjects(base, "lyon").map((p) => p.id),
  ["p2"],
);
assert.equal(filterLinkableProjects(base, "").length, 2);

assert.equal(
  visitProjectCoherenceWarning({
    visitClientName: "ROCKMAN",
    visitAddress: "34 boulevard Kennedy, 75006 Paris",
    projectClientName: "ROCKMAN",
    projectAddress: "34 boulevard Kennedy",
    projectCity: "Paris",
  }),
  null,
);

const warn = visitProjectCoherenceWarning({
  visitClientName: "ROCKMAN",
  visitAddress: "34 boulevard Kennedy, 75006 Paris",
  projectClientName: "ACME",
  projectAddress: "12 rue Test",
  projectCity: "Lyon",
});
assert.ok(warn && warn.includes("diffèrent"));

console.log("link-project.test.ts OK");
