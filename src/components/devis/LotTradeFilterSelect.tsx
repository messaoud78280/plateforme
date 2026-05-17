import type { LotsGroupedByTrade } from "@/lib/bework-devis-lot-trades";

type Props = {
  id: string;
  name?: string;
  groupedLots: LotsGroupedByTrade[];
  defaultValue?: string;
  className?: string;
};

/** Liste déroulante lots regroupés par corps de métier (optgroups). */
export function LotTradeFilterSelect({
  id,
  name = "lotFilter",
  groupedLots,
  defaultValue = "",
  className,
}: Props) {
  return (
    <select id={id} name={name} defaultValue={defaultValue} className={className}>
      <option value="">Tous les corps de métier</option>
      {groupedLots.map((g) => (
        <optgroup key={g.tradeCode} label={g.tradeLabel}>
          <option value={`trade:${g.tradeCode}`}>
            — Tout : {g.tradeLabel} ({g.lots.length} lot{g.lots.length > 1 ? "s" : ""})
          </option>
          {g.lots.map((lot) => (
            <option key={lot} value={`lot:${lot}`}>
              {lot}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
