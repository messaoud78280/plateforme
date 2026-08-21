"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => {
    const err = searchParams.get("error");
    if (err === "forbidden") return "Accès réservé aux administrateurs BeWork.";
    return "";
  });
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        gate: "admin",
        callbackUrl,
        redirect: false,
      });
      if (result?.error) {
        setError("Identifiants invalides ou compte non autorisé.");
        return;
      }
      window.location.assign(callbackUrl.startsWith("/") ? callbackUrl : "/admin");
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-b from-[#1e3a5f] via-[#243f66] to-[#132f4c] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white p-7 shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Accès interne
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-bework-navy">
          Administration BeWork
        </h1>
        <p className="mt-2 text-[14px] text-slate-600">
          Compte éditeur plateforme — distinct des espaces entreprises clientes.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Email
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
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Mot de passe
            </span>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[15px] outline-none focus:border-bework-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#1e3a5f] py-3 text-[15px] font-semibold text-white hover:bg-[#16304f] disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Entrer dans l’admin"}
          </button>
        </form>
        <p className="mt-5 text-center text-[12px] text-slate-500">
          <Link href="/" className="font-medium text-bework-accent hover:underline">
            Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminConnexionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center">Chargement…</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
