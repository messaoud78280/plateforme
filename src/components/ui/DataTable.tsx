import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function DataTable({
  children,
  className,
  minWidth = "720px",
}: {
  children: ReactNode;
  className?: string;
  minWidth?: string;
}) {
  return (
    <div className={cn("cc-list-surface", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.875rem]" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[color:var(--cc-border)] text-bework-ink">
        {children}
      </tr>
    </thead>
  );
}

export function DataTableTh({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[12px] font-medium text-bework-muted sm:px-5",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[color:var(--cc-border)]">{children}</tbody>;
}

export function DataTableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("cc-list-row bg-white", className)}>
      {children}
    </tr>
  );
}

export function DataTableTd({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 text-bework-ink sm:px-5",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}
