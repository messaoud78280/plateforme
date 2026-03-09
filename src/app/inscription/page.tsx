"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";

const FORMES_JURIDIQUES = [
  "Profession libérale",
  "SAS",
  "EURL",
  "SARL",
  "SA",
  "Auto-entrepreneur / Micro-entreprise",
  "Association",
  "SCI",
  "Autre",
] as const;

const SECTEURS_ACTIVITE = [
  "E-commerce",
  "Juridique",
  "Commercial",
  "Réseaux sociaux / Médias",
  "Événementiel",
  "Agroalimentaire",
  "Santé",
  "BTP / Construction",
  "Conseils / Consulting",
  "Immobilier",
  "Finance / Assurances",
  "Industrie",
  "Autre",
] as const;

export default function InscriptionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [formeJuridique, setFormeJuridique] = useState("");
  const [secteurActivite, setSecteurActivite] = useState("");
  const [service, setService] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        phone: phone || undefined,
        company: company || undefined,
        formeJuridique: formeJuridique || undefined,
        secteurActivite: secteurActivite || undefined,
        service: service || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'inscription.");
      return;
    }

    router.push("/connexion/clients?registered=1&callbackUrl=/dashboard/onboarding");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <BackLink href="/connexion/clients" className="mb-4 inline-block">Retour à la connexion clients</BackLink>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">
          Créer un compte client
        </h1>
        <p className="mb-8 text-slate-600">
          Inscription réservée aux clients. Créez votre compte pour accéder à l&apos;espace client et à nos services.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nom du contact
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
              placeholder="vous@entreprise.com"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Téléphone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Raison sociale / Nom de l&apos;entreprise
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Exemple SAS"
            />
          </div>

          <div>
            <label
              htmlFor="formeJuridique"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Forme juridique
            </label>
            <select
              id="formeJuridique"
              value={formeJuridique}
              onChange={(e) => setFormeJuridique(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Sélectionnez une forme juridique</option>
              {FORMES_JURIDIQUES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="secteurActivite"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Secteur d&apos;activité
            </label>
            <select
              id="secteurActivite"
              value={secteurActivite}
              onChange={(e) => setSecteurActivite(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Sélectionnez un secteur</option>
              {SECTEURS_ACTIVITE.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="service"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Service / Département
            </label>
            <input
              id="service"
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ex. Direction, Comptabilité, RH..."
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
          Déjà un compte client ?{" "}
          <Link href="/connexion/clients" className="text-blue-600 hover:underline">
            Se connecter (espace clients)
          </Link>
        </p>
      </div>
    </div>
  );
}
