/**
 * Dry-run C-01 — protection données sources (LECTURE SEULE, aucune écriture).
 * URBAN AMÉNAGEMENTS uniquement.
 *
 * Usage:
 *   npx @railway/cli run --service plateforme --environment production -- \
 *     node --import tsx scripts/test-source-protection-c01-dryrun.ts
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { analyzePatchImpact } from "../src/lib/bework-patch/impact/analyze-impact";
import { loadImpactSubgraph } from "../src/lib/bework-patch/impact/load-subgraph";
import { evaluateCommitEligibility } from "../src/lib/bework-patch/commit/eligibility";
import { mapProvenanceKind } from "../src/lib/bework-context/provenance";
import type { BeworkPatchV1 } from "../src/lib/bework-patch/types";

const URBAN_ORG = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";

async function fingerprint() {
  const studies = await prisma.prepStudy.findMany({
    where: { projectId: C01, organizationId: URBAN_ORG },
    select: {
      id: true,
      version: true,
      updatedAt: true,
      parameters: {
        where: { key: "fouille.profondeur_commune" },
        select: { key: true, value: true, provenance: true, updatedAt: true },
      },
    },
  });
  return JSON.stringify(studies);
}

async function main() {
  const org = await prisma.organization.findFirst({
    where: { id: URBAN_ORG },
    select: { id: true, name: true },
  });
  assert.ok(org, "URBAN introuvable");
  assert.ok(
    /urban/i.test(org.name),
    `Org attendue URBAN, reçu: ${org.name}`,
  );
  console.log("Org:", org.name);

  const before = await fingerprint();

  const study = await prisma.prepStudy.findFirst({
    where: {
      projectId: C01,
      organizationId: URBAN_ORG,
      archivedAt: null,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      version: true,
      parameters: {
        where: { key: "fouille.profondeur_commune" },
        select: {
          id: true,
          key: true,
          label: true,
          value: true,
          provenance: true,
          note: true,
          hypothesisId: true,
        },
      },
    },
  });
  assert.ok(study, "Étude C-01 introuvable");
  const param = study.parameters[0];
  assert.ok(param, "fouille.profondeur_commune introuvable sur C-01");

  const kind = mapProvenanceKind({ provenance: param.provenance });
  const value = param.value != null ? Number(param.value) : null;
  console.log(
    JSON.stringify(
      {
        studyId: study.id,
        title: study.title,
        version: study.version,
        key: param.key,
        value,
        provenance: param.provenance,
        provenanceKind: kind,
        hypothesisId: param.hypothesisId,
      },
      null,
      2,
    ),
  );

  assert.equal(
    kind,
    "MANUAL",
    `Attendu MANUAL (saisie utilisateur), reçu ${kind}`,
  );

  const patch: BeworkPatchV1 = {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "dryrun_c01_h04_blocked",
    origin: {
      section: "TAKEOFF",
      project_id: C01,
      entity_id: study.id,
      base_version: study.version,
    },
    change_intent: "TECHNICAL_CORRECTION",
    reason: "Proposition erronée : remplacer par hypothèse H-04",
    operations: [
      {
        op: "update_parameter",
        target: {
          entity_type: "PREP_PARAMETER",
          study_id: study.id,
          parameter_id: param.id,
          parameter_key: param.key,
        },
        changes: {
          value: 0.8,
          note: "Hypothèse H-04 — niveau d'assise (documentaire)",
        },
      },
    ],
  };

  const subgraph = await loadImpactSubgraph({
    orgId: URBAN_ORG,
    projectId: C01,
    patch,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  const elig = evaluateCommitEligibility({ patch, impact });

  console.log(
    JSON.stringify(
      {
        errors: impact.errors.map((e) => ({ code: e.code, message: e.message })),
        protectionStatus: impact.directChanges[0]?.protectionStatus,
        currentProvenanceLabel: impact.directChanges[0]?.currentProvenanceLabel,
        proposalProvenanceLabel: impact.directChanges[0]?.proposalProvenanceLabel,
        eligibility: elig,
      },
      null,
      2,
    ),
  );

  assert.ok(
    impact.errors.some((e) => e.code === "PROTECTED_SOURCE_CONFLICT"),
    "Attendu PROTECTED_SOURCE_CONFLICT",
  );
  assert.equal(elig.ok, false);
  if (!elig.ok) {
    assert.equal(elig.code, "PROTECTED_SOURCE_CONFLICT");
  }

  const after = await fingerprint();
  assert.equal(before, after, "AUCUNE écriture — fingerprint inchangé");
  console.log("\n✅ C-01 dry-run: PROTECTED_SOURCE_CONFLICT · aucune écriture");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
