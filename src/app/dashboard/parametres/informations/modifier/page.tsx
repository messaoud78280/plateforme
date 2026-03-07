import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { BackLink } from "@/components/ui/BackLink";
import { prisma } from "@/lib/prisma";
import { InformationsPersonnellesForm } from "@/components/parametres/InformationsPersonnellesForm";

export default async function ModifierInformationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres/informations/modifier");
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

  return (
    <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[#475569]">
          Modifier les coordonnées personnelles
        </h2>
        <BackLink href="/dashboard/parametres/informations">Retour aux informations</BackLink>
      </div>
      <InformationsPersonnellesForm
        initialData={{
          civilite: user.civilite,
          name: user.name,
          email: user.email,
          phone: user.phone,
          billingAddressLine1: user.billingAddressLine1,
          billingAddressLine2: user.billingAddressLine2,
          billingCity: user.billingCity,
          billingPostalCode: user.billingPostalCode,
          billingCountry: user.billingCountry,
        }}
      />
    </section>
  );
}
