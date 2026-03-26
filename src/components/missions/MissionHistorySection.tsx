"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type MissionItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  completedAt: Date | null;
  documents: { id: string; name: string; fileUrl: string; category: string }[];
};

export function MissionHistorySection() {
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [relancerId, setRelancerId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/missions/history")
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setMissions(data) : []))
      .catch(() => setMissions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRelancer = async (taskId: string) => {
    setRelancerId(taskId);
    try {
      const res = await fetch("/api/missions/relancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        window.location.href = `/dashboard/taches/${data.id}`;
      }
    } catch {
      setRelancerId(null);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl surface-metallic-light">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Historique des missions</h2>
          <p className="mt-0.5 text-sm text-slate-500">Chargement…</p>
        </div>
        <div className="px-6 py-8 text-center text-slate-500 text-sm">Chargement…</div>
      </section>
    );
  }

  if (missions.length === 0) {
    return (
      <section className="rounded-2xl surface-metallic-light">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Historique des missions</h2>
          <p className="mt-0.5 text-sm text-slate-500">Votre mémoire administrative BeWork</p>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-slate-500">Aucune mission terminée pour le moment.</p>
          <p className="mt-2 text-sm text-slate-400">
            Vos missions passées apparaîtront ici pour les relancer en un clic.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl surface-metallic-light">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800">Historique des missions</h2>
        <p className="mt-0.5 text-sm text-slate-500">Votre mémoire administrative — relancez une mission en un clic</p>
      </div>
      <div className="divide-y divide-slate-100">
        {missions.slice(0, 10).map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:flex-nowrap"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800">{m.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                {(m as { category?: string | null }).category && <span>{(m as { category?: string | null }).category}</span>}
                {m.documents.length > 0 && (
                  <span>{m.documents.length} document{m.documents.length > 1 ? "s" : ""}</span>
                )}
                {m.completedAt && (
                  <span>
                    Terminé le {new Date(m.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/dashboard/taches/${m.id}`}
                className="rounded-lg surface-metallic-light px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Voir
              </Link>
              <button
                type="button"
                onClick={() => handleRelancer(m.id)}
                disabled={relancerId === m.id}
                className="rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e40af] disabled:opacity-60"
              >
                {relancerId === m.id ? "Relance…" : "Relancer"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {missions.length > 0 && (
        <div className="border-t border-slate-100 px-6 py-3">
          <Link href="/dashboard/taches?statut=COMPLETE" className="text-sm font-medium text-[#1d4ed8] hover:underline">
            Voir tout l&apos;historique →
          </Link>
        </div>
      )}
    </section>
  );
}
