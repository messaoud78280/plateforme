"use client";

import Link from "next/link";
import { formatCreditsExpiryLabel } from "@/lib/credits-lifecycle";
import { CREDITS_VALIDITY_NOTICE } from "@/lib/subscription-plans";

const PLAN_LABELS: Record<string, string> = {
  DECOUVERTE: "Structure",
  STANDARD: "Suivi",
  STANDARD_PLUS: "Renfort",
  PREMIUM: "Pilotage",
  FULLTIME: "Full-time",
};

type Props = {
  subscriptionPlan: string | null;
  monthlyActionsTotal: number;
  monthlyActionsUsed: number;
  renewsAt?: Date | string | null;
  creditsExpiresAt?: Date | string | null;
};

export function ActionsWidget({
  subscriptionPlan,
  monthlyActionsTotal,
  monthlyActionsUsed,
  renewsAt,
  creditsExpiresAt,
}: Props) {
  const remaining = Math.max(0, monthlyActionsTotal - monthlyActionsUsed);
  const percent = monthlyActionsTotal > 0 ? Math.min(100, (monthlyActionsUsed / monthlyActionsTotal) * 100) : 0;
  const hasUsage = monthlyActionsTotal > 0;
  const expiryLabel = formatCreditsExpiryLabel(creditsExpiresAt ?? null);
  const msUntilExpiry = creditsExpiresAt ? new Date(creditsExpiresAt).getTime() - Date.now() : null;
  const expirySoon = msUntilExpiry != null && msUntilExpiry > 0 && msUntilExpiry <= 7 * 24 * 60 * 60 * 1000;

  let alertLevel: "none" | "medium" | "high" = "none";
  if (hasUsage && percent >= 90) {
    alertLevel = "high";
  } else if (hasUsage && percent >= 70) {
    alertLevel = "medium";
  }
  if (expirySoon && alertLevel === "none") {
    alertLevel = "medium";
  }

  return (
    <section aria-label="Crédits disponibles" className="rounded-2xl surface-metallic-light p-6">
      <h2 className="text-lg font-semibold text-slate-800">Crédits disponibles</h2>
      <p className="mt-1 text-sm text-slate-600">
        Abonnement : {subscriptionPlan ? PLAN_LABELS[subscriptionPlan] ?? subscriptionPlan : "Suivi"}
      </p>
      <p className="mt-2 text-xs text-slate-500">{CREDITS_VALIDITY_NOTICE}</p>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[#1d4ed8]">{monthlyActionsTotal}</p>
          <p className="text-xs text-slate-500">Crédits totaux</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{monthlyActionsUsed}</p>
          <p className="text-xs text-slate-500">Crédits utilisés</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-700">{remaining}</p>
          <p className="text-xs text-slate-500">Crédits restants</p>
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
            aria-label="Crédits utilisés"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Crédits utilisés</span>
          <span>
            {monthlyActionsUsed} / {monthlyActionsTotal} crédits
          </span>
        </div>
      </div>
      {expiryLabel && hasUsage && (
        <p className={`mt-3 text-xs ${expirySoon ? "font-medium text-amber-800" : "text-slate-500"}`}>
          Validité des crédits en cours : jusqu&apos;au {expiryLabel}
          {expirySoon ? " — pensez à les utiliser ou renouveler votre forfait." : ""}
        </p>
      )}
      {monthlyActionsTotal === 0 && (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Aucun crédit actif. Souscrivez ou renouvelez un forfait pour créditer votre compte (validité 30 jours).
        </p>
      )}
      {alertLevel !== "none" && hasUsage && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            alertLevel === "high"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <p>
            {alertLevel === "high" && percent >= 90
              ? "Votre forfait arrive bientôt à sa limite."
              : expirySoon
                ? "Vos crédits expirent bientôt (validité 30 jours)."
                : "Vous avez utilisé la majorité de vos crédits."}
          </p>
          <Link
            href="/tarifs"
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            Voir les forfaits
          </Link>
        </div>
      )}
      {renewsAt && (
        <p className="mt-3 text-xs text-slate-500">
          Prochain renouvellement d&apos;abonnement :{" "}
          {new Date(renewsAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/dashboard/abonnement"
          className="text-sm font-medium text-[#1d4ed8] hover:underline"
        >
          Voir le suivi des crédits →
        </Link>
        <Link
          href="/conditions-generales-vente"
          className="text-sm font-medium text-slate-600 hover:underline"
        >
          Conditions de vente
        </Link>
        <Link
          href="/dashboard/abonnement/souscrire"
          className="text-sm font-medium text-slate-600 hover:underline"
        >
          Changer de formule
        </Link>
      </div>
    </section>
  );
}
