/**
 * Déclenche les relances automatiques (pièces manquantes + échéances proches).
 * Usage : npx tsx scripts/run-relances.ts
 * Requiert RELANCES_CRON_SECRET et NEXT_PUBLIC_SITE_URL (ou SITE_URL) en env.
 * À planifier (Railway Cron Job, GitHub Actions…) toutes les 24h par exemple.
 */
import { loadScriptEnv } from "./load-script-env";

async function main() {
  loadScriptEnv();
  const secret = process.env.RELANCES_CRON_SECRET;
  const base = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.bework.fr").replace(/\/$/, "");

  if (!secret) {
    console.error("RELANCES_CRON_SECRET manquant — abandon.");
    process.exitCode = 1;
    return;
  }

  const res = await fetch(`${base}/api/cron/relances`, {
    method: "POST",
    headers: { "x-secret": secret },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Relances : échec HTTP", res.status, body);
    process.exitCode = 1;
    return;
  }

  console.info(
    `Relances — pièces manquantes: ${body.missingPieceNotified ?? 0}, échéances: ${body.deadlineNotified ?? 0}` +
      (body.errors?.length ? ` (erreurs: ${body.errors.length})` : "")
  );
  if (body.errors?.length) {
    console.error(body.errors);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
