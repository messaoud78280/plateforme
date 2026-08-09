/**
 * PERF-V1A — inventaire statique des parcours (pas de chiffres inventés).
 * Run: npx tsx scripts/audit-perf-v1a.ts
 *
 * Les timings « avant/après » mesurés en prod nécessitent un navigateur connecté.
 * Ce script vérifie les garde-fous code.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src");

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, acc);
    } else if (/\.(tsx|ts)$/.test(name)) acc.push(p);
  }
  return acc;
}

const files = walk(root);
let locationHref = 0;
let routerRefresh = 0;
const hotRefresh: string[] = [];

for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const rel = path.relative(process.cwd(), f);
  const loc = (text.match(/window\.location\.href\s*=/g) || []).length;
  const ref = (text.match(/router\.refresh\(/g) || []).length;
  locationHref += loc;
  routerRefresh += ref;
  if (
    ref > 0 &&
    /follow-up\/FollowUpDetailClient|purchase-orders\/PurchaseOrderDetailClient|MessagerieHeaderShortcut|MobileBottomNav|MessagerieNavBadge/.test(
      rel,
    )
  ) {
    hotRefresh.push(`${rel}: ${ref}`);
  }
}

const checks = [
  {
    ok: fs.existsSync("src/lib/perf/messagerie-unread-bus.ts"),
    msg: "bus unread messagerie partagé",
  },
  {
    ok: fs.existsSync("src/components/dashboard/PrefetchMainRoutes.tsx"),
    msg: "prefetch pages principales",
  },
  {
    ok: !fs
      .readFileSync("src/components/follow-up/FollowUpDetailClient.tsx", "utf8")
      .includes("router.refresh("),
    msg: "FollowUpDetailClient sans router.refresh",
  },
  {
    ok: !fs
      .readFileSync(
        "src/components/purchase-orders/PurchaseOrderDetailClient.tsx",
        "utf8",
      )
      .includes("router.refresh("),
    msg: "PurchaseOrderDetailClient sans router.refresh",
  },
  {
    ok: !fs
      .readFileSync("src/components/messagerie/MessagerieMissionsView.tsx", "utf8")
      .includes("window.location.href"),
    msg: "Messagerie sans window.location.href filtre",
  },
  {
    ok: !fs
      .readFileSync("src/components/planning/PlanningBoard.tsx", "utf8")
      .includes("linked=1"),
    msg: "Planning sans linked=1",
  },
  {
    ok: fs
      .readFileSync("src/app/dashboard/a-traiter/page.tsx", "utf8")
      .includes("getCachedServerSession"),
    msg: "À traiter session cachée",
  },
];

let failed = 0;
for (const c of checks) {
  if (!c.ok) {
    console.error("FAIL:", c.msg);
    failed += 1;
  } else {
    console.log("OK:", c.msg);
  }
}

console.log("\nInventaire code:");
console.log(`- window.location.href = : ${locationHref} occurrence(s)`);
console.log(`- router.refresh() : ${routerRefresh} occurrence(s)`);
if (hotRefresh.length) {
  console.log("- refresh encore dans zones ciblées:", hotRefresh.join(", "));
  failed += 1;
} else {
  console.log("- zones chaudes FollowUp / Commande : sans refresh");
}

console.log(`
Parcours à mesurer en navigateur (Network + Performance) :
1. Accueil → À traiter
2. À traiter → fiche
3. Accueil → Planning
4. Planning → Agenda
5. Agenda → Commandes
6. Commandes → Messagerie

Attendu après PERF-V1A :
- clic sidebar : feedback pending immédiat
- skeleton loading.tsx sans spinner plein écran
- 1 poll unread messagerie partagé (pas 3–4)
- pas de full reload Messagerie filtre Fournisseurs
`);

if (failed) process.exit(1);
console.log("Audit PERF-V1A OK");
