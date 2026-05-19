"use client";

import { useEffect, useState, useTransition } from "react";
import type { QuoteProjectSelectOption } from "@/app/dashboard/devis/quote-actions";
import { getQuoteProjectForClientForm, saveQuoteProjectClientCoordinates } from "@/app/dashboard/devis/quote-actions";
import type { QuoteClientFormValues, QuoteClientType } from "@/lib/quote-client-form";
import { quoteProjectToClientForm } from "@/lib/quote-client-form";
import type { QuoteProject } from "@prisma/client";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-amber-50/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]/30";
const labelClass = "text-[10px] font-bold uppercase tracking-wide text-slate-500";

const emptyForm = (): QuoteClientFormValues => ({
  clientType: "particulier",
  civility: "",
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  landline: "",
  mobile: "",
  fax: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  cityName: "",
  projectName: "",
  projectAddress: "",
  projectCity: "",
  projectDepartment: "",
});

type Props = {
  open: boolean;
  onClose: () => void;
  project?: QuoteProject | null;
  editProjectId?: string | null;
  onApplied: (project: QuoteProjectSelectOption) => void;
};

export function QuoteClientCoordinatesModal({ open, onClose, project, editProjectId, onApplied }: Props) {
  const [form, setForm] = useState<QuoteClientFormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (project) {
      setForm(quoteProjectToClientForm(project));
      return;
    }
    const id = editProjectId?.trim();
    if (!id) {
      setForm(emptyForm());
      return;
    }
    setLoading(true);
    getQuoteProjectForClientForm(id)
      .then((p) => setForm(p ? quoteProjectToClientForm(p) : emptyForm()))
      .finally(() => setLoading(false));
  }, [open, project, editProjectId]);

  if (!open) return null;

  const set = <K extends keyof QuoteClientFormValues>(key: K, value: QuoteClientFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    const pid = project?.id ?? editProjectId?.trim();
    if (pid) fd.set("projectId", pid);
    fd.set("clientType", form.clientType);
    fd.set("civility", form.civility);
    fd.set("firstName", form.firstName);
    fd.set("lastName", form.lastName);
    fd.set("companyName", form.companyName);
    fd.set("email", form.email);
    fd.set("landline", form.landline);
    fd.set("mobile", form.mobile);
    fd.set("fax", form.fax);
    fd.set("addressLine1", form.addressLine1);
    fd.set("addressLine2", form.addressLine2);
    fd.set("postalCode", form.postalCode);
    fd.set("cityName", form.cityName);
    fd.set("projectName", form.projectName);
    fd.set("projectAddress", form.projectAddress);
    fd.set("projectCity", form.projectCity);
    fd.set("projectDepartment", form.projectDepartment);

    startTransition(async () => {
      const res = await saveQuoteProjectClientCoordinates(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onApplied(res.project);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-10 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="border-b border-slate-100 px-6 py-5 text-center">
            <h2 id="client-modal-title" className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Quelles sont les coordonnées de votre client ?
            </h2>
            <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => set("clientType", "professionnel")}
                className={`rounded-full px-4 py-1.5 transition ${
                  form.clientType === "professionnel" ? "bg-[#1e3a5f] text-white" : "text-slate-600"
                }`}
              >
                Client professionnel
              </button>
              <button
                type="button"
                onClick={() => set("clientType", "particulier")}
                className={`rounded-full px-4 py-1.5 transition ${
                  form.clientType === "particulier" ? "bg-[#1e3a5f] text-white" : "text-slate-600"
                }`}
              >
                Client particulier
              </button>
            </div>
          </div>

          <div className="space-y-6 px-6 py-5">
            {loading ? <p className="text-center text-sm text-slate-500">Chargement…</p> : null}
            <section className={loading ? "pointer-events-none opacity-50" : ""}>
              <p className="mb-3 text-xs font-bold text-slate-700">Contact</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Civilité</label>
                  <select value={form.civility} onChange={(e) => set("civility", e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                    <option value="Mlle">Mlle</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Nom</label>
                  <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputClass} required={form.clientType === "particulier"} />
                </div>
                <div>
                  <label className={labelClass}>Prénom</label>
                  <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputClass} />
                </div>
              </div>
              {form.clientType === "professionnel" ? (
                <div className="mt-3">
                  <label className={labelClass}>Raison sociale</label>
                  <input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} className={inputClass} />
                </div>
              ) : null}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Téléphone mobile</label>
                  <input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} className={inputClass} placeholder="+33 6 …" />
                </div>
                <div>
                  <label className={labelClass}>Téléphone fixe</label>
                  <input value={form.landline} onChange={(e) => set("landline", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Fax</label>
                  <input value={form.fax} onChange={(e) => set("fax", e.target.value)} className={inputClass} />
                </div>
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-bold text-slate-700">Adresse client</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Adresse</label>
                  <input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Complément d&apos;adresse</label>
                  <input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} className={inputClass} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Code postal</label>
                    <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Ville</label>
                    <input value={form.cityName} onChange={(e) => set("cityName", e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-bold text-slate-700">Projet / chantier</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Intitulé du projet *</label>
                  <input value={form.projectName} onChange={(e) => set("projectName", e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Adresse chantier</label>
                  <input value={form.projectAddress} onChange={(e) => set("projectAddress", e.target.value)} className={inputClass} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Ville chantier</label>
                    <input value={form.projectCity} onChange={(e) => set("projectCity", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Département</label>
                    <input value={form.projectDepartment} onChange={(e) => set("projectDepartment", e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
            </section>

            {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button type="button" onClick={onClose} className="text-sm font-semibold text-red-600 hover:text-red-700">
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {pending ? "Enregistrement…" : "Appliquer au document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
