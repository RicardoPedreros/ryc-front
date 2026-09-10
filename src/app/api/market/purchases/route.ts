import { NextRequest, NextResponse } from 'next/server';
import { PurchaseUseCases } from '@/application/market/purchase-use-cases';
import { NeonPurchaseRepository } from '@/infrastructure/market/repositories/neon-purchase-repository';
import { NeonInventoryRepository } from '@/infrastructure/market/repositories/neon-inventory-repository';
import { NeonMovementTypeRepository } from '@/infrastructure/market/repositories/neon-movement-type-repository';
import { getSessionFromRequest, canModifyRecord, getAdminIds } from '@/shared/auth';

const purchaseUseCases = new PurchaseUseCases(
  new NeonPurchaseRepository(),
  new NeonInventoryRepository(),
  new NeonMovementTypeRepository(),
);

async function isPurchaseVisible(
  createdBy: string | null,
  session: ReturnType<typeof getSessionFromRequest>,
): Promise<boolean> {
  if (session?.roleCode === 'admin') return true;
  if (!createdBy) return true;
  if (createdBy === session?.id) return true;
  const adminIds = await getAdminIds();
  return adminIds.includes(createdBy);
}

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const includeItems = searchParams.get('includeItems') === 'true';

    if (id) {
      const purchase = await purchaseUseCases.findById(id);
      if (!purchase) {
        return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
      }

      const visible = await isPurchaseVisible(purchase.createdBy, session);
      if (!visible) {
        return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
      }

      const items = await purchaseUseCases.findItems(id);
      return NextResponse.json({ ...purchase, items });
    }

    if (includeItems) {
      const purchases = await purchaseUseCases.findAllWithItemsFiltered(session?.id ?? null, session?.roleCode ?? null);
      return NextResponse.json(purchases);
    }

    const purchases = await purchaseUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
    return NextResponse.json(purchases);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const { items, ...purchaseData } = body;
    const purchase = await purchaseUseCases.create({ ...purchaseData, createdBy: session?.id ?? null }, items);
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Purchase id is required' }, { status: 400 });
    }

    const existing = await purchaseUseCases.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      return NextResponse.json({ error: 'You can only edit records you created' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await purchaseUseCases.update(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Purchase id is required' }, { status: 400 });
    }

    const existing = await purchaseUseCases.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      return NextResponse.json({ error: 'You can only delete records you created' }, { status: 403 });
    }

    const deleted = await purchaseUseCases.remove(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
