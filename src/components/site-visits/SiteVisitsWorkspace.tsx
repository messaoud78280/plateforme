"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { SITE_VISIT_FILTERS } from "@/lib/site-visits/types";

export type VisitListItem = {
  id: string;
  clientName: string;
  siteName: string | null;
  siteAddress: string;
  scheduledAt: string | null;
  responsibleName: string | null;
  status: string;
  statusLabel: string;
  stats: {
    measurementCount: number;
    photoCount: number;
    documentCount: number;
    missingOpenCount: number;
    quantitySummary: string[];
  };
  commercialQuoteNumber: string | null;
  commercialQuoteHref: string | null;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "À planifier";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SiteVisitsWorkspace({
  initialVisits,
  canCreateQuote,
}: {
  initialVisits: VisitListItem[];
  canCreateQuote: boolean;
}) {
  const router = useRouter();
  const [visits, setVisits] = useState(initialVisits);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    siteAddress: "",
    siteName: "",
    contactName: "",
    contactPhone: "",
    subject: "",
    scheduledAt: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return visits.filter((v) => {
      if (filter !== "all" && v.status !== filter) return false;
      if (!q.trim()) return true;
      const hay = `${v.clientName} ${v.siteName ?? ""} ${v.siteAddress} ${v.responsibleName ?? ""}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [visits, filter, q]);

  async function reload() {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/site-visits?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setVisits(data.visits ?? []);
  }

  async function createVisit() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/site-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scheduledAt: form.scheduledAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setCreateOpen(false);
      setForm({
        clientName: "",
        siteAddress: "",
        siteName: "",
        contactName: "",
        contactPhone: "",
        subject: "",
        scheduledAt: "",
      });
      router.push(`/dashboard/visites-metres/${data.visit.id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createQuote(visitId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/site-visits/${visitId}/create-quote`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      if (data.href) window.open(data.href, "_blank", "noopener,noreferrer");
      await reload();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <PageHeader
        title="Visites & métrés"
        description="Terrain → avant-métré → prêt à chiffrer → devis."
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white"
        >
          + Nouvelle visite
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Client, site, commercial…"
          className="min-w-[12rem] flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
            filter === "all" ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-700",
          )}
        >
          Tous
        </button>
        {SITE_VISIT_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
              filter === f.id ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-700",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p>
      ) : null}

      <ul className="space-y-3">
        {filtered.map((v) => (
          <li
            key={v.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <Link href={`/dashboard/visites-metres/${v.id}`} className="block">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {v.siteName || v.clientName}
                  </p>
                  <p className="truncate text-sm text-slate-500">{v.siteAddress}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatWhen(v.scheduledAt)}
                    {v.responsibleName ? ` · ${v.responsibleName}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                  {v.statusLabel}
                </span>
              </div>
              {(v.stats.measurementCount > 0 || v.stats.photoCount > 0) && (
                <p className="mt-2 text-xs text-slate-600">
                  {v.stats.quantitySummary.slice(0, 2).join(" · ") ||
                    `${v.stats.measurementCount} relevé(s)`}
                  {v.stats.photoCount ? ` · ${v.stats.photoCount} photo(s)` : ""}
                  {v.stats.documentCount ? ` · ${v.stats.documentCount} doc(s)` : ""}
                </p>
              )}
            </Link>
            <div className="mt-3 flex flex-wrap gap-2">
              {v.status === "READY_TO_QUOTE" && canCreateQuote ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createQuote(v.id)}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Créer le devis →
                </button>
              ) : null}
              {v.status === "TRANSMITTED" && v.commercialQuoteHref ? (
                <a
                  href={v.commercialQuoteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#1e3a5f]"
                >
                  Ouvrir {v.commercialQuoteNumber ?? "le devis"} →
                </a>
              ) : null}
            </div>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
            Aucune visite dans ce filtre.
          </li>
        ) : null}
      </ul>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <h2 className="text-lg font-semibold text-[#1e3a5f]">Nouvelle visite</h2>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["clientName", "Client / prospect *"],
                  ["siteName", "Site (nom)"],
                  ["siteAddress", "Adresse *"],
                  ["contactName", "Contact"],
                  ["contactPhone", "Téléphone"],
                  ["subject", "Objet de la visite *"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-xs font-semibold text-slate-600">
                  {label}
                  <input
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
              ))}
              <label className="block text-xs font-semibold text-slate-600">
                Date / heure
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void createVisit()}
                className="flex-1 rounded-xl bg-[#1e3a5f] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
