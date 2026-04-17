import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InformationsPersonnellesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres/informations");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      civilite: true,
      name: true,
      email: true,
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

  const addressLines = [
    user.billingAddressLine1,
    user.billingAddressLine2,
    user.billingCity,
    user.billingPostalCode,
  ].filter(Boolean);
  const hasAddress = addressLines.length > 0;

  return (
    <section className="rounded-2xl surface-metallic-light p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-black">
          Informations personnelles
        </h2>
        <Link
          href="/dashboard/parametres/informations/modifier"
          className="text-sm font-medium text-[#1d4ed8] hover:underline hover:text-[#1e40af]"
        >
          Modifier les coordonnées personnelles
        </Link>
      </div>

      <dl className="mt-6 space-y-5">
        <div>
          <dt className="text-sm font-medium text-black">Civilité</dt>
          <dd className="mt-1 text-black">{user.civilite || "—"}</dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-black">Nom complet</dt>
          <dd className="mt-1 text-black">{user.name || "—"}</dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-black">Pays/Région</dt>
          <dd className="mt-1 text-black">{user.billingCountry || "—"}</dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-black">Votre adresse</dt>
          <dd className="mt-1 text-black">
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
          <dt className="text-sm font-medium text-black">Numéro de téléphone</dt>
          <dd className="mt-1 text-black">
            {user.phone ? (
              <>
                {user.phone}
                <span className="ml-2 text-sm text-black">(principal)</span>
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-black">Adresse e-mail de contact</dt>
          <dd className="mt-1 text-black">{user.email || "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
