export type BtpDicoFilterParams = {
  q?: string;
  lot?: string;
  family?: string;
  category?: string;
  level?: string;
  status?: string;
  letter?: string;
  onlyAcronyms?: boolean;
};

export type BtpDicoListRow = {
  id: string;
  term: string;
  acronym: string | null;
  lotCode: string | null;
  lotName: string | null;
  family: string | null;
  category: string | null;
  shortDefinition: string;
  level: string;
  status: string;
  keywords: string[];
  synonyms: string[];
  updatedAt: Date;
};

export type BtpDicoStats = {
  totalTerms: number;
  lotsCovered: number;
  acronyms: number;
  toVerify: number;
};
