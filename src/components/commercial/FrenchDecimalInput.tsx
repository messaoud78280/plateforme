"use client";

import { useEffect, useState } from "react";
import {
  formatFrenchDecimalInput,
  isPartialFrenchDecimalInput,
  parseFrenchDecimal,
} from "@/lib/commercial/import/french-number";

/**
 * Champ décimal FR : conserve la frappe brute ("12,") et émet un number
 * dès que la valeur est parseable — sans Number() brutal à chaque frappe.
 */
export function FrenchDecimalInput({
  value,
  disabled,
  className,
  maxFractionDigits = 4,
  onLiveValue,
  onCommit,
}: {
  /** Valeur numérique source (ligne / serveur). */
  value: number;
  disabled?: boolean;
  className?: string;
  maxFractionDigits?: number;
  /** Appelé dès qu’un nombre valide peut être dérivé (recalcul UI). */
  onLiveValue?: (n: number) => void;
  /** Normalisation + commit (blur / Enter). */
  onCommit: (n: number) => void;
}) {
  const [raw, setRaw] = useState(() =>
    formatFrenchDecimalInput(value, maxFractionDigits),
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    setRaw(formatFrenchDecimalInput(value, maxFractionDigits));
  }, [value, maxFractionDigits, focused]);

  function handleChange(next: string) {
    if (!isPartialFrenchDecimalInput(next)) return;
    setRaw(next);
    const parsed = parseFrenchDecimal(next);
    if (parsed != null) onLiveValue?.(parsed);
  }

  function handleBlur() {
    setFocused(false);
    const parsed = parseFrenchDecimal(raw);
    if (parsed == null) {
      setRaw(formatFrenchDecimalInput(value, maxFractionDigits));
      return;
    }
    setRaw(formatFrenchDecimalInput(parsed, maxFractionDigits));
    onLiveValue?.(parsed);
    onCommit(parsed);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={raw}
      onFocus={() => setFocused(true)}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className={className}
      autoComplete="off"
    />
  );
}
