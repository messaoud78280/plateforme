import crypto from "crypto";
import { normalizeLoginIdentifier } from "./constants";

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";

export function generateSecureDemoPassword(length = 14): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[bytes[i]! % PASSWORD_ALPHABET.length];
  }
  return out;
}

export function generateLoginIdentifier(companyName: string, explicit?: string | null): string {
  if (explicit?.trim()) {
    const n = normalizeLoginIdentifier(explicit);
    if (n.length >= 3) return n;
  }
  const base = normalizeLoginIdentifier(companyName) || "demo";
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${base.slice(0, 40)}-${suffix}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
