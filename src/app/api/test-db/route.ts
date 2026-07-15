import { NextResponse } from 'next/server';
import { getSql } from '@/infrastructure/market/neon-client';

interface TestResult {
  readonly step: string;
  readonly status: 'ok' | 'error';
  readonly detail: string;
  readonly duration?: number;
}

export async function GET() {
  const results: TestResult[] = [];

  // Step 1: Check DATABASE_URL is set
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    results.push({ step: 'DATABASE_URL', status: 'error', detail: 'Variable DATABASE_URL no configurada en .env.local' });
    return NextResponse.json({ ok: false, results });
  }

  const maskedUrl = dbUrl.replace(/:[^@]+@/, ':****@');
  results.push({ step: 'DATABASE_URL', status: 'ok', detail: maskedUrl });

  // Step 2: Basic connectivity — SELECT 1
  try {
    const sql = getSql();
    const start = performance.now();
    const pingResult = await sql`SELECT 1 AS ping`;
    const pingDuration = Math.round(performance.now() - start);
    results.push({ step: 'Conexión', status: 'ok', detail: `SELECT 1 → ${(pingResult as readonly Record<string, unknown>[])[0]?.ping}`, duration: pingDuration });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ step: 'Conexión', status: 'error', detail: message });
    return NextResponse.json({ ok: false, results });
  }

  // Step 3: List all tables
  try {
    const sql = getSql();
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    ` as readonly Record<string, unknown>[];
    const tableNames = tablesResult.map((r) => String(r.table_name));
    results.push({ step: 'Tablas', status: 'ok', detail: tableNames.length > 0 ? tableNames.join(', ') : 'No hay tablas en el schema public' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ step: 'Tablas', status: 'error', detail: message });
  }

  // Step 4: Row counts via pg_stat_user_tables (no per-table queries needed)
  try {
    const sql = getSql();
    const stats = await sql`
      SELECT relname AS table_name, n_live_tup AS row_estimate
      FROM pg_stat_user_tables
      ORDER BY relname
    ` as readonly Record<string, unknown>[];

    if (stats.length > 0) {
      const summary = stats.map((r) => `${r.table_name}: ~${r.row_estimate} filas`).join(' | ');
      results.push({ step: 'Filas', status: 'ok', detail: summary });
    } else {
      results.push({ step: 'Filas', status: 'ok', detail: 'No hay tablas con datos' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ step: 'Filas', status: 'error', detail: message });
  }

  // Step 5: Check enums
  try {
    const sql = getSql();
    const enums = await sql`
      SELECT t.typname AS enum_name,
             array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      GROUP BY t.typname
      ORDER BY t.typname
    ` as readonly Record<string, unknown>[];

    if (enums.length > 0) {
      const enumSummary = enums.map((r) => `${r.enum_name}: {${r.values}}`).join(' | ');
      results.push({ step: 'Enums', status: 'ok', detail: enumSummary });
    } else {
      results.push({ step: 'Enums', status: 'ok', detail: 'No hay enums definidos' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ step: 'Enums', status: 'error', detail: message });
  }

  const allOk = results.every((r) => r.status === 'ok');
  return NextResponse.json({ ok: allOk, results });
}
