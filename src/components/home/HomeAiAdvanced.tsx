import { HOME_SECTION } from "@/components/home/homeSectionStyles";

const CAPABILITIES = [
  { icon: "📄", label: "Analyse documentaire", desc: "Lire, synthétiser et extraire les informations utiles." },
  { icon: "🔍", label: "Recherche intelligente", desc: "Retrouver n'importe quelle information dans vos dossiers." },
  { icon: "🤖", label: "Assistants spécialisés", desc: "Assistants dédiés à vos métiers BTP." },
  { icon: "⚙️", label: "Automatisations complexes", desc: "Workflows avancés sur mesure." },
  { icon: "🏗️", label: "Applications métier", desc: "Outils spécifiques que les logiciels standards ne couvrent pas." },
  { icon: "📊", label: "Traitement de données", desc: "Exploiter vos données chantier, financières et opérationnelles." },
] as const;

export function HomeAiAdvanced() {
  return (
    <section id="solutions-avancees" className={`${HOME_SECTION} bg-white`} aria-labelledby="ai-heading">
      <div className="container-site">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">
              Solutions sur mesure
            </p>
            <h2
              id="ai-heading"
              className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
            >
              Et si votre besoin va plus loin&nbsp;?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Certaines entreprises ont des besoins qu&apos;aucun logiciel standard ne couvre. BeWork peut développer
              des outils métier spécifiques, des automatisations avancées et des solutions utilisant l&apos;intelligence
              artificielle lorsque cela apporte une vraie valeur opérationnelle.
            </p>
          </div>

          {/* Capacités */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 sm:mt-12">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.label}
                className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
              >
                <span className="text-xl shrink-0">{cap.icon}</span>
                <div>
                  <p className="text-sm font-bold text-[#0a0a0a]">{cap.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message clé */}
          <div className="mt-10 rounded-2xl border border-[#ddd6fe] bg-gradient-to-br from-[#f5f3ff] to-[#faf5ff] px-7 py-8 text-center sm:mt-12">
            <p className="font-display text-xl font-extrabold tracking-tight text-[#7c3aed] sm:text-2xl">
              Vous imaginez. Nous étudions comment le construire.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              Nous utilisons la technologie adaptée au problème à résoudre.{" "}
              <strong className="font-semibold text-[#0a0a0a]">
                L&apos;IA n&apos;est pas le produit. C&apos;est l&apos;un des outils que nous pouvons utiliser
                pour construire la bonne solution.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
