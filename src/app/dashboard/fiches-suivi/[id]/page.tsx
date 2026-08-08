import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFollowUpSheet, followUpSheetInclude } from "@/lib/follow-up/access";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { serializeFollowUpSheet } from "@/lib/follow-up/serialize";
import { loadAttentionForSheets, urgencyLabelFor } from "@/lib/follow-up/attention/batch";
import { URGENCY_LABELS } from "@/lib/follow-up/types";
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

  const { byId: attentionMap } = await loadAttentionForSheets({
    sheets: [
      {
        id: data.id,
        status: data.status,
        title: data.title,
        nextActionAt: data.nextActionAt,
        nextActionDone: data.nextActionDone,
        urgencyOverride: data.urgencyOverride,
      },
    ],
    organizationId: sheet.organizationId,
    thresholds: settings.thresholds,
  });
  const attention = attentionMap.get(data.id);
  const level = attention?.effectiveUrgency ?? data.urgency;

  return (
    <FollowUpDetailClient
      sheet={{
        ...data,
        urgency: level,
        urgencyLabel: URGENCY_LABELS[level] ?? urgencyLabelFor(level),
        attention: attention ?? null,
      }}
    />
  );
}
