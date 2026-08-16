import { redirect } from "next/navigation";

/** Alias UX : échéances = vue collections upcoming + overdue via impayés. */
export default function EcheancesPage() {
  redirect("/dashboard/devis-facturation/suivi/impayes?mode=upcoming");
}
