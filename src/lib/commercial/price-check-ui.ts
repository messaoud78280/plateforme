/** Helpers UI V1.2 — sans Prisma. */
export function shouldOfferPriceCheck(status: string): boolean {
  return ["DRAFT", "TO_VALIDATE", "VALIDATED", "SENT", "VIEWED"].includes(status);
}
