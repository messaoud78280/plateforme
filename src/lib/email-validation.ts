/** Format email métier minimal (rejette ex. `user@gmail` sans TLD comme `.com`). */
export function isWellFormedEmail(email: string): boolean {
  const e = email.trim();
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(e);
}
