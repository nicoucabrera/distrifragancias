'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, ShoppingCart } from 'lucide-react';
import { perfumes, Perfume } from '@/lib/perfumes-data';
import { useCart } from '@/lib/cart-context';

export interface DiscountedPerfume extends Perfume {
  discountUsdt: number;
  discountPesos: number;
  finalUsdt: string;
  finalPesos: number;
}

export function DiscountSection() {
  const [discountedProducts, setDiscountedProducts] = useState<DiscountedPerfume[]>([]);
  const [serverLoaded, setServerLoaded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadDiscounts() {
      try {
        const response = await fetch('/api/discounted-products', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load discounts');
        }
        const saved: DiscountedPerfume[] = await response.json();
        if (Array.isArray(saved) && saved.length > 0) {
          setDiscountedProducts(saved);
        }
      } catch (error) {
        console.error('Error loading discounted products:', error);
      } finally {
        setServerLoaded(true);
      }
    }

    loadDiscounts();
  }, []);

  useEffect(() => {
    if (!serverLoaded || discountedProducts.length === 0) {
      return;
    }

    async function saveDiscounts() {
      try {
        await fetch('/api/discounted-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discountedProducts),
        });
      } catch (error) {
        console.error('Error syncing discounted products:', error);
      }
    }

    saveDiscounts();
  }, [discountedProducts, serverLoaded]);

  const generateDiscounts = () => {
    // Filter out products with empty or invalid prices and those below the minimum thresholds
    const validPerfumes = perfumes.filter(p => {
      const usdtValue = parseFloat(p.usdt.replace(',', '.'));
      return (
        !isNaN(usdtValue) &&
        usdtValue >= 20 &&
        p.pesos >= 30000
      );
    });

    // Shuffle and pick 10 random products
    const shuffled = [...validPerfumes].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    const applyDiscount = (perfume: Perfume, discountUsdt: number): DiscountedPerfume => {
      const discountPesos = discountUsdt * 1500;
      const originalUsdt = parseFloat(perfume.usdt.replace(',', '.'));
      const finalUsdtValue = Math.max(originalUsdt - discountUsdt, 0);
      const finalPesosValue = Math.max(perfume.pesos - discountPesos, 0);

      return {
        ...perfume,
        discountUsdt,
        discountPesos,
        finalUsdt: finalUsdtValue.toFixed(2).replace('.', ','),
        finalPesos: finalPesosValue,
      };
    };

    const discountValues = [5, 4, ...Array.from({ length: 8 }, () => Math.floor(Math.random() * 2) + 2)];
    const shuffledDiscounts = discountValues.sort(() => Math.random() - 0.5);

    const discounted: DiscountedPerfume[] = selected.map((perfume, index) => {
      return applyDiscount(perfume, shuffledDiscounts[index]);
    });

    setDiscountedProducts(discounted);
  };

  const clearDiscounts = async () => {
    try {
      await fetch('/api/discounted-products', { method: 'DELETE' });
    } catch (error) {
      console.error('Error clearing discounts:', error);
    }

    setDiscountedProducts([]);
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
              disabled={discountedProducts.length > 0}
            >
              <RefreshCw className="h-4 w-4" />
              {discountedProducts.length > 0 ? 'Sorteo Activo' : 'Sortear Descuentos'}
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-600">
                      {product.finalUsdt} USDT
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatPrice(product.finalPesos)}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddToCart(product)}
                  className="gap-1 shrink-0"
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
