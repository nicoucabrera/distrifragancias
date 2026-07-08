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
        quantity,
        is_manual as isManual
      FROM discounted_winners
      ORDER BY is_manual ASC, created_at DESC
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

    const body = await req.json();

    // Manual discount: add a single product to daily discounts
    if (body.manual === true) {
      const product = body.product;
      if (!product?.id || !product?.discountUsdt) {
        return NextResponse.json(
          { error: 'Missing product or discountUsdt for manual discount' },
          { status: 400 }
        );
      }

      // Check if this product already has a discount (manual or lottery)
      const [existing] = await pool.query(
        'SELECT id FROM discounted_winners WHERE product_id = ?',
        [product.id.toString()]
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json(
          { error: 'Este producto ya tiene un descuento activo' },
          { status: 409 }
        );
      }

      const discountUsdt = parseFloat(product.discountUsdt);
      const discountPesos = product.discountPesos ?? 0;
      const finalUsdt = product.finalUsdt ?? '0';
      const finalPesos = product.finalPesos ?? 0;

      await pool.query(
        `
        INSERT INTO discounted_winners (
          product_id, marca, nombre, usdt, pesos,
          discount_usdt, discount_pesos, final_usdt, final_pesos,
          quantity, is_manual
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `,
        [
          product.id.toString(),
          product.marca,
          product.nombre,
          product.usdt,
          product.pesos,
          discountUsdt,
          discountPesos,
          finalUsdt,
          finalPesos,
          product.quantity ?? 1,
        ]
      );

      return NextResponse.json({ success: true, manual: true });
    }

    // Lottery mode: delete only lottery discounts, preserve manual ones
    await pool.query('DELETE FROM discounted_winners WHERE is_manual = FALSE');

    // Insert new lottery winners
    for (const product of body) {
      await pool.query(
        `
        INSERT INTO discounted_winners (
          product_id, marca, nombre, usdt, pesos,
          discount_usdt, discount_pesos, final_usdt, final_pesos,
          quantity, is_manual
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
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

    return NextResponse.json({ success: true });
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

export async function DELETE(req: Request) {
  try {
    await ensureWinnersTable();

    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    const allParam = url.searchParams.get('all');

    if (productId) {
      // Delete a specific product by ID
      await pool.query('DELETE FROM discounted_winners WHERE product_id = ?', [productId]);
    } else if (allParam === 'true') {
      // Delete everything (lottery + manual)
      await pool.query('DELETE FROM discounted_winners');
    } else {
      // Default: delete only manual discounts (preserves lottery)
      await pool.query('DELETE FROM discounted_winners WHERE is_manual = TRUE');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE ERROR:', error);

    return NextResponse.json(
      { error: 'Failed to delete discounted products' },
      { status: 500 }
    );
  }
}
