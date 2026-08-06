import Link from "next/link";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const DOMAINS = [
  "Diagnostic des besoins",
  "Conception fonctionnelle",
  "Paramétrage et personnalisation",
  "Formation des utilisateurs",
  "Support et maintenance",
  "Évolution continue",
  "Amélioration des outils IA",
  "Intégrations avec vos outils",
] as const;

/**
 * Partenaire technologique — remplace la section « assistants travaux ».
 * BeWork n’exécute pas les missions quotidiennes du client.
 */
export function HomeTechPartner() {
  return (
    <section id="partenaire" className="scroll-mt-24 bg-[#f8fafc] px-6 py-14 md:py-20 lg:py-24" aria-labelledby="partner-heading">
      <div className="container-site">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Rôle de BeWork</p>
          <h2 id="partner-heading" className="mt-2 font-display text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2rem]">
            Un partenaire technologique spécialisé dans le BTP
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            BeWork vous accompagne dans la conception, le déploiement et l&apos;évolution de votre plateforme. Nos
            interventions concernent le fonctionnement de la solution, sa configuration, ses outils IA, sa sécurité et
            son adaptation à votre organisation — pas l&apos;exécution de vos missions quotidiennes.
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {DOMAINS.map((d) => (
              <li key={d} className="flex gap-2 text-sm text-slate-800">
                <span className="text-[#1d4ed8]" aria-hidden>
                  ✓
                </span>
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            BeWork ne se substitue pas à vos salariés dans l&apos;analyse finale, la conduite des travaux ou les
            décisions contractuelles.
          </p>
          <div className="mt-6">
            <Link
              href="/contact#formulaire"
              className="inline-flex rounded-lg bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-tech-partner")}
            >
              Parler de votre projet
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
