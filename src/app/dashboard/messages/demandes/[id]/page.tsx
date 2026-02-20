import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouvelle",
  CONFIRME: "Confirmé",
  ANNULE: "Annulé",
};

const HOW_KNOWN_LABELS: Record<string, string> = {
  recherche: "Recherche internet",
  recommandation: "Recommandation",
  reseau: "Réseaux sociaux",
  salon: "Salon / événement",
  autre: "Autre",
};

export default async function DemandeContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }
  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";

  const demande = await prisma.contactRequest.findUnique({
    where: { id },
  });

  if (!demande) notFound();

  // Les clients ne peuvent voir que leurs propres demandes (email identique)
  if (!isAgence && demande.email !== session.user?.email) {
    notFound();
  }

  const rdvLabel =
    demande.rdvDate && demande.rdvTime
      ? `${new Date(demande.rdvDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} à ${demande.rdvTime.replace(":", "h")}`
      : demande.rdvDate
        ? new Date(demande.rdvDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
        : "Non indiqué";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/messages"
        className="text-sm text-[#1d4ed8] hover:underline"
      >
        ← Retour aux RDV
      </Link>

      <div className="rounded-xl border border-[#c8cdd6] bg-white shadow-sm">
        <div className="border-b border-[#e0e4ea] px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#0f172a]">
            Demande de {demande.structure}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              demande.status === "CONFIRME"
                ? "bg-green-100 text-green-800"
                : demande.status === "ANNULE"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-blue-100 text-blue-800"
            }`}
          >
            {STATUS_LABELS[demande.status] ?? demande.status}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">
              Structure
            </h2>
            <p className="mt-1 font-medium text-[#0f172a]">{demande.structure}</p>
            {demande.denominationSociale && (
              <p className="mt-1 text-[#334155]">Dénomination sociale : {demande.denominationSociale}</p>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">
              Contact
            </h2>
            <p className="mt-1 font-medium text-[#0f172a]">{demande.contactName}</p>
            <p className="mt-1">
              <a href={`mailto:${demande.email}`} className="text-[#1d4ed8] hover:underline">
                {demande.email}
              </a>
            </p>
            {demande.phone && (
              <p className="mt-1 text-[#334155]">Tél. : {demande.phone}</p>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">
              Formule et rendez-vous
            </h2>
            {demande.formule && (
              <p className="mt-1 text-[#0f172a]">Formule : {demande.formule}</p>
            )}
            <p className="mt-1 text-[#334155]">Créneau demandé : <strong>{rdvLabel}</strong></p>
            <p className="mt-2 text-sm text-[#64748b]">
              Recontacter le prospect par email pour confirmer le RDV en visioconférence et expliquer le mode opératoire et les conditions.
            </p>
          </section>

          {demande.message && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">
                Message
              </h2>
              <p className="mt-1 whitespace-pre-wrap text-[#334155]">{demande.message}</p>
            </section>
          )}

          {(demande.sector || demande.howKnown) && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">
                Compléments
              </h2>
              {demande.sector && <p className="mt-1 text-[#334155]">Secteur : {demande.sector}</p>}
              {demande.howKnown && (
                <p className="mt-1 text-[#334155]">
                  Comment nous a connu : {HOW_KNOWN_LABELS[demande.howKnown] ?? demande.howKnown}
                </p>
              )}
            </section>
          )}

          <p className="pt-4 border-t border-[#e0e4ea] text-sm text-[#64748b]">
            Reçu le {new Date(demande.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        {isAgence && (
          <a
            href={`mailto:${demande.email}?subject=Confirmation RDV BeWork – ${demande.structure}`}
            className="rounded-lg bg-[#1d4ed8] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]"
          >
            Répondre par email
          </a>
        )}
        <Link
          href="/dashboard/messages"
          className="rounded-lg border border-[#c8cdd6] bg-white px-6 py-2.5 text-sm font-medium text-[#334155] hover:bg-[#f8f9fb]"
        >
          Retour aux RDV
        </Link>
      </div>
    </div>
  );
}
