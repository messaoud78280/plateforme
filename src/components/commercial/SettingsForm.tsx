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
  quoteDocumentSettingsJson: {
    showBankOnQuote?: boolean;
    paymentModeLabel?: string | null;
    wasteManagementText?: string | null;
    wasteCostLabel?: string | null;
    quoteFeeLabel?: string | null;
    acceptanceText?: string | null;
    cgvText?: string | null;
    footerText?: string | null;
    requireInsurance?: boolean;
    requireWaste?: boolean;
    requireExecutionDuration?: boolean;
  };
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
          <Field
            label="Taux de marque cible (%)"
            hint="(PV − coût) / PV — méthode principale de chiffrage"
          >
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
            label="Seuil d’alerte (taux de marque %)"
            hint="Alerte indicative — n’empêche pas la validation. N’altère pas les devis figés."
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
          <Field
            label="Heures / journée"
            hint="Nouveaux calculs journées-personne uniquement — ne réécrit pas les snapshots de devis"
          >
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

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Documents commerciaux (PDF devis)
        </h2>
        <p className="text-[11px] text-slate-500">
          Personnalisation du devis PDF V2 — pas de conseil juridique automatique.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(form.quoteDocumentSettingsJson?.showBankOnQuote)}
            onChange={(e) =>
              set("quoteDocumentSettingsJson", {
                ...form.quoteDocumentSettingsJson,
                showBankOnQuote: e.target.checked,
              })
            }
          />
          Afficher IBAN / BIC sur le devis
        </label>
        <Field label="Mode de règlement">
          <input
            className={inputCls}
            placeholder="Virement bancaire"
            value={form.quoteDocumentSettingsJson?.paymentModeLabel ?? ""}
            onChange={(e) =>
              set("quoteDocumentSettingsJson", {
                ...form.quoteDocumentSettingsJson,
                paymentModeLabel: e.target.value || null,
              })
            }
          />
        </Field>
        <Field label="Devis gratuit / payant (libellé PDF)">
          <input
            className={inputCls}
            placeholder="Laisser vide pour ne pas afficher"
            value={form.quoteDocumentSettingsJson?.quoteFeeLabel ?? ""}
            onChange={(e) =>
              set("quoteDocumentSettingsJson", {
                ...form.quoteDocumentSettingsJson,
                quoteFeeLabel: e.target.value || null,
              })
            }
          />
        </Field>
        <Field label="Gestion des déchets">
          <textarea
            rows={2}
            className={inputCls}
            value={form.quoteDocumentSettingsJson?.wasteManagementText ?? ""}
            onChange={(e) =>
              set("quoteDocumentSettingsJson", {
                ...form.quoteDocumentSettingsJson,
                wasteManagementText: e.target.value || null,
              })
            }
          />
        </Field>
        <Field label="Coût déchets (libellé)">
          <input
            className={inputCls}
            placeholder="Inclus / 350 €…"
            value={form.quoteDocumentSettingsJson?.wasteCostLabel ?? ""}
            onChange={(e) =>
              set("quoteDocumentSettingsJson", {
                ...form.quoteDocumentSettingsJson,
                wasteCostLabel: e.target.value || null,
              })
            }
          />
        </Field>
        <Field label="Texte bon pour accord">
          <textarea
            rows={2}
            className={inputCls}
            value={form.quoteDocumentSettingsJson?.acceptanceText ?? ""}
            onChange={(e) =>
              set("quoteDocumentSettingsJson", {
                ...form.quoteDocumentSettingsJson,
                acceptanceText: e.target.value || null,
              })
            }
          />
        </Field>
        <Field label="CGV (annexe PDF)">
          <textarea
            rows={4}
            className={inputCls}
            value={form.quoteDocumentSettingsJson?.cgvText ?? ""}
            onChange={(e) =>
              set("quoteDocumentSettingsJson", {
                ...form.quoteDocumentSettingsJson,
                cgvText: e.target.value || null,
              })
            }
          />
        </Field>
        <Field label="Pied de page additionnel">
          <input
            className={inputCls}
            value={form.quoteDocumentSettingsJson?.footerText ?? ""}
            onChange={(e) =>
              set("quoteDocumentSettingsJson", {
                ...form.quoteDocumentSettingsJson,
                footerText: e.target.value || null,
              })
            }
          />
        </Field>
        <div className="grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(form.quoteDocumentSettingsJson?.requireInsurance)}
              onChange={(e) =>
                set("quoteDocumentSettingsJson", {
                  ...form.quoteDocumentSettingsJson,
                  requireInsurance: e.target.checked,
                })
              }
            />
            Alerter si assurance absente
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(form.quoteDocumentSettingsJson?.requireWaste)}
              onChange={(e) =>
                set("quoteDocumentSettingsJson", {
                  ...form.quoteDocumentSettingsJson,
                  requireWaste: e.target.checked,
                })
              }
            />
            Alerter si déchets absents
          </label>
        </div>
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
