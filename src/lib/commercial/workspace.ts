/** Routes du workspace Commercial — mêmes URLs, autre shell. */
export const COMMERCIAL_WORKSPACE_PREFIX = "/dashboard/devis-facturation";

export function isCommercialWorkspacePath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  return (
    pathname === COMMERCIAL_WORKSPACE_PREFIX ||
    pathname.startsWith(`${COMMERCIAL_WORKSPACE_PREFIX}/`)
  );
}
