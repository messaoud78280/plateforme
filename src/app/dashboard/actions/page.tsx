import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { BackLink } from "@/components/ui/BackLink";

const ROWS: { category: string; example: string; actions: string }[] = [
  { category: "Gestion d’emails", example: "Répondre à un email simple", actions: "1" },
  { category: "Organisation", example: "Planifier un rendez-vous", actions: "1" },
  { category: "Recherche simple", example: "Trouver une information", actions: "1" },
  { category: "Réservation", example: "Hôtel ou transport", actions: "1" },
  { category: "Coordination", example: "Organisation de plusieurs rendez-vous", actions: "2" },
  { category: "Rédaction", example: "Email professionnel", actions: "2" },
  { category: "Comparatif", example: "Comparer plusieurs prestataires", actions: "2 à 3" },
  { category: "Création document", example: "Document administratif", actions: "3" },
  { category: "Recherche approfondie", example: "Analyse détaillée", actions: "3 à 4" },
  { category: "Mission spécifique", example: "Demande complexe", actions: "Sur évaluation" },
];

export default async function ActionsInfoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/actions");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>

      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-slate-800">Comment fonctionnent les actions</h1>
        <p className="text-sm text-slate-600">
          Votre abonnement BeWork fonctionne avec un quota d’actions administratives. Chaque action correspond à une tâche ou un ensemble de micro-tâches réalisées par notre équipe pour traiter votre demande.
        </p>
        <p className="text-sm text-slate-600">
          L’objectif est de vous donner une vision claire de ce que représente une action selon le type de mission confiée.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <th className="px-4 py-3 font-semibold">Catégorie</th>
              <th className="px-4 py-3 font-semibold">Exemple</th>
              <th className="px-4 py-3 font-semibold">Actions indicatives</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.category} className="border-b border-slate-100 text-slate-700">
                <td className="px-4 py-3 font-medium">{row.category}</td>
                <td className="px-4 py-3">{row.example}</td>
                <td className="px-4 py-3">{row.actions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-slate-600">
        Le nombre d’actions indiqué est donné à titre indicatif et peut varier selon la complexité réelle de la demande. Lorsqu’une mission est particulièrement spécifique ou comporte plusieurs étapes, elle peut faire l’objet d’une évaluation dédiée.
      </p>
    </div>
  );
}

