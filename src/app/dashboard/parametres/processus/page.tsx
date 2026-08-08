import { WorkflowProcessEditor } from "@/components/workflow/WorkflowProcessEditor";

export const dynamic = "force-dynamic";

export default function ProcessusMetierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Processus métier</h2>
        <p className="mt-1 text-sm text-slate-600">
          Définissez vos étapes comme vos post-it : nom, couleur, responsable, délais et rappels.
          BeWork s’adapte à votre organisation — pas l’inverse. Les clés techniques restent les
          statuts de fiches de suivi (pas de second moteur).
        </p>
      </div>
      <WorkflowProcessEditor />
    </div>
  );
}
