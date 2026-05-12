import { Clock, Eye, ShieldCheck } from "lucide-react";
import { HeroPresentationVideo } from "@/components/HeroPresentationVideo";

const CALLOUTS = [
  {
    Icon: Clock,
    title: "Gagnez du temps",
    description: "Automatisez les tâches administratives",
  },
  {
    Icon: ShieldCheck,
    title: "Fiabilité & conformité",
    description: "Données sécurisées et conformes RGPD",
  },
  {
    Icon: Eye,
    title: "Plus de visibilité",
    description: "Pilotez vos chantiers en temps réel",
  },
] as const;

function CalloutCard({
  Icon,
  title,
  description,
}: {
  Icon: (typeof CALLOUTS)[number]["Icon"];
  title: string;
  description: string;
}) {
  return (
    <li className="rounded-xl border border-slate-200/85 bg-white/80 px-3.5 py-2.5 shadow-[0_8px_28px_-14px_rgba(15,23,42,0.12)] ring-1 ring-slate-100/90 backdrop-blur-[2px]">
      <div className="flex gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] text-[#1d4ed8] shadow-inner shadow-white/60 ring-[0.5px] ring-[#bfdbfe]/80">
          <Icon className="h-[17px] w-[17px] stroke-[1.75]" aria-hidden />
        </span>
        <div className="min-w-0 pt-px">
          <p className="text-[13px] font-semibold leading-tight tracking-tight text-[#0f172a]">{title}</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-slate-600">{description}</p>
        </div>
      </div>
    </li>
  );
}

/** Colonne droite hero : vidéo premium + mini-callouts (desktop à droite du téléphone). */
export function HomeHeroAside() {
  return (
    <div className="relative mx-auto flex w-full max-w-[min(100%,340px)] flex-col lg:max-w-none">
      <div className="relative flex justify-center lg:min-h-[min(520px,70vh)] lg:justify-end xl:items-start xl:pr-[13.5rem]">
        <ul
          className="absolute right-0 top-[18%] z-[15] hidden w-[13rem] flex-col gap-3 xl:flex"
          aria-label="Bénéfices"
        >
          {CALLOUTS.map(({ Icon, title, description }) => (
            <CalloutCard key={title} Icon={Icon} title={title} description={description} />
          ))}
        </ul>
        <HeroPresentationVideo />
        <div className="pointer-events-none absolute bottom-[6%] right-[-0.25rem] z-[18] hidden xl:block" aria-hidden>
          <div className="rounded-full bg-gradient-to-br from-slate-200 via-white to-slate-400 p-[3px] shadow-[0_14px_36px_-10px_rgba(37,99,235,0.45)] ring-1 ring-[#2563eb]/35">
            <div className="flex h-[4.75rem] w-[4.75rem] flex-col items-center justify-center rounded-full bg-gradient-to-b from-slate-800 via-slate-950 to-black px-2 text-center">
              <span className="text-[7px] font-bold uppercase leading-[1.2] tracking-[0.08em] text-white">
                IA au service des pros du BTP
              </span>
            </div>
          </div>
        </div>
      </div>
      <ul className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 xl:hidden" aria-label="Bénéfices">
        {CALLOUTS.map(({ Icon, title, description }) => (
          <CalloutCard key={title} Icon={Icon} title={title} description={description} />
        ))}
      </ul>
    </div>
  );
}
