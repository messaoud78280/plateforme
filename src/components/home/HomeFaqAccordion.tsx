"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BW_EYEBROW,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { FORMATION_FAQ } from "@/lib/bework-formation";

const HOME_FAQ = FORMATION_FAQ.filter((item) =>
  [
    "Faut-il savoir coder ?",
    "Est-ce adapté aux débutants ?",
    "Que peut-on créer ?",
    "Dois-je venir avec mon ordinateur ?",
    "Puis-je venir avec une idée ?",
    "Que vais-je savoir faire après ?",
    "Quels outils utilisez-vous ?",
  ].includes(item.q),
);

/** FAQ homepage — accordéons premium, 2 colonnes. */
export function HomeFaqAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className={BW_SECTION} aria-labelledby="faq-heading">
      <BwAtmosphere variant="reassurance" />
      <div className="container-site relative z-[1]">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <p className={BW_EYEBROW}>FAQ</p>
            <h2
              id="faq-heading"
              className="mt-3 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem]"
            >
              Des questions&nbsp;?
              <br />
              <span className="text-[#2563eb]">C’est normal.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-base">
              Les réponses essentielles avant de demander une place.{" "}
              <Link
                href="/faq"
                className="font-semibold text-[#0a0a0a] underline-offset-2 hover:underline"
              >
                Voir toute la FAQ
              </Link>
            </p>
          </div>

          <div className="space-y-3">
            {HOME_FAQ.map((item, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-[#0a0a0a] sm:text-base">
                      {item.q}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-500 transition ${
                        isOpen ? "bg-[#2563eb] text-white border-[#2563eb]" : ""
                      }`}
                      aria-hidden
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                      <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
