import { requireCommercialSession } from "@/lib/commercial/access";
import { CommercialSubNav } from "@/components/commercial/CommercialSubNav";

export default async function DevisFacturationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCommercialSession();
  return (
    <div className="space-y-6">
      <CommercialSubNav />
      {children}
    </div>
  );
}
