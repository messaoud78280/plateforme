/**
 * Déclenche le scheduler attention (rappels / escalades) via l’endpoint cron.
 *
 * Usage :
 *   npx tsx scripts/run-attention-escalations.ts
 *
 * Requiert ATTENTION_CRON_SECRET et SITE_URL (ou NEXT_PUBLIC_SITE_URL).
 * À planifier toutes les heures (Railway Cron Job).
 */
import { loadScriptEnv } from "./load-script-env";

async function main() {
  loadScriptEnv();
  const secret = process.env.ATTENTION_CRON_SECRET;
  const base = (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.bework.fr"
  ).replace(/\/$/, "");

  if (!secret) {
    console.error("ATTENTION_CRON_SECRET manquant — abandon.");
    process.exitCode = 1;
    return;
  }

  const res = await fetch(`${base}/api/cron/attention-escalations`, {
    method: "POST",
    headers: {
      "x-secret": secret,
      "content-type": "application/json",
    },
    body: "{}",
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Attention escalations : échec HTTP", res.status, body);
    process.exitCode = 1;
    return;
  }

  console.info(
    `Attention scheduler — processed: ${body.processed ?? 0}, created: ${body.notificationsCreated ?? 0}, reminders: ${body.remindersCreated ?? 0}, escalations: ${body.escalationsCreated ?? 0}` +
      (body.errors ? ` (errors: ${body.errors})` : ""),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
