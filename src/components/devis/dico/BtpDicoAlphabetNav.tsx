"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const LIST_PATH = "/dashboard/devis/dico-btp";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function BtpDicoAlphabetNav({ availableLetters }: { availableLetters: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = (sp.get("letter") ?? "").toUpperCase();
  const available = new Set(availableLetters.map((l) => l.toUpperCase()));

  const go = (letter: string) => {
    const params = new URLSearchParams(sp.toString());
    if (letter && current !== letter) params.set("letter", letter);
    else params.delete("letter");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${LIST_PATH}?${qs}` : LIST_PATH));
  };

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Navigation alphabétique">
      <button
        type="button"
        onClick={() => go("")}
        className={
          !current
            ? "rounded-md bg-[#1e3a5f] px-2 py-1 text-xs font-bold text-white"
            : "rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
        }
      >
        Tous
      </button>
      {LETTERS.map((letter) => {
        const isAvailable = available.has(letter);
        const isActive = current === letter;
        return (
          <button
            key={letter}
            type="button"
            disabled={!isAvailable || pending}
            onClick={() => go(letter)}
            className={
              isActive
                ? "h-7 w-7 rounded-md bg-[#1e3a5f] text-xs font-bold text-white"
                : isAvailable
                  ? "h-7 w-7 rounded-md text-xs font-semibold text-[#1e3a5f] hover:bg-slate-100"
                  : "h-7 w-7 rounded-md text-xs font-medium text-slate-300"
            }
          >
            {letter}
          </button>
        );
      })}
    </nav>
  );
}
