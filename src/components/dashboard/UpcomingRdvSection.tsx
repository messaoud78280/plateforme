import Link from "next/link";
import {
  formatAppointmentSlot,
  type UpcomingAppointmentRow,
} from "@/lib/appointments/upcoming";
import { Badge } from "@/components/ui/Badge";

/** Bandeau / carte Accueil — RDV à venir visibles en un coup d’œil. */
export function UpcomingRdvSection({
  appointments,
  compact = false,
}: {
  appointments: UpcomingAppointmentRow[];
  compact?: boolean;
}) {
  if (appointments.length === 0) {
    if (compact) return null;
    return (
      <section
        aria-label="Rendez-vous"
        className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1e3a5f]/70">
              RDV
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">Aucun rendez-vous à venir</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Les créneaux confirmés apparaîtront ici.
            </p>
          </div>
          <Link
            href="/dashboard/messages"
            className="text-xs font-semibold text-[#1e3a5f] hover:underline"
          >
            Voir RDV & contact →
          </Link>
        </div>
      </section>
    );
  }

  const next = appointments[0];
  const more = appointments.length - 1;

  return (
    <section
      aria-label="Rendez-vous à venir"
      className="rounded-2xl border border-[#1e3a5f]/15 bg-gradient-to-r from-[#1e3a5f]/5 via-white to-slate-50 px-5 py-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1e3a5f]/70">
            Prochain RDV
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">{next.title}</p>
          <p className="mt-0.5 text-xs text-slate-600">
            {formatAppointmentSlot(next.startAt, next.endAt)}
            {next.clientName || next.clientEmail
              ? ` · ${next.clientName ?? next.clientEmail}`
              : null}
            {next.project ? ` · ${next.project.title}` : null}
          </p>
          {more > 0 ? (
            <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
              {appointments.slice(1, compact ? 3 : 5).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate font-medium text-slate-800">{a.title}</span>
                  <span className="shrink-0 text-slate-500">
                    {formatAppointmentSlot(a.startAt, a.endAt)}
                  </span>
                </li>
              ))}
              {more > (compact ? 2 : 4) ? (
                <li className="text-[11px] text-slate-500">
                  +{more - (compact ? 2 : 4)} autre{more - (compact ? 2 : 4) > 1 ? "s" : ""}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge tone={next.status === "CONFIRME" ? "ok" : "neutral"}>
            {next.status === "CONFIRME" ? "Confirmé" : "Terminé"}
          </Badge>
          <Link
            href="/dashboard/messages"
            className="inline-flex items-center rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#152a45]"
          >
            RDV & contact →
          </Link>
        </div>
      </div>
    </section>
  );
}
