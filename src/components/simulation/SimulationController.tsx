"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SimulationControllerProps {
  projectId: string;
}

interface TimelineItem {
  day: number;
  label: string;
  eventCount: number;
}

export function SimulationController({ projectId }: SimulationControllerProps) {
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ day: number; executed: number; errors?: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/simulation")
      .then((r) => r.json())
      .then((data) => {
        if (data.ready && data.timeline) {
          setTimeline(data.timeline);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lastResult]);

  async function runDay(day: number) {
    setRunning(day);
    setLastResult(null);
    try {
      const res = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastResult({ day, executed: data.executed ?? 0, errors: data.errors });
        router.refresh();
      } else {
        setLastResult({ day, executed: 0, errors: [data.error ?? "Erreur"] });
      }
    } catch {
      setLastResult({ day, executed: 0, errors: ["Erreur réseau"] });
    } finally {
      setRunning(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl surface-metallic-light p-6">
        <p className="text-slate-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Contrôle de simulation
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Lancez les événements d&apos;un jour pour simuler la progression du projet BelleVie.
      </p>

      <div className="flex flex-wrap gap-2">
        {timeline.map((item) => (
          <button
            key={item.day}
            onClick={() => runDay(item.day)}
            disabled={running !== null}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-blue-100 hover:ring-blue-300 disabled:opacity-50"
          >
            {running === item.day ? "..." : `Jour ${item.day} — ${item.label}`}
            {item.eventCount > 0 && (
              <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-xs">
                {item.eventCount} év.
              </span>
            )}
          </button>
        ))}
      </div>

      {timeline.length === 0 && (
        <p className="mt-2 text-sm text-amber-700">
          Aucun jour de simulation chargé. Vérifiez que le seed simulation a été exécuté.
        </p>
      )}

      {lastResult && (
        <div className="mt-4 rounded-lg surface-metallic-light p-4">
          <p className="font-medium text-slate-800">
            Jour {lastResult.day} : {lastResult.executed} événement(s) exécuté(s)
          </p>
          {lastResult.errors && lastResult.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-red-600">
              {lastResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
