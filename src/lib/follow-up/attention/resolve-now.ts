/**
 * W3-C2B — Résolution sécurisée de `now` pour rappels / escalades.
 * La simulation temporelle reste utile en démo / dev / tests.
 * En production réelle, le job et les admins métier utilisent l’horloge serveur.
 */

export type ResolveAttentionNowInput = {
  requestedNow?: Date | string | null;
  /** Cron / scheduler : toujours l’heure réelle. */
  forceRealNow?: boolean;
  isDemoSession?: boolean;
  nodeEnv?: string;
  beworkEnv?: string | null;
  allowSimulatedFlag?: string | null;
};

export type ResolveAttentionNowResult = {
  now: Date;
  simulated: boolean;
  /** true si un now a été fourni mais rejeté (prod). */
  rejectedSimulation: boolean;
};

export function canSimulateAttentionNow(opts: {
  forceRealNow?: boolean;
  isDemoSession?: boolean;
  nodeEnv?: string;
  beworkEnv?: string | null;
  allowSimulatedFlag?: string | null;
}): boolean {
  if (opts.forceRealNow) return false;

  const flag = (opts.allowSimulatedFlag ?? process.env.ATTENTION_ALLOW_SIMULATED_NOW ?? "")
    .trim()
    .toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;

  const nodeEnv = opts.nodeEnv ?? process.env.NODE_ENV ?? "";
  if (nodeEnv === "development" || nodeEnv === "test") return true;

  if (opts.isDemoSession) return true;

  const bework = (opts.beworkEnv ?? process.env.NEXT_PUBLIC_BEWORK_ENV ?? "")
    .trim()
    .toLowerCase();
  if (bework === "demo" || bework === "sandbox") return true;

  return false;
}

export function resolveAttentionProcessNow(
  input: ResolveAttentionNowInput = {},
): ResolveAttentionNowResult {
  const real = new Date();
  if (input.requestedNow == null || input.requestedNow === "") {
    return { now: real, simulated: false, rejectedSimulation: false };
  }

  const parsed =
    input.requestedNow instanceof Date
      ? input.requestedNow
      : new Date(input.requestedNow);
  if (Number.isNaN(parsed.getTime())) {
    return { now: real, simulated: false, rejectedSimulation: true };
  }

  if (
    !canSimulateAttentionNow({
      forceRealNow: input.forceRealNow,
      isDemoSession: input.isDemoSession,
      nodeEnv: input.nodeEnv,
      beworkEnv: input.beworkEnv,
      allowSimulatedFlag: input.allowSimulatedFlag,
    })
  ) {
    return { now: real, simulated: false, rejectedSimulation: true };
  }

  return { now: parsed, simulated: true, rejectedSimulation: false };
}
