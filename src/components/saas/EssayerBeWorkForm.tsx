"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isWellFormedEmail } from "@/lib/email-validation";
import { SAAS_TRIAL_DAYS } from "@/lib/organization/lifecycle";
import {
  BTP_CORPS_METIER,
  COMPANY_SIZES,
  isValidSiret,
} from "@/lib/btp-corps-metier";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500";
const fieldClass =
  "w-full rounded-xl border border-bework-navy/15 bg-white px-3.5 py-2.5 text-[15px] text-bework-ink outline-none transition placeholder:text-slate-400 focus:border-bework-accent/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

export function EssayerBeWorkForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [corpsMetier, setCorpsMetier] = useState("");
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
    if (!isValidSiret(siret)) {
      setError("Indiquez un SIRET valide (14 chiffres).");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      setError("Indiquez le téléphone de l’entreprise.");
      return;
    }
    if (!addressLine1.trim() || !postalCode.trim() || !city.trim()) {
      setError("Indiquez l’adresse complète de l’entreprise (rue, code postal, ville).");
      return;
    }
    if (!companySize) {
      setError("Sélectionnez la taille de l’entreprise.");
      return;
    }
    if (!corpsMetier) {
      setError("Sélectionnez votre corps de métier / domaine d’activité BTP.");
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
          siret: siret.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          postalCode: postalCode.trim(),
          city: city.trim(),
          companySize,
          corpsMetier,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Impossible d’enregistrer votre demande.");
        return;
      }

      router.push(`/essayer/confirmation?email=${encodeURIComponent(email.trim())}`);
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-[13px] text-amber-950">
        Accès soumis à validation BeWork. Vous recevrez un email dès que votre essai{" "}
        {SAAS_TRIAL_DAYS} jours sera activé.
      </div>

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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>SIRET</span>
          <input
            className={fieldClass}
            value={siret}
            onChange={(e) => setSiret(e.target.value)}
            inputMode="numeric"
            placeholder="14 chiffres"
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Téléphone</span>
          <input
            type="tel"
            className={fieldClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Adresse entreprise</span>
        <input
          className={fieldClass}
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          autoComplete="address-line1"
          placeholder="N° et rue"
          required
        />
      </label>
      <label className="block">
        <span className={labelClass}>Complément d’adresse (optionnel)</span>
        <input
          className={fieldClass}
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          autoComplete="address-line2"
          placeholder="Bâtiment, ZI…"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Code postal</span>
          <input
            className={fieldClass}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            autoComplete="postal-code"
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Ville</span>
          <input
            className={fieldClass}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level1"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Taille de l’entreprise</span>
        <select
          className={fieldClass}
          value={companySize}
          onChange={(e) => setCompanySize(e.target.value)}
          required
        >
          <option value="">Sélectionner…</option>
          {COMPANY_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>Corps de métier / domaine d’activité</span>
        <select
          className={fieldClass}
          value={corpsMetier}
          onChange={(e) => setCorpsMetier(e.target.value)}
          required
        >
          <option value="">Sélectionner…</option>
          {BTP_CORPS_METIER.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
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
        {loading ? "Envoi de la demande…" : `Demander mon essai ${SAAS_TRIAL_DAYS} jours`}
      </button>

      <p className="text-center text-[12px] leading-relaxed text-slate-500">
        Aucune carte bancaire. Accès ouvert uniquement après validation BeWork.
        {" "}
        Déjà validé ?{" "}
        <Link href="/connexion/clients" className="font-semibold text-bework-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
