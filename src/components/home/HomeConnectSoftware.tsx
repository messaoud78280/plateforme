import { HOME_SECTION } from "@/components/home/homeSectionStyles";

const SOFTWARES = [
  { name: "Onaya / Orisha", cat: "Gestion BTP" },
  { name: "Sage", cat: "Comptabilité" },
  { name: "Agicap", cat: "Trésorerie" },
  { name: "Outlook / Microsoft 365", cat: "Messagerie" },
  { name: "Google Workspace", cat: "Collaboration" },
  { name: "Drive / SharePoint", cat: "Documents" },
  { name: "Logiciels de planning", cat: "Planning" },
  { name: "Logiciels comptables", cat: "Finance" },
] as const;

const FLOW_STEPS = [
  { icon: "📤", text: "Votre logiciel transmet une information à BeWork." },
  { icon: "🔍", text: "BeWork récupère l'information utile." },
  { icon: "🔄", text: "La plateforme se met à jour." },
  { icon: "🔔", text: "L'équipe concernée est prévenue." },
] as const;

/** Section connexion logiciels — diagramme et explication sans jargon. */
export function HomeConnectSoftware() {
  return (
    <section id="connexions" className={`${HOME_SECTION} bg-[#fafafa]`} aria-labelledby="connect-heading">
      <div className="container-site">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Connexions
          </p>
          <h2
            id="connect-heading"
            className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
          >
            Vous avez déjà vos logiciels.
          </h2>
          <p className="font-display mt-1 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#7c3aed] sm:text-[2.25rem] md:text-[2.75rem]">
            BeWork peut les faire travailler ensemble.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Vous utilisez déjà un logiciel de devis, de comptabilité, de trésorerie, de planning, une messagerie ou un
            espace documentaire ?{" "}
            <strong className="font-semibold text-[#0a0a0a]">Notre objectif n&apos;est pas de tout remplacer.</strong>
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            Nous étudions les possibilités de connexion entre vos outils et votre plateforme BeWork afin d&apos;éviter
            les doubles saisies et de faire circuler les informations{" "}
            <em>lorsque les interfaces disponibles le permettent</em>.
          </p>
        </div>

        {/* Diagramme */}
        <div className="mt-12 sm:mt-14 md:mt-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-0 sm:items-stretch">
              {/* Outils existants */}
              <div className="rounded-2xl border border-[#ddd6fe] bg-[#f5f3ff] p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed] mb-3">
                  Vos logiciels existants
                </p>
                <ul className="space-y-2">
                  {SOFTWARES.map((s) => (
                    <li
                      key={s.name}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#ddd6fe] bg-white px-3 py-2"
                    >
                      <span className="text-xs font-semibold text-slate-800">{s.name}</span>
                      <span className="shrink-0 rounded-full bg-[#f5f3ff] px-2 py-0.5 text-[10px] font-medium text-[#7c3aed]">
                        {s.cat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Flèches */}
              <div className="flex flex-row items-center justify-center gap-3 sm:flex-col sm:gap-0 sm:px-6">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-300" aria-hidden>→</span>
                </div>
                <div className="hidden sm:block h-px sm:h-auto sm:w-px flex-1 border-t sm:border-t-0 sm:border-l border-dashed border-slate-300" />
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-300" aria-hidden>←</span>
                </div>
              </div>

              {/* BeWork */}
              <div className="rounded-2xl border border-[#bfdbfe] bg-gradient-to-b from-[#eff6ff] to-[#eef2ff] p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563eb] mb-3">
                  Votre plateforme BeWork
                </p>
                <div className="rounded-xl border border-[#bfdbfe] bg-white p-4">
                  <p className="font-display text-xl font-extrabold tracking-tight text-[#0f1e3a]">BeWork</p>
                  <p className="mt-1 text-xs text-slate-500">Plateforme métier centrale</p>
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium text-slate-700">✓ Données centralisées</p>
                    <p className="text-xs font-medium text-slate-700">✓ Équipes informées</p>
                    <p className="text-xs font-medium text-slate-700">✓ Double saisie évitée</p>
                    <p className="text-xs font-medium text-slate-700">✓ Processus automatisés</p>
                  </div>
                </div>

                {/* Flow */}
                <div className="mt-4 space-y-2">
                  {FLOW_STEPS.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="shrink-0 text-sm" aria-hidden>
                        {step.icon}
                      </span>
                      <p className="text-xs leading-relaxed text-slate-600">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Note responsable */}
            <p className="mt-6 text-center text-sm text-slate-500">
              Nous étudions les possibilités de connexion avec vos logiciels existants.{" "}
              <em>Toutes les intégrations ne sont pas systématiquement disponibles.</em>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
