import { NextRequest, NextResponse } from 'next/server';
import { PurchaseUseCases } from '@/application/market/purchase-use-cases';
import { NeonPurchaseRepository } from '@/infrastructure/market/repositories/neon-purchase-repository';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import { NeonMovementTypeRepository } from '@/infrastructure/market/repositories/neon-movement-type-repository';
import { getSessionFromRequest } from '@/infrastructure/auth/session';
import { canModifyRecord } from '@/application/auth/authorization-policies';
import { apiRoute, badRequest, forbidden, notFound } from '@/shared/route-helpers';

const purchaseUseCases = new PurchaseUseCases(
  new NeonPurchaseRepository(),
  new NeonInventoryRepository(),
  new NeonMovementTypeRepository(),
);

export async function PUT(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Item id is required');

    const existing = await purchaseUseCases.findItem(id);
    if (!existing) notFound('Purchase item not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only edit records you created');
    }

    const body = await request.json();
    const updated = await purchaseUseCases.updateItem(id, {
      quantity: body.quantity,
      unitPrice: body.unitPrice ?? null,
      discount: body.discount ?? null,
      expirationDate: body.expirationDate ?? null,
      lot: body.lot ?? null,
    });
    return NextResponse.json(updated, { status: 200 });
  });
}