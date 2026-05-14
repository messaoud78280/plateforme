import {
  Bell,
  Calendar,
  Car,
  CheckCircle2,
  Gift,
  Headphones,
  Plane,
  Settings,
  UtensilsCrossed,
  LayoutGrid,
  Hotel,
} from "lucide-react";

const BLUE = "#2F5BFF";

function StatusPill({ tone, label }: { tone: "success" | "progress"; label: string }) {
  if (tone === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
        <CheckCircle2 className="size-4" aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-semibold ring-1 ring-blue-200/70"
      style={{ color: BLUE }}
    >
      <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: BLUE }} aria-hidden />
      {label}
    </span>
  );
}

function SidebarIcon({ icon, active }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <div
      className={[
        "grid size-10 place-items-center rounded-2xl transition",
        active ? "bg-blue-50 text-slate-900" : "text-slate-500 hover:bg-slate-50",
      ].join(" ")}
      style={active ? { color: BLUE } : undefined}
      aria-hidden
    >
      {icon}
    </div>
  );
}

function RequestRow({
  title,
  subtitle,
  tone,
  status,
  icon,
}: {
  title: string;
  subtitle: string;
  tone: "success" | "progress";
  status: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:gap-4 sm:px-4">
      <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-50 sm:size-14">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100" />
        <div className="relative text-slate-700">{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold tracking-tight text-slate-900 sm:text-[14.5px]">{title}</p>
        <p className="mt-0.5 truncate text-[12px] text-slate-500 sm:text-[13px]">{subtitle}</p>
        <div className="mt-2">
          <StatusPill tone={tone} label={status} />
        </div>
      </div>
      <svg className="size-4 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function FloatingCard({
  title,
  meta1,
  meta2,
  icon,
}: {
  title: string;
  meta1: string;
  meta2: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:gap-3 sm:px-4">
      <div
        className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-50 ring-1 ring-blue-200/50"
        style={{ color: BLUE }}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold tracking-tight text-slate-900">{title}</p>
        <p className="mt-0.5 text-[12px] text-slate-500">{meta1}</p>
        <p className="mt-0.5 text-[12px] text-slate-500">{meta2}</p>
      </div>
    </div>
  );
}

export function ConciergerieFloatingUi({ className }: { className?: string }) {
  return (
    <div className={["relative w-full", className].filter(Boolean).join(" ")}>
      <div className="flex w-full max-w-[min(100%,920px)] flex-col gap-5 md:gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Dashboard principal */}
        <div className="relative w-full min-w-0 max-w-[min(640px,100%)] shrink-0 rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-stretch">
            <div className="flex w-[68px] shrink-0 flex-col items-center gap-3 border-r border-slate-100 px-2 py-4 sm:w-[72px] sm:px-3">
              <div className="grid size-10 place-items-center rounded-full bg-slate-900 text-white">
                <span className="text-[12px] font-extrabold tracking-tight">BW</span>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <SidebarIcon icon={<LayoutGrid className="size-[18px]" />} />
                <SidebarIcon icon={<Calendar className="size-[18px]" />} active />
                <SidebarIcon icon={<Bell className="size-[18px]" />} />
                <SidebarIcon icon={<Settings className="size-[18px]" />} />
              </div>
            </div>

            <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-slate-900">Votre conciergerie BeWork</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">Demandes en cours</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <RequestRow
                  title="Réservation hôtel"
                  subtitle="Paris — 2 nuits"
                  tone="success"
                  status="Confirmé"
                  icon={<Hotel className="size-[18px]" aria-hidden />}
                />
                <RequestRow
                  title="Location véhicule"
                  subtitle="3 jours"
                  tone="progress"
                  status="En cours"
                  icon={<Car className="size-[18px]" aria-hidden />}
                />
                <RequestRow
                  title="Vol Paris → Marseille"
                  subtitle="12 mai — 08:15"
                  tone="success"
                  status="Confirmé"
                  icon={<Plane className="size-[18px]" aria-hidden />}
                />
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold" style={{ color: BLUE }}>
                Voir toutes les demandes <span aria-hidden>→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cartes latérales */}
        <div className="flex w-full max-w-[280px] flex-col gap-3 sm:max-w-none lg:mt-1 lg:w-[260px] lg:max-w-[260px] lg:shrink-0">
          <FloatingCard
            title="Restaurant réservé"
            meta1="8 personnes"
            meta2="Le 14/05 à 20h00"
            icon={<UtensilsCrossed className="size-[18px]" aria-hidden />}
          />
          <FloatingCard
            title="Véhicule livré"
            meta1="Sur chantier"
            meta2="Le 13/05 à 09h00"
            icon={<Car className="size-[18px]" aria-hidden />}
          />
          <FloatingCard
            title="Cadeaux envoyés"
            meta1="Clients & équipes"
            meta2="Le 12/05"
            icon={<Gift className="size-[18px]" aria-hidden />}
          />
        </div>
      </div>

      <div className="mt-6 w-full max-w-[min(640px,100%)] lg:mt-8">
        <div className="flex items-center gap-3 rounded-[18px] bg-gradient-to-br from-[#0B1B3A] to-[#08214E] px-4 py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-white/10 sm:px-5">
          <div
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#112a5a] ring-1 ring-white/10"
            aria-hidden
          >
            <Headphones className="size-[18px]" style={{ color: BLUE }} />
          </div>
          <p className="min-w-0 text-[13px] font-semibold leading-snug tracking-tight sm:text-[13.5px]">
            Un interlocuteur unique, réactif et discret
          </p>
        </div>
      </div>
    </div>
  );
}
