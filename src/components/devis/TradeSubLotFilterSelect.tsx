import type { LotsGroupedByTrade } from "@/lib/bework-devis-lot-trades";

type Props = {
  tradeId: string;
  subLotId: string;
  grouped: LotsGroupedByTrade[];
  tradeValue: string;
  subLotValue: string;
  subLotsForTrade: string[];
  className?: string;
};

/**
 * Filtre en deux niveaux : corps de métier, puis sous-lot (après harmonisation des lots en base).
 */
export function TradeSubLotFilterSelect({
  tradeId,
  subLotId,
  grouped,
  tradeValue,
  subLotValue,
  subLotsForTrade,
  className,
}: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label htmlFor={tradeId} className="sr-only">
          Corps de métier
        </label>
        <select id={tradeId} name="trade" defaultValue={tradeValue} className={className}>
          <option value="">Tous les corps de métier</option>
          {grouped.map((g) => (
            <option key={g.tradeCode} value={g.tradeCode}>
              {g.tradeLabel}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor={subLotId} className="sr-only">
          Sous-lot
        </label>
        <select
          id={subLotId}
          name="subLot"
          defaultValue={subLotValue}
          className={className}
          disabled={!tradeValue && subLotsForTrade.length === 0}
        >
          <option value="">Tous les sous-lots</option>
          {subLotsForTrade.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
