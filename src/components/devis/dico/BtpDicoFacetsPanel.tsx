"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  BTP_DICO_CATEGORIES,
  BTP_DICO_CATEGORY_LABELS,
  BTP_DICO_LEVELS,
  BTP_DICO_STATUSES,
} from "@/lib/btp-dico/labels";
import { BTP_DICO_LOTS } from "@/lib/btp-dico/lots";

const LIST_PATH = "/dashboard/devis/dico-btp";

type Props = {
  lotCounts: Record<string, number>;
  totalCount: number;
};

export function BtpDicoFacetsPanel({ lotCounts, totalCount }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentLot = sp.get("lot") ?? "";
  const currentCategory = sp.get("category") ?? "";
  const currentLevel = sp.get("level") ?? "";
  const currentStatus = sp.get("status") ?? "";
  const onlyAcronyms = sp.get("acronyms") === "1";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("letter");
      const qs = params.toString();
      startTransition(() => router.push(qs ? `${LIST_PATH}?${qs}` : LIST_PATH));
    },
    [router, sp],
  );

  return (
    <div className="space-y-5">
      <section>
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Naviguer par lot</p>
        <div className="flex flex-col gap-0.5">
          <LotRow active={!currentLot} count={totalCount} onClick={() => setParam("lot", "")}>
            <span className="font-semibold">Tous les lots</span>
          </LotRow>
          {BTP_DICO_LOTS.map((lot) => {
            const count = lotCounts[lot.code] ?? 0;
            return (
              <LotRow
                key={lot.code}
                active={currentLot === lot.code}
                count={count}
                muted={count === 0}
                onClick={() => setParam("lot", currentLot === lot.code ? "" : lot.code)}
              >
                <span className="mr-1.5 font-mono text-[11px] opacity-70">{lot.code}</span>
                <span className="truncate">{lot.name}</span>
              </LotRow>
            );
          })}
        </div>
      </section>

      <div className="h-px bg-slate-100" />

      <section>
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Catégorie</p>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={!currentCategory && !onlyAcronyms}
            onClick={() => {
              const params = new URLSearchParams(sp.toString());
              params.delete("category");
              params.delete("acronyms");
              params.delete("letter");
              const qs = params.toString();
              startTransition(() => router.push(qs ? `${LIST_PATH}?${qs}` : LIST_PATH));
            }}
          >
            Toutes
          </Chip>
          <Chip active={onlyAcronyms} onClick={() => setParam("acronyms", onlyAcronyms ? "" : "1")}>
            Acronymes
          </Chip>
          {BTP_DICO_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              active={currentCategory === cat}
              onClick={() => setParam("category", currentCategory === cat ? "" : cat)}
            >
              {BTP_DICO_CATEGORY_LABELS[cat]}
            </Chip>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="block">
          <span className="mb-1 block px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Niveau</span>
          <select
            value={currentLevel}
            onChange={(e) => setParam("level", e.target.value)}
            disabled={pending}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1e3a5f]"
          >
            <option value="">Tous niveaux</option>
            {BTP_DICO_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Statut</span>
          <select
            value={currentStatus}
            onChange={(e) => setParam("status", e.target.value)}
            disabled={pending}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1e3a5f]"
          >
            <option value="">Tous statuts</option>
            {BTP_DICO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </section>
    </div>
  );
}

function LotRow({
  active,
  count,
  muted,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  muted?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex w-full items-center justify-between gap-2 rounded-lg bg-[#1e3a5f] px-3 py-2 text-left text-sm font-medium text-white"
          : `flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 ${muted ? "text-slate-400" : "text-slate-700"}`
      }
    >
      <span className="flex min-w-0 items-center">{children}</span>
      <span
        className={
          active
            ? "shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white"
            : "shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500"
        }
      >
        {count}
      </span>
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      }
    >
      {children}
    </button>
  );
}
