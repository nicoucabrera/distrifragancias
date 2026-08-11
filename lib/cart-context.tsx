'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Perfume } from '@/lib/types';
import { useRate } from '@/lib/rate-context';
import { authFetch } from '@/lib/auth-client';
import { calculatePrices, generateQuoteText, formatUsdt } from '@/lib/price-utils';

const CART_STORAGE_KEY = 'distrifragancias-cart';
const CLIENT_STORAGE_KEY = 'distrifragancias-client';

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
  const loaded = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
      const savedClient = localStorage.getItem(CLIENT_STORAGE_KEY);
      if (savedClient) {
        const parsed = JSON.parse(savedClient);
        if (parsed && typeof parsed === 'object') {
          setClientInfo(parsed);
        }
      }
    } catch {
      // localStorage unavailable or corrupted — start fresh
    }
    loaded.current = true;
  }, []);

  // Save to localStorage on every change (after initial load)
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage full or unavailable
    }
  }, [items]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(clientInfo));
    } catch {
      // localStorage full or unavailable
    }
  }, [clientInfo]);

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
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CLIENT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const toggleRetailMode = () => {
    setRetailMode(prev => !prev);
    setRetailPlusState(0);
  };

  const setRetailPlus = (plus: number) => {
    setRetailPlusState(plus);
  };

  // ── Calculations (delegates to price-utils) ────────────────

  const getPrices = () => calculatePrices(items, activeRate, retailMode ? retailPlus : 0);

  const getSubtotalPesos = () => getPrices().subtotalPesos;
  const getCommissionPesos = () => getPrices().commissionPesos;
  const getTotalPesos = () => getPrices().totalPesos;
  const getSubtotalUSDT = () => formatUsdt(getPrices().subtotalUsdt);
  const getCommissionUSDT = () => formatUsdt(getPrices().commissionUsdt);
  const getTotalUSDT = () => formatUsdt(getPrices().totalUsdt + (retailMode ? retailPlus / exchangeRate : 0));

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
      const res = await authFetch('/api/saved-quotes', {
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
      await authFetch(`/api/saved-quotes?id=${id}`, { method: 'DELETE' });
      await loadSavedQuotes();
    } catch (error) {
      console.error('Failed to delete quote:', error);
    }
  }, [loadSavedQuotes]);

  // ── Quote Text (delegates to price-utils) ──────────────────

  const getQuoteText = () => {
    return generateQuoteText(items, clientInfo, activeRate, retailMode ? retailPlus : 0);
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
