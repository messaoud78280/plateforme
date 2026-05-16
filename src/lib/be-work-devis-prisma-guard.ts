import { Prisma } from "@prisma/client";

/** Tables / colonnes Quote* absentes ou en retard sur le schéma Prisma (prod SQL non rejoué). */
export function isMissingQuoteSchemaError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return error.code === "P2021" || error.code === "P2022";
}
