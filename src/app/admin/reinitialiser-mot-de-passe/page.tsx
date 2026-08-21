"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = (searchParams.get("email") ?? "").trim();
  const token = (searchParams.get("token") ?? "").trim();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("12 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!email || !token) {
      setError("Lien incomplet. Demandez un nouveau lien.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/platform-admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Impossible de définir le mot de passe.");
        return;
      }
      router.push("/admin/connexion?reset=ok");
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
          Nouveau mot de passe admin
        </h1>
        <p className="mt-2 text-[14px] text-slate-600">
          {email ? (
            <>
              Compte <span className="font-semibold">{email}</span>
            </>
          ) : (
            "Lien de réinitialisation Administration BeWork"
          )}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Nouveau mot de passe
            </span>
            <input
              type="password"
              required
              minLength={12}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[15px]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Confirmer
            </span>
            <input
              type="password"
              required
              minLength={12}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[15px]"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
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
            {loading ? "Enregistrement…" : "Enregistrer et se connecter"}
          </button>
          <Link href="/admin/connexion" className="block text-center text-[13px] text-slate-500">
            Retour connexion
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-white">Chargement…</div>}>
      <ResetForm />
    </Suspense>
  );
}
