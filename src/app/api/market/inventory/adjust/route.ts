import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/infrastructure/market/neon-client';

interface ProductWithStock {
  id: string;
  name: string;
  brand: string | null;
  brandId: string | null;
  categoryName: string | null;
  unitSymbol: string | null;
  currentStock: number;
}

interface AdjustMovementRow {
  id: string;
  product_id: string;
  movement_type_id: string;
  quantity: number;
  movement_date: Date;
  notes: string | null;
}

export async function GET() {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT
        p.id,
        p.name,
        b.name AS brand,
        p.brand_id AS "brandId",
        c.name AS "categoryName",
        u.symbol AS "unitSymbol",
        COALESCE(inv.current_stock, 0)::int AS "currentStock"
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN inventory inv ON p.id = inv.id
      WHERE p.is_active = true
      ORDER BY p.name
    ` as ProductWithStock[];
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface BatchAdjustmentItem {
  readonly productId: string;
  readonly quantity: number;
  readonly movementTypeId: string;
  readonly notes?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { movements: readonly BatchAdjustmentItem[] };
    if (!body.movements || !Array.isArray(body.movements) || body.movements.length === 0) {
      return NextResponse.json({ error: 'movements array is required' }, { status: 400 });
    }

    const valid = body.movements.filter((m) => m.quantity > 0);
    if (valid.length === 0) {
      return NextResponse.json({ error: 'No adjustments with quantity > 0' }, { status: 400 });
    }

    const sql = getSql();
    const results: AdjustMovementRow[] = [];

    for (const m of valid) {
      const rows = await sql`
        INSERT INTO inventory_movements (product_id, movement_type_id, quantity, notes)
        VALUES (${m.productId}, ${m.movementTypeId}, ${m.quantity}, ${m.notes ?? null})
        RETURNING *
      ` as AdjustMovementRow[];
      results.push(rows[0]);
    }

    return NextResponse.json({ created: results.length, movements: results }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
