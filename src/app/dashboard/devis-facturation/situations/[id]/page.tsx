import { notFound } from "next/navigation";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { getProgressStatementDetail } from "@/lib/commercial/progress-statements";
import { listSubcontracts } from "@/lib/commercial/subcontracts";
import { ProgressStatementEditor } from "@/components/commercial/ProgressStatementEditor";

export const dynamic = "force-dynamic";

export default async function SituationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCommercialSession();
  const orgId = await resolveCommercialOrgId(session.user);
  const { id } = await params;
  if (!orgId) notFound();
  const statement = await getProgressStatementDetail(orgId, id);
  if (!statement) notFound();

  const s = statement as unknown as {
    id: string;
    label: string;
    number: number;
    status: string;
    periodStart: Date | null;
    periodEnd: Date | null;
    marketSellHt: number;
    marketVat: number;
    marketTtc: number;
    previousSellHt: number;
    previousVat: number;
    previousTtc: number;
    periodSellHt: number;
    periodVat: number;
    periodTtc: number;
    cumulativeSellHt: number;
    cumulativeVat: number;
    cumulativeTtc: number;
    remainingSellHt: number;
    remainingVat: number;
    remainingTtc: number;
    quote: { id: string; number: string; subject: string };
    project: { id: string; title: string } | null;
    invoice: { id: string; number: string } | null;
    lines: Array<Record<string, unknown>>;
  };

  const projectSubcontractors = s.project
    ? await listSubcontracts(orgId, s.project.id).catch(() => [])
    : [];

  return (
    <ProgressStatementEditor
      initial={{
        id: s.id,
        label: s.label,
        number: s.number,
        status: s.status,
        periodStart: s.periodStart ? String(s.periodStart) : null,
        periodEnd: s.periodEnd ? String(s.periodEnd) : null,
        marketSellHt: Number(s.marketSellHt),
        marketVat: Number(s.marketVat),
        marketTtc: Number(s.marketTtc),
        previousSellHt: Number(s.previousSellHt),
        previousVat: Number(s.previousVat),
        previousTtc: Number(s.previousTtc),
        periodSellHt: Number(s.periodSellHt),
        periodVat: Number(s.periodVat),
        periodTtc: Number(s.periodTtc),
        cumulativeSellHt: Number(s.cumulativeSellHt),
        cumulativeVat: Number(s.cumulativeVat),
        cumulativeTtc: Number(s.cumulativeTtc),
        remainingSellHt: Number(s.remainingSellHt),
        remainingVat: Number(s.remainingVat),
        remainingTtc: Number(s.remainingTtc),
        retentionRateSnapshot: Number(
          (s as { retentionRateSnapshot?: number }).retentionRateSnapshot ?? 0,
        ),
        retentionCapHt: Number((s as { retentionCapHt?: number }).retentionCapHt ?? 0),
        retentionPreviousHt: Number(
          (s as { retentionPreviousHt?: number }).retentionPreviousHt ?? 0,
        ),
        retentionPeriodHt: Number(
          (s as { retentionPeriodHt?: number }).retentionPeriodHt ?? 0,
        ),
        retentionCumulativeHt: Number(
          (s as { retentionCumulativeHt?: number }).retentionCumulativeHt ?? 0,
        ),
        netPeriodSellHt: Number(
          (s as { netPeriodSellHt?: number }).netPeriodSellHt ?? s.periodSellHt,
        ),
        netPeriodVat: Number(
          (s as { netPeriodVat?: number }).netPeriodVat ?? s.periodVat,
        ),
        netPeriodTtc: Number(
          (s as { netPeriodTtc?: number }).netPeriodTtc ?? s.periodTtc,
        ),
        prorataEnabledSnapshot: Boolean(
          (s as { prorataEnabledSnapshot?: boolean }).prorataEnabledSnapshot,
        ),
        prorataRateSnapshot: Number(
          (s as { prorataRateSnapshot?: number }).prorataRateSnapshot ?? 0,
        ),
        prorataPreviousHt: Number(
          (s as { prorataPreviousHt?: number }).prorataPreviousHt ?? 0,
        ),
        prorataPeriodHt: Number(
          (s as { prorataPeriodHt?: number }).prorataPeriodHt ?? 0,
        ),
        prorataCumulativeHt: Number(
          (s as { prorataCumulativeHt?: number }).prorataCumulativeHt ?? 0,
        ),
        prorataLabelSnapshot:
          (s as { prorataLabelSnapshot?: string | null }).prorataLabelSnapshot ??
          null,
        postProrataPeriodSellHt: Number(
          (s as { postProrataPeriodSellHt?: number }).postProrataPeriodSellHt ??
            (s as { netPeriodSellHt?: number }).netPeriodSellHt ??
            s.periodSellHt,
        ),
        depositDeductedHt: Number(
          (s as { depositDeductedHt?: number }).depositDeductedHt ?? 0,
        ),
        payablePeriodSellHt: Number(
          (s as { payablePeriodSellHt?: number }).payablePeriodSellHt ??
            (s as { netPeriodSellHt?: number }).netPeriodSellHt ??
            s.periodSellHt,
        ),
        payablePeriodVat: Number(
          (s as { payablePeriodVat?: number }).payablePeriodVat ??
            (s as { netPeriodVat?: number }).netPeriodVat ??
            s.periodVat,
        ),
        payablePeriodTtc: Number(
          (s as { payablePeriodTtc?: number }).payablePeriodTtc ??
            (s as { netPeriodTtc?: number }).netPeriodTtc ??
            s.periodTtc,
        ),
        quote: s.quote,
        project: s.project,
        invoice: s.invoice,
        lines: s.lines.map((l) => ({
          id: String(l.id),
          designation: String(l.designation),
          description: (l.description as string | null) ?? null,
          reference: (l.reference as string | null) ?? null,
          unit: String(l.unit),
          contractQuantity: Number(l.contractQuantity),
          unitSellHt: Number(l.unitSellHt),
          contractSellHt: Number(l.contractSellHt),
          vatRate: Number(l.vatRate),
          previousPercent: Number(l.previousPercent),
          previousQuantity: Number(l.previousQuantity),
          previousSellHt: Number(l.previousSellHt),
          periodPercent: Number(l.periodPercent),
          periodQuantity: Number(l.periodQuantity),
          periodSellHt: Number(l.periodSellHt),
          cumulativePercent: Number(l.cumulativePercent),
          cumulativeQuantity: Number(l.cumulativeQuantity),
          cumulativeSellHt: Number(l.cumulativeSellHt),
          remainingSellHt: Number(l.remainingSellHt),
        })),
      }}
      projectSubcontractors={projectSubcontractors.map((st) => ({
        id: st.id,
        companyName: st.companyName,
        scope: st.scope,
        contractAmountHt: st.contractAmountHt,
        statusLabel: st.statusLabel,
      }))}
    />
  );
}
