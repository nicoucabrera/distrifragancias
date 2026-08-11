import { describe, it, expect } from 'vitest';
import {
  parseUsdt,
  formatUsdt,
  normalizeUsdt,
  calculatePrices,
  calculateDiscount,
  validateProductForm,
  validateDiscount,
  generateQuoteText,
} from './price-utils';

describe('parseUsdt', () => {
  it('parses comma decimal', () => {
    expect(parseUsdt('65,50')).toBe(65.5);
  });

  it('parses dot decimal', () => {
    expect(parseUsdt('65.50')).toBe(65.5);
  });

  it('returns NaN for empty string', () => {
    expect(Number.isNaN(parseUsdt(''))).toBe(true);
  });

  it('returns NaN for non-numeric', () => {
    expect(Number.isNaN(parseUsdt('abc'))).toBe(true);
  });
});

describe('formatUsdt', () => {
  it('formats with comma', () => {
    expect(formatUsdt(65.5)).toBe('65,50');
  });

  it('formats zero', () => {
    expect(formatUsdt(0)).toBe('0,00');
  });

  it('rounds to 2 decimals', () => {
    expect(formatUsdt(65.567)).toBe('65,57');
  });
});

describe('normalizeUsdt', () => {
  it('normalizes comma input', () => {
    expect(normalizeUsdt('65,5')).toBe('65,50');
  });

  it('returns empty for invalid', () => {
    expect(normalizeUsdt('abc')).toBe('');
  });
});

describe('calculatePrices', () => {
  const items = [
    { pesos: 100000, usdt: '65,50', quantity: 2 },
    { pesos: 50000, usdt: '32,00', quantity: 1 },
  ];

  it('calculates with 15% commission', () => {
    const result = calculatePrices(items, 0.15);
    expect(result.subtotalPesos).toBe(250000);
    expect(result.commissionPesos).toBe(37500);
    expect(result.totalPesos).toBe(287500);
    expect(result.subtotalUsdt).toBeCloseTo(163, 0);
  });

  it('calculates with 30% commission + retail plus', () => {
    const result = calculatePrices(items, 0.30, 5000);
    expect(result.subtotalPesos).toBe(250000);
    expect(result.commissionPesos).toBe(75000);
    expect(result.totalPesos).toBe(330000);
  });

  it('handles empty cart', () => {
    const result = calculatePrices([], 0.15);
    expect(result.totalPesos).toBe(0);
    expect(result.totalUsdt).toBe(0);
  });
});

describe('calculateDiscount', () => {
  it('calculates discount correctly', () => {
    const result = calculateDiscount('65,50', 130000, 5, 1560);
    expect(result.discountPesos).toBe(7800);
    expect(result.finalUsdt).toBe('60,50');
    expect(result.finalPesos).toBe(122200);
  });

  it('does not go below zero', () => {
    const result = calculateDiscount('2,00', 4000, 5, 1560);
    expect(result.finalUsdt).toBe('0,00');
    expect(result.finalPesos).toBe(0);
  });
});

describe('validateProductForm', () => {
  it('returns error for empty marca', () => {
    expect(validateProductForm({ marca: '', nombre: 'Test', usdt: '10', pesos: '100' })).toBe('Marca es obligatoria.');
  });

  it('returns error for empty nombre', () => {
    expect(validateProductForm({ marca: 'Test', nombre: '', usdt: '10', pesos: '100' })).toBe('Nombre es obligatorio.');
  });

  it('returns error for invalid usdt', () => {
    expect(validateProductForm({ marca: 'Test', nombre: 'Test', usdt: 'abc', pesos: '100' })).toBe('USDT inválido.');
  });

  it('returns error for invalid pesos', () => {
    expect(validateProductForm({ marca: 'Test', nombre: 'Test', usdt: '10', pesos: 'abc' })).toBe('Pesos inválidos.');
  });

  it('returns null for valid data', () => {
    expect(validateProductForm({ marca: 'Test', nombre: 'Test', usdt: '10,50', pesos: '100' })).toBeNull();
  });
});

describe('validateDiscount', () => {
  it('returns error for zero amount', () => {
    expect(validateDiscount('0', '10,00')).toBe('Ingresa un monto de descuento válido mayor a 0.');
  });

  it('returns error when discount >= price', () => {
    expect(validateDiscount('10', '10,00')).toBe('El descuento no puede ser mayor o igual al precio.');
  });

  it('returns null for valid discount', () => {
    expect(validateDiscount('3', '10,00')).toBeNull();
  });
});

describe('generateQuoteText', () => {
  const items = [
    { marca: 'Chanel', nombre: 'Bleu', usdt: '65,50', pesos: 130000, quantity: 2 },
  ];

  it('generates quote with 15% commission', () => {
    const text = generateQuoteText(items, { nombre: 'Juan', tel: '123' }, 0.15, 0);
    expect(text).toContain('DISTRIFRAGANCIAS');
    expect(text).toContain('Juan');
    expect(text).toContain('15%');
    expect(text).toContain('Bleu');
  });

  it('generates quote with 30% retail', () => {
    const text = generateQuoteText(items, { nombre: '', tel: '' }, 0.30, 5000);
    expect(text).toContain('30%');
    expect(text).toContain('Plus: $5.000');
  });
});
