/**
 * URLs Messagerie — source de vérité unique pour les vues Discussions / Par chantier.
 * `missions` = Discussions (historique du param `view`).
 */
export type MessagerieViewId = "missions" | "chantiers";

export type MessagerieUrlInput = {
  view?: MessagerieViewId;
  project?: string | null;
  channel?: string | null;
  channelId?: string | null;
  externalOrganizationId?: string | null;
  task?: string | null;
  with?: string | null;
  messageId?: string | null;
  tab?: string | null;
};

type SearchParamsLike = { get: (key: string) => string | null };

/** Vue active déduite de l'URL (deep-links + préférence persona). */
export function resolveMessagerieView(
  params: SearchParamsLike,
  preferChantiers = false,
): MessagerieViewId {
  const viewParam = params.get("view");

  if (params.get("task") || params.get("with")) return "missions";

  if (viewParam === "missions" || viewParam === "discussions") return "missions";
  if (viewParam === "chantiers") return "chantiers";

  if (params.get("channelId")) return "chantiers";
  if (params.get("project") && params.get("channel")) return "chantiers";

  return preferChantiers ? "chantiers" : "missions";
}

/** Construit une URL Messagerie sans paramètres incompatibles entre vues. */
export function buildMessagerieUrl(input: MessagerieUrlInput = {}): string {
  const view = input.view ?? "missions";
  const params = new URLSearchParams();

  if (view === "chantiers") {
    params.set("view", "chantiers");
    if (input.project) params.set("project", input.project);
    if (input.channelId) params.set("channelId", input.channelId);
    if (input.channel) params.set("channel", input.channel);
    if (input.externalOrganizationId) {
      params.set("externalOrganizationId", input.externalOrganizationId);
    }
    if (input.messageId) params.set("messageId", input.messageId);
  } else {
    params.set("view", "missions");
    if (input.task) params.set("task", input.task);
    if (input.with) params.set("with", input.with);
    if (input.tab) params.set("tab", input.tab);
    if (input.messageId) params.set("messageId", input.messageId);
  }

  const qs = params.toString();
  return qs ? `/dashboard/messagerie?${qs}` : "/dashboard/messagerie";
}

export function buildMessagerieChantierUrl(
  input: Omit<MessagerieUrlInput, "view" | "task" | "with" | "tab"> = {},
): string {
  return buildMessagerieUrl({ ...input, view: "chantiers" });
}

export function buildMessagerieMissionsUrl(
  input: Omit<MessagerieUrlInput, "view" | "project" | "channel" | "channelId" | "externalOrganizationId"> = {},
): string {
  return buildMessagerieUrl({ ...input, view: "missions" });
}
