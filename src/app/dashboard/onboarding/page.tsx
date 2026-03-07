import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/onboarding");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl py-12 space-y-4">
      <BackLink href="/dashboard">Dashboard</BackLink>
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-slate-800">Bienvenue sur BeWork</h1>
        <p className="mt-4 text-lg text-slate-600">
          Votre assistant administratif est prêt.
          <br />
          Commençons par votre première demande.
        </p>
        <Link
          href="/dashboard/nouvelle-demande"
          className="mt-8 inline-flex rounded-lg bg-[#1d4ed8] px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-[#1e40af]"
        >
          Créer ma première demande
        </Link>
        <p className="mt-6 text-sm text-slate-500">
          <Link href="/dashboard" className="text-[#1d4ed8] hover:underline">
            Passer et aller au dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
