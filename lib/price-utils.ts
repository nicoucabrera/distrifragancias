/**
 * Pure business logic for price calculations, formatting, and validation.
 * No side effects — fully testable.
 */

// ── USDT Parsing & Formatting ────────────────────────────────

/**
 * Parse a USDT string (e.g. "65,50" or "65.50") to a float.
 * Returns NaN if invalid.
 */
export function parseUsdt(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

/**
 * Format a float as a USDT string with comma decimal separator (e.g. 65.5 -> "65,50").
 */
export function formatUsdt(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/**
 * Parse a USDT string and return formatted, or empty string if invalid.
 */
export function normalizeUsdt(value: string): string {
  const parsed = parseUsdt(value);
  if (Number.isNaN(parsed)) return '';
  return formatUsdt(parsed);
}

// ── Price Calculations ───────────────────────────────────────

export interface PriceBreakdown {
  subtotalPesos: number;
  commissionPesos: number;
  totalPesos: number;
  subtotalUsdt: number;
  commissionUsdt: number;
  totalUsdt: number;
}

/**
 * Calculate the full price breakdown for a set of cart items.
 */
export function calculatePrices(
  items: Array<{ pesos: number; usdt: string; quantity: number }>,
  commissionRate: number,
  retailPlusPesos: number = 0,
): PriceBreakdown {
  const subtotalPesos = items.reduce(
    (total, item) => total + item.pesos * item.quantity,
    0,
  );
  const commissionPesos = Math.round(subtotalPesos * commissionRate);
  const totalPesos = subtotalPesos + commissionPesos + retailPlusPesos;

  const subtotalUsdt = items.reduce(
    (acc, item) => acc + parseUsdt(item.usdt) * item.quantity,
    0,
  );
  const commissionUsdt = subtotalUsdt * commissionRate;
  const totalUsdt = subtotalUsdt * (1 + commissionRate);

  return {
    subtotalPesos,
    commissionPesos,
    totalPesos,
    subtotalUsdt,
    commissionUsdt,
    totalUsdt,
  };
}

// ── Discount Calculations ────────────────────────────────────

export interface DiscountResult {
  discountPesos: number;
  finalUsdt: string;
  finalPesos: number;
}

/**
 * Calculate discount amounts for a product.
 */
export function calculateDiscount(
  originalUsdt: string,
  originalPesos: number,
  discountUsdt: number,
  exchangeRate: number,
): DiscountResult {
  const discountPesos = discountUsdt * exchangeRate;
  const finalUsdt = Math.max(parseUsdt(originalUsdt) - discountUsdt, 0);
  const finalPesos = Math.max(originalPesos - discountPesos, 0);

  return {
    discountPesos,
    finalUsdt: formatUsdt(finalUsdt),
    finalPesos,
  };
}

// ── Validation ───────────────────────────────────────────────

export interface ProductFormData {
  marca: string;
  nombre: string;
  usdt: string;
  pesos: string;
}

/**
 * Validate product form fields. Returns error message or null if valid.
 */
export function validateProductForm(form: ProductFormData): string | null {
  if (!form.marca.trim()) return 'Marca es obligatoria.';
  if (!form.nombre.trim()) return 'Nombre es obligatorio.';

  const parsedUsdt = parseUsdt(form.usdt);
  if (Number.isNaN(parsedUsdt) || parsedUsdt < 0) return 'USDT inválido.';

  const pesosValue = parseInt(form.pesos, 10);
  if (Number.isNaN(pesosValue) || pesosValue < 0) return 'Pesos inválidos.';

  return null;
}

/**
 * Validate discount form. Returns error message or null if valid.
 */
export function validateDiscount(
  discountAmount: string,
  originalUsdt: string,
): string | null {
  const amount = parseUsdt(discountAmount);
  if (Number.isNaN(amount) || amount <= 0) {
    return 'Ingresa un monto de descuento válido mayor a 0.';
  }

  const original = parseUsdt(originalUsdt);
  if (amount >= original) {
    return 'El descuento no puede ser mayor o igual al precio.';
  }

  return null;
}

// ── Quote Text ───────────────────────────────────────────────

export interface QuoteItem {
  marca: string;
  nombre: string;
  usdt: string;
  pesos: number;
  quantity: number;
}

/**
 * Generate the plain-text quote for copy/paste.
 */
export function generateQuoteText(
  items: QuoteItem[],
  clientInfo: { nombre: string; tel: string },
  commissionRate: number,
  retailPlusPesos: number,
): string {
  const prices = calculatePrices(items, commissionRate, retailPlusPesos);
  const date = new Date().toLocaleDateString('es-AR');
  const ratePercent = commissionRate === 0.30 ? '30%' : '15%';

  let text = `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `DISTRIFRAGANCIAS\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Fecha: ${date}\n`;

  if (clientInfo.nombre || clientInfo.tel) {
    text += `\nDATOS DEL CLIENTE:\n`;
    if (clientInfo.nombre) text += `   Nombre: ${clientInfo.nombre}\n`;
    if (clientInfo.tel) text += `   Tel: ${clientInfo.tel}\n`;
  }

  text += `\nDETALLE DEL PEDIDO:\n`;
  text += `────────────────────────\n`;

  items.forEach((item, index) => {
    const subtotalPesos = item.pesos * item.quantity;
    const subtotalUsdt = formatUsdt(parseUsdt(item.usdt) * item.quantity);
    text += `${index + 1}. ${item.marca}\n`;
    text += `   ${item.nombre}\n`;
    text += `   Cant: ${item.quantity} x $${item.pesos.toLocaleString('es-AR')}\n`;
    text += `   Subtotal: $${subtotalPesos.toLocaleString('es-AR')} (${subtotalUsdt} USDT)\n\n`;
  });

  text += `────────────────────────\n`;
  text += `Subtotal: $${prices.subtotalPesos.toLocaleString('es-AR')} (${formatUsdt(prices.subtotalUsdt)} USDT)\n`;
  text += `Comisión (${ratePercent}): $${prices.commissionPesos.toLocaleString('es-AR')} (${formatUsdt(prices.commissionUsdt)} USDT)\n`;
  if (retailPlusPesos > 0) {
    text += `Plus: $${retailPlusPesos.toLocaleString('es-AR')}\n`;
  }
  text += `────────────────────────\n`;
  text += `TOTAL: $${prices.totalPesos.toLocaleString('es-AR')}\n`;
  text += `TOTAL USDT: ${formatUsdt(prices.totalUsdt)}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Gracias por su compra!\n`;

  return text;
}
