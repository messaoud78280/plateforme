/**
 * MATERIAUX-V1B.1 — recette routing après fix Next.js slug.
 * Run: npx tsx scripts/test-materiaux-v1b1-routing.ts
 *
 * Vérifie structure dossiers, params handlers, URLs client — sans hit DB.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

const root = process.cwd();
const projetsApi = join(root, "src/app/api/projets");

assert(!existsSync(join(projetsApi, "[projectId]")), "plus de dossier [projectId]");
assert(existsSync(join(projetsApi, "[id]/materiaux/route.ts")), "GET/POST sous [id]/materiaux");
assert(
  existsSync(join(projetsApi, "[id]/materiaux/[requirementId]/route.ts")),
  "PATCH sous [id]/materiaux/[requirementId]",
);

const listSrc = readFileSync(join(projetsApi, "[id]/materiaux/route.ts"), "utf8");
const itemSrc = readFileSync(
  join(projetsApi, "[id]/materiaux/[requirementId]/route.ts"),
  "utf8",
);

assert(/params: Promise<\{ id: string \}>/.test(listSrc), "list Ctx params.id");
assert(/const \{ id: projectId \} = await ctx\.params/.test(listSrc), "list lit params.id → projectId");
assert(!/params\.projectId/.test(listSrc), "list: pas params.projectId");
assert(/organizationId: orgId/.test(listSrc) || /organizationId: opts\.orgId/.test(listSrc), "list ACL org");
assert(/id: opts\.projectId[\s\S]*organizationId: opts\.orgId|organizationId: opts\.orgId[\s\S]*id: opts\.projectId/.test(listSrc), "assertProjectAccess id+org");

assert(
  /params: Promise<\{ id: string; requirementId: string \}>/.test(itemSrc),
  "item Ctx params.id + requirementId",
);
assert(
  /const \{ id: projectId, requirementId \} = await ctx\.params/.test(itemSrc),
  "item lit params.id + requirementId",
);
assert(!/params\.projectId/.test(itemSrc), "item: pas params.projectId");
assert(
  /where: \{ id: requirementId, projectId, organizationId: orgId \}/.test(itemSrc),
  "PATCH filtre id+projectId+organizationId (anti cross-project/org)",
);
assert(/body\.cancel/.test(itemSrc), "cancel via PATCH body.cancel");
assert(!/export async function DELETE/.test(itemSrc), "pas de DELETE HTTP (cancel = PATCH)");
assert(!/export async function GET/.test(itemSrc), "pas de GET détail dédié");

const clientSrc = readFileSync(
  join(root, "src/components/projects/ProjectMateriauxSection.tsx"),
  "utf8",
);
assert(
  clientSrc.includes("`/api/projets/${projectId}/materiaux`"),
  "client GET/POST URL path",
);
assert(
  clientSrc.includes("`/api/projets/${projectId}/materiaux/${id}`"),
  "client PATCH cancel URL path",
);
assert(!clientSrc.includes("[projectId]"), "client: pas de nom technique [projectId]");
assert(!clientSrc.includes("[requirementId]"), "client: pas de nom technique [requirementId]");

/** Conflits de slugs frères dynamiques sous src/app */
function scanSiblingConflicts(base: string): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    const dyn = entries.filter(
      (n) => n.startsWith("[") && n.endsWith("]") && !n.startsWith("[..."),
    );
    if (dyn.length > 1) out.push(`${dir}: ${dyn.join(", ")}`);
    for (const n of entries) {
      const p = join(dir, n);
      try {
        if (statSync(p).isDirectory()) walk(p);
      } catch {
        /* ignore */
      }
    }
  }
  walk(base);
  return out;
}

const conflicts = scanSiblingConflicts(join(root, "src/app"));
assert(conflicts.length === 0, `aucun conflit slug frère (${conflicts.join(" | ") || "aucun"})`);

/** Routes historiques [id] toujours présentes */
for (const rel of ["route.ts", "access/route.ts", "link-mission/route.ts", "tasks/route.ts"]) {
  assert(existsSync(join(projetsApi, "[id]", rel)), `historique [id]/${rel}`);
}

if (failed) {
  process.exit(1);
}
console.log("\nMATERIAUX-V1B.1 routing recette OK");
