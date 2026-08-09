"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProjectOpt = { id: string; title: string; siteAddress: string | null; siteCity: string | null };
type TeamOpt = { id: string; name: string };
type SupplierOpt = {
  id: string;
  name: string;
  tradeName: string | null;
  activity: string | null;
  primaryContact: { id: string; name: string; jobTitle: string | null } | null;
};

type Line = { designation: string; quantity: string; unit: string; unitPriceHt: string };

const emptyLine = (): Line => ({ designation: "", quantity: "1", unit: "U", unitPriceHt: "" });

export function CreatePurchaseOrderForm({
  projects,
  team,
  defaultProjectId,
}: {
  projects: ProjectOpt[];
  team: TeamOpt[];
  defaultProjectId?: string | null;
}) {
  const router = useRouter();
  const initialProject =
    (defaultProjectId && projects.some((p) => p.id === defaultProjectId)
      ? defaultProjectId
      : null) ??
    projects[0]?.id ??
    "";
  const [projectId, setProjectId] = useState(initialProject);
  const [supplierId, setSupplierId] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [supplierQ, setSupplierQ] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);
  const [subject, setSubject] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("07:30");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [responsibleId, setResponsibleId] = useState(team[0]?.id ?? "");
  const [showDetails, setShowDetails] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");

  const selectedProject = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (!selectedProject) return;
    const addr = [selectedProject.siteAddress, selectedProject.siteCity]
      .filter(Boolean)
      .join(", ");
    setDeliveryAddress(addr);
  }, [selectedProject]);

  const searchSuppliers = useCallback(async (q: string) => {
    const res = await fetch(`/api/suppliers?q=${encodeURIComponent(q)}`);
    if (!res.ok) return;
    const data = await res.json();
    setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void searchSuppliers(supplierQ), 200);
    return () => clearTimeout(t);
  }, [supplierQ, searchSuppliers]);

  function pickSupplier(s: SupplierOpt) {
    setSupplierId(s.id);
    setContactId(s.primaryContact?.id ?? null);
    setSupplierQ(s.tradeName || s.name);
  }

  async function createQuickSupplier() {
    if (!newSupplierName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSupplierName.trim(), activity: "Fournitures bâtiment" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSupplierId(data.organization.id);
      setSupplierQ(data.organization.name);
      setNewSupplierOpen(false);
      setNewSupplierName("");
      void searchSuppliers(data.organization.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      let requestedDeliveryAt: string | null = null;
      if (deliveryDate) {
        const t = deliveryTime || "08:00";
        requestedDeliveryAt = new Date(`${deliveryDate}T${t}:00`).toISOString();
      }
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          externalOrganizationId: supplierId,
          contactId,
          subject,
          responsibleId: responsibleId || null,
          requestedDeliveryAt,
          deliveryPlaceType: "CHANTIER",
          deliveryAddress,
          deliveryInstructions: showDetails ? deliveryInstructions : null,
          internalNotes: showDetails ? internalNotes : null,
          lines: lines.map((l) => ({
            designation: l.designation,
            quantity: Number(l.quantity),
            unit: l.unit,
            unitPriceHt: l.unitPriceHt === "" ? null : Number(l.unitPriceHt),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/commandes/${data.order.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Chantier *</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Fournisseur *
          </span>
          <input
            value={supplierQ}
            onChange={(e) => {
              setSupplierQ(e.target.value);
              setSupplierId("");
            }}
            placeholder="Rechercher un fournisseur…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          {suppliers.length > 0 && !supplierId ? (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-100 bg-white shadow-sm">
              {suppliers.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => pickSupplier(s)}
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">
                      {s.tradeName || s.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {s.activity || "Fournisseur"}
                      {s.primaryContact
                        ? ` · ${s.primaryContact.name}${s.primaryContact.jobTitle ? ` — ${s.primaryContact.jobTitle}` : ""}`
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            onClick={() => setNewSupplierOpen((v) => !v)}
            className="text-xs font-semibold text-[#1d4ed8]"
          >
            + Ajouter un fournisseur
          </button>
          {newSupplierOpen ? (
            <div className="mt-2 flex gap-2">
              <input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Raison sociale"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void createQuickSupplier()}
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white"
              >
                Créer
              </button>
            </div>
          ) : null}
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Objet *</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex. Membrane EPDM terrasse"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Lignes de commande</h2>
        {lines.map((line, idx) => (
          <div key={idx} className="grid gap-2 sm:grid-cols-12">
            <input
              value={line.designation}
              onChange={(e) => {
                const next = [...lines];
                next[idx] = { ...line, designation: e.target.value };
                setLines(next);
              }}
              placeholder="Désignation"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-5"
            />
            <input
              value={line.quantity}
              onChange={(e) => {
                const next = [...lines];
                next[idx] = { ...line, quantity: e.target.value };
                setLines(next);
              }}
              placeholder="Qté"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              value={line.unit}
              onChange={(e) => {
                const next = [...lines];
                next[idx] = { ...line, unit: e.target.value };
                setLines(next);
              }}
              placeholder="Unité"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              value={line.unitPriceHt}
              onChange={(e) => {
                const next = [...lines];
                next[idx] = { ...line, unitPriceHt: e.target.value };
                setLines(next);
              }}
              placeholder="Prix HT"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-3"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((l) => [...l, emptyLine()])}
          className="text-xs font-semibold text-[#1d4ed8]"
        >
          + Ajouter une ligne
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Livraison souhaitée</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">Date</span>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">Heure</span>
            <input
              type="time"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Lieu de livraison</span>
          <input
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <span className="text-[11px] text-slate-400">Par défaut : adresse du chantier</span>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Responsable réception</span>
          <select
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="text-sm font-semibold text-slate-600 underline"
      >
        {showDetails ? "Masquer les détails" : "Plus de détails"}
      </button>

      {showDetails ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">Instructions livraison</span>
            <textarea
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-bold uppercase text-slate-500">Commentaires internes</span>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </section>
      ) : null}

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <button
        type="button"
        disabled={busy || !projectId || !supplierId || !subject.trim()}
        onClick={() => void submit()}
        className="w-full rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-bold text-white hover:bg-[#152a45] disabled:opacity-50"
      >
        {busy ? "Création…" : "Créer la commande"}
      </button>
    </div>
  );
}
