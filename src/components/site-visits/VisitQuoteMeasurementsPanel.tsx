"use client";

import { useEffect, useState } from "react";

type Measurement = {
  id: string;
  zone: string | null;
  label: string;
  unit: string;
  computedQuantity: number;
  quantityLabel: string;
};

type WorkItem = {
  id: string;
  name: string;
  saleUnit: string;
};

/**
 * Panneau devis : associer relevés visite → ouvrages CommercialWorkItem.
 */
export function VisitQuoteMeasurementsPanel({
  visitId,
  quoteId,
  canEdit,
}: {
  visitId: string;
  quoteId: string;
  canEdit: boolean;
}) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [vRes, wRes] = await Promise.all([
        fetch(`/api/site-visits/${visitId}`),
        fetch(`/api/commercial/library/work-items?take=80`),
      ]);
      if (vRes.ok) {
        const data = await vRes.json();
        setMeasurements(data.visit?.measurements ?? []);
      }
      if (wRes.ok) {
        const data = await wRes.json();
        const items = data.items ?? data.workItems ?? data.rows ?? [];
        setWorkItems(
          (items as Array<{ id: string; name: string; saleUnit: string }>).map(
            (w) => ({
              id: w.id,
              name: w.name,
              saleUnit: w.saleUnit,
            }),
          ),
        );
      }
    })();
  }, [visitId]);

  async function apply(measurementId: string) {
    const workItemId = selected[measurementId];
    if (!workItemId) {
      setMsg("Choisir un ouvrage");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/site-visits/${visitId}/create-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_line",
          quoteId,
          measurementId,
          workItemId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (String(data.error ?? "").includes("Unités incompatibles")) {
          const ok = window.confirm(
            `${data.error}\n\nForcer quand même ?`,
          );
          if (!ok) throw new Error(data.error);
          const res2 = await fetch(`/api/site-visits/${visitId}/create-quote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "add_line",
              quoteId,
              measurementId,
              workItemId,
              forceUnitMismatch: true,
            }),
          });
          const data2 = await res2.json();
          if (!res2.ok) throw new Error(data2.error || "Échec");
          setMsg(`Ligne ajoutée : ${data2.quantity} (${data2.measurementLabel})`);
        } else {
          throw new Error(data.error || "Échec");
        }
      } else {
        setMsg(`Ligne ajoutée : ${data.quantity} (${data.measurementLabel})`);
      }
      window.location.reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (measurements.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-bold text-[#1e3a5f]">Avant-métré de la visite</h2>
      <p className="mt-1 text-xs text-slate-500">
        Associez un relevé à un ouvrage — la quantité est reprise, jamais le prix.
      </p>
      {msg ? <p className="mt-2 text-xs text-slate-700">{msg}</p> : null}
      <ul className="mt-3 space-y-3">
        {measurements.map((m) => (
          <li
            key={m.id}
            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <p className="text-sm font-medium text-slate-900">
              {m.zone ? `${m.zone} — ` : ""}
              {m.label}
            </p>
            <p className="text-sm tabular-nums text-[#1e3a5f]">{m.quantityLabel}</p>
            {canEdit ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  value={selected[m.id] ?? ""}
                  onChange={(e) =>
                    setSelected({ ...selected, [m.id]: e.target.value })
                  }
                  className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                >
                  <option value="">Choisir un ouvrage…</option>
                  {workItems.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.saleUnit})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void apply(m.id)}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Ajouter au devis
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
