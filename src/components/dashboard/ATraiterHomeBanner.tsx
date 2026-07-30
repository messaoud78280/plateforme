import Link from "next/link";

/** Bandeau Accueil — renvoie vers la boîte À traiter si des points restent. */
export function ATraiterHomeBanner({ total }: { total: number }) {
  if (total <= 0) return null;

  return (
    <Link
      href="/dashboard/a-traiter"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-amber-50 px-5 py-4 shadow-sm transition hover:border-red-300 hover:shadow"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-700/80">À traiter</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">
          {total} point{total > 1 ? "s" : ""} demande{total > 1 ? "nt" : ""} une action
        </p>
        <p className="mt-0.5 text-xs text-slate-600">
          Bloquant, à valider, urgent et relances — un seul endroit.
        </p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white">
        <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px]">
          {total > 99 ? "99+" : total}
        </span>
        Ouvrir →
      </span>
    </Link>
  );
}
