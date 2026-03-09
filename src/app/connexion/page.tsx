"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const ACCES = [
  {
    slug: "gerante",
    title: "Espace Gérante / Managers",
    description: "Accès réservé à la gérante et aux managers de l'agence.",
    path: "/connexion/gerante",
    icon: "👔",
  },
  {
    slug: "agents",
    title: "Espace Agents",
    description: "Accès pour les agents opérationnels.",
    path: "/connexion/agents",
    icon: "👤",
  },
  {
    slug: "clients",
    title: "Espace Clients",
    description: "Accès pour les clients de l'agence.",
    path: "/connexion/clients",
    icon: "🏢",
  },
] as const;

function ConnexionChoice() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const query = useMemo(() => (callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""), [callbackUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">
          Plateforme BeWork
        </h1>
        <p className="mb-8 text-center text-slate-600">
          Choisissez votre espace de connexion
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {ACCES.map((acc) => (
            <Link
              key={acc.slug}
              href={`${acc.path}${query}`}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="mb-3 text-3xl" aria-hidden>{acc.icon}</span>
              <h2 className="mb-2 font-semibold text-slate-800">{acc.title}</h2>
              <p className="text-sm text-slate-600">{acc.description}</p>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          <a href="/" className="text-blue-600 hover:underline">
            Retour à l&apos;accueil
          </a>
          {" · "}
          <Link href="/inscription" className="text-blue-600 hover:underline">
            Créer un compte (clients)
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">Chargement...</p>
        </div>
      }
    >
      <ConnexionChoice />
    </Suspense>
  );
}
