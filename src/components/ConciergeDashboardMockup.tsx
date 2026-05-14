import {
  Grid2X2,
  Briefcase,
  CalendarDays,
  User,
  Settings,
  Check,
  Car,
  Gift,
  Headphones,
  ChevronRight,
  Plane,
  Building2,
} from "lucide-react";

export function ConciergeDashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,920px)]">
      <div className="flex flex-col gap-5 md:gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Tableau de bord principal */}
        <div className="relative w-full min-w-0 max-w-[620px] shrink-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
          <div className="grid min-h-[min(350px,auto)] grid-cols-[72px_1fr] sm:grid-cols-[78px_1fr]">
            {/* Sidebar */}
            <aside className="flex flex-col items-center gap-4 border-r border-slate-100 px-3 py-5 sm:px-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-base font-bold text-white">
                BW
              </div>

              <nav className="flex flex-col gap-5 text-slate-500">
                <Grid2X2 className="h-5 w-5" />
                <div className="-ml-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <CalendarDays className="h-5 w-5" />
                <User className="h-5 w-5" />
                <Settings className="h-5 w-5" />
              </nav>
            </aside>

            {/* Contenu */}
            <main className="min-w-0 p-4 pr-4 sm:p-5 sm:pr-6">
              <h3 className="text-lg font-bold text-slate-950 sm:text-xl">Votre conciergerie BeWork</h3>
              <p className="mt-1 text-sm text-slate-500">Demandes en cours</p>

              <div className="mt-4 space-y-3">
                <RequestCard
                  icon={<Building2 className="h-6 w-6" />}
                  title="Réservation hôtel"
                  subtitle="Paris – 2 nuits"
                  status="Confirmée"
                  statusType="green"
                />

                <RequestCard
                  icon={<Car className="h-6 w-6" />}
                  title="Location véhicule"
                  subtitle="Break – 3 jours"
                  status="En cours"
                  statusType="blue"
                />

                <RequestCard
                  icon={<Plane className="h-6 w-6" />}
                  title="Vol Paris → Marseille"
                  subtitle="12 mai – 08:15"
                  status="Confirmé"
                  statusType="green"
                />
              </div>

              <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                Voir toutes les demandes
                <ChevronRight className="h-4 w-4" />
              </a>
            </main>
          </div>
        </div>

        {/* Cartes latérales — même flux, plus de position absolute */}
        <div className="flex w-full max-w-[280px] flex-col gap-3 sm:max-w-none lg:mt-1 lg:w-[240px] lg:max-w-[240px] lg:shrink-0">
          <FloatingCard>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-950">Restaurant réservé</p>
                <p className="mt-1 text-sm text-slate-500">Le 14/05 à 20h00</p>
                <p className="mt-1 text-sm text-slate-500">8 personnes</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Car className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-950">Véhicule livré</p>
                <p className="mt-1 text-sm text-slate-500">Le 13/05 à 09h00</p>
                <p className="mt-1 text-sm text-slate-500">Sur votre chantier</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Gift className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-950">Cadeaux envoyés</p>
                <p className="mt-1 text-sm text-slate-500">Le 12/05</p>
                <p className="mt-1 text-sm text-slate-500">Clients &amp; équipes</p>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>

      {/* Encart sombre — sous le mockup, sans chevauchement */}
      <div className="mt-6 w-full max-w-[min(620px,100%)] lg:mt-8">
        <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-[0_24px_70px_rgba(15,23,42,0.35)]">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600">
              <Headphones className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-snug sm:text-[16px]">
                Un interlocuteur unique, réactif et discret.
              </p>
              <p className="mt-2 text-sm text-slate-300 sm:text-[14px]">
                Vous restez concentré
                <br />
                sur l’essentiel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestCard({
  icon,
  title,
  subtitle,
  status,
  statusType,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: string;
  statusType: "green" | "blue";
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700 sm:h-14 sm:w-14">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-slate-950 sm:text-[15px]">{title}</p>
        <p className="mt-0.5 text-[12px] text-slate-500 sm:text-[13px]">{subtitle}</p>

        <span
          className={`mt-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-[12px] ${
            statusType === "green" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-600"
          }`}
        >
          {status}
          <Check className="h-3.5 w-3.5" />
        </span>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </div>
  );
}

function FloatingCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.10)] sm:p-3.5 ${className}`}
    >
      {children}
    </div>
  );
}
