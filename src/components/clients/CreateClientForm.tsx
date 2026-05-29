"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isWellFormedEmail } from "@/lib/email-validation";
import { FORMES_JURIDIQUES, SECTEURS_ACTIVITE } from "@/lib/client-profile-options";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20";

export function CreateClientForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [formeJuridique, setFormeJuridique] = useState("");
  const [secteurActivite, setSecteurActivite] = useState("");
  const [service, setService] = useState("");
  const [password, setPassword] = useState("");

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setFormeJuridique("");
    setSecteurActivite("");
    setService("");
    setPassword("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isWellFormedEmail(email)) {
      setError("Indiquez une adresse email complète.");
      return;
    }
    if (!company.trim()) {
      setError("La raison sociale est requise.");
      return;
    }
    if (!formeJuridique) {
      setError("Sélectionnez une forme juridique.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          company: company.trim(),
          formeJuridique,
          secteurActivite: secteurActivite || undefined,
          service: service.trim() || undefined,
          password,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Impossible de créer le client.");
        return;
      }
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af]"
      >
        + Nouveau client
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => !loading && setOpen(false)}
            aria-label="Fermer"
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Créer un compte client</h2>
            <p className="mt-1 text-sm text-slate-600">
              Client = entreprise (toutes formes juridiques). Le contact recevra un email de bienvenue.
            </p>

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
              <div>
                <label htmlFor="client-company" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Raison sociale *
                </label>
                <input
                  id="client-company"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={fieldClass}
                  placeholder="Ex. Alya Corporation"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="client-forme" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Forme juridique *
                  </label>
                  <select
                    id="client-forme"
                    required
                    value={formeJuridique}
                    onChange={(e) => setFormeJuridique(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">— Choisir —</option>
                    {FORMES_JURIDIQUES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="client-secteur" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Secteur
                  </label>
                  <select
                    id="client-secteur"
                    value={secteurActivite}
                    onChange={(e) => setSecteurActivite(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">— Optionnel —</option>
                    {SECTEURS_ACTIVITE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="client-name" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Nom du contact *
                </label>
                <input
                  id="client-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                  placeholder="Prénom et nom"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="client-email" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Email *
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="contact@entreprise.fr"
                  />
                </div>
                <div>
                  <label htmlFor="client-phone" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Téléphone
                  </label>
                  <input
                    id="client-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="client-service" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Service / département
                </label>
                <input
                  id="client-service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className={fieldClass}
                  placeholder="Ex. Direction travaux"
                />
              </div>

              <div>
                <label htmlFor="client-password" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Mot de passe initial *
                </label>
                <input
                  id="client-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-slate-500">Minimum 8 caractères — à communiquer au client.</p>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
                >
                  {loading ? "Création…" : "Créer le client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
