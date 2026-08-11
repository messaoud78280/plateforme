"use client";

import { useState } from "react";

export type CommercialSettingsFormValues = {
  defaultVatRate: number;
  defaultCurrency: string;
  targetMarginPercent: number | null;
  minMarginPercent: number | null;
  defaultPaymentTerms: string | null;
  defaultValidityDays: number | null;
  defaultDepositPercent: number | null;
  workDayHours: number;
  bankIban: string | null;
  bankBic: string | null;
  bankName: string | null;
  insuranceMentions: string | null;
  legalMentions: string | null;
  quoteMentions: string | null;
  invoiceMentions: string | null;
  accentColor: string | null;
  quotePrefix: string;
  invoicePrefix: string;
  amendmentPrefix: string;
  creditPrefix: string;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900";

export function SettingsForm({ initial }: { initial: CommercialSettingsFormValues }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CommercialSettingsFormValues>(
    key: K,
    value: CommercialSettingsFormValues[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/commercial/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.settings) setForm({ ...form, ...data.settings });
      setMsg("Paramètres enregistrés");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Chiffrage & marge</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="TVA par défaut (%)">
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.defaultVatRate}
              onChange={(e) => set("defaultVatRate", Number(e.target.value))}
            />
          </Field>
          <Field label="Devise">
            <input
              className={inputCls}
              value={form.defaultCurrency}
              onChange={(e) => set("defaultCurrency", e.target.value)}
            />
          </Field>
          <Field label="Marge cible (%)" hint="Taux de marque souhaité">
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.targetMarginPercent ?? ""}
              onChange={(e) =>
                set(
                  "targetMarginPercent",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Field>
          <Field
            label="Seuil d’alerte marge (%)"
            hint="Alerte indicative — n’empêche pas la validation"
          >
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.minMarginPercent ?? ""}
              onChange={(e) =>
                set(
                  "minMarginPercent",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Field>
          <Field label="Validité devis (jours)">
            <input
              type="number"
              className={inputCls}
              value={form.defaultValidityDays ?? ""}
              onChange={(e) =>
                set(
                  "defaultValidityDays",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Field>
          <Field label="Acompte par défaut (%)">
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.defaultDepositPercent ?? ""}
              onChange={(e) =>
                set(
                  "defaultDepositPercent",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Field>
          <Field label="Heures / journée" hint="Pour estimation journées-personne">
            <input
              type="number"
              step="0.25"
              className={inputCls}
              value={form.workDayHours}
              onChange={(e) => set("workDayHours", Number(e.target.value))}
            />
          </Field>
          <Field label="Conditions de paiement">
            <input
              className={inputCls}
              value={form.defaultPaymentTerms ?? ""}
              onChange={(e) => set("defaultPaymentTerms", e.target.value || null)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Numérotation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Préfixe devis">
            <input
              className={inputCls}
              value={form.quotePrefix}
              onChange={(e) => set("quotePrefix", e.target.value)}
            />
          </Field>
          <Field label="Préfixe facture">
            <input
              className={inputCls}
              value={form.invoicePrefix}
              onChange={(e) => set("invoicePrefix", e.target.value)}
            />
          </Field>
          <Field label="Préfixe avenant">
            <input
              className={inputCls}
              value={form.amendmentPrefix}
              onChange={(e) => set("amendmentPrefix", e.target.value)}
            />
          </Field>
          <Field label="Préfixe avoir">
            <input
              className={inputCls}
              value={form.creditPrefix}
              onChange={(e) => set("creditPrefix", e.target.value)}
            />
          </Field>
          <Field label="Couleur accent PDF (#hex)">
            <input
              className={inputCls}
              placeholder="#1e3a5f"
              value={form.accentColor ?? ""}
              onChange={(e) => set("accentColor", e.target.value || null)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Banque</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="IBAN">
            <input
              className={inputCls}
              value={form.bankIban ?? ""}
              onChange={(e) => set("bankIban", e.target.value || null)}
            />
          </Field>
          <Field label="BIC">
            <input
              className={inputCls}
              value={form.bankBic ?? ""}
              onChange={(e) => set("bankBic", e.target.value || null)}
            />
          </Field>
          <Field label="Banque">
            <input
              className={inputCls}
              value={form.bankName ?? ""}
              onChange={(e) => set("bankName", e.target.value || null)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Mentions</h2>
        <Field label="Mentions devis">
          <textarea
            rows={3}
            className={inputCls}
            value={form.quoteMentions ?? ""}
            onChange={(e) => set("quoteMentions", e.target.value || null)}
          />
        </Field>
        <Field label="Mentions facture">
          <textarea
            rows={3}
            className={inputCls}
            value={form.invoiceMentions ?? ""}
            onChange={(e) => set("invoiceMentions", e.target.value || null)}
          />
        </Field>
        <Field label="Assurances">
          <textarea
            rows={2}
            className={inputCls}
            value={form.insuranceMentions ?? ""}
            onChange={(e) => set("insuranceMentions", e.target.value || null)}
          />
        </Field>
        <Field label="Mentions légales">
          <textarea
            rows={2}
            className={inputCls}
            value={form.legalMentions ?? ""}
            onChange={(e) => set("legalMentions", e.target.value || null)}
          />
        </Field>
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {busy ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
