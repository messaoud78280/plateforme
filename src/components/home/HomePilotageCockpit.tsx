import { HomeProductPreview } from "@/components/home/HomeProductPreview";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const PILLARS = [
  { title: "À faire", text: "Les actions et échéances qui avancent le chantier." },
  { title: "À surveiller", text: "Les risques, retards et points qui dérivent." },
  { title: "À décider", text: "Ce qui attend une validation de votre part." },
] as const;

/** Cockpit entreprise — peu de texte, grande vue produit. */
export function HomePilotageCockpit() {
  return (
    <section id="pilotage" className={`${HOME_SECTION} bg-white`} aria-labelledby="pilotage-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="pilotage-heading"
          title="Un seul endroit pour savoir ce qui se passe."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-5xl`}>
          <HomeProductPreview large />
        </div>

        <ul className="mx-auto mt-12 grid max-w-3xl gap-10 sm:mt-14 sm:grid-cols-3 sm:gap-8">
          {PILLARS.map((p) => (
            <li key={p.title} className="text-center">
              <h3 className="font-display text-xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-2xl">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
