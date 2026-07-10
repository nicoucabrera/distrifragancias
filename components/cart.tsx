'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { ShoppingCart, Minus, Plus, Trash2, Copy, Check, X, Store } from 'lucide-react';

export function Cart() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotalPesos,
    getCommissionPesos,
    getTotalPesos,
    getSubtotalUSDT,
    getCommissionUSDT,
    getTotalUSDT,
    getQuoteText,
    clientInfo,
    retailMode,
    retailPlus,
    toggleRetailMode,
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

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
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
              <div key={item.id} className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-1 text-xs">
                      {item.marca}
                    </Badge>
                    <h4 className="text-sm font-medium text-foreground leading-tight">
                      {item.nombre}
                    </h4>
                    <p className="text-sm text-primary font-semibold mt-1">
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
                    ${(item.pesos * item.quantity).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 sm:p-6 bg-secondary/30 border-t border-border">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.reduce((acc, item) => acc + item.quantity, 0)} productos)</span>
                <div className="text-right">
                  <span className="font-medium">${getSubtotalPesos().toLocaleString('es-AR')}</span>
                  <span className="text-muted-foreground text-xs ml-1">({getSubtotalUSDT()} USDT)</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comision ({retailMode ? '30%' : '15%'})</span>
                <div className="text-right">
                  <span className="font-medium text-accent">${getCommissionPesos().toLocaleString('es-AR')}</span>
                  <span className="text-muted-foreground text-xs ml-1">({getCommissionUSDT()} USDT)</span>
                </div>
              </div>
              {retailMode && retailPlus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plus</span>
                  <span className="font-medium">${retailPlus.toLocaleString('es-AR')}</span>
                </div>
              )}
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

            {/* Retail mode toggle */}
            <Button
              variant={retailMode ? 'default' : 'outline'}
              className="w-full gap-2 mt-2"
              size="lg"
              onClick={toggleRetailMode}
            >
              <Store className="w-4 h-4" />
              {retailMode ? 'Por menor (30%)' : 'Por menor'}
            </Button>

            {retailMode && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Plus $</span>
                <Input
                  type="number"
                  className="h-9 text-sm"
                  placeholder="0"
                  value={retailPlus || ''}
                  onChange={(e) => setRetailPlus(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
