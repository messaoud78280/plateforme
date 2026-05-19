/**
 * Harmonisation lots / familyCode en production via API Supabase (service role).
 * Usage : NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/run-remote-harmonization.ts [--apply]
 */
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();
import { createClient } from "@supabase/supabase-js";
import {
  normalizeWorkItemLotFields,
  workItemLotNeedsNormalization,
} from "../src/lib/bework-devis-lot-normalize";

const apply = process.argv.includes("--apply");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  (process.env.SUPABASE_URL?.replace(/\/$/, "") || "https://jaxgjtryrnlyelniisrf.supabase.co");

if (!key) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY requis (.env.local)");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

type Row = {
  id: string;
  lot: string;
  subLot: string | null;
  family: string | null;
  familyCode: string | null;
  title: string;
  shortDescription: string | null;
  fullDescription: string | null;
  itemType: string;
};

async function fetchAllWorkItems(): Promise<Row[]> {
  const pageSize = 500;
  const rows: Row[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("WorkItem")
      .select("id, lot, subLot, family, familyCode, title, shortDescription, fullDescription, itemType")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const r of data) {
      rows.push({
        id: r.id,
        lot: r.lot,
        subLot: r.subLot,
        family: r.family,
        familyCode: r.familyCode,
        title: r.title,
        shortDescription: r.shortDescription,
        fullDescription: r.fullDescription?.slice(0, 320) ?? null,
        itemType: r.itemType,
      });
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function main() {
  console.log(apply ? "🔄 Harmonisation (écriture)…" : "ℹ️  Simulation harmonisation…");
  const items = await fetchAllWorkItems();
  console.log(`   ${items.length} ouvrages chargés`);

  let workItemsUpdated = 0;
  let quoteLinesUpdated = 0;
  const garBefore = items.filter((i) => i.familyCode === "GAR").length;

  for (const item of items) {
    if (
      !workItemLotNeedsNormalization({
        lot: item.lot,
        subLot: item.subLot,
        family: item.family,
        familyCode: item.familyCode,
        title: item.title,
        shortDescription: item.shortDescription,
        fullDescription: item.fullDescription,
        itemType: item.itemType,
      })
    ) {
      continue;
    }

    const n = normalizeWorkItemLotFields({
      lot: item.lot,
      subLot: item.subLot,
      family: item.family,
      familyCode: item.familyCode,
      title: item.title,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      itemType: item.itemType,
    });

    if (!apply) {
      workItemsUpdated += 1;
      continue;
    }

    const { error: wiErr } = await supabase
      .from("WorkItem")
      .update({ lot: n.lot, subLot: n.subLot, familyCode: n.familyCode })
      .eq("id", item.id);

    if (wiErr) throw wiErr;
    workItemsUpdated += 1;

    const { data: ql, error: qlErr } = await supabase
      .from("QuoteLine")
      .update({ lot: n.lot, family: n.subLot })
      .eq("workItemId", item.id)
      .select("id");

    if (qlErr) throw qlErr;
    quoteLinesUpdated += ql?.length ?? 0;
  }

  const garAfter = apply
    ? (
        await supabase.from("WorkItem").select("id", { count: "exact", head: true }).eq("familyCode", "GAR")
      ).count ?? "?"
    : "— (simulation)";

  console.log(apply ? "✅ Harmonisation terminée" : "✅ Simulation terminée");
  console.log(`   Ouvrages harmonisés : ${workItemsUpdated}`);
  if (apply) {
    console.log(`   Lignes de devis mises à jour : ${quoteLinesUpdated}`);
    console.log(`   GAR avant : ${garBefore} → après : ${garAfter}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
