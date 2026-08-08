import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFollowUpSheet, followUpSheetInclude } from "@/lib/follow-up/access";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { serializeFollowUpSheet } from "@/lib/follow-up/serialize";
import { FollowUpDetailClient } from "@/components/follow-up/FollowUpDetailClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function FicheSuiviDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) redirect(`/connexion?callbackUrl=/dashboard/fiches-suivi/${id}`);

  if (!(await canAccessFollowUpSheet(session.user, id))) notFound();

  const sheet = await prisma.followUpSheet.findUnique({
    where: { id },
    include: followUpSheetInclude,
  });
  if (!sheet) notFound();

  const settings = await getFollowUpSettings(sheet.ownerUserId);
  const data = serializeFollowUpSheet(sheet, settings.thresholds);

  return <FollowUpDetailClient sheet={data} />;
}
