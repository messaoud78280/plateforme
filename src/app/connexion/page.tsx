"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password: password.trim(),
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-slate-800">
          Plateforme Client - Agence
        </h1>
        <p className="mb-8 text-slate-600">
          Connectez-vous pour accéder à votre espace
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <a href="/" className="text-blue-600 hover:underline">
            Retour à l&apos;accueil
          </a>
        </p>
        <p className="mt-4 text-center text-xs text-slate-400">
          Démo : client@exemple.com / agence@exemple.com — mot de passe : motdepasse123
        </p>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Chargement...</p>
      </div>
    }>
      <ConnexionForm />
    </Suspense>
  );
}
