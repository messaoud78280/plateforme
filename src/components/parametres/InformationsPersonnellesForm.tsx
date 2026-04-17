"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InformationsPersonnellesFormProps {
  initialData: {
    civilite: string | null;
    name: string;
    email: string;
    phone: string | null;
    billingAddressLine1: string | null;
    billingAddressLine2: string | null;
    billingCity: string | null;
    billingPostalCode: string | null;
    billingCountry: string | null;
  };
}

export function InformationsPersonnellesForm({ initialData }: InformationsPersonnellesFormProps) {
  const router = useRouter();
  const [civilite, setCivilite] = useState(initialData.civilite ?? "");
  const [name, setName] = useState(initialData.name ?? "");
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [billingAddressLine1, setBillingAddressLine1] = useState(
    initialData.billingAddressLine1 ?? ""
  );
  const [billingAddressLine2, setBillingAddressLine2] = useState(
    initialData.billingAddressLine2 ?? ""
  );
  const [billingCity, setBillingCity] = useState(initialData.billingCity ?? "");
  const [billingPostalCode, setBillingPostalCode] = useState(
    initialData.billingPostalCode ?? ""
  );
  const [billingCountry, setBillingCountry] = useState(initialData.billingCountry ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setMessage("Le nom doit contenir au moins 2 caractères.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/me/informations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          civilite: civilite.trim() || null,
          name: name.trim(),
          phone: phone.trim() || null,
          billingAddressLine1: billingAddressLine1.trim() || null,
          billingAddressLine2: billingAddressLine2.trim() || null,
          billingCity: billingCity.trim() || null,
          billingPostalCode: billingPostalCode.trim() || null,
          billingCountry: billingCountry.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Erreur lors de l'enregistrement.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setMessage("Informations enregistrées.");
      router.refresh();
    } catch {
      setMessage("Erreur de connexion.");
      setStatus("error");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] disabled:bg-[#f8fafc]";
  const labelClass = "mb-1 block text-sm font-medium text-black";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="civilite" className={labelClass}>
          Civilité
        </label>
        <select
          id="civilite"
          value={civilite}
          onChange={(e) => setCivilite(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
        >
          <option value="">—</option>
          <option value="M.">M.</option>
          <option value="Mme">Mme</option>
          <option value="Mlle">Mlle</option>
        </select>
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          Nom complet <span className="text-[#94a3b8]">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
          placeholder="Votre nom complet"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Adresse e-mail de contact</label>
        <p className="text-black">{initialData.email}</p>
        <p className="mt-1 text-xs text-[#94a3b8]">L&apos;email ne peut pas être modifié ici.</p>
      </div>

      <div>
        <label htmlFor="billingCountry" className={labelClass}>
          Pays/Région
        </label>
        <input
          id="billingCountry"
          type="text"
          value={billingCountry}
          onChange={(e) => setBillingCountry(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
          placeholder="Ex. France, pays de résidence"
        />
      </div>

      <div>
        <label htmlFor="billingAddressLine1" className={labelClass}>
          Adresse (ligne 1)
        </label>
        <input
          id="billingAddressLine1"
          type="text"
          value={billingAddressLine1}
          onChange={(e) => setBillingAddressLine1(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
          placeholder="Numéro et nom de rue"
        />
      </div>

      <div>
        <label htmlFor="billingAddressLine2" className={labelClass}>
          Adresse (ligne 2)
        </label>
        <input
          id="billingAddressLine2"
          type="text"
          value={billingAddressLine2}
          onChange={(e) => setBillingAddressLine2(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
          placeholder="Complément, quartier"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="billingCity" className={labelClass}>
            Ville
          </label>
          <input
            id="billingCity"
            type="text"
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            disabled={status === "loading"}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="billingPostalCode" className={labelClass}>
            Code postal
          </label>
          <input
            id="billingPostalCode"
            type="text"
            value={billingPostalCode}
            onChange={(e) => setBillingPostalCode(e.target.value)}
            disabled={status === "loading"}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>
          Numéro de téléphone
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={status === "loading"}
          className={inputClass}
          placeholder="+33 6 12 34 56 78"
        />
      </div>

      {message && (
        <p
          className={`text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}
          role="alert"
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1e40af] disabled:opacity-50"
        >
          {status === "loading" ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link
          href="/dashboard/parametres/informations"
          className="text-sm font-medium text-black hover:text-black"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
