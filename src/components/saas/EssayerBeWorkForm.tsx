"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { isWellFormedEmail } from "@/lib/email-validation";
import { SAAS_TRIAL_DAYS } from "@/lib/organization/lifecycle";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500";
const fieldClass =
  "w-full rounded-xl border border-bework-navy/15 bg-white px-3.5 py-2.5 text-[15px] text-bework-ink outline-none transition placeholder:text-slate-400 focus:border-bework-accent/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

export function EssayerBeWorkForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Indiquez votre prénom et votre nom.");
      return;
    }
    if (!isWellFormedEmail(email)) {
      setError("Indiquez une adresse email professionnelle valide.");
      return;
    }
    if (!companyName.trim() || companyName.trim().length < 2) {
      setError("Indiquez le nom de votre entreprise.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/saas-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyName: companyName.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Impossible de créer votre espace BeWork.");
        return;
      }

      const login = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        gate: "clients",
        callbackUrl: "/dashboard/bienvenue",
        redirect: false,
      });

      if (login?.error) {
        setError(
          "Espace créé, mais la connexion automatique a échoué. Connectez-vous depuis /connexion/clients.",
        );
        return;
      }
      window.location.assign("/dashboard/bienvenue");
    } catch {
      setError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Prénom</span>
          <input
            className={fieldClass}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Nom</span>
          <input
            className={fieldClass}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Email professionnel</span>
        <input
          type="email"
          className={fieldClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>

      <label className="block">
        <span className={labelClass}>Nom de l’entreprise</span>
        <input
          className={fieldClass}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          autoComplete="organization"
          placeholder="Ex. Durand Étanchéité"
          required
        />
      </label>

      <label className="block">
        <span className={labelClass}>Mot de passe</span>
        <input
          type="password"
          className={fieldClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="mt-1 block text-[12px] text-slate-500">8 caractères minimum.</span>
      </label>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center rounded-full bg-[#1e3a5f] px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-[#16304f] disabled:opacity-60"
      >
        {loading ? "Création de votre espace…" : `Démarrer mon essai ${SAAS_TRIAL_DAYS} jours`}
      </button>

      <p className="text-center text-[12px] leading-relaxed text-slate-500">
        Aucune carte bancaire requise. Espace privé pour votre entreprise — sans données de démo.
        {" "}
        Déjà un compte ?{" "}
        <Link href="/connexion/clients" className="font-semibold text-bework-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
