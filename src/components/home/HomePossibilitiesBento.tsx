"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BW_BTN_SECONDARY,
  BW_CARD,
  BW_EYEBROW,
  BW_H2,
  BW_LEAD,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";

/** Showroom bento — tailles variées + mini-UI, pas une grille 3×2 identique. */
export function HomePossibilitiesBento() {
  return (
    <section
      id="demonstrations"
      className={BW_SECTION}
      aria-labelledby="bento-heading"
    >
      <BwAtmosphere variant="violet" />
      <div className="container-site relative">
        <div className="max-w-2xl">
          <p className={BW_EYEBROW}>Des exemples concrets</p>
          <h2 id="bento-heading" className={`mt-3 ${BW_H2}`}>
            Ce que vous pourrez créer{" "}
            <span className="text-[#2563eb]">pendant la journée.</span>
          </h2>
          <p className={BW_LEAD}>
            Des projets utiles, concrets et adaptés à vos besoins — guidés pas à
            pas.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
          {/* Grande — réservation */}
          <article className={`${BW_CARD} p-5 md:col-span-4 md:row-span-2 md:p-6`}>
            <CardHead
              title="Système de réservation"
              href="/demonstrations/reservation"
              accent="#0d9488"
            />
            <MiniReservation />
          </article>

          {/* Verticale — messagerie */}
          <article className={`${BW_CARD} p-5 md:col-span-2 md:row-span-2`}>
            <CardHead
              title="Messagerie"
              href="/demonstrations/messagerie"
              accent="#7c3aed"
            />
            <MiniMessagerie />
          </article>

          {/* CRM */}
          <article className={`${BW_CARD} p-5 md:col-span-3`}>
            <CardHead title="CRM" href="/demonstrations/crm" accent="#ea580c" />
            <MiniCrm />
          </article>

          {/* Agenda */}
          <article className={`${BW_CARD} p-5 md:col-span-3`}>
            <CardHead
              title="Agenda"
              href="/demonstrations/agenda"
              accent="#2563eb"
            />
            <MiniAgenda />
          </article>

          {/* Dashboard large */}
          <article className={`${BW_CARD} p-5 md:col-span-4`}>
            <CardHead
              title="Tableau de bord"
              href="/demonstrations/dashboard"
              accent="#4f46e5"
            />
            <MiniDashboard />
          </article>

          {/* Espace client */}
          <article className={`${BW_CARD} p-5 md:col-span-2`}>
            <CardHead
              title="Espace client"
              href="/demonstrations/espace-client"
              accent="#059669"
            />
            <MiniClient />
          </article>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/demonstrations" className={BW_BTN_SECONDARY}>
            Explorer toutes les démonstrations
          </Link>
        </div>
      </div>
    </section>
  );
}

function CardHead({
  title,
  href,
  accent,
}: {
  title: string;
  href: string;
  accent: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <h3 className="font-display text-sm font-bold tracking-tight text-[#0a0a0a] sm:text-base">
          {title}
        </h3>
      </div>
      <Link
        href={href}
        className="text-[11px] font-semibold text-slate-400 transition hover:text-[#2563eb]"
      >
        Explorer →
      </Link>
    </div>
  );
}

function MiniReservation() {
  const hours = ["09:00", "10:30", "14:00", "16:00"] as const;
  const [hour, setHour] = useState<(typeof hours)[number]>("10:30");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-8 text-center">
        <p className="text-sm font-bold text-emerald-800">Créneau confirmé (simulation)</p>
        <p className="mt-1 text-xs text-emerald-700">{hour}</p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-3 text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
        >
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">Choisissez une heure</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {hours.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHour(h)}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              hour === h
                ? "border-teal-600 bg-teal-50 text-teal-800"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {h}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setDone(true)}
        className="mt-4 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
      >
        Réserver (simulation)
      </button>
    </div>
  );
}

function MiniMessagerie() {
  return (
    <div className="space-y-2">
      {[
        { n: "C", name: "Camille", t: "Peux-tu valider le planning ?" },
        { n: "É", name: "Équipe", t: "Livraison reportée à jeudi." },
        { n: "S", name: "Samir", t: "Le client a confirmé." },
      ].map((m) => (
        <div
          key={m.name}
          className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
            {m.n}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-slate-800">{m.name}</span>
            <span className="block truncate text-[11px] text-slate-500">{m.t}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function MiniCrm() {
  const [stage, setStage] = useState(0);
  const stages = ["Prospect", "Qualifié", "Proposition", "Gagné"] as const;
  return (
    <div>
      <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
        <div>
          <p className="text-xs font-bold text-slate-800">Atelier Nord</p>
          <p className="text-[11px] text-slate-500">2 400 €</p>
        </div>
        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
          {stages[stage]}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setStage((s) => Math.min(s + 1, stages.length - 1))}
        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
      >
        Avancer le statut →
      </button>
    </div>
  );
}

function MiniAgenda() {
  const [sel, setSel] = useState(1);
  const days = [
    { d: "12", l: "Visite" },
    { d: "13", l: "RDV" },
    { d: "14", l: "Libre" },
    { d: "17", l: "Bilan" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {days.map((day, i) => (
        <button
          key={day.d}
          type="button"
          onClick={() => setSel(i)}
          className={`rounded-xl border px-2 py-3 text-center transition ${
            sel === i
              ? "border-[#2563eb] bg-[#eff6ff]"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="block text-sm font-bold text-slate-900">{day.d}</span>
          <span className="mt-1 block text-[10px] text-slate-500">{day.l}</span>
        </button>
      ))}
    </div>
  );
}

function MiniDashboard() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Demandes", v: "128" },
          { l: "Réponse", v: "94 %" },
          { l: "Satisfaction", v: "4,6" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[10px] text-slate-500">{k.l}</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{k.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-14 items-end gap-1.5 px-1">
        {[35, 58, 44, 72, 50, 68, 40].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-[#4f46e5]/85"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniClient() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-emerald-50/50 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">Progression</span>
        <span className="font-bold text-emerald-700">72 %</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full w-[72%] rounded-full bg-emerald-600" />
      </div>
      <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
        <li>• 3 documents partagés</li>
        <li>• 1 validation en attente</li>
      </ul>
    </div>
  );
}
