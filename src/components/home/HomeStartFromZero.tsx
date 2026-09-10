import {
  HOME_BG_WHITE,
  HOME_CARD,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_H2,
  HOME_HEADER,
  HOME_LEAD,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";

const ZERO_LINES = [
  "Vous n’avez jamais codé.",
  "Vous ne connaissez pas le vocabulaire des développeurs.",
  "Vous n’avez jamais créé d’application.",
] as const;

const PROFILES = [
  {
    title: "Un artisan",
    items: ["Outil de devis", "Planning", "Suivi client"],
  },
  {
    title: "Un restaurateur",
    items: ["Réservation", "Gestion des demandes"],
  },
  {
    title: "Un indépendant",
    items: ["Espace client", "Prise de rendez-vous"],
  },
  {
    title: "Une entreprise",
    items: ["CRM", "Application interne", "Tableau de bord"],
  },
  {
    title: "Un porteur de projet",
    items: ["Prototype", "Site", "Application"],
  },
] as const;

/** Rassurer les débutants — sans infantiliser. */
export function HomeStartFromZero() {
  return (
    <section
      id="partir-de-zero"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="zero-heading"
    >
      <div className="container-site">
        <div className={HOME_HEADER}>
          <p className={HOME_EYEBROW}>Débutants bienvenus</p>
          <h2 id="zero-heading" className={HOME_H2}>
            <span className="block text-slate-400">Vous partez de zéro&nbsp;?</span>
            <span className="mt-2 block">C’est justement le principe.</span>
          </h2>
          <div className={`${HOME_LEAD} space-y-3`}>
            {ZERO_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="font-semibold text-[#0a0a0a]">Ce n’est pas un problème.</p>
          </div>
        </div>

        <div className={`${HOME_CONTENT} mx-auto max-w-3xl space-y-4 text-center`}>
          <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
            Nous ne vous demandons pas de devenir informaticien.
          </p>
          <p className="font-display text-xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-2xl">
            Nous vous apprenons à utiliser une nouvelle manière de créer.
          </p>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Le plus important n’est plus de savoir comment écrire le code. C’est
            de savoir ce que vous voulez construire — et d’apprendre à le
            guider jusqu’à un résultat concret.
          </p>
        </div>

        <div
          className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`}
        >
          {PROFILES.map((profile) => (
            <article key={profile.title} className={`${HOME_CARD} p-5`}>
              <h3 className="font-display text-base font-bold tracking-tight text-[#0a0a0a]">
                {profile.title}
              </h3>
              <ul className="mt-3 space-y-1.5">
                {profile.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
