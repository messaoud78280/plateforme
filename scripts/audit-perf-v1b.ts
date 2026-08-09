/**
 * PERF-V1B audit code + garde-fous.
 * Run: npx tsx scripts/audit-perf-v1b.ts
 *
 * Mesures runtime collectATraiter : uniquement si DATABASE_URL + session (hors Cursor).
 */
import fs from "node:fs";
import path from "node:path";

let failed = 0;
function ok(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else console.log("OK:", msg);
}

const collect = fs.readFileSync("src/lib/a-traiter/collect.ts", "utf8");
ok(collect.includes("countOnly"), "countATraiter via countOnly");
ok(collect.includes("collectHotCountBuckets"), "buckets SQL hot pour badge");

const bus = fs.readFileSync("src/lib/perf/messagerie-unread-bus.ts", "utf8");
ok(bus.includes("broadcastReady"), "Broadcast = chemin principal");
ok(bus.includes("stopSse"), "SSE coupé quand Broadcast SUBSCRIBED");
ok(bus.includes("seenEventKeys") || bus.includes("eventKey"), "dédup événements");
ok(bus.includes("90_000") || bus.includes("FALLBACK_POLL_MS"), "poll fallback rare");
ok(bus.includes("attachMessagerieRealtime"), "subscription Broadcast unique");
ok(bus.includes("EventSource"), "SSE secours présent");

const countRoute = fs.readFileSync("src/app/api/a-traiter/count/route.ts", "utf8");
ok(countRoute.includes("capped"), "API count expose capped");
ok(collect.includes("attentionCapped") || collect.includes("capped"), "attention plafonnée signalée");
ok(collect.includes("200"), "échantillon attention badge ≥ 200");

ok(fs.existsSync("src/app/api/messagerie/live/route.ts"), "route SSE live");
ok(
  fs.readFileSync("src/components/messagerie/MessagerieMissionsView.tsx", "utf8").includes("dynamic("),
  "lazy MessageBeworkActions / Dossier",
);
ok(
  fs
    .readFileSync("src/app/api/tasks/[id]/messages/route.ts", "utf8")
    .includes("broadcastMessagerieToUser"),
  "broadcast après envoi mission",
);
ok(
  !fs
    .readFileSync("src/components/chantier/ChantierStatusSelect.tsx", "utf8")
    .includes("router.refresh"),
  "ChantierStatusSelect sans refresh",
);
ok(fs.existsSync("prisma/migrations/add-perf-v1b-indexes.sql"), "SQL indexes V1B");

const cmd = fs.readFileSync("src/app/dashboard/commandes/page.tsx", "utf8");
ok(cmd.includes("take: 80") && cmd.includes("select:"), "commandes liste select léger");

console.log(`
Mesures navigateur 2 utilisateurs (Thomas → Karim) :
à faire manuellement sur environnement déployé — non exécutable ici sans sessions.

Mesures serveur collectATraiter :
activer BEWORK_PERF_LOG=1 en local → logs [perf] collectATraiter:count / :light / page
`);

if (failed) process.exit(1);
console.log("Audit PERF-V1B OK");
