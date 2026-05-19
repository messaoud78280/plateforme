import type { QuoteProject } from "@prisma/client";

export type QuoteClientType = "professionnel" | "particulier";

export type QuoteClientFormValues = {
  clientType: QuoteClientType;
  civility: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  landline: string;
  mobile: string;
  fax: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  cityName: string;
  projectName: string;
  projectAddress: string;
  projectCity: string;
  projectDepartment: string;
};

export function buildClientDisplayName(v: Pick<QuoteClientFormValues, "clientType" | "civility" | "firstName" | "lastName" | "companyName">): string {
  if (v.clientType === "particulier") {
    const name = [v.civility, v.firstName, v.lastName].map((s) => s.trim()).filter(Boolean).join(" ");
    return name || "Client particulier";
  }
  return v.companyName.trim() || [v.firstName, v.lastName].filter(Boolean).join(" ").trim() || "Client professionnel";
}

export function quoteProjectToClientForm(project: QuoteProject): QuoteClientFormValues {
  const clientType: QuoteClientType = project.clientType === "particulier" ? "particulier" : "professionnel";
  return {
    clientType,
    civility: project.clientCivility ?? "",
    firstName: project.clientFirstName ?? "",
    lastName: project.clientLastName ?? "",
    companyName: project.clientCompanyName ?? (clientType === "professionnel" ? project.clientName : ""),
    email: project.clientEmail ?? "",
    landline: project.clientLandline ?? "",
    mobile: project.clientMobile ?? project.clientPhone ?? "",
    fax: project.clientFax ?? "",
    addressLine1: project.clientAddressLine1 ?? "",
    addressLine2: project.clientAddressLine2 ?? "",
    postalCode: project.clientPostalCode ?? "",
    cityName: project.clientCityName ?? "",
    projectName: project.projectName,
    projectAddress: project.projectAddress ?? "",
    projectCity: project.projectCity ?? "",
    projectDepartment: project.projectDepartment ?? "",
  };
}

/** Lignes adresse / contact pour le PDF (adresse client en priorité). */
export function formatClientLinesForPdf(project: QuoteProject): string[] {
  const lines: string[] = [];
  const street = [project.clientAddressLine1, project.clientAddressLine2].filter(Boolean).join(", ");
  const cityLine = [project.clientPostalCode, project.clientCityName].filter(Boolean).join(" ");
  if (street) lines.push(street);
  else if (project.projectAddress) lines.push(project.projectAddress);
  if (cityLine) lines.push(cityLine);
  else if (project.projectCity) {
    lines.push([project.projectCity, project.projectDepartment].filter(Boolean).join(" — "));
  }
  if (project.clientEmail) lines.push(project.clientEmail);
  const phone = project.clientMobile || project.clientPhone || project.clientLandline;
  if (phone) lines.push(phone);
  if (project.clientFax) lines.push(`Fax : ${project.clientFax}`);
  if (project.clientReference) lines.push(`Réf. ${project.clientReference}`);
  return lines;
}

export function parseClientFormFromFormData(formData: FormData): QuoteClientFormValues {
  const clientType = formData.get("clientType") === "particulier" ? "particulier" : "professionnel";
  return {
    clientType,
    civility: String(formData.get("civility") ?? "").trim(),
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    companyName: String(formData.get("companyName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    landline: String(formData.get("landline") ?? "").trim(),
    mobile: String(formData.get("mobile") ?? "").trim(),
    fax: String(formData.get("fax") ?? "").trim(),
    addressLine1: String(formData.get("addressLine1") ?? "").trim(),
    addressLine2: String(formData.get("addressLine2") ?? "").trim(),
    postalCode: String(formData.get("postalCode") ?? "").trim(),
    cityName: String(formData.get("cityName") ?? "").trim(),
    projectName: String(formData.get("projectName") ?? "").trim(),
    projectAddress: String(formData.get("projectAddress") ?? "").trim(),
    projectCity: String(formData.get("projectCity") ?? "").trim(),
    projectDepartment: String(formData.get("projectDepartment") ?? "").trim(),
  };
}

export function clientFormToPrismaData(v: QuoteClientFormValues) {
  const clientName = buildClientDisplayName(v);
  return {
    clientName,
    clientType: v.clientType,
    clientCivility: v.civility || null,
    clientFirstName: v.firstName || null,
    clientLastName: v.lastName || null,
    clientCompanyName: v.companyName || null,
    clientEmail: v.email || null,
    clientPhone: v.mobile || v.landline || null,
    clientLandline: v.landline || null,
    clientMobile: v.mobile || null,
    clientFax: v.fax || null,
    clientAddressLine1: v.addressLine1 || null,
    clientAddressLine2: v.addressLine2 || null,
    clientPostalCode: v.postalCode || null,
    clientCityName: v.cityName || null,
    projectName: v.projectName,
    projectAddress: v.projectAddress || null,
    projectCity: v.projectCity || null,
    projectDepartment: v.projectDepartment || null,
  };
}
