import { deleteWorkItem } from "@/app/dashboard/devis/actions";

export function DeleteWorkItemButton({ id, code }: { id: string; code: string }) {
  return (
    <form action={deleteWorkItem} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
        title={`Supprimer ${code}`}
      >
        Supprimer
      </button>
    </form>
  );
}
