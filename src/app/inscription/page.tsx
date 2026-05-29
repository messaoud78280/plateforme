"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { isWellFormedEmail } from "@/lib/email-validation";
import { FORMES_JURIDIQUES, SECTEURS_ACTIVITE } from "@/lib/client-profile-options";

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

    if (!isWellFormedEmail(email)) {
      setError(
        "Indiquez une adresse email complète (ex. nom@gmail.com, contact@entreprise.fr)."
      );
      return;
    }

    if (!company.trim()) {
      setError("Indiquez la raison sociale de votre entreprise.");
      return;
    }
    if (!formeJuridique) {
      setError("Sélectionnez la forme juridique de votre entreprise.");
      return;
    }

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

    let data: { error?: string };
    try {
      data = (await res.json()) as { error?: string };
    } catch {
      setError(
        `Réponse serveur invalide (${res.status}). En production, vérifiez DATABASE_URL et un schéma à jour (prisma db push).`
      );
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'inscription.");
      return;
    }

    const target = `/inscription/confirmation?email=${encodeURIComponent(email.trim())}`;
    router.push(target);
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] px-4 py-8 md:py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.12), transparent 55%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.35)] md:p-9">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <BackLink
                href="/connexion/clients"
                className="text-black transition-colors hover:text-black"
              >
                Retour à la connexion clients
              </BackLink>
              <span className="w-fit shrink-0 rounded-full border border-[#bbf7d0] bg-[color:var(--client-50)] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--client-700)] shadow-sm">
                Inscription client
              </span>
          </div>

          <h1 className="mb-2 font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-slate-900 md:text-[1.8rem]">
            Créer votre compte client
          </h1>
          <p className="text-sm leading-relaxed text-slate-700 md:text-[0.9375rem]">
            Accès réservé aux clients. Gérants et agents : compte créé par l&apos;agence.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Espace sécurisé.</span> Vos informations restent confidentielles.
            <span className="mx-2 text-slate-300" aria-hidden>
              ·
            </span>
            <span className="font-semibold text-slate-900">Support rapide.</span> Notre équipe peut vous aider dès la création du compte.
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
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
              <div className="sm:col-span-1">
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  Entreprise
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <p className="mt-2 text-xs text-slate-600">Astuce : utilisez un mot de passe unique, d’au moins 8 caractères.</p>
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
              className="w-full rounded-xl border border-[color:var(--accent-600)]/70 bg-gradient-to-b from-[color:var(--accent-500)] via-[color:var(--accent-600)] to-[color:var(--accent-600)] px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_18px_rgba(29,78,216,0.38)] transition hover:border-[color:var(--accent-500)] hover:from-[color:var(--accent-600)] hover:via-[color:var(--accent-700)] hover:to-[color:var(--accent-700)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_24px_rgba(29,78,216,0.45)] active:translate-y-px"
            >
              S&apos;inscrire
            </button>
          </form>

          <p className="mt-7 border-t border-slate-200/70 pt-6 text-center text-sm text-slate-800">
              Déjà un compte client ?{" "}
              <Link
                href="/connexion/clients"
                className="font-semibold text-[color:var(--accent-600)] underline-offset-2 transition hover:text-[color:var(--accent-700)] hover:underline"
              >
                Se connecter (espace clients)
              </Link>
            </p>
            <Link
              href="/"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span aria-hidden>←</span>
              Retour à l&apos;accueil
            </Link>
        </div>
      </div>
    </div>
  );
}
