export type CatalogMaterialStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type CatalogProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type CatalogMaterialInput = {
  family: string;
  designation: string;
  unit?: string;
  description?: string | null;
  techAttributes?: unknown;
  status?: CatalogMaterialStatus;
  notes?: string | null;
};

export type CatalogMaterialListItem = {
  id: string;
  organizationId: string;
  family: string;
  designation: string;
  unit: string;
  description: string | null;
  status: CatalogMaterialStatus;
  productCount: number;
  offerCount: number;
  updatedAt: string;
  createdAt: string;
};

export type CatalogMaterialDetail = CatalogMaterialListItem & {
  designationNormalized: string;
  techAttributes: unknown;
  notes: string | null;
  products: Array<{
    id: string;
    label: string;
    manufacturer: string | null;
    manufacturerRef: string | null;
    gtin: string | null;
    status: CatalogProductStatus;
    imageUrl: string | null;
    offerCount: number;
  }>;
};

export type CatalogListResult = {
  items: CatalogMaterialListItem[];
  total: number;
  page: number;
  pageSize: number;
  families: string[];
};
