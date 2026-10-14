/**
 * Contrat export → parse → preview/commit eligibility, sans accès DB.
 * Jeux synthétiques uniquement.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChatgptContextSkeleton } from "@/lib/bework-patch/context";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";
import {
  isOperationCommitSupportedForSection,
  supportedOperationsForSection,
} from "@/lib/bework-patch/operations-catalog";
import {
  BEWORK_PATCH_SECTIONS,
  type BeworkPatchSection,
} from "@/lib/bework-patch/types";
import {
  validatePatchAgainstChatgptContext,
  validatePatchContext,
} from "@/lib/bework-patch/validate-context";
import { emptySubgraph } from "@/lib/bework-patch/impact/types";
import { analyzePatchImpact } from "@/lib/bework-patch/impact/analyze-impact";
import { evaluateCommitEligibility } from "@/lib/bework-patch/commit/eligibility";

const fixtures: Record<
  BeworkPatchSection,
  {
    entityType:
      | "PREP_STUDY"
      | "COMMERCIAL_QUOTE"
      | "PREP_SCHEDULE_PLAN"
      | "SITE_VISIT"
      | "FOLLOW_UP_SHEET"
      | "SITE_DOCUMENT"
      | "SUPPLY_WORKSPACE";
    entityId: string;
    data: Record<string, unknown>;
  }
> = {
  TAKEOFF: {
    entityType: "PREP_STUDY",
    entityId: "study-maconnerie-neuf",
    data: {
      trade: "Maçonnerie",
      parameters: [{ id: "param-1", key: "mur.longueur", value: 12 }],
      lines: [],
    },
  },
  QUOTE: {
    entityType: "COMMERCIAL_QUOTE",
    entityId: "quote-electricite-neuf",
    data: {
      sections: [
        {
          section_id: "section-1",
          items: [
            {
              item_id: "item-1",
              designation: "Tableau électrique",
              quantity: 1,
            },
          ],
        },
      ],
    },
  },
  PLANNING: {
    entityType: "PREP_SCHEDULE_PLAN",
    entityId: "plan-couverture-neuf",
    data: {
      tasks: [
        {
          task_id: "task-1",
          step_code: "COUV-01",
          name: "Pose écran sous-toiture",
        },
      ],
    },
  },
  VISIT: {
    entityType: "SITE_VISIT",
    entityId: "visit-plomberie-neuf",
    data: { measurements: [] },
  },
  FOLLOW_UP: {
    entityType: "FOLLOW_UP_SHEET",
    entityId: "sheet-menuiserie-neuf",
    data: { title: "Suivi menuiseries", notes: null },
  },
  REPORT: {
    entityType: "SITE_DOCUMENT",
    entityId: "report-vrd-neuf",
    data: { title: "Compte rendu VRD", quick_notes: null },
  },
  NOTICE: {
    entityType: "SITE_DOCUMENT",
    entityId: "notice-peinture-neuf",
    data: { title: "Notice peinture", quick_notes: null },
  },
  SUPPLY: {
    entityType: "SUPPLY_WORKSPACE",
    entityId: "project-appro-neuf",
    data: { supply_needs: [] },
  },
};

// Toutes les sections exportent le contrat racine exact et un exemple parsable.
for (const section of BEWORK_PATCH_SECTIONS) {
  const fixture = fixtures[section];
  const projectId = `project-${section.toLowerCase()}-neuf`;
  const ctx = buildChatgptContextSkeleton({
    section,
    project: { id: projectId, title: `Chantier fictif ${section}` },
    target: {
      entity_type: fixture.entityType,
      id: fixture.entityId,
      version: 7,
    },
    data: fixture.data,
  });
  assert.deepEqual(ctx.patch_contract.origin.exact_value, {
    section,
    project_id: projectId,
    entity_id: fixture.entityId,
    base_version: 7,
  });
  assert.equal(ctx.patch_template.origin, ctx.patch_contract.origin.exact_value);
  assert.equal(ctx.patch_contract.operations.length, ctx.supported_operations.length);
  assert.ok(ctx.patch_contract.operations.length > 0, `${section}: aucune op annoncée`);
  for (const operation of ctx.patch_contract.operations) {
    assert.equal(operation.commit_supported, true);
    assert.equal(
      isOperationCommitSupportedForSection(section, operation.op),
      true,
      `${section}/${operation.op}: annoncée mais non committable`,
    );
  }
  const parsedExample = parseBeworkPatch(ctx.valid_patch_example);
  assert.equal(
    parsedExample.ok,
    true,
    `${section}: valid_patch_example doit être accepté par le parser`,
  );
}
console.log("contrat exporté et exemples parsables : ok");

{
  const supply = buildChatgptContextSkeleton({
    section: "SUPPLY",
    project: { id: "project-supply-rules", title: "Chantier appro" },
    target: {
      entity_type: "SUPPLY_WORKSPACE",
      id: "project-supply-rules",
      version: 2,
    },
  });
  assert.match(supply.validation_rules.join(" "), /plusieurs add_supply_need/i);
  assert.match(supply.validation_rules.join(" "), /requirement_id déjà présent/i);
}

// Deux chantiers/métiers inédits ne partagent aucun identifiant contractuel.
{
  const maconnerie = buildChatgptContextSkeleton({
    section: "TAKEOFF",
    project: { id: "project-maconnerie-A", title: "Extension maison" },
    target: { entity_type: "PREP_STUDY", id: "study-A", version: 3 },
    data: {
      trade: "Maçonnerie",
      parameters: [{ id: "param-A", key: "voile.longueur", value: 8 }],
    },
  });
  const electricite = buildChatgptContextSkeleton({
    section: "TAKEOFF",
    project: { id: "project-electricite-B", title: "Bureaux neufs" },
    target: { entity_type: "PREP_STUDY", id: "study-B", version: 11 },
    data: {
      trade: "Électricité",
      parameters: [{ id: "param-B", key: "prises.nombre", value: 42 }],
    },
  });
  assert.equal(
    (
      maconnerie.valid_patch_example.origin as {
        project_id: string;
        entity_id: string;
        base_version: number;
      }
    ).project_id,
    "project-maconnerie-A",
  );
  assert.deepEqual(electricite.patch_contract.origin.exact_value, {
    section: "TAKEOFF",
    project_id: "project-electricite-B",
    entity_id: "study-B",
    base_version: 11,
  });
}
console.log("chantiers et métiers inédits : ok");

// Cause racine rapportée : origin: "CHATGPT" est refusé avec chemin + attendu + reçu.
{
  const invalid = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch-origin-chatgpt",
    origin: "CHATGPT",
    change_intent: "TECHNICAL_CORRECTION",
    operations: [],
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    const issue = invalid.errors.find((item) => item.path === "origin");
    assert.ok(issue);
    assert.match(issue.message, /objet|cible métier/i);
    assert.match(issue.expected ?? "", /section.*project_id.*entity_id.*base_version/i);
    assert.equal(issue.received, '"CHATGPT"');
  }
}

// target racine ambigu refusé ; target est propre à chaque opération.
{
  const invalid = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch-root-target",
    origin: {
      section: "VISIT",
      project_id: "project-1",
      entity_id: "visit-1",
      base_version: 1,
    },
    target: { id: "visit-1" },
    change_intent: "FIELD_UPDATE",
    operations: [
      {
        op: "update_visit",
        target: { entity_type: "SITE_VISIT", visit_id: "visit-1" },
        changes: { comments: "Constat terrain" },
      },
    ],
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.ok(invalid.errors.some((item) => item.path === "target"));
  }
}
console.log("erreurs origin/target structurées : ok");

// Un patch ne peut pas détourner un contexte vers une autre entité du même projet.
{
  const context = buildChatgptContextSkeleton({
    section: "NOTICE",
    project: { id: "project-1", title: "Chantier" },
    target: { entity_type: "SITE_DOCUMENT", id: "notice-1", version: 4 },
    data: { title: "Notice 1" },
  });
  const parsed = parseBeworkPatch({
    ...(context.valid_patch_example as Record<string, unknown>),
    patch_id: "patch-origin-entity-mismatch",
    origin: {
      section: "NOTICE",
      project_id: "project-1",
      entity_id: "notice-2",
      base_version: 4,
    },
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    const validated = validatePatchAgainstChatgptContext(parsed.patch, context);
    assert.equal(validated.ok, false);
    assert.ok(
      validated.errors.some((item) => item.path === "origin.entity_id"),
    );
  }
}
console.log("liaison contexte → entité : ok");

// Approvisionnements : plusieurs besoins dans le même patch, sans prix inventé.
{
  const raw = {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch-supply-multi-needs",
    origin: {
      section: "SUPPLY",
      project_id: "project-supply-multi",
      entity_id: "project-supply-multi",
      base_version: 42,
    },
    change_intent: "TECHNICAL_CORRECTION",
    reason: "Besoins synthétiques isolés",
    operations: [
      {
        op: "add_supply_need",
        target: {
          entity_type: "SUPPLY_WORKSPACE",
          project_id: "project-supply-multi",
        },
        need: {
          label: "Bloc béton creux 20 cm",
          unit: "u",
          validated_order_quantity: 120,
          source_type: "TAKEOFF_LINE",
          takeoff_codes: ["MAC-01"],
          is_hypothesis: false,
        },
      },
      {
        op: "add_supply_need",
        target: {
          entity_type: "SUPPLY_WORKSPACE",
          project_id: "project-supply-multi",
        },
        need: {
          label: "Câble U1000 R2V 3G2,5",
          unit: "ml",
          validated_order_quantity: 250,
          source_type: "TAKEOFF_LINE",
          takeoff_codes: ["ELEC-02"],
          is_hypothesis: false,
        },
      },
    ],
  };
  const parsed = parseBeworkPatch(raw);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    const subgraph = emptySubgraph("project-supply-multi");
    subgraph.supply = {
      projectId: "project-supply-multi",
      contextVersion: 42,
      needCount: 0,
      offerCount: 0,
      needsWithOrders: 0,
    };
    const impact = analyzePatchImpact({ patch: parsed.patch, subgraph });
    assert.equal(impact.errors.length, 0);
    assert.equal(impact.directChanges.length, 2);
    const eligibility = evaluateCommitEligibility({ patch: parsed.patch, impact });
    assert.equal(eligibility.ok, true);
    if (eligibility.ok) assert.equal(eligibility.mode, "SUPPLY_ONLY");
  }
}
console.log("SUPPLY multi-besoins : ok");

// Version obsolète et double commit synthétique.
{
  const parsed = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch-version-idempotence",
    origin: {
      section: "NOTICE",
      project_id: "project-1",
      entity_id: "notice-1",
      base_version: 4,
    },
    change_intent: "DOCUMENT_EDIT",
    operations: [
      {
        op: "update_notice",
        target: { entity_type: "SITE_DOCUMENT", document_id: "notice-1" },
        changes: { quick_notes: "À vérifier" },
      },
    ],
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(
      validatePatchContext(parsed.patch, {
        organizationId: "org-1",
        projectId: "project-1",
        currentVersion: 5,
      }).code,
      "VERSION_CONFLICT",
    );
    assert.equal(
      validatePatchContext(parsed.patch, {
        organizationId: "org-1",
        projectId: "project-1",
        currentVersion: 4,
        appliedPatchIds: ["patch-version-idempotence"],
      }).code,
      "DUPLICATE_PATCH",
    );
  }
}
console.log("versioning et double commit : ok");

// Contrôle de droits serveur présent sur les trois routes du pipeline.
for (const route of [
  "context/route.ts",
  "analyze/route.ts",
  "commit/route.ts",
]) {
  const source = readFileSync(
    join(process.cwd(), "src/app/api/bework-patch", route),
    "utf8",
  );
  assert.match(source, /requirePrepApiContext\(\)/, `${route}: garde serveur absente`);
}
assert.equal(
  supportedOperationsForSection("SUPPLY").every((spec) =>
    isOperationCommitSupportedForSection("SUPPLY", spec.op),
  ),
  true,
);
console.log("droits serveur et couverture commit : ok");

console.log("pipeline-contract-v1.test.ts: ok");
