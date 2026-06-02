"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { safeTeamLoginRedirect } from "@/lib/auth-team-login";
import { isManager, isAgentRole, isClient } from "@/types";

export type ConnexionGate = "gerante" | "agents" | "clients";

const GATE_CONFIG: Record<
  ConnexionGate,
  { badge: string; title: string; description: string; allowed: (role: string) => boolean; errorMessage: string }
> = {
  gerante: {
    badge: "Connexion gérant",
    title: "Espace Gérante / Managers",
    description: "Connectez-vous pour accéder à l’espace de gestion.",
    allowed: isManager,
    errorMessage:
      "Cet espace est réservé à la gérante et aux managers. Utilisez l’accès Gérante ou connectez-vous avec un compte autorisé.",
  },
  agents: {
    badge: "Connexion agent",
    title: "Espace Agents",
    description: "Connectez-vous pour accéder à votre espace agent.",
    allowed: isAgentRole,
    errorMessage: "Cet espace est réservé aux agents. Utilisez l’accès Agents ou connectez-vous avec un compte agent.",
  },
  clients: {
    badge: "Connexion client",
    title: "Espace Clients",
    description: "Connectez-vous pour accéder à votre espace client.",
    allowed: isClient,
    errorMessage: "Cet espace est réservé aux clients. Utilisez l’accès Clients ou connectez-vous avec un compte client.",
  },
};

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-black";

const fieldClass =
  "w-full rounded-lg border border-[#b8c4d4]/90 bg-gradient-to-b from-white to-[#f4f7fb] px-4 py-2.5 text-[0.9375rem] font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:font-normal placeholder:text-[#94a3b8] focus:border-[#3b82f6]/65 focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_0_0_3px_rgba(59,130,246,0.18)]";

interface ConnexionFormByGateProps {
  gate: ConnexionGate;
}

const badgeClassByGate: Record<ConnexionGate, string> = {
  gerante:
    "bg-[color:var(--primary-50)] text-[color:var(--accent-700)] border-slate-200",
  agents:
    "bg-[color:var(--agent-50)] text-[color:var(--agent-700)] border-[#e9d5ff]",
  clients:
    "bg-[color:var(--client-50)] text-[color:var(--client-700)] border-[#bbf7d0]",
};

const primaryButtonClassByGate: Record<ConnexionGate, string> = {
  gerante:
    "w-full rounded-xl border border-[color:var(--accent-600)]/70 bg-gradient-to-b from-[color:var(--accent-500)] via-[color:var(--accent-600)] to-[color:var(--accent-600)] px-4 py-3.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_18px_rgba(29,78,216,0.38)] transition hover:border-[color:var(--accent-500)] hover:from-[color:var(--accent-600)] hover:via-[color:var(--accent-700)] hover:to-[color:var(--accent-700)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_24px_rgba(29,78,216,0.45)] active:translate-y-px disabled:opacity-60",
  agents:
    "w-full rounded-xl border border-[color:var(--agent-600)]/70 bg-gradient-to-b from-[color:var(--agent-500)] via-[color:var(--agent-600)] to-[color:var(--agent-600)] px-4 py-3.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_18px_rgba(124,58,237,0.34)] transition hover:border-[color:var(--agent-500)] hover:from-[color:var(--agent-600)] hover:via-[color:var(--agent-700)] hover:to-[color:var(--agent-700)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_24px_rgba(124,58,237,0.4)] active:translate-y-px disabled:opacity-60",
  clients:
    "w-full rounded-xl border border-[color:var(--client-600)]/70 bg-gradient-to-b from-[color:var(--client-600)] via-[color:var(--client-600)] to-[color:var(--client-700)] px-4 py-3.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_18px_rgba(22,163,74,0.28)] transition hover:border-[color:var(--client-600)] hover:from-[color:var(--client-600)] hover:via-[color:var(--client-700)] hover:to-[color:var(--client-700)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_24px_rgba(22,163,74,0.32)] active:translate-y-px disabled:opacity-60",
};

export function ConnexionFormByGate({ gate }: ConnexionFormByGateProps) {
  const searchParams = useSearchParams();
  const callbackUrl = safeTeamLoginRedirect(searchParams.get("callbackUrl") ?? "/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const config = GATE_CONFIG[gate];

  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;

    if (gate === "clients") {
      if (err === "account_pending") {
        setError(
          "Votre inscription est en attente de validation par l'équipe BeWork. Vous recevrez un email dès que votre compte sera activé.",
        );
        return;
      }
      if (err === "account_rejected") {
        setError("Votre demande d'accès n'a pas été validée. Contactez BeWork pour plus d'informations.");
        return;
      }
    }

    const messages: Record<string, string> = {
      CredentialsSignin: "Email ou mot de passe incorrect.",
      invalid_credentials: "Email ou mot de passe incorrect.",
      wrong_gate: config.errorMessage,
      missing_fields: "Email et mot de passe requis.",
      server_error: "Erreur serveur. Réessayez dans un instant.",
    };
    setError(messages[err] ?? "Connexion impossible. Réessayez.");
  }, [searchParams, gate, config.errorMessage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        gate,
        callbackUrl,
        redirect: false,
      });

      if (result?.url && !result.ok) {
        window.location.assign(result.url);
        return;
      }

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Email ou mot de passe incorrect."
            : "Connexion impossible. Réessayez.",
        );
        return;
      }

      if (result?.ok) {
        window.location.assign(callbackUrl);
      }
    } catch {
      setError("Erreur de connexion au serveur. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#dce2ea] px-4 py-10 md:py-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.12), transparent 55%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.35)] md:p-9">
            <div className="mb-6 flex flex-col gap-3 border-b border-[#c8d0dc]/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/connexion"
                className="text-sm font-medium text-black transition-colors hover:text-black"
              >
                ← Changer d&apos;espace
              </Link>
              <span
                className={`w-fit shrink-0 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] shadow-sm ${badgeClassByGate[gate]}`}
              >
                {config.badge}
              </span>
            </div>

            <h1 className="font-sans text-[1.75rem] font-semibold leading-tight tracking-tight text-slate-900 md:text-[2rem]">
              {config.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-black md:text-[0.9375rem]">{config.description}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={fieldClass}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={fieldClass}
                  autoComplete="current-password"
                />
              </div>

              {error ? (
                <p
                  className="rounded-lg border border-red-300/60 bg-gradient-to-b from-red-50/95 to-red-50/70 px-4 py-3 text-sm font-medium text-red-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={primaryButtonClassByGate[gate]}
              >
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>

            <div className="mt-8 space-y-3 border-t border-[#c8d0dc]/50 pt-6">
              <div className="flex flex-col gap-2 text-center text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-1 sm:gap-y-2 sm:text-left">
                <Link href="/" className="font-semibold text-[#1d4ed8] underline-offset-2 hover:underline">
                  Retour à l&apos;accueil
                </Link>
                {gate === "clients" ? (
                  <>
                    <span className="hidden text-[#cbd5e1] sm:inline" aria-hidden>
                      ·
                    </span>
                    <Link
                      href="/inscription"
                      className="font-semibold text-[#1d4ed8] underline-offset-2 hover:underline"
                    >
                      Créer un compte
                    </Link>
                  </>
                ) : null}
              </div>
              <Link
                href="/"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <span aria-hidden>←</span>
                Accueil BeWork
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
