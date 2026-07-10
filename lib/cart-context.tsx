'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Perfume } from '@/lib/types';
import { useRate } from '@/lib/rate-context';

export interface CartItem extends Perfume {
  quantity: number;
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

const COMMISSION_RATE = 0.15;
const RETAIL_RATE = 0.30;

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
  getTotalPesos: () => number;
  getSubtotalUSDT: () => string;
  getTotalUSDT: () => string;
  getQuoteText: () => string;
  // Saved quotes
  savedQuotes: SavedQuote[];
  loadSavedQuotes: () => Promise<void>;
  saveCurrentQuote: () => Promise<boolean>;
  loadQuote: (quote: SavedQuote) => void;
  deleteQuote: (id: number) => Promise<void>;
  // Retail mode (global)
  retailMode: boolean;
  retailPlus: number;
  toggleRetailMode: () => void;
  setRetailPlus: (plus: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { rate: exchangeRate } = useRate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ nombre: '', tel: '' });
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [retailMode, setRetailMode] = useState(false);
  const [retailPlus, setRetailPlusState] = useState(0);

  const activeRate = retailMode ? RETAIL_RATE : COMMISSION_RATE;

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
    setItems(prev => {
      const next = prev.filter(item => item.id !== id);
      if (next.length === 0) {
        setRetailMode(false);
        setRetailPlusState(0);
      }
      return next;
    });
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
    setRetailMode(false);
    setRetailPlusState(0);
  };

  const toggleRetailMode = () => {
    setRetailMode(prev => !prev);
    setRetailPlusState(0);
  };

  const setRetailPlus = (plus: number) => {
    setRetailPlusState(plus);
  };

  // ── Calculations ──────────────────────────────────────────

  const getSubtotalPesos = () => {
    const base = items.reduce((total, item) => total + item.pesos * item.quantity, 0);
    return base;
  };

  const getTotalPesos = () => {
    const base = items.reduce((total, item) => total + item.pesos * item.quantity, 0);
    const commission = Math.round(base * activeRate);
    return base + commission + (retailMode ? retailPlus : 0);
  };

  const getSubtotalUSDT = () => {
    const baseUsdt = items.reduce((acc, item) => {
      const price = parseFloat(item.usdt.replace(',', '.'));
      return acc + price * item.quantity;
    }, 0);
    const total = baseUsdt * (1 + activeRate) + (retailMode ? retailPlus / exchangeRate : 0);
    return total.toFixed(2).replace('.', ',');
  };

  const getTotalUSDT = () => {
    const baseUsdt = items.reduce((acc, item) => {
      const price = parseFloat(item.usdt.replace(',', '.'));
      return acc + price * item.quantity;
    }, 0);
    const total = baseUsdt * (1 + activeRate) + (retailMode ? retailPlus / exchangeRate : 0);
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

  // ── Quote Text ────────────────────────────────────────────

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
      const subtotalPesos = item.pesos * item.quantity;
      const subtotalUsdt = (parseFloat(item.usdt.replace(',', '.')) * item.quantity).toFixed(2).replace('.', ',');
      text += `${index + 1}. ${item.marca}\n`;
      text += `   ${item.nombre}\n`;
      text += `   Cant: ${item.quantity} x $${item.pesos.toLocaleString('es-AR')}\n`;
      text += `   Subtotal: $${subtotalPesos.toLocaleString('es-AR')} (${subtotalUsdt} USDT)\n\n`;
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
        getTotalPesos,
        getSubtotalUSDT,
        getTotalUSDT,
        getQuoteText,
        savedQuotes,
        loadSavedQuotes,
        saveCurrentQuote,
        loadQuote,
        deleteQuote,
        retailMode,
        retailPlus,
        toggleRetailMode,
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
