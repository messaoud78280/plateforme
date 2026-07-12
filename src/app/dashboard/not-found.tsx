import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto max-w-lg py-12">
      <EmptyState
        title="Page introuvable"
        description="Cette rubrique n’existe pas ou a été déplacée. Revenez au tableau de bord pour continuer."
        actionHref="/dashboard"
        actionLabel="Tableau de bord"
      />
      <p className="mt-4 text-center text-xs text-bework-muted">
        Besoin d’aide ?{" "}
        <Link href="/contact" className="font-semibold text-bework-navy hover:underline">
          Contacter BeWork
        </Link>
      </p>
    </div>
  );
}
