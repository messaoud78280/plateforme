import { redirect } from "next/navigation";

/** Alias demandé : /pilotage-travaux → route dashboard BeWork. */
export default function PilotageTravauxAliasPage() {
  redirect("/dashboard/pilotage-travaux");
}
