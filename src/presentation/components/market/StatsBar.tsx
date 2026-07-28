"use client";

import { useFetch } from "@/presentation/hooks/useFetch";
import type { InventoryStats } from "@/app/api/market/inventory/stats/route";

export function StatsBar() {
  const { data: stats, loading } = useFetch<InventoryStats>(
    "/api/market/inventory/stats"
  );

  if (loading || !stats) return null;

  const hasProblems =
    stats.outOfStock > 0 ||
    stats.lowStock > 0 ||
    stats.expired > 0 ||
    stats.expiringSoon > 0;

  return (
    <div className="mkt-stats-bar">
      <div className="mkt-stat-card">
        <span className="mkt-stat-value">{stats.totalProducts}</span>
        <span className="mkt-stat-label">Total productos</span>
      </div>
      <div className="mkt-stat-card">
        <span className="mkt-stat-value">{stats.outOfStock}</span>
        <span className="mkt-stat-label">Sin stock</span>
      </div>
      <div className="mkt-stat-card">
        <span className="mkt-stat-value">{stats.lowStock}</span>
        <span className="mkt-stat-label">Stock bajo</span>
      </div>
      <div className="mkt-stat-card">
        <span className="mkt-stat-value">{stats.expired}</span>
        <span className="mkt-stat-label">Vencidos</span>
      </div>
      {hasProblems && (
        <div className="mkt-stat-card attention">
          <span className="mkt-stat-value">
            {stats.outOfStock + stats.lowStock + stats.expired + stats.expiringSoon}
          </span>
          <span className="mkt-stat-label">Requieren atención</span>
        </div>
      )}
    </div>
  );
}
