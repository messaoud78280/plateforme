import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";

export default function EnAttenteValidationPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--cc-surface-muted)] px-4 py-10 md:py-14">
      <div className="relative mx-auto w-full max-w-lg space-y-4">
        <Alert tone="watch">Inscription en cours de validation</Alert>
        <Card hover={false}>
          <CardHeader
            title="Compte en attente"
            description="Votre demande a bien été enregistrée. L’équipe BeWork vérifie votre inscription avant d’ouvrir l’accès à la plateforme. Vous recevrez un email dès que votre compte sera validé."
          />
          <p className="text-sm text-bework-muted">
            Tant que la validation n’est pas effectuée, la connexion à l’espace client reste impossible.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="btn-cc-primary flex-1 text-center">
              Contacter BeWork
            </Link>
            <Link href="/" className="btn-cc-secondary flex-1 text-center">
              Retour à l’accueil
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
