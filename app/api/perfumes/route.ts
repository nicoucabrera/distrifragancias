import { NextResponse } from 'next/server';
import { pool, ensurePerfumesTable } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await ensurePerfumesTable();
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim() ?? '';
    const marca = url.searchParams.get('marca')?.trim() ?? '';
    const minUsdt = parseFloat(url.searchParams.get('minUsdt') ?? '0');
    const minPesos = parseInt(url.searchParams.get('minPesos') ?? '0', 10);
    const limitParam = parseInt(url.searchParams.get('limit') ?? '200', 10);
    const limit = isNaN(limitParam) ? 200 : Math.min(Math.max(limitParam, 10), 500);

    const conditions: string[] = [];
    const params: Array<string | number> = [];

    if (search) {
      conditions.push('(LOWER(nombre) LIKE ? OR LOWER(marca) LIKE ?)');
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    if (marca) {
      conditions.push('marca = ?');
      params.push(marca);
    }

    if (!isNaN(minUsdt) && minUsdt > 0) {
      conditions.push('CAST(REPLACE(usdt, ",", ".") AS DECIMAL(10,2)) >= ?');
      params.push(minUsdt);
    }

    if (!isNaN(minPesos) && minPesos > 0) {
      conditions.push('pesos >= ?');
      params.push(minPesos);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT id, marca, nombre, usdt, pesos FROM PERFUMES ${whereClause} ORDER BY marca, nombre LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to load perfumes:', error);
    return NextResponse.json({ error: 'No se pudo cargar el catálogo de perfumes.' }, { status: 500 });
  }
}
