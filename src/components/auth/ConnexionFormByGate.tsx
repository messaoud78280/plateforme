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
    badge: "Connexion Gérant",
    title: "Espace Gérante / Managers",
    description: "Connectez-vous pour accéder à l'espace de gestion.",
    allowed: isManager,
    errorMessage: "Cet espace est réservé à la gérante et aux managers. Utilisez l'accès Gérante ou connectez-vous avec un compte autorisé.",
  },
  agents: {
    badge: "Connexion Agent",
    title: "Espace Agents",
    description: "Connectez-vous pour accéder à votre espace agent.",
    allowed: isAgentRole,
    errorMessage: "Cet espace est réservé aux agents. Utilisez l'accès Agents ou connectez-vous avec un compte agent.",
  },
  clients: {
    badge: "Connexion Client",
    title: "Espace Clients",
    description: "Connectez-vous pour accéder à votre espace client.",
    allowed: isClient,
    errorMessage: "Cet espace est réservé aux clients. Utilisez l'accès Clients ou connectez-vous avec un compte client.",
  },
};

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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <p className="mb-3 inline-block rounded-full bg-slate-800 px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-white">
          {config.badge}
        </p>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">{config.title}</h1>
        <p className="mb-8 text-slate-600">{config.description}</p>

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
          <Link href="/connexion" className="text-blue-600 hover:underline">
            Changer d&apos;espace
          </Link>
          {" · "}
          <a href="/" className="text-blue-600 hover:underline">
            Retour à l&apos;accueil
          </a>
          {gate === "clients" && (
            <>
              {" · "}
              <Link href="/inscription" className="text-blue-600 hover:underline">
                Créer un compte
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
