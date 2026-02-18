"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InscriptionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"CLIENT" | "AGENCE">("CLIENT");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'inscription.");
      return;
    }

    router.push("/connexion?registered=1");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-slate-800">
          Créer un compte
        </h1>
        <p className="mb-8 text-slate-600">
          Inscrivez-vous pour accéder à la plateforme
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nom complet
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Jean Dupont"
            />
          </div>

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
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Type de compte
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "CLIENT" | "AGENCE")}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="CLIENT">Client</option>
              <option value="AGENCE">Agence</option>
            </select>
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
            S&apos;inscrire
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
