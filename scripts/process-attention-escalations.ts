/**
 * W3-C2A — Déclenchement manuel rappels / escalades (pas de cron).
 *
 * Usage :
 *   npx tsx scripts/process-attention-escalations.ts
 *   npx tsx scripts/process-attention-escalations.ts --now=2026-08-10T10:00:00.000Z
 *   npx tsx scripts/process-attention-escalations.ts --owner=<userId> --org=<orgId>
 */
import { processAttentionEscalations } from "../src/lib/follow-up/attention/process-escalations";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

async function main() {
  const nowRaw = arg("now");
  const now = nowRaw ? new Date(nowRaw) : undefined;
  if (nowRaw && now && Number.isNaN(now.getTime())) {
    console.error("now invalide");
    process.exit(1);
  }

  const result = await processAttentionEscalations({
    now,
    ownerUserId: arg("owner"),
    organizationId: arg("org") ?? undefined,
  });

  console.log(JSON.stringify({ ok: true, now: now?.toISOString() ?? "system", ...result }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
