"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClientOpt = { id: string; name: string; tradeName: string | null };
type ProjectOpt = {
  id: string;
  title: string;
  siteAddress: string | null;
  siteCity: string | null;
  /** IDs clients déjà liés via d’autres devis (priorisation UX, pas une FK chantier). */
  linkedClientIds?: string[];
};

export function CreateQuoteForm({
  clients: initialClients,
  projects,
  defaultValidityDays,
  defaultVatRate,
}: {
  clients: ClientOpt[];
  projects: ProjectOpt[];
  defaultValidityDays?: number | null;
  defaultVatRate?: number;
}) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [subject, setSubject] = useState("");
  const [clientId, setClientId] = useState(initialClients[0]?.id ?? "");
  const [projectId, setProjectId] = useState("");
  const [validityDate, setValidityDate] = useState(() => {
    const days = defaultValidityDays && defaultValidityDays > 0 ? defaultValidityDays : 30;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientBusy, setNewClientBusy] = useState(false);

  const prioritizedProjects = useMemo(() => {
    if (!clientId) return projects;
    const linked = projects.filter((p) => p.linkedClientIds?.includes(clientId));
    const others = projects.filter((p) => !p.linkedClientIds?.includes(clientId));
    return [...linked, ...others];
  }, [projects, clientId]);

  async function createClientQuick() {
    const name = newClientName.trim();
    if (!name) return;
    setNewClientBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur création client");
      const client = data.client as ClientOpt;
      setClients((prev) => {
        if (prev.some((c) => c.id === client.id)) return prev;
        return [...prev, client].sort((a, b) =>
          (a.tradeName || a.name).localeCompare(b.tradeName || b.name, "fr"),
        );
      });
      setClientId(client.id);
      setShowNewClient(false);
      setNewClientName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setNewClientBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const project = projects.find((p) => p.id === projectId);
      const site = project
        ? [project.siteAddress, project.siteCity].filter(Boolean).join(", ")
        : null;
      const res = await fetch("/api/commercial/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          clientExternalOrgId: clientId || null,
          projectId: projectId || null,
          siteAddressSnapshot: site,
          validityDate: validityDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/devis/${data.quote.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Devis commercial BeWork — chaîne jusqu’à la facturation.{" "}
        <span className="text-slate-500">
          (Distinct de la bibliothèque Analyses.)
        </span>
      </p>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">Objet *</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex. Étanchéité terrasse — Les Lilas"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase text-slate-500">Client</span>
          <button
            type="button"
            onClick={() => setShowNewClient((v) => !v)}
            className="text-xs font-semibold text-[#1e3a5f] underline"
          >
            {showNewClient ? "Annuler" : "+ Nouveau client"}
          </button>
        </div>
        {showNewClient ? (
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row">
            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Raison sociale"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={newClientBusy || !newClientName.trim()}
              onClick={() => void createClientQuick()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {newClientBusy ? "…" : "Créer"}
            </button>
          </div>
        ) : null}
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setProjectId("");
          }}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">— À préciser —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tradeName || c.name}
            </option>
          ))}
        </select>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">
          Chantier (optionnel)
        </span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="">— Aucun chantier (rattachement ultérieur) —</option>
          {prioritizedProjects.map((p) => {
            const preferred = Boolean(clientId && p.linkedClientIds?.includes(clientId));
            return (
              <option key={p.id} value={p.id}>
                {preferred ? "★ " : ""}
                {p.title}
              </option>
            );
          })}
        </select>
        {clientId ? (
          <p className="text-[11px] text-slate-500">
            Les chantiers déjà liés à ce client sur d’autres devis apparaissent en tête (★).
          </p>
        ) : null}
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-xs font-bold uppercase text-slate-500">Validité</span>
          <input
            type="date"
            value={validityDate}
            onChange={(e) => setValidityDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">TVA par défaut</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {(defaultVatRate ?? 20).toLocaleString("fr-FR")} %
          </p>
          <p className="text-[11px] text-slate-500">Modifiable ligne par ligne ensuite.</p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={busy || !subject.trim()}
        onClick={() => void submit()}
        className="w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "Création…" : "Créer le devis"}
      </button>
    </div>
  );
}
