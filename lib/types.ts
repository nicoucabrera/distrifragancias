export interface Perfume {
  id: string | number;
  marca: string;
  nombre: string;
  usdt: string;
  pesos: number;
}

export interface DiscountedPerfume extends Perfume {
  discountUsdt: number;
  discountPesos: number;
  finalUsdt: string;
  finalPesos: number;
}
