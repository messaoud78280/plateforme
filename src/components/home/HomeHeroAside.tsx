import { BEWORK_VALUE_PILLARS } from "@/lib/bework-value-pillars";
import { Clock, Eye, ShieldCheck } from "lucide-react";
import { HeroPresentationVideo } from "@/components/HeroPresentationVideo";
import { HomeHeroIaPlanBadge } from "@/components/home/HomeHeroIaPlanBadge";

const CALLOUTS = [
  {
    Icon: ShieldCheck,
    title: BEWORK_VALUE_PILLARS[3]!.label,
    description: "Process cadré · validation humaine",
  },
  {
    Icon: Clock,
    title: "Productivité ×10",
    description: BEWORK_VALUE_PILLARS[4]!.detail.split(" — ")[0] ?? BEWORK_VALUE_PILLARS[4]!.label,
  },
  {
    Icon: Eye,
    title: BEWORK_VALUE_PILLARS[5]!.label,
    description: "Pilotage depuis la France",
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
    <li className="rounded-xl border border-slate-200/85 bg-white/90 px-3.5 py-3 shadow-[0_10px_32px_-16px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/95 backdrop-blur-[4px] lg:px-4 lg:py-3.5">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] text-[#1d4ed8] shadow-inner shadow-white/70 ring-[0.5px] ring-[#bfdbfe]/90">
          <Icon className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-semibold leading-tight tracking-tight text-[#0f172a] lg:text-base">{title}</p>
          <p className="mt-1 text-xs leading-snug text-slate-700 lg:text-sm">{description}</p>
        </div>
      </div>
    </li>
  );
}

/** Colonne droite hero : une seule vidéo (téléphone), encarts + badge IA */
export function HomeHeroAside() {
  return (
    <div className="relative mx-auto flex w-full max-w-[min(100%,340px)] flex-col lg:max-w-none">
      <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center lg:gap-10 xl:justify-end xl:gap-12">
        <div className="flex shrink-0 justify-center lg:justify-end">
          <HeroPresentationVideo verticalShift={false} />
        </div>

        <div className="flex w-full max-w-[19rem] flex-col items-center gap-3 lg:max-w-[17rem] lg:items-stretch xl:max-w-[17.5rem]">
          <ul className="flex w-full flex-col gap-3" aria-label="Bénéfices">
            {CALLOUTS.map(({ Icon, title, description }) => (
              <CalloutCard key={title} Icon={Icon} title={title} description={description} />
            ))}
          </ul>

          <div className="-mt-1 pointer-events-none flex w-full justify-center lg:-mt-4 lg:justify-start xl:-mt-5 xl:justify-end" aria-hidden>
            <HomeHeroIaPlanBadge />
          </div>
        </div>
      </div>
    </div>
  );
}
