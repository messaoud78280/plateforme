"use client";

import { useState } from "react";

const SERVICES = [
  { id: "consult", label: "Consultation — 45 min", duration: "45 min", price: "80 €" },
  { id: "visite", label: "Visite sur site", duration: "1 h 30", price: "120 €" },
  { id: "bilan", label: "Bilan d’activité", duration: "1 h", price: "95 €" },
] as const;

const DATES = [
  { id: "12", label: "Jeu. 12 mars", short: "12" },
  { id: "13", label: "Ven. 13 mars", short: "13" },
  { id: "14", label: "Sam. 14 mars", short: "14" },
  { id: "17", label: "Mar. 17 mars", short: "17" },
] as const;

const HOURS = ["09:00", "10:30", "14:00", "16:00"] as const;

/** Démonstration interactive — système de réservation (données fictives). */
export function DemoReservation() {
  const [service, setService] = useState<(typeof SERVICES)[number]["id"]>("consult");
  const [date, setDate] = useState<(typeof DATES)[number]["id"]>("12");
  const [hour, setHour] = useState<(typeof HOURS)[number] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const svc = SERVICES.find((s) => s.id === service);
  const day = DATES.find((d) => d.id === date);

  function submit() {
    if (!hour || !name.trim() || !email.trim()) return;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="px-6 py-16 text-center sm:px-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <p className="mt-4 text-lg font-semibold text-emerald-800">
          Demande enregistrée (simulation)
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          {name} — {svc?.label} le {day?.label} à {hour}. Aucun e-mail réel n&apos;a été envoyé.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setHour(null);
            setName("");
            setEmail("");
            setPhone("");
          }}
          className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="border-b border-slate-100 p-5 sm:p-6 lg:border-b-0 lg:border-r">
        <p className="text-sm font-bold text-slate-900">1. Prestation</p>
        <ul className="mt-3 space-y-2">
          {SERVICES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setService(s.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition ${
                  service === s.id
                    ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/15"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{s.label}</span>
                  <span className="text-[11px] text-slate-500">{s.duration}</span>
                </span>
                <span className="text-sm font-bold text-teal-700">{s.price}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm font-bold text-slate-900">2. Date</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {DATES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDate(d.id)}
              className={`rounded-xl border px-2 py-3 text-center transition ${
                date === d.id
                  ? "border-teal-600 bg-teal-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="block text-lg font-bold text-slate-900">{d.short}</span>
              <span className="mt-0.5 block text-[10px] text-slate-500">mars</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm font-bold text-slate-900">3. Créneau</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHour(h)}
              className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                hour === h
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-slate-200 text-slate-700 hover:border-teal-300"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#f8fafc] p-5 sm:p-6">
        <p className="text-sm font-bold text-slate-900">4. Vos coordonnées</p>
        <div className="mt-3 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            type="email"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone (optionnel)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Récapitulatif</p>
          <p className="mt-2 font-semibold text-slate-900">{svc?.label}</p>
          <p className="mt-1 text-slate-600">
            {day?.label}
            {hour ? ` · ${hour}` : " · créneau à choisir"}
          </p>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!hour || !name.trim() || !email.trim()}
          className="mt-4 w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Envoyer la demande
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Simulation — aucune donnée n’est enregistrée.
        </p>
      </div>
    </div>
  );
}
