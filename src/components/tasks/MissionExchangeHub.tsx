"use client";

import { isFeatureEnabled } from "@/lib/feature-flags";

type Props = {
  hasMessages: boolean;
  awaitingClientDecision?: boolean;
};

/** Ancres de navigation du hub mission — échanges / livrable / validation. */
export function MissionExchangeHub({ hasMessages, awaitingClientDecision }: Props) {
  const validationOn = isFeatureEnabled("clientDeliverableValidation");

  return (
    <nav
      aria-label="Échanges de la mission"
      className="cc-card sticky top-14 z-20 flex flex-wrap items-center gap-2 p-2 sm:top-16"
    >
      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-bework-muted">
        Hub mission
      </span>
      {hasMessages ? (
        <a href="#messages-section" className="btn-cc-ghost !text-xs">
          Messages
        </a>
      ) : null}
      <a href="#documents-section" className="btn-cc-ghost !text-xs">
        Pièces
      </a>
      <a href="#compte-rendu" className="btn-cc-ghost !text-xs">
        Compte rendu
      </a>
      {validationOn ? (
        <a
          href="#validation-client"
          className={awaitingClientDecision ? "btn-cc-primary !text-xs" : "btn-cc-ghost !text-xs"}
        >
          {awaitingClientDecision ? "À valider" : "Validation client"}
        </a>
      ) : null}
    </nav>
  );
}
