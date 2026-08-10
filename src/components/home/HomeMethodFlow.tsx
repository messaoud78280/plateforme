import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const STEPS = [
  { title: "Comprendre", text: "Nous observons votre façon de travailler." },
  { title: "Imaginer", text: "Nous définissons la solution utile." },
  { title: "Construire", text: "Nous développons et connectons les outils nécessaires." },
  { title: "Déployer", text: "Nous intégrons la solution dans l'entreprise." },
  { title: "Former", text: "Nous formons les collaborateurs concernés." },
  { title: "Accompagner", text: "Jusqu'à l'utilisation réelle au quotidien." },
  { title: "Faire évoluer", text: "La solution évolue avec vos usages." },
] as const;

/** Méthode complète — peu de texte. */
export function HomeMethodFlow() {
  return (
    <section id="approche" className={`${HOME_SECTION} bg-white`} aria-labelledby="method-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="method-heading"
          title="Notre approche."
          lead="Nous ne livrons pas un outil pour vous laisser seuls ensuite."
        />

        <ol className={`${HOME_CONTENT} mx-auto max-w-2xl`}>
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 pb-8 last:pb-0 sm:gap-6">
              {i < STEPS.length - 1 ? (
                <span className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200 sm:left-[19px]" aria-hidden />
              ) : null}
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 sm:h-10 sm:w-10 sm:text-sm">
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5 sm:pt-1.5">
                <p className="font-display text-lg font-extrabold tracking-tight text-[#0a0a0a] sm:text-xl">
                  {s.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
