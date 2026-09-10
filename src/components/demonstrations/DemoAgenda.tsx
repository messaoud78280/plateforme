"use client";

import { useState } from "react";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven"] as const;

type Slot = {
  id: string;
  day: (typeof DAYS)[number];
  time: string;
  title: string;
  kind: "rdv" | "interne" | "libre";
};

const INITIAL: Slot[] = [
  { id: "1", day: "Lun", time: "09:00", title: "Point équipe", kind: "interne" },
  { id: "2", day: "Lun", time: "14:00", title: "Client — devis", kind: "rdv" },
  { id: "3", day: "Mar", time: "10:30", title: "Libre", kind: "libre" },
  { id: "4", day: "Mer", time: "11:00", title: "Intervention site", kind: "rdv" },
  { id: "5", day: "Jeu", time: "15:00", title: "Suivi commercial", kind: "interne" },
  { id: "6", day: "Ven", time: "09:30", title: "Libre", kind: "libre" },
];

const KIND_STYLE: Record<Slot["kind"], string> = {
  rdv: "border-teal-200 bg-teal-50 text-teal-900",
  interne: "border-blue-200 bg-blue-50 text-blue-900",
  libre: "border-dashed border-slate-200 bg-white text-slate-500",
};

/** Démonstration interactive — agenda professionnel (données fictives). */
export function DemoAgenda() {
  const [slots, setSlots] = useState(INITIAL);
  const [selectedDay, setSelectedDay] = useState<(typeof DAYS)[number]>("Lun");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("16:00");

  const daySlots = slots.filter((s) => s.day === selectedDay);

  function addSlot() {
    const t = title.trim() || "Nouveau créneau";
    setSlots((prev) => [
      ...prev,
      { id: `n-${Date.now()}`, day: selectedDay, time, title: t, kind: "rdv" },
    ]);
    setTitle("");
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDay(d)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              selectedDay === d
                ? "bg-[#1d4ed8] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {daySlots.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Aucun créneau ce jour — ajoutez-en un ci-dessous.
          </li>
        ) : (
          daySlots.map((s) => (
            <li
              key={s.id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition hover:shadow-sm ${KIND_STYLE[s.kind]}`}
            >
              <div>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs opacity-80">{s.time}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.kind}</span>
            </li>
          ))
        )}
      </ul>

      <div className="mt-6 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="agenda-title">
            Titre
          </label>
          <input
            id="agenda-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. RDV client"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="agenda-time">
            Heure
          </label>
          <input
            id="agenda-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
          />
        </div>
        <button
          type="button"
          onClick={addSlot}
          className="rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
