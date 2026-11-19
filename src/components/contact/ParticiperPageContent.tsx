import Link from "next/link";
import { FormationInterestForm } from "@/components/contact/FormationInterestForm";

/**
 * Ancien tunnel « participer / place formation IA ».
 * Conservé pour imports éventuels — contenu recentré formation professionnelle BTP.
 */
export function ParticiperPageContent() {
  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="space-y-3 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1d4ed8]">
          Formation professionnelle BTP
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Exprimer un besoin de formation terrain.
        </h1>
        <p className="text-base leading-relaxed text-slate-600">
          Conduite de travaux, encadrement, TP/VRD, lecture de plans, modes
          opératoires et préparation de chantier. Aucune affirmation Qualiopi
          ou CPF sur ce parcours.
        </p>
        <p className="text-sm text-slate-500">
          Parcours recommandé :{" "}
          <Link
            href="/formation-professionnelle-btp#demande-formation"
            className="font-semibold text-[#1d4ed8] hover:underline"
          >
            hub formation professionnelle BTP
          </Link>
          .
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <FormationInterestForm />
      </div>
    </section>
  );
}
