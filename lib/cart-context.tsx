'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Perfume } from '@/lib/types';
import { useRate } from '@/lib/rate-context';

export interface CartItem extends Perfume {
  quantity: number;
  retailMode?: boolean;
  retailPlus?: number;
}

export interface ClientInfo {
  nombre: string;
  tel: string;
}

export interface SavedQuote {
  id: number;
  clientName: string;
  clientTel: string;
  items: CartItem[];
  createdAt: string;
}

  const COMMISSION_RATE = 0.15; // 15% comision mayoreo
  const RETAIL_RATE = 0.30; // 30% comision minorista

interface CartContextType {
  items: CartItem[];
  clientInfo: ClientInfo;
  addToCart: (perfume: Perfume) => void;
  updateProduct: (perfume: Perfume) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  setClientInfo: (info: ClientInfo) => void;
  getSubtotalPesos: () => number;
  getCommissionPesos: () => number;
  getTotalPesos: () => number;
  getSubtotalUSDT: () => string;
  getCommissionUSDT: () => string;
  getTotalUSDT: () => string;
  getQuoteText: () => string;
  // Saved quotes
  savedQuotes: SavedQuote[];
  loadSavedQuotes: () => Promise<void>;
  saveCurrentQuote: () => Promise<boolean>;
  loadQuote: (quote: SavedQuote) => void;
  deleteQuote: (id: number) => Promise<void>;
  // Retail mode
  setRetailMode: (id: string | number, enabled: boolean) => void;
  setRetailPlus: (id: string | number, plus: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { rate } = useRate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ nombre: '', tel: '' });
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);

  const addToCart = (perfume: Perfume) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === perfume.id);
      if (existing) {
        return prev.map(item =>
          item.id === perfume.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...perfume, quantity: 1 }];
    });
  };

  const updateProduct = (perfume: Perfume) => {
    setItems(prev =>
      prev.map(item => (item.id === perfume.id ? { ...item, ...perfume } : item))
    );
  };

  const removeFromCart = (id: string | number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemRate = (item: CartItem) =>
    item.retailMode ? RETAIL_RATE : COMMISSION_RATE;

  const getItemTotalPesos = (item: CartItem) => {
    const base = item.pesos * item.quantity;
    const commission = base * getItemRate(item);
    return base + commission + (item.retailPlus || 0);
  };

  const getSubtotalPesos = () => {
    return items.reduce((total, item) => total + getItemTotalPesos(item), 0);
  };

  const getCommissionPesos = () => {
    return items.reduce((total, item) => {
      const base = item.pesos * item.quantity;
      return total + Math.round(base * getItemRate(item));
    }, 0);
  };

  const getTotalPesos = () => {
    return items.reduce((total, item) => total + getItemTotalPesos(item), 0);
  };

  const getSubtotalUSDT = () => {
    const total = items.reduce((acc, item) => {
      const price = parseFloat(item.usdt.replace(',', '.'));
      const base = price * item.quantity;
      const rate = getItemRate(item);
      const plusPesos = item.retailPlus || 0;
      const plusUsdt = plusPesos / rate;
      return acc + base * (1 + rate) + plusUsdt;
    }, 0);
    return total.toFixed(2).replace('.', ',');
  };

  const getCommissionUSDT = () => {
    const total = items.reduce((acc, item) => {
      const price = parseFloat(item.usdt.replace(',', '.'));
      const base = price * item.quantity;
      return acc + base * getItemRate(item);
    }, 0);
    return total.toFixed(2).replace('.', ',');
  };

  const getTotalUSDT = () => {
    const total = items.reduce((acc, item) => {
      const price = parseFloat(item.usdt.replace(',', '.'));
      const base = price * item.quantity;
      const rate = getItemRate(item);
      const plusPesos = item.retailPlus || 0;
      const plusUsdt = plusPesos / rate;
      return acc + base * (1 + rate) + plusUsdt;
    }, 0);
    return total.toFixed(2).replace('.', ',');
  };

  // ── Saved Quotes ──────────────────────────────────────────

  const loadSavedQuotes = useCallback(async () => {
    try {
      const res = await fetch('/api/saved-quotes');
      if (res.ok) {
        const data = await res.json();
        setSavedQuotes(data);
      }
    } catch (error) {
      console.error('Failed to load saved quotes:', error);
    }
  }, []);

  const saveCurrentQuote = useCallback(async (): Promise<boolean> => {
    if (items.length === 0) return false;
    const name = clientInfo.nombre || 'Sin nombre';
    try {
      const res = await fetch('/api/saved-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: name,
          clientTel: clientInfo.tel,
          items,
        }),
      });
      if (res.ok) {
        await loadSavedQuotes();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save quote:', error);
      return false;
    }
  }, [items, clientInfo, loadSavedQuotes]);

  const loadQuote = useCallback((quote: SavedQuote) => {
    setItems(quote.items);
    setClientInfo({ nombre: quote.clientName, tel: quote.clientTel });
  }, []);

  const deleteQuote = useCallback(async (id: number) => {
    try {
      await fetch(`/api/saved-quotes?id=${id}`, { method: 'DELETE' });
      await loadSavedQuotes();
    } catch (error) {
      console.error('Failed to delete quote:', error);
    }
  }, [loadSavedQuotes]);

  // ── Retail Mode ───────────────────────────────────────────

  const setRetailMode = (id: string | number, enabled: boolean) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, retailMode: enabled, retailPlus: 0 } : item
      )
    );
  };

  const setRetailPlus = (id: string | number, plus: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, retailPlus: plus } : item
      )
    );
  };

  // ── Calculations ──────────────────────────────────────────

  const getQuoteText = () => {
    const date = new Date().toLocaleDateString('es-AR');
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
      const rate = getItemRate(item);
      const rateLabel = rate === RETAIL_RATE ? 'Minorista' : 'Mayoreo';
      const base = item.pesos * item.quantity;
      const commission = Math.round(base * rate);
      const plus = item.retailPlus || 0;
      const itemTotal = base + commission + plus;
      const subtotalUsdt = (parseFloat(item.usdt.replace(',', '.')) * item.quantity * (1 + rate) + plus / rate).toFixed(2).replace('.', ',');
      text += `${index + 1}. ${item.marca}\n`;
      text += `   ${item.nombre}\n`;
      text += `   Cant: ${item.quantity} x $${item.pesos.toLocaleString('es-AR')}\n`;
      text += `   Modo: ${rateLabel} (${Math.round(rate * 100)}%)\n`;
      if (plus > 0) text += `   Plus: $${plus.toLocaleString('es-AR')}\n`;
      text += `   Subtotal: $${itemTotal.toLocaleString('es-AR')} (${subtotalUsdt} USDT)\n\n`;
    });
    
    text += `────────────────────────\n`;
    text += `TOTAL: $${getTotalPesos().toLocaleString('es-AR')}\n`;
    text += `TOTAL USDT: ${getTotalUSDT()}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Gracias por su compra!\n`;
    
    return text;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        clientInfo,
        addToCart,
        updateProduct,
        removeFromCart,
        updateQuantity,
        clearCart,
        setClientInfo,
        getSubtotalPesos,
        getCommissionPesos,
        getTotalPesos,
        getSubtotalUSDT,
        getCommissionUSDT,
        getTotalUSDT,
        getQuoteText,
        savedQuotes,
        loadSavedQuotes,
        saveCurrentQuote,
        loadQuote,
        deleteQuote,
        setRetailMode,
        setRetailPlus,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
