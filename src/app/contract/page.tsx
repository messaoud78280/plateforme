import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContractSigningBlock } from "@/components/contract/ContractSigningBlock";

const CONTRACT_PDF_URL = process.env.CONTRACT_PDF_URL;
const SHOW_PDF_EMBED = Boolean(CONTRACT_PDF_URL);

export default async function ContractPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/contract");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { contractStatus: true, role: true },
  });

  if (!user) {
    redirect("/connexion?callbackUrl=/contract");
  }

  // Agence/Manager n'ont pas à signer
  if (user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  if (user.contractStatus === "SIGNED") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-[#0f172a]">Contrat signé</h1>
        <p className="mt-2 text-[#64748b]">
          Votre contrat a bien été accepté. Vous avez accès à l&apos;ensemble du
          tableau de bord.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
        >
          Accéder au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Contrat d&apos;abonnement</h1>
        <p className="mt-1 text-[#64748b]">
          Veuillez prendre connaissance du contrat ci-dessous et l&apos;accepter pour activer votre compte.
        </p>
      </div>

      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#475569]">Document contractuel</h2>
        {SHOW_PDF_EMBED ? (
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
            <iframe
              src={CONTRACT_PDF_URL}
              title="Contrat BeWork"
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-6 text-[#334155]">
            <p className="mb-4 font-medium">Conditions générales d&apos;abonnement BeWork</p>
            <p className="mb-2 text-sm">
              En acceptant ce contrat, vous souscrivez aux services d&apos;assistance administrative
              proposés par BeWork selon les modalités et tarifs en vigueur. L&apos;accès au tableau de bord
              et aux prestations est conditionné à l&apos;acceptation des présentes conditions.
            </p>
            <p className="mb-2 text-sm">
              Vous pouvez à tout moment consulter les conditions détaillées et le tarif sur la page
              Tarifs du site. En cliquant sur « J&apos;accepte le contrat », vous confirmez avoir lu
              et accepté ces conditions.
            </p>
            <p className="mt-4 text-xs text-[#64748b]">
              Pour afficher un PDF à la place, ajoutez le fichier <code className="rounded bg-[#e2e8f0] px-1">public/contrat-bework.pdf</code> ou
              définissez la variable <code className="rounded bg-[#e2e8f0] px-1">CONTRACT_PDF_URL</code>.
            </p>
          </div>
        )}
        <ContractSigningBlock />
      </section>
    </div>
  );
}
