"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CommercialLead, CommercialLeadStatus } from "@prisma/client";
import {
  COMMERCIAL_LEAD_STATUSES,
  leadDisplayName,
  leadStatusLabel,
} from "@/lib/commercial/leads/labels";
import { cn } from "@/lib/cn";

type LeadRow = Pick<
  CommercialLead,
  | "id"
  | "firstName"
  | "lastName"
  | "phone"
  | "email"
  | "city"
  | "postalCode"
  | "status"
  | "workType"
  | "nextAppointmentAt"
  | "createdAt"
>;

export function LeadsBoard({ initialLeads }: { initialLeads: LeadRow[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<CommercialLeadStatus | "ALL">("ALL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    postalCode: "",
    addressLine1: "",
    workType: "",
    needDescription: "",
    sourceSite: "",
  });

  const visible = useMemo(
    () => (filter === "ALL" ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter],
  );

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form }),
      });
      const data = (await res.json()) as { lead?: LeadRow; error?: string };
      if (!res.ok || !data.lead) {
        setError(data.error || "Création impossible");
        return;
      }
      setLeads((prev) => [data.lead!, ...prev]);
      setShowForm(false);
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        city: "",
        postalCode: "",
        addressLine1: "",
        workType: "",
        needDescription: "",
        sourceSite: "",
      });
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold",
              filter === "ALL" ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-700",
            )}
          >
            Tous ({leads.length})
          </button>
          {COMMERCIAL_LEAD_STATUSES.map((s) => {
            const n = leads.filter((l) => l.status === s.value).length;
            if (n === 0 && s.value !== "NOUVEAU") return null;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setFilter(s.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold",
                  filter === s.value ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-700",
                )}
              >
                {s.label} ({n})
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white"
        >
          + Nouveau lead
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={(e) => void createLead(e)}
          className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Prénom *"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
          <input
            required
            placeholder="Nom *"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
          <input
            placeholder="Téléphone"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <input
            placeholder="Email"
            type="email"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            placeholder="Commune"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <input
            placeholder="Code postal"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.postalCode}
            onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
          />
          <input
            placeholder="Adresse"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            value={form.addressLine1}
            onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
          />
          <input
            placeholder="Type de travaux"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.workType}
            onChange={(e) => setForm((f) => ({ ...f, workType: e.target.value }))}
          />
          <input
            placeholder="Site source"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.sourceSite}
            onChange={(e) => setForm((f) => ({ ...f, sourceSite: e.target.value }))}
          />
          <textarea
            placeholder="Description du besoin"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            rows={3}
            value={form.needDescription}
            onChange={(e) => setForm((f) => ({ ...f, needDescription: e.target.value }))}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-950">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-[#1e3a5f]">Aucun lead pour l’instant</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Créez votre premier prospect pour démarrer le cycle lead → RDV → devis → chantier.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {visible.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/dashboard/leads/${lead.id}`}
                className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 hover:bg-slate-50/80"
              >
                <div>
                  <p className="font-semibold text-slate-900">{leadDisplayName(lead)}</p>
                  <p className="text-[12px] text-slate-500">
                    {[lead.city, lead.postalCode, lead.phone, lead.email]
                      .filter(Boolean)
                      .join(" · ") || "Coordonnées à compléter"}
                  </p>
                  {lead.workType ? (
                    <p className="mt-0.5 text-[12px] text-slate-600">{lead.workType}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {leadStatusLabel(lead.status)}
                  </span>
                  {lead.nextAppointmentAt ? (
                    <p className="mt-1 text-[11px] font-medium text-[#1d4ed8]">
                      RDV{" "}
                      {new Date(lead.nextAppointmentAt).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/Paris",
                      })}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
