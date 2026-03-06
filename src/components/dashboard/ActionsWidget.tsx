import Link from "next/link";

const PLAN_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  STANDARD_PLUS: "Business",
  PREMIUM: "Premium",
  FULLTIME: "Full-time",
};

type Props = {
  subscriptionPlan: string | null;
  monthlyActionsTotal: number;
  monthlyActionsUsed: number;
};

export function ActionsWidget({ subscriptionPlan, monthlyActionsTotal, monthlyActionsUsed }: Props) {
  const remaining = Math.max(0, monthlyActionsTotal - monthlyActionsUsed);
  const percent = monthlyActionsTotal > 0 ? Math.min(100, (monthlyActionsUsed / monthlyActionsTotal) * 100) : 0;
  const hasUsage = monthlyActionsTotal > 0;

  let alertLevel: "none" | "medium" | "high" = "none";
  if (hasUsage && percent >= 90) {
    alertLevel = "high";
  } else if (hasUsage && percent >= 70) {
    alertLevel = "medium";
  }

  return (
    <section aria-label="Actions du mois" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Actions du mois</h2>
      <p className="mt-1 text-sm text-slate-600">
        Abonnement : {subscriptionPlan ? PLAN_LABELS[subscriptionPlan] ?? subscriptionPlan : "Standard"}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[#1d4ed8]">{monthlyActionsTotal}</p>
          <p className="text-xs text-slate-500">Actions totales</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{monthlyActionsUsed}</p>
          <p className="text-xs text-slate-500">Actions utilisées</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-700">{remaining}</p>
          <p className="text-xs text-slate-500">Actions restantes</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${
              alertLevel === "high"
                ? "bg-red-500"
                : alertLevel === "medium"
                  ? "bg-amber-400"
                  : "bg-[#1d4ed8]"
            }`}
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={monthlyActionsUsed}
            aria-valuemin={0}
            aria-valuemax={monthlyActionsTotal}
            aria-label="Actions utilisées"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Actions utilisées</span>
          <span>
            {monthlyActionsUsed} / {monthlyActionsTotal} actions
          </span>
        </div>
      </div>
      {alertLevel !== "none" && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            alertLevel === "high"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <p>
            {alertLevel === "high"
              ? "Votre forfait arrive bientôt à sa limite."
              : "Vous avez utilisé la majorité de vos actions ce mois-ci."}
          </p>
          <Link
            href="/tarifs"
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            Voir l’offre supérieure
          </Link>
        </div>
      )}
      <Link
        href="/dashboard/abonnement"
        className="mt-4 inline-block text-sm font-medium text-[#1d4ed8] hover:underline"
      >
        Voir le suivi des actions →
      </Link>
    </section>
  );
}
