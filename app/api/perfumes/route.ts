import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

function normalizeUsdt(value: string) {
  const parsed = parseFloat(value.replace(',', '.'));
  if (Number.isNaN(parsed)) return null;
  return parsed.toFixed(2).replace('.', ',');
}

export async function GET(request: Request) {
  try {
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
      conditions.push('(LOWER(NOMBRE) LIKE ? OR LOWER(MARCA) LIKE ?)');
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    if (marca) {
      conditions.push('MARCA = ?');
      params.push(marca);
    }

    if (!isNaN(minUsdt) && minUsdt > 0) {
      conditions.push('CAST(REPLACE(USDT, ",", ".") AS DECIMAL(10,2)) >= ?');
      params.push(minUsdt);
    }

    if (!isNaN(minPesos) && minPesos > 0) {
      conditions.push('PESOS >= ?');
      params.push(minPesos);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT id, MARCA as marca, NOMBRE as nombre, USDT as usdt, PESOS as pesos FROM PERFUMES ${whereClause} ORDER BY MARCA, NOMBRE LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(query, params);
    const perfumes = (rows as Array<{ id: number; marca: string; nombre: string; usdt: string; pesos: number }>).map((perfume) => ({
      id: perfume.id,
      marca: perfume.marca,
      nombre: perfume.nombre,
      usdt: normalizeUsdt(perfume.usdt) ?? perfume.usdt,
      pesos: perfume.pesos,
    }));

    return NextResponse.json(perfumes);
  } catch (error) {
    console.error('Failed to load perfumes:', error);
    return NextResponse.json({ error: 'No se pudo cargar el catálogo de perfumes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const marca = String(body.marca || '').trim();
    const nombre = String(body.nombre || '').trim();
    const usdt = normalizeUsdt(String(body.usdt || '').trim());
    const pesos = parseInt(body.pesos, 10);

    if (!marca || !nombre || !usdt || Number.isNaN(pesos) || pesos < 0) {
      return NextResponse.json({ error: 'Datos inválidos. Marca, nombre, USDT y pesos son obligatorios.' }, { status: 400 });
    }

    const [existingRows] = await pool.query('SELECT id FROM PERFUMES WHERE MARCA = ? AND NOMBRE = ? LIMIT 1', [marca, nombre]);
    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return NextResponse.json({ error: 'El producto ya existe en la base de datos.' }, { status: 409 });
    }

    const [maxRows] = await pool.query('SELECT MAX(id) as maxId FROM PERFUMES');
    const maxId = Array.isArray(maxRows) && maxRows.length > 0 ? Number((maxRows[0] as any).maxId || 0) : 0;
    const id = maxId + 1;

    await pool.query('INSERT INTO PERFUMES (id, marca, nombre, usdt, pesos) VALUES (?, ?, ?, ?, ?)', [id, marca, nombre, usdt, pesos]);

    return NextResponse.json({ id, marca, nombre, usdt, pesos }, { status: 201 });
  } catch (error) {
    console.error('Failed to save perfume:', error);
    return NextResponse.json({ error: 'No se pudo guardar el perfume en la base de datos.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.id);
    const marca = String(body.marca || '').trim();
    const nombre = String(body.nombre || '').trim();
    const usdt = normalizeUsdt(String(body.usdt || '').trim());
    const pesos = parseInt(body.pesos, 10);

    if (!id || !marca || !nombre || !usdt || Number.isNaN(pesos) || pesos < 0) {
      return NextResponse.json({ error: 'Datos inválidos. Marca, nombre, USDT y pesos son obligatorios.' }, { status: 400 });
    }

    const [result] = await pool.query('UPDATE PERFUMES SET MARCA = ?, NOMBRE = ?, USDT = ?, PESOS = ? WHERE id = ?', [marca, nombre, usdt, pesos, id]);
    const affectedRows = (result as any).affectedRows ?? 0;
    if (affectedRows === 0) {
      return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ id, marca, nombre, usdt, pesos });
  } catch (error) {
    console.error('Failed to update perfume:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el perfume en la base de datos.' }, { status: 500 });
  }
}
