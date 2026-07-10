'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { ShoppingCart, Minus, Plus, Trash2, Copy, Check, X, Store, Package } from 'lucide-react';

export function Cart() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotalPesos,
    getTotalPesos,
    getSubtotalUSDT,
    getTotalUSDT,
    getQuoteText,
    clientInfo,
    setRetailMode,
    setRetailPlus,
  } = useCart();
  const [copied, setCopied] = useState(false);

  const handleCopyQuote = async () => {
    const text = getQuoteText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getItemTotal = (item: typeof items[0]) => {
    const rate = item.retailMode ? 0.30 : 0.15;
    const base = item.pesos * item.quantity;
    return base + Math.round(base * rate) + (item.retailPlus || 0);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Carrito
            {items.length > 0 && (
              <Badge className="ml-2">{items.reduce((acc, item) => acc + item.quantity, 0)}</Badge>
            )}
          </h2>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              Vaciar
            </Button>
          )}
        </div>
        
        {clientInfo.nombre && (
          <p className="text-sm text-muted-foreground mt-2">
            Cliente: <span className="font-medium text-foreground">{clientInfo.nombre}</span>
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>El carrito esta vacio</p>
          <p className="text-sm mt-1">Agregue productos desde el buscador</p>
        </div>
      ) : (
        <>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
            {items.map(item => (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-1 text-xs">
                      {item.marca}
                    </Badge>
                    <h4 className="text-sm font-medium text-foreground leading-tight">
                      {item.nombre}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${item.pesos.toLocaleString('es-AR')} c/u
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Quantity + Price */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="font-semibold text-foreground">
                    ${getItemTotal(item).toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Retail mode toggle */}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant={item.retailMode ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setRetailMode(item.id, !item.retailMode)}
                  >
                    {item.retailMode ? (
                      <><Store className="w-3 h-3" /> Minorista (30%)</>
                    ) : (
                      <><Package className="w-3 h-3" /> Mayoreo (15%)</>
                    )}
                  </Button>
                </div>

                {/* Retail plus input */}
                {item.retailMode && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Plus $</span>
                    <Input
                      type="number"
                      className="h-7 w-28 text-xs"
                      placeholder="0"
                      value={item.retailPlus || ''}
                      onChange={(e) => setRetailPlus(item.id, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-6 bg-secondary/30 border-t border-border">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total ({items.reduce((acc, item) => acc + item.quantity, 0)} productos)</span>
                <div className="text-right">
                  <span className="font-medium">${getSubtotalPesos().toLocaleString('es-AR')}</span>
                  <span className="text-muted-foreground text-xs ml-1">({getSubtotalUSDT()} USDT)</span>
                </div>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-lg">Total</span>
                  <div className="text-right">
                    <p className="font-bold text-xl text-primary">${getTotalPesos().toLocaleString('es-AR')}</p>
                    <p className="text-sm text-muted-foreground">{getTotalUSDT()} USDT</p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleCopyQuote}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Presupuesto
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
