"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateQuoteForm({
  clients,
  projects,
}: {
  clients: Array<{ id: string; name: string; tradeName: string | null }>;
  projects: Array<{
    id: string;
    title: string;
    siteAddress: string | null;
    siteCity: string | null;
  }>;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">Objet *</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex. Étanchéité terrasse — Les Lilas"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">Client</span>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="">— À préciser —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tradeName || c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-bold uppercase text-slate-500">
          Chantier (optionnel)
        </span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="">— Pas encore de chantier —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
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
