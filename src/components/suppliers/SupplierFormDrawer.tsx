"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";

export const SUPPLIER_ACTIVITY_OPTIONS = [
  "Matériaux",
  "Location",
  "Étanchéité",
  "Électricité",
  "Plomberie",
  "Transport",
  "Sous-traitance",
  "Autre",
] as const;

export type SupplierFormValues = {
  name: string;
  activity: string;
  phone: string;
  email: string;
  address: string;
  zipCode: string;
  city: string;
  website: string;
  siret: string;
  paymentTerms: string;
  notes: string;
  contactFirstName: string;
  contactLastName: string;
  contactJobTitle: string;
  contactPhone: string;
  contactEmail: string;
};

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  name: "",
  activity: "",
  phone: "",
  email: "",
  address: "",
  zipCode: "",
  city: "",
  website: "",
  siret: "",
  paymentTerms: "",
  notes: "",
  contactFirstName: "",
  contactLastName: "",
  contactJobTitle: "",
  contactPhone: "",
  contactEmail: "",
};

type Duplicate = {
  id: string;
  name: string;
  tradeName: string | null;
  siret: string | null;
  email: string | null;
  city: string | null;
  reason: "siret" | "email" | "name";
};

function fieldClass() {
  return "bw-search mt-1 w-full";
}

function toPayload(values: SupplierFormValues) {
  const hasContact =
    values.contactFirstName.trim().length > 0 && values.contactLastName.trim().length > 0;
  return {
    name: values.name.trim(),
    activity: values.activity.trim() || null,
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    address: values.address.trim() || null,
    zipCode: values.zipCode.trim() || null,
    city: values.city.trim() || null,
    website: values.website.trim() || null,
    siret: values.siret.trim() || null,
    paymentTerms: values.paymentTerms.trim() || null,
    notes: values.notes.trim() || null,
    contact: hasContact
      ? {
          firstName: values.contactFirstName.trim(),
          lastName: values.contactLastName.trim(),
          jobTitle: values.contactJobTitle.trim() || null,
          phone: values.contactPhone.trim() || null,
          email: values.contactEmail.trim() || null,
        }
      : null,
  };
}

