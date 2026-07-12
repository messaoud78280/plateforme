import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] bg-white px-3 py-2 text-sm text-bework-ink shadow-sm transition placeholder:text-bework-muted/70 focus:border-bework-navy focus:outline-none focus:ring-2 focus:ring-bework-navy/20 disabled:opacity-60";

export function Input({
  label,
  hint,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
}) {
  const inputId = id ?? (typeof props.name === "string" ? props.name : undefined);
  return (
    <label className="block text-xs">
      {label ? <span className="mb-1 block font-semibold text-bework-muted">{label}</span> : null}
      <input id={inputId} className={cn(fieldClass, className)} {...props} />
      {hint ? <span className="mt-1 block text-[11px] text-bework-muted">{hint}</span> : null}
    </label>
  );
}

export function Select({
  label,
  hint,
  className,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
}) {
  const selectId = id ?? (typeof props.name === "string" ? props.name : undefined);
  return (
    <label className="block text-xs">
      {label ? <span className="mb-1 block font-semibold text-bework-muted">{label}</span> : null}
      <select id={selectId} className={cn(fieldClass, className)} {...props}>
        {children}
      </select>
      {hint ? <span className="mt-1 block text-[11px] text-bework-muted">{hint}</span> : null}
    </label>
  );
}

export function Textarea({
  label,
  hint,
  className,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
}) {
  const areaId = id ?? (typeof props.name === "string" ? props.name : undefined);
  return (
    <label className="block text-xs">
      {label ? <span className="mb-1 block font-semibold text-bework-muted">{label}</span> : null}
      <textarea id={areaId} className={cn(fieldClass, "min-h-[96px] resize-y", className)} {...props} />
      {hint ? <span className="mt-1 block text-[11px] text-bework-muted">{hint}</span> : null}
    </label>
  );
}
