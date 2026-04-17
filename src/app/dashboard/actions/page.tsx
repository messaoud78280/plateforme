import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { BackLink } from "@/components/ui/BackLink";
import { MINUTES_PER_ACTION } from "@/lib/actions";

const ROWS: { category: string; example: string; creditsLabel: string }[] = [
  { category: "Gestion d’emails", example: "Répondre à un email simple", creditsLabel: "1 crédit" },
  { category: "Organisation", example: "Planifier un rendez-vous", creditsLabel: "1 crédit" },
  { category: "Recherche simple", example: "Trouver une information", creditsLabel: "1 crédit" },
  { category: "Réservation", example: "Hôtel ou transport", creditsLabel: "1 crédit" },
  { category: "Coordination", example: "Organisation de plusieurs rendez-vous", creditsLabel: "2 crédits" },
  { category: "Rédaction", example: "Email professionnel", creditsLabel: "2 crédits" },
  { category: "Comparatif", example: "Comparer plusieurs prestataires", creditsLabel: "2 à 3 crédits" },
  { category: "Création document", example: "Document administratif", creditsLabel: "3 crédits" },
  { category: "Recherche approfondie", example: "Analyse détaillée", creditsLabel: "3 à 4 crédits" },
  { category: "Mission spécifique", example: "Demande complexe", creditsLabel: "Sur évaluation" },
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
        <h1 className="text-2xl font-bold text-slate-800">Comment fonctionnent les crédits</h1>
        <p className="text-sm text-slate-600">
          Votre abonnement BeWork fonctionne avec un quota de crédits administratifs. Chaque crédit correspond à une tâche ou un ensemble de micro-tâches réalisées par notre équipe pour traiter votre demande.
        </p>
        <p className="text-sm text-slate-600">
          L’objectif est de vous donner une vision claire de ce que représente un crédit selon le type de mission confiée.
        </p>
        <p className="text-sm text-slate-600">
          Règle de comptage : environ {MINUTES_PER_ACTION} minutes par crédit (indicatif : 5 crédits ≈ 1 h) ; le temps réel est pris en compte à la clôture des missions.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl surface-metallic-light">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <th className="px-4 py-3 font-semibold">Catégorie</th>
              <th className="px-4 py-3 font-semibold">Exemple</th>
              <th className="px-4 py-3 font-semibold">Crédits indicatifs</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.category} className="border-b border-slate-100 text-slate-700">
                <td className="px-4 py-3 font-medium">{row.category}</td>
                <td className="px-4 py-3">{row.example}</td>
                <td className="px-4 py-3">{row.creditsLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-slate-600">
        Le nombre de crédits indiqué est donné à titre indicatif et peut varier selon la complexité réelle de la demande. Lorsqu’une mission est particulièrement spécifique ou comporte plusieurs étapes, elle peut faire l’objet d’une évaluation dédiée.
      </p>
    </div>
  );
}
