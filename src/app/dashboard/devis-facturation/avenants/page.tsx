import Link from "next/link";
import { SectionPlaceholder } from "@/components/commercial/SectionPlaceholder";

/**
 * Avenants ne sont plus un univers principal (placeholder).
 * Consultation depuis le détail devis / affaire.
 */
export default function AvenantsPage() {
  return (
    <div className="space-y-4">
      <SectionPlaceholder
        title="Avenants"
        description="Les avenants se consultent depuis le détail du devis accepté (montants acceptés / en attente)."
      />
      <p className="text-sm text-slate-600">
        <Link
          href="/dashboard/devis-facturation/devis"
          className="font-semibold text-[#1d4ed8]"
        >
          Ouvrir un devis
        </Link>{" "}
        pour voir avenants acceptés et en attente.
      </p>
    </div>
  );
}
