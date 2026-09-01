"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CommercialLead, CommercialLeadStatus } from "@prisma/client";
import {
  COMMERCIAL_LEAD_STATUSES,
  leadDisplayName,
} from "@/lib/commercial/leads/labels";

type LeadDetail = CommercialLead & {
  agendaEvents: Array<{
    id: string;
    title: string;
    startAt: Date | string;
    endAt: Date | string;
    location: string | null;
    status: string;
  }>;
};

export function LeadDetailClient({ lead }: { lead: LeadDetail }) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rdv, setRdv] = useState({
    date: "",
    time: "11:30",
    durationMin: "60",
    location: lead.addressLine1 ?? "",
    notes: "",
  });

  async function saveStatus(next: CommercialLeadStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", leadId: lead.id, status: next, notes }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Mise à jour impossible");
        return;
      }
      setStatus(next);
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  async function scheduleRdv(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const startAt = new Date(`${rdv.date}T${rdv.time}:00`);
      const endAt = new Date(startAt.getTime() + Number(rdv.durationMin || 60) * 60_000);
      const res = await fetch("/api/commercial/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          leadId: lead.id,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          location: rdv.location,
          notes: rdv.notes,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "RDV impossible");
        return;
      }
      setStatus("RDV_PLANIFIE");
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  async function convert() {
    if (!window.confirm("Créer un client BeWork à partir de ce lead ?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert", leadId: lead.id }),
      });
      const data = (await res.json()) as { href?: string; error?: string };
      if (!res.ok || !data.href) {
        setError(data.error || "Conversion impossible");
        return;
      }
      router.push(data.href);
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Lead</p>
          <h1 className="text-2xl font-semibold text-[#1e3a5f]">{leadDisplayName(lead)}</h1>
          <p className="mt-1 text-[13px] text-slate-600">
            {[lead.addressLine1, lead.postalCode, lead.city].filter(Boolean).join(", ") ||
              "Adresse à compléter"}
          </p>
        </div>
        <Link href="/dashboard/leads" className="text-[13px] font-medium text-slate-500 hover:underline">
          ← Retour aux leads
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Téléphone", lead.phone || "—"],
          ["Email", lead.email || "—"],
          ["Travaux", lead.workType || "—"],
          ["Source", lead.sourceSite || "—"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{k}</p>
            <p className="mt-0.5 text-[14px] font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </div>

      {lead.needDescription ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-[14px] font-semibold text-[#1e3a5f]">Besoin</h2>
          <p className="mt-2 whitespace-pre-wrap text-[13px] text-slate-700">{lead.needDescription}</p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-[14px] font-semibold text-[#1e3a5f]">Statut</h2>
        <select
          className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={status}
          disabled={busy}
          onChange={(e) => void saveStatus(e.target.value as CommercialLeadStatus)}
        >
          {COMMERCIAL_LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <textarea
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          rows={3}
          placeholder="Notes internes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => void saveStatus(status)}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-[14px] font-semibold text-[#1e3a5f]">Planifier un rendez-vous</h2>
        <form onSubmit={(e) => void scheduleRdv(e)} className="grid gap-2 sm:grid-cols-2">
          <input
            required
            type="date"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={rdv.date}
            onChange={(e) => setRdv((r) => ({ ...r, date: e.target.value }))}
          />
          <input
            required
            type="time"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={rdv.time}
            onChange={(e) => setRdv((r) => ({ ...r, time: e.target.value }))}
          />
          <input
            type="number"
            min={15}
            step={15}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={rdv.durationMin}
            onChange={(e) => setRdv((r) => ({ ...r, durationMin: e.target.value }))}
            placeholder="Durée (min)"
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={rdv.location}
            onChange={(e) => setRdv((r) => ({ ...r, location: e.target.value }))}
            placeholder="Adresse du RDV"
          />
          <textarea
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            rows={2}
            value={rdv.notes}
            onChange={(e) => setRdv((r) => ({ ...r, notes: e.target.value }))}
            placeholder="Objet / notes de visite"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2"
          >
            Enregistrer le rendez-vous
          </button>
        </form>

        {lead.agendaEvents.length > 0 ? (
          <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {lead.agendaEvents.map((ev) => (
              <li key={ev.id} className="text-[13px]">
                <Link
                  href={`/dashboard/agenda?event=${ev.id}`}
                  className="font-semibold text-[#1d4ed8] hover:underline"
                >
                  {new Date(ev.startAt).toLocaleString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Paris",
                  })}
                </Link>
                <span className="text-slate-600"> — {ev.title}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/devis-facturation/devis/nouveau?leadId=${lead.id}`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
        >
          Préparer un devis
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => void convert()}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Convertir en client
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-950">
          {error}
        </p>
      ) : null}
    </div>
  );
}
