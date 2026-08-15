/**
 * ECO-3 — devis accepté → budget chantier automatique.
 * npx tsx scripts/test-eco3-auto-budget.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { decideProjectBudgetAutoInit } from "../src/lib/chantier/try-initialize-project-budget";

function testAcceptedCreates() {
  assert.equal(
    decideProjectBudgetAutoInit({
      quoteStatus: "ACCEPTED",
      projectId: "prj",
      budgetExists: false,
    }),
    "INIT",
  );
  console.log("OK: devis accepté sans budget → INIT");
}

function testReplayNoSecondBudget() {
  assert.equal(
    decideProjectBudgetAutoInit({
      quoteStatus: "ACCEPTED",
      projectId: "prj",
      budgetExists: true,
    }),
    "ALREADY_EXISTS",
  );
  console.log("OK: acceptation rejouée / budget existant → pas de 2ᵉ budget");
}

function testExistingNotOverwritten() {
  assert.equal(
    decideProjectBudgetAutoInit({
      quoteStatus: "ACCEPTED",
      projectId: "prj",
      budgetExists: true,
    }),
    "ALREADY_EXISTS",
  );
  console.log("OK: budget existant (y compris modifié) → non écrasé");
}

function testDraft() {
  assert.equal(
    decideProjectBudgetAutoInit({
      quoteStatus: "DRAFT",
      projectId: "prj",
      budgetExists: false,
    }),
    "SKIP_NOT_ACCEPTED",
  );
  console.log("OK: DRAFT → aucun budget");
}

function testSent() {
  for (const status of ["SENT", "TO_VALIDATE", "VALIDATED", "REFUSED", "EXPIRED", "CANCELLED"]) {
    assert.equal(
      decideProjectBudgetAutoInit({
        quoteStatus: status,
        projectId: "prj",
        budgetExists: false,
      }),
      "SKIP_NOT_ACCEPTED",
      status,
    );
  }
  console.log("OK: SENT / non accepté → aucun budget");
}

function testNoProject() {
  assert.equal(
    decideProjectBudgetAutoInit({
      quoteStatus: "ACCEPTED",
      projectId: null,
      budgetExists: false,
    }),
    "SKIP_NO_PROJECT",
  );
  console.log("OK: ACCEPTED sans chantier → pas de faux budget");
}

function testSameServiceAsManual() {
  const wrapper = readFileSync(
    join(process.cwd(), "src/lib/chantier/try-initialize-project-budget.ts"),
    "utf8",
  );
  const accept = readFileSync(
    join(process.cwd(), "src/lib/commercial/accepted-snapshot.ts"),
    "utf8",
  );
  const init = readFileSync(
    join(process.cwd(), "src/lib/chantier/project-profitability.ts"),
    "utf8",
  );
  assert.ok(wrapper.includes("initializeProjectBudget("));
  assert.ok(!wrapper.includes("buildBudgetBreakdownFromQuoteLines"));
  assert.ok(accept.includes("tryInitializeProjectBudgetAfterAccept"));
  assert.ok(init.includes("Idempotent : refuse si un budget existe déjà"));
  assert.ok(init.includes("sourceQuoteId"));
  console.log("OK: auto-init = initializeProjectBudget (pas de 2ᵉ formule)");
}

function testHookOrder() {
  const accept = readFileSync(
    join(process.cwd(), "src/lib/commercial/accepted-snapshot.ts"),
    "utf8",
  );
  const acceptIdx = accept.indexOf("transitionQuoteStatus");
  const budgetIdx = accept.indexOf("tryBudgetAfterAccept");
  assert.ok(acceptIdx >= 0 && budgetIdx > acceptIdx);
  console.log("OK: ordre acceptation puis budget");
}

function testUniqueConstraint() {
  const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
  const block = schema.slice(
    schema.indexOf("model ProjectBudget"),
    schema.indexOf("enum SupplierInvoiceStatus"),
  );
  assert.ok(block.includes("projectId          String   @unique"));
  console.log("OK: concurrence — un ProjectBudget par chantier (contrainte existante)");
}

testAcceptedCreates();
testReplayNoSecondBudget();
testExistingNotOverwritten();
testDraft();
testSent();
testNoProject();
testSameServiceAsManual();
testHookOrder();
testUniqueConstraint();
console.log("\nECO-3 unitaires OK");