export function SupplierFormDrawer({
  open,
  onClose,
  mode,
  initial,
  supplierId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: Partial<SupplierFormValues> | null;
  supplierId?: string | null;
  onSaved: (supplier: { id: string; name: string }) => void;
}) {
  const [values, setValues] = useState<SupplierFormValues>(EMPTY_SUPPLIER_FORM);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [blockedBySiret, setBlockedBySiret] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues({ ...EMPTY_SUPPLIER_FORM, ...initial });
    setError("");
    setDuplicates([]);
    setBlockedBySiret(false);
    setCompanyOpen(Boolean(initial?.siret || initial?.notes || initial?.paymentTerms));
  }, [open, initial]);

  function setField<K extends keyof SupplierFormValues>(key: K, value: SupplierFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(forceCreate = false) {
    if (!values.name.trim()) {
      setError("Le nom du fournisseur est obligatoire.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = { ...toPayload(values), forceCreate };
      const res =
        mode === "edit" && supplierId
          ? await fetch(`/api/suppliers/${supplierId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch("/api/suppliers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setDuplicates(Array.isArray(data.duplicates) ? data.duplicates : []);
        setBlockedBySiret(Boolean(data.blockedBySiret));
        setError(
          typeof data.error === "string" ? data.error : "Un fournisseur similaire existe déjà",
        );
        return;
      }

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Enregistrement impossible.");
        return;
      }

      const id =
        data.organization?.id ??
        supplierId ??
        data.id;
      const name = data.organization?.name ?? values.name.trim();
      onSaved({ id, name });
      onClose();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Modifier le fournisseur" : "Nouveau fournisseur"}
      description="Ajoutez une entreprise à votre référentiel fournisseurs."
      widthClass="max-w-lg sm:max-w-xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-cc-secondary !min-h-10 !text-sm">
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit(false)}
            className="btn-cc-primary !min-h-10 !text-sm"
          >
            {busy ? "Enregistrement…" : mode === "edit" ? "Enregistrer" : "Créer"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="space-y-3">
          <label className="block text-xs font-semibold text-bework-muted">
            Nom de l’entreprise *
            <input
              value={values.name}
              onChange={(e) => setField("name", e.target.value)}
              className={fieldClass()}
              placeholder="Ex. POINT.P Guyancourt"
              required
              autoFocus
            />
          </label>
          <label className="block text-xs font-semibold text-bework-muted">
            Catégorie / activité
            <select
              value={values.activity}
              onChange={(e) => setField("activity", e.target.value)}
              className={fieldClass()}
            >
              <option value="">À préciser</option>
              {SUPPLIER_ACTIVITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-bework-muted">
              Téléphone
              <input
                value={values.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={fieldClass()}
                inputMode="tel"
              />
            </label>
            <label className="block text-xs font-semibold text-bework-muted">
              Email
              <input
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
                className={fieldClass()}
                type="email"
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-bework-muted">
            Adresse
            <input
              value={values.address}
              onChange={(e) => setField("address", e.target.value)}
              className={fieldClass()}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-bework-muted">
              Code postal
              <input
                value={values.zipCode}
                onChange={(e) => setField("zipCode", e.target.value)}
                className={fieldClass()}
              />
            </label>
            <label className="block text-xs font-semibold text-bework-muted">
              Ville
              <input
                value={values.city}
                onChange={(e) => setField("city", e.target.value)}
                className={fieldClass()}
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-bework-muted">
            Site web
            <input
              value={values.website}
              onChange={(e) => setField("website", e.target.value)}
              className={fieldClass()}
              placeholder="https://"
            />
          </label>
        </section>

        <section className="rounded-xl border border-bework-navy/10 bg-bework-chrome/60">
          <button
            type="button"
            onClick={() => setCompanyOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3.5 py-3 text-left text-sm font-semibold text-bework-navy"
          >
            Informations entreprise
            <span className="text-bework-muted">{companyOpen ? "−" : "+"}</span>
          </button>
          {companyOpen ? (
            <div className="space-y-3 border-t border-bework-navy/10 px-3.5 pb-3.5 pt-3">
              <label className="block text-xs font-semibold text-bework-muted">
                SIRET
                <input
                  value={values.siret}
                  onChange={(e) => setField("siret", e.target.value)}
                  className={fieldClass()}
                  inputMode="numeric"
                />
              </label>
              <label className="block text-xs font-semibold text-bework-muted">
                Conditions de règlement
                <input
                  value={values.paymentTerms}
                  onChange={(e) => setField("paymentTerms", e.target.value)}
                  className={fieldClass()}
                  placeholder="Ex. 30 jours fin de mois"
                />
              </label>
              <label className="block text-xs font-semibold text-bework-muted">
                Notes internes
                <textarea
                  value={values.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-bework-navy-deep">Contact principal</h3>
          <p className="text-xs text-bework-muted">Optionnel — complétable plus tard.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-bework-muted">
              Prénom
              <input
                value={values.contactFirstName}
                onChange={(e) => setField("contactFirstName", e.target.value)}
                className={fieldClass()}
              />
            </label>
            <label className="block text-xs font-semibold text-bework-muted">
              Nom
              <input
                value={values.contactLastName}
                onChange={(e) => setField("contactLastName", e.target.value)}
                className={fieldClass()}
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-bework-muted">
            Fonction
            <input
              value={values.contactJobTitle}
              onChange={(e) => setField("contactJobTitle", e.target.value)}
              className={fieldClass()}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-bework-muted">
              Téléphone
              <input
                value={values.contactPhone}
                onChange={(e) => setField("contactPhone", e.target.value)}
                className={fieldClass()}
                inputMode="tel"
              />
            </label>
            <label className="block text-xs font-semibold text-bework-muted">
              Email
              <input
                value={values.contactEmail}
                onChange={(e) => setField("contactEmail", e.target.value)}
                className={fieldClass()}
                type="email"
              />
            </label>
          </div>
        </section>

        {error ? (
          <div
            className={cn(
              "rounded-xl border px-3.5 py-3 text-sm",
              duplicates.length
                ? "border-bework-watch/30 bg-[color:var(--bw-soft-watch)] text-amber-950"
                : "border-bework-critical/25 bg-[color:var(--bw-soft-critical)] text-bework-critical",
            )}
          >
            <p className="font-semibold">{error}</p>
            {duplicates.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {duplicates.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 px-2.5 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-900">
                        {d.tradeName || d.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {[d.city, d.siret, d.reason === "siret" ? "SIRET" : d.reason === "email" ? "Email" : "Nom"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <Link
                      href={`/dashboard/fournisseurs/${d.id}`}
                      className="text-[12px] font-semibold text-bework-accent hover:underline"
                      onClick={onClose}
                    >
                      Ouvrir
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {duplicates.length > 0 && !blockedBySiret && mode === "create" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit(true)}
                className="mt-3 text-[12px] font-semibold text-bework-navy underline"
              >
                Créer quand même
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
