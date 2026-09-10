"use client";

import { useMemo, useState } from "react";

type Kind = "rdv" | "interne" | "intervention" | "relance";

type EventItem = {
  id: string;
  day: number; // 0 = Lun … 4 = Ven
  start: number; // heure décimale 8–18
  duration: number;
  title: string;
  person: string;
  kind: Kind;
};

const DAYS = [
  { label: "Lun", date: "10" },
  { label: "Mar", date: "11" },
  { label: "Mer", date: "12" },
  { label: "Jeu", date: "13" },
  { label: "Ven", date: "14" },
] as const;

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const;

const KIND_STYLE: Record<Kind, string> = {
  rdv: "border-l-[#2563eb] bg-[#eff6ff] text-[#1e3a8a]",
  interne: "border-l-[#7c3aed] bg-[#f5f3ff] text-[#5b21b6]",
  intervention: "border-l-[#0d9488] bg-[#f0fdfa] text-[#115e59]",
  relance: "border-l-[#ea580c] bg-[#fff7ed] text-[#9a3412]",
};

const KIND_LABEL: Record<Kind, string> = {
  rdv: "Rendez-vous",
  interne: "Réunion",
  intervention: "Intervention",
  relance: "Relance",
};

const INITIAL: EventItem[] = [
  {
    id: "1",
    day: 0,
    start: 9,
    duration: 1,
    title: "Rendez-vous client",
    person: "Sophie Martin",
    kind: "rdv",
  },
  {
    id: "2",
    day: 0,
    start: 14,
    duration: 1.5,
    title: "Présentation projet Horizon",
    person: "Atelier Nova",
    kind: "interne",
  },
  {
    id: "3",
    day: 1,
    start: 10.5,
    duration: 2,
    title: "Intervention sur site",
    person: "Maison Rivage",
    kind: "intervention",
  },
  {
    id: "4",
    day: 1,
    start: 15,
    duration: 0.75,
    title: "Point commercial",
    person: "Thomas Leroy",
    kind: "interne",
  },
  {
    id: "5",
    day: 2,
    start: 9.5,
    duration: 1,
    title: "Relance proposition",
    person: "Agence Lumière",
    kind: "relance",
  },
  {
    id: "6",
    day: 2,
    start: 14,
    duration: 1,
    title: "Rendez-vous découverte",
    person: "Nadia Benali",
    kind: "rdv",
  },
  {
    id: "7",
    day: 3,
    start: 11,
    duration: 2,
    title: "Aménagement bureaux",
    person: "Studio Horizon",
    kind: "intervention",
  },
  {
    id: "8",
    day: 4,
    start: 9,
    duration: 1,
    title: "Bilan hebdomadaire",
    person: "Équipe",
    kind: "interne",
  },
  {
    id: "9",
    day: 4,
    start: 16,
    duration: 0.75,
    title: "Relance commerciale",
    person: "Julien Moreau",
    kind: "relance",
  },
];

const PX_PER_HOUR = 56;

/** Démo agenda semaine — inspirée de l’agenda plateforme, données fictives. */
export function DemoAgenda() {
  const [events, setEvents] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [viewDay, setViewDay] = useState<number | "week">("week");

  const selected = events.find((e) => e.id === selectedId);
  const visible = useMemo(
    () => (viewDay === "week" ? events : events.filter((e) => e.day === viewDay)),
    [events, viewDay],
  );

  function addQuick() {
    const day = viewDay === "week" ? 0 : viewDay;
    const id = `n-${Date.now()}`;
    setEvents((prev) => [
      ...prev,
      {
        id,
        day,
        start: 16.5,
        duration: 0.75,
        title: "Nouveau rendez-vous",
        person: "Contact fictif",
        kind: "rdv",
      },
    ]);
    setSelectedId(id);
  }

  return (
    <div className="flex min-h-[34rem] flex-col lg:flex-row">
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-900">Semaine du 10 mars 2026</p>
            <p className="text-[11px] text-slate-500">Planning fictif — démonstration BeWork</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setViewDay("week")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                viewDay === "week" ? "bg-[#2563eb] text-white" : "border border-slate-200 text-slate-600"
              }`}
            >
              Semaine
            </button>
            {DAYS.map((d, i) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setViewDay(i)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  viewDay === i ? "bg-[#2563eb] text-white" : "border border-slate-200 text-slate-600"
                }`}
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={addQuick}
              className="rounded-lg border border-[#2563eb]/30 bg-[#eff6ff] px-2.5 py-1.5 text-xs font-semibold text-[#1d4ed8]"
            >
              + Créneau
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <div
            className="grid min-w-[640px]"
            style={{
              gridTemplateColumns:
                viewDay === "week" ? `3rem repeat(${DAYS.length}, 1fr)` : "3rem 1fr",
            }}
          >
            <div className="border-b border-slate-100 bg-slate-50" />
            {(viewDay === "week" ? DAYS : [DAYS[viewDay]]).map((d) => (
              <div
                key={d.label}
                className="border-b border-l border-slate-100 bg-slate-50 px-2 py-2 text-center"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {d.label}
                </p>
                <p className="text-sm font-bold text-slate-900">{d.date}</p>
              </div>
            ))}

            <div className="relative" style={{ height: HOURS.length * PX_PER_HOUR }}>
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-slate-100 pr-1 text-right text-[10px] font-medium text-slate-400"
                  style={{ top: i * PX_PER_HOUR }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {(viewDay === "week" ? DAYS.map((_, i) => i) : [viewDay as number]).map((dayIdx) => (
              <div
                key={dayIdx}
                className="relative border-l border-slate-100"
                style={{ height: HOURS.length * PX_PER_HOUR }}
              >
                {HOURS.map((h, i) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-slate-50"
                    style={{ top: i * PX_PER_HOUR, height: PX_PER_HOUR }}
                  />
                ))}
                {visible
                  .filter((e) => e.day === dayIdx)
                  .map((e) => {
                    const top = (e.start - HOURS[0]) * PX_PER_HOUR;
                    const height = Math.max(e.duration * PX_PER_HOUR - 4, 28);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        className={`absolute inset-x-1 overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-left shadow-sm transition hover:brightness-[0.98] ${
                          KIND_STYLE[e.kind]
                        } ${selectedId === e.id ? "ring-2 ring-[#2563eb]/35" : ""}`}
                        style={{ top, height }}
                      >
                        <p className="truncate text-[11px] font-bold leading-tight">{e.title}</p>
                        <p className="truncate text-[10px] opacity-80">
                          {formatHour(e.start)} · {e.person}
                        </p>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="w-full border-t border-slate-100 bg-[#f8fafc] p-4 lg:w-72 lg:shrink-0 lg:border-l lg:border-t-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Détail
        </p>
        {selected ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${KIND_STYLE[selected.kind]}`}
            >
              {KIND_LABEL[selected.kind]}
            </span>
            <h3 className="mt-2 font-display text-base font-extrabold tracking-tight text-slate-900">
              {selected.title}
            </h3>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Jour</dt>
                <dd className="font-semibold">{DAYS[selected.day].label} {DAYS[selected.day].date}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Horaire</dt>
                <dd className="font-semibold">
                  {formatHour(selected.start)} – {formatHour(selected.start + selected.duration)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Avec</dt>
                <dd className="font-semibold">{selected.person}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Sélectionnez un événement.</p>
        )}

        <ul className="mt-4 space-y-1.5">
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <li key={k} className="flex items-center gap-2 text-[11px] text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-sm border-l-4 ${KIND_STYLE[k]}`} />
              {KIND_LABEL[k]}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function formatHour(h: number) {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
