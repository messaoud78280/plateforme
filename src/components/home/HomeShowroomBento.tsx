"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  HOME_BG_SOFT,
  HOME_BTN_SECONDARY,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Showroom bento asymétrique — interfaces embarquées, données fictives. */
export function HomeShowroomBento() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { rootMargin: "120px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="demonstrations"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="showroom-heading"
    >
      <div className="container-site">
        <div className="max-w-3xl">
          <p className={HOME_EYEBROW}>Showroom</p>
          <h2
            id="showroom-heading"
            className="mt-4 font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.75rem] md:text-[3.25rem]"
          >
            Ce que vous pourriez
            <br />
            <span className="text-[#1d4ed8]">commencer à créer.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Pas des captures d’écran figées. Des mini-interfaces à explorer —
            pour ressentir ce qu’une idée peut devenir.
          </p>
        </div>

        <div
          className={`${HOME_CONTENT} grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5 lg:auto-rows-[minmax(11rem,auto)]`}
        >
          {/* Grande zone réservation */}
          <article className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:col-span-4 md:row-span-2 md:p-6">
            <Header title="Système de réservation" href="/demonstrations/reservation" accent="#0d9488" />
            {active ? <BentoReservation /> : <Skeleton />}
          </article>

          {/* Messagerie verticale */}
          <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:col-span-2 md:row-span-2 md:p-5">
            <Header title="Messagerie" href="/demonstrations/messagerie" accent="#7c3aed" />
            {active ? <BentoMessagerie /> : <Skeleton />}
          </article>

          {/* CRM */}
          <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:col-span-3 md:p-5">
            <Header title="CRM" href="/demonstrations/crm" accent="#ea580c" />
            {active ? <BentoCrm /> : <Skeleton />}
          </article>

          {/* Agenda */}
          <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:col-span-3 md:p-5">
            <Header title="Agenda" href="/demonstrations/agenda" accent="#2563eb" />
            {active ? <BentoAgenda /> : <Skeleton />}
          </article>

          {/* Dashboard large */}
          <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:col-span-4 md:p-5">
            <Header title="Tableau de bord" href="/demonstrations/dashboard" accent="#4f46e5" />
            {active ? <BentoDashboard /> : <Skeleton />}
          </article>

          {/* Espace client */}
          <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:col-span-2 md:p-5">
            <Header title="Espace client" href="/demonstrations/espace-client" accent="#059669" />
            {active ? <BentoClient /> : <Skeleton />}
          </article>

          {/* Site */}
          <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white to-[#eff6ff]/60 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:col-span-6 md:p-6 lg:col-span-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Header title="Site professionnel" href="/demonstrations/site" accent="#1d4ed8" />
                <p className="mt-2 max-w-lg text-sm text-slate-600">
                  Une présence en ligne claire, avec sections, formulaire et
                  appel à l’action — adaptée à votre activité.
                </p>
              </div>
              <Link
                href="/demonstrations"
                className={HOME_BTN_SECONDARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-showroom-all")}
              >
                Explorer toutes les démonstrations
              </Link>
            </div>
            {active ? <BentoSite /> : <Skeleton />}
          </article>
        </div>
      </div>
    </section>
  );
}

function Header({
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
        className="text-[11px] font-semibold text-slate-400 transition hover:text-[#1d4ed8]"
      >
        Ouvrir →
      </Link>
    </div>
  );
}

function Skeleton() {
  return <div className="mt-2 h-40 animate-pulse rounded-2xl bg-slate-100/80" />;
}

function BentoReservation() {
  const hours = ["09:00", "10:30", "14:00", "16:00"] as const;
  const [hour, setHour] = useState<(typeof hours)[number] | null>("10:30");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-8 text-center">
        <p className="text-sm font-bold text-emerald-800">Réservation simulée</p>
        <p className="mt-1 text-xs text-emerald-700">Créneau {hour} — aucune donnée réelle envoyée.</p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
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
                ? "border-[#0d9488] bg-teal-50 text-teal-800"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {h}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!hour}
        onClick={() => setDone(true)}
        className="mt-4 w-full rounded-xl bg-[#0d9488] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-40"
      >
        Réserver (simulation)
      </button>
    </div>
  );
}

function BentoMessagerie() {
  const [unread, setUnread] = useState(true);
  return (
    <div className="space-y-2">
      {[
        { name: "Camille", text: "Peux-tu valider le planning ?", live: true },
        { name: "Équipe", text: "Livraison reportée à jeudi.", live: false },
        { name: "Samir", text: "Le client a confirmé.", live: false },
      ].map((t) => (
        <button
          key={t.name}
          type="button"
          onClick={() => t.live && setUnread(false)}
          className="flex w-full items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-left transition hover:border-violet-200 hover:bg-violet-50/40"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
            {t.name.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{t.name}</span>
              {t.live && unread ? (
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-label="Non lu" />
              ) : null}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-slate-500">{t.text}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function BentoCrm() {
  const [stage, setStage] = useState(0);
  const stages = ["Prospect", "Qualifié", "Proposition", "Gagné"] as const;
  return (
    <div>
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
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

function BentoAgenda() {
  const [sel, setSel] = useState(1);
  const days = [
    { d: "12", label: "Visite" },
    { d: "13", label: "RDV client" },
    { d: "14", label: "Libre" },
    { d: "17", label: "Bilan" },
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
          <span className="mt-1 block text-[10px] font-medium text-slate-500">{day.label}</span>
        </button>
      ))}
    </div>
  );
}

function BentoDashboard() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Demandes", v: "128", d: "+12 %" },
          { l: "Réponse", v: "94 %", d: "+3 pts" },
          { l: "Satisfaction", v: "4,6", d: "stable" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-[10px] font-medium text-slate-500">{k.l}</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{k.v}</p>
            <p className="text-[10px] font-semibold text-emerald-700">{k.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-16 items-end gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-2">
        {[35, 58, 44, 72, 50, 68, 40].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-[#4f46e5]/85 transition hover:bg-[#4f46e5]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function BentoClient() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-emerald-50/40 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">Progression</span>
        <span className="font-bold text-emerald-700">72 %</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full w-[72%] rounded-full bg-emerald-600" />
      </div>
      <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
        <li>• 3 documents partagés</li>
        <li>• 1 validation en attente</li>
      </ul>
    </div>
  );
}

function BentoSite() {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="ml-2 text-[10px] font-medium text-slate-400">votre-activite.fr</span>
      </div>
      <div className="grid gap-0 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">
            Accueil
          </p>
          <p className="mt-2 font-display text-lg font-extrabold tracking-tight text-[#0a0a0a]">
            Une présence claire pour votre métier
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Présentation, services, formulaire de contact — le cadre d’un site
            professionnel.
          </p>
        </div>
        <div className="border-t border-slate-100 bg-[#f8fafc] p-4 sm:border-l sm:border-t-0 sm:p-5">
          <p className="text-xs font-bold text-slate-800">Demande</p>
          <div className="mt-2 space-y-2">
            <div className="h-8 rounded-lg border border-slate-200 bg-white" />
            <div className="h-8 rounded-lg border border-slate-200 bg-white" />
            <div className="h-8 rounded-lg bg-[#1d4ed8]" />
          </div>
        </div>
      </div>
    </div>
  );
}
