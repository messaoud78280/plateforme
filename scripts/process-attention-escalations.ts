/**
 * W3-C2A — Déclenchement manuel rappels / escalades (script local).
 * Pour la prod planifiée : utiliser notifications:run-attention-escalations (cron secret).
 *
 * Usage :
 *   npx tsx scripts/process-attention-escalations.ts
 *   npx tsx scripts/process-attention-escalations.ts --now=2026-08-10T10:00:00.000Z
 *   npx tsx scripts/process-attention-escalations.ts --owner=<userId> --org=<orgId>
 */
import { processAttentionEscalations } from "../src/lib/follow-up/attention/process-escalations";
import { resolveAttentionProcessNow } from "../src/lib/follow-up/attention/resolve-now";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

async function main() {
  const nowRaw = arg("now");
  const resolved = resolveAttentionProcessNow({
    requestedNow: nowRaw,
    // Script CLI : simulation autorisée hors production stricte
    forceRealNow: false,
  });
  if (nowRaw && resolved.rejectedSimulation) {
    console.error(
      "Simulation --now refusée en production. Utilisez démo/dev ou ATTENTION_ALLOW_SIMULATED_NOW=true.",
    );
    process.exit(1);
  }
  if (nowRaw && Number.isNaN(new Date(nowRaw).getTime())) {
    console.error("now invalide");
    process.exit(1);
  }

  const org = arg("org");
  const result = await processAttentionEscalations({
    now: resolved.now,
    ownerUserId: arg("owner"),
    ...(org !== undefined ? { organizationId: org } : {}),
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        now: resolved.now.toISOString(),
        simulatedNow: resolved.simulated,
        ...result,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
