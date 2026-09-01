-- Commercial leads pipeline (prospects avant client)
CREATE TYPE "CommercialLeadStatus" AS ENUM (
  'NOUVEAU',
  'CONTACTE',
  'RDV_PLANIFIE',
  'ETUDE_EN_COURS',
  'DEVIS_A_PREPARER',
  'DEVIS_ENVOYE',
  'A_RELANCER',
  'GAGNE',
  'PERDU'
);

CREATE TABLE "CommercialLead" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "city" TEXT,
  "postalCode" TEXT,
  "addressLine1" TEXT,
  "needDescription" TEXT,
  "workType" TEXT,
  "sourceSite" TEXT,
  "sourcePage" TEXT,
  "status" "CommercialLeadStatus" NOT NULL DEFAULT 'NOUVEAU',
  "notes" TEXT,
  "externalOrganizationId" TEXT,
  "commercialQuoteId" TEXT,
  "projectId" TEXT,
  "nextAppointmentAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CommercialLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommercialLead_organizationId_status_idx" ON "CommercialLead"("organizationId", "status");
CREATE INDEX "CommercialLead_organizationId_createdAt_idx" ON "CommercialLead"("organizationId", "createdAt");
CREATE INDEX "CommercialLead_organizationId_nextAppointmentAt_idx" ON "CommercialLead"("organizationId", "nextAppointmentAt");
CREATE INDEX "CommercialLead_externalOrganizationId_idx" ON "CommercialLead"("externalOrganizationId");
CREATE INDEX "CommercialLead_email_idx" ON "CommercialLead"("email");

ALTER TABLE "CommercialLead" ADD CONSTRAINT "CommercialLead_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialLead" ADD CONSTRAINT "CommercialLead_externalOrganizationId_fkey"
  FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommercialLead" ADD CONSTRAINT "CommercialLead_commercialQuoteId_fkey"
  FOREIGN KEY ("commercialQuoteId") REFERENCES "CommercialQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommercialLead" ADD CONSTRAINT "CommercialLead_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgendaEvent" ADD COLUMN IF NOT EXISTS "commercialLeadId" TEXT;
CREATE INDEX IF NOT EXISTS "AgendaEvent_commercialLeadId_startAt_idx" ON "AgendaEvent"("commercialLeadId", "startAt");
ALTER TABLE "AgendaEvent" DROP CONSTRAINT IF EXISTS "AgendaEvent_commercialLeadId_fkey";
ALTER TABLE "AgendaEvent" ADD CONSTRAINT "AgendaEvent_commercialLeadId_fkey"
  FOREIGN KEY ("commercialLeadId") REFERENCES "CommercialLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
