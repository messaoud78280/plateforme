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
  "Finance / Assurances",
  "Industrie",
  "Autre",
] as const;

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-black";

const fieldClass =
  "w-full rounded-lg border border-[#b8c4d4]/90 bg-gradient-to-b from-white to-[#f4f7fb] px-4 py-2.5 text-[0.9375rem] font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:font-normal placeholder:text-[#94a3b8] focus:border-[#3b82f6]/65 focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_0_0_3px_rgba(59,130,246,0.18)]";

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

    router.push("/connexion/clients?registered=1&callbackUrl=/dashboard/abonnement?onboarding=1");
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
      <div className="relative mx-auto w-full max-w-lg">
        {/* Cadre extérieur : bordure dégradée type chrome */}
        <div className="rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_12px_40px_rgba(15,23,42,0.12),0_2px_0_rgba(255,255,255,0.6)_inset]">
          <div className="card-frame rounded-2xl p-8 md:p-10">
            <div className="mb-6 flex flex-col gap-3 border-b border-[#c8d0dc]/60 pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <BackLink
                href="/connexion/clients"
                className="text-black transition-colors hover:text-black"
              >
                Retour à la connexion clients
              </BackLink>
              <span className="surface-metallic-light surface-metallic-light--badge-pill w-fit shrink-0 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black shadow-sm">
                Inscription client
              </span>
            </div>

            <h1
              className="text-metallic-black mb-2 font-[family-name:var(--font-playfair),ui-serif,Georgia,serif] text-[1.75rem] font-semibold leading-tight tracking-tight md:text-[2rem]"
            >
              Créer un compte client
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-black md:text-[0.9375rem]">
              Uniquement pour les clients. Gérants et agents : compte créé par l&apos;agence.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Nom du contact
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={fieldClass}
                  placeholder="Jean Dupont"
                />
              </div>

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
                  placeholder="vous@entreprise.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  Téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldClass}
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <label htmlFor="company" className={labelClass}>
                  Raison sociale / Nom de l&apos;entreprise
                </label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={fieldClass}
                  placeholder="Exemple SAS"
                />
              </div>

              <div>
                <label htmlFor="formeJuridique" className={labelClass}>
                  Forme juridique
                </label>
                <select
                  id="formeJuridique"
                  value={formeJuridique}
                  onChange={(e) => setFormeJuridique(e.target.value)}
                  className={fieldClass}
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
                <label htmlFor="secteurActivite" className={labelClass}>
                  Secteur d&apos;activité
                </label>
                <select
                  id="secteurActivite"
                  value={secteurActivite}
                  onChange={(e) => setSecteurActivite(e.target.value)}
                  className={fieldClass}
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
                <label htmlFor="service" className={labelClass}>
                  Service / Département
                </label>
                <input
                  id="service"
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className={fieldClass}
                  placeholder="Ex. Direction, Comptabilité, RH…"
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
                  minLength={6}
                  className={fieldClass}
                  placeholder="Minimum 6 caractères"
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
                className="w-full rounded-xl border border-[#2563eb]/70 bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_18px_rgba(29,78,216,0.38)] transition hover:border-[#3b82f6] hover:from-[#2563eb] hover:via-[#1d4ed8] hover:to-[#1e40af] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_24px_rgba(29,78,216,0.45)] active:translate-y-px"
              >
                S&apos;inscrire
              </button>
            </form>

            <p className="mt-8 border-t border-[#c8d0dc]/50 pt-6 text-center text-sm text-black">
              Déjà un compte client ?{" "}
              <Link
                href="/connexion/clients"
                className="font-semibold text-[#1d4ed8] underline-offset-2 transition hover:text-[#1e40af] hover:underline"
              >
                Se connecter (espace clients)
              </Link>
            </p>
            <Link
              href="/"
              className="surface-metallic-outline mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#1e293b] transition hover:text-black"
            >
              <span aria-hidden>←</span>
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
