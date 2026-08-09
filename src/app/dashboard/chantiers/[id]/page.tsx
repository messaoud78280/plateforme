import { redirect } from "next/navigation";

/** Alias CHANTIER-V2A — la fiche chantier vit sous /dashboard/projets/[id]. */
export default async function ChantierAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/projets/${id}`);
}
