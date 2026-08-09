"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessagerieMissionsView } from "@/components/messagerie/MessagerieMissionsView";
import { MessagerieView } from "@/components/messagerie/MessagerieView";
import type { MessagingPartyType } from "@/lib/messagerie/party-type";

export type HubRecipient = {
  id: string;
  name: string;
  role: string;
  personType?: string | null;
  permissionProfile?: string | null;
  company?: string | null;
  partyType?: MessagingPartyType;
  shortLabel?: string;
};

type Props = {
  sessionUserId: string;
  isAgence: boolean;
  isAgent: boolean;
  isClient: boolean;
  canChangeStatus: boolean;
  agents: { id: string; name: string; role?: string }[];
  recipients: HubRecipient[];
  managerId: string | null;
  /** Externes : ouvrir directement les fils chantier. */
  preferChantiers?: boolean;
  hideNewDemande?: boolean;
};

export function MessagerieHub(props: Props) {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const projectParam = searchParams.get("project");
  const channelParam = searchParams.get("channel");

  const initialView = useMemo(() => {
    if (viewParam === "chantiers" || viewParam === "missions") return viewParam;
    return props.preferChantiers ? "chantiers" : "missions";
  }, [viewParam, props.preferChantiers]);

  const [view, setView] = useState<"missions" | "chantiers">(initialView);

  useEffect(() => {
    if (viewParam === "chantiers" || viewParam === "missions") {
      setView(viewParam);
    }
  }, [viewParam]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2">
        <button
          type="button"
          onClick={() => setView("missions")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            view === "missions"
              ? "bg-[#1e3a5f] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Conversations
        </button>
        <button
          type="button"
          onClick={() => setView("chantiers")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            view === "chantiers"
              ? "bg-[#1e3a5f] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          title="Filtrer les fils par chantier (Interne · Client · Fournisseur)"
        >
          Par chantier
        </button>
        <p className="ml-auto hidden max-w-md truncate text-[11px] text-slate-400 sm:block">
          {view === "chantiers"
            ? "Contexte chantier · Interne / Client / Fournisseur"
            : "Une messagerie · récents en premier"}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "missions" ? (
          <MessagerieMissionsView
            sessionUserId={props.sessionUserId}
            isAgence={props.isAgence}
            isAgent={props.isAgent}
            isClient={props.isClient}
            canChangeStatus={props.canChangeStatus}
            agents={props.agents}
            recipients={props.recipients}
            managerId={props.managerId}
          />
        ) : (
          <div className="h-full overflow-auto bg-[#f1f5f9] p-2 sm:p-3">
            <MessagerieView
              sessionUserId={props.sessionUserId}
              initialProjectId={projectParam}
              initialChannel={channelParam}
              hideNewDemande={props.hideNewDemande}
            />
          </div>
        )}
      </div>
    </div>
  );
}
