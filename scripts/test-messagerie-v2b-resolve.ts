/**
 * Tests MESSAGERIE-V2B — résolution d’URL sans doublon.
 * Run: npx tsx scripts/test-messagerie-v2b-resolve.ts
 */
import {
  projectClientHref,
  projectSupplierHref,
  projectTeamHref,
  resolveConversationForContext,
  resolveConversationHref,
} from "../src/lib/messagerie/resolve-conversation";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

const pid = "proj-vh";

assert(
  projectTeamHref(pid) ===
    "/dashboard/messagerie?view=chantiers&project=proj-vh&channel=INTERNE",
  "équipe → canal INTERNE unique",
);
assert(
  projectClientHref(pid) ===
    "/dashboard/messagerie?view=chantiers&project=proj-vh&channel=CLIENT",
  "client → canal CLIENT unique",
);
assert(
  projectSupplierHref(pid) ===
    "/dashboard/messagerie?view=chantiers&project=proj-vh&channel=FOURNISSEUR",
  "fournisseur → canal FOURNISSEUR unique",
);

const po = resolveConversationForContext({
  kind: "purchase_order",
  projectId: pid,
  supplierName: "Point.P",
});
assert(
  po === "/dashboard/messagerie?view=chantiers&project=proj-vh&channel=FOURNISSEUR",
  "commande Point.P → même fil FOURNISSEUR (pas de doublon)",
);

const fu = resolveConversationHref({ kind: "follow_up", projectId: pid });
assert(
  fu === "/dashboard/messagerie?view=chantiers&project=proj-vh&channel=INTERNE",
  "fiche suivi → INTERNE chantier",
);

const task = resolveConversationHref({ kind: "task", taskId: "t1", messageId: "m1" });
assert(task.includes("task=t1") && task.includes("messageId=m1"), "mission + messageId");

const direct = resolveConversationHref({ kind: "direct", userId: "u2" });
assert(direct.includes("with=u2") && !direct.includes("tab="), "direct → ?with= (sans tab générique)");

if (failed > 0) {
  console.error(`\n${failed} test(s) échoué(s)`);
  process.exit(1);
}
console.log("\nTous les tests MESSAGERIE-V2B resolve OK");
