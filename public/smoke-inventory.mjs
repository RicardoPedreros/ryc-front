import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.split('\n').find((l) => l.startsWith('DATABASE_URL='))?.slice('DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
if (!dbUrl) throw new Error('DATABASE_URL not found in .env.local');

try {
  const p = new URL(dbUrl);
  console.log('URL ok:', p.protocol, '|', p.hostname, '|', p.pathname, '| trailing:', JSON.stringify(dbUrl.slice(-20)));
} catch (e) {
  console.log('URL FAIL:', e.message, '| trailing:', JSON.stringify(dbUrl.slice(-20)));
}

const { neon } = await import('@neondatabase/serverless');
const sql = neon(dbUrl);

const stockQuery = `
  WITH RECURSIVE brand_paths AS (
    SELECT b.id, b.parent_brand_id, b.name::text AS full_path
    FROM brands b WHERE b.parent_brand_id IS NULL
    UNION ALL
    SELECT b.id, b.parent_brand_id, bp.full_path || ' \u2192 ' || b.name
    FROM brands b JOIN brand_paths bp ON b.parent_brand_id = bp.id
  ),
  balance_agg AS (
    SELECT product_id,
      SUM(current_stock)::int AS current_stock,
      MIN(CASE WHEN expiration_date < DATE '9999-12-31' AND current_stock > 0 THEN expiration_date END) AS nearest_expiry
    FROM inventory_balance GROUP BY product_id
  )
  SELECT p.id, p.name, b.name AS brand,
    CASE WHEN b.id IS NULL THEN NULL WHEN b.parent_brand_id IS NULL THEN NULL ELSE bp.full_path END AS "brandPath",
    COALESCE(ba.current_stock, 0) AS current_stock,
    ba.nearest_expiry,
    CASE WHEN ba.nearest_expiry IS NOT NULL THEN (ba.nearest_expiry::date - CURRENT_DATE) ELSE NULL END::int AS days_until_expiry
  FROM products p
  LEFT JOIN brands b ON p.brand_id = b.id
  LEFT JOIN brand_paths bp ON bp.id = p.brand_id
  LEFT JOIN balance_agg ba ON ba.product_id = p.id
  WHERE p.parent_product_id IS NULL AND p.is_active = true
  ORDER BY p.name
`;

const adjustQuery = `
  WITH balance_agg AS (
    SELECT product_id, SUM(current_stock)::int AS current_stock
    FROM inventory_balance GROUP BY product_id
  )
  SELECT p.id, p.name, COALESCE(ba.current_stock, 0) AS current_stock
  FROM products p
  LEFT JOIN balance_agg ba ON ba.product_id = p.id
  WHERE p.parent_product_id IS NULL AND p.is_active = true
  ORDER BY p.name
`;

const lotsQuery = `
  SELECT ib.product_id,
    COALESCE(latest.lot, 'Sin lote') AS lot,
    ib.current_stock::int AS quantity,
    ib.expiration_date AS expiration_date,
    CASE WHEN ib.expiration_date < DATE '9999-12-31' THEN (ib.expiration_date::date - CURRENT_DATE) ELSE NULL END::int AS days_until_expiry,
    COALESCE(latest.movement_date, ib.updated_at) AS latest_movement_date
  FROM inventory_balance ib
  LEFT JOIN LATERAL (
    SELECT im.lot, im.movement_date
    FROM inventory_movements im
    LEFT JOIN products pp ON pp.id = im.product_id
    WHERE COALESCE(pp.parent_product_id, im.product_id) = ib.product_id
      AND COALESCE(im.expiration_date, DATE '9999-12-31') = ib.expiration_date
    ORDER BY im.movement_date DESC
    LIMIT 1
  ) latest ON true
  WHERE ib.current_stock > 0
  ORDER BY ib.product_id, ib.expiration_date ASC NULLS LAST
`;

const validationQuery = `
  WITH balance_totals AS (
    SELECT product_id, SUM(current_stock)::numeric(12,3) AS total
    FROM inventory_balance GROUP BY product_id
  ),
  movements_totals AS (
    SELECT COALESCE(p.parent_product_id, im.product_id) AS product_id,
      SUM(im.quantity * mt.stock_multiplier *
        CASE WHEN p.parent_product_id IS NOT NULL THEN COALESCE(p.stock_quantity, 1) ELSE 1 END)::numeric(12,3) AS total
    FROM inventory_movements im
    JOIN movement_types mt ON mt.id = im.movement_type_id
    JOIN products p ON p.id = im.product_id
    GROUP BY COALESCE(p.parent_product_id, im.product_id)
  )
  SELECT COALESCE(bt.product_id, mt.product_id) AS product_id, bt.total AS balance_total, mt.total AS movement_total
  FROM balance_totals bt
  FULL OUTER JOIN movements_totals mt ON mt.product_id = bt.product_id
  WHERE NOT (COALESCE(bt.total, 0) = COALESCE(mt.total, 0))
`;

const stock = await sql.query(stockQuery);
const adjust = await sql.query(adjustQuery);
const lots = await sql.query(lotsQuery);
const mismatches = await sql.query(validationQuery);

console.log(`stock rows: ${stock.length}`);
console.log(`adjust rows: ${adjust.length}`);
console.log(`lots rows: ${lots.length}`);
console.log(`stock/balance mismatches vs movements: ${mismatches.length}`);
if (mismatches.length > 0) console.log(JSON.stringify(mismatches, null, 2));
console.log('sample stock:', JSON.stringify(stock.slice(0, 2), null, 2));
console.log('sample lots:', JSON.stringify(lots.slice(0, 3), null, 2));
