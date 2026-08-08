"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PERSON_TYPE_LABELS,
  type PersonType,
  type ProjectAccessScopes,
} from "@/lib/equipe-acces/types";

type AccessRow = {
  id: string;
  userId: string;
  scopes: ProjectAccessScopes;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    personType: string | null;
    company: string | null;
  };
};

type Candidate = {
  id: string;
  name: string;
  email: string;
  personType: string | null;
  permissionProfile: string | null;
  company: string | null;
};

const SCOPE_LABELS: { key: keyof ProjectAccessScopes; label: string }[] = [
  { key: "messages", label: "Messages" },
  { key: "documents", label: "Documents" },
  { key: "agenda", label: "Agenda" },
  { key: "deliveries", label: "Livraisons" },
];

export function ChantierSharePanel({ projectId }: { projectId: string }) {
  const [accesses, setAccesses] = useState<AccessRow[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState("");
  const [scopes, setScopes] = useState<ProjectAccessScopes>({
    messages: true,
    documents: true,
    agenda: true,
    deliveries: false,
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/projets/${projectId}/access`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de charger les accès.");
        return;
      }
      setAccesses(Array.isArray(data.accesses) ? data.accesses : []);
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const grantedIds = new Set(accesses.map((a) => a.userId));
  const available = candidates.filter((c) => !grantedIds.has(c.id));

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError("Sélectionnez une personne.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/projets/${projectId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, scopes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Partage impossible.");
        setBusy(false);
        return;
      }
      setSuccess("Accès accordé — la personne a été notifiée.");
      setUserId("");
      await load();
    } catch {
      setError("Erreur de connexion.");
    }
    setBusy(false);
  }

  async function revoke(targetUserId: string) {
    if (!window.confirm("Retirer l’accès à ce chantier ?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/projets/${projectId}/access?userId=${encodeURIComponent(targetUserId)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Révocation impossible.");
      } else {
        setSuccess("Accès retiré.");
        await load();
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setBusy(false);
  }

  async function updateScopes(row: AccessRow, next: ProjectAccessScopes) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/projets/${projectId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.userId, scopes: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Mise à jour impossible.");
      } else {
        await load();
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setBusy(false);
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement des accès…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <strong>Partage fin :</strong> choisissez qui voit ce chantier et quoi (messages,
        documents, agenda, livraisons). Les documents marqués « interne » restent invisibles
        pour les externes.
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Accorder un accès
        </h3>
        <form onSubmit={grant} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Personne
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Sélectionner —</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                  {c.personType
                    ? ` · ${PERSON_TYPE_LABELS[c.personType as PersonType] ?? c.personType}`
                    : ""}
                  {c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </label>
          {available.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aucun candidat. Ajoutez d’abord la personne dans Équipe & partenaires.
            </p>
          ) : null}
          <div>
            <p className="text-sm font-medium text-slate-700">Droits sur ce chantier</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {SCOPE_LABELS.map(({ key, label }) => (
                <li key={key}>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(scopes[key])}
                      onChange={(e) =>
                        setScopes((s) => ({ ...s, [key]: e.target.checked }))
                      }
                    />
                    {label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="submit"
            disabled={busy || !userId}
            className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Partager le chantier"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Personnes ayant accès ({accesses.length})
        </h3>
        {accesses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Aucun partage explicite — seuls le propriétaire et le personnel interne de l’org
            voient le chantier.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {accesses.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">{row.user.name}</p>
                    <p className="text-xs text-slate-500">{row.user.email}</p>
                    {row.user.personType ? (
                      <p className="text-xs text-slate-500">
                        {PERSON_TYPE_LABELS[row.user.personType as PersonType] ??
                          row.user.personType}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => revoke(row.userId)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    Retirer
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SCOPE_LABELS.map(({ key, label }) => (
                    <label
                      key={key}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(row.scopes[key])}
                        disabled={busy}
                        onChange={(e) =>
                          updateScopes(row, { ...row.scopes, [key]: e.target.checked })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
