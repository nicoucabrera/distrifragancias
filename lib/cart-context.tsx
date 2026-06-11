'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Perfume } from '@/lib/types';

export interface CartItem extends Perfume {
  quantity: number;
}

export interface ClientInfo {
  nombre: string;
  tel: string;
}

const COMMISSION_RATE = 0.15; // 15% comision

interface CartContextType {
  items: CartItem[];
  clientInfo: ClientInfo;
  addToCart: (perfume: Perfume) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  setClientInfo: (info: ClientInfo) => void;
  getSubtotalPesos: () => number;
  getCommissionPesos: () => number;
  getTotalPesos: () => number;
  getSubtotalUSDT: () => string;
  getCommissionUSDT: () => string;
  getTotalUSDT: () => string;
  getQuoteText: () => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ nombre: '', tel: '' });

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

  const removeFromCart = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
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

  const getSubtotalPesos = () => {
    return items.reduce((total, item) => total + item.pesos * item.quantity, 0);
  };

  const getCommissionPesos = () => {
    return Math.round(getSubtotalPesos() * COMMISSION_RATE);
  };

  const getTotalPesos = () => {
    return getSubtotalPesos() + getCommissionPesos();
  };

  const getSubtotalUSDT = () => {
    const total = items.reduce((acc, item) => {
      const price = parseFloat(item.usdt.replace(',', '.'));
      return acc + price * item.quantity;
    }, 0);
    return total.toFixed(2).replace('.', ',');
  };

  const getCommissionUSDT = () => {
    const subtotal = items.reduce((acc, item) => {
      const price = parseFloat(item.usdt.replace(',', '.'));
      return acc + price * item.quantity;
    }, 0);
    const commission = subtotal * COMMISSION_RATE;
    return commission.toFixed(2).replace('.', ',');
  };

  const getTotalUSDT = () => {
    const subtotal = items.reduce((acc, item) => {
      const price = parseFloat(item.usdt.replace(',', '.'));
      return acc + price * item.quantity;
    }, 0);
    const total = subtotal * (1 + COMMISSION_RATE);
    return total.toFixed(2).replace('.', ',');
  };

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
    text += `SUBTOTAL: $${getSubtotalPesos().toLocaleString('es-AR')} (${getSubtotalUSDT()} USDT)\n`;
    text += `COMISION (15%): $${getCommissionPesos().toLocaleString('es-AR')} (${getCommissionUSDT()} USDT)\n`;
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
