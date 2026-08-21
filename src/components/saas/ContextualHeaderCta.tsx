import Link from "next/link";
import {
  contextualPrimaryCta,
  getOrganizationActivationSnapshot,
} from "@/lib/organization/activation";
import { resolveActiveOrganizationId } from "@/lib/organization/tenant";

/** CTA principal du header — contextuel pendant l’activation SaaS. */
export async function ContextualHeaderCta({
  user,
}: {
  user: {
    id: string;
    role?: string | null;
    isDemo?: boolean;
    demoRootUserId?: string | null;
    personType?: string | null;
    permissionProfile?: string | null;
  };
}) {
  if (user.isDemo) return null;

  let cta = { href: "/dashboard/taches?nouvelle=1", label: "+ Nouvelle tâche" };
  try {
    const organizationId = await resolveActiveOrganizationId(user);
    if (organizationId) {
      const snap = await getOrganizationActivationSnapshot(organizationId);
      cta = contextualPrimaryCta(snap);
    }
  } catch {
    /* fallback standard */
  }

  return (
    <Link href={cta.href} className="btn-cc-primary !text-xs sm:!text-sm">
      {cta.label}
    </Link>
  );
}
