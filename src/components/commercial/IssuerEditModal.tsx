"use client";

import { useEffect, useState } from "react";
import type { CompanyProfile } from "@/lib/commercial/company-profile";
import {
  formatSirenDisplay,
  formatSiretDisplay,
  issuerSnapshotFromUnknown,
  type IssuerSnapshotShape,
} from "@/lib/commercial/company-profile";

type Scope = "quote" | "organization";

const EMPTY: CompanyProfile = {
  name: null,
  tradeName: null,
  activity: null,
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  country: "France",
  phone: null,
  email: null,
  website: null,
  siren: null,
  siret: null,
  vatNumber: null,
  apeCode: null,
  apeLabel: null,
  legalForm: null,
  capital: null,
  logoPath: null,
};

function fromSnapshot(snap: unknown): CompanyProfile {
  const s = issuerSnapshotFromUnknown(snap);
  if (!s) return { ...EMPTY };
  return {
    name: s.name ?? null,
    tradeName: s.tradeName ?? s.name ?? null,
    activity: s.activity ?? null,
    addressLine1: s.addressLine1 ?? null,
    addressLine2: s.addressLine2 ?? null,
    postalCode: s.postalCode ?? null,
    city: s.city ?? null,
    country: s.country ?? "France",
    phone: s.phone ?? null,
    email: s.email ?? null,
    website: s.website ?? null,
    siren: s.siren ?? null,
    siret: s.siret ?? null,
    vatNumber: s.vatNumber ?? null,
    apeCode: s.apeCode ?? null,
    apeLabel: s.apeLabel ?? null,
    legalForm: s.legalForm ?? s.formeJuridique ?? null,
    capital: s.capital ?? null,
    logoPath: s.logoPath ?? null,
  };
}

function toSnapshot(p: CompanyProfile): IssuerSnapshotShape {
  return {
    name: p.tradeName || p.name,
    tradeName: p.tradeName || p.name,
    activity: p.activity,
    addressLine1: p.addressLine1,
    addressLine2: p.addressLine2,
    postalCode: p.postalCode,
    city: p.city,
    country: p.country,
    phone: p.phone,
    email: p.email,
    website: p.website,
    siren: p.siren?.replace(/\s/g, "") ?? null,
    siret: p.siret?.replace(/\s/g, "") ?? null,
    vatNumber: p.vatNumber?.replace(/\s/g, "") ?? null,
    apeCode: p.apeCode,
    apeLabel: p.apeLabel,
    legalForm: p.legalForm,
    formeJuridique: p.legalForm,
    capital: p.capital,
    logoPath: p.logoPath,
  };
}

export function IssuerEditModal({
  open,
  onClose,
  quoteId,
  currentIssuer,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  currentIssuer: unknown;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CompanyProfile>(EMPTY);
  const [scope, setScope] = useState<Scope>("quote");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setScope("quote");
    setForm(fromSnapshot(currentIssuer));
    void (async () => {
      try {
        const res = await fetch("/api/commercial/settings/company-profile");
        const data = await res.json();
        if (res.ok && data.profile) {
          const org = data.profile as CompanyProfile;
          // Préférer snapshot devis, compléter les trous avec le profil org
          setForm((cur) => {
            const base = fromSnapshot(currentIssuer);
            const out = { ...base };
            for (const key of Object.keys(EMPTY) as (keyof CompanyProfile)[]) {
              if (!out[key] && org[key]) out[key] = org[key];
            }
            return out;
          });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [open, currentIssuer]);

  if (!open) return null;

  function setField<K extends keyof CompanyProfile>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value.trim() ? value : null }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const snapshot = toSnapshot(form);
      if (scope === "organization") {
        const res = await fetch("/api/commercial/settings/company-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: form }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec profil organisation");
      }
      const resQ = await fetch(`/api/commercial/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issuerSnapshotJson: snapshot }),
      });
      const dataQ = await resQ.json();
      if (!resQ.ok) throw new Error(dataQ.error || "Échec mise à jour devis");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Fermer"
        className="fixed inset-0 z-40 bg-slate-900/35"
        onClick={() => !busy && onClose()}
      />
      <div className="fixed left-1/2 top-[3vh] z-50 flex max-h-[94vh] w-[min(100%-1rem,32rem)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-[#1e3a5f]">
                Informations de l’émetteur
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Identité commerciale et mentions légales utilisées sur ce devis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => !busy && onClose()}
              className="text-slate-400"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setScope("quote")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                scope === "quote"
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Modifier uniquement ce devis
            </button>
            <button
              type="button"
              onClick={() => setScope("organization")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                scope === "organization"
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Mettre à jour le profil Urban Aménagements
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            {scope === "quote"
              ? "Les autres devis et le profil société restent inchangés."
              : "Profil organisation mis à jour — les nouveaux devis hériteront de ces valeurs. Les documents déjà finalisés conservent leur snapshot."}
          </p>

          <Field label="Nom commercial / raison sociale" value={form.tradeName ?? form.name ?? ""} onChange={(v) => { setField("tradeName", v); setField("name", v); }} />
          <Field label="Activité / sous-titre commercial" value={form.activity ?? ""} onChange={(v) => setField("activity", v)} />
          <Field label="Adresse" value={form.addressLine1 ?? ""} onChange={(v) => setField("addressLine1", v)} />
          <Field label="Complément d’adresse" value={form.addressLine2 ?? ""} onChange={(v) => setField("addressLine2", v)} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Code postal" value={form.postalCode ?? ""} onChange={(v) => setField("postalCode", v)} />
            <Field label="Ville" value={form.city ?? ""} onChange={(v) => setField("city", v)} />
          </div>
          <Field label="Pays" value={form.country ?? ""} onChange={(v) => setField("country", v)} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Téléphone" value={form.phone ?? ""} onChange={(v) => setField("phone", v)} />
            <Field label="Email" value={form.email ?? ""} onChange={(v) => setField("email", v)} />
          </div>
          <Field label="Site internet" value={form.website ?? ""} onChange={(v) => setField("website", v)} />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="SIREN"
              value={formatSirenDisplay(form.siren) ?? form.siren ?? ""}
              onChange={(v) => setField("siren", v.replace(/\s/g, ""))}
            />
            <Field
              label="SIRET"
              value={formatSiretDisplay(form.siret) ?? form.siret ?? ""}
              onChange={(v) => setField("siret", v.replace(/\s/g, ""))}
            />
          </div>
          <Field label="TVA intracommunautaire" value={form.vatNumber ?? ""} onChange={(v) => setField("vatNumber", v.replace(/\s/g, ""))} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Code APE / NAF" value={form.apeCode ?? ""} onChange={(v) => setField("apeCode", v)} />
            <Field label="Libellé APE" value={form.apeLabel ?? ""} onChange={(v) => setField("apeLabel", v)} />
          </div>
          <Field label="Forme juridique" value={form.legalForm ?? ""} onChange={(v) => setField("legalForm", v)} />
          <Field label="Capital social (si renseigné)" value={form.capital ?? ""} onChange={(v) => setField("capital", v)} />
          <Field label="Logo (chemin / URL existante)" value={form.logoPath ?? ""} onChange={(v) => setField("logoPath", v)} />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
      />
    </label>
  );
}
