export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function expiryBadgeClass(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
}

export function expiryLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `Venció hace ${Math.abs(days)}d`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Mañana";
  return `${days}d`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function lotKey(lot: { readonly lot: string; readonly expirationDate: string | null }): string {
  return `${lot.lot}|${lot.expirationDate ?? ""}`;
}