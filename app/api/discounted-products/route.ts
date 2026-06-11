import { NextResponse } from 'next/server';
import { pool, ensureWinnersTable } from '@/lib/db';

export async function GET() {
  try {
    await ensureWinnersTable();

    const [rows] = await pool.query(`
      SELECT 
        product_id as id,
        marca,
        nombre,
        usdt,
        pesos,
        discount_usdt as discountUsdt,
        discount_pesos as discountPesos,
        final_usdt as finalUsdt,
        final_pesos as finalPesos,
        quantity
      FROM discounted_winners
      ORDER BY created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET ERROR:', error);

    return NextResponse.json(
      { error: 'Failed to load discounted products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureWinnersTable();

    const products = await req.json();

    // borrar ganadores anteriores
    await pool.query('DELETE FROM discounted_winners');

    // insertar nuevos
    for (const product of products) {
      await pool.query(
        `
        INSERT INTO discounted_winners (
          product_id,
          marca,
          nombre,
          usdt,
          pesos,
          discount_usdt,
          discount_pesos,
          final_usdt,
          final_pesos,
          quantity
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          product.id?.toString(),
          product.marca,
          product.nombre,
          product.usdt,
          product.pesos,
          product.discountUsdt,
          product.discountPesos,
          product.finalUsdt,
          product.finalPesos,
          product.quantity ?? 0,
        ]
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('POST ERROR:', error);

    return NextResponse.json(
      { error: 'Failed to save discounted products' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureWinnersTable();

    const body = await req.json();
    const productId = body.productId?.toString();
    const quantity = Number(body.quantity ?? -1);

    if (!productId || quantity < 0) {
      return NextResponse.json(
        { error: 'Invalid product or quantity' },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      'UPDATE discounted_winners SET quantity = ? WHERE product_id = ?',
      [quantity, productId]
    );

    return NextResponse.json({
      success: true,
      updated: (result as any).affectedRows,
    });
  } catch (error) {
    console.error('PATCH ERROR:', error);

    return NextResponse.json(
      { error: 'Failed to update discounted product quantity' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await ensureWinnersTable();

    await pool.query('DELETE FROM discounted_winners');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('DELETE ERROR:', error);

    return NextResponse.json(
      { error: 'Failed to clear discounted products' },
      { status: 500 }
    );
  }
}