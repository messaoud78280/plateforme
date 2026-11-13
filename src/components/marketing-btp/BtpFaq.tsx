"use client";

import { useState } from "react";

type Item = { q: string; a: string };

export function BtpFaq({
  items,
  title = "Questions fréquentes",
}: {
  items: readonly Item[] | Item[];
  title?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="btp-faq-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">FAQ</p>
        <h2 id="btp-faq-title" className="mt-2 text-2xl font-bold sm:text-3xl">
          {title}
        </h2>
        <div className="mt-8 divide-y divide-[var(--btp-border)] border-y border-[var(--btp-border)]">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 py-4 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="text-xl font-semibold text-[var(--btp-heading)]">
                    {item.q}
                  </span>
                  <span
                    className="mt-1 shrink-0 text-lg font-medium text-[var(--btp-steel)]"
                    aria-hidden
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? (
                  <p className="bw-btp-lead pb-5 pr-8">{item.a}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
