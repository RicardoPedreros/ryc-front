import { NextResponse } from 'next/server';
import { InventoryUseCases } from '@/application/market/inventory-use-cases';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';

const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());

export interface InventoryStats {
  readonly totalProducts: number;
  readonly outOfStock: number;
  readonly lowStock: number;
  readonly expired: number;
  readonly expiringSoon: number;
  readonly ok: number;
}

export async function GET() {
  try {
    const stock = await inventoryUseCases.getStock();

    const outOfStock = stock.filter((s) => s.currentStock === 0);
    const lowStock = stock.filter(
      (s) => s.currentStock > 0 && s.currentStock <= s.minStock
    );
    const expired = stock.filter(
      (s) => s.daysUntilExpiry !== null && s.daysUntilExpiry <= 0
    );
    const expiringSoon = stock.filter(
      (s) => s.daysUntilExpiry !== null && s.daysUntilExpiry > 0 && s.daysUntilExpiry <= s.minDays
    );
    const ok = stock.filter(
      (s) =>
        s.currentStock > s.minStock &&
        (s.daysUntilExpiry === null || s.daysUntilExpiry > s.minDays)
    );

    const stats: InventoryStats = {
      totalProducts: stock.length,
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      ok: ok.length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
