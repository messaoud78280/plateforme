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
      <BwAtmosphere variant="creation" />
      <div className="container-site relative z-[1]">
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
          {/* Grande — messagerie (priorité) */}
          <article className={`${BW_CARD} p-5 md:col-span-4 md:row-span-2 md:p-6`}>
            <CardHead
              title="Messagerie"
              href="/demonstrations/messagerie"
              accent="#7c3aed"
            />
            <MiniMessagerie />
          </article>

          {/* Verticale — agenda (priorité) */}
          <article className={`${BW_CARD} p-5 md:col-span-2 md:row-span-2`}>
            <CardHead
              title="Agenda"
              href="/demonstrations/agenda"
              accent="#2563eb"
            />
            <MiniAgenda />
          </article>

          {/* Réservation */}
          <article className={`${BW_CARD} p-5 md:col-span-3`}>
            <CardHead
              title="Réservation"
              href="/demonstrations/reservation"
              accent="#0d9488"
            />
            <MiniReservation />
          </article>

          {/* CRM */}
          <article className={`${BW_CARD} p-5 md:col-span-3`}>
            <CardHead title="CRM" href="/demonstrations/crm" accent="#ea580c" />
            <MiniCrm />
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
  const hours = ["09:00", "10:30", "14:00"] as const;
  const [hour, setHour] = useState<(typeof hours)[number]>("10:30");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-6 text-center">
        <p className="text-sm font-bold text-emerald-800">Créneau confirmé</p>
        <p className="mt-1 text-xs text-emerald-700">{hour} (simulation)</p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-2 text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
        >
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
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
        className="mt-3 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
      >
        Réserver
      </button>
    </div>
  );
}

function MiniMessagerie() {
  const threads = [
    {
      n: "SM",
      name: "Sophie Martin",
      t: "Le rendez-vous de jeudi est confirmé.",
      time: "10:42",
      unread: 2,
      color: "#7c3aed",
    },
    {
      n: "AN",
      name: "Atelier Nova",
      t: "Je viens de déposer les documents.",
      time: "09:18",
      unread: 1,
      color: "#2563eb",
    },
    {
      n: "TL",
      name: "Thomas Leroy",
      t: "On peut décaler à 14 h ?",
      time: "Hier",
      unread: 0,
      color: "#0d9488",
    },
  ] as const;
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-3 sm:grid-cols-[0.95fr_1.05fr]">
      <ul className="space-y-1.5">
        {threads.map((m, i) => (
          <li key={m.name}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                active === i
                  ? "border-violet-300 bg-violet-50/80"
                  : "border-slate-100 bg-slate-50/60 hover:border-slate-200"
              }`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-slate-800">{m.name}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">{m.time}</span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-500">{m.t}</span>
              </span>
              {m.unread > 0 ? (
                <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                  {m.unread}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex min-h-[11rem] flex-col rounded-2xl border border-slate-200 bg-[#efeae2]/40 p-3">
        <div className="mb-2 flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: threads[active].color }}
          >
            {threads[active].n}
          </span>
          <span className="text-xs font-bold text-slate-800">{threads[active].name}</span>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-2">
          <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-700 shadow-sm">
            {threads[active].t}
          </div>
          <div className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-[#dcf8c6] px-3 py-2 text-[11px] leading-relaxed text-slate-800 shadow-sm">
            Parfait, je confirme de mon côté.
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
          <span className="flex-1 text-[11px] text-slate-400">Écrire un message…</span>
          <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white">
            Envoyer
          </span>
        </div>
      </div>
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
          <p className="text-xs font-bold text-slate-800">Atelier Nova</p>
          <p className="text-[11px] text-slate-500">4 200 €</p>
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
  const events = [
    { day: "Lun", time: "09:00", title: "RDV Sophie", tone: "bg-blue-50 text-blue-800 border-blue-200" },
    { day: "Mar", time: "10:30", title: "Intervention", tone: "bg-teal-50 text-teal-800 border-teal-200" },
    { day: "Mer", time: "14:00", title: "Point équipe", tone: "bg-violet-50 text-violet-800 border-violet-200" },
    { day: "Jeu", time: "11:00", title: "Relance", tone: "bg-orange-50 text-orange-800 border-orange-200" },
  ] as const;
  const [sel, setSel] = useState(0);

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-4 gap-1.5">
        {events.map((e, i) => (
          <button
            key={e.day}
            type="button"
            onClick={() => setSel(i)}
            className={`rounded-lg border px-1 py-2 text-center transition ${
              sel === i
                ? "border-[#2563eb] bg-[#eff6ff]"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="block text-[10px] font-semibold text-slate-500">{e.day}</span>
            <span className="mt-0.5 block text-sm font-bold text-slate-900">
              {10 + i}
            </span>
          </button>
        ))}
      </div>
      <div className={`mt-3 flex-1 rounded-xl border px-3 py-3 ${events[sel].tone}`}>
        <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">
          {events[sel].time}
        </p>
        <p className="mt-1 text-sm font-bold">{events[sel].title}</p>
        <p className="mt-2 text-[11px] opacity-80">Semaine type — démo BeWork</p>
      </div>
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
