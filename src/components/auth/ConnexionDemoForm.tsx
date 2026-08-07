"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { safeTeamLoginRedirect } from "@/lib/auth-team-login";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-black";

const fieldClass =
  "w-full rounded-lg border border-[#b8c4d4]/90 bg-gradient-to-b from-white to-[#f4f7fb] px-4 py-2.5 text-[0.9375rem] font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:font-normal placeholder:text-[#94a3b8] focus:border-[#3b82f6]/65 focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_0_0_3px_rgba(59,130,246,0.18)]";

export function ConnexionDemoForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeTeamLoginRedirect(searchParams.get("callbackUrl") ?? "/dashboard");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    const messages: Record<string, string> = {
      CredentialsSignin: "Identifiant ou mot de passe incorrect.",
      wrong_gate: "Cet espace est réservé aux démonstrations commerciales BeWork.",
      demo_expired: "Cette démonstration a expiré. Contactez BeWork pour prolonger l’accès.",
      demo_disabled: "Cette démonstration est désactivée.",
      demo_not_started: "Cette démonstration n’est pas encore disponible.",
      demo_invalid: "Environnement de démonstration introuvable.",
    };
    setError(messages[err] ?? "Connexion impossible. Réessayez.");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: identifier.trim().toLowerCase(),
        password: password.trim(),
        gate: "demo",
        callbackUrl,
        redirect: false,
      });

      if (result?.url && !result.ok) {
        window.location.assign(result.url);
        return;
      }
      if (result?.error) {
        setError("Identifiant ou mot de passe incorrect.");
        return;
      }
      if (result?.ok) {
        window.location.assign(callbackUrl);
      }
    } catch {
      setError("Erreur de connexion au serveur. Réessayez.");
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
            <Link href="/connexion" className="text-sm font-medium text-black transition-colors hover:text-black">
              ← Retour aux accès BeWork
            </Link>
            <span className="w-fit shrink-0 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-800 shadow-sm">
              Connexion démonstration
            </span>
          </div>

          <h1 className="font-sans text-[1.75rem] font-semibold leading-tight tracking-tight text-slate-900 md:text-[2rem]">
            Accéder à votre démonstration BeWork
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-black md:text-[0.9375rem]">
            Utilisez les identifiants transmis par BeWork pour découvrir votre environnement personnalisé.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="demo-identifier" className={labelClass}>
                Identifiant de démonstration
              </label>
              <input
                id="demo-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className={fieldClass}
                placeholder="identifiant-transmis"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="demo-password" className={labelClass}>
                Mot de passe
              </label>
              <input
                id="demo-password"
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
              className="w-full rounded-xl border border-slate-700/70 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_18px_rgba(15,23,42,0.35)] transition hover:from-slate-800 hover:via-slate-900 hover:to-slate-950 active:translate-y-px disabled:opacity-60"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
            Cet environnement contient uniquement des données fictives de démonstration.
          </p>

          <div className="mt-6 border-t border-[#c8d0dc]/50 pt-6">
            <Link
              href="/connexion"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <span aria-hidden>←</span>
              Retour aux accès BeWork
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
