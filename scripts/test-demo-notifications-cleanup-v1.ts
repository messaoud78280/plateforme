/**
 * DEMO-NOTIFICATIONS-CLEANUP-V1 — helpers purs + smoke DB DEMO.
 * Run: npx tsx scripts/test-demo-notifications-cleanup-v1.ts
 * Avec --apply : exécute le cleanup sur tous les DemoEnvironment actifs.
 */
import {
  cleanupAllDemoMessagerieNotificationHrefs,
  isGenericMessagerieHref,
} from "../src/lib/demo-environment/cleanup-messagerie-notification-hrefs";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

assert(isGenericMessagerieHref("/dashboard/messagerie"), "liste nue = générique");
assert(
  isGenericMessagerieHref("/dashboard/messagerie?tab=messages-directs"),
  "tab directs sans with = générique",
);
assert(
  !isGenericMessagerieHref("/dashboard/messagerie?with=user-julie"),
  "?with= = précis",
);
assert(
  !isGenericMessagerieHref("/dashboard/messagerie?task=t1&messageId=m1"),
  "?task= = précis",
);
assert(
  !isGenericMessagerieHref(
    "/dashboard/messagerie?view=chantiers&project=p1&channelId=c1",
  ),
  "channelId = précis",
);
assert(
  !isGenericMessagerieHref(
    "/dashboard/messagerie?view=chantiers&project=p1&channel=FOURNISSEUR",
  ),
  "project+channel legacy = acceptable",
);
assert(!isGenericMessagerieHref("/dashboard/commandes/x"), "hors messagerie");
assert(!isGenericMessagerieHref(null), "null");

if (failed > 0) {
  console.error(`\n${failed} test(s) helper échoué(s)`);
  process.exit(1);
}

async function main() {
  const apply = process.argv.includes("--apply");
  if (apply) {
    console.log("\n→ Cleanup DEMO (tous les DemoEnvironment non archivés)…");
    const results = await cleanupAllDemoMessagerieNotificationHrefs();
    for (const r of results) {
      console.log(
        `  ${r.companyName} (${r.demoId}): generic=${r.genericFound} rewritten=${r.rewritten} deleted=${r.deleted} alertsDeleted=${r.alertsDeleted} scanned=${r.scanned}`,
      );
    }
    console.log(`\n${results.length} environnement(s) traité(s)`);
  } else {
    console.log("\n(Helpers OK — passez --apply pour nettoyer la DB DEMO)");
  }
  console.log("\nTous les tests DEMO-NOTIFICATIONS-CLEANUP-V1 OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
