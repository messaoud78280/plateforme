/**
 * Métré & Préparation — scénario C-01 (tests A à L).
 *   node --import tsx scripts/test-prep-metre.ts            → moteur + import (sans base)
 *   PREP_DB_TESTS=1 node --import tsx scripts/test-prep-metre.ts
 *     → ajoute J/K/L en base, dans une transaction systématiquement annulée (aucune écriture conservée).
 *     Prérequis : migration prisma/migrations/add-prep-studies-metre-v1.sql appliquée.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parsePrepBundle, parsePrepJsonText, type NormalizedPrepBundle } from "../src/lib/preparation/bundle/parse";
import { computeStudy, summarizeBases } from "../src/lib/preparation/engine/compute";
import { formatQty } from "../src/lib/preparation/units";

const ROOT = path.resolve(__dirname, "..");
const NEW_RAW = readFileSync(path.join(ROOT, "docs/preparation/exemples/c01-fondations.prep.json"), "utf8");
const LEGACY_RAW = readFileSync(path.join(ROOT, "docs/preparation/exemples/c01-fondations.legacy.json"), "utf8");

const results: { id: string; label: string; ok: boolean; detail?: string }[] = [];

async function test(id: string, label: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    results.push({ id, label, ok: true });
  } catch (e) {
    results.push({ id, label, ok: false, detail: e instanceof Error ? e.message : String(e) });
  }
}

function near(actual: number | null | undefined, expected: number, label: string) {
  assert.ok(actual !== null && actual !== undefined, `${label} : valeur absente`);
  assert.ok(Math.abs(actual - expected) < 1e-9, `${label} : attendu ${expected}, obtenu ${actual}`);
}

function bundleOf(raw: string): NormalizedPrepBundle {
  const r = parsePrepJsonText(raw);
  if (!r.ok) throw new Error(r.issues.map((i) => `${i.path}: ${i.message}`).join(" | "));
  return r.bundle;
}

const C01 = bundleOf(NEW_RAW);

function run(overrides: Record<string, number> = {}) {
  const params = C01.parameters.map((p) =>
    p.key in overrides ? { ...p, value: overrides[p.key], provenance: "SAISIE_MANUELLE" as const } : p,
  );
  const r = computeStudy({ params, lines: C01.lines });
  assert.equal(r.structural.length, 0, "erreurs structurelles");
  const v = (code: string) => r.nodes.get(code)?.value ?? null;
  return { r, v };
}

function expectAll(v: (c: string) => number | null, expected: Record<string, number>) {
  for (const [code, value] of Object.entries(expected)) near(v(code), value, code);
}

const REFERENCE: Record<string, number> = {
  "TE-01": 36.48, "TE-02": 6.4, "TE-03": 2.304, "TE-04": 56.48,
  "EV-01": 45.184, "EV-02": 56.48, "EV-03": 56.48, "EV-04": 0, "EV-05": -30.98,
  "BP-01": 2.28, "BP-02": 0.4, "BP-03": 0.144, "TOT-01": 2.824,
  "BE-01": 9.5, "BE-02": 1.28, "BE-03": 0.6, "TOT-02": 11.38, "TOT-03": 14.204, "TOT-04": 740 / 11.38,
  "RE-01": 30.98, "LOG-01": 6, "LOG-02": 1, "LOG-03": 2, "AR-01": 740,
};

async function pureTests() {
  await test("A", "Import JSON (nouveau format + ancien format C-01)", () => {
    const n = parsePrepJsonText(NEW_RAW);
    assert.ok(n.ok, "nouveau format refusé");
    assert.equal(n.issues.filter((i) => i.severity === "error").length, 0);
    assert.equal(C01.parameters.length, 28);
    assert.ok(C01.lines.length >= 24);
    const l = parsePrepJsonText(LEGACY_RAW);
    assert.ok(l.ok, "ancien format refusé");
    assert.ok(l.bundle.adapted);
    assert.equal(l.issues.filter((i) => i.severity === "error").length, 0);
    const before = JSON.stringify(JSON.parse(NEW_RAW));
    parsePrepBundle(JSON.parse(NEW_RAW));
    assert.equal(JSON.stringify(JSON.parse(NEW_RAW)), before, "l'objet source ne doit pas être modifié");
  });

  await test("B", "Quantités attendues C-01", () => {
    expectAll(run().v, REFERENCE);
  });

  await test("C", "Profondeur des fouilles 0,80 → 0,90 m", () => {
    const { v } = run({ "fouille.profondeur_commune": 0.9 });
    expectAll(v, {
      "TE-01": 41.04, "TE-02": 7.2, "TE-03": 2.592, "EV-01": 50.832, "EV-03": 63.54, "RE-01": 36.628, "LOG-01": 7,
      "TE-04": 56.48,
    });
  });

  await test("D", "Longueur SF1 76 → 80 m, largeur fouille 0,60 → 0,70 m", () => {
    const a = run({ "sf1.longueur": 80 }).v;
    expectAll(a, { "TE-01": 38.4, "BE-01": 10, "BP-01": 2.4, "TOT-02": 11.88 });
    const b = run({ "sf1.fouille_largeur": 0.7 }).v;
    expectAll(b, { "TE-01": 42.56, "TE-04": 64.08, "EV-01": 51.264, "TOT-01": 3.204, "RE-01": 36.68, "LOG-01": 7 });
  });

  await test("E", "Nombre de semelles isolées S1 8 → 10", () => {
    expectAll(run({ "s1.nombre": 10 }).v, { "TE-02": 8, "BE-02": 1.6, "BP-02": 0.5, "IM-05": 12, "TOT-02": 11.7 });
  });

  await test("F", "Volumes de béton (propreté + fondations)", () => {
    const { v } = run();
    near(v("TOT-01"), (v("BP-01") ?? 0) + (v("BP-02") ?? 0) + (v("BP-03") ?? 0), "TOT-01 = somme BP");
    near(v("TOT-02"), (v("BE-01") ?? 0) + (v("BE-02") ?? 0) + (v("BE-03") ?? 0), "TOT-02 = somme BE");
    near(v("TOT-03"), 14.204, "TOT-03");
  });

  await test("G", "Volumes de terrassement", () => {
    const { v } = run();
    near(v("EV-01"), (v("TE-01") ?? 0) + (v("TE-02") ?? 0) + (v("TE-03") ?? 0), "EV-01 = somme TE");
    expectAll(v, { "EV-04": 0, "EV-05": -30.98 });
  });

  await test("H", "Déblais foisonnés et réemploi", () => {
    near(run().v("EV-02"), 56.48, "EV-02");
    near(run({ "deblais.foisonnement": 1.3 }).v("EV-02"), 58.7392, "EV-02 foisonnement 1,3");
    expectAll(run({ "deblais.taux_reemploi": 0.65 }).v, {
      "EV-03": 19.768, "EV-04": 29.3696, "EV-05": -1.6104, "LOG-01": 2,
    });
  });

  await test("I", "Statuts des données (rôle, nature, provenance, arrondi)", () => {
    const line = (c: string) => C01.lines.find((l) => l.code === c)!;
    assert.equal(line("RE-01").role, "indicator", "RE-01 doit rester un indicateur");
    assert.equal(line("EV-02").nature, "foisonne");
    assert.equal(line("TE-01").nature, "en_place");
    const { r } = run({ "sf1.longueur": 76 });
    const s = summarizeBases(r.nodes.get("TE-01")!.bases);
    assert.ok(s.manual.includes("sf1.longueur"), "saisie manuelle tracée");
    assert.ok(s.hypotheses.length + s.toVerify.length > 0, "TE-01 dépend d'une hypothèse ou d'un relevé à vérifier");
    const raw = run().v("TE-01")!;
    assert.equal(formatQty(raw), "36,48");
    assert.notEqual(raw, 36.48, "la précision interne est conservée (arrondi d'affichage uniquement)");
    const j = JSON.parse(NEW_RAW);
    j.parameters[0].provenance = "RELEVE";
    delete j.parameters[0].source_ref;
    delete j.parameters[0].evidence;
    const d = parsePrepBundle(j);
    assert.ok(d.ok);
    assert.equal(d.bundle.parameters[0].provenance, "RELEVE_A_VERIFIER", "RELEVE sans preuve rétrogradé");
  });

  await test("K", "JSON invalides refusés sans effet", () => {
    const refuse = (raw: string, why: string) => {
      const r = parsePrepJsonText(raw);
      assert.equal(r.ok, false, `devait être refusé : ${why}`);
    };
    refuse("pas du json", "texte");
    refuse("[]", "tableau");
    refuse(JSON.stringify({ format: "inconnu" }), "format inconnu");
    refuse(JSON.stringify({ format: "bework_quote_v1" }), "format devis");
    type RawBundle = { takeoff: { items: Record<string, unknown>[] }; parameters: Record<string, unknown>[] };
    const mutate = (fn: (j: RawBundle) => void) => {
      const j = JSON.parse(NEW_RAW);
      fn(j);
      return JSON.stringify(j);
    };
    refuse(mutate((j) => (j.takeoff.items[0].formula = "sf1.inexistant * 2")), "référence inconnue");
    refuse(
      mutate((j) => {
        j.parameters.push({ key: "boucle.a", label: "a", unit: "u", formula: "boucle.b", provenance: "HYPOTHESE" });
        j.parameters.push({ key: "boucle.b", label: "b", unit: "u", formula: "boucle.a", provenance: "HYPOTHESE" });
      }),
      "dépendance circulaire",
    );
    refuse(mutate((j) => (j.takeoff.items[0].formula = "process.exit(1)")), "code arbitraire");
    refuse(mutate((j) => j.takeoff.items.push({ ...j.takeoff.items[0] })), "référence de ligne en double");
    refuse("x".repeat(2 * 1024 * 1024 + 10), "fichier trop volumineux");

    const div = parsePrepJsonText(mutate((j) => (j.takeoff.items[0].formula = "sf1.longueur / (sf1.largeur - 0.5)")));
    assert.ok(div.ok, "division par zéro : import possible avec avertissement");
    assert.ok(div.issues.some((i) => /zéro/i.test(i.message)), "avertissement division par zéro");
    const r = computeStudy({ params: div.bundle.parameters, lines: div.bundle.lines });
    assert.match(r.nodes.get(div.bundle.lines[0].code)?.error ?? "", /zéro/);
    near(r.nodes.get("BE-01")?.value, 9.5, "les autres lignes restent calculées");
  });
}

async function dbTests() {
  const { prisma } = await import("../src/lib/prisma");
  const svc = await import("../src/lib/preparation/service");
  const ROLLBACK = new Error("__rollback__");
  const stamp = Date.now();

  await prisma
    .$transaction(
      async (tx) => {
        const mkOrg = async (tag: string, kind: "DEMO" | "STANDARD") => {
          const user = await tx.user.create({
            data: { email: `prep-test-${tag}-${stamp}@test.invalid`, password: "x", name: `Test ${tag}` },
          });
          const org = await tx.organization.create({ data: { name: `Test ${tag}`, ownerUserId: user.id, kind } });
          const project = await tx.project.create({
            data: { title: `Projet test ${tag}`, clientId: user.id, organizationId: org.id },
          });
          return { userId: user.id, orgId: org.id, projectId: project.id };
        };
        const A = await mkOrg("a", "DEMO");
        const B = await mkOrg("b", "STANDARD");

        await test("J", "Enregistrement, réouverture, modification, validation, annulation", async () => {
          const pv = await svc.previewPrepImport({ orgId: A.orgId, projectId: A.projectId, raw: NEW_RAW }, tx);
          assert.ok(pv.ok && !pv.preview.duplicate);
          const c = await svc.commitPrepImport({ orgId: A.orgId, projectId: A.projectId, userId: A.userId, raw: NEW_RAW }, tx);
          let view = (await svc.getPrepStudyView(A.orgId, c.studyId, tx))!;
          assert.equal(view.params.length, 28);
          assert.equal(view.version, 1);
          assert.ok(view.lastImport?.canUndo);
          const engine = computeStudy({ params: view.params, lines: view.lines });
          near(engine.nodes.get("TE-01")?.value, 36.48, "TE-01 après réouverture");

          const edit = await svc.savePrepStudyEdits(
            { orgId: A.orgId, studyId: c.studyId, userId: A.userId, expectedVersion: 1, params: [{ key: "fouille.profondeur_commune", value: 0.9 }] },
            tx,
          );
          assert.ok(edit.impacted >= 7);
          view = (await svc.getPrepStudyView(A.orgId, c.studyId, tx))!;
          const row = await tx.prepTakeoffLine.findFirstOrThrow({ where: { studyId: c.studyId, code: "TE-01" } });
          near(Number(row.computedQuantity), 41.04, "TE-01 stocké");
          const p = view.params.find((x) => x.key === "fouille.profondeur_commune")!;
          assert.equal(p.provenance, "SAISIE_MANUELLE");
          assert.equal(p.originalValue, 0.8);

          await assert.rejects(
            svc.savePrepStudyEdits(
              { orgId: A.orgId, studyId: c.studyId, userId: A.userId, expectedVersion: 1, params: [{ key: "s1.nombre", value: 9 }] },
              tx,
            ),
            /modifiée entre-temps/,
          );
          await assert.rejects(
            svc.setPrepLinesValidation(
              { orgId: A.orgId, studyId: c.studyId, userId: A.userId, expectedVersion: 2, codes: ["RE-01"], validated: true },
              tx,
            ),
            /indicateur/,
          );
          await svc.setPrepLinesValidation(
            { orgId: A.orgId, studyId: c.studyId, userId: A.userId, expectedVersion: 2, codes: ["TE-01"], validated: true },
            tx,
          );
          await assert.rejects(svc.undoLastPrepImport({ orgId: A.orgId, studyId: c.studyId, userId: A.userId }, tx), /modifications/);

          await assert.rejects(
            svc.commitPrepImport({ orgId: A.orgId, projectId: A.projectId, userId: A.userId, raw: NEW_RAW }, tx),
            /déjà été importé/,
          );
          const c2 = await svc.commitPrepImport(
            { orgId: A.orgId, projectId: A.projectId, userId: A.userId, raw: LEGACY_RAW },
            tx,
          );
          const undo = await svc.undoLastPrepImport({ orgId: A.orgId, studyId: c2.studyId, userId: A.userId }, tx);
          assert.equal(undo.action, "archived");
          assert.equal(await svc.getPrepStudyView(A.orgId, c2.studyId, tx), null);
          const list = await svc.listPrepStudies(A.orgId, { projectId: A.projectId }, tx);
          assert.deepEqual(list.map((s) => s.id), [c.studyId]);
        });

        await test("K-db", "JSON invalide : aucune donnée créée ni modifiée", async () => {
          const before = await tx.prepStudy.count({ where: { organizationId: A.orgId } });
          await assert.rejects(
            svc.commitPrepImport({ orgId: A.orgId, projectId: A.projectId, userId: A.userId, raw: "{ invalide" }, tx),
            /erreurs bloquantes/,
          );
          assert.equal(await tx.prepStudy.count({ where: { organizationId: A.orgId } }), before);
        });

        await test("L", "Isolation entre organisations", async () => {
          const [study] = await svc.listPrepStudies(A.orgId, {}, tx);
          assert.ok(study);
          assert.equal(await svc.getPrepStudyView(B.orgId, study.id, tx), null);
          assert.equal((await svc.listPrepStudies(B.orgId, {}, tx)).length, 0);
          await assert.rejects(
            svc.savePrepStudyEdits(
              { orgId: B.orgId, studyId: study.id, userId: B.userId, expectedVersion: study.version, params: [{ key: "s1.nombre", value: 1 }] },
              tx,
            ),
            /introuvable/,
          );
          await assert.rejects(svc.undoLastPrepImport({ orgId: B.orgId, studyId: study.id, userId: B.userId }, tx), /introuvable/);
          await assert.rejects(
            svc.commitPrepImport({ orgId: B.orgId, projectId: A.projectId, userId: B.userId, raw: NEW_RAW }, tx),
            /Projet introuvable/,
          );
          const pv = await svc.previewPrepImport({ orgId: B.orgId, projectId: B.projectId, raw: NEW_RAW }, tx);
          assert.ok(pv.ok && !pv.preview.duplicate, "l'empreinte anti-doublon est propre à chaque organisation");
          assert.ok(pv.ok && pv.preview.issues.some((i) => /organisation standard/.test(i.message)));
        });

        throw ROLLBACK;
      },
      { timeout: 120_000, maxWait: 20_000 },
    )
    .catch((e) => {
      if (e !== ROLLBACK) throw e;
    });

  await test("ROLLBACK", "Aucune donnée de test conservée après annulation", async () => {
    const users = await prisma.user.count({ where: { email: { endsWith: `-${stamp}@test.invalid` } } });
    assert.equal(users, 0, "utilisateurs de test restants");
    assert.equal(await prisma.organization.count({ where: { name: { in: ["Test a", "Test b"] } } }), 0);
    assert.equal(await prisma.prepStudy.count(), 0, "études restantes");
    assert.equal(await prisma.prepImport.count(), 0, "imports restants");
  });
  await prisma.$disconnect();
}

async function main() {
  await pureTests();
  if (process.env.PREP_DB_TESTS === "1") await dbTests();
  for (const r of results) {
    console.log(`${r.ok ? "OK  " : "ÉCHEC"} ${r.id.padEnd(5)} ${r.label}${r.detail ? `\n       → ${r.detail}` : ""}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} réussis${process.env.PREP_DB_TESTS === "1" ? "" : " (tests base J/K-db/L non lancés)"}`);
  process.exit(failed ? 1 : 0);
}

void main();
