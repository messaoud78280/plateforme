"use client";

import { signIn, signOut, getSession } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

export function ConnexionFormByGate({ gate }: ConnexionFormByGateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const config = GATE_CONFIG[gate];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password: password.trim(),
      redirect: false,
    });

    if (!result) {
      setError("Erreur de connexion au serveur. Vérifiez votre connexion et réessayez.");
      return;
    }

    if (result.error) {
      if (result.error === "CredentialsSignin") {
        setError("Email ou mot de passe incorrect.");
      } else {
        setError(`Erreur de connexion (${result.error}). Réessayez.`);
      }
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!role || !config.allowed(role)) {
      await signOut({ redirect: false });
      setError(config.errorMessage);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
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
        <div className="rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_12px_40px_rgba(15,23,42,0.12),0_2px_0_rgba(255,255,255,0.6)_inset]">
          <div className="card-frame rounded-2xl p-8 md:p-9">
            <div className="mb-6 flex flex-col gap-3 border-b border-[#c8d0dc]/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/connexion"
                className="text-sm font-medium text-black transition-colors hover:text-black"
              >
                ← Changer d&apos;espace
              </Link>
              <span className="surface-metallic-light surface-metallic-light--badge-pill w-fit shrink-0 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black shadow-sm">
                {config.badge}
              </span>
            </div>

            <h1 className="text-metallic-black font-[family-name:var(--font-playfair),ui-serif,Georgia,serif] text-[1.75rem] font-semibold leading-tight tracking-tight md:text-[2rem]">
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
                className="w-full rounded-xl border border-[#2563eb]/70 bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-4 py-3.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_18px_rgba(29,78,216,0.38)] transition hover:border-[#3b82f6] hover:from-[#2563eb] hover:via-[#1d4ed8] hover:to-[#1e40af] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_24px_rgba(29,78,216,0.45)] active:translate-y-px"
              >
                Se connecter
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
                className="surface-metallic-outline flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#1e293b] transition hover:text-black"
              >
                <span aria-hidden>←</span>
                Accueil BeWork
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
