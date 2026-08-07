import Image from "next/image";
import type { JSX } from "react";

const PILLARS: { title: string; body: string; Icon: () => JSX.Element }[] = [
  {
    title: "Expérience terrain",
    body: "Plus de 20 ans d’expérience terrain dans le bâtiment et la tenue de marchés.",
    Icon: IconHardHat,
  },
  {
    title: "Spécialisation BTP",
    body: "Assistants spécialisés, formés aux marchés publics et privés — pas du secrétariat généraliste.",
    Icon: IconTarget,
  },
  {
    title: "Missions suivies",
    body: "Chaque usage reste suivi et validé dans la plateforme, du cadrage à la livraison.",
    Icon: IconCheckShield,
  },
  {
    title: "IA sous contrôle humain",
    body: "Les outils d’IA accélèrent la préparation ; vos équipes gardent le fil et la validation.",
    Icon: IconChip,
  },
];

/** Section « preuve & crédibilité » — 4 piliers vérifiables, sans statistique inventée. */
export function HomeCredibilitySection() {
  return (
    <section
      id="preuve-credibilite"
      className="relative scroll-mt-28 bg-transparent px-6 py-14 md:py-20 lg:py-24"
      aria-labelledby="credibility-heading"
    >
      <div className="container-site">
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="credibility-heading"
            className="font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0f172a] md:text-[2.25rem]"
          >
            Une méthode construite à partir du terrain BTP
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            BeWork n&apos;est pas un outil IA générique ni un secrétariat classique : assistants spécialisés,
            supervisés depuis la France.
          </p>
        </header>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <article key={p.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff6ff] text-[#1d4ed8]" aria-hidden>
                <p.Icon />
              </span>
              <h3 className="mt-4 text-[0.9375rem] font-bold leading-snug text-[#0f172a]">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:text-left md:p-6">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
            <Image
              src="/laure-olivie-chantier.png"
              alt="Laure Olivie, fondatrice de BeWork, sur chantier"
              fill
              className="object-cover object-[center_20%]"
              sizes="64px"
            />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-sm font-bold text-[#0f172a]">Laure Olivié — fondatrice BeWork</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Dirigeante BTP, 20 ans de terrain en Île-de-France. Une approche issue du réel, pas de la théorie.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function IconHardHat() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 18a8 8 0 1 1 16 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 18h20M12 10V6" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCheckShield() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconChip() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path strokeLinecap="round" d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </svg>
  );
}
