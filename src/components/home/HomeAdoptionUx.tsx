import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_SOFT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const ROLES = [
  { label: "Direction", desc: "Vue globale — chantiers, finances, alertes." },
  { label: "Conducteur de travaux", desc: "Suivi chantier, documents, équipes, commandes." },
  { label: "Chargé d'affaires", desc: "Devis, marchés, situations, relations client." },
  { label: "Administratif", desc: "Facturation, fournisseurs, contrôles, paiements." },
] as const;

/** Simplicité d'usage + adoption — puissante derrière, simple devant. */
export function HomeAdoptionUx() {
  return (
    <section id="adoption" className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="adoption-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="adoption-heading"
          title={
            <>
              Puissante derrière.
              <span className="mt-2 block text-slate-500">Simple devant.</span>
            </>
          }
          lead="Chacun voit principalement ce qui lui est utile. La complexité reste invisible."
        />

        <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => (
            <div
              key={role.label}
              className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
            >
              <p className="text-sm font-bold text-[#0a0a0a]">{role.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{role.desc}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed text-slate-500">
          Nous concevons des interfaces simples et accompagnons vos collaborateurs jusqu&apos;à leur
          utilisation réelle au quotidien. La plateforme évolue avec vos usages.
        </p>
      </div>
    </section>
  );
}
