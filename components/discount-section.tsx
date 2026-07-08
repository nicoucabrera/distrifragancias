'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, ShoppingCart, Minus } from 'lucide-react';
import { Perfume, DiscountedPerfume } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useRate } from '@/lib/rate-context';

export function DiscountSection() {
  const [discountedProducts, setDiscountedProducts] = useState<DiscountedPerfume[]>([]);
  const { addToCart } = useCart();
  const { rate } = useRate();

  useEffect(() => {
    async function loadDiscounts() {
      try {
        const response = await fetch('/api/discounted-products', { cache: 'no-store' });
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Failed to load discounts: ${response.status} ${body}`);
        }
        const saved: DiscountedPerfume[] = await response.json();
        if (Array.isArray(saved)) {
          setDiscountedProducts(saved);
        }
      } catch (error) {
        console.error('Error loading discounted products:', error);
      }
    }

    loadDiscounts();
  }, []);

  const loadValidPerfumes = async () => {
    const params = new URLSearchParams();
    params.set('minPesos', '35000');
    params.set('limit', '500');

    const response = await fetch(`/api/perfumes?${params.toString()}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load valid perfumes: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid perfume response');
    }

    return (data as Perfume[]).map((perfume) => ({
      ...perfume,
      id: perfume.id ?? `${perfume.marca}::${perfume.nombre}`,
    }));
  };

  const applyDiscount = (perfume: Perfume, discountUsdt: number, quantity: number): DiscountedPerfume => {
    const discountPesos = discountUsdt * rate;
    const originalUsdt = parseFloat(perfume.usdt.replace(',', '.'));
    const finalUsdtValue = Math.max(originalUsdt - discountUsdt, 0);
    const finalPesosValue = Math.max(perfume.pesos - discountPesos, 0);

    return {
      ...perfume,
      discountUsdt,
      discountPesos,
      finalUsdt: finalUsdtValue.toFixed(2).replace('.', ','),
      finalPesos: finalPesosValue,
      quantity,
    };
  };

  const updateDiscountQuantity = async (productId: string | number, quantity: number) => {
    const response = await fetch('/api/discounted-products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Failed to update discounted product quantity: ${response.status} ${body}`);
      return false;
    }

    return true;
  };

  const generateDiscounts = async () => {
    try {
      const validPerfumes = (await loadValidPerfumes()).filter((perfume) => perfume.pesos >= 35000);
      if (validPerfumes.length < 10) {
        throw new Error('No se encontraron suficientes productos válidos para descuento.');
      }

      const shuffled = [...validPerfumes].sort(() => Math.random() - 0.5);
      const eligible5 = shuffled.filter((perfume) => perfume.pesos >= 90000);
      const selected: Perfume[] = [];

      if (eligible5.length > 0) {
        selected.push(eligible5[0]);
      }

      const eligible4 = shuffled.filter(
        (perfume) => perfume.pesos >= 70000 && !selected.some((selectedPerfume) => selectedPerfume.marca === perfume.marca && selectedPerfume.nombre === perfume.nombre)
      );

      if (eligible4.length > 0) {
        selected.push(eligible4[0]);
      }

      const selectedKeys = new Set(selected.map((perfume) => `${perfume.marca}::${perfume.nombre}`));
      const remaining = shuffled.filter((perfume) => !selectedKeys.has(`${perfume.marca}::${perfume.nombre}`)).slice(0, 10 - selected.length);
      const finalSelection = [...selected, ...remaining].slice(0, 10);

      const discounts: number[] = finalSelection.map((perfume, index) => {
        if (index === 0 && perfume.pesos >= 90000 && eligible5.length > 0) {
          return 5;
        }
        if (index === 1 && perfume.pesos >= 70000 && eligible4.length > 0) {
          return 4;
        }
        return Math.random() < 0.5 ? 2 : 3;
      });

      const discounted: DiscountedPerfume[] = finalSelection.map((perfume, index) => {
        return applyDiscount(perfume, discounts[index], Math.floor(Math.random() * 14) + 2);
      });

      const response = await fetch('/api/discounted-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discounted),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to save discounts: ${response.status} ${body}`);
      }
      setDiscountedProducts(discounted);
    } catch (error) {
      console.error('Error generating discounted products:', error);
    }
  };

  const clearDiscounts = async () => {
    try {
      const response = await fetch('/api/discounted-products', { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to clear discounts: ${response.status} ${body}`);
      }
      setDiscountedProducts([]);
    } catch (error) {
      console.error('Error clearing discounts:', error);
    }
  };

  const handleAddToCart = (product: DiscountedPerfume) => {
    addToCart({
      id: product.id,
      marca: product.marca,
      nombre: product.nombre,
      usdt: product.finalUsdt,
      pesos: product.finalPesos,
    });
  };

  const handleDecreaseQuantity = async (product: DiscountedPerfume) => {
    if (product.quantity <= 0) {
      return;
    }

    const newQuantity = product.quantity - 1;
    const success = await updateDiscountQuantity(product.id, newQuantity);
    if (!success) {
      return;
    }

    setDiscountedProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            {discountedProducts.length > 0 ? 'Descuentos Activos' : 'Descuentos del Dia'}
          </span>
          <div className="flex gap-2">
            {discountedProducts.length > 0 && (
              <Button
                onClick={clearDiscounts}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Nuevo Sorteo
              </Button>
            )}
            <Button
              onClick={generateDiscounts}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {discountedProducts.length > 0 ? 'Rehacer Sorteo' : 'Sortear Descuentos'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {discountedProducts.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Presiona "Sortear Descuentos" para seleccionar 10 productos aleatorios con descuentos exclusivos de 2-5 USDT
          </p>
        ) : (
          <div className="grid gap-3">
            {discountedProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background rounded-lg border gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {product.marca}
                    </Badge>
                    <Badge className="bg-green-500 text-white text-xs shrink-0">
                      -{product.discountUsdt} USDT
                    </Badge>
                  </div>
                  <p className="font-medium text-sm truncate">{product.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground line-through">
                      {product.usdt} USDT / {formatPrice(product.pesos)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-600">
                        {product.finalUsdt} USDT
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatPrice(product.finalPesos)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>
                        Cantidad disponible: <span className="font-medium text-foreground">{product.quantity}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecreaseQuantity(product)}
                        disabled={product.quantity <= 0}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddToCart(product)}
                  className="gap-1 shrink-0"
                  disabled={product.quantity <= 0}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
