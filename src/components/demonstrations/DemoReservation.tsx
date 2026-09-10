"use client";

import { useState } from "react";

const SERVICES = [
  { id: "consult", label: "Consultation — 45 min", duration: "45 min" },
  { id: "visite", label: "Visite sur site", duration: "1 h 30" },
  { id: "bilan", label: "Bilan d’activité", duration: "1 h" },
] as const;

const DATES = ["12 mars", "13 mars", "14 mars", "17 mars"] as const;
const HOURS = ["09:00", "10:30", "14:00", "16:00"] as const;

/** Démonstration interactive — système de réservation (données fictives). */
export function DemoReservation() {
  const [service, setService] = useState<(typeof SERVICES)[number]["id"]>("consult");
  const [date, setDate] = useState<(typeof DATES)[number]>("12 mars");
  const [hour, setHour] = useState<(typeof HOURS)[number] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit() {
    if (!hour || !name.trim() || !email.trim()) return;
    setSent(true);
  }

  if (sent) {
    const svc = SERVICES.find((s) => s.id === service);
    return (
      <div className="px-6 py-16 text-center sm:px-10">
        <p className="text-lg font-semibold text-emerald-800">Demande enregistrée (simulation)</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          {name} — {svc?.label} le {date} à {hour}. Aucun e-mail réel n&apos;a été envoyé.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setHour(null);
            setName("");
            setEmail("");
          }}
          className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-0 md:grid-cols-2">
      <div className="border-b border-slate-100 p-5 sm:p-6 md:border-b-0 md:border-r">
        <p className="text-sm font-semibold text-slate-900">1. Prestation</p>
        <ul className="mt-3 space-y-2">
          {SERVICES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setService(s.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition hover:border-[#93c5fd] ${
                  service === s.id ? "border-[#1d4ed8] bg-[#eff6ff]" : "border-slate-200 bg-white"
                }`}
              >
                <span className="font-medium text-slate-900">{s.label}</span>
                <span className="text-xs text-slate-500">{s.duration}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm font-semibold text-slate-900">2. Date</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DATES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDate(d)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                date === d ? "bg-[#1d4ed8] text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm font-semibold text-slate-900">3. Créneau</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHour(h)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                hour === h ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-sm font-semibold text-slate-900">4. Vos coordonnées</p>
        <div className="mt-3 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Prénom et nom"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!hour || !name.trim() || !email.trim()}
            className="w-full rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Envoyer la demande
          </button>
          <p className="text-xs text-slate-500">Simulation uniquement — aucune donnée n&apos;est transmise.</p>
        </div>
      </div>
    </div>
  );
}
