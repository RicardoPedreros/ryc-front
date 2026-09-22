import { NextRequest, NextResponse } from 'next/server';
import { PurchaseUseCases } from '@/application/market/purchase-use-cases';
import { NeonPurchaseRepository } from '@/infrastructure/market/repositories/neon-purchase-repository';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import { NeonMovementTypeRepository } from '@/infrastructure/market/repositories/neon-movement-type-repository';
import { getSessionFromRequest } from '@/infrastructure/auth/session';
import { canModifyRecord, canViewRecord } from '@/application/auth/authorization-policies';
import { apiRoute, badRequest, forbidden, notFound } from '@/shared/route-helpers';

const purchaseUseCases = new PurchaseUseCases(
  new NeonPurchaseRepository(),
  new NeonInventoryRepository(),
  new NeonMovementTypeRepository(),
);

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const includeItems = searchParams.get('includeItems') === 'true';

    if (id) {
      const purchase = await purchaseUseCases.findById(id);
      if (!purchase) notFound('Purchase not found');

      const viewer = { id: session?.id ?? null, roleCode: session?.roleCode ?? null };
      if (!canViewRecord(purchase.createdBy, viewer)) notFound('Purchase not found');

      const items = await purchaseUseCases.findItems(id);
      return { ...purchase, items };
    }

    if (includeItems) {
      return purchaseUseCases.findAllWithItemsFiltered(session?.id ?? null, session?.roleCode ?? null);
    }

    return purchaseUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const { items, ...purchaseData } = body;
    const purchase = await purchaseUseCases.create({ ...purchaseData, createdBy: session?.id ?? null }, items);
    return NextResponse.json(purchase, { status: 201 });
  });
}

export async function PUT(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Purchase id is required');

    const existing = await purchaseUseCases.findById(id);
    if (!existing) notFound('Purchase not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only edit records you created');
    }

    const body = await request.json();
    return purchaseUseCases.update(id, body);
  });
}

export async function DELETE(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Purchase id is required');

    const existing = await purchaseUseCases.findById(id);
    if (!existing) notFound('Purchase not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only delete records you created');
    }

    const deleted = await purchaseUseCases.remove(id);
    return { success: deleted };
  });
}