export type StockDetalle = 'NICO' | 'GABI' | 'VENDIDO' | null;

export interface CostoItem {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
}

export interface VentaPedido {
  id: string;
  fecha: string;
  cliente: string;
  montoVenta: number;
  tipoCambio: number;
  prodUsdt: number;
  envio: number;
}

export interface VentaStock {
  id: string;
  cliente: string;
  montoVenta: number;
  tipoCambio: number;
  productosUsdt: number;
  envio: number;
  detalle: StockDetalle;
}

export interface VentaCalculada {
  ventaUsdt: number;
  victor10: number;
  victorPesos: number;
  productosPesos: number;
  difeUsdt: number;
  difePesos: number;
}

export interface AccountingSummary {
  totalCostos: number;
  retorno: number;
  diferencia: number;
  utilidadBruta: number;
  utilidadOperativa: number;
  utilidadNeta: number;
  totalPedidos: number;
  totalStock: number;
  nicoStock: number;
  gabiStock: number;
  victorPesosPedidos: number;
  envioPedidos: number;
}

export interface AccountingData {
  costos: CostoItem[];
  pedidos: VentaPedido[];
  stock: VentaStock[];
}
