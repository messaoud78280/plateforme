/**
 * Identité d’environnement — bandeau discret, palette principale inchangée.
 */

export type BeWorkEnvironment =
  | "production"
  | "staging"
  | "development"
  | "demo"
  | "sandbox"
  | "prospect";

export type EnvIdentity = {
  id: BeWorkEnvironment;
  label: string;
  short: string;
  tone: "neutral" | "watch" | "intel" | "critical" | "ok";
  showBanner: boolean;
};

const ENV_MAP: Record<BeWorkEnvironment, EnvIdentity> = {
  production: {
    id: "production",
    label: "Production",
    short: "Prod",
    tone: "neutral",
    showBanner: false,
  },
  staging: {
    id: "staging",
    label: "Préproduction",
    short: "Préprod",
    tone: "watch",
    showBanner: true,
  },
  development: {
    id: "development",
    label: "Développement",
    short: "Dev",
    tone: "intel",
    showBanner: true,
  },
  demo: {
    id: "demo",
    label: "Démonstration commerciale",
    short: "Démo",
    tone: "watch",
    showBanner: true,
  },
  sandbox: {
    id: "sandbox",
    label: "Bac à sable",
    short: "Sandbox",
    tone: "intel",
    showBanner: true,
  },
  prospect: {
    id: "prospect",
    label: "Espace prospect",
    short: "Prospect",
    tone: "watch",
    showBanner: true,
  },
};

export function resolveBeWorkEnvironment(override?: string | null): BeWorkEnvironment {
  const raw = (override || process.env.NEXT_PUBLIC_BEWORK_ENV || "").trim().toLowerCase();
  if (raw && raw in ENV_MAP) return raw as BeWorkEnvironment;
  if (process.env.NODE_ENV === "development") return "development";
  if (process.env.VERCEL_ENV === "preview") return "staging";
  return "production";
}

export function getEnvironmentIdentity(env?: BeWorkEnvironment): EnvIdentity {
  return ENV_MAP[env ?? resolveBeWorkEnvironment()];
}
