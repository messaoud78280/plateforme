import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CoordonneesEntreprisePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres/coordonnees");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      company: true,
      phone: true,
      billingAddressLine1: true,
      billingAddressLine2: true,
      billingCity: true,
      billingPostalCode: true,
      billingCountry: true,
    },
  });

  if (!user) {
    redirect("/dashboard");
  }

  const companyName = user.company?.trim() || "Mon entreprise";
  const hasAddress =
    user.billingAddressLine1 ||
    user.billingAddressLine2 ||
    user.billingCity ||
    user.billingPostalCode;
  const addressLines = [
    user.billingAddressLine1,
    user.billingAddressLine2,
    user.billingCity,
    user.billingPostalCode,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-[#64748b]">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/dashboard" className="hover:text-[#0f172a]">
              Compte
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/dashboard/parametres/coordonnees" className="hover:text-[#0f172a]">
              Coordonnées de l&apos;entreprise
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-[#0f172a]">{companyName}</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
        Coordonnées de l&apos;entreprise
      </h1>

      <section className="mt-8 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            Détails de {companyName}
          </h2>
          <Link
            href="/dashboard/parametres/coordonnees/modifier"
            className="text-sm font-medium text-[#1d4ed8] hover:underline hover:text-[#1e40af]"
          >
            Modifier les coordonnées de l&apos;entreprise
          </Link>
        </div>

        <dl className="mt-6 space-y-5">
          <div>
            <dt className="text-sm font-medium text-[#64748b]">Nom de l&apos;entreprise</dt>
            <dd className="mt-1 text-[#0f172a]">{user.company || "—"}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-[#64748b]">Pays/Région</dt>
            <dd className="mt-1 text-[#0f172a]">{user.billingCountry || "—"}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-[#64748b]">Adresse de facturation</dt>
            <dd className="mt-1 text-[#0f172a]">
              {hasAddress ? (
                addressLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < addressLines.length - 1 && <br />}
                  </span>
                ))
              ) : (
                "—"
              )}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-[#64748b]">Numéro de téléphone</dt>
            <dd className="mt-1 text-[#0f172a]">
              {user.phone ? (
                <>
                  {user.phone}
                  <span className="ml-2 text-sm text-[#64748b]">(Principal)</span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
