import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProfilSidebar } from "@/components/parametres/ProfilSidebar";
import { ProfilBreadcrumb } from "@/components/parametres/ProfilBreadcrumb";

export default async function ParametresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <ProfilBreadcrumb />
      <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
        Votre profil
      </h1>
      <div className="mt-8 flex gap-8">
        <ProfilSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
