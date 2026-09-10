"use client";

import { useState } from "react";

const SECTIONS = [
  {
    id: "accueil",
    title: "Accueil",
    body: "Une présence en ligne claire : qui vous êtes, ce que vous proposez, et comment vous contacter.",
  },
  {
    id: "offres",
    title: "Offres",
    body: "Présentez vos prestations en cartes simples — sans jargon, avec un appel à l’action.",
  },
  {
    id: "contact",
    title: "Contact",
    body: "Formulaire court, coordonnées, et message de confirmation rassurant.",
  },
] as const;

/** Mock léger — site professionnel (données fictives). */
export function DemoSite() {
  const [active, setActive] = useState<(typeof SECTIONS)[number]["id"]>("accueil");
  const section = SECTIONS.find((s) => s.id === active)!;

  return (
    <div>
      <div className="border-b border-slate-100 bg-gradient-to-br from-[#eff6ff] to-white px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Aperçu de structure</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Votre marque, votre site
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Exemple de navigation et de sections — à adapter à votre activité pendant la formation.
        </p>
      </div>

      <nav className="flex gap-1 border-b border-slate-100 px-4 pt-3" aria-label="Sections fictives">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
              active === s.id
                ? "bg-white text-[#1d4ed8] shadow-[0_-1px_0_#e2e8f0]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {s.title}
          </button>
        ))}
      </nav>

      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{section.body}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {["Clarté", "Confiance", "Action"].map((card) => (
            <div
              key={card}
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#93c5fd] hover:shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-900">{card}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Bloc illustratif — contenu fictif pour la démonstration.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
