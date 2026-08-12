"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MessagerieMissionsView } from "@/components/messagerie/MessagerieMissionsView";
import { MessagerieView } from "@/components/messagerie/MessagerieView";
import type { MessagingPartyType } from "@/lib/messagerie/party-type";
import {
  buildMessagerieChantierUrl,
  buildMessagerieMissionsUrl,
  resolveMessagerieView,
} from "@/lib/messagerie/messaging-url";
import { cn } from "@/lib/cn";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectParam = searchParams.get("project");
  const channelParam = searchParams.get("channel");
  const channelIdParam = searchParams.get("channelId");
  const externalOrgParam = searchParams.get("externalOrganizationId");

  const view = resolveMessagerieView(searchParams, props.preferChantiers);

  /** Conversation ouverte — masquer le chrome Hub sur mobile. */
  const threadOpen = Boolean(
    searchParams.get("task") ||
      searchParams.get("with") ||
      searchParams.get("channelId"),
  );

  function switchView(next: "missions" | "chantiers") {
    if (next === view) return;
    router.push(
      next === "missions" ? buildMessagerieMissionsUrl() : buildMessagerieChantierUrl(),
      { scroll: false },
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5",
          threadOpen && "hidden md:flex",
        )}
      >
        <h1 className="mr-1 text-base font-bold tracking-tight text-[#1e3a5f] md:text-lg">
          Messagerie
        </h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => switchView("missions")}
            className={`min-h-9 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              view === "missions"
                ? "bg-[#1e3a5f] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            aria-pressed={view === "missions"}
          >
            Discussions
          </button>
          <button
            type="button"
            onClick={() => switchView("chantiers")}
            className={`min-h-9 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              view === "chantiers"
                ? "bg-[#1e3a5f] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            aria-pressed={view === "chantiers"}
            title="Conversations par chantier"
          >
            Par chantier
          </button>
        </div>
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
              initialChannelId={channelIdParam}
              initialExternalOrganizationId={externalOrgParam}
              hideNewDemande={props.hideNewDemande}
            />
          </div>
        )}
      </div>
    </div>
  );
}
