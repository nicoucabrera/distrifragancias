import type {
  AccountingData,
  AccountingSummary,
  VentaCalculada,
  VentaPedido,
  VentaStock,
} from './types';

export const VICTOR_PESOS_RATE = 1500;

export function calcularVentaPedido(venta: VentaPedido): VentaCalculada {
  const ventaUsdt = venta.montoVenta / venta.tipoCambio;
  const victor10 = venta.prodUsdt * 0.1;
  const victorPesos = victor10 * VICTOR_PESOS_RATE;
  const productosPesos = venta.prodUsdt * venta.tipoCambio;
  const difeUsdt = ventaUsdt - venta.prodUsdt - victor10;
  const difePesos =
    venta.montoVenta - productosPesos - victorPesos - venta.envio;

  return {
    ventaUsdt,
    victor10,
    victorPesos,
    productosPesos,
    difeUsdt,
    difePesos,
  };
}

export function calcularVentaStock(venta: VentaStock): VentaCalculada {
  const ventaUsdt = venta.montoVenta / venta.tipoCambio;
  const victor10 = venta.productosUsdt * 0.1;
  const victorPesos = victor10 * VICTOR_PESOS_RATE;
  const productosPesos = venta.productosUsdt * venta.tipoCambio;
  const difeUsdt = ventaUsdt - venta.productosUsdt - victor10;
  const difePesos =
    venta.montoVenta - productosPesos - victorPesos - venta.envio;

  return {
    ventaUsdt,
    victor10,
    victorPesos,
    productosPesos,
    difeUsdt,
    difePesos,
  };
}

export function formatCurrency(value: number, decimals = 2): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(dateStr: string): string {
  if (dateStr === 'STOCK') return 'STOCK';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function calcularResumen(data: AccountingData): AccountingSummary {
  const totalCostos = data.costos.reduce((sum, c) => sum + c.monto, 0);

  const pedidosCalc = data.pedidos.map(calcularVentaPedido);
  const stockCalc = data.stock.map(calcularVentaStock);

  const totalPedidos = pedidosCalc.reduce((sum, c) => sum + c.difePesos, 0);
  const totalStock = stockCalc.reduce((sum, c) => sum + c.difePesos, 0);
  const retorno = totalPedidos + totalStock;

  const victorPesosPedidos = pedidosCalc.reduce(
    (sum, c) => sum + c.victorPesos,
    0,
  );
  const envioPedidos = data.pedidos.reduce((sum, p) => sum + p.envio, 0);

  const utilidadBruta = retorno + victorPesosPedidos + envioPedidos;
  const utilidadOperativa = utilidadBruta - victorPesosPedidos - envioPedidos;
  const utilidadNeta = utilidadOperativa - totalCostos;

  let nicoStock = 0;
  let gabiStock = 0;
  data.stock.forEach((venta, i) => {
    const difePesos = stockCalc[i].difePesos;
    if (venta.detalle === 'NICO') nicoStock += difePesos;
    else if (venta.detalle === 'GABI') gabiStock += difePesos;
  });

  return {
    totalCostos,
    retorno,
    diferencia: retorno - totalCostos,
    utilidadBruta,
    utilidadOperativa,
    utilidadNeta,
    totalPedidos,
    totalStock,
    nicoStock,
    gabiStock,
    victorPesosPedidos,
    envioPedidos,
  };
}
