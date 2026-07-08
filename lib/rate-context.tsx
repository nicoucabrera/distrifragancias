'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const DEFAULT_RATE = 1560;
const STORAGE_KEY = 'distrifragancias-exchange-rate';

interface RateContextType {
  rate: number;
  setRate: (rate: number) => void;
}

const RateContext = createContext<RateContextType | undefined>(undefined);

export function RateProvider({ children }: { children: ReactNode }) {
  const [rate, setRateState] = useState<number>(DEFAULT_RATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = parseFloat(stored);
        if (!Number.isNaN(parsed) && parsed > 0) {
          setRateState(parsed);
        }
      }
    } catch {
      // localStorage unavailable — use default
    }
    setLoaded(true);
  }, []);

  const setRate = (newRate: number) => {
    if (newRate > 0) {
      setRateState(newRate);
      try {
        localStorage.setItem(STORAGE_KEY, String(newRate));
      } catch {
        // localStorage unavailable
      }
    }
  };

  return (
    <RateContext.Provider value={{ rate, setRate }}>
      {children}
    </RateContext.Provider>
  );
}

export function useRate() {
  const context = useContext(RateContext);
  if (!context) {
    throw new Error('useRate must be used within a RateProvider');
  }
  return context;
}
