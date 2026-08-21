import Link from "next/link";
import { cn } from "@/lib/cn";

/** Bandeau discret — essai SaaS en cours. */
export function SaasTrialBanner({
  daysRemaining,
  companyName,
}: {
  daysRemaining: number;
  companyName?: string | null;
}) {
  const urgent = daysRemaining <= 3;
  return (
    <div
      role="status"
      className={cn(
        "border-b px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide",
        urgent
          ? "border-amber-300/90 bg-amber-50 text-amber-950"
          : "border-bework-accent/20 bg-bework-soft-accent/60 text-bework-navy",
      )}
    >
      Essai BeWork
      {companyName ? ` — ${companyName}` : ""}
      {" · "}
      {daysRemaining <= 0
        ? "terminé"
        : `${daysRemaining} jour${daysRemaining !== 1 ? "s" : ""} restant${daysRemaining !== 1 ? "s" : ""}`}
      {" · "}
      <Link href="/dashboard/bienvenue" className="underline underline-offset-2 hover:opacity-80">
        Bien démarrer
      </Link>
    </div>
  );
}

/** Essai terminé — lecture seule. */
export function SaasTrialExpiredBanner() {
  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-3 py-2.5 text-center text-[12px] font-medium text-amber-950"
    >
      <p className="font-semibold">Votre essai BeWork est terminé.</p>
      <p className="mt-0.5 text-[11px] font-normal text-amber-900/90">
        Vos données sont conservées. L’espace est en lecture seule —
        activez votre abonnement pour continuer à travailler.
      </p>
      <Link
        href="/dashboard/parametres"
        className="mt-1.5 inline-block text-[11px] font-semibold underline underline-offset-2"
      >
        Voir les options
      </Link>
    </div>
  );
}
