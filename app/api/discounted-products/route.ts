import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureWinnersTable } from '@/lib/db';

export async function GET() {
  try {
    await ensureWinnersTable();
    const [rows] = await pool.query(
      `SELECT
         product_id AS id,
         marca,
         nombre,
         usdt,
         pesos,
         discount_usdt AS discountUsdt,
         discount_pesos AS discountPesos,
         final_usdt AS finalUsdt,
         final_pesos AS finalPesos
       FROM discounted_winners
       ORDER BY id ASC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error loading discounted products from database:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    await ensureWinnersTable();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query('TRUNCATE TABLE discounted_winners');

      if (body.length > 0) {
        const values = body.map((product: any) => [
          product.id,
          product.marca,
          product.nombre,
          product.usdt,
          product.pesos,
          product.discountUsdt,
          product.discountPesos,
          product.finalUsdt,
          product.finalPesos,
        ]);

        await connection.query(
          `INSERT INTO discounted_winners
           (product_id, marca, nombre, usdt, pesos, discount_usdt, discount_pesos, final_usdt, final_pesos)
           VALUES ?`,
          [values]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving discounted products to database:', error);
    return NextResponse.json({ ok: false, error: 'Unable to save discounts' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await ensureWinnersTable();
    await pool.query('TRUNCATE TABLE discounted_winners');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error clearing discounts from database:', error);
    return NextResponse.json({ ok: false, error: 'Unable to clear discounts' }, { status: 500 });
  }
}
