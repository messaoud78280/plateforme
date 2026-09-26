/**
 * Smoke — résolution + UI upload-in-modal plan source (sans BDD).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  normalizePrepSources,
  planSourceDisplayTitle,
  primaryPrepSource,
} from "../src/lib/preparation/plan-source";

const raw = [
  {
    id: "SRC-C01",
    filename: "plan de fondation.pdf",
    planNumber: "C-01",
    title: "Plan Niveau Fondations",
    revision: null,
    scale: "1:50",
    page: 1,
    isRaster: true,
    legibility: "partielle",
    note: "test",
  },
];

const sources = normalizePrepSources(raw);
assert.equal(sources.length, 1);
assert.equal(sources[0]!.chantierFileId, null);
assert.equal(sources[0]!.planNumber, "C-01");

const primary = primaryPrepSource(raw);
assert.ok(primary);
assert.equal(planSourceDisplayTitle(primary!), "Plan d'exécution C-01");

const withFile = normalizePrepSources([
  { ...raw[0], chantierFileId: "file-abc", revision: "R1" },
]);
assert.equal(withFile[0]!.chantierFileId, "file-abc");
assert.equal(withFile[0]!.revision, "R1");

const actionsSrc = readFileSync(
  join(process.cwd(), "src/components/preparation/PrepPlanSourceActions.tsx"),
  "utf8",
);
assert.match(actionsSrc, /\/api\/chantier\/files\/upload/);
assert.match(actionsSrc, /Déposer le plan/);
assert.match(actionsSrc, /Voir le plan source/);
assert.match(actionsSrc, /Changer \/ rattacher une autre révision/);
assert.match(actionsSrc, /Aucun plan n.est encore rattach/);
assert.match(actionsSrc, /returnTo=/);
assert.match(actionsSrc, /fileInputRef/);

const routeSrc = readFileSync(
  join(process.cwd(), "src/app/api/prep-studies/[id]/plan-source/route.ts"),
  "utf8",
);
assert.match(routeSrc, /planNumber/);
assert.match(routeSrc, /revision/);

const workspaceSrc = readFileSync(
  join(process.cwd(), "src/lib/chantier/project-workspace.ts"),
  "utf8",
);
assert.match(workspaceSrc, /PDF disponible/);

console.log("OK plan-source unit + UX upload-in-modal");
