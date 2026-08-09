"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessagerieMissionsView } from "@/components/messagerie/MessagerieMissionsView";
import { MessagerieView } from "@/components/messagerie/MessagerieView";

type Props = {
  sessionUserId: string;
  isAgence: boolean;
  isAgent: boolean;
  isClient: boolean;
  canChangeStatus: boolean;
  agents: { id: string; name: string; role?: string }[];
  recipients: { id: string; name: string; role: string }[];
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#0b141a] px-3 py-2">
        <button
          type="button"
          onClick={() => setView("missions")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            view === "missions" ? "bg-[#1d4ed8] text-white" : "text-slate-300 hover:bg-white/10"
          }`}
        >
          Conversations
        </button>
        <button
          type="button"
          onClick={() => setView("chantiers")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            view === "chantiers" ? "bg-[#1d4ed8] text-white" : "text-slate-300 hover:bg-white/10"
          }`}
        >
          Chantiers
        </button>
        <p className="ml-auto hidden max-w-md truncate text-xs text-slate-400 sm:block">
          {view === "chantiers"
            ? "Fils chantier : Interne · Client · Fournisseur — ne mélangez pas"
            : "Messages récents en haut · comme WhatsApp"}
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
