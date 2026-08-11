"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  COMMERCIAL_QUOTE_STATUS_LABELS,
  roundMoney,
} from "@/lib/commercial/money";
function fmtMoney(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Line = {
  id: string;
  sectionId: string | null;
  kind: string;
  reference: string | null;
  designation: string;
  quantity: number;
  unit: string;
  unitCostHt: number;
  unitSellHt: number;
  discountPercent: number;
  vatRate: number;
  lineSellHt: number;
  lineCostHt: number;
  sortOrder: number;
  isOptional: boolean;
};

type Section = { id: string; title: string; sortOrder: number };

type QuoteDetail = {
  id: string;
  number: string;
  subject: string;
  status: string;
  totalCostHt: number;
  totalSellHt: number;
  totalVat: number;
  totalTtc: number;
  marginAmount: number;
  marginPercent: number;
  currentVersion: {
    id: string;
    versionNumber: number;
    lockState: string;
    sections: Section[];
    lines: Line[];
  } | null;
  clientExternalOrg: { name: string; tradeName: string | null } | null;
  project: { id: string; title: string } | null;
};

export function QuoteEditor({
  initial,
  canEdit,
}: {
  initial: QuoteDetail;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [quote, setQuote] = useState(initial);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busyStatus, setBusyStatus] = useState(false);

  const version = quote.currentVersion;
  const lines = version?.lines ?? [];
  const sections = useMemo(
    () => [...(version?.sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [version?.sections],
  );

  const patchLine = useCallback(
    async (lineId: string, patch: Record<string, unknown>) => {
      if (!canEdit) return;
      setSaveState("saving");
      setError(null);
      try {
        const res = await fetch(`/api/commercial/quotes/${quote.id}/lines/${lineId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        const detail = await fetch(`/api/commercial/quotes/${quote.id}`).then((r) => r.json());
        if (detail.quote) setQuote(detail.quote);
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
        setError(e instanceof Error ? e.message : "Erreur");
      }
    },
    [canEdit, quote.id],
  );

  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setTimeout(() => setSaveState("idle"), 1500);
    return () => clearTimeout(t);
  }, [saveState]);

  async function addSection() {
    const title = prompt("Titre du chapitre", "Nouveau chapitre");
    if (!title?.trim()) return;
    setSaveState("saving");
    const res = await fetch(`/api/commercial/quotes/${quote.id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveState("error");
      setError(data.error || "Erreur");
      return;
    }
    const detail = await fetch(`/api/commercial/quotes/${quote.id}`).then((r) => r.json());
    if (detail.quote) setQuote(detail.quote);
    setSaveState("saved");
  }

  async function addLine(sectionId: string | null) {
    setSaveState("saving");
    const res = await fetch(`/api/commercial/quotes/${quote.id}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId,
        designation: "Nouvelle ligne",
        quantity: 1,
        unit: "U",
        unitSellHt: 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveState("error");
      setError(data.error || "Erreur");
      return;
    }
    const detail = await fetch(`/api/commercial/quotes/${quote.id}`).then((r) => r.json());
    if (detail.quote) setQuote(detail.quote);
    setSaveState("saved");
  }

  async function deleteLine(lineId: string) {
    if (!confirm("Supprimer cette ligne ?")) return;
    setSaveState("saving");
    const res = await fetch(`/api/commercial/quotes/${quote.id}/lines/${lineId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setSaveState("error");
      setError(data.error || "Erreur");
      return;
    }
    const detail = await fetch(`/api/commercial/quotes/${quote.id}`).then((r) => r.json());
    if (detail.quote) setQuote(detail.quote);
    setSaveState("saved");
  }

  async function setStatus(toStatus: string) {
    setBusyStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quote.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const detail = await fetch(`/api/commercial/quotes/${quote.id}`).then((r) => r.json());
      if (detail.quote) setQuote(detail.quote);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyStatus(false);
    }
  }

  const saveLabel =
    saveState === "saving"
      ? "Enregistrement…"
      : saveState === "saved"
        ? "Enregistré"
        : saveState === "error"
          ? "Erreur d’enregistrement"
          : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {quote.number} · V{version?.versionNumber ?? 1}
            </p>
            <h1 className="text-xl font-extrabold text-slate-950">{quote.subject}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {quote.clientExternalOrg?.tradeName ||
                quote.clientExternalOrg?.name ||
                "Client à préciser"}
              {quote.project ? ` · ${quote.project.title}` : ""}
            </p>
            <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {COMMERCIAL_QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
            </span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-slate-500">{saveLabel}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <a
                href={`/api/commercial/quotes/${quote.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#1e3a5f]"
              >
                PDF
              </a>
              {quote.status === "DRAFT" || quote.status === "VALIDATED" ? (
                <button
                  type="button"
                  disabled={busyStatus}
                  onClick={() => void setStatus("SENT")}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
                >
                  Marquer envoyé
                </button>
              ) : null}
              {quote.status === "SENT" || quote.status === "VIEWED" ? (
                <button
                  type="button"
                  disabled={busyStatus}
                  onClick={() => void setStatus("ACCEPTED")}
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                >
                  Accepté
                </button>
              ) : null}
            </div>
          </div>
        </header>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {canEdit ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void addSection()}
              className="text-xs font-semibold text-[#1d4ed8]"
            >
              + Chapitre
            </button>
            <button
              type="button"
              onClick={() => void addLine(sections[0]?.id ?? null)}
              className="text-xs font-semibold text-[#1d4ed8]"
            >
              + Ligne
            </button>
          </div>
        ) : (
          <p className="text-xs text-amber-800">
            Document verrouillé — créez une nouvelle version pour modifier (V1.1) ou un avenant.
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-12 gap-1 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase text-slate-500 md:grid">
            <div className="col-span-4">Désignation</div>
            <div className="col-span-1">Qté</div>
            <div className="col-span-1">Unité</div>
            <div className="col-span-2">PU HT</div>
            <div className="col-span-1">Rem.</div>
            <div className="col-span-2">Total HT</div>
            <div className="col-span-1" />
          </div>

          {sections.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Aucun chapitre. Ajoutez un chapitre pour commencer.</p>
          ) : (
            sections.map((sec) => {
              const secLines = lines
                .filter((l) => l.sectionId === sec.id)
                .sort((a, b) => a.sortOrder - b.sortOrder);
              return (
                <div key={sec.id} className="border-b border-slate-100">
                  <div className="flex items-center justify-between bg-slate-50/80 px-3 py-2">
                    <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => void addLine(sec.id)}
                        className="text-[11px] font-semibold text-[#1d4ed8]"
                      >
                        + Ligne
                      </button>
                    ) : null}
                  </div>
                  {secLines.map((line) => (
                    <LineRow
                      key={line.id}
                      line={line}
                      canEdit={canEdit}
                      onPatch={(p) => void patchLine(line.id, p)}
                      onDelete={() => void deleteLine(line.id)}
                    />
                  ))}
                </div>
              );
            })
          )}

          {/* lignes sans section */}
          {lines.some((l) => !l.sectionId) ? (
            <div className="border-b border-slate-100">
              <div className="px-3 py-2 text-xs font-bold text-slate-500">Sans chapitre</div>
              {lines
                .filter((l) => !l.sectionId)
                .map((line) => (
                  <LineRow
                    key={line.id}
                    line={line}
                    canEdit={canEdit}
                    onPatch={(p) => void patchLine(line.id, p)}
                    onDelete={() => void deleteLine(line.id)}
                  />
                ))}
            </div>
          ) : null}
        </div>

        {quote.status === "ACCEPTED" ? (
          <AcceptedActions quoteId={quote.id} />
        ) : null}
      </div>

      <aside className="h-fit space-y-3 rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Synthèse</p>
        <Row label="Déboursé" value={`${fmtMoney(quote.totalCostHt)} €`} />
        <Row
          label="Marge"
          value={`${fmtMoney(quote.marginAmount)} € (${fmtMoney(quote.marginPercent)} %)`}
        />
        <Row label="Total HT" value={`${fmtMoney(quote.totalSellHt)} €`} bold />
        <Row label="TVA" value={`${fmtMoney(quote.totalVat)} €`} />
        <Row label="Total TTC" value={`${fmtMoney(quote.totalTtc)} €`} bold />
      </aside>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-slate-900" : "tabular-nums text-slate-800"}>
        {value}
      </span>
    </div>
  );
}

function LineRow({
  line,
  canEdit,
  onPatch,
  onDelete,
}: {
  line: Line;
  canEdit: boolean;
  onPatch: (p: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [des, setDes] = useState(line.designation);
  const [qty, setQty] = useState(String(line.quantity));
  const [unit, setUnit] = useState(line.unit);
  const [pu, setPu] = useState(String(line.unitSellHt));
  const [rem, setRem] = useState(String(line.discountPercent));

  useEffect(() => {
    setDes(line.designation);
    setQty(String(line.quantity));
    setUnit(line.unit);
    setPu(String(line.unitSellHt));
    setRem(String(line.discountPercent));
  }, [line]);

  function commit() {
    onPatch({
      designation: des,
      quantity: Number(qty),
      unit,
      unitSellHt: Number(pu),
      discountPercent: Number(rem),
    });
  }

  return (
    <div className="grid grid-cols-1 gap-2 border-t border-slate-50 px-3 py-2 md:grid-cols-12 md:items-center">
      <input
        disabled={!canEdit}
        value={des}
        onChange={(e) => setDes(e.target.value)}
        onBlur={commit}
        className="rounded border border-slate-200 px-2 py-1.5 text-sm md:col-span-4"
      />
      <input
        disabled={!canEdit}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        onBlur={commit}
        className="rounded border border-slate-200 px-2 py-1.5 text-sm md:col-span-1"
      />
      <input
        disabled={!canEdit}
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        onBlur={commit}
        className="rounded border border-slate-200 px-2 py-1.5 text-sm md:col-span-1"
      />
      <input
        disabled={!canEdit}
        value={pu}
        onChange={(e) => setPu(e.target.value)}
        onBlur={commit}
        className="rounded border border-slate-200 px-2 py-1.5 text-sm md:col-span-2"
      />
      <input
        disabled={!canEdit}
        value={rem}
        onChange={(e) => setRem(e.target.value)}
        onBlur={commit}
        className="rounded border border-slate-200 px-2 py-1.5 text-sm md:col-span-1"
      />
      <div className="tabular-nums text-sm font-semibold text-slate-800 md:col-span-2">
        {fmtMoney(line.lineSellHt)} €
      </div>
      {canEdit ? (
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-600 md:col-span-1"
        >
          ✕
        </button>
      ) : (
        <span className="md:col-span-1" />
      )}
    </div>
  );
}

function AcceptedActions({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function createDeposit() {
    const pct = prompt("Pourcentage d’acompte", "30");
    if (!pct) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/commercial/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DEPOSIT",
          quoteId,
          percent: Number(pct),
          issue: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/factures/${data.invoice.id}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createAmendment() {
    const subject = prompt("Objet de l’avenant", "Travaux supplémentaires");
    if (!subject) return;
    setBusy(true);
    try {
      const res = await fetch("/api/commercial/amendments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, subject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMsg(`Avenant ${data.amendment.number} créé`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="text-sm font-bold text-emerald-950">Créer à partir de ce devis</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void createDeposit()}
          className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
        >
          Facture d’acompte
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createAmendment()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
        >
          Avenant
        </button>
        <a
          href={`/dashboard/devis-facturation/factures?quoteId=${quoteId}`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
        >
          Factures liées
        </a>
      </div>
      {msg ? <p className="mt-2 text-xs text-slate-700">{msg}</p> : null}
    </div>
  );
}
