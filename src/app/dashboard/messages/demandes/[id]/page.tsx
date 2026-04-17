import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";

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
      <BackLink href="/dashboard/messages">Retour aux RDV</BackLink>

      <div className="rounded-xl surface-metallic-light shadow-sm">
        <div className="border-b border-[#e0e4ea] px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-black">
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-black">
              Structure
            </h2>
            <p className="mt-1 font-medium text-black">{demande.structure}</p>
            {demande.denominationSociale && (
              <p className="mt-1 text-black">Dénomination sociale : {demande.denominationSociale}</p>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-black">
              Contact
            </h2>
            <p className="mt-1 font-medium text-black">{demande.contactName}</p>
            <p className="mt-1">
              <a href={`mailto:${demande.email}`} className="text-[#1d4ed8] hover:underline">
                {demande.email}
              </a>
            </p>
            {demande.phone && (
              <p className="mt-1 text-black">Tél. : {demande.phone}</p>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-black">
              Formule et rendez-vous
            </h2>
            {demande.formule && (
              <p className="mt-1 text-black">Formule : {demande.formule}</p>
            )}
            <p className="mt-1 text-black">Créneau demandé : <strong>{rdvLabel}</strong></p>
            <p className="mt-2 text-sm text-black">
              Recontacter le prospect par email pour confirmer le RDV en visioconférence et expliquer le mode opératoire et les conditions.
            </p>
          </section>

          {demande.message && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-black">
                Message
              </h2>
              <p className="mt-1 whitespace-pre-wrap text-black">{demande.message}</p>
            </section>
          )}

          {(demande.sector || demande.howKnown) && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-black">
                Compléments
              </h2>
              {demande.sector && <p className="mt-1 text-black">Secteur : {demande.sector}</p>}
              {demande.howKnown && (
                <p className="mt-1 text-black">
                  Comment nous a connu : {HOW_KNOWN_LABELS[demande.howKnown] ?? demande.howKnown}
                </p>
              )}
            </section>
          )}

          <p className="pt-4 border-t border-[#e0e4ea] text-sm text-black">
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
          className="rounded-lg surface-metallic-light px-6 py-2.5 text-sm font-medium text-black hover:bg-[#f8f9fb]"
        >
          Retour aux RDV
        </Link>
      </div>
    </div>
  );
}
