import { PrepSchedulePlanView } from "@/components/preparation/PrepSchedulePlanView";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; planId: string }> };

export default async function PrepSchedulePlanPage({ params }: Ctx) {
  const { id, planId } = await params;
  return <PrepSchedulePlanView studyId={id} planId={planId} />;
}
