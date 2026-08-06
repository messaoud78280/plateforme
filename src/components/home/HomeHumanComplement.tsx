import Link from "next/link";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const EXAMPLES = [
  "Analyse de dossiers et préparation d’appels d’offres",
  "Suivi administratif, comptes rendus et situations",
  "Relances, réserves et DOE",
] as const;

/** Offre humaine complémentaire — second niveau. */
export function HomeHumanComplement() {
  return (
    <section id="accompagnement" className="scroll-mt-24 bg-[#f8fafc] px-6 py-14 md:py-20 lg:py-24" aria-labelledby="human-heading">
      <div className="container-site">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Offre complémentaire</p>
          <h2 id="human-heading" className="mt-2 font-display text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2rem]">
            Besoin de plus qu&apos;une plateforme&nbsp;?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Les assistants travaux BeWork peuvent également intervenir directement dans votre environnement pour
            renforcer vos équipes lors d&apos;une surcharge ou prendre en charge certaines missions.
          </p>
          <ul className="mt-5 space-y-2">
            {EXAMPLES.map((ex) => (
              <li key={ex} className="flex gap-2 text-sm text-slate-800">
                <span className="text-[#1d4ed8]" aria-hidden>
                  ✓
                </span>
                {ex}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/assistants-administratifs-taches"
              className="inline-flex rounded-lg border border-[#1d4ed8]/35 bg-[#eff6ff] px-4 py-2.5 text-sm font-semibold text-[#1e3a8a] transition hover:bg-[#dbeafe]"
            >
              Voir les missions d&apos;accompagnement
            </Link>
            <Link
              href="/contact#formulaire"
              className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-human-complement")}
            >
              En parler avec BeWork
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
