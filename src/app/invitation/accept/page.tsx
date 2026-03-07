import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AcceptInvitationForm } from "@/components/invitation/AcceptInvitationForm";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-800">Lien d&apos;invitation invalide ou manquant.</p>
        </div>
      </div>
    );
  }
  let invitation: { id: string; email: string; role: string; status: string; expiresAt: Date } | null = null;
  try {
    const inv = await prisma.invitation.findUnique({
      where: { token },
      select: { id: true, email: true, role: true, status: true, expiresAt: true },
    });
    if (inv && inv.status === "PENDING" && inv.expiresAt > new Date()) {
      invitation = inv;
    }
  } catch {
    // table may not exist
  }
  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-amber-800">Cette invitation a expiré ou a déjà été utilisée.</p>
        </div>
      </div>
    );
  }
  if (session?.user?.id) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <AcceptInvitationForm
        token={token}
        email={invitation.email}
        role={invitation.role}
      />
    </div>
  );
}
