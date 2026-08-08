import Link from "next/link";

type Props = {
  total: number;
  critique?: number;
  urgent?: number;
  important?: number;
};

/** Bandeau Accueil — résumé léger vers À traiter. */
export function ATraiterHomeBanner({
  total,
  critique = 0,
  urgent = 0,
  important = 0,
}: Props) {
  if (total <= 0) return null;

  const parts = [
    critique > 0 ? `${critique} critique${critique > 1 ? "s" : ""}` : null,
    urgent > 0 ? `${urgent} urgent${urgent > 1 ? "s" : ""}` : null,
    important > 0 ? `${important} important${important > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  return (
    <Link
      href="/dashboard/a-traiter"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-amber-50 px-5 py-4 shadow-sm transition hover:border-red-300 hover:shadow"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-700/80">
          À traiter
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">
          {parts.length > 0
            ? parts.join(" · ")
            : `${total} élément${total > 1 ? "s" : ""} à regarder`}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">
          BeWork a détecté ce qui mérite votre attention maintenant.
        </p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white">
        <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px]">
          {total > 99 ? "99+" : total}
        </span>
        Voir les {total} élément{total > 1 ? "s" : ""} →
      </span>
    </Link>
  );
}
