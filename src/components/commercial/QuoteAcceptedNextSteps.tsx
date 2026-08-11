"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProjectOpt = { id: string; title: string };

export function QuoteAcceptedNextSteps({
  quoteId,
  subject,
  siteAddressSnapshot,
  project,
}: {
  quoteId: string;
  subject: string;
  siteAddressSnapshot?: string | null;
  project: { id: string; title: string } | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "create" | "attach">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(subject);
  const [siteAddress, setSiteAddress] = useState(siteAddressSnapshot ?? "");
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "attach") return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/projets");
        const data = await res.json();
        if (cancelled) return;
        const list = Array.isArray(data.projects)
          ? data.projects
          : Array.isArray(data)
            ? data
            : [];
        setProjects(
          list.map((p: { id: string; title: string }) => ({
            id: p.id,
            title: p.title,
          })),
        );
      } catch {
        if (!cancelled) setError("Impossible de charger les chantiers");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (project) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="text-sm font-bold text-emerald-950">Devis accepté</p>
        <p className="mt-1 text-sm text-slate-700">
          Chantier lié · <span className="font-semibold">{project.title}</span>
        </p>
        <Link
          href={`/dashboard/projets/${project.id}`}
          className="mt-3 inline-flex rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
        >
          Ouvrir le chantier
        </Link>
      </div>
    );
  }

  async function createProject() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quoteId}/link-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: title.trim(),
          siteAddress: siteAddress.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/projets/${data.project.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function attachProject() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quoteId}/link-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link", projectId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.refresh();
      setMode("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-emerald-950">Devis accepté</p>
        <p className="mt-1 text-sm text-slate-700">Et maintenant ?</p>
      </div>

      {mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("create")}
            className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
          >
            Créer le chantier
          </button>
          <button
            type="button"
            onClick={() => setMode("attach")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
          >
            Rattacher à un chantier existant
          </button>
        </div>
      ) : null}

      {mode === "create" ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-700">
            Confirmation — vérifiez avant création
          </p>
          <label className="block text-xs text-slate-500">
            Nom du chantier
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-slate-500">
            Adresse (à confirmer)
            <input
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy || !title.trim()}
              onClick={() => void createProject()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? "…" : "Confirmer la création"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      {mode === "attach" ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un chantier…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <ul className="max-h-48 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <li className="py-2 text-xs text-slate-500">Aucun chantier</li>
            ) : (
              filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`flex w-full items-center justify-between px-2 py-2 text-left text-sm ${
                      selectedId === p.id ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>{p.title}</span>
                    {selectedId === p.id ? (
                      <span className="text-[10px] text-[#1e3a5f]">Choisi</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !selectedId}
              onClick={() => void attachProject()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? "…" : "Rattacher"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
