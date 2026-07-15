"use client";

import { useFetch } from "@/presentation/hooks/useFetch";
import type { InventoryStock } from "@/domain/market/entities/inventory-movement";
import type { Purchase } from "@/domain/market/entities/purchase";

export function MarketGreeting() {
  const { data: stock } = useFetch<readonly InventoryStock[]>("/api/market/inventory");
  const { data: purchases } = useFetch<readonly Purchase[]>("/api/market/purchases");

  const lowStockCount = (stock ?? []).filter((s) => s.currentStock <= 2).length;

  const now = new Date();
  const monthPurchases = (purchases ?? []).filter((p) => {
    const d = new Date(p.purchaseDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = monthPurchases.reduce((sum, p) => sum + (p.total ?? 0), 0);

  const buildMessage = (): string => {
    if (stock === null && purchases === null) {
      return "Cargá productos y registrá compras para empezar.";
    }
    const parts: string[] = [];
    if (lowStockCount > 0) {
      parts.push(`${lowStockCount} producto${lowStockCount === 1 ? "" : "s"} por reponer`);
    }
    if (monthTotal > 0) {
      parts.push(`$${monthTotal.toLocaleString("es-AR")} este mes`);
    }
    if (parts.length === 0) {
      return "Todo al día. ¿Registraron algo esta semana?";
    }
    return parts.join(" · ") + ".";
  };

  return (
    <div className="mkt-greeting">
      <h1>Hola</h1>
      <p>{buildMessage()}</p>
    </div>
  );
}
