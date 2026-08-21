"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/platform-admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Impossible d’envoyer la demande.");
        return;
      }
      setDone(true);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-b from-[#1e3a5f] via-[#243f66] to-[#132f4c] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white p-7 shadow-2xl">
        <h1 className="text-xl font-semibold tracking-tight text-bework-navy">
          Mot de passe oublié
        </h1>
        <p className="mt-2 text-[14px] text-slate-600">
          Administration BeWork — un lien de réinitialisation sera envoyé si le compte existe.
        </p>

        {done ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Si un compte administrateur correspond, un email a été envoyé. Vérifiez aussi vos
              spams.
            </p>
            <Link href="/admin/connexion" className="text-[13px] font-semibold text-bework-accent">
              ← Retour connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Email administrateur
              </span>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[15px] outline-none focus:border-bework-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </label>
            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#1e3a5f] py-3 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
            <Link href="/admin/connexion" className="block text-center text-[13px] text-slate-500">
              Retour connexion
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
