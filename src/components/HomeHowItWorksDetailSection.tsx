import type { JSX } from "react";

const BLUE = "#2563eb";

const STEPS: {
  n: number;
  title: string;
  body: string;
  Icon: () => JSX.Element;
}[] = [
  {
    n: 1,
    title: "Vous décrivez la surcharge",
    body: "Appel d’offres, démarrage, documents en retard, situations ou DOE : le besoin est qualifié.",
    Icon: IconInbox,
  },
  {
    n: 2,
    title: "Nous définissons la mission",
    body: "Documents nécessaires, échéance, livrable et responsabilités sont cadrés.",
    Icon: IconUserLink,
  },
  {
    n: 3,
    title: "Le Beworker prend le relais",
    body: "Il prépare, organise, relance et suit les éléments convenus.",
    Icon: IconBriefcase,
  },
  {
    n: 4,
    title: "Vous suivez l’avancement",
    body: "Vous consultez les échanges, les éléments reçus et la prochaine action attendue.",
    Icon: IconCheckCircle,
  },
];

/** Section « Fonctionnement » — parcours simple, 4 étapes. */
export function HomeHowItWorksDetailSection() {
  return (
    <section
      id="process-bework"
      className="relative scroll-mt-28 bg-transparent px-6 py-14 md:py-20 lg:py-24"
      aria-labelledby="how-detail-heading"
    >
      {/* Ancre héritée : anciens liens / signets #comment-ca-marche */}
      <span
        id="comment-ca-marche"
        className="pointer-events-none absolute left-0 top-0 block h-px w-px overflow-hidden opacity-0"
        aria-hidden
      />
      <div className="container-site">
        <header className="mx-auto mb-12 max-w-2xl text-center md:mb-14">
          <h2
            id="how-detail-heading"
            className="font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0f172a] md:text-[2.25rem]"
          >
            Un renfort simple à mettre en place
          </h2>
          <p className="mx-auto mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Vous décrivez votre besoin, nous cadrons la mission, un Beworker prend le relais — vous suivez
            l&apos;avancement.
          </p>
        </header>

        <ol className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: BLUE }}
                >
                  {s.n}
                </span>
                <span className="shrink-0 [&_svg]:h-[18px] [&_svg]:w-[18px]" style={{ color: BLUE }} aria-hidden>
                  <s.Icon />
                </span>
              </div>
              <h3 className="mt-3.5 text-base font-bold leading-snug text-[#0f172a]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-600">
          Vos Beworkers peuvent s&apos;appuyer sur vos outils existants (Excel, Drive, SharePoint, Chorus Pro, Batigest,
          EBP, Sage…) et sur nos outils d&apos;intelligence artificielle pour accélérer la préparation.
        </p>
      </div>
    </section>
  );
}

function IconInbox() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-6l-2 3H10l-2-3H2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function IconUserLink() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 11h-4M20 9v4" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <circle cx={12} cy={12} r={9} />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}
