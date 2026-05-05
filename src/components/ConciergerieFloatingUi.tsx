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
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100" />
        <div className="relative text-slate-700">{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold tracking-tight text-slate-900">{title}</p>
        <p className="mt-0.5 truncate text-[13px] text-slate-500">{subtitle}</p>
        <div className="mt-2">
          <StatusPill tone={tone} label={status} />
        </div>
      </div>
      <svg className="size-4 text-slate-300" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
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
      {/* Dashboard (UI réelle, lisible, sans blur/opacité) */}
      <div className="relative min-h-[520px] w-full">
        {/* Base dashboard card */}
        <div className="absolute left-0 top-0 w-[min(640px,100%)] rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-stretch">
            {/* Sidebar */}
            <div className="flex w-[72px] flex-col items-center gap-3 border-r border-slate-100 px-3 py-4">
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

            {/* Content */}
            <div className="flex-1 px-6 py-5">
              <div className="flex items-start justify-between gap-6">
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

        {/* Floating notifications (droite) */}
        <div className="absolute right-0 top-12 hidden w-[260px] flex-col gap-4 md:flex">
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

        {/* Bottom dark badge */}
        <div className="absolute bottom-0 right-0">
          <div className="flex items-center gap-3 rounded-[18px] bg-gradient-to-br from-[#0B1B3A] to-[#08214E] px-5 py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-white/10">
            <div
              className="grid size-11 place-items-center rounded-2xl bg-[#112a5a] ring-1 ring-white/10"
              aria-hidden
            >
              <Headphones className="size-[18px]" style={{ color: BLUE }} />
            </div>
            <p className="max-w-[16rem] text-[13.5px] font-semibold leading-snug tracking-tight">
              Un interlocuteur unique, réactif et discret
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

