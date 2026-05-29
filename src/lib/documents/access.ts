type DocAccess = {
  clientId: string;
  task?: { clientId: string; assignedToId: string | null } | null;
};

type SessionUser = { id: string; role?: string | null };

/** Accès lecture d'un document mission / bibliothèque client. */
export function canAccessDocument(user: SessionUser, doc: DocAccess): boolean {
  const role = user.role ?? "CLIENT";
  if (role === "MANAGER" || role === "AGENCE") return true;
  if (role === "CLIENT") return doc.clientId === user.id;
  if (role === "AGENT") {
    if (doc.task) return doc.task.assignedToId === user.id;
    return false;
  }
  return false;
}
