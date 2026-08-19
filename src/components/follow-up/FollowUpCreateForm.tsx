"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type FollowUpCreateProject = {
  id: string;
  title: string;
  siteAddress?: string | null;
  siteCity?: string | null;
  clientName?: string | null;
  assignedToId?: string | null;
};

/**
 * Création rapide — chantier d’abord (une donnée une fois).
 * Cas métier « sans chantier » : OS reçu avant ouverture du Project.
 */
export function FollowUpCreateForm({
  projects,
  defaultProjectId,
}: {
  projects: FollowUpCreateProject[];
  defaultProjectId?: string | null;
}) {
  const initialProject =
    defaultProjectId != null
      ? projects.find((p) => p.id === defaultProjectId) ?? null
      : null;

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noProject, setNoProject] = useState(false);
  const [projectId, setProjectId] = useState(initialProject?.id ?? "");
  const [projectQuery, setProjectQuery] = useState("");
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState(initialProject?.clientName?.trim() || "");
  const [siteAddress, setSiteAddress] = useState(
    initialProject
      ? [initialProject.siteAddress, initialProject.siteCity].filter(Boolean).join(", ")
      : "",
  );
  const [workObject, setWorkObject] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [osNumber, setOsNumber] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");

  const selected = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );

  const filteredProjects = useMemo(() => {
    const q = projectQuery.trim().toLowerCase();
    if (!q) return projects.slice(0, 40);
    return projects
      .filter((p) => {
        const hay = [p.title, p.clientName, p.siteCity, p.siteAddress]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [projects, projectQuery]);

  function selectProject(id: string) {
    setProjectId(id);
    setNoProject(false);
    const p = projects.find((x) => x.id === id);
    if (p) {
      setClientName(p.clientName?.trim() || "");
      const addr = [p.siteAddress, p.siteCity].filter(Boolean).join(", ");
      setSiteAddress(addr);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!noProject && !projectId) {
      setError("Sélectionnez un chantier, ou utilisez « Pas encore de chantier ».");
      setSaving(false);
      return;
    }

    if (noProject && !clientName.trim() && !title.trim()) {
      setError("Indiquez au moins le client ou le titre de la fiche.");
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      workObject: workObject.trim() || undefined,
      orderNumber: orderNumber.trim() || undefined,
      osNumber: osNumber.trim() || undefined,
      nextActionAt: nextActionAt || undefined,
    };

    if (!noProject && projectId) {
      payload.projectId = projectId;
      payload.title = title.trim() || undefined;
      // client / adresse / responsable : dérivés côté API depuis le chantier
    } else {
      payload.clientName = clientName.trim() || title.trim();
      payload.title = title.trim() || clientName.trim();
      payload.siteAddress = siteAddress.trim() || undefined;
    }

    try {
      const res = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Création impossible");
        return;
      }
      router.push(`/dashboard/fiches-suivi/${data.id}`);
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="text-sm text-slate-600">
        Minimum pour démarrer : chantier (ou client), objet, échéance si connue.
      </p>

      {!noProject ? (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700">Chantier *</span>
          <input
            type="search"
            value={projectQuery}
            onChange={(e) => setProjectQuery(e.target.value)}
            placeholder="Rechercher un chantier…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            autoComplete="off"
          />
          <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200">
            {filteredProjects.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500">Aucun chantier trouvé.</p>
            ) : (
              <ul>
                {filteredProjects.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectProject(p.id)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        projectId === p.id ? "bg-[#1e3a5f]/5 font-semibold text-[#1e3a5f]" : "text-slate-800"
                      }`}
                    >
                      <span className="block">{p.title}</span>
                      {p.clientName ? (
                        <span className="text-[11px] font-normal text-slate-500">{p.clientName}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              className="font-medium text-[#1e3a5f] underline-offset-2 hover:underline"
              onClick={() => {
                setNoProject(true);
                setProjectId("");
              }}
            >
              Pas encore de chantier
            </button>
            <Link
              href="/dashboard/projets"
              className="font-medium text-slate-600 underline-offset-2 hover:underline"
            >
              + Créer un chantier
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3">
          <p className="text-xs text-slate-600">
            Fiche sans Project lié — utile si l’OS arrive avant l’ouverture du chantier. Aucun
            chantier n’est inventé automatiquement.
          </p>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">Client *</span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              placeholder="Nom du client"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">Adresse</span>
            <input
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            className="text-xs font-medium text-[#1e3a5f] underline-offset-2 hover:underline"
            onClick={() => setNoProject(false)}
          >
            ← Choisir un chantier existant
          </button>
        </div>
      )}

      {selected && !noProject ? (
        <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
          <p>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Client
            </span>
            <br />
            <span className="font-medium text-slate-800">
              {selected.clientName?.trim() || "— à vérifier sur le chantier"}
            </span>
          </p>
          <p>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Adresse
            </span>
            <br />
            <span className="text-slate-700">
              {[selected.siteAddress, selected.siteCity].filter(Boolean).join(", ") || "—"}
            </span>
          </p>
        </div>
      ) : null}

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700">Titre de la fiche</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            noProject
              ? "Ex. OS étanchéité — Résidence Horizon"
              : "Laissez vide pour utiliser le chantier"
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700">Objet des travaux</span>
        <input
          value={workObject}
          onChange={(e) => setWorkObject(e.target.value)}
          placeholder="Réfection étanchéité terrasse"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700">Échéance</span>
        <input
          value={nextActionAt}
          onChange={(e) => setNextActionAt(e.target.value)}
          type="datetime-local"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <span className="text-[11px] text-slate-500">
          Date de la prochaine action (analyse, intervention, relance…).
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">N° commande</span>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">N° OS</span>
          <input
            value={osNumber}
            onChange={(e) => setOsNumber(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-bold text-white hover:bg-[#16304f] disabled:opacity-60"
      >
        {saving ? "Création…" : "Créer la fiche"}
      </button>
    </form>
  );
}
